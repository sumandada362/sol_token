#!/usr/bin/env bash
#
# Solana Token — idempotent, self-configuring production provisioner.
#
#   ./scripts/vps-bootstrap.sh          (run from the repo root on the VPS)
#
# What it guarantees:
#   • Checks ALL required API keys first — if any are missing it stops and tells
#     you which, changing nothing.
#   • Installs each dependency (Node, pnpm, pm2, PostgreSQL, Redis, nginx) ONLY
#     if it isn't already there.
#   • Runs ISOLATED pieces for this app and never disturbs anything already
#     running on the server:
#       - Postgres: adds only this app's role+db, locked so no other role can
#         connect to it (existing databases/connections untouched, no restart).
#       - Redis: a DEDICATED instance (own port + password + data dir + systemd
#         unit). Any Redis used by other apps is left exactly as-is.
#       - pm2: a new named process ('solana-token'); your other pm2 apps are untouched.
#       - nginx: adds only this app's vhost; never removes/edits other sites.
#   • Safe to run any time — it reconfigures only what's missing and converges.
#
set -euo pipefail
cd "$(dirname "$0")/.."

green(){ printf '\033[32m%s\033[0m\n' "$*"; }
info(){  printf '\033[36m▶ %s\033[0m\n' "$*"; }
warn(){  printf '\033[33m%s\033[0m\n' "$*"; }
red(){   printf '\033[31m%s\033[0m\n' "$*"; }
have(){  command -v "$1" >/dev/null 2>&1; }

ENV_FILE=.env.local
[ -f "$ENV_FILE" ] || { red "Missing $ENV_FILE — run:  cp .env.mainnet.example .env.local  then fill it in (see deploy.md Part 1)."; exit 1; }
getenv(){ grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | sed 's/[[:space:]]*$//'; }

# ── STEP 1 — Check required API keys FIRST (nothing is changed if any missing) ──
# DATABASE_URL / REDIS_URL are provisioned by this script, so they are NOT required here.
info "Step 1/6 — checking required API keys in $ENV_FILE"
PLACEHOLDER_RE='YOUR_|your-domain|your-rpc-provider|PUBLIC_TIER_KEY|CHANGE_ME|STRONG_PASSWORD|paste-'
REQUIRED_KEYS=(SOLANA_RPC_URL NEXT_PUBLIC_RPC_URL NEXT_PUBLIC_SOLANA_NETWORK NEXT_PUBLIC_APP_URL FEE_WALLET_ADDRESS PINATA_JWT HELIUS_API_KEY WEBHOOK_AUTH_SECRET CRON_SECRET)
missing=()
for k in "${REQUIRED_KEYS[@]}"; do
  v="$(getenv "$k")"
  if [ -z "$v" ] || echo "$v" | grep -Eq "$PLACEHOLDER_RE"; then missing+=("$k"); fi
done
if [ "${#missing[@]}" -gt 0 ]; then
  red "Cannot continue — these values are still missing/placeholder in $ENV_FILE:"
  for k in "${missing[@]}"; do red "    • $k"; done
  red "Fill them in (deploy.md Part 1) and re-run. Nothing was changed."
  exit 1
fi
green "✓ All required API keys present"

DOMAIN_URL="$(getenv NEXT_PUBLIC_APP_URL)"; DOMAIN="${DOMAIN_URL#http*://}"; DOMAIN="${DOMAIN%/}"
[ -n "$DOMAIN" ] && [ "$DOMAIN" != "your-domain.com" ] || { red "Set NEXT_PUBLIC_APP_URL to your real https domain first."; exit 1; }

