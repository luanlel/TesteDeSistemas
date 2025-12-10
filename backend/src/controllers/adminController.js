// backend/src/controllers/adminController.js
import { auth, db } from "../config/firebase-admin.js";

/**
 * POST /api/admins
 * Cria um usuário admin no Auth + coleções "admins" e "usuarios"
 */
export async function createAdmin(req, res, next) {
  try {
    const { nome, email, senha, telefone } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        error: "Nome, email e senha são obrigatórios.",
      });
    }

    // Cria o usuário no Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password: senha,
      displayName: nome,
    });

    const uid = userRecord.uid;

    // Salva na coleção admins
    await db.collection("admins").doc(uid).set({
      uid,
      nome,
      email,
      telefone: telefone || "",
      role: "admin",
      criadoEm: new Date().toISOString(),
    });

    // Também registra na coleção usuarios
    await db.collection("usuarios").doc(uid).set({
      uid,
      nome,
      email,
      telefone: telefone || "",
      role: "admin",
      criadoEm: new Date().toISOString(),
    });

    res.status(201).json({
      message: "Administrador criado com sucesso.",
      uid,
    });
  } catch (err) {
    next(err);
  }
}
