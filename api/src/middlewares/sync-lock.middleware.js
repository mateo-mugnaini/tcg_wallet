import { createAppError } from "../errors/app.errors.js";

const ACTIVE_SYNC_LOCKS = new Set();
const POKEMON_SYNC_LOCK = "pokemon-sync";

/*
 * Lock por proceso para evitar que dos requests de la misma instancia
 * ejecuten simultáneamente una sincronización costosa.
 *
 * La coordinación entre múltiples instancias requiere un lock compartido
 * en PostgreSQL, Redis o un job runner y queda fuera de este middleware.
 */
export function syncExecutionLock(req, res, next) {
  if (ACTIVE_SYNC_LOCKS.has(POKEMON_SYNC_LOCK)) {
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

  const releaseLock = () => {
    if (released) {
      return;
    }

    released = true;
    ACTIVE_SYNC_LOCKS.delete(POKEMON_SYNC_LOCK);
  };

  res.once("finish", releaseLock);
  res.once("close", releaseLock);

  try {
    next();
  } catch (error) {
    releaseLock();
    next(error);
  }
}
