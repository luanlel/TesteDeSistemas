/* TESTES UNITÁRIOS */

// ---------------- teste de cadastro   ----------------
function validarSenha(senha) {
  const regex = /^\d{6,}$/;
  return regex.test(senha);
}

test("Senha válida deve ter ao menos 6 dígitos numéricos", () => {
  expect(validarSenha("123456")).toBe(true);
  expect(validarSenha("123")).toBe(false);
  expect(validarSenha("abcdef")).toBe(false);
});

// ---------------- teste de email ----------------
function validarEmailMock(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

test("Deve validar o formato do email corretamente", () => {
  expect(validarEmailMock("teste@dominio.com")).toBe(true);
  expect(validarEmailMock("teste@dominio")).toBe(false);
  expect(validarEmailMock("teste.com")).toBe(false);
  expect(validarEmailMock("")).toBe(false);
});

// ---------------- teste do carrinho ----------------
function manipularCarrinhoMock(carrinhoInicial, acao, produtoId) {
  const novoCarrinho = { ...carrinhoInicial };

  if (acao === 'adicionar') {
    novoCarrinho[produtoId] = (novoCarrinho[produtoId] || 0) + 1;
  } else if (acao === 'remover') {
    if (novoCarrinho[produtoId]) {
      novoCarrinho[produtoId] -= 1;
      if (novoCarrinho[produtoId] === 0) {
        delete novoCarrinho[produtoId];
      }
    }
  }
  return novoCarrinho;
}

test("Deve adicionar e remover itens do carrinho corretamente", () => {
  let carrinho = {};
  carrinho = manipularCarrinhoMock(carrinho, 'adicionar', 'prod1');
  carrinho = manipularCarrinhoMock(carrinho, 'adicionar', 'prod1');
  carrinho = manipularCarrinhoMock(carrinho, 'remover', 'prod1');
  expect(carrinho['prod1']).toBe(1);
});

// ---------------- teste de compra ----------------
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

// ---------------- teste de cálculo de estoque ----------------
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

// ---------------- teste de formatação de telefone ----------------
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

// ---------------- teste de ordenação de produtos ----------------
function ordenarPorMock(lista, campo, ordemAsc) {
  const sortedList = [...lista];
  sortedList.sort((a, b) => {
    if (campo === 'nome') {
      return ordemAsc ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome);
    }
    return ordemAsc ? a[campo] - b[campo] : b[campo] - a[campo];
  });
  return sortedList;
}

describe("Ordenação de produtos", () => {
  const estoque = [
    { nome: "Coca", quantidade: 10, preco: 5 },
    { nome: "Salgado", quantidade: 5, preco: 3 },
    { nome: "Agua", quantidade: 20, preco: 2 }
  ];

  test("Deve ordenar produtos por nome em ordem ascendente", () => {
    const resultado = ordenarPorMock(estoque, 'nome', true);
    expect(resultado[0].nome).toBe("Agua");
    expect(resultado[1].nome).toBe("Coca");
  });

  test("Deve ordenar produtos por preço em ordem descendente", () => {
    const resultado = ordenarPorMock(estoque, 'preco', false);
    expect(resultado[0].preco).toBe(5);
    expect(resultado[1].preco).toBe(3);
  });
});


// ---------------- teste de login ----------------
function loginMock(email, senha, dbMock) {
  if (!email || !senha) return "credenciais_invalidas";

  const user = dbMock.users.find(u => u.email === email && u.senha === senha);
  if (!user) return "nao_encontrado";

  if (dbMock.admins.includes(user.id)) {
    return "admin_logado";
  }
  if (dbMock.usuarios.includes(user.id)) {
    return "usuario_logado";
  }
  return "sem_role";
}

describe("Lógica de Login", () => {
  const dbMock = {
    users: [
      { id: "admin1", email: "admin@test.com", senha: "admin123" },
      { id: "user1", email: "user@test.com", senha: "user123" },
    ],
    admins: ["admin1"],
    usuarios: ["user1"],
  };

  test("Deve retornar 'admin_logado' para credenciais de admin", () => {
    expect(loginMock("admin@test.com", "admin123", dbMock)).toBe("admin_logado");
  });

  test("Deve retornar 'usuario_logado' para credenciais de usuário", () => {
    expect(loginMock("user@test.com", "user123", dbMock)).toBe("usuario_logado");
  });

  test("Deve retornar 'nao_encontrado' para credenciais incorretas", () => {
    expect(loginMock("user@test.com", "senhaerrada", dbMock)).toBe("nao_encontrado");
  });
});


/**
 * ==========================================
 * TESTES UNITÁRIOS - SISTEMA PAPELARIA
 * ==========================================
 * Data de criação: 22/10/2025
 * Responsável: Luís Felipe de Brito Viana
 */

/* -------------------------------------------------
 * TESTE 1 - Cadastro de Produto: Quantidade com entrada alfanumérica
 * -------------------------------------------------
 * Descrição:
 * Verifica se o sistema impede o cadastro de um produto
 * quando o campo "Quantidade" contém letras ou caracteres não numéricos.
 */
function validarQuantidadeMock(quantidade) {
  // Aceita apenas números inteiros e positivos
  const regex = /^[0-9]+$/;
  return regex.test(quantidade) && parseInt(quantidade) > 0;
}

test("Cadastro de Produto - Quantidade com entrada alfanumérica deve ser inválida", () => {
  expect(validarQuantidadeMock("10")).toBe(true);        // válido
  expect(validarQuantidadeMock("abc")).toBe(false);      // inválido - letras
  expect(validarQuantidadeMock("12a")).toBe(false);      // inválido - mistura
  expect(validarQuantidadeMock("-5")).toBe(false);       // inválido - negativo
});


/* -------------------------------------------------
 * TESTE 2 - Cadastro de Usuário: Telefone com entrada alfanumérica
 * -------------------------------------------------
 * Descrição:
 * Verifica se o sistema rejeita valores alfanuméricos no campo "Telefone"
 * e aceita apenas números no formato brasileiro (com DDD).
 */
function validarTelefoneMock(telefone) {
  // Aceita apenas números e exige entre 10 e 11 dígitos (DDD + número)
  const regex = /^\d{10,11}$/;
  return regex.test(telefone);
}

test("Cadastro de Usuário - Telefone com entrada alfanumérica deve ser rejeitado", () => {
  expect(validarTelefoneMock("71992829252")).toBe(true);   // válido
  expect(validarTelefoneMock("1198765432")).toBe(true);    // válido com 10 dígitos
  expect(validarTelefoneMock("abc12345678")).toBe(false);  // inválido - letras
  expect(validarTelefoneMock("12345abcde")).toBe(false);   // inválido - letras no meio
  expect(validarTelefoneMock("")).toBe(false);             // inválido - vazio
});


/* -------------------------------------------------
 * TESTE 3 - Cadastro de Produto: Preço com número negativo
 * -------------------------------------------------
 * Descrição:
 * Garante que o sistema bloqueia o cadastro de produtos
 * quando o campo "Preço" possui valores negativos ou zero.
 */
function validarPrecoMock(preco) {
  // Deve ser um número maior que 0
  const valor = parseFloat(preco);
  return !isNaN(valor) && valor > 0;
}

test("Cadastro de Produto - Preço com número negativo deve ser inválido", () => {
  expect(validarPrecoMock(10.5)).toBe(true);     // válido
  expect(validarPrecoMock(0)).toBe(false);       // inválido - zero
  expect(validarPrecoMock(-15)).toBe(false);     // inválido - negativo
  expect(validarPrecoMock("abc")).toBe(false);   // inválido - texto
});
