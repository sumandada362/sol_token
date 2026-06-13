#!/usr/bin/env bash
#
# Solana Token — one-time VPS provisioning for Ubuntu 22.04 / 24.04.
# Run ONCE as a sudo-capable user, from the repo root, AFTER:
#   1. cloning the repo, and
#   2. creating .env.local from .env.mainnet.example (filled with real values).
#
#   ./scripts/vps-bootstrap.sh
#
# It installs Node 20 + pnpm + pm2, opens the firewall, installs/configures
# nginx as a reverse proxy for the domain in NEXT_PUBLIC_APP_URL, then runs the
# app deploy. TLS (certbot) is the LAST step and is printed for you to run once
# your DNS A-record points at this server — review before running.
#
# This script makes system changes (apt, ufw, nginx). Read it before running.
#
set -euo pipefail
cd "$(dirname "$0")/.."

green() { printf "\033[32m%s\033[0m\n" "$*"; }
info()  { printf "\033[36m▶ %s\033[0m\n" "$*"; }
red()   { printf "\033[31m%s\033[0m\n" "$*"; }

[[ -f .env.local ]] || { red "Create .env.local from .env.mainnet.example first."; exit 1; }
DOMAIN_URL="$(grep -E '^NEXT_PUBLIC_APP_URL=' .env.local | head -1 | cut -d= -f2- | tr -d '[:space:]')"
DOMAIN="${DOMAIN_URL#https://}"; DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN%/}"
[[ -n "$DOMAIN" && "$DOMAIN" != your-domain.com ]] || { red "Set NEXT_PUBLIC_APP_URL to your real https domain in .env.local first."; exit 1; }
info "Provisioning for domain: $DOMAIN"

# ── Node 20 + pnpm + pm2 ────────────────────────────────────────────────────
if ! command -v node >/dev/null || [[ "$(node -v | cut -dv -f2 | cut -d. -f1)" -lt 18 ]]; then
  info "Installing Node 20"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
sudo apt-get install -y git postgresql postgresql-client redis-server openssl >/dev/null
sudo corepack enable
command -v pm2 >/dev/null || sudo npm install -g pm2

# ── Firewall ────────────────────────────────────────────────────────────────
if command -v ufw >/dev/null; then
  info "Configuring firewall"
  # Only SSH + HTTP(S). Postgres (5432) and Redis (6379) stay on localhost —
  # never expose them publicly; the app reaches them via 127.0.0.1.
  sudo ufw allow OpenSSH; sudo ufw allow 80; sudo ufw allow 443; sudo ufw --force enable
fi

# ── Self-hosted Postgres + Redis (localhost only) ───────────────────────────
# Fills DATABASE_URL / REDIS_URL in .env.local only if they're still empty or a
# placeholder, so re-running won't clobber working credentials.
setenv_if_needed() {  # key, value
  local key="$1" val="$2" cur
  cur="$(grep -E "^$key=" .env.local | head -1 | cut -d= -f2- || true)"
  if [[ -z "$cur" || "$cur" =~ (user:password@host|STRONG_PASSWORD|YOUR_) ]]; then
    if grep -qE "^$key=" .env.local; then
      # use | as sed delimiter; escape any | in the value (none expected in URLs)
      sudo true; sed -i "s|^$key=.*|$key=$val|" .env.local
    else
      echo "$key=$val" >> .env.local
    fi
    green "  set $key in .env.local"
  else
    info "  $key already configured — leaving as-is"
  fi
}

info "Configuring PostgreSQL (role + db: solana_token)"
sudo systemctl enable --now postgresql >/dev/null 2>&1 || true
if ! grep -qE '^DATABASE_URL=postgresql://[^:]+:[^@]+@(localhost|127\.0\.0\.1)' .env.local; then
  PGPASS="$(openssl rand -hex 16)"
  if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='solana_token'" | grep -q 1; then
    sudo -u postgres psql -c "ALTER ROLE solana_token LOGIN PASSWORD '$PGPASS';" >/dev/null
  else
    sudo -u postgres psql -c "CREATE ROLE solana_token LOGIN PASSWORD '$PGPASS';" >/dev/null
  fi
  sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='solana_token'" | grep -q 1 \
    || sudo -u postgres createdb -O solana_token solana_token
  setenv_if_needed DATABASE_URL "postgresql://solana_token:$PGPASS@localhost:5432/solana_token"
else
  info "  DATABASE_URL already points at a local db — leaving Postgres creds as-is"
fi

info "Configuring Redis (localhost + password)"
if ! grep -qE '^REDIS_URL=redis://default:[^@]+@(localhost|127\.0\.0\.1)' .env.local; then
  REDISPASS="$(openssl rand -hex 16)"
  # Set requirepass (handles both the commented default and an existing value)
  if grep -qE '^\s*#?\s*requirepass ' /etc/redis/redis.conf; then
    sudo sed -i "s|^\s*#\?\s*requirepass .*|requirepass $REDISPASS|" /etc/redis/redis.conf
  else
    echo "requirepass $REDISPASS" | sudo tee -a /etc/redis/redis.conf >/dev/null
  fi
  sudo systemctl enable redis-server >/dev/null 2>&1 || true
  sudo systemctl restart redis-server
  setenv_if_needed REDIS_URL "redis://default:$REDISPASS@localhost:6379"
else
  info "  REDIS_URL already points at local redis — leaving Redis creds as-is"
fi

# ── nginx reverse proxy ─────────────────────────────────────────────────────
info "Installing + configuring nginx"
sudo apt-get install -y nginx >/dev/null
sudo tee /etc/nginx/sites-available/solana-token >/dev/null <<NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
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
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# ── Build + start the app (validates env, builds, pm2) ──────────────────────
info "Deploying the app (install → validate → migrate → build → start)"
./scripts/deploy.sh --migrate

green "\n✓ Server provisioned and app running on http://127.0.0.1:3333 behind nginx."
echo
echo "FINAL STEP — enable HTTPS once your DNS A-record for $DOMAIN points here:"
echo "    sudo apt-get install -y certbot python3-certbot-nginx"
echo "    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo
echo "Then verify:  curl -sI https://$DOMAIN | grep -i strict-transport"
