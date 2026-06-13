# Solana Token — Mainnet Deployment & VPS Launch Guide

End-to-end guide to take Solana Token from the testnet-passed state to a live
`mainnet-beta` deployment on a VPS. Covers every external service (what it's
for, where to get it, which tier), the exact VPS setup, env configuration,
TLS, and a go-live checklist.

> Read [mainnet-readiness.md](mainnet-readiness.md) first — it lists the hard
> blockers (key rotation, hardware fee wallet, managed Postgres/Redis). This doc
> is the *how*; that one is the *gate*.

---

## 0. Architecture in one picture

```
                          ┌──────────────────────────────────────────┐
  Browser (user's wallet) │  VPS (Ubuntu)                            │
   ├─ wallet adapter ─────┼─► Next.js (next start, :3333)            │
   │   uses NEXT_PUBLIC_RPC_URL      │  server reads SOLANA_RPC_URL   │
   │                                 │                               │
   └─ HTTPS via nginx ────┼─► nginx (:443, TLS) ─► :3333 (Next.js)  │
                          │                                          │
                          │   Postgres + Redis on 127.0.0.1 (same VPS)│
                          └───────┬──────────────────────┬──────────┘
                                  │                       │
              ┌───────────────────┘                       └──────────┐
              ▼                                                       ▼
        Solana RPC                                            External APIs
     (Helius / QuickNode)                              (Birdeye, Pinata, Helius DAS)
```

- **The browser talks to Solana directly** (wallet signing, sending txs) using `NEXT_PUBLIC_RPC_URL`.
- **The server** builds transactions, verifies fees, reads metadata, and serves pages using `SOLANA_RPC_URL` (key-bearing, never exposed).
- **No private keys ever live on the server.** The mint keypair is generated client-side; the fee wallet is referenced by public key only.

---

## 1. External services — what to get, where, which tier

| Service | Why Solana Token needs it | Required? | Where | Recommended tier |
|---|---|---|---|---|
| **Solana RPC** | All chain reads/writes (server + browser) | **Yes** | Helius, QuickNode, Triton, Alchemy | See §1.1 |
| **Helius DAS** | Holder counts on token pages (`getTokenAccounts`) | Optional* | helius.dev (same account as RPC) | Same key as RPC |
| **Birdeye** | Price / volume / liquidity / market cap | Optional* | birdeye.so → "Data Services" | Standard (free) to start |
| **Pinata (IPFS)** | Token logo + metadata JSON uploads | **Yes** (for logos) | pinata.cloud | Free 1 GB → Picnic if volume |
| **Postgres** | Fee accounting + token records + page cache | **Yes** on mainnet | **self-hosted on the VPS** (or Supabase/Neon/RDS) | localhost — see §4.7 |
| **Redis** | Rate limiting + caching | **Yes** on mainnet | **self-hosted on the VPS** (or Upstash) | localhost — see §4.7 |
| **VPS** | Hosts app + nginx + Postgres + Redis | **Yes** | Hetzner, DigitalOcean, Vultr | 2+ vCPU / 4 GB RAM (3 cores / 4 GB / 75 GB is comfortable for all four on one box) |
| **Domain + DNS** | Public HTTPS origin | **Yes** | Namecheap/Cloudflare/etc. | + Cloudflare proxy (optional) |

\* *Optional = the app degrades gracefully without it (holder count / market stats render as "—"), exactly as on testnet. Functionally fine, but on mainnet you'll want them for real data.*

### 1.1 Choosing an RPC provider (the most important choice)

**Do NOT use the public `https://api.mainnet-beta.solana.com` in production.** It is
aggressively rate-limited, has no SLA, and Solana Labs explicitly says it's for
development only. Under any real traffic, token creation and multisends will fail.

**Recommended: Helius** — Solana Token already has first-class Helius support (the
holder-count DAS calls and cluster-aware URLs in `lib/data/holders.ts` assume
Helius; the CSP already allows `*.helius-rpc.com`). One account covers both the
RPC and the DAS holder counts.

