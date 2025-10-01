import { db } from "./firebase-config.js";
import { collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

function aplicarMascaraTelefone(input) {
  input.addEventListener("input", function () {
    let valor = input.value.replace(/\D/g, "");

    if (valor.length > 11) {
      valor = valor.slice(0, 11);
    }

    if (valor.length > 0) {
      valor = "(" + valor;
    }
    if (valor.length > 3) {
      valor = valor.slice(0, 3) + ") " + valor.slice(3);
    }
    if (valor.length > 10) {
      valor = valor.slice(0, 10) + "-" + valor.slice(10);
    }

    input.value = valor;
  });
}

aplicarMascaraTelefone(document.getElementById("telefone"));

const userTable = document.getElementById('userTable');
const cadastroForm = document.getElementById('cadastroForm');

// Listar usuários
async function listarUsuarios() {
  userTable.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "usuarios"));
  querySnapshot.forEach((docSnap) => {
    const user = docSnap.data();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${docSnap.id}</td>
      <td>${user.nome}</td>
      <td>${user.email}</td>
      <td>${user.telefone}</td>
      <td><button onclick="excluirUsuario('${docSnap.id}')">Excluir</button></td>
    `;
    userTable.appendChild(row);
  });
}

// Adicionar usuário
cadastroForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nome = document.getElementById('nome').value;
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const telefone = document.getElementById('telefone').value;

  await addDoc(collection(db, "usuarios"), {
    nome,
    email,
    senha,
    telefone
  });

  cadastroForm.reset();
  listarUsuarios();
});

// Excluir usuário
window.excluirUsuario = async function(id) {
  await deleteDoc(doc(db, "usuarios", id));
  listarUsuarios();
};

// Carregar usuários ao abrir a página
listarUsuarios();
