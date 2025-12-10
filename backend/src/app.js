// backend/src/app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// Rotas da API
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// ======================
// 📌 Servir o Frontend
// ======================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pasta onde ficam os HTML
const FRONTEND_HTML = path.join(__dirname, "..", "..", "frontend", "html");

// Pasta de arquivos estáticos (css, js, imagens)
app.use(express.static(path.join(__dirname, "..", "..", "frontend")));

// ======================
// 📌 Página inicial
// ======================
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_HTML, "index.html"));
});

// ======================
// 📌 Servir automaticamente TODAS as páginas HTML
// ======================
const paginas = [
  "pag_adm.html",
  "geren_usuario.html",
  "geren_produtos.html",
  "mensagens.html",
  "teste-recaptcha.html"
];

paginas.forEach((arquivo) => {
  app.get(`/${arquivo}`, (req, res) => {
    res.sendFile(path.join(FRONTEND_HTML, arquivo));
  });
});

// ======================
// 📌 Rotas da API
// ======================
app.get("/api", (req, res) => {
  res.json({
    status: "OK",
    message: "API do projeto"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/feedbacks", feedbackRoutes);
app.use("/api/admins", adminRoutes);

export default app;
