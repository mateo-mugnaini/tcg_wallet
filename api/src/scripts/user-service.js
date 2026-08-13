import {
  getUserByEmail,
  getUserById,
  registerUser,
} from "../services/user.service.js";

/* ====================================
          OBTENER USUARIO POR ID
==================================== */
const userId = "f5caa047-0f2b-4f48-831a-f1c2500d654d";

const userById = await getUserById(userId);

console.log("Usuario obtenido por ID:");
console.log(userById);

/* ====================================
        OBTENER USUARIO POR EMAIL
==================================== */
const userByEmail = await getUserByEmail("test_user@tgcwallet.com");

console.log("Usuario obtenido por email:");
console.log(userByEmail);

/* ====================================
            REGISTRAR USUARIO
==================================== */
const user = await registerUser({
  username: "service_test_3",
  email: "service_test_3@tgcwallet.com",
  password: "MyPassword123",
});

console.log("Usuario registrado:");
console.log(user);
