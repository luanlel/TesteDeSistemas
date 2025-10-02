/**
 * TESTE DE SISTEMA
 * Simula o fluxo completo do sistema (login -> acessar página correta)
 * sem precisar do Firebase real.
 */

function sistemaMock(email, senha) {
  if (email === "adm@gmail.com" && senha === "321456") {
    return "pag_adm.html";
  }
  if (email === "user@gmail.com" && senha === "123456") {
    return "loja.html";
  }
  return "index.html";
}

test("Fluxo de login do admin leva para página de admin", () => {
  expect(sistemaMock("adm@gmail.com", "321456")).toBe("pag_adm.html");
});

test("Fluxo de login do usuário leva para loja", () => {
  expect(sistemaMock("user@gmail.com", "123456")).toBe("loja.html");
});

test("Login inválido volta para index", () => {
  expect(sistemaMock("teste@gmail.com", "000000")).toBe("index.html");
});
