-- Phase 2 schema — run after 001_phase1.sql (db/schema.sql).
-- Only includes tables for features live in production.

-- Read-through cache for token_page data (security checker: authorities + holders + market)
create table if not exists token_cache (
  mint        text         primary key,
  data        jsonb        not null,
  updated_at  timestamptz  not null default now()
);

-- Multisend journal — one row per batch, keyed on upload_hash for resumability
create table if not exists multisend_batches (
  upload_hash  text         not null,
  batch_index  int          not null,
  status       text         not null default 'pending',
  signature    text,
  created_at   timestamptz  not null default now(),
  primary key (upload_hash, batch_index)
);
