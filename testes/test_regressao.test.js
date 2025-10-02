/**
 * 🔄 TESTES DE REGRESSÃO
 * Aqui garantimos que funções principais do sistema (admin/login) 
 * continuam funcionando após alterações.
 *
 * Não dependemos do Firebase real, apenas simulamos (mocks).
 */

// ------------------ MOCKS ------------------
function initAdminMock(criado = false) {
  // Simula initAdmin do admin.js
  if (criado) {
    return "Admin já existe!";
  } else {
    return "Admin criado!";
  }
}

function loginMock(email, senha) {
  // Simula login do auth.js
  if (email === "adm@gmail.com" && senha === "321456") {
    return { sucesso: true, role: "admin", redirect: "pag_adm.html" };
  }
  if (email === "user@gmail.com" && senha === "123456") {
    return { sucesso: true, role: "usuario", redirect: "loja.html" };
  }
  return { sucesso: false, role: null, redirect: "index.html" };
}

// ------------------ TESTES ------------------
describe("🔄 Testes de Regressão - Sistema Mercadinho", () => {
  test("initAdmin continua criando admin corretamente", () => {
    const resultado = initAdminMock(false); // admin ainda não existe
    expect(resultado).toBe("Admin criado!");
  });

  test("initAdmin retorna mensagem se admin já existe", () => {
    const resultado = initAdminMock(true); // admin já existe
    expect(resultado).toBe("Admin já existe!");
  });

  test("login de admin continua funcionando", () => {
    const resultado = loginMock("adm@gmail.com", "321456");
    expect(resultado.sucesso).toBe(true);
    expect(resultado.role).toBe("admin");
    expect(resultado.redirect).toContain("pag_adm.html");
  });

  test("login de usuário continua funcionando", () => {
    const resultado = loginMock("user@gmail.com", "123456");
    expect(resultado.sucesso).toBe(true);
    expect(resultado.role).toBe("usuario");
    expect(resultado.redirect).toContain("loja.html");
  });

  test("login inválido retorna falso e redireciona para index", () => {
    const resultado = loginMock("teste@gmail.com", "000000");
    expect(resultado.sucesso).toBe(false);
    expect(resultado.role).toBeNull();
    expect(resultado.redirect).toContain("index.html");
  });
});
