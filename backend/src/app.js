// backend/src/app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Rotas
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// ======================
// Servir Frontend
// ======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_DIR = path.join(__dirname, "..", "..", "frontend", "html");

// Servir arquivos estáticos (css, js, imagens)
app.use(express.static(path.join(__dirname, "..", "..", "frontend")));

// Página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// ======================
// Rotas da API
// ======================
app.get("/api", (req, res) => {
  res.json({
    status: "OK",
    message: "API do Mercadinho",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/admins", adminRoutes);

export default app;
