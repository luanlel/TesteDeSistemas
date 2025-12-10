import { Router } from "express";
import { loginAdmin, verifyRecaptcha } from "../controllers/authController.js";

const router = Router();

router.post("/admin/login", loginAdmin);
router.post("/verify-recaptcha", verifyRecaptcha);

export default router;
