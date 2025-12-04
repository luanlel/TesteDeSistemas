import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

export async function login(email, senha) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    const adminQuery = query(collection(db, "admins"), where("email", "==", email));
    const adminSnap = await getDocs(adminQuery);

    if (!adminSnap.empty) {
      console.log("Login de administrador detectado");
      localStorage.setItem("logado", "admin");
      window.location.href = "../html/pag_adm.html";
      return true;
    }

    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    if (userDoc.exists()) {
      console.log("Login de usuário comum detectado");
      localStorage.setItem("logado", "usuario");
      window.location.href = "../html/index.html";
      return true;
    }

    console.warn("Usuário não encontrado em admins nem usuarios");
    return false;
  } catch (error) {
    console.error("Erro no login:", error);
    return false;
  }
}

export async function logout() {
  await signOut(auth);
  localStorage.removeItem("logado");
  window.location.href = "../html/index.html";
}

export function verificarLoginAdmin(onSuccess) {
  onAuthStateChanged(auth, (user) => {
    if (user && localStorage.getItem("logado") === "admin") {
      if (onSuccess) onSuccess();
    } else {
      window.location.href = "../html/index.html";
    }
  });
}

export function verificarLoginUsuario(onSuccess) {
  onAuthStateChanged(auth, (user) => {
    if (user && localStorage.getItem("logado") === "usuario") {
      if (onSuccess) onSuccess();
    } else {
      window.location.href = "../html/index.html";
    }
  });
}