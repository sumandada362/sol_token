-- Phase 1 schema — run once against your Postgres database (Supabase / Neon).
-- Rows are written ONLY after on-chain confirmation (verified via RPC in /api/confirm).

create table if not exists tokens (
  mint             text primary key,
  creator_wallet   text        not null,
  name             text,
  symbol           text,
  metadata_uri     text,
  standard         text        default 'spl',
  fee_paid_lamports bigint,
  tx_signature     text,
  created_at       timestamptz default now()
);

create index if not exists tokens_creator_wallet_idx on tokens (creator_wallet);

create table if not exists fee_events (
  id          bigserial   primary key,
  wallet      text        not null,
  action      text        not null,
  lamports    bigint,
  signature   text        not null unique,
  mint        text,
  created_at  timestamptz default now()
);

create index if not exists fee_events_wallet_idx on fee_events (wallet);
create index if not exists fee_events_mint_idx   on fee_events (mint);
