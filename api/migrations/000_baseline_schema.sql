-- TCG Wallet API
-- Migration: baseline schema for clean environments
-- The development database predates the migration runner. IF NOT EXISTS keeps
-- this migration safe for databases that already contain the baseline tables.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  role VARCHAR(20) NOT NULL DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS tcgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grading_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tcg_id UUID NOT NULL REFERENCES tcgs(id),
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50),
  release_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  external_id VARCHAR(100),
  CONSTRAINT sets_tcg_external_id_unique UNIQUE (tcg_id, external_id)
);

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES sets(id),
  external_id VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  card_number VARCHAR(50),
  rarity VARCHAR(100),
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT cards_set_id_external_id_unique UNIQUE (set_id, external_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  token_family_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS card_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id),
  condition VARCHAR(50) NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  currency CHAR(3) NOT NULL,
  source VARCHAR(100) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS collection_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  card_id UUID NOT NULL REFERENCES cards(id),
  quantity INTEGER NOT NULL,
  condition VARCHAR(50) NOT NULL,
  is_graded BOOLEAN NOT NULL DEFAULT FALSE,
  grading_company_id UUID REFERENCES grading_companies(id),
  grade NUMERIC(3, 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_collection_quantity CHECK (quantity > 0),
  CONSTRAINT chk_collection_grade CHECK (grade IS NULL OR (grade >= 0 AND grade <= 10)),
  CONSTRAINT chk_collection_grading CHECK (
    (is_graded = FALSE AND grading_company_id IS NULL AND grade IS NULL)
    OR (is_graded = TRUE AND grading_company_id IS NOT NULL AND grade IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS graded_card_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id),
  grading_company_id UUID NOT NULL REFERENCES grading_companies(id),
  grade NUMERIC(3, 1) NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  currency CHAR(3) NOT NULL,
  source VARCHAR(100) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash
  ON refresh_tokens (token_hash);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id
  ON refresh_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_card_prices_card_condition_source
  ON card_prices (card_id, condition, source);

-- Rollback for a clean environment only: drop dependent tables in reverse order.
-- DROP TABLE IF EXISTS graded_card_prices, collection_items, card_prices,
--   refresh_tokens, cards, sets, grading_companies, tcgs, users;
