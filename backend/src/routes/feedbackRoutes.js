// backend/src/routes/feedbackRoutes.js
import express from "express";
import {
  getAllFeedbacks,
  createFeedback,
  updateFeedbackStatus,
} from "../controllers/feedbackController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

// Usuário logado pode criar feedback
router.post("/", authMiddleware, createFeedback);

// Admin pode listar e atualizar status
router.get("/", authMiddleware, requireAdmin, getAllFeedbacks);
router.patch("/:id/status", authMiddleware, requireAdmin, updateFeedbackStatus);

export default router;
