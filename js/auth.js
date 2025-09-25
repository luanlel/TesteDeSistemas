// auth.js
import { auth } from "./firebase-config.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

// Login com Firebase
export async function login(email, senha) {
  try {
    await signInWithEmailAndPassword(auth, email, senha);
    window.location.href = "adm.html"; // redireciona se login for sucesso
    return true;
  } catch (error) {
    console.error("Erro no login:", error.message);
    return false;
  }
}

// Logout com Firebase
export async function logout() {
  await signOut(auth);
  window.location.href = "index.html";
}

// Verificar se está logado
export function verificarLogin() {
  onAuthStateChanged(auth, (user) => {
    if (!user) {
      window.location.href = "index.html"; // se não tiver logado
    }
  });
}