# write a provisioned value into .env.local only if it's still a placeholder
setenv_if_needed(){ # key value
  local key="$1" val="$2" cur; cur="$(getenv "$key" || true)"
  if [ -z "$cur" ] || echo "$cur" | grep -Eq 'STRONG_PASSWORD|CHANGE_ME|user:password@host|YOUR_'; then
    if grep -qE "^$key=" "$ENV_FILE"; then sed -i "s|^$key=.*|$key=$val|" "$ENV_FILE"; else echo "$key=$val" >> "$ENV_FILE"; fi
    green "  set $key in $ENV_FILE"
  else info "  $key already configured — leaving as-is"; fi
}
# True if a value is empty or still a template placeholder → we should provision it.
is_placeholder(){ [ -z "$1" ] || echo "$1" | grep -Eq 'STRONG_PASSWORD|CHANGE_ME|user:password@host|YOUR_'; }
port_in_use(){
  if have ss; then ss -ltnH "sport = :$1" 2>/dev/null | grep -q .;
  else (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null && { exec 3>&- || true; return 0; } || return 1; fi
}
free_port(){ local p="$1"; while port_in_use "$p"; do p=$((p+1)); done; echo "$p"; }

# ── STEP 2 — Base tooling (install only if missing) ──
info "Step 2/6 — base tooling (Node, pnpm, pm2)"
# Next 16 + React 19 want Node 20+. Ubuntu's apt Node (e.g. 18.x) also lacks
# corepack, so require 20 and install from NodeSource if older/missing.
if ! have node || [ "$(node -v | sed 's/v//;s/\..*//')" -lt 20 ]; then
  info "  installing Node 20 (current: $(have node && node -v || echo none))"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else info "  Node present ($(node -v))"; fi
have git || sudo apt-get install -y git
# pnpm via corepack if available, otherwise install it directly with npm
if ! have pnpm; then
  if have corepack; then sudo corepack enable; else sudo npm install -g pnpm; fi
fi
have pm2 || sudo npm install -g pm2
if have ufw; then
  info "  firewall: SSH/80/443 only (Postgres+Redis stay private on localhost)"
  sudo ufw allow OpenSSH >/dev/null; sudo ufw allow 80 >/dev/null; sudo ufw allow 443 >/dev/null; sudo ufw --force enable >/dev/null
fi

# ── STEP 3 — PostgreSQL: install if missing; add ONLY this app's locked-down db ──
info "Step 3/6 — PostgreSQL"
if ! have psql && ! dpkg -s postgresql >/dev/null 2>&1; then
  info "  installing PostgreSQL"; sudo apt-get install -y postgresql postgresql-client
else info "  already installed — existing databases will not be touched"; fi
sudo systemctl is-active --quiet postgresql || sudo systemctl enable --now postgresql
if is_placeholder "$(getenv DATABASE_URL)"; then
  info "  creating isolated role+db 'solana_token'"
  PGPASS="$(openssl rand -hex 16)"
  if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='solana_token'" | grep -q 1; then
    sudo -u postgres psql -qc "ALTER ROLE solana_token LOGIN PASSWORD '$PGPASS';"
  else
    sudo -u postgres psql -qc "CREATE ROLE solana_token LOGIN PASSWORD '$PGPASS';"
  fi
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='solana_token'" | grep -q 1 \
    || sudo -u postgres createdb -O solana_token solana_token
  # only this role may connect to this database
  sudo -u postgres psql -qc "REVOKE CONNECT ON DATABASE solana_token FROM PUBLIC;"
  sudo -u postgres psql -qc "GRANT CONNECT ON DATABASE solana_token TO solana_token;"
  setenv_if_needed DATABASE_URL "postgresql://solana_token:$PGPASS@localhost:5432/solana_token"
else info "  DATABASE_URL already points at a local db — leaving Postgres as-is"; fi

# ── STEP 4 — Redis: a DEDICATED instance just for this app ──
info "Step 4/6 — Redis (dedicated instance)"
had_redis=no; { have redis-server || dpkg -s redis-server >/dev/null 2>&1; } && had_redis=yes
[ "$had_redis" = yes ] || { info "  installing Redis"; sudo apt-get install -y redis-server; }
# If we just installed Redis on a box that had none, the default instance is
# unused — disable it (we run our own). If Redis pre-existed for other apps, leave it.
[ "$had_redis" = no ] && sudo systemctl disable --now redis-server 2>/dev/null || true
if is_placeholder "$(getenv REDIS_URL)"; then
  RPORT="$(free_port 6380)"; RPASS="$(openssl rand -hex 16)"
  info "  configuring dedicated Redis on 127.0.0.1:$RPORT"
  sudo install -d -o redis -g redis /var/lib/redis-solana-token
  sudo tee /etc/redis/solana-token.conf >/dev/null <<RCONF
port $RPORT
bind 127.0.0.1
protected-mode yes
requirepass $RPASS
dir /var/lib/redis-solana-token
pidfile /run/redis/solana-token.pid
appendonly no
save ""
RCONF
  sudo tee /etc/systemd/system/redis-solana-token.service >/dev/null <<'UNIT'
[Unit]
Description=Redis (solana-token, dedicated)
After=network.target

[Service]
User=redis
Group=redis
RuntimeDirectory=redis
ExecStart=/usr/bin/redis-server /etc/redis/solana-token.conf
Restart=always

[Install]
WantedBy=multi-user.target
UNIT
  sudo systemctl daemon-reload
  sudo systemctl enable redis-solana-token >/dev/null 2>&1 || true
  sudo systemctl restart redis-solana-token
  setenv_if_needed REDIS_URL "redis://default:$RPASS@127.0.0.1:$RPORT"
else
  info "  REDIS_URL already configured — restarting our dedicated instance"
  sudo systemctl restart redis-solana-token 2>/dev/null || true
fi

# ── STEP 5 — nginx vhost (only this app; other sites untouched) ──
info "Step 5/6 — nginx reverse proxy"
have nginx || { info "  installing nginx"; sudo apt-get install -y nginx; }
# www. only for apex domains; a subdomain (e.g. solanatoken.dravyo.com) has no www.
if [ "$(echo "$DOMAIN" | awk -F. '{print NF}')" -gt 2 ]; then
  SERVER_NAMES="$DOMAIN"; CERTBOT_ARGS="-d $DOMAIN"
else
  SERVER_NAMES="$DOMAIN www.$DOMAIN"; CERTBOT_ARGS="-d $DOMAIN -d www.$DOMAIN"
fi
sudo tee /etc/nginx/sites-available/solana-token >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $SERVER_NAMES;
    location / {
        proxy_pass http://127.0.0.1:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/solana-token /etc/nginx/sites-enabled/solana-token
sudo nginx -t && sudo systemctl reload nginx

# ── STEP 6 — Build + run as a NEW pm2 process (existing pm2 apps untouched) ──
info "Step 6/6 — build & start (pm2 process 'solana-token')"
bash scripts/deploy.sh --migrate
# survive reboots (idempotent; does not affect other pm2 apps)
sudo env PATH="$PATH" pm2 startup systemd -u "$USER" --hp "$HOME" >/dev/null 2>&1 || true
pm2 save >/dev/null 2>&1 || true

green "\n✓ Done. App is running on http://127.0.0.1:3333 behind nginx for $DOMAIN."
echo
echo "FINAL STEP — enable HTTPS once DNS for $DOMAIN points at this server:"
echo "    sudo apt-get install -y certbot python3-certbot-nginx"
echo "    sudo certbot --nginx $CERTBOT_ARGS"
echo
echo "Verify:  curl -sI https://$DOMAIN | grep -i strict-transport"
