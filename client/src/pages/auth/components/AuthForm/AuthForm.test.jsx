import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import authReducer, { authInitialState } from "../../../../redux/slices/auth.slice.js";
import usersReducer from "../../../../redux/slices/users.slice.js";
import AuthPages from "../../authPages.jsx";

function renderForm() {
  const store = configureStore({
    reducer: { auth: authReducer, users: usersReducer },
    preloadedState: { auth: authInitialState },
  });

  return render(<AuthPages />, {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });
}

describe("AuthForm", () => {
  it("muestra errores de validación antes de enviar credenciales inválidas", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(screen.getByText("Ingresa un email válido.")).toBeInTheDocument();
    expect(screen.getByText("La contraseña debe tener entre 8 y 255 caracteres.")).toBeInTheDocument();
  });

  it("permite alternar al registro y valida que las contraseñas coincidan", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("tab", { name: "Registrarse" }));
    await user.type(screen.getByLabelText("Usuario"), "collector");
    await user.type(screen.getByLabelText("Email"), "collector@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "password123");
    await user.type(screen.getByLabelText("Repetir contraseña"), "different123");
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(screen.getByText("Las contraseñas no coinciden.")).toBeInTheDocument();
  });
});
