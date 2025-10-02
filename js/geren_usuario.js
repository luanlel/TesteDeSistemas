import { db } from "./firebase-config.js";
import { collection, getDocs, addDoc, deleteDoc, doc } 
  from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ---------- Função de máscara de telefone ----------
function aplicarMascaraTelefone(input) {
  input.addEventListener("input", function () {
    let valor = input.value.replace(/\D/g, ""); // só números

    if (valor.length > 11) valor = valor.slice(0, 11);

    // Monta máscara (XX) XXXXX-XXXX
    if (valor.length > 0) valor = "(" + valor;
    if (valor.length > 3) valor = valor.slice(0, 3) + ") " + valor.slice(3);
    if (valor.length > 10) valor = valor.slice(0, 10) + "-" + valor.slice(10);

    input.value = valor;
  });
}
aplicarMascaraTelefone(document.getElementById("telefone"));

const userTable = document.getElementById("userTable");
const cadastroForm = document.getElementById("cadastroForm");

// ---------- Listar usuários com IDs sequenciais ----------
async function listarUsuarios() {
  userTable.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "usuarios"));
  const usuarios = [];

  querySnapshot.forEach((docSnap) => {
    usuarios.push({ id: docSnap.id, ...docSnap.data() });
  });

  // Ordena pela data de criação (se existir)
  usuarios.sort((a, b) => (a.criadoEm?.seconds || 0) - (b.criadoEm?.seconds || 0));

  usuarios.forEach((user, index) => {
    const idSequencial = String(index + 1).padStart(3, "0"); // 001, 002, 003...

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${idSequencial}</td>
      <td>${user.nome}</td>
      <td>${user.email}</td>
      <td>${user.telefone}</td>
      <td><button onclick="excluirUsuario('${user.id}')">Excluir</button></td>
    `;
    userTable.appendChild(row);
  });
}

// ---------- Cadastro de novo usuário ----------
cadastroForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim();
  const telefone = document.getElementById("telefone").value.trim(); // já vem formatado

  await addDoc(collection(db, "usuarios"), {
    nome,
    email,
    senha,
    telefone, // salva formatado
    criadoEm: new Date() // usado para ordenar depois
  });

  cadastroForm.reset();
  listarUsuarios();
});

// ---------- Excluir usuário ----------
window.excluirUsuario = async function (id) {
  await deleteDoc(doc(db, "usuarios", id));
  listarUsuarios();
};

// Inicializa tabela
listarUsuarios();
