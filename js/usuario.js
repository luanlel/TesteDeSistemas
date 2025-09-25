    const telefoneInput = document.getElementById("telefone");
    const form = document.getElementById("cadastroForm");
    const sucessoMsg = document.getElementById("msg-sucesso");

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

    function validarSenha(senha) {
      const regex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
      return regex.test(senha);
    }

    function mostrarErro(id, msg) {
      document.getElementById(id).textContent = msg;
    }

    function limparErros() {
      ["erro-nome", "erro-id", "erro-email", "erro-senha", "erro-telefone"].forEach(
        (id) => (document.getElementById(id).textContent = "")
      );
      sucessoMsg.textContent = "";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      limparErros();

      let valido = true;

      const nome = form.nome.value.trim();
      if (nome.length < 3) {
        mostrarErro("erro-nome", "Informe um nome completo válido.");
        valido = false;
      }

      const email = form.email.value.trim();
      if (!email.match(/^\S+@\S+\.\S+$/)) {
        mostrarErro("erro-email", "Informe um e-mail válido.");
        valido = false;
      }

      const senha = form.senha.value;
      if (!validarSenha(senha)) {
        mostrarErro(
          "erro-senha",
          "Senha deve ter mínimo 6 caracteres, com letras maiúsculas, minúsculas, números e caracteres especiais."
        );
        valido = false;
      }

      const telefone = form.telefone.value.replace(/\D/g, "");
      if (telefone.length < 10) {
        mostrarErro("erro-telefone", "Informe um telefone válido (10 ou 11 dígitos).");
        valido = false;
      }

      if (valido) {
        sucessoMsg.textContent = "Cadastro realizado com sucesso!";
        form.reset();
      }
    });
 