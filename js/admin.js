// js/init-admin.js
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

// Dados fixos do admin
const ADMIN_EMAIL = "adm@email.com";
const ADMIN_SENHA = "321456";

export async function initAdmin() {
  try {
    // Tenta logar com o admin
    const cred = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_SENHA);
    const uid = cred.user.uid;

    // Verifica se já existe documento no Firestore
    const userRef = doc(db, "usuarios", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        nome: "Administrador",
        email: ADMIN_EMAIL,
        telefone: "000000000",
        role: "admin",
        criadoEm: new Date()
      });
      console.log("Admin criado no Firestore!");
    } else {
      console.log("Admin já existe no Firestore!");
    }

  } catch (error) {
    // Se não existe no Auth, cria
    if (error.code === "auth/user-not-found") {
      const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_SENHA);
      const uid = cred.user.uid;

      await setDoc(doc(db, "usuarios", uid), {
        nome: "Administrador",
        email: ADMIN_EMAIL,
        telefone: "000000000",
        role: "admin",
        criadoEm: new Date()
      });

      console.log("Admin criado no Auth e Firestore!");
    } else {
      console.error("Erro ao inicializar admin:", error);
    }
  }
}
