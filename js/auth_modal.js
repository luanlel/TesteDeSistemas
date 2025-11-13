// auth_modal.js
import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Elementos do DOM
const modalAuth = document.getElementById("modalAuth");
const btnAbrirLogin = document.getElementById("btnAbrirLogin");
const btnAbrirCadastro = document.getElementById("btnAbrirCadastro");
const btnFecharModal = document.getElementById("btnFecharModal");
const formCadastro = document.getElementById("cadastroForm");
const telefoneInput = document.getElementById("telefone");
const sucessoMsg = document.getElementById("msg-sucesso");
const tabs = modalAuth.querySelectorAll(".tab-link");
const tabContents = modalAuth.querySelectorAll(".tab-content");

// ------------------ Funções do Modal ------------------
function abrirModal(tab = "login") {
  modalAuth.classList.add("active");
  document.body.style.overflow = "hidden";
  trocarTab(tab);
  setTimeout(() => {
    modalAuth.querySelector("input")?.focus();
  }, 50);
}

function fecharModal() {
  modalAuth.classList.remove("active");
  document.body.style.overflow = "auto";
  formCadastro?.reset();
  limparErros();
  sucessoMsg.textContent = "";
}

// Abrir modal
btnAbrirLogin?.addEventListener("click", e => { e.preventDefault(); abrirModal("login"); });
btnAbrirCadastro?.addEventListener("click", e => { e.preventDefault(); abrirModal("register"); });
btnFecharModal?.addEventListener("click", fecharModal);

// Fechar modal clicando fora ou ESC
modalAuth?.addEventListener("click", e => { if (e.target === modalAuth) fecharModal(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && modalAuth.classList.contains("active")) fecharModal(); });

// Trap focus dentro do modal
modalAuth?.addEventListener("keydown", e => {
  if (e.key !== "Tab") return;
  const focusable = modalAuth.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === first) { last.focus(); e.preventDefault(); }
  } else {
    if (document.activeElement === last) { first.focus(); e.preventDefault(); }
  }
});

// ------------------ Tabs ------------------
function trocarTab(tab) {
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
  tabContents.forEach(c => c.classList.toggle("active", c.id === tab));
}

tabs.forEach(t => {
  t.addEventListener("click", () => trocarTab(t.dataset.tab));
});

// ------------------ Máscara de telefone ------------------
telefoneInput?.addEventListener("input", function (e) {
  let cursor = this.selectionStart;
  let valor = this.value.replace(/\D/g, "");
  
  if (valor.length > 11) valor = valor.slice(0, 11);

  let formatted = "";
  if (valor.length > 0) formatted += "(" + valor.substring(0, 2);
  if (valor.length >= 3) formatted += ") " + valor.substring(2, 7);
  if (valor.length > 7) formatted += "-" + valor.substring(7);

  this.value = formatted;

  // Ajuste do cursor para permitir apagar "-" normalmente
  if (e.inputType === "deleteContentBackward" && this.value[cursor - 1] === "-" || this.value[cursor - 1] === ")") {
    this.setSelectionRange(cursor - 1, cursor - 1);
  }
});

// ------------------ Validação ------------------
function mostrarErro(id, msg) { document.getElementById(id).textContent = msg; }
function limparErros() { ["erro-nome","erro-email","erro-senha","erro-telefone"].forEach(id => document.getElementById(id).textContent = ""); sucessoMsg.textContent = ""; }

// ------------------ Cadastro ------------------
formCadastro?.addEventListener("submit", async e => {
  e.preventDefault();
  limparErros();
  let valido = true;

  let nome = formCadastro.nome.value.trim().slice(0,100);
  let email = formCadastro.email.value.trim().slice(0,100);
  const senha = formCadastro.senha.value;
  const telefone = formCadastro.telefone.value.trim();

  if (nome.length < 3) { mostrarErro("erro-nome","Informe um nome completo válido."); valido = false; }
  if (!email.match(/^\S+@\S+\.\S+$/)) { mostrarErro("erro-email","Informe um e-mail válido."); valido = false; }
  if (!/^[0-9]{6,20}$/.test(senha)) { mostrarErro("erro-senha","Senha deve conter apenas números e ter entre 6 e 20 dígitos."); valido = false; }
  if (telefone.replace(/\D/g,"").length < 10) { mostrarErro("erro-telefone","Informe um telefone válido (10 ou 11 dígitos)."); valido = false; }

  if (!valido) return;

  formCadastro.classList.add("loading");
  sucessoMsg.textContent = "";

  try {
    const cred = await createUserWithEmailAndPassword(auth,email,senha);
    await setDoc(doc(db,"usuarios",cred.user.uid),{
      nome, email, telefone, role:"usuario", criadoEm: new Date()
    });

    formCadastro.classList.remove("loading");
    sucessoMsg.innerHTML = `<i class="bi bi-check-lg"></i> Cadastro realizado com sucesso!`;
    formCadastro.reset();
    setTimeout(() => fecharModal(), 1500);

  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    formCadastro.classList.remove("loading");
    if (error.code === "auth/email-already-in-use") {
      sucessoMsg.innerHTML = `<i class="bi bi-exclamation-triangle"></i> Este e-mail já está cadastrado.`;
    } else {
      sucessoMsg.innerHTML = `<i class="bi bi-x-lg"></i> Erro ao cadastrar usuário.`;
    }
  }
});
