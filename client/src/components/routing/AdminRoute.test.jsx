import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminRoute from "./AdminRoute.jsx";
import authReducer, { authInitialState } from "../../redux/slices/auth.slice.js";

function renderRoute(user, initialEntry = "/admin") {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: {
      auth: { ...authInitialState, initialized: true, accessToken: "token", user },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<p>Contenido administrativo</p>} />
          </Route>
          <Route path="/dashboard" element={<p>Dashboard</p>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe("AdminRoute", () => {
  it("permite el acceso a usuarios administradores", () => {
    renderRoute({ id: "admin-1", role: "admin" });

    expect(screen.getByText("Contenido administrativo")).toBeInTheDocument();
  });

  it("redirige a dashboard a usuarios sin rol admin", () => {
    renderRoute({ id: "user-1", role: "user" });

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Contenido administrativo")).not.toBeInTheDocument();
  });
});
