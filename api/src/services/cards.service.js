import {
  findCards,
  countCards,
  createCard,
  updateCard,
  deleteCard,
  findCardById,
  findCardByName,
  findCardByExternalId,
} from "../repositories/cards.repository.js";
import { findSetById } from "../repositories/sets.repository.js";
import { createAppError } from "../errors/app.errors.js";
/* ==================================== OBTENER CARD POR ID ==================================== */ export async function getCardById(
  id,
) {
  const card = await findCardById(id);
  if (!card) {
    throw createAppError("Card no encontrada", 404);
  }
  return card;
}
/* ==================================== LISTAR CARDS ==================================== */ export async function getCards({
  setId,
  search,
  page = 1,
  limit = 10,
  sortBy = "created_at",
  sortOrder = "DESC",
}) {
  /* * Normalizamos la paginación. * * Esto evita que undefined, strings * inválidos o NaN lleguen al repository. */ const normalizedPage =
    Number(page);
  const normalizedLimit = Number(limit);
  if (!Number.isInteger(normalizedPage) || normalizedPage < 1) {
    throw createAppError(
      "La página debe ser un número entero mayor o igual a 1",
      400,
    );
  }
  if (
    !Number.isInteger(normalizedLimit) ||
    normalizedLimit < 1 ||
    normalizedLimit > 100
  ) {
    throw createAppError(
      "El límite debe ser un número entero entre 1 y 100",
      400,
    );
  }
  /* * Si se proporciona un Set, * comprobamos que exista. */ if (setId) {
    const set = await findSetById(setId);
    if (!set) {
      throw createAppError("Set no encontrado", 404);
    }
  }
  /* * Calculamos el offset. */ const offset =
    (normalizedPage - 1) * normalizedLimit;
  /* * Ejecutamos ambas consultas en paralelo. * * Una obtiene los registros. * La otra obtiene el total. */ const [
    cards,
    total,
  ] = await Promise.all([
    findCards({
      setId,
      search,
      limit: normalizedLimit,
      offset,
      sortBy,
      sortOrder,
    }),
    countCards({ setId, search }),
  ]);
  /* * Calculamos las páginas totales. */ const totalPages =
    total === 0 ? 0 : Math.ceil(total / normalizedLimit);
  return {
    data: cards,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      total,
      totalPages,
    },
  };
}
/* ==================================== CREAR CARD ==================================== */ export async function registerCard({
  setId,
  externalId,
  name,
  cardNumber,
  rarity,
  imageUrl,
}) {
  /* * El Set debe existir antes de poder * registrar una Card asociada. */ const set =
    await findSetById(setId);
  if (!set) {
    throw createAppError("Set no encontrado", 404);
  }
  /* * Si viene externalId, comprobamos * que no exista dentro del mismo Set. */ if (
    externalId
  ) {
    const existingCardByExternalId = await findCardByExternalId(
      setId,
      externalId,
    );
    if (existingCardByExternalId) {
      throw createAppError("La Card ya está registrada para este Set", 409);
    }
  }
  /* * También evitamos duplicados por nombre * dentro del mismo Set. */ const existingCardByName =
    await findCardByName(setId, name);
  if (existingCardByName) {
    throw createAppError("La Card ya está registrada para este Set", 409);
  }
  return createCard({ setId, externalId, name, cardNumber, rarity, imageUrl });
}
/* ==================================== ACTUALIZAR CARD ==================================== */ export async function editCard(
  id,
  { setId, externalId, name, cardNumber, rarity, imageUrl },
) {
  /* * Primero comprobamos que la Card * exista. */ const existingCard =
    await findCardById(id);
  if (!existingCard) {
    throw createAppError("Card no encontrada", 404);
  }
  /* * Si se cambia el Set, * comprobamos que el nuevo Set exista. */ if (
    setId !== undefined
  ) {
    const set = await findSetById(setId);
    if (!set) {
      throw createAppError("Set no encontrado", 404);
    }
  }
  /* * Si cambia el Set, externalId * o nombre, comprobamos posibles * duplicados. */ if (
    setId !== undefined ||
    externalId !== undefined ||
    name !== undefined
  ) {
    const targetSetId = setId ?? existingCard.set_id;
    const targetExternalId = externalId ?? existingCard.external_id;
    const targetName = name ?? existingCard.name;
    /* * Comprobar externalId. */ if (targetExternalId) {
      const existingCardByExternalId = await findCardByExternalId(
        targetSetId,
        targetExternalId,
      );
      if (existingCardByExternalId && existingCardByExternalId.id !== id) {
        throw createAppError(
          "El external_id ya está registrado para este Set",
          409,
        );
      }
    }
    /* * Comprobar nombre. */ const existingCardByName = await findCardByName(
      targetSetId,
      targetName,
    );
    if (existingCardByName && existingCardByName.id !== id) {
      throw createAppError("La Card ya está registrada para este Set", 409);
    }
  }
  /* * Delegamos la actualización al Repository. */ return updateCard(id, {
    setId,
    externalId,
    name,
    cardNumber,
    rarity,
    imageUrl,
  });
}
/* ==================================== ELIMINAR CARD ==================================== */ export async function removeCard(
  id,
) {
  /* * Primero comprobamos que exista. */ const existingCard =
    await findCardById(id);
  if (!existingCard) {
    throw createAppError("Card no encontrada", 404);
  }
  /* * Delegamos la eliminación al Repository. */ return deleteCard(id);
}
