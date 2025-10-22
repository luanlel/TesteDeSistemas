import { login } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const mensagem = document.getElementById("mensagem");

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value;
      const senha = document.getElementById("loginSenha").value;

      const sucesso = await login(email, senha);

      if (!sucesso) {
        mensagem.textContent = "E-mail ou senha incorretos!";
      }
    });
  }
});