// js/auth_modal.js - VERSÃO CORRIGIDA COM TODAS AS MELHORIAS

import { auth, db } from "./firebase-config.js";
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Elementos do DOM
const modalAuth = document.getElementById("modalAuth");
const btnFecharModal = document.getElementById("btnFecharModal");
const formCadastro = document.getElementById("cadastroForm");
const formLogin = document.getElementById("formLogin");
const telefoneInput = document.getElementById("telefone");
const sucessoMsg = document.getElementById("msg-sucesso");
const tabs = modalAuth?.querySelectorAll(".tab-link");
const tabContents = modalAuth?.querySelectorAll(".tab-content");

// ========== FUNÇÕES DO MODAL ==========
function abrirModal(tab = "login") {
  if (!modalAuth) return;
  
  modalAuth.classList.add("active");
  document.body.style.overflow = "hidden";
  trocarTab(tab);
  
  setTimeout(() => {
    const input = modalAuth.querySelector('.tab-content.active input');
    if (input) input.focus();
  }, 50);
}

function fecharModal() {
  if (!modalAuth) return;
  
  modalAuth.classList.remove("active");
  document.body.style.overflow = "auto";
  
  if (formCadastro) formCadastro.reset();
  if (formLogin) formLogin.reset();
  
  limparErros();
  
  if (sucessoMsg) sucessoMsg.textContent = "";
}

// Botão fechar
btnFecharModal?.addEventListener("click", fecharModal);

// Fechar modal clicando fora ou ESC
modalAuth?.addEventListener("click", e => { 
  if (e.target === modalAuth) fecharModal(); 
});

document.addEventListener("keydown", e => { 
  if (e.key === "Escape" && modalAuth?.classList.contains("active")) {
    fecharModal(); 
  }
});

// Trap focus dentro do modal
modalAuth?.addEventListener("keydown", (e) => {
  if (e.key !== "Tab") return;
  
  const focusable = modalAuth.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) { 
      last.focus(); 
      e.preventDefault(); 
    }
  } else {
    if (document.activeElement === last) { 
      first.focus(); 
      e.preventDefault(); 
    }
  }
});

// ========== TABS ==========
function trocarTab(tab) {
  if (!tabs || !tabContents) return;
  
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  tabContents.forEach(c => c.classList.toggle("active", c.id === tab));
  
  limparErros();
}

tabs?.forEach(t => {
  t.addEventListener("click", () => trocarTab(t.dataset.tab));
});

// ========== MÁSCARA DE TELEFONE ==========
function aplicarMascaraTelefone(input) {
  if (!input) return;
  
  input.setAttribute("maxlength", "15");
  input.setAttribute("inputmode", "numeric");

  input.addEventListener("keypress", function(e) {
    const char = String.fromCharCode(e.keyCode || e.which);
    if (!/^[0-9]$/.test(char)) {
      e.preventDefault();
      mostrarErro("erro-telefone", "Digite apenas números.");
      return false;
    }
  });

  let ultimoValor = "";
  
  input.addEventListener("input", function (e) {
    let valor = e.target.value.replace(/\D/g, "");
    
    if (e.target.value !== valor && valor === "") {
      mostrarErro("erro-telefone", "Digite apenas números.");
      e.target.value = ultimoValor;
      return;
    }
    
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
    
    ultimoValor = e.target.value;
    
    if (valor.length >= 10) {
      limparErro("erro-telefone");
    }
  });

  input.addEventListener("blur", function(e) {
    const apenasNumeros = e.target.value.replace(/\D/g, "");
    if (apenasNumeros.length > 0 && apenasNumeros.length < 10) {
      mostrarErro("erro-telefone", "Telefone deve ter 10 ou 11 dígitos.");
    }
  });
}

if (telefoneInput) {
  aplicarMascaraTelefone(telefoneInput);
}

// ========== VALIDAÇÃO ==========
function mostrarErro(id, msg) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.textContent = msg;
    elemento.style.display = "block";
  }
}

function limparErro(id) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.textContent = "";
    elemento.style.display = "none";
  }
}

