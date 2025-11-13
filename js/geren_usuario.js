/**
 * geren_usuario.js
 * Cadastro e gerenciamento de usuários
 */

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ===============================
// Elementos
// ===============================
const cadastroForm = document.getElementById("cadastroForm");
const userTable = document.getElementById("userTable");
const nomeInput = document.getElementById("nome");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("senha");
const telefoneInput = document.getElementById("telefone");

// ===============================
// Máscara e validação de telefone
// ===============================
function aplicarMascaraTelefone(input) {
  if (!input) return;
  input.setAttribute("maxlength", "15");
  input.setAttribute("inputmode", "numeric");

  input.addEventListener("input", function (e) {
    let valor = e.target.value.replace(/\D/g, ""); // Remove tudo que não for número
    if (valor.length > 11) valor = valor.slice(0, 11); // Limita a 11 dígitos

    // Aplica máscara (formato brasileiro)
    if (valor.length > 6) {
      e.target.value = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7, 11)}`;
    } else if (valor.length > 2) {
      e.target.value = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}`;
    } else if (valor.length > 0) {
      e.target.value = `(${valor}`;
    } else {
      e.target.value = "";
    }
  });
}

// Aplica máscara nos campos de telefone
aplicarMascaraTelefone(document.getElementById("telefone"));
aplicarMascaraTelefone(document.getElementById("adm-telefone"));

// ===============================
// Cadastro de novo usuário
// ===============================
cadastroForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = nomeInput.value.trim();
  const email = emailInput.value.trim();
  const senha = senhaInput.value.trim();
  const telefone = telefoneInput.value.trim();

  // Validações
  if (nome.length < 3) return alert("Informe um nome completo válido.");
  if (!email.match(/^\S+@\S+\.\S+$/)) return alert("Informe um email válido.");
  if (senha.length < 6 || senha.length > 20)
    return alert("Senha deve ter entre 6 e 20 caracteres.");
  if (telefone.replace(/\D/g, "").length < 10)
    return alert("Informe um telefone válido (10 ou 11 dígitos).");

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    await setDoc(doc(db, "usuarios", user.uid), {
      nome,
      email,
      telefone,
      dataCadastro: new Date().toISOString(),
      role: "usuario"
    });

    alert("✅ Usuário cadastrado com sucesso!");
    cadastroForm.reset();
    carregarUsuarios();
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    if (error.code === "auth/email-already-in-use") {
      alert("❌ Este email já está em uso. Tente outro ou redefina a senha.");
    } else {
      alert(`❌ Erro ao cadastrar: ${error.message}`);
    }
  }
});

// ===============================
// Cadastro de novo ADMINISTRADOR
// ===============================
const cadastroAdmForm = document.getElementById("cadastroAdmForm");
if (cadastroAdmForm) {
  cadastroAdmForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("adm-nome").value.trim();
    const email = document.getElementById("adm-email").value.trim();
    const senha = document.getElementById("adm-senha").value.trim();
    const telefone = document.getElementById("adm-telefone").value.trim();

    if (nome.length < 3) return alert("Informe um nome completo válido.");
    if (!email.match(/^\S+@\S+\.\S+$/)) return alert("Informe um email válido.");
    if (senha.length < 6 || senha.length > 20)
      return alert("Senha deve ter entre 6 e 20 caracteres.");
    if (telefone.replace(/\D/g, "").length < 10)
      return alert("Informe um telefone válido (10 ou 11 dígitos).");

    try {
      const adminsRef = collection(db, "admins");
      await setDoc(doc(adminsRef), {
        nome,
        email,
        senha,
        telefone,
        criadoEm: new Date().toISOString(),
        role: "admin"
      });

      alert("✅ Administrador cadastrado com sucesso!");
      cadastroAdmForm.reset();
    } catch (error) {
      console.error("Erro ao cadastrar administrador:", error);
      alert("❌ Erro ao cadastrar administrador.");
    }
  });
}

