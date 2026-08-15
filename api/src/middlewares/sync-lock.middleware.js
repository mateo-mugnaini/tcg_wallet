import pool from "../config/database.js";
import { createAppError } from "../errors/app.errors.js";

const ACTIVE_SYNC_LOCKS = new Set();
const POKEMON_SYNC_LOCK = "pokemon-sync";

/*
 * Lock local para fallar rápido y advisory lock de PostgreSQL para coordinar
 * múltiples instancias del backend.
 */
export async function syncExecutionLock(req, res, next) {
  if (ACTIVE_SYNC_LOCKS.has(POKEMON_SYNC_LOCK)) {
    return next(
      createAppError(
        "Ya existe una sincronización en ejecución",
        409,
        "SYNC_IN_PROGRESS",
      ),
    );
  }

  let client;
  let databaseLockAcquired = false;

  try {
    client = await pool.connect();

    const result = await client.query(
      "SELECT pg_try_advisory_lock(hashtext($1)) AS acquired",
      [POKEMON_SYNC_LOCK],
    );

    databaseLockAcquired = result.rows[0]?.acquired === true;

    if (!databaseLockAcquired) {
      client.release();

      return next(
        createAppError(
          "Ya existe una sincronización en ejecución",
          409,
          "SYNC_IN_PROGRESS",
        ),
      );
    }

    ACTIVE_SYNC_LOCKS.add(POKEMON_SYNC_LOCK);

    let released = false;

    const releaseLock = async () => {
      if (released) {
        return;
      }

      released = true;
      ACTIVE_SYNC_LOCKS.delete(POKEMON_SYNC_LOCK);

      try {
        await client.query("SELECT pg_advisory_unlock(hashtext($1))", [
          POKEMON_SYNC_LOCK,
        ]);
      } finally {
        client.release();
      }
    };

    const releaseOnResponseEnd = () => {
      releaseLock().catch((error) => {
        console.error("Failed to release sync advisory lock", error);
      });
    };

    res.once("finish", releaseOnResponseEnd);
    res.once("close", releaseOnResponseEnd);

    try {
      next();
    } catch (error) {
      await releaseLock();
      next(error);
    }
  } catch (error) {
    if (client && !databaseLockAcquired) {
      client.release();
    }

    next(
      createAppError(
        "No se pudo adquirir el lock de sincronización",
        503,
        "SYNC_LOCK_UNAVAILABLE",
        { originalError: error?.message },
      ),
    );
  }
}
