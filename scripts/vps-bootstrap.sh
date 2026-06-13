#!/usr/bin/env bash
#
# FORGE — one-time VPS provisioning for Ubuntu 22.04 / 24.04.
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
sudo apt-get install -y git postgresql-client >/dev/null
sudo corepack enable
command -v pm2 >/dev/null || sudo npm install -g pm2

# ── Firewall ────────────────────────────────────────────────────────────────
if command -v ufw >/dev/null; then
  info "Configuring firewall"
  sudo ufw allow OpenSSH; sudo ufw allow 80; sudo ufw allow 443; sudo ufw --force enable
fi

# ── nginx reverse proxy ─────────────────────────────────────────────────────
info "Installing + configuring nginx"
sudo apt-get install -y nginx >/dev/null
sudo tee /etc/nginx/sites-available/forge >/dev/null <<NGINX
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    location / {
        proxy_pass http://127.0.0.1:3000;
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
sudo ln -sf /etc/nginx/sites-available/forge /etc/nginx/sites-enabled/forge
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# ── Build + start the app (validates env, builds, pm2) ──────────────────────
info "Deploying the app (install → validate → migrate → build → start)"
./scripts/deploy.sh --migrate

green "\n✓ Server provisioned and app running on http://127.0.0.1:3000 behind nginx."
echo
echo "FINAL STEP — enable HTTPS once your DNS A-record for $DOMAIN points here:"
echo "    sudo apt-get install -y certbot python3-certbot-nginx"
echo "    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo
echo "Then verify:  curl -sI https://$DOMAIN | grep -i strict-transport"
