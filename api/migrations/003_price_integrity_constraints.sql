-- TCG Wallet API
-- Migration: price and graded-value integrity constraints
-- Preflight: db:check:data reported no incompatible rows before applying.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_card_prices_non_negative'
  ) THEN
    ALTER TABLE card_prices
      ADD CONSTRAINT chk_card_prices_non_negative CHECK (price >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_graded_card_prices_non_negative'
  ) THEN
    ALTER TABLE graded_card_prices
      ADD CONSTRAINT chk_graded_card_prices_non_negative CHECK (price >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_graded_card_prices_grade'
  ) THEN
    ALTER TABLE graded_card_prices
      ADD CONSTRAINT chk_graded_card_prices_grade CHECK (grade >= 0 AND grade <= 10);
  END IF;
END
$$;

-- Rollback:
-- ALTER TABLE card_prices DROP CONSTRAINT IF EXISTS chk_card_prices_non_negative;
-- ALTER TABLE graded_card_prices DROP CONSTRAINT IF EXISTS chk_graded_card_prices_non_negative;
-- ALTER TABLE graded_card_prices DROP CONSTRAINT IF EXISTS chk_graded_card_prices_grade;
