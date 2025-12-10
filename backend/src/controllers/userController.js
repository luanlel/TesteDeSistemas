// backend/src/controllers/userController.js
import { db, admin } from "../config/firebase-admin.js";

/**
 * 🔹 GET /api/users
 * Lista todos os usuários
 */
export async function getAllUsers(req, res, next) {
  try {
    const snap = await db.collection("usuarios").get();
    const users = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    res.json(users);
  } catch (err) {
    next(err);
  }
}

/**
 * 🔹 POST /api/users
 * Cria um usuário comum (apenas documento no Firestore)
 */
export async function createUser(req, res, next) {
  try {
    const { nome, email, telefone, role } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        error: "Nome e e-mail são obrigatórios.",
      });
    }

    const data = {
      nome,
      email,
      telefone: telefone || "",
      role: role || "usuario",
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("usuarios").add(data);
    const docSnap = await docRef.get();

    res.status(201).json({
      id: docRef.id,
      ...docSnap.data(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 🔹 PUT /api/users/:id
 * Atualiza dados do usuário
 */
export async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    const { nome, email, telefone, role } = req.body;

    const docRef = db.collection("usuarios").doc(id);
    const snap = await docRef.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }

    const updates = {};
    if (nome !== undefined) updates.nome = nome;
    if (email !== undefined) updates.email = email;
    if (telefone !== undefined) updates.telefone = telefone;
    if (role !== undefined) updates.role = role;

    updates.atualizadoEm = admin.firestore.FieldValue.serverTimestamp();

    await docRef.update(updates);

    const updatedSnap = await docRef.get();

    res.json({
      id: updatedSnap.id,
      ...updatedSnap.data(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 🔹 DELETE /api/users/:id
 * Remove usuário (e opcionalmente remove da coleção admins)
 */
export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    // Apaga da coleção usuarios
    await db.collection("usuarios").doc(id).delete();

    // Se existir na coleção admins, remove também
    const adminRef = db.collection("admins").doc(id);
    const adminSnap = await adminRef.get();
    if (adminSnap.exists) {
      await adminRef.delete();
    }

    res.json({ message: "Usuário excluído com sucesso." });
  } catch (err) {
    next(err);
  }
}

/**
 * 🔹 POST /api/users/admin
 * Cria um ADMIN completo:
 *  - usuário no Firebase Auth
 *  - documento em "admins/{uid}"
 *  - documento em "usuarios/{uid}"
 */
export async function createAdmin(req, res, next) {
  try {
    const { nome, email, senha, telefone } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({
        error: "Nome, e-mail e senha são obrigatórios para criar um admin.",
      });
    }

    // 1) Cria usuário no Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password: senha,
      displayName: nome,
    });

    const uid = userRecord.uid;

    // 2) Monta dados padrão
    const data = {
      nome,
      email,
      telefone: telefone || "",
      role: "admin",
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 3) Salva em admins/{uid}
    await db.collection("admins").doc(uid).set(data);

    // 4) Salva em usuarios/{uid}
    await db.collection("usuarios").doc(uid).set(data);

    res.status(201).json({
      id: uid,
      ...data,
    });
  } catch (err) {
    // Se der erro "email já em uso", responde bonitinho
    if (err.code === "auth/email-already-exists") {
      return res.status(400).json({
        error: "Este e-mail já está em uso em outra conta.",
      });
    }

    next(err);
  }
}
