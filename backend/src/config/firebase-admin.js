// backend/src/config/firebase-admin.js
import "dotenv/config";
import admin from "firebase-admin";

/**
 * ============================================================
 *  🔥 CONFIGURAÇÃO PROFISSIONAL DO FIREBASE ADMIN
 *  Compatível com:
 *  - Ambiente local (.env com \n)
 *  - Vercel (private key em múltiplas linhas)
 *  - Railway / Render / Produção em geral
 * ============================================================
 */

function formatPrivateKey(key) {
  if (!key) return null;

  // Caso venha com aspas ao redor
  key = key.replace(/^"|"$/g, "");

  // Caso venha com \n do .env local → converter
  if (key.includes("\\n")) {
    return key.replace(/\\n/g, "\n");
  }

  // Caso já esteja multiline (Vercel) → apenas retornar
  return key;
}

const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

if (!privateKey) {
  console.error("❌ ERRO: FIREBASE_PRIVATE_KEY não carregada!");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });

  console.log("🔥 Firebase Admin inicializado com sucesso!");
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
