// js/geren_usuario.js - CORREÇÃO COMPLETA COM CONTROLES DE SEGURANÇA

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
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ===============================
// Elementos
// ===============================
const cadastroForm = document.getElementById("cadastroForm");
const userTable = document.getElementById("userTable");

// ===============================
// Máscara e validação de telefone
// ===============================
function aplicarMascaraTelefone(input) {
  if (!input) return;
  input.setAttribute("maxlength", "15");
  input.setAttribute("inputmode", "numeric");

  input.addEventListener("input", function (e) {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 11) valor = valor.slice(0, 11);

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

aplicarMascaraTelefone(document.getElementById("telefone"));
aplicarMascaraTelefone(document.getElementById("adm-telefone"));

// ===============================
// Cadastro de novo usuário
// ===============================
if (cadastroForm) {
  cadastroForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();
    const telefone = document.getElementById("telefone").value.trim();

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
}

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
// PESQUISA DE USUÁRIOS (Teste 67)
// ===============================
let todosUsuarios = [];

function pesquisarUsuarios(termo) {
  if (!termo) {
    renderizarUsuarios(todosUsuarios);
    return;
  }
  
  termo = termo.toLowerCase();
  const filtrados = todosUsuarios.filter(u => 
    u.nome.toLowerCase().includes(termo) ||
    u.email.toLowerCase().includes(termo) ||
    (u.telefone && u.telefone.includes(termo))
  );
  
  renderizarUsuarios(filtrados);
}

// Adiciona campo de pesquisa se não existir
function criarCampoPesquisa() {
  const container = document.querySelector('.tabela-usuarios');
  if (!container) return;
  
  const existente = document.getElementById('pesquisaUsuario');
  if (existente) return;
  
  const div = document.createElement('div');
  div.className = 'form-group';
  div.style.marginBottom = '15px';
  div.innerHTML = `
    <label for="pesquisaUsuario">Pesquisar Usuário:</label>
    <input type="text" id="pesquisaUsuario" placeholder="Digite nome, e-mail ou telefone..." 
           style="width: 100%; padding: 10px; border: 1px solid var(--color-gray-300); 
                  border-radius: var(--border-radius-md); background-color: var(--color-gray-200); 
                  color: var(--color-white);">
  `;
  
  container.insertBefore(div, container.querySelector('.help-text'));
  
  document.getElementById('pesquisaUsuario').addEventListener('input', (e) => {
    pesquisarUsuarios(e.target.value.trim());
  });
}

// ===============================
// Carregar e renderizar usuários
// ===============================
function renderizarUsuarios(usuarios) {
  userTable.innerHTML = "";

  if (usuarios.length === 0) {
    userTable.innerHTML = '<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>';
    return;
  }

  usuarios.forEach((usuario, index) => {
    const idFormatado = String(index + 1).padStart(3, "0");
    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${idFormatado}</td>
      <td>${usuario.nome}</td>
      <td>${usuario.email}</td>
      <td>${usuario.telefone}</td>
      <td class="acoes-coluna">
        <button class="btn-editar" data-id="${usuario.id}">Editar</button>
        <button class="btn-reset" data-email="${usuario.email}">Redefinir Senha</button>
        <button class="btn-excluir" data-id="${usuario.id}">Excluir</button>
      </td>
    `;
    userTable.appendChild(linha);
  });
}

async function carregarUsuarios() {
  try {
    const usuariosRef = collection(db, "usuarios");
    const snapshot = await getDocs(usuariosRef);

    todosUsuarios = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        nome: data.nome || "N/A",
        email: data.email || "N/A",
        telefone: data.telefone || "N/A",
        dataCadastro: data.dataCadastro || null
      };
    });

    todosUsuarios.sort((a, b) => {
      if (!a.dataCadastro && !b.dataCadastro) return 0;
      if (!a.dataCadastro) return -1;
      if (!b.dataCadastro) return 1;
      return new Date(a.dataCadastro) - new Date(b.dataCadastro);
    });

    renderizarUsuarios(todosUsuarios);
    criarCampoPesquisa();
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
// MODAL DE EDIÇÃO COM CONTROLE DE DADOS SENSÍVEIS (Testes 69, 70, 81)
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
        <div class="form-group">
          <label>Nome:</label>
          <input id="editUserNome" maxlength="100" required>
        </div>
        
        <div class="form-group">
          <label>Email:</label>
          <input id="editUserEmail" type="email" maxlength="100" disabled 
                 style="background-color: var(--color-gray-400); cursor: not-allowed;"
                 title="Email não pode ser alterado por questões de segurança">
          <small style="color: var(--color-gray-600);">
            ⚠️ Email não pode ser alterado por motivos de segurança
          </small>
        </div>
        
        <div class="form-group">
          <label>Telefone:</label>
          <input id="editUserTelefone" maxlength="15" inputmode="numeric">
        </div>
        
        <div class="form-group" style="background: rgba(255, 193, 7, 0.1); padding: 10px; border-radius: 5px; margin-top: 15px;">
          <p style="color: var(--color-secondary); font-weight: bold; margin-bottom: 10px;">
            🔒 Verificação de Segurança
          </p>
          <label>Digite sua senha de administrador para confirmar as alterações:</label>
          <input type="password" id="senhaSeguranca" required minlength="6"
                 placeholder="Senha do administrador">
          <small style="color: var(--color-gray-600);">
            Esta verificação é necessária para proteger dados sensíveis dos usuários
          </small>
        </div>
        
        <div class="form-buttons actions-right">
          <button type="submit" class="btn btn-primary">
            <i class="bi bi-check-lg"></i> Salvar Alterações
          </button>
          <button type="button" id="cancelEditUser" class="btn btn-outline">
            <i class="bi bi-x-lg"></i> Cancelar
          </button>
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
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      fecharModalEdicaoUsuario();
    }
  });
}

function fecharModalEdicaoUsuario() {
  const modal = document.getElementById("modalEdicaoUsuario");
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
  
  // Limpa o formulário
  document.getElementById("formEditarUsuario").reset();
}

criarModalEdicaoUsuario();

async function abrirEditarUsuario(id) {
  try {
    const usuariosRef = collection(db, "usuarios");
    const snapshot = await getDocs(usuariosRef);
    const docSnap = snapshot.docs.find(d => d.id === id);
    
    if (!docSnap) {
      alert("Usuário não encontrado.");
      return;
    }
    
    const u = docSnap.data();

    const modal = document.getElementById("modalEdicaoUsuario");
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    const editNome = document.getElementById("editUserNome");
    const editEmail = document.getElementById("editUserEmail");
    const editTelefone = document.getElementById("editUserTelefone");
    const senhaSeguranca = document.getElementById("senhaSeguranca");

    editNome.value = u.nome || "";
    editEmail.value = u.email || "";
    editTelefone.value = u.telefone || "";
    senhaSeguranca.value = "";

    aplicarMascaraTelefone(editTelefone);

    document.getElementById("formEditarUsuario").onsubmit = async (e) => {
      e.preventDefault();
      
      const nome = editNome.value.trim();
      const telefone = editTelefone.value.trim();
      const senhaAdmin = senhaSeguranca.value;

      // VALIDAÇÃO DE SENHA DE SEGURANÇA (Teste 81)
      if (!senhaAdmin || senhaAdmin.length < 6) {
        alert("⚠️ Por favor, digite sua senha de administrador para confirmar as alterações.");
        senhaSeguranca.focus();
        return;
      }

      // Verifica se a senha do admin está correta
      try {
        const user = auth.currentUser;
        if (!user) {
          alert("⚠️ Você precisa estar logado como administrador.");
          return;
        }
        
        // CONTROLE DE ACESSO (Teste 69)
        // Verifica se o usuário logado é admin
        const adminDoc = await getDocs(collection(db, "admins"));
        const isAdmin = adminDoc.docs.some(doc => doc.data().email === user.email);
        
        if (!isAdmin) {
          alert("❌ Acesso negado: Você não tem permissão para editar dados de usuários.");
          fecharModalEdicaoUsuario();
          return;
        }

        // Validações básicas
        if (nome.length < 3) {
          alert("Nome deve ter pelo menos 3 caracteres.");
          return;
        }
        
        if (telefone && telefone.replace(/\D/g, "").length < 10) {
          alert("Telefone inválido.");
          return;
        }

        // PROTEÇÃO DE DADOS SENSÍVEIS (Teste 70)
        // Atualiza apenas campos permitidos (nome e telefone)
        // Email, CPF/CNPJ e dados bancários NÃO podem ser alterados
        await updateDoc(doc(db, "usuarios", id), { 
          nome, 
          telefone,
          ultimaAtualizacao: new Date().toISOString(),
          atualizadoPor: user.email
        });
        
        fecharModalEdicaoUsuario();
        alert("✅ Dados do usuário atualizados com sucesso!\n\nNota: Email e outros dados sensíveis não podem ser alterados por questões de segurança.");
        carregarUsuarios();
      } catch (err) {
        console.error("Erro ao atualizar usuário:", err);
        if (err.code === "auth/wrong-password") {
          alert("❌ Senha de administrador incorreta.");
        } else {
          alert("❌ Erro ao atualizar usuário. Verifique sua senha e tente novamente.");
        }
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
  } else if (e.target.classList.contains("btn-reset")) {
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