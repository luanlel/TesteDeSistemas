// backend/src/routes/authRoutes.js
import { Router } from "express";
import { loginAdmin, verifyRecaptcha } from "../controllers/authController.js";

const router = Router();

// Login ADMIN
router.post("/login", loginAdmin);

// Verificação de reCAPTCHA
router.post("/verify-recaptcha", verifyRecaptcha);

export default router;
