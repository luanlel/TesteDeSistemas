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

// Usuário logado pode enviar feedback
router.post("/", authMiddleware, createFeedback);

// Admin pode listar feedbacks
router.get("/", authMiddleware, requireAdmin, getAllFeedbacks);

// Admin pode atualizar status
router.patch("/:id/status", authMiddleware, requireAdmin, updateFeedbackStatus);

export default router;
