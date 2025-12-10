// backend/src/routes/productRoutes.js
import express from "express";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { requireAdmin } from "../middlewares/requireAdmin.js";

const router = express.Router();

// Produtos disponíveis → público
router.get("/", getAllProducts);

// Criar produto (admin)
router.post("/", authMiddleware, requireAdmin, createProduct);

// Atualizar produto (admin)
router.put("/:id", authMiddleware, requireAdmin, updateProduct);

// Excluir produto (admin)
router.delete("/:id", authMiddleware, requireAdmin, deleteProduct);

export default router;
