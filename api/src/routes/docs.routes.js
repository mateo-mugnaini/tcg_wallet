import express from "express";

import { openapiDocument } from "../docs/openapi.js";

const router = express.Router();

router.get("/docs", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    openapi: "/api/docs/openapi.json",
  });
});

router.get("/docs/openapi.json", (_req, res) => {
  return res.status(200).json(openapiDocument);
});

export default router;