// ===============================
// Carregar usuários
// ===============================
async function carregarUsuarios() {
  try {
    const usuariosRef = collection(db, "usuarios");
    const snapshot = await getDocs(usuariosRef);

    userTable.innerHTML = "";

    if (snapshot.empty) {
      userTable.innerHTML = '<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>';
      return;
    }

    const listaUsuarios = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        nome: data.nome || "N/A",
        email: data.email || "N/A",
        telefone: data.telefone || "N/A",
        dataCadastro: data.dataCadastro || null
      };
    });

    listaUsuarios.sort((a, b) => {
      if (!a.dataCadastro && !b.dataCadastro) return 0;
      if (!a.dataCadastro) return -1;
      if (!b.dataCadastro) return 1;
      return new Date(a.dataCadastro) - new Date(b.dataCadastro);
    });

    listaUsuarios.forEach((usuario, index) => {
      const idFormatado = String(index + 1).padStart(3, "0");
      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td>${idFormatado}</td>
        <td>${usuario.nome}</td>
        <td>${usuario.email}</td>
        <td>${usuario.telefone}</td>
        <td class="acoes-coluna">
          <button class="btn-editar" data-id="${usuario.id}">Editar</button>
          <button class="btn-reset" data-email="${usuario.email}" data-action="reset">Redefinir Senha</button>
          <button class="btn-excluir" data-id="${usuario.id}">Excluir</button>
        </td>
      `;
      userTable.appendChild(linha);
    });
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    alert("⚠️ Não foi possível carregar a lista de usuários.");
  }
}

// ===============================
// Excluir usuário
// ===============================
async function excluirUsuario(id) {
  if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
  try {
    await deleteDoc(doc(db, "usuarios", id));
    alert("🗑️ Usuário excluído com sucesso!");
    carregarUsuarios();
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    alert("Erro ao excluir usuário.");
  }
}

// ===============================
// Editar usuário (com máscara no telefone)
// ===============================
function criarModalEdicaoUsuario() {
  let modal = document.createElement("div");
  modal.id = "modalEdicaoUsuario";
  modal.className = "modal-overlay hidden";
  modal.innerHTML = `
    <div class="modal-card card">
      <div class="modal-header">
        <h3>Editar Usuário</h3>
        <button class="modal-close" id="btnFecharModalEdicaoUsuario" aria-label="Fechar modal">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <form id="formEditarUsuario" class="form-elegant">
        <div class="form-group"><label>Nome:</label><input id="editUserNome" maxlength="100" required></div>
        <div class="form-group"><label>Email:</label><input id="editUserEmail" type="email" maxlength="100" required></div>
        <div class="form-group"><label>Telefone:</label><input id="editUserTelefone" maxlength="15" inputmode="numeric"></div>
        <div class="form-buttons actions-right">
          <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg"></i> Salvar</button>
          <button type="button" id="cancelEditUser" class="btn btn-outline"><i class="bi bi-x-lg"></i> Cancelar</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(modal);

  document.getElementById("btnFecharModalEdicaoUsuario").addEventListener("click", fecharModalEdicaoUsuario);
  document.getElementById("cancelEditUser").addEventListener("click", fecharModalEdicaoUsuario);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) fecharModalEdicaoUsuario();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) fecharModalEdicaoUsuario();
  });
}

function fecharModalEdicaoUsuario() {
  const modal = document.getElementById("modalEdicaoUsuario");
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
}

criarModalEdicaoUsuario();

async function abrirEditarUsuario(id) {
  try {
    const usuariosRef = collection(db, "usuarios");
    const snapshot = await getDocs(usuariosRef);
    const docSnap = snapshot.docs.find(d => d.id === id);
    if (!docSnap) return alert("Usuário não encontrado.");
    const u = docSnap.data();

    const modal = document.getElementById("modalEdicaoUsuario");
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    const editNome = document.getElementById("editUserNome");
    const editEmail = document.getElementById("editUserEmail");
    const editTelefone = document.getElementById("editUserTelefone");

    editNome.value = u.nome || "";
    editEmail.value = u.email || "";
    editTelefone.value = u.telefone || "";

    aplicarMascaraTelefone(editTelefone);

    document.getElementById("formEditarUsuario").onsubmit = async (e) => {
      e.preventDefault();
      const nome = editNome.value.trim();
      const email = editEmail.value.trim();
      const telefone = editTelefone.value.trim();

      try {
        await setDoc(doc(db, "usuarios", id), { nome, email, telefone }, { merge: true });
        fecharModalEdicaoUsuario();
        alert("✅ Usuário atualizado com sucesso!");
        carregarUsuarios();
      } catch (err) {
        console.error("Erro ao atualizar usuário", err);
        alert("Erro ao atualizar usuário.");
      }
    };
  } catch (error) {
    console.error(error);
    alert("Erro ao abrir edição de usuário.");
  }
}

// ===============================
// Eventos gerais
// ===============================
document.addEventListener("DOMContentLoaded", carregarUsuarios);

userTable.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-excluir")) {
    excluirUsuario(e.target.dataset.id);
  } else if (e.target.classList.contains("btn-editar")) {
    abrirEditarUsuario(e.target.dataset.id);
  } else if (e.target.dataset.action === "reset") {
    const email = e.target.dataset.email;
    if (email && confirm(`Enviar email de redefinição de senha para ${email}?`)) {
      try {
        await sendPasswordResetEmail(auth, email);
        alert("📧 Email de redefinição enviado com sucesso.");
      } catch (err) {
        console.error("Erro ao enviar email de redefinição:", err);
        alert("Erro ao enviar email de redefinição.");
      }
    }
  }
});
