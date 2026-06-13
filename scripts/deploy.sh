#!/usr/bin/env bash
#
# FORGE — repeatable production deploy (run ON the VPS, from the repo root).
#
#   ./scripts/deploy.sh            # install → validate env → build → (re)start
#   ./scripts/deploy.sh --migrate  # also apply DB migrations (safe to repeat)
#
# Prerequisites (one-time): run scripts/vps-bootstrap.sh first, then fill in
# .env.local from .env.mainnet.example. This script refuses to build if any
# required value is still a placeholder — so a missing key fails fast, here,
# instead of silently at runtime.
#
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.local"
RUN_MIGRATE=false
[[ "${1:-}" == "--migrate" ]] && RUN_MIGRATE=true

red()   { printf "\033[31m%s\033[0m\n" "$*"; }
green() { printf "\033[32m%s\033[0m\n" "$*"; }
info()  { printf "\033[36m▶ %s\033[0m\n" "$*"; }

# ── 1. Env presence ─────────────────────────────────────────────────────────
[[ -f "$ENV_FILE" ]] || { red "Missing $ENV_FILE — copy .env.mainnet.example to .env.local and fill it in."; exit 1; }

getenv() { grep -E "^$1=" "$ENV_FILE" | head -1 | cut -d= -f2- | sed 's/[[:space:]]*$//'; }

# ── 2. Validate — fail on empty or known placeholder values ─────────────────
PLACEHOLDER_RE='YOUR_|your-domain|your-rpc-provider|PUBLIC_TIER_KEY|user:password@host|YOUR_RANDOM|STRONG_PASSWORD'
REQUIRED=(SOLANA_RPC_URL NEXT_PUBLIC_RPC_URL NEXT_PUBLIC_SOLANA_NETWORK NEXT_PUBLIC_APP_URL FEE_WALLET_ADDRESS PINATA_JWT DATABASE_URL REDIS_URL WEBHOOK_AUTH_SECRET CRON_SECRET)
errs=0
for key in "${REQUIRED[@]}"; do
  val="$(getenv "$key")"
  if [[ -z "$val" ]]; then red "  ✗ $key is empty"; errs=$((errs+1));
  elif echo "$val" | grep -Eq "$PLACEHOLDER_RE"; then red "  ✗ $key still has a placeholder value"; errs=$((errs+1)); fi
done

# Mainnet sanity: network must be mainnet-beta and RPCs must not be test clusters
net="$(getenv NEXT_PUBLIC_SOLANA_NETWORK)"
if [[ "$net" == "mainnet-beta" ]]; then
  for key in SOLANA_RPC_URL NEXT_PUBLIC_RPC_URL; do
    echo "$(getenv "$key")" | grep -Eq 'devnet|testnet' && { red "  ✗ $key points at a test cluster but network is mainnet-beta"; errs=$((errs+1)); }
  done
  [[ "$(getenv NEXT_PUBLIC_APP_URL)" == https://* ]] || { red "  ✗ NEXT_PUBLIC_APP_URL must be https:// in production"; errs=$((errs+1)); }
fi

if [[ "$errs" -gt 0 ]]; then red "\n$errs problem(s) in $ENV_FILE — fix them and re-run."; exit 1; fi
green "✓ Environment validated ($net)"

# Never allow the local-dev TLS bypass in a deploy
if [[ "${NODE_TLS_REJECT_UNAUTHORIZED:-}" == "0" ]]; then
  red "Refusing to deploy with NODE_TLS_REJECT_UNAUTHORIZED=0 (insecure — local-dev only)."; exit 1
fi

# ── 3. Install deps ─────────────────────────────────────────────────────────
info "Installing dependencies"
corepack enable >/dev/null 2>&1 || true
pnpm install --frozen-lockfile

# ── 4. DB migrations (opt-in; create-if-not-exists, safe to repeat) ─────────
if $RUN_MIGRATE; then
  info "Applying DB migrations"
  command -v psql >/dev/null || { red "psql not found — install postgresql-client or apply db/*.sql manually."; exit 1; }
  DB="$(getenv DATABASE_URL)"
  psql "$DB" -f db/schema.sql
  psql "$DB" -f db/002_phase2.sql
  # NOTE: db/migrations/002_multisend_journal.sql is intentionally NOT applied
  # (conflicting, unused multisend_batches definition — see docs/deployment-mainnet.md §3)
  green "✓ Migrations applied"
fi

# ── 5. Build (bakes NEXT_PUBLIC_* + CSP connect-src from .env.local) ────────
info "Building"
pnpm build
green "✓ Build complete"

# ── 6. (Re)start under the available process manager ────────────────────────
if command -v pm2 >/dev/null; then
  if pm2 describe forge >/dev/null 2>&1; then info "Restarting (pm2)"; pm2 restart forge --update-env;
  else info "Starting (pm2)"; pm2 start "pnpm start" --name forge; pm2 save; fi
elif systemctl list-unit-files 2>/dev/null | grep -q '^forge\.service'; then
  info "Restarting (systemd)"; sudo systemctl restart forge
else
  red "No process manager found (pm2 or systemd 'forge' unit)."
  red "Start manually with: pnpm start   (see docs/deployment-mainnet.md §4.6)"; exit 1
fi

green "\n✓ Deploy complete. Verify: curl -sI $(getenv NEXT_PUBLIC_APP_URL) | grep -i content-security"
