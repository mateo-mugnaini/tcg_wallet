-- Migration: register PSA as a supported grading company
-- The unique constraint on grading_companies.name makes this idempotent.

INSERT INTO grading_companies (name)
VALUES ('PSA')
ON CONFLICT (name) DO NOTHING;

-- Rollback:
-- DELETE FROM grading_companies
-- WHERE name = 'PSA'
--   AND NOT EXISTS (
--     SELECT 1 FROM collection_items
--     WHERE grading_company_id = grading_companies.id
--   )
--   AND NOT EXISTS (
--     SELECT 1 FROM graded_card_prices
--     WHERE grading_company_id = grading_companies.id
--   );
