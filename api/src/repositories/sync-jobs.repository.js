import pool from "../config/database.js";

function toIso(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function mapJob(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    type: row.type,
    status: row.status,
    attempts: row.attempts,
    queuedAt: toIso(row.queued_at),
    startedAt: toIso(row.started_at),
    finishedAt: toIso(row.finished_at),
    durationMs: row.duration_ms,
    result: row.result,
    error: row.error_code
      ? { code: row.error_code, message: row.error_message }
      : null,
  };
}

export async function createSyncJob({ id, type }) {
  try {
    const result = await pool.query(
      `
        INSERT INTO sync_jobs (id, type)
        VALUES ($1, $2)
        RETURNING *
      `,
      [id, type],
    );

    return mapJob(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      const conflict = new Error("Ya existe un job de sincronización en ejecución");
      conflict.code = "SYNC_JOB_IN_PROGRESS";
      conflict.statusCode = 409;
      throw conflict;
    }

    throw error;
  }
}

export async function findSyncJobById(id) {
  const result = await pool.query("SELECT * FROM sync_jobs WHERE id = $1", [id]);
  return mapJob(result.rows[0]);
}

export async function listSyncJobs(limit = 50) {
  const result = await pool.query(
    `
      SELECT *
      FROM sync_jobs
      ORDER BY queued_at DESC
      LIMIT $1
    `,
    [limit],
  );

  return result.rows.map(mapJob);
}

export async function findActiveSyncJob() {
  const result = await pool.query(
    `
      SELECT *
      FROM sync_jobs
      WHERE status IN ('queued', 'running')
      ORDER BY queued_at ASC
      LIMIT 1
    `,
  );

  return mapJob(result.rows[0]);
}

export async function claimNextSyncJob(workerId) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
        SELECT id
        FROM sync_jobs
        WHERE status = 'queued'
        ORDER BY queued_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      `,
    );

    if (result.rows.length === 0) {
      await client.query("COMMIT");
      return null;
    }

    const claimed = await client.query(
      `
        UPDATE sync_jobs
        SET status = 'running',
            attempts = attempts + 1,
            started_at = NOW(),
            worker_id = $2
        WHERE id = $1
        RETURNING *
      `,
      [result.rows[0].id, workerId],
    );

    await client.query("COMMIT");
    return mapJob(claimed.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function completeSyncJob(
  id,
  { status, durationMs, result = null, error = null },
) {
  const query = `
    UPDATE sync_jobs
    SET status = $2,
        finished_at = NOW(),
        duration_ms = $3,
        result = $4,
        error_code = $5,
        error_message = $6
    WHERE id = $1
    RETURNING *
  `;

  const values = [
    id,
    status,
    durationMs,
    result,
    error?.code ?? null,
    error?.message ?? null,
  ];

  const response = await pool.query(query, values);
  return mapJob(response.rows[0]);
}

export async function requeueStaleSyncJobs(staleMinutes = 60) {
  const result = await pool.query(
    `
      UPDATE sync_jobs
      SET status = 'queued',
          started_at = NULL,
          worker_id = NULL
      WHERE status = 'running'
        AND started_at < NOW() - ($1 * INTERVAL '1 minute')
    `,
    [staleMinutes],
  );

  return result.rowCount;
}
