// backend/src/routes/adminRoutes.js
import express from "express";
import { createAdmin } from "../controllers/admincontroller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

// Apenas um admin já logado pode criar novos admins
router.post("/", authMiddleware, requireAdmin, createAdmin);

export default router;
