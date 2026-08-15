import express from "express";
import cookieParser from "cookie-parser";

import tcgRoutes from "./routes/tcg.routes.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import setRoutes from "./routes/sets.routes.js";
import cardsRoutes from "./routes/cards.routes.js";
import cardsPricesRoutes from "./routes/cards-prices.routes.js";
import collectionItemsRoutes from "./routes/collection-items.routes.js";
import gradingCompaniesRoutes from "./routes/grading-companies.routes.js";
import syncRoutes from "./routes/sync.pipeline.routes.js";

import { errorMiddleware } from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

/* ====================================
              HEALTH CHECK
==================================== */

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
  });
});

/* ====================================
                ROUTES
==================================== */

app.use("/api", cardsPricesRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tcgs", tcgRoutes);
app.use("/api/sets", setRoutes);
app.use("/api/cards", cardsRoutes);
app.use("/api/collection-items", collectionItemsRoutes);
app.use("/api/grading-companies", gradingCompaniesRoutes);
app.use("/api/sync", syncRoutes);

/* ====================================
            ERROR MIDDLEWARE
==================================== */

app.use(errorMiddleware);

export default app;
