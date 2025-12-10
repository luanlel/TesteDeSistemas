// frontend/js/geren_usuario.js
import { auth } from "./firebase-config.js";

// =====================================
// 🔧 CONFIG BASE DA API
// =====================================
const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000/api"
    : "/api";

// =====================================
// 🔐 PEGAR TOKEN DO FIREBASE (ADMIN LOGADO)
// =====================================
function esperarUsuarioLogado() {
  return new Promise((resolve, reject) => {
    const atual = auth.currentUser;
    if (atual) return resolve(atual);

    const unsub = auth.onAuthStateChanged((user) => {
      unsub();
      if (user) resolve(user);
      else reject(new Error("Nenhum usuário logado."));
    });
  });
}

async function getIdToken() {
  const user = await esperarUsuarioLogado();
  return user.getIdToken();
}

// Helper para chamadas na API com Authorization
async function apiFetch(path, options = {}) {
  const token = await getIdToken();

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const texto = await response.text().catch(() => "");
    throw new Error(`Erro na API (${response.status}): ${texto || response.statusText}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

// =====================================
// 📌 ELEMENTOS DA TELA
// =====================================
const tabelaBody = document.getElementById("userTable");
const formCadastro = document.getElementById("cadastroForm");
const formCadastroAdm = document.getElementById("cadastroAdmForm");

// Modal de edição
const modalEdicao = document.getElementById("modalEdicao");
const formEditarUsuario = document.getElementById("formEditarUsuario");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

let usuarioEditandoId = null;

// =====================================
// 🧾 LISTAR USUÁRIOS
// =====================================
async function carregarUsuarios() {
  tabelaBody.innerHTML = `
    <tr>
      <td colspan="5" style="padding: 16px; text-align: center;">Carregando usuários...</td>
    </tr>
  `;

  try {
    const usuarios = await apiFetch("/users");

    if (!usuarios || usuarios.length === 0) {
      tabelaBody.innerHTML = `
        <tr>
          <td colspan="5" style="padding: 16px; text-align: center;">
            Nenhum usuário cadastrado.
          </td>
        </tr>
      `;
      return;
    }

    tabelaBody.innerHTML = "";

    usuarios.forEach((u) => {
      const tr = document.createElement("tr");

      const telefoneFormatado = u.telefone
        ? u.telefone
        : "";

      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.nome || ""}</td>
        <td>${u.email || ""}</td>
        <td>${telefoneFormatado}</td>
        <td>
          <button 
            class="btn-editar"
            data-id="${u.id}"
            data-nome="${u.nome || ""}"
            data-email="${u.email || ""}"
            data-telefone="${u.telefone || ""}"
            data-role="${u.role || "usuario"}"
          >
            Editar
          </button>
          <button 
            class="btn-excluir"
            data-id="${u.id}"
            data-nome="${u.nome || ""}"
          >
            Excluir
          </button>
        </td>
      `;

      tabelaBody.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar usuários:", err);
    tabelaBody.innerHTML = `
      <tr>
        <td colspan="5" style="padding: 16px; text-align: center; color: #ffb3b3;">
          Erro ao carregar usuários. Veja o console.
        </td>
      </tr>
    `;
  }
}

// =====================================
// 🧱 MODAL DE EDIÇÃO
// =====================================
function abrirModalEditar(dados) {
  usuarioEditandoId = dados.id;

  document.getElementById("editNome").value = dados.nome || "";
  document.getElementById("editEmail").value = dados.email || "";
  document.getElementById("editTelefone").value = dados.telefone || "";
  document.getElementById("editRole").value = dados.role || "usuario";

  modalEdicao.classList.remove("hidden");
}

function fecharModal() {
  modalEdicao.classList.add("hidden");
  usuarioEditandoId = null;
  formEditarUsuario.reset();
}

btnFecharModal?.addEventListener("click", fecharModal);
btnCancelarEdicao?.addEventListener("click", fecharModal);

// Fecha modal clicando fora
modalEdicao?.addEventListener("click", (e) => {
  if (e.target === modalEdicao) {
    fecharModal();
  }
});

