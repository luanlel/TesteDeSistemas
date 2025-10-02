/**
 * TESTES UNITÁRIOS
 * Aqui testamos funções isoladas, sem depender do Firebase ou do DOM.
 * Exemplos:
 *  - cadastro_usuario.js → validarSenha()
 *  - loja.js → atualizarResumoCarrinho()
 *  - produtos.js → funções de cálculo e ordenação
 */

// ---------------- cadastro_usuario.js ----------------
function validarSenha(senha) {
  const regex = /^\d{6,}$/;
  return regex.test(senha);
}

test("Senha válida deve ter ao menos 6 dígitos numéricos", () => {
  expect(validarSenha("123456")).toBe(true);
  expect(validarSenha("123")).toBe(false);
  expect(validarSenha("abcdef")).toBe(false);
});

// ---------------- loja.js ----------------
function atualizarResumoCarrinhoMock(produtos, carrinho) {
  let contagem = 0;
  let total = 0;

  for (const produtoId in carrinho) {
    const quantidade = carrinho[produtoId];
    const produto = produtos.find(p => p.id === produtoId);
    if (produto) {
      contagem += quantidade;
      total += quantidade * produto.preco;
    }
  }
  return { contagem, total: total.toFixed(2) };
}

test("Resumo do carrinho deve somar quantidade e preço corretamente", () => {
  const produtos = [{ id: "1", nome: "Pão", preco: 2.5 }];
  const carrinho = { "1": 3 };

  const resultado = atualizarResumoCarrinhoMock(produtos, carrinho);
  expect(resultado.contagem).toBe(3);
  expect(resultado.total).toBe("7.50");
});

// ---------------- produtos.js ----------------
function calcularDashboardMock(estoque) {
  const totalProdutos = estoque.length;
  const totalQuantidade = estoque.reduce((acc, p) => acc + p.quantidade, 0);
  const valorTotal = estoque.reduce((acc, p) => acc + p.quantidade * p.preco, 0);
  return { totalProdutos, totalQuantidade, valorTotal };
}

test("Dashboard deve calcular totais do estoque", () => {
  const estoque = [
    { nome: "Coca", quantidade: 10, preco: 5 },
    { nome: "Salgado", quantidade: 5, preco: 3 }
  ];
  const result = calcularDashboardMock(estoque);
  expect(result.totalProdutos).toBe(2);
  expect(result.totalQuantidade).toBe(15);
  expect(result.valorTotal).toBe(65);
});

// ---------------- geren_usuario.js ----------------
function aplicarMascaraTelefoneMock(numero) {
  numero = numero.replace(/\D/g, "");
  if (numero.length > 11) numero = numero.slice(0, 11);
  if (numero.length > 0) numero = "(" + numero;
  if (numero.length > 3) numero = numero.slice(0, 3) + ") " + numero.slice(3);
  if (numero.length > 10) numero = numero.slice(0, 10) + "-" + numero.slice(10);
  return numero;
}

test("Deve aplicar máscara no telefone corretamente", () => {
  expect(aplicarMascaraTelefoneMock("71992829252")).toBe("(71) 99282-9252");
  expect(aplicarMascaraTelefoneMock("11987654321")).toBe("(11) 98765-4321");
});
