# Deploy Solana Token to production — complete guide

Everything needed to take this app live at **https://solanatoken.dravyo.com** on
your VPS: where to get every API key, how to set up **self‑hosted PostgreSQL and
Redis**, every environment variable, the nginx + pm2 setup (safe next to your
other sites), HTTPS, and how to update later.

**Your target setup**

| Thing | Value |
|---|---|
| Public URL | https://solanatoken.dravyo.com |
| App process | Node (Next.js) on **port 3333**, managed by **pm2** (process name `solana-token`) |
| Reverse proxy | **nginx** (TLS via Let's Encrypt) |
| Database | **self‑hosted PostgreSQL** on the same VPS (localhost only) |
| Cache / rate‑limit | **self‑hosted Redis** on the same VPS (localhost only) |
| Server | Ubuntu 22.04/24.04, 3 vCPU / 4 GB / 75 GB (yours) |

**Two ways to do it**
- **Fast path** — run `scripts/vps-bootstrap.sh`, which automates almost everything below (installs Node/pm2/nginx/Postgres/Redis, creates the DB + Redis password, writes the connection strings, builds, starts). Use it after you've filled the API keys (Part 1) and pointed DNS (Part 2.1). Jump to **Part 6**.
- **Manual path** — Parts 3–8 do every step by hand so you understand and control each piece. Recommended reading even if you use the script.

---

## Part 1 — Get your API keys and accounts (do this first, ~15 min)

You'll paste these into a file called `.env.local` in Part 7. Collect them now.

### 1.1 Solana RPC — **use Helius** (most important)

The app needs an RPC endpoint to read/write the Solana chain. **Do not use the
public `https://api.mainnet-beta.solana.com`** — it's rate‑limited and will fail
under real traffic. Use Helius (the app has built‑in Helius support for holder
counts).

**Where to go & what to do:**
1. Go to **https://helius.dev** → **Sign up** (free).
2. In the dashboard open **Endpoints** (or "API Keys").
3. You'll get a **mainnet RPC URL** that looks like:
   `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY_HERE`
4. Create **two** keys (Helius lets you add multiple, each with its own settings):
   - **Server key** → used for `SOLANA_RPC_URL`. Leave it **unrestricted** (it's only used server‑side, never exposed).
   - **Browser key** → used for `NEXT_PUBLIC_RPC_URL`. In its settings add an **Allowed Origin / domain restriction** = `https://solanatoken.dravyo.com`. This key ships to the browser, so the restriction stops anyone else from using it.
5. The **key string itself** (the part after `api-key=`) is your `HELIUS_API_KEY` (used for holder‑count lookups).

**Free tier** (~1M credits/month) is enough to launch. Upgrade (~$49/mo) when traffic grows.

**Alternatives** (only if you prefer): QuickNode, Triton (`*.rpcpool.com`), Alchemy.
They work, but holder counts need Helius. If you use a different provider whose
host isn't `*.solana.com / *.helius-rpc.com / *.rpcpool.com`, also set
`CSP_CONNECT_SRC_EXTRA` (see Part 7) so the browser's security policy allows it.

### 1.2 Pinata — IPFS for token logos (required for logo uploads)

1. Go to **https://pinata.cloud** → **Sign up** (free tier = 1 GB).
2. **API Keys** → **New Key** → enable the **Files / pinFileToIPFS** scope (or Admin) → **Create**.
3. Copy the long **JWT** token it shows (starts with `eyJ...`). That's your `PINATA_JWT`.

### 1.3 Birdeye — price/market data (optional)

1. Go to **https://birdeye.so** → developer / **Data Services** portal → get an API key.
2. That's `BIRDEYE_API_KEY`. **Optional** — without it, price/volume/liquidity show as "—" and everything else still works.

### 1.4 Fee wallet — where your platform fees land

`FEE_WALLET_ADDRESS` is the **public key** (the address, starts like `7xK...`) of a
wallet **you** control — ideally a **hardware wallet** (Ledger). Every paid action
(create token, etc.) sends the platform fee here.
**Never** put a wallet's seed phrase or private key on the server — only the public address.

### 1.5 Two random secrets

On any machine with `openssl` (your laptop or the VPS), run this **twice**:
```bash
openssl rand -hex 32
```
Use one output for `WEBHOOK_AUTH_SECRET` and the other for `CRON_SECRET`.

---

## Part 2 — Domain and server

### 2.1 Point the subdomain at your VPS (DNS)

In the DNS panel for **dravyo.com**, add one **A record**:

| Type | Host / Name | Value |
|---|---|---|
| A | `solanatoken` | your VPS public IP (e.g. `203.0.113.10`) |

That makes `solanatoken.dravyo.com` resolve to your server. No `www` record is
needed (it's a subdomain). Check from your laptop:
```bash
nslookup solanatoken.dravyo.com
```
DNS can take minutes to a few hours. Start it now; it only needs to resolve by Part 9 (HTTPS).

### 2.2 Log into the VPS

```bash
ssh youruser@YOUR_VPS_IP
```
If you only have `root`, create a normal sudo user (the scripts use `sudo`):
```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy   # copy your SSH key
# then log out and back in as: ssh deploy@YOUR_VPS_IP
```

---

## Part 3 — Base software (Node, pnpm, pm2)

```bash
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
node -v            # expect v20.x

# pnpm (via corepack) + pm2 process manager
sudo corepack enable
sudo npm install -g pm2
```

Firewall — open only SSH and web; **Postgres (5432) and Redis (6379) stay closed**
(the app reaches them over localhost):
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

---

## Part 4 — Self‑hosted PostgreSQL (in detail)

The app stores fee/accounting records and a page cache here. On mainnet this is
**required** (without it, real fees go unrecorded).

### 4.1 Install and start

```bash
sudo apt-get install -y postgresql postgresql-client
sudo systemctl enable --now postgresql
```

### 4.2 Create the database user and database

Pick a strong password (replace `CHANGE_ME_DB_PASS` below with your own, e.g. the
output of `openssl rand -hex 16`):

```bash
sudo -u postgres psql <<'SQL'
CREATE ROLE solana_token WITH LOGIN PASSWORD 'CHANGE_ME_DB_PASS';
CREATE DATABASE solana_token OWNER solana_token;
GRANT ALL PRIVILEGES ON DATABASE solana_token TO solana_token;
SQL
```

### 4.3 Your connection string

This is the value you'll put in `.env.local` as `DATABASE_URL`:
```
postgresql://solana_token:CHANGE_ME_DB_PASS@localhost:5432/solana_token
```
Format: `postgresql://USER:PASSWORD@HOST:PORT/DBNAME`. Test it:
```bash
psql "postgresql://solana_token:CHANGE_ME_DB_PASS@localhost:5432/solana_token" -c "SELECT 1;"
# expect a row with "1"
```

### 4.4 Create the tables

From the project folder (after Part 6 clone), apply the schema:
```bash
psql "$DATABASE_URL" -f db/schema.sql       # tokens, fee_events
psql "$DATABASE_URL" -f db/002_phase2.sql   # token_cache (+ unused table, harmless)
# Do NOT run db/migrations/002_multisend_journal.sql — it conflicts and is unused.
psql "$DATABASE_URL" -c "\dt"               # verify: tokens, fee_events, token_cache
```

### 4.5 Security

PostgreSQL listens on `localhost` only by default (`listen_addresses = 'localhost'`
in `/etc/postgresql/*/main/postgresql.conf`) — keep it that way and **do not** open
port 5432 in the firewall. The app connects via `localhost`, so nothing external
can reach the DB.

---

## Part 5 — Self‑hosted Redis (in detail)

Redis powers rate limiting and caching. On mainnet it's **required** — without it,
rate limiting "fails open" (no protection).

### 5.1 Install

```bash
sudo apt-get install -y redis-server
```

### 5.2 Set a password and lock to localhost

Edit `/etc/redis/redis.conf` (e.g. `sudo nano /etc/redis/redis.conf`) and ensure:
```conf
bind 127.0.0.1 ::1
protected-mode yes
requirepass CHANGE_ME_REDIS_PASS
```
(`bind 127.0.0.1 ::1` and `protected-mode yes` are the defaults; you mainly need to
set `requirepass`.) Then:
```bash
sudo systemctl enable redis-server
sudo systemctl restart redis-server
```

### 5.3 Your connection string

This is the `REDIS_URL` for `.env.local`:
```
redis://default:CHANGE_ME_REDIS_PASS@localhost:6379
```
Format: `redis://default:PASSWORD@HOST:PORT`. Test it:
```bash
redis-cli -a CHANGE_ME_REDIS_PASS ping     # expect: PONG
```

### 5.4 Security

Same as Postgres — Redis is bound to localhost and **port 6379 is not opened** in
the firewall. Only the app (on the same box) can reach it.

---

## Part 6 — Get the code onto the server ("where to upload")

The code lives on GitHub. "Uploading" to the server = cloning it there:
```bash
sudo mkdir -p /var/www && sudo chown $USER:$USER /var/www
cd /var/www
git clone https://github.com/sumandada362/sol_token.git solana-token
cd solana-token
pnpm install --frozen-lockfile
```
Later, when you change code: commit + push from your machine, then on the server
`git pull` (Part 10).

---

## Part 7 — Configure `.env.local` (what to change — every variable)

```bash
cp .env.mainnet.example .env.local
nano .env.local
```
Fill it in using this table. **Bold = you must change.** The rest are already
correct for your setup.

| Variable | What to set it to | From |
|---|---|---|
| `SOLANA_RPC_URL` | **your Helius server RPC URL** (`https://mainnet.helius-rpc.com/?api-key=...`) | Part 1.1 |
| `NEXT_PUBLIC_RPC_URL` | **your Helius browser RPC URL** (domain‑restricted key) | Part 1.1 |
| `NEXT_PUBLIC_SOLANA_NETWORK` | `mainnet-beta` | (already set) |
| `CSP_CONNECT_SRC_EXTRA` | leave empty (only needed for a non‑Helius RPC host) | Part 1.1 |
| `HELIUS_API_KEY` | **your Helius key string** | Part 1.1 |
| `BIRDEYE_API_KEY` | **your Birdeye key**, or leave empty | Part 1.3 |
| `NEXT_PUBLIC_APP_URL` | `https://solanatoken.dravyo.com` | (already set) |
| `FEE_WALLET_ADDRESS` | **your hardware‑wallet public address** | Part 1.4 |
| `PINATA_JWT` | **your Pinata JWT** | Part 1.2 |
| `DATABASE_URL` | **`postgresql://solana_token:CHANGE_ME_DB_PASS@localhost:5432/solana_token`** | Part 4.3 |
| `PG_POOL_MAX` | `10` | (already set) |
| `REDIS_URL` | **`redis://default:CHANGE_ME_REDIS_PASS@localhost:6379`** | Part 5.3 |
| `WEBHOOK_AUTH_SECRET` | **`openssl rand -hex 32` output** | Part 1.5 |
| `CRON_SECRET` | **`openssl rand -hex 32` output** | Part 1.5 |

Save: `Ctrl+O`, Enter, `Ctrl+X`.

> If you used `scripts/vps-bootstrap.sh`, it already filled `DATABASE_URL` and
> `REDIS_URL` for you — leave those two as the script set them.

> **Important:** anything starting with `NEXT_PUBLIC_` is baked into the build, so
> if you change one you must rebuild (Part 8 / `./scripts/deploy.sh`), not just restart.

---

## Part 8 — Build and start the app

The repo includes `scripts/deploy.sh`, which **validates your env** (refuses to
build if any key is still a placeholder), builds, and starts/restarts under pm2:

```bash
./scripts/deploy.sh --migrate   # --migrate also applies the DB schema (Part 4.4)
```

What it does: `pnpm install` → checks every required env var is real → `pnpm build`
(bakes in `NEXT_PUBLIC_*` and the CSP) → starts pm2 process `solana-token` on port
3333. After this the app is live on `http://127.0.0.1:3333` (not yet public — nginx
is next).

Manual equivalent if you prefer:
```bash
pnpm build
pm2 start "pnpm start" --name solana-token
pm2 save
pm2 startup        # run the command it prints so it survives reboots
```

---

## Part 9 — nginx reverse proxy + HTTPS

### 9.1 Create the site (coexists with your other sites)

```bash
sudo apt-get install -y nginx
sudo tee /etc/nginx/sites-available/solana-token >/dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name solanatoken.dravyo.com;
    location / {
        proxy_pass http://127.0.0.1:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
sudo ln -sf /etc/nginx/sites-available/solana-token /etc/nginx/sites-enabled/solana-token
sudo nginx -t && sudo systemctl reload nginx
```

**Why this is safe next to other apps on the same nginx:**
- The block has **no `default_server`**, so it only answers for `solanatoken.dravyo.com` and never steals other domains' traffic.
- It uses a **unique config name** (`solana-token`) and **unique port** (3333) — no clashes. (If another app already uses 3333, change `next start -p 3333` in `package.json` and the `proxy_pass` port to match.)
- We **do not remove the default site or any other vhost**, and use `reload` (not `restart`) so your other sites keep serving.

### 9.2 Enable HTTPS (after DNS from Part 2.1 resolves)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d solanatoken.dravyo.com
```
Choose **redirect HTTP → HTTPS**. Certbot edits only your block and auto‑renews.
(No `www` for a subdomain.) The app already sends HSTS/CSP/X‑Frame headers — nginx
just passes them through; don't add your own.

---

## Part 10 — Verify it's live

```bash
# security headers + TLS
curl -sI https://solanatoken.dravyo.com | grep -iE "strict-transport|content-security|x-frame"

# all pages return 200
BASE_URL=https://solanatoken.dravyo.com node scripts/smoke-pages.mjs

# rate limiting works (proves Redis) — the last line should be 429
for i in $(seq 1 21); do curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://solanatoken.dravyo.com/api/tx/create-token -H 'content-type: application/json' \
  -H 'sec-fetch-site: same-origin' --data '{}'; done | tail -3
```
Then the **real test**: open the site, connect a funded mainnet wallet, create one
token, and confirm a row landed (proves Postgres + fee accounting):
```bash
psql "$DATABASE_URL" -c "SELECT action, lamports, signature FROM fee_events ORDER BY created_at DESC LIMIT 5;"
```

---

## Part 11 — Updating later

```bash
cd /var/www/solana-token
git pull
./scripts/deploy.sh            # validate env → rebuild → pm2 restart
./scripts/deploy.sh --migrate  # add --migrate only when the DB schema changed
```

---

## Part 12 — Troubleshooting

| Symptom | Fix |
|---|---|
| `deploy.sh` exits red naming a variable | That env var still has a placeholder — fix it in `.env.local`, re‑run. |
| App boots then crashes with `[guardrail]` | `NEXT_PUBLIC_SOLANA_NETWORK` and `SOLANA_RPC_URL` disagree (e.g. mainnet vs devnet). Make both mainnet. |
| Wallet can't connect / RPC errors in browser | `NEXT_PUBLIC_RPC_URL` wrong, or its domain restriction doesn't include `solanatoken.dravyo.com`, or you changed it without rebuilding. |
| 502 Bad Gateway from nginx | App not running on 3333 — `pm2 status`, `pm2 logs solana-token`. |
| `/api/confirm` returns `recorded:false` | Postgres unreachable — check `DATABASE_URL` and `psql` test (Part 4.3). On mainnet this is a launch blocker. |
| Rate‑limit test never returns 429 | Redis unreachable — check `REDIS_URL` and `redis-cli -a ... ping`. |
| certbot fails | DNS for `solanatoken.dravyo.com` not resolving to this server yet (Part 2.1). |

Logs: `pm2 logs solana-token` · DB: `sudo journalctl -u postgresql` · Redis: `sudo journalctl -u redis-server` · nginx: `sudo tail -f /var/log/nginx/error.log`.

---

## Quick reference

| Item | Value |
|---|---|
| URL | https://solanatoken.dravyo.com |
| App port | 3333 (pm2 process `solana-token`) |
| nginx site file | `/etc/nginx/sites-available/solana-token` |
| Postgres | role+db `solana_token` @ `localhost:5432` |
| Redis | `localhost:6379` (password‑protected) |
| Env file | `/var/www/solana-token/.env.local` (never commit it) |
| Restart app | `pm2 restart solana-token` |
| Update | `git pull && ./scripts/deploy.sh` |

For background, the security model, and incident runbooks, see
[docs/deployment-mainnet.md](docs/deployment-mainnet.md) and [docs/runbooks/](docs/runbooks/).
