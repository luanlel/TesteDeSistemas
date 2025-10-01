// js/init-admin.js
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const ADMIN_EMAIL = "adm@gmail.com";
const ADMIN_SENHA = "321456";

export async function initAdmin() {
  try {
    // Cria usuário admin no Auth (caso não exista ainda)
    let uid;
    try {
      const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_SENHA);
      uid = cred.user.uid;
      console.log("Admin criado no Auth!");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        console.log("Admin já existe no Auth!");
        // Se já existe no Auth, pega o UID atual (precisa logar manualmente pelo console ou login)
        // Aqui não temos signIn automático, mas podemos tratar via login normal
        return;
      } else {
        console.error("Erro no Auth:", error);
        return;
      }
    }

    if (!uid) return;

    // Verifica se existe no Firestore (coleção admins)
    const adminRef = doc(db, "admins", uid);
    const adminSnap = await getDoc(adminRef);

    if (!adminSnap.exists()) {
      await setDoc(adminRef, {
        nome: "Administrador",
        email: ADMIN_EMAIL,
        telefone: "000000000",
        criadoEm: new Date()
      });
      console.log("Admin salvo na coleção 'admins'!");
    } else {
      console.log("Admin já existe na coleção 'admins'!");
    }

  } catch (error) {
    console.error("Erro ao inicializar admin:", error);
  }
}
