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

export const verifyRecaptcha = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, error: "Token reCAPTCHA ausente" });
    }

    const secret = process.env.RECAPTCHA_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, error: "RECAPTCHA_SECRET não configurado no servidor" });
    }

    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);

    const resp = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      body: params,
    });

    const data = await resp.json();

    // Para reCAPTCHA v3 pode retornar `score`. Aceitamos quando `success === true`
    // e, se houver `score`, exigimos >= 0.5 (ajustável conforme necessidade).
    if (!data.success) {
      return res.status(400).json({ success: false, message: "reCAPTCHA inválido", data });
    }

    if (typeof data.score === "number" && data.score < 0.5) {
      return res.status(400).json({ success: false, message: "reCAPTCHA com baixa pontuação", data });
    }

    return res.json({ success: true, data });
  } catch (err) {
    console.error("Erro ao verificar reCAPTCHA:", err);
    return res.status(500).json({ success: false, error: "Erro na verificação reCAPTCHA" });
  }
};