// ESC fecha modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalEdicao.classList.contains("hidden")) {
    fecharModal();
  }
});

// =====================================
// 🟦 CLICK NA TABELA (EDITAR / EXCLUIR)
// =====================================
tabelaBody.addEventListener("click", async (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = btn.dataset.id;

  if (btn.classList.contains("btn-editar")) {
    const dados = {
      id,
      nome: btn.dataset.nome,
      email: btn.dataset.email,
      telefone: btn.dataset.telefone,
      role: btn.dataset.role,
    };
    abrirModalEditar(dados);
  }

  if (btn.classList.contains("btn-excluir")) {
    const nome = btn.dataset.nome || "este usuário";

    if (!confirm(`Tem certeza que deseja excluir ${nome}?`)) return;

    try {
      await apiFetch(`/users/${id}`, { method: "DELETE" });
      alert("Usuário excluído com sucesso!");
      carregarUsuarios();
    } catch (err) {
      console.error("Erro ao excluir usuário:", err);
      alert("Erro ao excluir usuário. Veja o console.");
    }
  }
});

// =====================================
// 💾 SALVAR EDIÇÃO
// =====================================
formEditarUsuario.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!usuarioEditandoId) return;

  const nome = document.getElementById("editNome").value.trim();
  const email = document.getElementById("editEmail").value.trim();
  const telefone = document.getElementById("editTelefone").value.trim();
  const role = document.getElementById("editRole").value;

  if (!nome || !email) {
    alert("Nome e e-mail são obrigatórios.");
    return;
  }

  try {
    await apiFetch(`/users/${usuarioEditandoId}`, {
      method: "PUT",
      body: JSON.stringify({
        nome,
        email,
        telefone,
        role,
      }),
    });

    alert("Usuário atualizado com sucesso!");
    fecharModal();
    carregarUsuarios();
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    alert("Erro ao atualizar usuário. Veja o console.");
  }
});

// =====================================
// 🟩 CADASTRAR USUÁRIO COMUM (APENAS FIRESTORE)
// =====================================
formCadastro.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value.trim(); // só informativo aqui
  const telefone = document.getElementById("telefone").value.trim();

  if (!nome || !email) {
    alert("Nome e e-mail são obrigatórios.");
    return;
  }

  try {
    await apiFetch("/users", {
      method: "POST",
      body: JSON.stringify({
        nome,
        email,
        telefone,
        role: "usuario",
        // senha está aqui só se no futuro você quiser usar,
        // mas o backend atual não guarda a senha
      }),
    });

    alert("Usuário cadastrado com sucesso!");
    formCadastro.reset();
    carregarUsuarios();
  } catch (err) {
    console.error("Erro ao cadastrar usuário:", err);
    alert("Erro ao cadastrar usuário. Veja o console.");
  }
});

// =====================================
// 🟥 CADASTRAR ADMIN (USA /api/users/admin)
// =====================================
formCadastroAdm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("adm-nome").value.trim();
  const email = document.getElementById("adm-email").value.trim();
  const senha = document.getElementById("adm-senha").value.trim();
  const telefone = document.getElementById("adm-telefone").value.trim();

  if (!nome || !email || !senha) {
    alert("Nome, e-mail e senha são obrigatórios.");
    return;
  }

  try {
    await apiFetch("/users/admin", {
      method: "POST",
      body: JSON.stringify({
        nome,
        email,
        senha,
        telefone,
      }),
    });

    alert("Administrador cadastrado com sucesso!");
    formCadastroAdm.reset();
    carregarUsuarios();
  } catch (err) {
    console.error("Erro ao cadastrar admin:", err);
    alert("Erro ao cadastrar admin. Veja o console.");
  }
});

// =====================================
// 🚀 INICIALIZAÇÃO
// =====================================
window.addEventListener("DOMContentLoaded", () => {
  // Se chegar até aqui, o verificarLoginAdmin (no <head>) já bloqueou quem não é admin.
  carregarUsuarios();
  console.log("✅ Gerenciamento de usuários carregado usando a API.");
});
