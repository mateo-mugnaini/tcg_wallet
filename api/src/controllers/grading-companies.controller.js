import {
  getGradingCompanies,
  getGradingCompanyById,
  addGradingCompany,
  editGradingCompany,
  removeGradingCompany,
} from "../services/grading-companies.service.js";

/* ====================================
        LISTAR GRADING COMPANIES
==================================== */

export async function getGradingCompaniesController(req, res, next) {
  try {
    const companies = await getGradingCompanies();

    res.status(200).json({
      data: companies,
    });
  } catch (error) {
    next(error);
  }
}

/* ====================================
      OBTENER GRADING COMPANY POR ID
==================================== */

export async function getGradingCompanyByIdController(req, res, next) {
  try {
    const { id } = req.validated.params;

    const company = await getGradingCompanyById(id);

    res.status(200).json({
      data: company,
    });
  } catch (error) {
    next(error);
  }
}

/* ====================================
        CREAR GRADING COMPANY
==================================== */

export async function createGradingCompanyController(req, res, next) {
  try {
    const { name } = req.validated.body;

    const company = await addGradingCompany({ name });

    res.status(201).json({
      message: "Empresa de grading creada exitosamente",
      data: company,
    });
  } catch (error) {
    next(error);
  }
}

/* ====================================
      ACTUALIZAR GRADING COMPANY
==================================== */

export async function updateGradingCompanyController(req, res, next) {
  try {
    const { id } = req.validated.params;
    const { name } = req.validated.body;

    const company = await editGradingCompany(id, { name });

    res.status(200).json({
      message: "Empresa de grading actualizada correctamente",
      data: company,
    });
  } catch (error) {
    next(error);
  }
}

/* ====================================
      ELIMINAR GRADING COMPANY
==================================== */

export async function deleteGradingCompanyController(req, res, next) {
  try {
    const { id } = req.validated.params;

    const company = await removeGradingCompany(id);

    res.status(200).json({
      message: "Empresa de grading eliminada correctamente",
      data: company,
    });
  } catch (error) {
    next(error);
  }
}
