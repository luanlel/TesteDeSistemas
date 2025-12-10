import { auth, db } from "../config/firebase-admin.js";
import { getAuth } from "firebase-admin/auth";

export const loginAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await getAuth().getUserByEmail(email);

    if (!user.customClaims?.admin) {
      return res.status(403).json({ error: "Acesso negado. Não é administrador." });
    }

    return res.json({
      message: "Admin autenticado",
      uid: user.uid,
    });

  } catch (err) {
    console.error("Erro no login admin:", err);
    return res.status(400).json({ error: "Erro ao autenticar admin" });
  }
};
