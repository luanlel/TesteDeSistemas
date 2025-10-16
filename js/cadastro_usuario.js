import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const telefoneInput = document.getElementById("telefone");
const form = document.getElementById("cadastroForm");
const sucessoMsg = document.getElementById("msg-sucesso");

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
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);

      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nome,
        email,
        telefone, // agora vai formatado
        role: "usuario",
        criadoEm: new Date()
      });

      sucessoMsg.textContent = "✅ Cadastro realizado com sucesso!";
      form.reset();
    } catch (error) {
      console.error("Erro ao cadastrar usuário: ", error);
      if (error.code === "auth/email-already-in-use") {
        sucessoMsg.textContent = "⚠️ Este e-mail já está cadastrado.";
      } else {
        sucessoMsg.textContent = "❌ Erro ao cadastrar usuário.";
      }
    }
  }
});
