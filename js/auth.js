// js/auth.js
import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Admin fixo
const admin = {
  email: "adm@email.com",
  senha: "321456"
};

// Função de login
export async function login(email, senha) {
  // Verifica se é admin fixo
  if (email === admin.email && senha === admin.senha) {
    localStorage.setItem("logado", "admin");
    window.location.href = "../html/adm.html";
    return true;
  }

  // Se não for admin → busca no Firestore
  const q = query(
    collection(db, "usuarios"),
    where("email", "==", email),
    where("senha", "==", senha) // ⚠️ só para teste, inseguro
  );

  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    localStorage.setItem("logado", "usuario");
    window.location.href = "../html/vendas.html";
    return true;
  }

  return false;
}

export function logout() {
  localStorage.removeItem("logado");
  window.location.href = "../html/index.html";
}

export function verificarLoginAdmin() {
  if (localStorage.getItem("logado") !== "admin") {
    window.location.href = "../html/index.html";
  }
}

export function verificarLoginUsuario() {
  if (localStorage.getItem("logado") !== "usuario") {
    window.location.href = "../html/index.html";
  }
}
