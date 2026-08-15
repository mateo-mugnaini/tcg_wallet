import { describe, expect, it } from "vitest";

import app from "../src/app.js";
import cardsRouter from "../src/routes/cards.routes.js";
import cardsPricesRouter from "../src/routes/cards-prices.routes.js";
import syncPipelineRouter from "../src/routes/sync.pipeline.routes.js";
import userRouter from "../src/routes/user.routes.js";
import { corsOptions, helmetOptions } from "../src/config/security.js";
import {
  registrationRateLimiter,
  syncRateLimiter,
  userRateLimiter,
} from "../src/middlewares/rate-limit.middleware.js";

function getRoute(router, path, method) {
  const layer = router.stack.find(
    (entry) => entry.route?.path === path && entry.route.methods[method],
  );

  expect(layer).toBeDefined();

  return layer.route;
}

describe("security hardening configuration", () => {
  it("configura CORS para el frontend y cookies de refresh", () => {
    expect(corsOptions.credentials).toBe(true);
    expect(corsOptions.methods).toEqual(
      expect.arrayContaining(["GET", "POST", "PUT", "PATCH", "DELETE"]),
    );
    expect(corsOptions.allowedHeaders).toEqual(
      expect.arrayContaining(["Content-Type", "Authorization"]),
    );
  });

  it("monta Helmet, CORS, body parser limitado y cookies en la app", () => {
    const middlewareNames = app.router.stack.map((layer) => layer.name);

    expect(middlewareNames).toEqual(
      expect.arrayContaining([
        "helmetMiddleware",
        "corsMiddleware",
        "jsonParser",
        "cookieParser",
      ]),
    );
    expect(helmetOptions).toEqual(
      expect.objectContaining({ contentSecurityPolicy: false }),
    );
  });

  it("expone limitadores específicos para usuarios y sincronizaciones", () => {
    expect(typeof userRateLimiter).toBe("function");
    expect(typeof registrationRateLimiter).toBe("function");
    expect(typeof syncRateLimiter).toBe("function");

    expect(userRouter.stack.some((layer) => !layer.route)).toBe(true);
    expect(getRoute(userRouter, "/", "post").stack).toHaveLength(4);
    expect(getRoute(cardsRouter, "/sync/pokemon", "post").stack).toHaveLength(
      5,
    );
    expect(
      getRoute(cardsPricesRouter, "/sync/cards/prices", "post").stack,
    ).toHaveLength(5);
    expect(getRoute(syncPipelineRouter, "/", "post").stack).toHaveLength(5);
    expect(
      getRoute(syncPipelineRouter, "/graded-prices", "post").stack,
    ).toHaveLength(6);
  });
});
