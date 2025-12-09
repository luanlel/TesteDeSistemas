import { auth, db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";


// =======================================================
// 🔐 VERIFICAR SE ADMIN ESTÁ LOGADO
// =======================================================
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    alert("Você precisa estar autenticado.");
    window.location.href = "index.html";
    return;
  }

  carregarUsuarios();
});


// =======================================================
// 📌 CARREGAR LISTA DE USUÁRIOS
// =======================================================
async function carregarUsuarios() {
  const tabela = document.getElementById("userTable");
  tabela.innerHTML = "<tr><td colspan='5'>Carregando...</td></tr>";

  const snap = await getDocs(collection(db, "usuarios"));

  if (snap.empty) {
    tabela.innerHTML = "<tr><td colspan='5'>Nenhum usuário cadastrado.</td></tr>";
    return;
  }

  tabela.innerHTML = "";

  snap.forEach((docItem) => {
    const u = docItem.data();

    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${docItem.id}</td>
      <td>${u.nome}</td>
      <td>${u.email}</td>
      <td>${u.telefone}</td>
      <td>
        <button class="btn-editar" data-id="${docItem.id}">Editar</button>
        <button class="btn-excluir" data-id="${docItem.id}">Excluir</button>
      </td>
    `;

    tabela.appendChild(linha);
  });

  ativarAcoesTabela();
}


// =======================================================
// 🔧 BOTÕES DA TABELA
// =======================================================
function ativarAcoesTabela() {
  // Excluir
  document.querySelectorAll(".btn-excluir").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Excluir usuário?")) return;

      try {
        await deleteDoc(doc(db, "usuarios", btn.dataset.id));
        alert("Usuário excluído!");
        carregarUsuarios();
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir.");
      }
    };
  });

  // Editar
  document.querySelectorAll(".btn-editar").forEach((btn) => {
    btn.onclick = () => abrirModalEditar(btn.dataset.id);
  });
}


// =======================================================
// 🟦 ABRIR MODAL DE EDIÇÃO (CORRIGIDO)
// =======================================================
async function abrirModalEditar(id) {
  const modal = document.getElementById("modalEdicao");

  const snap = await getDoc(doc(db, "usuarios", id));
  if (!snap.exists()) return;

  const u = snap.data();

  document.getElementById("editNome").value = u.nome;
  document.getElementById("editEmail").value = u.email;
  document.getElementById("editTelefone").value = u.telefone;
  document.getElementById("editRole").value = u.role ?? "usuario";

  modal.dataset.id = id;
  modal.classList.remove("hidden");  // <-- CORREÇÃO
}


// FECHAR MODAL
function fecharModal() {
  document.getElementById("modalEdicao").classList.add("hidden");
}

document.getElementById("btnFecharModal").onclick = fecharModal;
document.getElementById("btnCancelarEdicao").onclick = fecharModal;


// =======================================================
// 💾 SALVAR ALTERAÇÕES
// =======================================================
document.getElementById("formEditarUsuario").addEventListener("submit", async (e) => {
  e.preventDefault();

  const id = document.getElementById("modalEdicao").dataset.id;

  const nome = document.getElementById("editNome").value;
  const email = document.getElementById("editEmail").value;
  const telefone = document.getElementById("editTelefone").value;
  const role = document.getElementById("editRole").value;

  try {
    await updateDoc(doc(db, "usuarios", id), {
      nome,
      email,
      telefone,
      role,
      atualizadoEm: new Date().toISOString()
    });

    alert("Usuário atualizado!");
    fecharModal();
    carregarUsuarios();
  } catch (err) {
    console.error(err);
    alert("Erro ao atualizar.");
  }
});


// =======================================================
// 🟩 CADASTRO DE USUÁRIO COMUM
// =======================================================
document.getElementById("cadastroForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const telefone = document.getElementById("telefone").value;

  try {
    await addDoc(collection(db, "usuarios"), {
      nome,
      email,
      senha,
      telefone,
      role: "usuario",
      criadoEm: new Date().toISOString()
    });

    alert("Usuário cadastrado!");
    e.target.reset();
    carregarUsuarios();
  } catch (err) {
    console.error(err);
    alert("Erro ao cadastrar usuário.");
  }
});


// =======================================================
// 🟥 CADASTRO COMPLETO DE ADMINISTRADOR
// =======================================================
document.getElementById("cadastroAdmForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("adm-nome").value;
  const email = document.getElementById("adm-email").value;
  const senha = document.getElementById("adm-senha").value;
  const telefone = document.getElementById("adm-telefone").value;

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);
    const adminId = cred.user.uid;

    await setDoc(doc(db, "admins", adminId), {
      nome,
      email,
      senha,
      telefone,
      role: "admin",
      criadoEm: new Date().toISOString()
    });

    await setDoc(doc(db, "usuarios", adminId), {
      nome,
      email,
      senha,
      telefone,
      role: "admin",
      criadoEm: new Date().toISOString()
    });

    alert("Administrador cadastrado!");
    e.target.reset();
    carregarUsuarios();

  } catch (err) {
    console.error(err);
    alert("Erro ao cadastrar administrador.");
  }
});
