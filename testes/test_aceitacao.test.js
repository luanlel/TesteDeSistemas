/**
 * TESTE DE ACEITAÇÃO
 * Foco: validar se o sistema entrega o que o usuário espera.
 */

function cadastrarUsuarioMock(nome, email, senha) {
  if (nome && email.includes("@") && senha.length >= 6) {
    return "✅ Cadastro realizado com sucesso!";
  }
  return "❌ Falha no cadastro.";
}

test("Usuário deve conseguir se cadastrar com dados válidos", () => {
  const resultado = cadastrarUsuarioMock("João Silva", "joao@email.com", "123456");
  expect(resultado).toBe("✅ Cadastro realizado com sucesso!");
});

test("Usuário não deve conseguir se cadastrar com dados inválidos", () => {
  const resultado = cadastrarUsuarioMock("", "joao", "123");
  expect(resultado).toBe("❌ Falha no cadastro.");
});
