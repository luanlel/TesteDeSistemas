// js/geren_usuario.js - VERSÃO CORRIGIDA COM TODAS AS MELHORIAS

import { auth, db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ========== ELEMENTOS DOM ==========
const listaUsuariosTable = document.getElementById("listaUsuarios");
const modalEdicao = document.getElementById("modalEdicao");
const formEditarUsuario = document.getElementById("formEditarUsuario");
const btnFecharModal = document.getElementById("btnFecharModal");
const btnCancelarEdicao = document.getElementById("btnCancelarEdicao");

let usuarioEditandoId = null;
let emailOriginal = null;

// ========== CONFIGURAÇÕES ==========
const CONFIG = {
  MAX_NOME_LENGTH: 100,
  MIN_NOME_LENGTH: 3,
  TELEFONE_LENGTH: 11,
  TELEFONE_LENGTH_MIN: 10
};

// ========== MÁSCARA DE TELEFONE (CORRIGIDA) ==========
function aplicarMascaraTelefone(input) {
  if (!input) return;
  
  // Configura atributos do input
  input.setAttribute("maxlength", "15");
  input.setAttribute("inputmode", "numeric");
  input.setAttribute("placeholder", "(00) 00000-0000");
  
  // Previne entrada de não-números
  input.addEventListener("keypress", function(e) {
    const char = String.fromCharCode(e.keyCode || e.which);
    if (!/^[0-9]$/.test(char)) {
      e.preventDefault();
      mostrarErro(input, "Digite apenas números.");
      return false;
    }
  });
  
  // Previne colar texto não-numérico
  input.addEventListener("paste", function(e) {
    e.preventDefault();
    const texto = (e.clipboardData || window.clipboardData).getData('text');
    const numeros = texto.replace(/\D/g, '');
    if (numeros) {
      input.value = numeros;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  let ultimoValor = "";
  
  // Aplica máscara durante digitação
  input.addEventListener("input", function (e) {
    let valor = e.target.value.replace(/\D/g, "");
    
    // Verifica se tentou digitar não-número
    if (e.target.value !== valor && valor === "") {
      e.target.value = ultimoValor;
      return;
    }
    
    // Limita a 11 dígitos
    if (valor.length > CONFIG.TELEFONE_LENGTH) {
      valor = valor.slice(0, CONFIG.TELEFONE_LENGTH);
    }

    // Aplica formatação
    if (valor.length > 6) {
      e.target.value = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7, 11)}`;
    } else if (valor.length > 2) {
      e.target.value = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}`;
    } else if (valor.length > 0) {
      e.target.value = `(${valor}`;
    } else {
      e.target.value = "";
    }
    
    ultimoValor = e.target.value;
    limparErro(input);
  });

  // Valida ao sair do campo
  input.addEventListener("blur", function(e) {
    const apenasNumeros = e.target.value.replace(/\D/g, "");
    if (apenasNumeros.length > 0 && apenasNumeros.length < CONFIG.TELEFONE_LENGTH_MIN) {
      mostrarErro(e.target, `Telefone deve ter ${CONFIG.TELEFONE_LENGTH_MIN} ou ${CONFIG.TELEFONE_LENGTH} dígitos.`);
    } else {
      limparErro(e.target);
    }
  });
  
  // Valida ao focar
  input.addEventListener("focus", function() {
    limparErro(input);
  });
}

// ========== VALIDAÇÃO DE EMAIL ==========
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email || email.trim().length === 0) {
    return { valido: false, erro: 'E-mail é obrigatório' };
  }
  
  if (!regex.test(email)) {
    return { valido: false, erro: 'E-mail inválido' };
  }
  
  // Validações adicionais
  const partes = email.split('@');
  if (partes[0].length < 1) {
    return { valido: false, erro: 'E-mail inválido: parte antes do @ muito curta' };
  }
  
  const dominio = partes[1].split('.');
  if (dominio[0].length < 1 || dominio[dominio.length - 1].length < 2) {
    return { valido: false, erro: 'E-mail inválido: domínio incorreto' };
  }
  
  return { valido: true };
}

