-- TCG Wallet API
-- Migration: critical read indexes
-- Evidence: db:explain on 2026-08-16 showed sequential scans on
-- collection_items.user_id and graded_card_prices.card_id.

CREATE INDEX IF NOT EXISTS idx_collection_items_user_created_at
  ON collection_items (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_graded_card_prices_card_grading_grade_recorded_at
  ON graded_card_prices (
    card_id,
    grading_company_id,
    grade,
    recorded_at DESC
  );

-- Rollback (execute separately if required):
-- DROP INDEX IF EXISTS idx_collection_items_user_created_at;
-- DROP INDEX IF EXISTS idx_graded_card_prices_card_grading_grade_recorded_at;
