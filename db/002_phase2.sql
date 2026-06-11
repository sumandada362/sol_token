-- Phase 2 schema — run after 001_phase1.sql
-- Tables: subscriptions, token_events, token_metrics_hourly, holder_snapshots, token_cache

create table if not exists subscriptions (
  id           bigserial    primary key,
  mint         text         not null,
  wallet       text         not null,
  paid_signature text       not null unique,
  starts_at    timestamptz  not null default now(),
  expires_at   timestamptz  not null
);

create index if not exists subscriptions_mint_wallet_idx    on subscriptions (mint, wallet);
create index if not exists subscriptions_expires_at_idx     on subscriptions (expires_at);
create index if not exists subscriptions_paid_signature_idx on subscriptions (paid_signature);

create table if not exists token_events (
  signature  text         primary key,
  mint       text         not null,
  kind       text         not null,
  amount     numeric,
  ts         timestamptz  not null,
  raw        jsonb
);

create index if not exists token_events_mint_ts_idx on token_events (mint, ts);

create table if not exists token_metrics_hourly (
  mint       text         not null,
  bucket     timestamptz  not null,
  price      numeric,
  volume     numeric,
  liquidity  numeric,
  holders    int,
  tx_count   int,
  buys       int,
  sells      int,
  primary key (mint, bucket)
);

create index if not exists token_metrics_mint_bucket_idx on token_metrics_hourly (mint, bucket desc);

create table if not exists holder_snapshots (
  mint        text  not null,
  day         date  not null,
  holders     int,
  top10_pct   numeric,
  primary key (mint, day)
);

-- Read-through cache for token_page data (authorities + holders + market)
create table if not exists token_cache (
  mint        text         primary key,
  data        jsonb        not null,
  updated_at  timestamptz  not null default now()
);

-- Auth nonces for analytics paywall (single-use, 5-min TTL)
create table if not exists auth_nonces (
  nonce      text         primary key,
  wallet     text         not null,
  expires_at timestamptz  not null
);

create index if not exists auth_nonces_expires_idx on auth_nonces (expires_at);

-- Multisend journal rows — one row per batch, keyed on upload_hash
create table if not exists multisend_batches (
  upload_hash  text         not null,
  batch_index  int          not null,
  status       text         not null default 'pending',
  signature    text,
  created_at   timestamptz  not null default now(),
  primary key (upload_hash, batch_index)
);
