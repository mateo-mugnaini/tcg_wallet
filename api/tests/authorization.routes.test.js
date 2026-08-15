import { describe, expect, it } from "vitest";

import cardsRouter from "../src/routes/cards.routes.js";
import cardPricesRouter from "../src/routes/cards-prices.routes.js";

function getRouteMiddleware(router, path, method, index) {
  const layer = router.stack.find(
    (entry) => entry.route?.path === path && entry.route.methods[method],
  );

  expect(layer).toBeDefined();

  const middleware = layer.route.stack[index]?.handle;

  expect(middleware).toBeDefined();
  expect(middleware.toString()).toContain("allowedRoles.includes");

  return middleware;
}

function runRoleGuard(guard, role) {
  return new Promise((resolve) => {
    guard(
      { user: role ? { id: "user-id", role } : undefined },
      {},
      (error) => resolve(error ?? null),
    );
  });
}

describe("catalog authorization guards", () => {
  const protectedMutations = [
    [cardsRouter, "/", "post"],
    [cardsRouter, "/:id", "put"],
    [cardsRouter, "/:id", "delete"],
    [cardPricesRouter, "/cards/:cardId/prices", "post"],
    [cardPricesRouter, "/cards/:cardId/graded-prices", "post"],
  ];

  it.each(protectedMutations)(
    "%s %s requires admin authorization",
    async (router, path, method) => {
      const guard = getRouteMiddleware(router, path, method, 1);

      const userError = await runRoleGuard(guard, "user");
      expect(userError?.statusCode).toBe(403);

      const adminError = await runRoleGuard(guard, "admin");
      expect(adminError).toBeNull();
    },
  );
});
