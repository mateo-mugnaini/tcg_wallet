CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('sets', 'cards', 'prices', 'pipeline')),
  status VARCHAR(20) NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'running', 'succeeded', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  queued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  result JSONB,
  error_code VARCHAR(100),
  error_message TEXT,
  worker_id VARCHAR(128)
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_status_queued_at
  ON sync_jobs (status, queued_at ASC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_jobs_one_active
  ON sync_jobs ((1))
  WHERE status IN ('queued', 'running');

-- Rollback manual:
-- DROP INDEX IF EXISTS idx_sync_jobs_one_active;
-- DROP INDEX IF EXISTS idx_sync_jobs_status_queued_at;
-- DROP TABLE IF EXISTS sync_jobs;