| Provider | Free tier | Paid entry | Notes |
|---|---|---|---|
| **Helius** (recommended) | 1 RPC + DAS, ~1M credits/mo | ~$49/mo | Best fit — DAS holder counts work out of the box |
| QuickNode | Trial | ~$49/mo | Works; holder counts fall back to null (no DAS) unless you add an add-on |
| Triton (`*.rpcpool.com`) | — | Custom | Allowed in CSP already; no DAS |
| Alchemy | Free tier | Paid scale | Add its host to `CSP_CONNECT_SRC_EXTRA` |

**Use two endpoints from your provider:**

1. `SOLANA_RPC_URL` — **server-side**, full-rate key. Never exposed (only read by Node). No domain restriction needed.
2. `NEXT_PUBLIC_RPC_URL` — **browser-side**, baked into the client bundle and therefore public. In the Helius dashboard create a **second key restricted by allowed origin/referrer** (your domain) so a leaked key can't be abused. This is the key the wallet adapter uses to send the user's signed transactions.

> **CSP note:** the origin of `NEXT_PUBLIC_RPC_URL` is auto-added to the
> Content-Security-Policy `connect-src` **at build time** (see `next.config.ts`).
> If your browser RPC or a separate websocket host is on a domain other than
> `*.solana.com / *.helius-rpc.com / *.rpcpool.com / *.rpc.extrnode.com`, set
> `CSP_CONNECT_SRC_EXTRA` too, or the browser will silently block RPC calls.

### 1.2 Postgres & Redis

The app degrades without them, but on mainnet that means **real fees go
unjournaled** (`recorded:false`) and **rate limiting fails open**. Both are
launch blockers.

**This deployment self-hosts both on the same VPS** (§4.7) — fine on 3 cores /
4 GB / 75 GB. They bind to `127.0.0.1` only and are never exposed to the
internet (the firewall opens just SSH/80/443). `scripts/vps-bootstrap.sh`
installs and configures them and writes `DATABASE_URL` / `REDIS_URL` into
`.env.local` for you.

> Managed alternatives if you'd rather not self-host: **Supabase**/**Neon**
> (Postgres) and **Upstash** (Redis) all have free tiers — just paste their
> connection strings into `.env.local` and skip §4.7.

---

## 2. Pre-deploy (do these once, before touching the VPS)

1. **Rotate the Helius key.** The old devnet key was committed to git history. Generate fresh keys (one server, one origin-restricted browser key).
2. **Fee wallet on hardware.** `FEE_WALLET_ADDRESS` = the **public key** of a hardware-wallet (Ledger) keypair. Never reuse the testnet wallet — its mnemonic is in plaintext in `scripts/testnet-wallets.*`.
3. **Generate secrets:**
   ```bash
   openssl rand -hex 32   # WEBHOOK_AUTH_SECRET
   openssl rand -hex 32   # CRON_SECRET
   ```
4. **Provision** Postgres + Redis (get the two connection strings).
5. **Buy a domain**, decide whether to front it with Cloudflare.

---

## 3. Database setup

Apply the migrations the **running code actually uses**:

```bash
# tokens, fee_events
psql "$DATABASE_URL" -f db/schema.sql
# token_cache  (+ an unused multisend_batches table — harmless)
psql "$DATABASE_URL" -f db/002_phase2.sql
```

> **Do NOT apply `db/migrations/002_multisend_journal.sql`.** It redefines
> `multisend_batches` with a different, conflicting schema for an unshipped
> resume-journal feature that the current code does not query (multisend resume
> is handled client-side via localStorage). Applying it adds confusion with no
> benefit. The live code only reads/writes `tokens`, `fee_events`, and
> `token_cache`.

Verify:
```bash
psql "$DATABASE_URL" -c "\dt"   # expect: tokens, fee_events, token_cache (+ multisend_batches)
```

---

## 4. VPS setup (Ubuntu 22.04 / 24.04)

Assumes a fresh VPS and a domain `solanatoken.dravyo.com` with an **A record** pointing
at the VPS IP. Run as root unless noted.

### 4.1 Create a deploy user + firewall

```bash
adduser deploy
usermod -aG sudo deploy
# copy your SSH key to the new user
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
```

Re-login as `deploy` for the rest.