function limparErros() {
  ["erro-nome", "erro-email", "erro-senha", "erro-telefone"].forEach(id => {
    limparErro(id);
  });
  
  if (sucessoMsg) {
    sucessoMsg.textContent = "";
    sucessoMsg.classList.remove("active");
  }
}

// ========== RECUPERAÇÃO DE SENHA (NOVO) ==========
function exibirRecuperacaoSenha() {
  const email = document.getElementById("loginEmail")?.value.trim();
  
  if (!email) {
    alert("⚠️ Por favor, digite seu e-mail no campo acima para recuperar a senha.");
    document.getElementById("loginEmail")?.focus();
    return;
  }
  
  if (!email.match(/^\S+@\S+\.\S+$/)) {
    alert("⚠️ Por favor, digite um e-mail válido.");
    return;
  }
  
  if (confirm(`📧 Deseja enviar um link de recuperação de senha para:\n${email}?`)) {
    const btnSubmit = formLogin?.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit?.textContent;
    
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = "📧 Enviando...";
    }
    
    sendPasswordResetEmail(auth, email)
      .then(() => {
        alert(
          `✅ E-mail de recuperação enviado!\n\n` +
          `Verifique sua caixa de entrada (e spam) do e-mail:\n${email}\n\n` +
          `Clique no link recebido para redefinir sua senha.`
        );
      })
      .catch((error) => {
        console.error("Erro ao enviar e-mail:", error);
        
        let mensagemErro = "❌ Erro ao enviar e-mail de recuperação.";
        
        if (error.code === "auth/user-not-found") {
          mensagemErro = "❌ E-mail não encontrado no sistema.";
        } else if (error.code === "auth/invalid-email") {
          mensagemErro = "❌ E-mail inválido.";
        } else if (error.code === "auth/too-many-requests") {
          mensagemErro = "⚠️ Muitas tentativas. Aguarde alguns minutos e tente novamente.";
        }
        
        alert(mensagemErro);
      })
      .finally(() => {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = textoOriginal;
        }
      });
  }
}

// Adiciona link "Esqueci minha senha" ao formulário de login
document.addEventListener('DOMContentLoaded', () => {
  const formFooter = formLogin?.querySelector('.form-footer');
  if (formFooter && !document.getElementById('link-esqueci-senha')) {
    const linkRecuperacao = document.createElement('a');
    linkRecuperacao.id = 'link-esqueci-senha';
    linkRecuperacao.href = '#';
    linkRecuperacao.textContent = '🔑 Esqueci minha senha';
    linkRecuperacao.style.display = 'block';
    linkRecuperacao.style.textAlign = 'center';
    linkRecuperacao.style.marginTop = '10px';
    linkRecuperacao.style.color = 'var(--color-primary)';
    linkRecuperacao.style.textDecoration = 'none';
    linkRecuperacao.style.fontSize = '0.9em';
    
    linkRecuperacao.addEventListener('click', (e) => {
      e.preventDefault();
      exibirRecuperacaoSenha();
    });
    
    formFooter.appendChild(linkRecuperacao);
  }
});

