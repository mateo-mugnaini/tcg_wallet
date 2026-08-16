/**
 * Compatibility export for consumers that still import the old service path.
 *
 * The active implementation lives under `src/syncs`, alongside the other
 * synchronization services. Keeping this shim avoids a breaking import while
 * ensuring there is only one pipeline implementation to maintain.
 */
export { syncPokemonPipeline } from "../syncs/sync.pipeline.service.js";
