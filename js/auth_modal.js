import { login } from "./auth.js";
import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
    const modalAuth = document.getElementById("modalAuth");
    const btnAbrirLogin = document.getElementById("btnAbrirLogin");
    const btnAbrirCadastro = document.getElementById("btnAbrirCadastro");
    const btnFecharModal = document.getElementById("btnFecharModal");
    const tabs = document.querySelectorAll(".tab-link");
    const tabContents = document.querySelectorAll('.tab-content');

    const formLogin = document.getElementById("formLogin");
    const mensagem = document.getElementById("mensagem");

    const cadastroForm = document.getElementById("cadastroForm");
    const sucessoMsg = document.getElementById("msg-sucesso");

    function openModal(tab) {
        modalAuth.classList.add("active");
        document.body.style.overflow = "hidden";
        switchTab(tab);
    }

    function closeModal() {
        modalAuth.classList.remove("active");
        document.body.style.overflow = "auto";
    }

    function switchTab(tab) {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        const tabLink = document.querySelector(`.tab-link[data-tab='${tab}']`);
        const tabContent = document.getElementById(tab);

        if (tabLink) tabLink.classList.add('active');
        if (tabContent) tabContent.classList.add('active');
    }

    btnAbrirLogin?.addEventListener("click", (e) => {
        e.preventDefault();
        openModal('login');
    });

    btnAbrirCadastro?.addEventListener("click", (e) => {
        e.preventDefault();
        openModal('register');
    });

    btnFecharModal?.addEventListener("click", closeModal);

    modalAuth?.addEventListener("click", (e) => {
        if (e.target === modalAuth) {
            closeModal();
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modalAuth.classList.contains("active")) {
            closeModal();
        }
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.dataset.tab);
        });
    });

    formLogin?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value;
      const senha = document.getElementById("loginSenha").value;

      const sucesso = await login(email, senha);

      if (!sucesso) {
        mensagem.textContent = "E-mail ou senha incorretos!";
      }
    });

    cadastroForm?.addEventListener("submit", async function (e) {
      e.preventDefault();
      limparErros();

      let valido = true;

      let nome = cadastroForm.nome.value.trim();
      let email = cadastroForm.email.value.trim();
      const senha = cadastroForm.senha.value;
      if (nome.length > 100) nome = nome.slice(0, 100);
      if (email.length > 100) email = email.slice(0, 100);
      const telefone = cadastroForm.telefone.value.trim();

      if (nome.length < 3) {
        mostrarErro("erro-nome", "Informe um nome completo válido.");
        valido = false;
      }

      if (!email.match(/^\S+@\S+\.\S+$/)) {
        mostrarErro("erro-email", "Informe um e-mail válido.");
        valido = false;
      }

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
        cadastroForm.classList.add("loading");
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

          cadastroForm.classList.remove("loading");
          sucessoMsg.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Cadastro realizado com sucesso!
          `;
          cadastroForm.reset();

          setTimeout(() => {
            closeModal();
          }, 1500);
        } catch (error) {
          console.error("Erro ao cadastrar usuário:", error);
          cadastroForm.classList.remove("loading");

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

    function mostrarErro(id, msg) {
      document.getElementById(id).textContent = msg;
    }

    function limparErros() {
      ["erro-nome", "erro-email", "erro-senha", "erro-telefone"].forEach(
        (id) => (document.getElementById(id).textContent = "")
      );
      sucessoMsg.textContent = "";
    }
});
