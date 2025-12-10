// backend/src/routes/userRoutes.js
import express from "express";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  createAdmin,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

// Todas as rotas daqui exigem:
// 1) Token válido (authMiddleware)
// 2) Usuário ser admin (requireAdmin)
router.use(authMiddleware, requireAdmin);

// 🔹 Lista todos os usuários
router.get("/", getAllUsers);

// 🔹 Cria usuário comum (apenas Firestore)
router.post("/", createUser);

// 🔹 Cria ADMIN completo (Auth + admins + usuarios)
router.post("/admin", createAdmin);

// 🔹 Atualiza usuário
router.put("/:id", updateUser);

// 🔹 Deleta usuário
router.delete("/:id", deleteUser);

export default router;
