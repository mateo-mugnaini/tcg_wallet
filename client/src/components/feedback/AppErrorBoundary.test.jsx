import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppErrorBoundary from "./AppErrorBoundary.jsx";

function BrokenComponent() {
  throw new Error("test-only failure");
}

describe("AppErrorBoundary", () => {
  it("muestra un fallback recuperable ante un error de renderizado", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <AppErrorBoundary>
        <BrokenComponent />
      </AppErrorBoundary>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos cargar TCG Wallet");
    expect(screen.getByRole("button", { name: "Reintentar" })).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
