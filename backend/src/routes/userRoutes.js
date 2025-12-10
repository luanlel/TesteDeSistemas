// backend/src/routes/userRoutes.js
import express from "express";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

import { createAdmin } from "../controllers/adminController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

// Todas as rotas exigem admin autenticado
router.use(authMiddleware, requireAdmin);

// Listar todos os usuários
router.get("/", getAllUsers);

// Criar usuário normal
router.post("/", createUser);

// Criar novo admin
router.post("/admin", createAdmin);

// Atualizar usuário
router.put("/:id", updateUser);

// Deletar usuário
router.delete("/:id", deleteUser);

export default router;
