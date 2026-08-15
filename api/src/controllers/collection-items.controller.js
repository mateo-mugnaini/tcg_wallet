import {
  addCollectionItem,
  getCollectionItems,
  getCollectionItemById,
  editCollectionItem,
  removeCollectionItem,
  getCollectionStatsService,
  getCollectionValueService,
} from "../services/collection-items.service.js";

import { createAppError } from "../errors/app.errors.js";

/* ====================================
        LISTAR COLECCIÓN
==================================== */

export async function getCollectionItemsController(req, res, next) {
  try {
    const {
      cardId,
      condition,
      isGraded,
      setId,
      tcgId,
      rarity,
      gradingCompanyId,
      minGrade,
      maxGrade,
      limit = 20,
      offset = 0,
      sortBy = "created_at",
      sortOrder = "DESC",
    } = req.validated.query;

    const userId = req.user.id;

    /* ====================================
          PAGINACIÓN
    ==================================== */

    const parsedLimit = Number(limit);
    const parsedOffset = Number(offset);

    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      throw createAppError(
        "El parámetro limit debe ser un entero mayor que 0",
        400,
      );
    }

    if (!Number.isInteger(parsedOffset) || parsedOffset < 0) {
      throw createAppError(
        "El parámetro offset debe ser un entero mayor o igual que 0",
        400,
      );
    }

    /* ====================================
          IS GRADED
    ==================================== */

    const parsedIsGraded =
      isGraded === undefined
        ? undefined
        : typeof isGraded === "boolean"
          ? isGraded
          : isGraded === "true"
            ? true
            : isGraded === "false"
              ? false
              : null;

    if (parsedIsGraded === null) {
      throw createAppError("El parámetro isGraded debe ser true o false", 400);
    }

    /* ====================================
          MIN / MAX GRADE
    ==================================== */

    let parsedMinGrade;
    if (minGrade !== undefined) {
      parsedMinGrade = Number(minGrade);
      if (!Number.isFinite(parsedMinGrade) || parsedMinGrade < 0 || parsedMinGrade > 10) {
        throw createAppError("El parámetro minGrade debe ser un número entre 0 y 10", 400);
      }
    }

    let parsedMaxGrade;
    if (maxGrade !== undefined) {
      parsedMaxGrade = Number(maxGrade);
      if (!Number.isFinite(parsedMaxGrade) || parsedMaxGrade < 0 || parsedMaxGrade > 10) {
        throw createAppError("El parámetro maxGrade debe ser un número entre 0 y 10", 400);
      }
    }

    /* ====================================
              SERVICE
    ==================================== */

    const result = await getCollectionItems({
      userId,
      cardId,
      condition,
      isGraded: parsedIsGraded,
      setId,
      tcgId,
      rarity,
      gradingCompanyId,
      minGrade: parsedMinGrade,
      maxGrade: parsedMaxGrade,
      limit: parsedLimit,
      offset: parsedOffset,
      sortBy,
      sortOrder,
    });

    /* ====================================
              RESPONSE
    ==================================== */

    res.status(200).json({
      data: result.items,
      pagination: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      },
    });
  } catch (error) {
    next(error);
  }
}

/* ====================================
      OBTENER ITEM POR ID
==================================== */

export async function getCollectionItemByIdController(req, res, next) {
  try {
    const { id } = req.validated.params;

    const userId = req.user.id;

    /* ====================================
              SERVICE
    ==================================== */

    const item = await getCollectionItemById({
      id,
      userId,
    });

    /* ====================================
              RESPONSE
    ==================================== */

    res.status(200).json({
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

/* ====================================
        AGREGAR A COLECCIÓN
==================================== */

export async function createCollectionItemController(req, res, next) {
  try {
    const {
      cardId,
      quantity,
      condition,
      isGraded = false,
      gradingCompanyId = null,
      grade = null,
      } = req.validated.body;

    const userId = req.user.id;

    /* ====================================
              VALIDACIÓN BÁSICA
    ==================================== */

    if (!cardId) {
      throw createAppError("cardId es obligatorio", 400);
    }

    /* ====================================
              SERVICE
    ==================================== */

    const item = await addCollectionItem({
      userId,
      cardId,
      quantity,
      condition,
      isGraded,
      gradingCompanyId,
      grade,
    });

    /* ====================================
              RESPONSE
    ==================================== */

    res.status(201).json({
      message: "Carta agregada a la colección",
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

/* ====================================
      ACTUALIZAR COLECCIÓN
==================================== */

export async function updateCollectionItemController(req, res, next) {
  try {
    const { id } = req.validated.params;

    const { quantity, condition, isGraded, gradingCompanyId, grade } =
      req.validated.body;

    const userId = req.user.id;

    /* ====================================
              SERVICE
    ==================================== */

    const item = await editCollectionItem({
      id,
      userId,
      quantity,
      condition,
      isGraded,
      gradingCompanyId,
      grade,
    });

    /* ====================================
              RESPONSE
    ==================================== */

    res.status(200).json({
      message: "Colección actualizada correctamente",
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

/* ====================================
        ELIMINAR DE COLECCIÓN
==================================== */

export async function deleteCollectionItemController(req, res, next) {
  try {
    const { id } = req.validated.params;

    const userId = req.user.id;

    /* ====================================
              SERVICE
    ==================================== */

    const item = await removeCollectionItem({
      id,
      userId,
    });

    /* ====================================
              RESPONSE
    ==================================== */

    res.status(200).json({
      message: "Carta eliminada de la colección",
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

/* ====================================
      ESTADÍSTICAS DE COLECCIÓN
==================================== */

export async function getCollectionStatsController(req, res, next) {
  try {
    const userId = req.user.id;

    const stats = await getCollectionStatsService({ userId });

    res.status(200).json({
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/* ====================================
      VALOR ESTIMADO DE COLECCIÓN
==================================== */

export async function getCollectionValueController(req, res, next) {
  try {
    const userId = req.user.id;

    const value = await getCollectionValueService({ userId });

    res.status(200).json({
      data: value,
    });
  } catch (error) {
    next(error);
  }
}
