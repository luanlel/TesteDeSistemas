// backend/src/middlewares/requireAdmin.js
import { db } from "../config/firebase-admin.js";

/**
 * Middleware para garantir que o usuário autenticado é ADMIN.
 * Ele verifica se existe um documento em "admins/{uid}".
 */
export async function requireAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ error: "Usuário não autenticado." });
    }

    const adminDoc = await db.collection("admins").doc(req.user.uid).get();

    if (!adminDoc.exists) {
      return res.status(403).json({
        error: "Acesso negado. Apenas administradores podem acessar esta rota.",
      });
    }

    // Guarda dados do admin, caso precise
    req.admin = { id: adminDoc.id, ...adminDoc.data() };

    next();
  } catch (err) {
    console.error("Erro ao verificar admin:", err);
    return res.status(500).json({
      error: "Erro ao verificar permissões de administrador.",
      details: err.message,
    });
  }
}
