// js/main.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const mensagem = document.getElementById("mensagem");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value;
      const senha = document.getElementById("senha").value;

      const sucesso = login(email, senha);

      if (!sucesso) {
        mensagem.textContent = "E-mail ou senha incorretos!";
      }
    });
  }
});
