import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import tcgRoutes from "./routes/tcg.routes.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import setRoutes from "./routes/sets.routes.js";
import cardsRoutes from "./routes/cards.routes.js";
import cardsPricesRoutes from "./routes/cards-prices.routes.js";
import collectionItemsRoutes from "./routes/collection-items.routes.js";
import gradingCompaniesRoutes from "./routes/grading-companies.routes.js";
import syncRoutes from "./routes/sync.pipeline.routes.js";
import healthRoutes from "./routes/health.routes.js";
import docsRoutes from "./routes/docs.routes.js";

import { corsOptions, helmetOptions } from "./config/security.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { requestLogging } from "./middlewares/request-logging.middleware.js";

const app = express();

app.use(requestLogging);
app.use(helmet(helmetOptions));
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

/* ====================================
                ROUTES
==================================== */

app.use("/api", healthRoutes);
app.use("/api", docsRoutes);
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
