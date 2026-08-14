import express from "express";
import cookieParser from "cookie-parser";

import tcgRoutes from "./routes/tcg.routes.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import setRoutes from "./routes/sets.routes.js";
import cardsRoutes from "./routes/cards.routes.js";

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

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/tcgs", tcgRoutes);
app.use("/api/sets", setRoutes);
app.use("/api/cards", cardsRoutes);
/* ====================================
            ERROR MIDDLEWARE
==================================== */
app.use(errorMiddleware);

export default app;
