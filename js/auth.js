// js/auth.js

// Usuário admin fixo (simulação)
const adm = {
  email: "adm@email.com",
  senha: "321456"
};

function login(email, senha) {
  if (email === admin.email && senha === admin.senha) {
    localStorage.setItem("logado", "true");
    window.location.href = "adm.html"; // vai para o painel do admin
    return true;
  } else {
    return false;
  }
}

function logout() {
  localStorage.removeItem("logado");
  window.location.href = "index.html";
}

function verificarLogin() {
  if (localStorage.getItem("logado") !== "true") {
    window.location.href = "index.html";
  }
}
