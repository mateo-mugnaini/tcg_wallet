import {
  findGradingCompanies,
  findGradingCompanyById,
  findGradingCompanyByName,
  createGradingCompany,
  updateGradingCompany,
  deleteGradingCompany,
} from "../repositories/grading-companies.repository.js";

import { createAppError } from "../errors/app.errors.js";

/* ====================================
        LISTAR GRADING COMPANIES
==================================== */

export async function getGradingCompanies() {
  return findGradingCompanies();
}

/* ====================================
      OBTENER GRADING COMPANY POR ID
==================================== */

export async function getGradingCompanyById(id) {
  const company = await findGradingCompanyById(id);

  if (!company) {
    throw createAppError("La empresa de grading no existe", 404);
  }

  return company;
}

/* ====================================
        CREAR GRADING COMPANY
==================================== */

export async function addGradingCompany({ name }) {
  const normalizedName = name.trim();

  const existingCompany = await findGradingCompanyByName(normalizedName);

  if (existingCompany) {
    throw createAppError(
      `Ya existe una empresa de grading con el nombre '${normalizedName}'`,
      409,
    );
  }

  return createGradingCompany({ name: normalizedName });
}

/* ====================================
      ACTUALIZAR GRADING COMPANY
==================================== */

export async function editGradingCompany(id, { name }) {
  const company = await findGradingCompanyById(id);

  if (!company) {
    throw createAppError("La empresa de grading no existe", 404);
  }

  if (name !== undefined) {
    const normalizedName = name.trim();

    const existingCompany = await findGradingCompanyByName(normalizedName);

    if (existingCompany && existingCompany.id !== id) {
      throw createAppError(
        `Ya existe otra empresa de grading con el nombre '${normalizedName}'`,
        409,
      );
    }

    return updateGradingCompany(id, { name: normalizedName });
  }

  return company;
}

/* ====================================
      ELIMINAR GRADING COMPANY
==================================== */

export async function removeGradingCompany(id) {
  const company = await findGradingCompanyById(id);

  if (!company) {
    throw createAppError("La empresa de grading no existe", 404);
  }

  try {
    return await deleteGradingCompany(id);
  } catch (error) {
    if (error.code === "23503") {
      throw createAppError(
        "No se puede eliminar la empresa de grading porque está asociada a cartas en colecciones o precios",
        409,
      );
    }
    throw error;
  }
}
