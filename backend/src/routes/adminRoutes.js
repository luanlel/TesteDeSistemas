// backend/src/routes/adminRoutes.js
import express from "express";
import { createAdmin } from "../controllers/adminController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

// Criar novo admin (somente admin autenticado)
router.post("/", authMiddleware, requireAdmin, createAdmin);

export default router;
