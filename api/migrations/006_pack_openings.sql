-- Virtual Pokémon pack openings and their configurable rarity rules.

CREATE TABLE IF NOT EXISTS pack_rarity_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id UUID NOT NULL REFERENCES sets(id) ON DELETE CASCADE,
  rarity_key VARCHAR(50) NOT NULL,
  weight NUMERIC(12, 4) NOT NULL CHECK (weight > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pack_rarity_rules_set_rarity_unique UNIQUE (set_id, rarity_key)
);

CREATE INDEX IF NOT EXISTS idx_pack_rarity_rules_set_id
  ON pack_rarity_rules (set_id);

CREATE TABLE IF NOT EXISTS pack_opening_cooldowns (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  next_open_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pack_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  set_id UUID NOT NULL REFERENCES sets(id),
  pack_quantity SMALLINT NOT NULL CHECK (pack_quantity BETWEEN 1 AND 10),
  total_cards SMALLINT NOT NULL CHECK (total_cards BETWEEN 5 AND 50),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pack_openings_user_opened_at
  ON pack_openings (user_id, opened_at DESC);

CREATE TABLE IF NOT EXISTS pack_opening_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_id UUID NOT NULL REFERENCES pack_openings(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id),
  pack_number SMALLINT NOT NULL CHECK (pack_number BETWEEN 1 AND 10),
  slot_number SMALLINT NOT NULL CHECK (slot_number BETWEEN 1 AND 5),
  rarity_key VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pack_opening_cards_slot_unique
    UNIQUE (opening_id, pack_number, slot_number)
);

CREATE INDEX IF NOT EXISTS idx_pack_opening_cards_opening_id
  ON pack_opening_cards (opening_id);

CREATE INDEX IF NOT EXISTS idx_pack_opening_cards_card_id
  ON pack_opening_cards (card_id);

-- Defaults make every existing set playable immediately. New sets use the same
-- defaults in the service until an admin configures custom rules.
INSERT INTO pack_rarity_rules (set_id, rarity_key, weight)
SELECT s.id, rules.rarity_key, rules.weight
FROM sets s
CROSS JOIN (
  VALUES
    ('common', 60::numeric),
    ('uncommon', 25::numeric),
    ('rare', 10::numeric),
    ('holo_rare', 4::numeric),
    ('ultra_rare', 1::numeric)
) AS rules(rarity_key, weight)
ON CONFLICT (set_id, rarity_key) DO NOTHING;

-- Rollback:
-- DROP TABLE IF EXISTS pack_opening_cards, pack_openings,
--   pack_opening_cooldowns, pack_rarity_rules;
