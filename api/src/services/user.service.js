import bcrypt from "bcrypt";

import {
  findUsers,
  countUsers,
  createUser,
  updateUser,
  findUserById,
  findUserByEmail,
  findUserByUsername,
  findUserForAuthentication,
} from "../repositories/user.repository.js";

import { createAppError } from "../errors/app.errors.js";

/* ====================================
          OBTENER USUARIO POR ID
==================================== */
export async function getUserById(id) {
  const user = await findUserById(id);
  if (!user) {
    throw createAppError("Usuario no encontrado", 404);
  } else return user;
}
/* ====================================
        OBTENER USUARIO POR EMAIL
==================================== */
export async function getUserByEmail(email) {
  const user = await findUserByEmail(email);

  if (!user) {
    throw createAppError("Usuario no encontrado", 404);
  }

  return user;
}
/* ====================================
           REGISTRAR USUARIO
==================================== */
export async function registerUser({ username, email, password }) {
  const existingUserByEmail = await findUserByEmail(email);

  if (existingUserByEmail) {
    throw createAppError("El email ya está registrado", 409);
  }

  const existingUserByUsername = await findUserByUsername(username);

  if (existingUserByUsername) {
    throw createAppError("El username ya está registrado", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  return createUser({
    username,
    email,
    password: hashedPassword,
  });
}

/* ====================================
             LISTAR USUARIOS
==================================== */
export async function getUsers({ page, limit, search, sortBy, sortOrder }) {
  const offset = (page - 1) * limit;

  const [users, total] = await Promise.all([
    findUsers({
      search,
      limit,
      offset,
      sortBy,
      sortOrder,
    }),

    countUsers({
      search,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: users,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/* ====================================
          ACTUALIZAR USUARIO
==================================== */
export async function editUser(id, { username, email, password }) {
  const existingUser = await findUserById(id);

  if (!existingUser) {
    throw createAppError("Usuario no encontrado", 404);
  }

  if (email !== undefined) {
    const existingUserByEmail = await findUserByEmail(email);

    if (existingUserByEmail && existingUserByEmail.id !== id) {
      throw createAppError("El email ya está registrado", 409);
    }
  }

  if (username !== undefined) {
    const existingUserByUsername = await findUserByUsername(username);

    if (existingUserByUsername && existingUserByUsername.id !== id) {
      throw createAppError("El username ya está registrado", 409);
    }
  }

  let hashedPassword;

  if (password !== undefined) {
    hashedPassword = await bcrypt.hash(password, 12);
  }

  return updateUser(id, {
    username,
    email,
    password: hashedPassword,
  });
}
