// js/usuario.js
import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const telefoneInput = document.getElementById("telefone");
const form = document.getElementById("cadastroForm");
const sucessoMsg = document.getElementById("msg-sucesso");

// Máscara de telefone
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
  this.value = numero;
});

// Valida senha: somente números, mínimo 6 dígitos
function validarSenha(senha) {
  const regex = /^\d{6,}$/;
  return regex.test(senha);
}

function mostrarErro(id, msg) {
  document.getElementById(id).textContent = msg;
}

function limparErros() {
  ["erro-nome", "erro-email", "erro-senha", "erro-telefone"].forEach(
    (id) => (document.getElementById(id).textContent = "")
  );
  sucessoMsg.textContent = "";
}

form.addEventListener("submit", async function (e) {
  e.preventDefault();
  limparErros();

  let valido = true;

  const nome = form.nome.value.trim();
  const email = form.email.value.trim();
  const senha = form.senha.value;
  const telefone = form.telefone.value.replace(/\D/g, "");

  if (nome.length < 3) {
    mostrarErro("erro-nome", "Informe um nome completo válido.");
    valido = false;
  }

  if (!email.match(/^\S+@\S+\.\S+$/)) {
    mostrarErro("erro-email", "Informe um e-mail válido.");
    valido = false;
  }

  if (!validarSenha(senha)) {
    mostrarErro(
      "erro-senha",
      "Senha deve ter apenas números e no mínimo 6 dígitos."
    );
    valido = false;
  }

  if (telefone.length < 10) {
    mostrarErro("erro-telefone", "Informe um telefone válido (10 ou 11 dígitos).");
    valido = false;
  }

  if (valido) {
    try {
      await addDoc(collection(db, "usuários"), {
        nome,
        email,
        senha,
        telefone,
        criadoEm: new Date()
      });

      sucessoMsg.textContent = "Cadastro realizado com sucesso!";
      form.reset();
    } catch (error) {
      console.error("Erro ao salvar no Firebase: ", error);
      sucessoMsg.textContent = "Erro ao cadastrar usuário.";
    }
  }
});