// ========== VALIDAÇÃO DE NOME ==========
function validarNome(nome) {
  if (!nome || nome.trim().length < CONFIG.MIN_NOME_LENGTH) {
    return {
      valido: false,
      erro: `Nome deve ter pelo menos ${CONFIG.MIN_NOME_LENGTH} caracteres`
    };
  }
  
  if (nome.length > CONFIG.MAX_NOME_LENGTH) {
    return {
      valido: false,
      erro: `Nome muito longo. Máximo: ${CONFIG.MAX_NOME_LENGTH} caracteres`
    };
  }
  
  // Verifica se tem pelo menos um espaço (nome e sobrenome)
  if (!nome.trim().includes(' ')) {
    return {
      valido: false,
      erro: 'Digite nome completo (nome e sobrenome)'
    };
  }
  
  return { valido: true };
}

// ========== VALIDAÇÃO DE TELEFONE ==========
function validarTelefone(telefone) {
  const apenasNumeros = telefone.replace(/\D/g, '');
  
  if (apenasNumeros.length < CONFIG.TELEFONE_LENGTH_MIN) {
    return {
      valido: false,
      erro: `Telefone deve ter ${CONFIG.TELEFONE_LENGTH_MIN} ou ${CONFIG.TELEFONE_LENGTH} dígitos`
    };
  }
  
  // Verifica padrões inválidos
  const numerosUnicos = new Set(apenasNumeros.split(''));
  if (numerosUnicos.size === 1) {
    return {
      valido: false,
      erro: 'Telefone inválido: todos os números são iguais'
    };
  }
  
  return { valido: true };
}

// ========== FUNÇÕES DE FEEDBACK VISUAL ==========
function mostrarErro(input, mensagem) {
  const container = input.parentElement;
  let erroEl = container.querySelector('.erro-validacao');
  
  if (!erroEl) {
    erroEl = document.createElement('div');
    erroEl.className = 'erro-validacao';
    erroEl.style.cssText = `
      color: var(--color-danger);
      font-size: 0.85em;
      margin-top: 5px;
      display: block;
    `;
    container.appendChild(erroEl);
  }
  
  erroEl.textContent = mensagem;
  input.style.borderColor = 'var(--color-danger)';
}

function limparErro(input) {
  const container = input.parentElement;
  const erroEl = container.querySelector('.erro-validacao');
  
  if (erroEl) {
    erroEl.remove();
  }
  
  input.style.borderColor = '';
}

function limparTodosErros() {
  document.querySelectorAll('.erro-validacao').forEach(el => el.remove());
  document.querySelectorAll('input').forEach(input => {
    input.style.borderColor = '';
  });
}

// ========== CONTADOR DE CARACTERES ==========
function adicionarContadorCaracteres(input, maxLength) {
  if (!input) return;
  
  const container = input.parentElement;
  let contador = container.querySelector('.contador-caracteres');
  
  if (!contador) {
    contador = document.createElement('div');
    contador.className = 'contador-caracteres';
    contador.style.cssText = `
      text-align: right;
      font-size: 0.85em;
      color: var(--color-gray-600);
      margin-top: 5px;
    `;
    container.appendChild(contador);
  }
  
  function atualizar() {
    const atual = input.value.length;
    contador.textContent = `${atual}/${maxLength} caracteres`;
    
    if (atual > maxLength) {
      contador.style.color = 'var(--color-danger)';
      input.style.borderColor = 'var(--color-danger)';
    } else if (atual > maxLength * 0.9) {
      contador.style.color = 'var(--color-warning)';
      input.style.borderColor = '';
    } else {
      contador.style.color = 'var(--color-gray-600)';
      input.style.borderColor = '';
    }
  }
  
  input.addEventListener('input', atualizar);
  atualizar();
}

// ========== MODAL ==========
function abrirModal(usuarioId, usuario) {
  usuarioEditandoId = usuarioId;
  emailOriginal = usuario.email;
  
  limparTodosErros();
  
  // Preenche formulário
  document.getElementById("editNome").value = usuario.nome || "";
  document.getElementById("editEmail").value = usuario.email || "";
  document.getElementById("editTelefone").value = usuario.telefone || "";
  document.getElementById("editRole").value = usuario.role || "usuario";
  
  modalEdicao.classList.add("active");
  document.body.style.overflow = "hidden";
  
  // Foca no primeiro campo
  setTimeout(() => {
    document.getElementById("editNome").focus();
  }, 100);
}

function fecharModal() {
  modalEdicao.classList.remove("active");
  document.body.style.overflow = "auto";
  formEditarUsuario.reset();
  usuarioEditandoId = null;
  emailOriginal = null;
  limparTodosErros();
}

btnFecharModal?.addEventListener("click", fecharModal);
btnCancelarEdicao?.addEventListener("click", fecharModal);

