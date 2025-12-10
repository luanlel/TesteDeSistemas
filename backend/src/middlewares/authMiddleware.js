// backend/src/middlewares/authMiddleware.js
import { auth } from "../config/firebase-admin.js";

/**
 * Middleware para validar o token do Firebase enviado no header:
 * Authorization: Bearer TOKEN_AQUI
 */
export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não enviado." });
    }

    const token = header.substring(7);

    const decoded = await auth.verifyIdToken(token);

    // Dados do usuário autenticado disponíveis em todas as rotas
    req.user = decoded;

    next();
  } catch (err) {
    console.error("Erro no authMiddleware:", err);
    return res.status(401).json({
      error: "Token inválido ou expirado.",
      details: err.message,
    });
  }
}
