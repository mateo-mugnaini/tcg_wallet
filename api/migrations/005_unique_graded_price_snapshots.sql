-- Migration: prevent exact duplicate graded price snapshots

CREATE UNIQUE INDEX IF NOT EXISTS uq_graded_card_prices_snapshot
  ON graded_card_prices (
    card_id,
    grading_company_id,
    grade,
    price,
    currency,
    source,
    recorded_at
  );

-- Rollback:
-- DROP INDEX IF EXISTS uq_graded_card_prices_snapshot;