// Fechar modal clicando fora
modalEdicao?.addEventListener("click", (e) => {
  if (e.target === modalEdicao) {
    fecharModal();
  }
});

// Fechar modal com ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalEdicao?.classList.contains("active")) {
    fecharModal();
  }
});

// ========== CARREGAR USUÁRIOS ==========
async function carregarUsuarios() {
  try {
    const snapshot = await getDocs(collection(db, "usuarios"));
    listaUsuariosTable.innerHTML = "";

    if (snapshot.empty) {
      listaUsuariosTable.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 20px; color: var(--color-gray-600);">
            👥 Nenhum usuário cadastrado
          </td>
        </tr>
      `;
      return;
    }

    snapshot.forEach((docSnap) => {
      const usuario = docSnap.data();
      const row = document.createElement("tr");

      // Badge de role
      const roleBadge = usuario.role === "admin"
        ? '<span style="background: var(--color-warning); color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.85em;">👑 Admin</span>'
        : '<span style="background: var(--color-primary); color: white; padding: 3px 8px; border-radius: 4px; font-size: 0.85em;">👤 Usuário</span>';

      // Formata telefone
      const telefone = usuario.telefone || '';
      const telefoneFormatado = telefone.length >= 10
        ? `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7)}`
        : telefone;

      row.innerHTML = `
        <td><strong>${usuario.nome || 'N/A'}</strong></td>
        <td>${usuario.email || 'N/A'}</td>
        <td>${telefoneFormatado || 'N/A'}</td>
        <td>${roleBadge}</td>
        <td>
          <button class="btn-editar" data-id="${docSnap.id}">✏️ Editar</button>
          <button class="btn-excluir" data-id="${docSnap.id}">🗑️ Excluir</button>
        </td>
      `;

      listaUsuariosTable.appendChild(row);
    });
    
    console.log(`✅ ${snapshot.size} usuários carregados`);
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    alert("❌ Erro ao carregar usuários: " + error.message);
  }
}

// ========== EDITAR USUÁRIO ==========
listaUsuariosTable.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-editar")) {
    const id = e.target.dataset.id;
    
    try {
      const snapshot = await getDocs(collection(db, "usuarios"));
      const usuarioDoc = snapshot.docs.find(d => d.id === id);

      if (usuarioDoc) {
        abrirModal(id, usuarioDoc.data());
      } else {
        alert("❌ Usuário não encontrado");
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      alert("❌ Erro ao carregar dados do usuário: " + error.message);
    }
  }
});

// ========== SALVAR EDIÇÃO ==========
if (formEditarUsuario) {
  formEditarUsuario.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    limparTodosErros();
    
    const nome = document.getElementById("editNome").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const telefone = document.getElementById("editTelefone").value.trim();
    const role = document.getElementById("editRole").value;
    
    // Validações
    const validacaoNome = validarNome(nome);
    if (!validacaoNome.valido) {
      mostrarErro(document.getElementById("editNome"), validacaoNome.erro);
      document.getElementById("editNome").focus();
      return;
    }
    
    const validacaoEmail = validarEmail(email);
    if (!validacaoEmail.valido) {
      mostrarErro(document.getElementById("editEmail"), validacaoEmail.erro);
      document.getElementById("editEmail").focus();
      return;
    }
    
    const validacaoTelefone = validarTelefone(telefone);
    if (!validacaoTelefone.valido) {
      mostrarErro(document.getElementById("editTelefone"), validacaoTelefone.erro);
      document.getElementById("editTelefone").focus();
      return;
    }
    
    // Verifica se email mudou e se já existe
    if (email !== emailOriginal) {
      const q = query(
        collection(db, "usuarios"),
        where("email", "==", email)
      );
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        mostrarErro(
          document.getElementById("editEmail"),
          'Este e-mail já está em uso por outro usuário'
        );
        document.getElementById("editEmail").focus();
        return;
      }
    }
    
    // Senha de admin obrigatória para editar
    const senhaAdmin = prompt(
      "🔐 Para editar usuários, digite a senha de administrador:"
    );
    
    if (!senhaAdmin) {
      alert("⚠️ Senha de administrador é obrigatória para editar usuários.");
      return;
    }
    
    const btnSubmit = formEditarUsuario.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit.textContent;
    btnSubmit.disabled = true;
    btnSubmit.textContent = '⏳ Salvando...';
    
    try {
      // Valida senha de admin
      await signInWithEmailAndPassword(auth, auth.currentUser.email, senhaAdmin);
      
      // Atualiza usuário
      const apenasNumeros = telefone.replace(/\D/g, '');
      
      await updateDoc(doc(db, "usuarios", usuarioEditandoId), {
        nome: nome.slice(0, CONFIG.MAX_NOME_LENGTH),
        email,
        telefone: apenasNumeros,
        role,
        atualizadoEm: new Date().toISOString()
      });

      alert("✅ Usuário atualizado com sucesso!");
      fecharModal();
      carregarUsuarios();
      
    } catch (error) {
      console.error("Erro ao salvar:", error);
      
      let mensagem = "❌ Erro ao salvar usuário.";
      
      if (error.code === "auth/wrong-password") {
        mensagem = "❌ Senha de administrador incorreta!";
      } else if (error.code === "auth/too-many-requests") {
        mensagem = "⚠️ Muitas tentativas. Aguarde alguns minutos.";
      } else if (error.code === "auth/network-request-failed") {
        mensagem = "❌ Erro de conexão. Verifique sua internet.";
      } else {
        mensagem += "\n\n" + error.message;
      }
      
      alert(mensagem);
      
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.textContent = textoOriginal;
    }
  });
}

// ========== EXCLUIR USUÁRIO ==========
listaUsuariosTable.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-excluir")) {
    const id = e.target.dataset.id;
    
    try {
      const snapshot = await getDocs(collection(db, "usuarios"));
      const usuarioDoc = snapshot.docs.find(d => d.id === id);
      
      if (!usuarioDoc) {
        alert("❌ Usuário não encontrado");
        return;
      }
      
      const usuario = usuarioDoc.data();
      
      // Previne excluir o próprio usuário
      if (auth.currentUser && usuario.email === auth.currentUser.email) {
        alert("⚠️ Você não pode excluir seu próprio usuário!");
        return;
      }
      
      if (!confirm(`🗑️ Tem certeza que deseja excluir o usuário:\n\n${usuario.nome}\n${usuario.email}?`)) {
        return;
      }
      
      // Senha de admin obrigatória
      const senhaAdmin = prompt(
        "🔐 Para excluir usuários, digite a senha de administrador:"
      );
      
      if (!senhaAdmin) {
        alert("⚠️ Senha de administrador é obrigatória para excluir usuários.");
        return;
      }
      
      // Valida senha
      await signInWithEmailAndPassword(auth, auth.currentUser.email, senhaAdmin);
      
      // Exclui usuário
      await deleteDoc(doc(db, "usuarios", id));
      
      alert("✅ Usuário excluído com sucesso!");
      carregarUsuarios();
      
    } catch (error) {
      console.error("Erro ao excluir:", error);
      
      let mensagem = "❌ Erro ao excluir usuário.";
      
      if (error.code === "auth/wrong-password") {
        mensagem = "❌ Senha de administrador incorreta!";
      } else if (error.code === "auth/too-many-requests") {
        mensagem = "⚠️ Muitas tentativas. Aguarde alguns minutos.";
      } else {
        mensagem += "\n\n" + error.message;
      }
      
      alert(mensagem);
    }
  }
});

// ========== PESQUISA DE USUÁRIOS ==========
const inputPesquisa = document.getElementById("pesquisaUsuario");
if (inputPesquisa) {
  inputPesquisa.addEventListener("input", (e) => {
    const termo = e.target.value.toLowerCase().trim();
    const linhas = listaUsuariosTable.querySelectorAll("tr");

    let encontrados = 0;
    linhas.forEach(linha => {
      const texto = linha.textContent.toLowerCase();
      const match = texto.includes(termo);
      linha.style.display = match ? "" : "none";
      if (match) encontrados++;
    });
    
    console.log(`🔍 Pesquisa: "${termo}" - ${encontrados} usuário(s) encontrado(s)`);
  });
}

// ========== APLICAR MÁSCARAS ==========
const telefoneInput = document.getElementById("editTelefone");
if (telefoneInput) {
  aplicarMascaraTelefone(telefoneInput);
}

const nomeInput = document.getElementById("editNome");
if (nomeInput) {
  adicionarContadorCaracteres(nomeInput, CONFIG.MAX_NOME_LENGTH);
}

// ========== INICIALIZAÇÃO ==========
window.addEventListener('DOMContentLoaded', () => {
  carregarUsuarios();
  console.log('✅ Gerenciamento de usuários inicializado com validações completas');
});