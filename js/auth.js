// js/auth.js
import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export async function login(email, senha) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    // 1º tenta buscar na coleção admins
    const adminDoc = await getDoc(doc(db, "admins", user.uid));
    if (adminDoc.exists()) {
      localStorage.setItem("logado", "admin");
      window.location.href = "../html/pag_adm.html"; // painel de admin
      return true;
    }

    // 2º senão, busca na coleção usuarios
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    if (userDoc.exists()) {
      localStorage.setItem("logado", "usuario");
      window.location.href = "../html/pag_comp_vend.html"; // painel do usuário
      return true;
    }

    return false;
  } catch (error) {
    console.error("Erro no login:", error);
    return false;
  }
}

// Logout
export async function logout() {
  await signOut(auth);
  localStorage.removeItem("logado");
  window.location.href = "../html/index.html";
}

// Verificar login admin
export function verificarLoginAdmin() {
  onAuthStateChanged(auth, (user) => {
    if (!user || localStorage.getItem("logado") !== "admin") {
      window.location.href = "../html/index.html";
    }
  });
}

// Verificar login usuário
export function verificarLoginUsuario() {
  onAuthStateChanged(auth, (user) => {
    if (!user || localStorage.getItem("logado") !== "usuario") {
      window.location.href = "../html/index.html";
    }
  });
}