### 4.2 Install Node 20 LTS + pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo corepack enable          # provides pnpm
node -v                       # v20.x
pnpm -v
```

### 4.2.1 Fast path — scripted bootstrap (covers 4.2–4.8)

If you want the whole server set up in one go, after cloning and filling
`.env.local` (§4.3–4.4) just run:

```bash
./scripts/vps-bootstrap.sh      # Node+pnpm+pm2, firewall, nginx, build, start
# then the one TLS command it prints, once DNS points at the box:
sudo certbot --nginx -d solanatoken.dravyo.com
```

For every later code update, the repeatable deploy is one command:

```bash
./scripts/deploy.sh             # validate env → install → build → restart
./scripts/deploy.sh --migrate   # also (re)apply DB migrations
```

`deploy.sh` **refuses to build if any required env value is still a
placeholder** — so a missing API key fails fast at deploy time, not silently at
runtime. The manual steps below (4.3–4.8) are what these scripts automate, kept
for reference / debugging.

### 4.3 Get the code

```bash
sudo mkdir -p /var/www && sudo chown deploy:deploy /var/www
cd /var/www
git clone <your-repo-url> solana-token
cd solana-token
pnpm install --frozen-lockfile
```

### 4.4 Configure environment

```bash
cp .env.mainnet.example .env.local
nano .env.local      # fill in every value — see §5
```

Fill in all values from §5. `.env.local` is git-ignored; it stays only on the
VPS. (For a more secure setup, inject these via your process manager's env
instead of a file — see §4.6.)

### 4.5 Build (env must be present — NEXT_PUBLIC_* + CSP bake in here)

```bash
pnpm build
```

This is also where the CSP `connect-src` picks up `NEXT_PUBLIC_RPC_URL` /
`CSP_CONNECT_SRC_EXTRA`. **If you change any `NEXT_PUBLIC_*` var, you must
rebuild.**

### 4.6 Run the app — PM2 (option A) or systemd (option B)

**Option A — PM2** (simplest):
```bash
sudo npm install -g pm2
pm2 start "pnpm start" --name solana-token --cwd /var/www/solana-token
pm2 save
pm2 startup        # run the command it prints, to start on boot
pm2 logs solana-token     # tail logs
```

**Option B — systemd** (no extra global dep). Create `/etc/systemd/system/solana-token.service`:
```ini
[Unit]
Description=Solana Token Next.js
After=network.target

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/solana-token
# Load env from the file (or list Environment= lines here instead)
EnvironmentFile=/var/www/solana-token/.env.local
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=5
# Hard guarantee: never disable TLS verification in production
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now solana-token
sudo systemctl status solana-token
journalctl -u solana-token -f
```

The app now listens on `127.0.0.1:3333` (set via `next start -p 3333` in
`package.json`). nginx will expose it over HTTPS. If you change the port, change
it in both `package.json` and the nginx config below.

> ⚠️ **Never set `NODE_TLS_REJECT_UNAUTHORIZED=0` in production.** That was a
> local dev workaround for a TLS-intercepting proxy on the build machine only.
> On a real VPS, outbound HTTPS works normally and disabling verification is a
> security hole.

### 4.7 Self-host Postgres + Redis on the VPS

`scripts/vps-bootstrap.sh` does all of this automatically (installs both, creates
the `solana_token` role+db, sets a Redis password, and writes `DATABASE_URL` /
`REDIS_URL` into `.env.local`). The manual equivalent, for reference or if you're
not using the script:

**PostgreSQL:**
```bash
sudo apt-get install -y postgresql postgresql-client
sudo systemctl enable --now postgresql

