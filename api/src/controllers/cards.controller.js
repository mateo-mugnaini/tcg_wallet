import {
  getCards,
  editCard,
  removeCard,
  getCardById,
  registerCard,
} from "../services/cards.service.js";
import { syncPokemonCards } from "../syncs/cards.sync.service.js";
/* ==================================== LISTAR CARDS ==================================== */ export async function getCardsController(
  req,
  res,
  next,
) {
  try {
    const {
      setId,
      tcgId,
      search,
      rarity,
      cardNumber,
      externalId,
      page,
      limit,
      sortBy,
      sortOrder,
    } =
      req.validated.query;
    const result = await getCards({
      setId,
      tcgId,
      search,
      rarity,
      cardNumber,
      externalId,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
/* ==================================== OBTENER CARD POR ID ==================================== */ export async function getCardByIdController(
  req,
  res,
  next,
) {
  try {
    const { id } = req.validated.params;
    const card = await getCardById(id, req.user.id);
    return res.status(200).json({ data: card });
  } catch (error) {
    next(error);
  }
}
/* ==================================== CREAR CARD ==================================== */ export async function createCardController(
  req,
  res,
  next,
) {
  try {
    const { setId, externalId, name, cardNumber, rarity, imageUrl } =
      req.validated.body;
    const card = await registerCard({
      setId,
      externalId,
      name,
      cardNumber,
      rarity,
      imageUrl,
    });
    return res.status(201).json({ data: card });
  } catch (error) {
    next(error);
  }
}
/* ==================================== ACTUALIZAR CARD ==================================== */ export async function updateCardController(
  req,
  res,
  next,
) {
  try {
    const { id } = req.validated.params;
    const { setId, externalId, name, cardNumber, rarity, imageUrl } =
      req.validated.body;
    const card = await editCard(id, {
      setId,
      externalId,
      name,
      cardNumber,
      rarity,
      imageUrl,
    });
    return res.status(200).json({ data: card });
  } catch (error) {
    next(error);
  }
}
/* ==================================== ELIMINAR CARD ==================================== */ export async function deleteCardController(
  req,
  res,
  next,
) {
  try {
    const { id } = req.validated.params;
    const card = await removeCard(id);
    return res.status(200).json({ data: card });
  } catch (error) {
    next(error);
  }
}

/* ====================================
        SINCRONIZAR CARDS POKÉMON
==================================== */

export async function syncPokemonCardsController(req, res, next) {
  try {
    const result = await syncPokemonCards();

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
