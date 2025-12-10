// backend/src/app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Rotas Backend API
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// =========================================
// SERVIR FRONTEND
// =========================================

// Corrigir caminhos do ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Caminho da pasta onde ficam SEUS HTML (AGORA CORRETO)
const FRONTEND_DIR = path.join(__dirname, "..", "..", "frontend", "html");

// Servir arquivos de frontend (HTML, CSS, JS, IMAGENS)
app.use(express.static(path.join(__dirname, "..", "..", "frontend")));

// Rota principal → abre o index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// =========================================
// Rotas da API
// =========================================
app.get("/api", (req, res) => {
  res.json({
    message: "API do Mercadinho Online",
    endpoints: {
      auth: "/api/auth",
      users: "/api/users",
      products: "/api/products",
      feedbacks: "/api/feedbacks",
      admins: "/api/admins",
    },
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// API REAL
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/admins", adminRoutes);

// =========================================
// EXPORTAR
// =========================================
export default app;
