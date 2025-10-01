import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const ADMIN_EMAIL = "adm@gmail.com";
const ADMIN_SENHA = "321456";

export async function setupAdmin() {
  try {
    let uid;

    try {
      const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_SENHA);
      uid = cred.user.uid;
      console.log("Admin criado no Auth!");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        console.log("Admin já existe no Auth. Tentando logar para recuperar UID...");
        const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_SENHA);
        uid = cred.user.uid;
      } else {
        console.error("Erro no Auth:", error);
        return "Erro no Auth";
      }
    }

    if (!uid) return "Não foi possível obter UID do admin";

    const adminRef = doc(db, "admins", uid);
    const snap = await getDoc(adminRef);

    if (!snap.exists()) {
      await setDoc(adminRef, {
        nome: "Administrador",
        email: ADMIN_EMAIL,
        telefone: "000000000",
        criadoEm: new Date()
      });
      console.log("Admin salvo em 'admins'!");
      return "Admin criado com sucesso!";
    } else {
      console.log("Admin já existe em 'admins'!");
      return "Admin já existe no Firestore!";
    }
  } catch (err) {
    console.error("Erro no setupAdmin:", err);
    return "Erro geral";
  }
}