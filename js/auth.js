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

// Login
export async function login(email, senha) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    // Verifica se usuário é admin (exemplo: pelo Firestore)
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;

    if (userData?.role === "admin") {
      localStorage.setItem("logado", "admin");
      window.location.href = "../html/adm.html";
    } else {
      localStorage.setItem("logado", "usuario");
      window.location.href = "../html/vendas.html";
    }

    return true;
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