// ========== LOGIN ==========
if (formLogin) {
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("loginEmail")?.value.trim();
    const senha = document.getElementById("loginSenha")?.value;
    const mensagem = document.getElementById("mensagem");

    if (!email || !senha) {
      if (mensagem) {
        mensagem.textContent = "⚠️ Preencha todos os campos.";
        mensagem.style.color = "var(--color-danger)";
      }
      return;
    }

    const btnSubmit = formLogin.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit?.textContent;
    
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = "⏳ Entrando...";
    }

    try {
      await signInWithEmailAndPassword(auth, email, senha);
      
      if (mensagem) {
        mensagem.textContent = "✅ Login realizado com sucesso!";
        mensagem.style.color = "var(--color-success)";
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
      
      fecharModal();
      window.location.reload();
      
    } catch (error) {
      console.error("Erro no login:", error);
      
      let msgErro = "❌ Erro ao fazer login.";
      
      if (error.code === "auth/user-not-found") {
        msgErro = "❌ Usuário não encontrado. Verifique seu e-mail ou cadastre-se.";
      } else if (error.code === "auth/wrong-password") {
        msgErro = "❌ Senha incorreta. Tente novamente ou use 'Esqueci minha senha'.";
      } else if (error.code === "auth/invalid-email") {
        msgErro = "❌ E-mail inválido.";
      } else if (error.code === "auth/invalid-credential") {
        msgErro = "❌ E-mail ou senha incorretos.";
      } else if (error.code === "auth/too-many-requests") {
        msgErro = "⚠️ Muitas tentativas de login. Aguarde alguns minutos e tente novamente.";
      } else if (error.code === "auth/network-request-failed") {
        msgErro = "❌ Erro de conexão. Verifique sua internet e tente novamente.";
      }
      
      if (mensagem) {
        mensagem.textContent = msgErro;
        mensagem.style.color = "var(--color-danger)";
      }
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = textoOriginal;
      }
    }
  });
}

// ========== CADASTRO ==========
if (formCadastro) {
  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();
    limparErros();
    
    let valido = true;

    const nome = formCadastro.nome?.value.trim().slice(0, 100);
    const email = formCadastro.email?.value.trim().slice(0, 100);
    const senha = formCadastro.senha?.value;
    const telefone = formCadastro.telefone?.value.trim();

    // Validações
    if (!nome || nome.length < 3) {
      mostrarErro("erro-nome", "Informe um nome completo válido (mínimo 3 caracteres).");
      valido = false;
    }
    
    if (!email || !email.match(/^\S+@\S+\.\S+$/)) {
      mostrarErro("erro-email", "Informe um e-mail válido.");
      valido = false;
    }
    
    if (!senha || !/^[0-9]{6,20}$/.test(senha)) {
      mostrarErro("erro-senha", "Senha deve conter apenas números e ter entre 6 e 20 dígitos.");
      valido = false;
    }
    
    const apenasNumeros = telefone.replace(/\D/g, "");
    if (!telefone || apenasNumeros.length < 10) {
      mostrarErro("erro-telefone", "Informe um telefone válido (10 ou 11 dígitos).");
      valido = false;
    }

    if (!valido) return;

    const btnSubmit = formCadastro.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit?.textContent;
    
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = "⏳ Cadastrando...";
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nome,
        email,
        telefone: apenasNumeros,
        role: "usuario",
        criadoEm: new Date().toISOString()
      });

      if (sucessoMsg) {
        sucessoMsg.innerHTML = `
          <i class="bi bi-check-circle-fill"></i>
          ✅ Cadastro realizado com sucesso! Redirecionando...
        `;
        sucessoMsg.classList.add("active");
        sucessoMsg.style.color = "var(--color-success)";
      }
      
      formCadastro.reset();
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      fecharModal();
      window.location.reload();

    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      
      if (sucessoMsg) {
        let msgErro = "❌ Erro ao cadastrar usuário.";
        
        if (error.code === "auth/email-already-in-use") {
          msgErro = "⚠️ Este e-mail já está cadastrado. Faça login ou use 'Esqueci minha senha'.";
        } else if (error.code === "auth/weak-password") {
          msgErro = "⚠️ Senha muito fraca. Use pelo menos 6 dígitos.";
        } else if (error.code === "auth/invalid-email") {
          msgErro = "⚠️ E-mail inválido.";
        } else if (error.code === "auth/network-request-failed") {
          msgErro = "❌ Erro de conexão. Verifique sua internet e tente novamente.";
        }
        
        sucessoMsg.innerHTML = `<i class="bi bi-x-circle-fill"></i> ${msgErro}`;
        sucessoMsg.classList.add("active");
        sucessoMsg.style.color = "var(--color-danger)";
      }
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = textoOriginal;
      }
    }
  });
}

// ========== EXPORTA FUNÇÃO PARA USO NA LOJA ==========
window.abrirModalAuth = abrirModal;

console.log('✅ Auth Modal inicializado com recuperação de senha');