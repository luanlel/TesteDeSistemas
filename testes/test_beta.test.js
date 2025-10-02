/**
 * 🔹 Testes Beta
 * São feitos simulando usuários externos, testando erros e situações inesperadas.
 */

describe("🧪 Testes Beta - Sistema Mercadinho", () => {
  test("Usuário tenta logar com senha incorreta → deve falhar", () => {
    // Simulação de login: apenas email e senha corretos permitem acesso.
    function login(email, senha) {
      return email === "adm@gmail.com" && senha === "321456";
    }

    // O usuário digitou a senha errada, o login deve retornar false.
    expect(login("adm@gmail.com", "senhaErrada")).toBe(false);
  });

  test("Usuário tenta cadastrar produto sem preço → deve lançar erro", () => {
    // Simulação de cadastro de produto: preço é obrigatório.
    function cadastrarProduto(nome, qtd, preco) {
      if (!preco) throw new Error("Preço inválido");
      return true;
    }

    // Como o preço não foi informado, deve gerar erro "Preço inválido".
    expect(() => cadastrarProduto("Borracha", 50, null)).toThrow("Preço inválido");
  });

  test("Usuário tenta comprar mais produtos do que o estoque disponível → deve lançar erro", () => {
    // Simulação de venda: não é permitido vender mais do que o estoque.
    function venderProduto(estoque, qtd) {
      if (qtd > estoque) throw new Error("Estoque insuficiente");
      return estoque - qtd;
    }

    // Estoque disponível = 5, usuário tentou comprar 10 → deve falhar.
    expect(() => venderProduto(5, 10)).toThrow("Estoque insuficiente");
  });

  test("Usuário digita telefone inválido → deve falhar na validação", () => {
    // Simulação de validação de telefone no formato brasileiro.
    function validarTelefone(tel) {
      return /^\(\d{2}\) \d{4,5}-\d{4}$/.test(tel);
    }

    // Telefone errado → deve retornar false
    expect(validarTelefone("12345")).toBe(false);

    // Telefone válido no padrão brasileiro → deve retornar true
    expect(validarTelefone("(71) 99282-9252")).toBe(true);
  });
});
