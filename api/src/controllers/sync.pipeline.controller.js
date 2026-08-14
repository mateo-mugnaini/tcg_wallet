import { syncPokemonPipeline } from "../syncs/sync.pipeline.service.js";

/* ====================================
        RUN SYNC PIPELINE
==================================== */

export async function runSyncPipelineController(req, res, next) {
  try {
    const result = await syncPokemonPipeline();

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
