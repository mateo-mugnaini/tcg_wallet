import { findCardById } from "../repositories/cards.repository.js";

import {
  createCollectionItem,
  findCollectionItems,
  findCollectionItemById,
  updateCollectionItem,
  deleteCollectionItem,
  countCollectionItems,
} from "../repositories/collection-items.repository.js";

import { findGradingCompanyById } from "../repositories/grading-companies.repository.js";

import { createAppError } from "../errors/app.errors.js";

/* ====================================
        VALIDAR CONDITION
==================================== */

function validateCondition(condition) {
  if (!condition || typeof condition !== "string") {
    throw createAppError("La condición de la carta es obligatoria", 400);
  }

  const normalizedCondition = condition.trim();

  if (!normalizedCondition) {
    throw createAppError("La condición de la carta es obligatoria", 400);
  }

  return normalizedCondition;
}

/* ====================================
        VALIDAR QUANTITY
==================================== */

function validateQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw createAppError(
      "La cantidad debe ser un número entero mayor que 0",
      400,
    );
  }

  return quantity;
}

/* ====================================
        VALIDAR GRADING
==================================== */

async function validateGrading({ isGraded, gradingCompanyId, grade }) {
  if (!isGraded) {
    if (gradingCompanyId !== null && gradingCompanyId !== undefined) {
      throw createAppError(
        "Una carta no gradada no puede tener una empresa de grading",
        400,
      );
    }

    if (grade !== null && grade !== undefined) {
      throw createAppError(
        "Una carta no gradada no puede tener una calificación",
        400,
      );
    }

    return {
      isGraded: false,
      gradingCompanyId: null,
      grade: null,
    };
  }

  if (!gradingCompanyId) {
    throw createAppError(
      "Una carta gradada requiere una empresa de grading",
      400,
    );
  }

  if (grade === null || grade === undefined) {
    throw createAppError("Una carta gradada requiere una calificación", 400);
  }

  const numericGrade = Number(grade);

  if (!Number.isFinite(numericGrade)) {
    throw createAppError("La calificación debe ser un número válido", 400);
  }

  if (numericGrade < 0 || numericGrade > 10) {
    throw createAppError("La calificación debe estar entre 0 y 10", 400);
  }

  const gradingCompany = await findGradingCompanyById(gradingCompanyId);

  if (!gradingCompany) {
    throw createAppError("La empresa de grading no existe", 404);
  }

  return {
    isGraded: true,
    gradingCompanyId,
    grade: numericGrade,
  };
}

/* ====================================
        AGREGAR CARTA
==================================== */

export async function addCollectionItem({
  userId,
  cardId,
  quantity,
  condition,
  isGraded = false,
  gradingCompanyId = null,
  grade = null,
}) {
  /* ====================================
          VALIDAR CARD
  ==================================== */

  const card = await findCardById(cardId);

  if (!card) {
    throw createAppError("La carta no existe", 404);
  }

  /* ====================================
          VALIDAR QUANTITY
  ==================================== */

  const normalizedQuantity = validateQuantity(quantity);

  /* ====================================
          VALIDAR CONDITION
  ==================================== */

  const normalizedCondition = validateCondition(condition);

  /* ====================================
          VALIDAR GRADING
  ==================================== */

  const grading = await validateGrading({
    isGraded,
    gradingCompanyId,
    grade,
  });

  /* ====================================
          CREAR ITEM
  ==================================== */

  return createCollectionItem({
    userId,
    cardId,
    quantity: normalizedQuantity,
    condition: normalizedCondition,
    isGraded: grading.isGraded,
    gradingCompanyId: grading.gradingCompanyId,
    grade: grading.grade,
  });
}

/* ====================================
        LISTAR COLECCIÓN
==================================== */

export async function getCollectionItems({
  userId,
  cardId,
  condition,
  isGraded,
  limit = 20,
  offset = 0,
  sortOrder = "DESC",
}) {
  const items = await findCollectionItems({
    userId,
    cardId,
    condition,
    isGraded,
    limit,
    offset,
    sortOrder,
  });

  const total = await countCollectionItems({
    userId,
    cardId,
    condition,
    isGraded,
  });

  return {
    items,
    total,
    limit,
    offset,
  };
}

/* ====================================
      OBTENER ITEM POR ID
==================================== */

export async function getCollectionItemById({ id, userId }) {
  const item = await findCollectionItemById(id, userId);

  if (!item) {
    throw createAppError("El elemento de colección no existe", 404);
  }

  return item;
}

/* ====================================
        ACTUALIZAR ITEM
==================================== */

export async function editCollectionItem({
  id,
  userId,
  quantity,
  condition,
  isGraded,
  gradingCompanyId,
  grade,
}) {
  /* ====================================
          BUSCAR ITEM
  ==================================== */

  const existingItem = await findCollectionItemById(id, userId);

  if (!existingItem) {
    throw createAppError("El elemento de colección no existe", 404);
  }

  /* ====================================
          NORMALIZAR VALUES
  ==================================== */

  const normalizedQuantity =
    quantity === undefined ? existingItem.quantity : validateQuantity(quantity);

  const normalizedCondition =
    condition === undefined
      ? existingItem.condition
      : validateCondition(condition);

  const normalizedIsGraded =
    isGraded === undefined ? existingItem.is_graded : isGraded;

  const normalizedGradingCompanyId =
    gradingCompanyId === undefined
      ? existingItem.grading_company_id
      : gradingCompanyId;

  const normalizedGrade = grade === undefined ? existingItem.grade : grade;

  /* ====================================
          VALIDAR GRADING
  ==================================== */

  const grading = await validateGrading({
    isGraded: normalizedIsGraded,
    gradingCompanyId: normalizedGradingCompanyId,
    grade: normalizedGrade,
  });

  /* ====================================
          ACTUALIZAR
  ==================================== */

  return updateCollectionItem(id, userId, {
    quantity: normalizedQuantity,
    condition: normalizedCondition,
    isGraded: grading.isGraded,
    gradingCompanyId: grading.gradingCompanyId,
    grade: grading.grade,
  });
}

/* ====================================
        ELIMINAR ITEM
==================================== */

export async function removeCollectionItem({ id, userId }) {
  const existingItem = await findCollectionItemById(id, userId);

  if (!existingItem) {
    throw createAppError("El elemento de colección no existe", 404);
  }

  return deleteCollectionItem(id, userId);
}
