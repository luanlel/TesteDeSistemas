/**
 * TESTE DE INTEGRAÇÃO
 * Integra criação de admin e simulação de Firestore
 * 100% mockado (sem Firebase real)
 */

// Mock de criação de admin
function criarAdminMock(email, senha) {
  if (email === "adm@gmail.com" && senha === "321456") {
    return { uid: "123", email };
  }
  throw new Error("Credenciais inválidas");
}

// Mock de Firestore
function salvarAdminMock(uid, dados) {
  if (uid === "123") {
    return { ...dados, salvo: true };
  }
  throw new Error("UID inválido");
}

// Função integrando os mocks
async function setupAdminMock(email, senha) {
  const cred = criarAdminMock(email, senha);
  const admin = salvarAdminMock(cred.uid, {
    nome: "Administrador",
    email,
    telefone: "000000000"
  });
  return admin;
}

describe("🔗 Testes de Integração - SetupAdmin", () => {
  test("Cria admin e salva no Firestore simulado", async () => {
    const resultado = await setupAdminMock("adm@gmail.com", "321456");
    expect(resultado.salvo).toBe(true);
    expect(resultado.nome).toBe("Administrador");
    expect(resultado.email).toBe("adm@gmail.com");
  });

  test("Falha com credenciais erradas", async () => {
    expect(() => criarAdminMock("teste@gmail.com", "000")).toThrow("Credenciais inválidas");
  });

  test("Falha com UID inválido", async () => {
    expect(() => salvarAdminMock("999", { nome: "X" })).toThrow("UID inválido");
  });
});
