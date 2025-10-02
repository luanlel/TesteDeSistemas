import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const cadastroForm = document.getElementById("cadastroForm");
const userTable = document.getElementById("userTable");
const telefoneInput = document.getElementById("telefone");

if (telefoneInput) {
  telefoneInput.addEventListener("input", function () {
    let numero = this.value.replace(/\D/g, "");
    if (numero.length > 11) {
      numero = numero.slice(0, 11);
    }
    if (numero.length > 0) {
      numero = "(" + numero;
    }
    if (numero.length > 3) {
      numero = numero.slice(0, 3) + ") " + numero.slice(3);
    }
    if (numero.length > 10) {
      numero = numero.slice(0, 10) + "-" + numero.slice(10);
    }
    this.value = numero;
  });
}

cadastroForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const telefone = document.getElementById("telefone").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      senha
    );
    const user = userCredential.user;

    await setDoc(doc(db, "usuarios", user.uid), {
      nomeCompleto: nome,
      email: email,
      telefone: telefone,
    });

    alert("Usuário cadastrado com sucesso!");
    cadastroForm.reset();
    carregarUsuarios(); 
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    alert(`Erro ao cadastrar: ${error.message}`);
  }
});

async function carregarUsuarios() {
  try {
    const usuariosRef = collection(db, "usuarios");
    const snapshot = await getDocs(usuariosRef);

    userTable.innerHTML = "";

    if (snapshot.empty) {
      userTable.innerHTML = '<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>';
      return;
    }

    snapshot.forEach(docSnap => {
      const usuario = docSnap.data();
      const id = docSnap.id;

      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td>${id.substring(0, 8)}...</td>
        <td>${usuario.nomeCompleto || usuario.nome || 'N/A'}</td>
        <td>${usuario.email || 'N/A'}</td>
        <td>${usuario.telefone || 'N/A'}</td>
        <td><button class="btn-excluir" data-id="${id}">Excluir</button></td>
      `;
      userTable.appendChild(linha);
    });
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    alert("Não foi possível carregar a lista de usuários.");
  }
}

async function excluirUsuario(id) {
  if (confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
    try {
      await deleteDoc(doc(db, "usuarios", id));
      alert("Usuário excluído com sucesso!");
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Erro ao excluir usuário.");
    }
  }
}

document.addEventListener("DOMContentLoaded", carregarUsuarios);

userTable.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-excluir')) {
    const userId = e.target.dataset.id;
    excluirUsuario(userId);
  }
});