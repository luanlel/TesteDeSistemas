/**
 * 🔹 Testes Alfa
 * São feitos pela equipe de desenvolvimento, com foco em verificar se as
 * funções principais estão funcionando de acordo com o esperado.
 */

describe("🧪 Testes Alfa - Sistema Mercadinho", () => {
  test("Admin deve conseguir criar produto no estoque → sucesso esperado", () => {
    // Simulação de cadastro de produto pelo administrador.
    const produtos = [];
    function cadastrarProduto(nome, qtd, preco) {
      produtos.push({ nome, qtd, preco });
      return produtos.length; // retorna quantidade de produtos cadastrados
    }

    // Cadastro de 1 produto (Papel A4).
    const total = cadastrarProduto("Papel A4", 100, 10);

    // Deve haver 1 produto cadastrado e o nome deve ser "Papel A4".
    expect(total).toBe(1);
    expect(produtos[0].nome).toBe("Papel A4");
  });

  test("Carrinho deve calcular total corretamente → soma de produtos", () => {
    // Lista de produtos disponíveis
    const produtos = [{ id: "1", nome: "Caneta", preco: 2.5 }];

    // Carrinho com 4 canetas
    const carrinho = { "1": 4 };

    // Função que soma o total do carrinho
    function calcularCarrinho(produtos, carrinho) {
      let total = 0;
      for (const pid in carrinho) {
        const prod = produtos.find(p => p.id === pid);
        total += prod.preco * carrinho[pid];
      }
      return total;
    }

    // 4 canetas x R$2,50 = R$10,00
    const resultado = calcularCarrinho(produtos, carrinho);
    expect(resultado).toBe(10);
  });

  test("Login deve retornar sucesso com credenciais válidas", () => {
    // Simulação de login: apenas email e senha corretos retornam true.
    function login(email, senha) {
      return email === "adm@gmail.com" && senha === "321456";
    }

    // Como o admin digitou corretamente, deve retornar true.
    expect(login("adm@gmail.com", "321456")).toBe(true);
  });
});
