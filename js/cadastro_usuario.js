// js/cadastro_usuario.js - CORREÇÃO COMPLETA

import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Elementos do DOM
const modalCadastro = document.getElementById("modalCadastro");
const btnAbrirCadastro = document.getElementById("btnAbrirCadastro");
const btnFecharModal = document.getElementById("btnFecharModal");
const telefoneInput = document.getElementById("telefone");
const form = document.getElementById("cadastroForm");
const sucessoMsg = document.getElementById("msg-sucesso");

// ---------- Controles do Modal ----------
btnAbrirCadastro?.addEventListener("click", (e) => {
  e.preventDefault();
  modalCadastro.classList.add("active");
  document.body.style.overflow = "hidden";
  setTimeout(() => {
    modalCadastro.querySelector("input")?.focus();
  }, 50);
});

function fecharModal() {
  modalCadastro?.classList.remove("active");
  form.reset();
  limparErros();
  document.body.style.overflow = "auto";
}

btnFecharModal?.addEventListener("click", fecharModal);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalCadastro?.classList.contains("active")) {
    fecharModal();
  }
});

modalCadastro?.addEventListener("click", (e) => {
  if (e.target === modalCadastro) {
    fecharModal();
  }
});

// Trap focus dentro do modal
modalCadastro?.addEventListener("keydown", (e) => {
  if (e.key === "Tab") {
    const focusableElements = modalCadastro.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  }
});

// ---------- VALIDAÇÃO E MÁSCARA DE TELEFONE (CORRIGIDA) ----------
function aplicarMascaraTelefone(input) {
  if (!input) return;
  
  input.setAttribute("maxlength", "15");
  input.setAttribute("inputmode", "numeric");

  // Validação em tempo real - bloqueia caracteres não numéricos
  input.addEventListener("keypress", function(e) {
    const char = String.fromCharCode(e.keyCode || e.which);
    // Permite apenas números
    if (!/^[0-9]$/.test(char)) {
      e.preventDefault();
      mostrarErro("erro-telefone", "Digite apenas números.");
      return false;
    }
  });

  input.addEventListener("input", function (e) {
    // Remove tudo que não for número
    let valor = e.target.value.replace(/\D/g, "");
    
    // Verifica se há caracteres inválidos (letras ou símbolos)
    if (e.target.value !== valor && valor === "") {
      mostrarErro("erro-telefone", "Digite apenas números.");
      e.target.value = "";
      return;
    }
    
    // Limita a 11 dígitos
    if (valor.length > 11) valor = valor.slice(0, 11);

    // Aplica máscara formatada
    if (valor.length > 6) {
      e.target.value = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}-${valor.slice(7, 11)}`;
    } else if (valor.length > 2) {
      e.target.value = `(${valor.slice(0, 2)}) ${valor.slice(2, 7)}`;
    } else if (valor.length > 0) {
      e.target.value = `(${valor}`;
    } else {
      e.target.value = "";
    }
    
    // Limpa erro se o valor estiver correto
    if (valor.length >= 10) {
      document.getElementById("erro-telefone").textContent = "";
    }
  });

  // Validação ao perder foco
  input.addEventListener("blur", function(e) {
    const apenasNumeros = e.target.value.replace(/\D/g, "");
    if (apenasNumeros.length > 0 && apenasNumeros.length < 10) {
      mostrarErro("erro-telefone", "Telefone deve ter 10 ou 11 dígitos.");
    }
  });
}

aplicarMascaraTelefone(telefoneInput);

// ---------- Validação de senha ----------
function validarSenha(senha) {
  const regex = /^\d{6,20}$/;
  return regex.test(senha);
}

// ---------- Helpers ----------
function mostrarErro(id, msg) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.textContent = msg;
    elemento.style.display = "block";
  }
}

function limparErros() {
  ["erro-nome", "erro-email", "erro-senha", "erro-telefone"].forEach(
    (id) => {
      const elemento = document.getElementById(id);
      if (elemento) {
        elemento.textContent = "";
        elemento.style.display = "none";
      }
    }
  );
  if (sucessoMsg) sucessoMsg.textContent = "";
}

// ---------- VALIDAÇÃO BACKEND - CADASTRO ----------
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  limparErros();

  let valido = true;
  let nome = form.nome.value.trim();
  let email = form.email.value.trim();
  const senha = form.senha.value;
  const telefone = form.telefone.value.trim();

  // Validação de tamanho
  if (nome.length > 100) nome = nome.slice(0, 100);
  if (email.length > 100) email = email.slice(0, 100);

  // Validação nome
  if (nome.length < 3) {
    mostrarErro("erro-nome", "Informe um nome completo válido.");
    valido = false;
  }

  // Validação email
  if (!email.match(/^\S+@\S+\.\S+$/)) {
    mostrarErro("erro-email", "Informe um e-mail válido.");
    valido = false;
  }

  // Validação senha
  if (!/^[0-9]{6,20}$/.test(senha)) {
    mostrarErro(
      "erro-senha",
      "Senha deve conter apenas números e ter entre 6 e 20 dígitos."
    );
    valido = false;
  }

  // VALIDAÇÃO TELEFONE - Backend
  const apenasNumeros = telefone.replace(/\D/g, "");
  
  // Verifica se contém apenas números
  if (telefone !== "" && apenasNumeros.length !== telefone.replace(/[\s\(\)\-]/g, "").length) {
    mostrarErro("erro-telefone", "Digite apenas números.");
    valido = false;
  }
  
  // Verifica quantidade de dígitos
  if (apenasNumeros.length < 10 || apenasNumeros.length > 11) {
    mostrarErro("erro-telefone", "Informe um telefone válido (10 ou 11 dígitos).");
    valido = false;
  }

  if (!valido) return;

  form.classList.add("loading");
  sucessoMsg.textContent = "";

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, senha);

    await setDoc(doc(db, "usuarios", cred.user.uid), {
      nome,
      email,
      telefone: apenasNumeros, // Salva apenas números
      role: "usuario",
      criadoEm: new Date()
    });

    form.classList.remove("loading");
    sucessoMsg.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 6L9 17l-5-5"/>
      </svg>
      Cadastro realizado com sucesso!
    `;
    form.reset();

    setTimeout(() => {
      fecharModal();
    }, 1500);
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    form.classList.remove("loading");

    if (error.code === "auth/email-already-in-use") {
      sucessoMsg.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0ad4e" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        Este e-mail já está cadastrado.
      `;
    } else {
      sucessoMsg.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        Erro ao cadastrar usuário.
      `;
    }
  }
});