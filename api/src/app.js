import express from "express";
import cookieParser from "cookie-parser";

import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
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

/* ====================================
            ERROR MIDDLEWARE
==================================== */
app.use(errorMiddleware);

export default app;
