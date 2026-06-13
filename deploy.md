# Deploy Solana Token to production

Step-by-step to put this app live at **https://solanatoken.dravyo.com** on a VPS,
behind **nginx + pm2**, with **self-hosted Postgres + Redis**, on **port 3333** —
safely alongside any other sites already on that server.

> Two scripts do the heavy lifting:
> - `scripts/vps-bootstrap.sh` — one-time server setup (Node, pm2, nginx, Postgres, Redis, build, start)
> - `scripts/deploy.sh` — every later update (validate env → build → restart)
>
> For deeper background, troubleshooting, and the security checklist see
> [docs/deployment-mainnet.md](docs/deployment-mainnet.md).

---

## 0. Gather your API keys (≈10 min, off the server)

You'll paste these into `.env.local` in step 3. Everything else (domain, DB, Redis)
is pre-filled or auto-generated.

| Key | Where to get it |
|---|---|
| `SOLANA_RPC_URL` + `NEXT_PUBLIC_RPC_URL` | https://helius.dev → create a mainnet API key. Make **two** keys: one unrestricted (server) and one **restricted to your domain** (browser). |
| `HELIUS_API_KEY` | Same Helius dashboard (used for holder counts). |
| `BIRDEYE_API_KEY` | https://birdeye.so → Data Services (optional — price/market data; app works without it). |
| `PINATA_JWT` | https://pinata.cloud → API Keys → new key → copy the **JWT** (for token logos). |
| `FEE_WALLET_ADDRESS` | The **public key** of a hardware wallet you control. **Never** a wallet whose seed is on a server. |
| `WEBHOOK_AUTH_SECRET`, `CRON_SECRET` | Generate each: `openssl rand -hex 32` |

> **Rotate the old Helius key** that appeared in earlier git history before launch.

---

## 1. Point DNS at the server

In Dravyo's DNS for `dravyo.com`, add an **A record**:

| Type | Host | Value |
|---|---|---|
| A | `solanatoken` | `YOUR_VPS_IP` |

(No `www` needed — it's a subdomain.) Verify from your laptop: `nslookup solanatoken.dravyo.com`.
DNS can take minutes to propagate; start it now, it only needs to resolve by step 5.

---

## 2. Get the code on the VPS

```bash
ssh youruser@YOUR_VPS_IP          # a sudo-capable, non-root user
sudo mkdir -p /var/www && sudo chown $USER:$USER /var/www
cd /var/www
git clone https://github.com/sumandada362/sol_token.git solana-token
cd solana-token
```

---

## 3. Configure environment

```bash
cp .env.mainnet.example .env.local
nano .env.local
```
Paste the keys from step 0. These are **already correct** and don't need changing:
- `NEXT_PUBLIC_APP_URL=https://solanatoken.dravyo.com`
- `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`
- `DATABASE_URL` / `REDIS_URL` — leave them; the bootstrap script provisions Postgres/Redis and fills these in automatically.

Save (`Ctrl+O`, Enter, `Ctrl+X`).

---

## 4. Run the one-time bootstrap

```bash
./scripts/vps-bootstrap.sh
```
This installs Node 20 + pnpm + pm2, opens the firewall (SSH/80/443 only — Postgres
and Redis stay on localhost), installs and configures **self-hosted Postgres + Redis**
(writing their URLs into `.env.local`), sets up nginx as a **name-based reverse
proxy** for `solanatoken.dravyo.com → 127.0.0.1:3333`, then builds and starts the
app under pm2.

**It will not disturb your other sites:** the nginx server block has no
`default_server`, uses a unique config name (`solana-token`) and a unique port
(3333), does not remove the default site or any other vhost, and reloads (never
restarts) nginx. If your other app already uses port 3333, change the port in
`package.json` (`next start -p`) and the nginx `proxy_pass` to match.

If it stops with a red ✗, it caught a placeholder you forgot in `.env.local` —
fix that line and re-run (safe to repeat).

---

## 5. Enable HTTPS

Once DNS resolves, run the command the bootstrap printed:
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d solanatoken.dravyo.com
```
Choose "redirect HTTP → HTTPS". Certbot only edits the `solanatoken.dravyo.com`
server block — other domains' SSL is untouched.

---

## 6. Verify it's live and correct

```bash
# security headers + TLS
curl -sI https://solanatoken.dravyo.com | grep -iE "strict-transport|content-security|x-frame"

# every page renders
BASE_URL=https://solanatoken.dravyo.com node scripts/smoke-pages.mjs

# rate limiting is live (proves Redis works) — last line should be 429
for i in $(seq 1 21); do curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://solanatoken.dravyo.com/api/tx/create-token -H 'content-type: application/json' \
  -H 'sec-fetch-site: same-origin' --data '{}'; done | tail -3
```
Then the **real test**: open the site, connect a small funded mainnet wallet,
create one token, and confirm a row landed:
```bash
psql "$(grep ^DATABASE_URL .env.local | cut -d= -f2-)" -c \
  "SELECT action, lamports, signature FROM fee_events ORDER BY created_at DESC LIMIT 5;"
```
A `fee_events` row = fee accounting works. (Any `recorded:false` from the app with
the DB up is a launch blocker — see the runbooks in `docs/runbooks/`.)

---

## 7. Updating later

```bash
cd /var/www/solana-token
git pull
./scripts/deploy.sh            # validate env → build → pm2 restart
./scripts/deploy.sh --migrate  # add this only when the DB schema changed
```

`deploy.sh` refuses to build if a required env value is still a placeholder, and
rebuilds whenever you change a `NEXT_PUBLIC_*` value (those are baked at build time).

---

## CORS / security notes

- The app's API is **same-origin** (frontend and API both on `solanatoken.dravyo.com`),
  protected by CSRF (Sec-Fetch-Site + Origin allowlist). Requests from your own
  site are allowed; cross-origin requests are blocked by design. No extra CORS
  configuration is needed.
- Never set `NODE_TLS_REJECT_UNAUTHORIZED=0` in production (a local-dev-only workaround).
- Postgres (5432) and Redis (6379) listen on localhost only — never expose them.

---

## Quick reference

| Thing | Value |
|---|---|
| Domain | https://solanatoken.dravyo.com |
| App port | 3333 (pm2 process `solana-token`) |
| nginx site | `/etc/nginx/sites-available/solana-token` |
| Postgres | role+db `solana_token` @ localhost:5432 |
| Redis | localhost:6379 (password set by bootstrap) |
| Logs | `pm2 logs solana-token` |
| Restart | `pm2 restart solana-token` |