PGPASS="$(openssl rand -hex 16)"
sudo -u postgres psql -c "CREATE ROLE solana_token LOGIN PASSWORD '$PGPASS';"
sudo -u postgres createdb -O solana_token solana_token
echo "DATABASE_URL=postgresql://solana_token:$PGPASS@localhost:5432/solana_token"   # paste into .env.local
```
Postgres listens on `localhost` only by default (do not change `listen_addresses`).

**Redis:**
```bash
sudo apt-get install -y redis-server
REDISPASS="$(openssl rand -hex 16)"
sudo sed -i "s|^\s*#\?\s*requirepass .*|requirepass $REDISPASS|" /etc/redis/redis.conf
sudo systemctl enable --now redis-server
sudo systemctl restart redis-server
echo "REDIS_URL=redis://default:$REDISPASS@localhost:6379"            # paste into .env.local
```
Redis also binds to `127.0.0.1` by default. **Keep 5432 and 6379 off the public
firewall** (the bootstrap script only opens SSH/80/443) — there is never a reason
to expose them; the app reaches them over localhost.

**Sizing on 3 cores / 4 GB / 75 GB:** comfortable for all four services. Optional
tuning: cap Redis memory so it can't starve Postgres/Node —
```bash
echo -e "maxmemory 256mb\nmaxmemory-policy allkeys-lru" | sudo tee -a /etc/redis/redis.conf >/dev/null
sudo systemctl restart redis-server
```
Postgres defaults are fine at this scale; leave `PG_POOL_MAX=10`. Add a 2 GB swap
file as a safety margin if you run heavy multisends:
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Then apply the schema (or let `./scripts/deploy.sh --migrate` do it):
```bash
psql "$DATABASE_URL" -f db/schema.sql
psql "$DATABASE_URL" -f db/002_phase2.sql
```

### 4.8 nginx reverse proxy + TLS

```bash
sudo apt-get install -y nginx
```

Create `/etc/nginx/sites-available/solana-token`:
```nginx
server {
    listen 80;
    server_name solanatoken.dravyo.com;

    location / {
        proxy_pass http://127.0.0.1:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # Solana Token's rate limiter keys on X-Forwarded-For — keep the chain accurate
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/solana-token /etc/nginx/sites-enabled/
# Do NOT remove the default site or other vhosts — name-based routing keeps co-hosted apps isolated
sudo nginx -t && sudo systemctl reload nginx
```

Get a free Let's Encrypt certificate (this rewrites the server block for 443 +
auto-renew):
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d solanatoken.dravyo.com
```

> The app already emits HSTS, X-Frame-Options, CSP, etc. (see `next.config.ts`).
> Let nginx pass them through — **do not** duplicate/override security headers in
> nginx, or you may weaken the app's CSP. The only header that needs HTTPS to
> take effect is HSTS, which now works once TLS is live.

> **Cloudflare?** If you proxy through Cloudflare, set SSL mode to **Full
> (strict)**, and note that the client IP arrives in `CF-Connecting-IP`; nginx's
> `X-Forwarded-For` will still carry it first in the chain, which Solana Token's
> limiter reads. Keep "Always Use HTTPS" on.

---

## 5. Mainnet environment reference (`.env.local` on the VPS)

From [.env.mainnet.example](../.env.mainnet.example):

| Variable | Value | Exposed to browser? |
|---|---|---|
| `SOLANA_RPC_URL` | Helius mainnet RPC **with full key** | No (server only) |
| `NEXT_PUBLIC_RPC_URL` | Helius mainnet RPC with **origin-restricted** key | **Yes** |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `mainnet-beta` | Yes |
| `CSP_CONNECT_SRC_EXTRA` | extra connect-src hosts if RPC isn't a known provider | baked at build |
| `HELIUS_API_KEY` | Helius key (holder counts via DAS) | No |
| `BIRDEYE_API_KEY` | Birdeye key (price/market) — empty disables gracefully | No |
| `NEXT_PUBLIC_APP_URL` | `https://solanatoken.dravyo.com` | Yes |
| `FEE_WALLET_ADDRESS` | **public key** of hardware fee wallet | No |
| `PINATA_JWT` | Pinata JWT for logo/metadata uploads | No |
| `DATABASE_URL` | managed Postgres connection string | No |
| `PG_POOL_MAX` | `10` | No |
| `REDIS_URL` | Upstash/Redis connection string | No |
| `WEBHOOK_AUTH_SECRET` | `openssl rand -hex 32` | No |
| `CRON_SECRET` | `openssl rand -hex 32` | No |

The startup guardrail (`lib/solana/connection.ts`) **throws on boot** if
`NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta` but `SOLANA_RPC_URL` points at a test
cluster (or vice-versa). A failed boot here means the guardrail caught a
misconfiguration — fix the env, don't bypass it.

---

## 6. Post-deploy verification

```bash
# 1. Security headers + TLS
curl -sI https://solanatoken.dravyo.com | grep -iE "strict-transport|x-frame|content-security|x-content-type"
#   expect: HSTS, X-Frame-Options: DENY, CSP present, nosniff

# 2. Every route renders (run from your laptop or the VPS)
BASE_URL=https://solanatoken.dravyo.com node scripts/smoke-pages.mjs
#   note: the TESTNET banner assertion won't apply — on mainnet there is no banner

# 3. Rate limiting is live (needs Redis): 21 rapid builds → a 429
for i in $(seq 1 21); do \
  curl -s -o /dev/null -w "%{http_code}\n" -X POST https://solanatoken.dravyo.com/api/tx/create-token \
  -H 'content-type: application/json' -H 'sec-fetch-site: same-origin' --data '{}'; done | tail -3
```

Then the **manual money test** (small, real SOL — see mainnet-readiness.md §3):
connect a funded mainnet wallet, create one token, run one of each paid flow,
and confirm each `/api/confirm` returns `recorded: true`. Check the `fee_events`
table:
```bash
psql "$DATABASE_URL" -c "SELECT action, lamports, signature FROM fee_events ORDER BY created_at DESC LIMIT 20;"
```
**Any `recorded:false` with the production DB up is a launch blocker** — it means
fees aren't being journaled.

---

## 7. Updating / redeploying

```bash
cd /var/www/solana-token
git pull
pnpm install --frozen-lockfile
pnpm build
pm2 restart solana-token        # or: sudo systemctl restart solana-token
```
Zero-downtime isn't configured here; the restart blips for ~1s. For true
zero-downtime, run two PM2 instances behind nginx upstream, or use `pm2 reload`.

---

## 8. Monitoring & incident response

- **Logs:** `pm2 logs solana-token` / `journalctl -u solana-token -f`. Watch for `[confirm] datastore write failed` (DB down → fees unjournaled) and `[guardrail]` (misconfig).
- **Alert on `recorded:false`** in confirm responses — that's the signal real fees aren't being recorded.
- **Runbooks** already exist for the four most likely incidents:
  - [runbooks/bad-deploy.md](runbooks/bad-deploy.md)
  - [runbooks/rpc-outage.md](runbooks/rpc-outage.md)
  - [runbooks/fee-wallet-compromised.md](runbooks/fee-wallet-compromised.md)
  - [runbooks/webhook-outage.md](runbooks/webhook-outage.md)
- **Uptime:** point an external monitor (UptimeRobot/BetterStack) at `https://solanatoken.dravyo.com/` and `/api/tokens/wallet/<any>` (should be 200).

---

## 9. Rough monthly cost (small launch)

| Item | Est. / mo |
|---|---|
| VPS (3 cores / 4 GB / 75 GB — runs app + Postgres + Redis) | $12–24 |
| Postgres + Redis | $0 (self-hosted on the VPS) |
| Solana RPC (Helius starter) | $0 (free tier) → $49 |
| Birdeye | $0 (Standard) → paid at scale |
| Pinata | $0 (1 GB) → $20 |
| Domain | ~$1 (amortized) |
| **Total to start** | **~$13–25/mo**, scaling with traffic |

---

## 10. Go-live checklist

- [ ] Helius key rotated; separate origin-restricted browser key created
- [ ] `FEE_WALLET_ADDRESS` is a hardware-wallet public key (not the testnet wallet)
- [ ] `WEBHOOK_AUTH_SECRET` + `CRON_SECRET` freshly generated
- [ ] Postgres self-hosted on the VPS; `schema.sql` + `002_phase2.sql` applied (NOT the conflicting migration)
- [ ] Redis self-hosted with a password set; `REDIS_URL` works
- [ ] Postgres (5432) + Redis (6379) NOT exposed on the public firewall — localhost only
- [ ] `.env.local` complete; `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`
- [ ] `pnpm build` run **with the mainnet env loaded** (CSP baked correctly)
- [ ] App running under PM2/systemd, restarts on boot, `NODE_TLS_REJECT_UNAUTHORIZED` **unset**
- [ ] nginx + Let's Encrypt TLS live; `curl -sI` shows HSTS/CSP/X-Frame-Options
- [ ] `scripts/smoke-pages.mjs` green against the live domain
- [ ] Rate-limit 429 test passes (Redis live)
- [ ] Manual money test: one token + one of each flow, all `recorded:true`, `fee_events` rows correct
- [ ] Uptime monitor + log alerting on `recorded:false` configured
- [ ] Team has walked the runbooks once
```
