import {
  editUser,
  getUsers,
  removeUser,
  getUserById,
  registerUser,
  getUserByEmail,
} from "../services/user.service.js";
/* ====================================
            CREAR USUARIO
==================================== */
export async function createUser(req, res, next) {
  try {
    const user = await registerUser(req.validated.body);

    return res.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

/* ====================================
          OBTENER USUARIO POR ID
==================================== */
export async function getUser(req, res, next) {
  try {
    const user = await getUserById(req.validated.params.id);

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

/* ====================================
        OBTENER USUARIO POR EMAIL
==================================== */
export async function getUserByEmailController(req, res, next) {
  try {
    const user = await getUserByEmail(req.validated.params.email);

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

/* ====================================
             LISTAR USUARIOS
==================================== */
export async function getUsersController(req, res, next) {
  try {
    const result = await getUsers(req.validated.query);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

/* ====================================
          ACTUALIZAR USUARIO
==================================== */
export async function updateUser(req, res, next) {
  try {
    const user = await editUser(req.validated.params.id, req.validated.body);

    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
}

/* ====================================
             ELIMINAR USUARIO
==================================== */
export async function deleteUser(req, res, next) {
  try {
    await removeUser(req.validated.params.id);

    return res.status(200).json({
      status: "success",
      message: "Usuario eliminado correctamente",
    });
  } catch (error) {
    next(error);
  }
}
