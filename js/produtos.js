let estoque = JSON.parse(localStorage.getItem("estoque")) || [];
let ordemAsc = true;

// Atualiza tabela, dashboard e salva localStorage
function atualizarTabela(lista = estoque) {
  const tabela = document.getElementById("tabelaEstoque");
  tabela.innerHTML = "";
  lista.forEach(produto => {
    tabela.innerHTML += `
      <tr>
        <td>${produto.nome}</td>
        <td>${produto.quantidade}</td>
        <td>${produto.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</td>
      </tr>`;
  });

  atualizarDashboard();
  localStorage.setItem("estoque", JSON.stringify(estoque));
}

// Cadastro
document.getElementById("formProduto").addEventListener("submit", function(e) {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const quantidade = parseInt(document.getElementById("quantidade").value);
  const preco = parseFloat(document.getElementById("preco").value);

  if (!nome) return document.getElementById("erro-nome").textContent = "Digite o nome do produto.";
  document.getElementById("erro-nome").textContent = "";

  if (isNaN(quantidade) || quantidade <= 0) return document.getElementById("erro-quantidade").textContent = "Quantidade inválida.";
  document.getElementById("erro-quantidade").textContent = "";

  if (isNaN(preco) || preco <= 0) return document.getElementById("erro-preco").textContent = "Preço inválido.";
  document.getElementById("erro-preco").textContent = "";

  if (estoque.some(p => p.nome.toLowerCase() === nome.toLowerCase())) {
    document.getElementById("msg-sucesso").textContent = "Produto já existe!";
    setTimeout(() => document.getElementById("msg-sucesso").textContent = "", 3000);
    return;
  }

  estoque.push({ nome, quantidade, preco });
  atualizarTabela();
  document.getElementById("msg-sucesso").textContent = "Produto cadastrado com sucesso!";
  this.reset();
  setTimeout(() => document.getElementById("msg-sucesso").textContent = "", 3000);
});

// Remover
function removerProduto() {
  const nome = document.getElementById("acaoNome").value.trim();
  estoque = estoque.filter(p => p.nome.toLowerCase() !== nome.toLowerCase());
  atualizarTabela();
  document.getElementById("msg-estoque").textContent = "Produto removido!";
  setTimeout(() => document.getElementById("msg-estoque").textContent = "", 3000);
}

// Comprar
function comprarProduto() {
  const nome = document.getElementById("acaoNome").value.trim();
  const qtd = parseInt(document.getElementById("acaoQtd").value);
  const produto = estoque.find(p => p.nome.toLowerCase() === nome.toLowerCase());

  if (produto && qtd > 0) {
    produto.quantidade += qtd;
    atualizarTabela();
    document.getElementById("msg-estoque").textContent = "Compra registrada!";
  } else {
    document.getElementById("msg-estoque").textContent = "Produto não encontrado ou quantidade inválida!";
  }
  setTimeout(() => document.getElementById("msg-estoque").textContent = "", 3000);
}

// Vender
function venderProduto() {
  const nome = document.getElementById("acaoNome").value.trim();
  const qtd = parseInt(document.getElementById("acaoQtd").value);
  const produto = estoque.find(p => p.nome.toLowerCase() === nome.toLowerCase());

  if (produto && qtd > 0 && produto.quantidade >= qtd) {
    produto.quantidade -= qtd;
    atualizarTabela();
    document.getElementById("msg-estoque").textContent = "Venda registrada!";
  } else {
    document.getElementById("msg-estoque").textContent = "Produto não encontrado ou estoque insuficiente!";
  }
  setTimeout(() => document.getElementById("msg-estoque").textContent = "", 3000);
}

// Editar preço
function editarPreco() {
  const nome = document.getElementById("precoNome").value.trim();
  const novoPreco = parseFloat(document.getElementById("novoPreco").value);
  const produto = estoque.find(p => p.nome.toLowerCase() === nome.toLowerCase());

  if (produto && novoPreco > 0) {
    produto.preco = novoPreco;
    atualizarTabela();
    document.getElementById("msg-preco").textContent = "Preço atualizado!";
  } else {
    document.getElementById("msg-preco").textContent = "Produto não encontrado ou preço inválido!";
  }
  setTimeout(() => document.getElementById("msg-preco").textContent = "", 3000);
}

// Pesquisar
function pesquisarProduto() {
  const termo = document.getElementById("pesquisa").value.toLowerCase();
  const filtrados = estoque.filter(p => p.nome.toLowerCase().includes(termo));
  atualizarTabela(filtrados);
}

// Ordenar
function ordenarPor(campo) {
  estoque.sort((a,b) => {
    if(campo === 'nome') return ordemAsc ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome);
    return ordemAsc ? a[campo] - b[campo] : b[campo] - a[campo];
  });
  ordemAsc = !ordemAsc;
  atualizarTabela();
}

// Dashboard
function atualizarDashboard() {
  const totalProdutos = estoque.length;
  const totalQuantidade = estoque.reduce((acc,p)=>acc+p.quantidade,0);
  const valorTotal = estoque.reduce((acc,p)=>acc+p.quantidade*p.preco,0);

  document.getElementById("dashboard").innerHTML = `
    <p><b>Total de Produtos:</b> ${totalProdutos}</p>
    <p><b>Quantidade em Estoque:</b> ${totalQuantidade}</p>
    <p><b>Valor Total:</b> ${valorTotal.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}</p>
  `;
}

// Exportar CSV
function exportarCSV() {
  let csv = "Produto,Quantidade,Preço\n";
  estoque.forEach(p=>csv+=`${p.nome},${p.quantidade},${p.preco}\n`);
  const blob = new Blob([csv],{type:"text/csv"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "estoque.csv";
  link.click();
}

// Inicializa tabela
atualizarTabela();
