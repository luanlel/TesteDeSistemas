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

// Controles do Modal
btnAbrirCadastro?.addEventListener("click", (e) => {
  e.preventDefault();
  modalCadastro.classList.add("active");
  document.body.style.overflow = "hidden"; // Previne scroll do body
  // Foca no primeiro input após abrir
  setTimeout(() => {
    modalCadastro.querySelector("input")?.focus();
  }, 50);
});

// Função para fechar o modal
function fecharModal() {
  modalCadastro.classList.remove("active");
  form.reset();
  limparErros();
  document.body.style.overflow = "auto"; // Restaura scroll
}

btnFecharModal?.addEventListener("click", fecharModal);

// Fechar modal clicando fora ou ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalCadastro.classList.contains("active")) {
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

// ---------- Máscara de telefone ----------
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
  this.value = numero; // agora fica formatado no input
});

// ---------- Validação de senha ----------
function validarSenha(senha) {
  const regex = /^\d{6,}$/;
  return regex.test(senha);
}

// ---------- Helpers ----------
function mostrarErro(id, msg) {
  document.getElementById(id).textContent = msg;
}

function limparErros() {
  ["erro-nome", "erro-email", "erro-senha", "erro-telefone"].forEach(
    (id) => (document.getElementById(id).textContent = "")
  );
  sucessoMsg.textContent = "";
}

// ---------- Cadastro ----------
form.addEventListener("submit", async function (e) {
  e.preventDefault();
  limparErros();

  let valido = true;

  let nome = form.nome.value.trim();
  let email = form.email.value.trim();
  const senha = form.senha.value;
  // Enforce client-side limits (same as input attributes)
  if (nome.length > 100) nome = nome.slice(0, 100);
  if (email.length > 100) email = email.slice(0, 100);
  const telefone = form.telefone.value.trim(); // pega o valor formatado

  if (nome.length < 3) {
    mostrarErro("erro-nome", "Informe um nome completo válido.");
    valido = false;
  }

  if (!email.match(/^\S+@\S+\.\S+$/)) {
    mostrarErro("erro-email", "Informe um e-mail válido.");
    valido = false;
  }

  // senha: apenas números entre 6 e 20 dígitos
  if (!/^[0-9]{6,20}$/.test(senha)) {
    mostrarErro(
      "erro-senha",
      "Senha deve conter apenas números e ter entre 6 e 20 dígitos."
    );
    valido = false;
  }

  if (telefone.replace(/\D/g, "").length < 10) {
    mostrarErro("erro-telefone", "Informe um telefone válido (10 ou 11 dígitos).");
    valido = false;
  }

  if (valido) {
    form.classList.add("loading");
    sucessoMsg.textContent = "";

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);

      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nome,
        email,
        telefone,
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

      // Fecha o modal após 1.5s
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
  }
});
