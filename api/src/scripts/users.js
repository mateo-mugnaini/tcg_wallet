import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserForAuthentication,
} from "../repositories/user.repository.js";

/* ====================================
            CREAR USUARIO
==================================== */
const createdUser = await createUser({
  username: "test_user",
  email: "test_user@tgcwallet.com",
  password: "test_hash",
});

console.log("Usuario creado:");
console.log(createdUser);

/* ====================================
          BUSCAR USUARIO POR ID
==================================== */
const userById = await findUserById(createdUser.id);

console.log("Usuario encontrado por ID:");
console.log(userById);

/* ====================================
        BUSCAR USUARIO POR EMAIL
==================================== */
const userByEmail = await findUserByEmail(createdUser.email);

console.log("Usuario encontrado por email:");
console.log(userByEmail);

/* ====================================
       BUSCAR USUARIO PARA LOGIN
==================================== */
const userForAuthentication = await findUserForAuthentication(
  createdUser.email,
);

console.log("Usuario para autenticación:");
console.log(userForAuthentication);
