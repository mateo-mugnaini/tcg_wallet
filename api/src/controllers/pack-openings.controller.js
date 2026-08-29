import {
  getOpeningStatus,
  getPokedex,
  openPacks,
} from "../services/pack-openings.service.js";

export async function openPacksController(req, res, next) {
  try {
    const result = await openPacks({
      userId: req.user.id,
      setId: req.validated.params.id,
      quantity: req.validated.body.quantity,
    });

    return res.status(201).json({ data: result });
  } catch (error) {
    return next(error);
  }
}

export async function getOpeningStatusController(req, res, next) {
  try {
    const result = await getOpeningStatus(req.user.id);
    return res.status(200).json({ data: result });
  } catch (error) {
    return next(error);
  }
}

export async function getPokedexController(req, res, next) {
  try {
    const result = await getPokedex({
      userId: req.user.id,
      setId: req.validated.params.id,
    });

    return res.status(200).json({ data: result });
  } catch (error) {
    return next(error);
  }
}
