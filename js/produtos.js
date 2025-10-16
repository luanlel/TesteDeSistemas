import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

let estoque = [];
let ordemAsc = true;

async function carregarProdutos() {
  estoque = [];
  const snapshot = await getDocs(collection(db, "produtos"));
  snapshot.forEach((docSnap) => {
    estoque.push({ id: docSnap.id, ...docSnap.data() });
  });
  atualizarTabela();
}

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
}

document.getElementById("formProduto").addEventListener("submit", async function(e) {
  e.preventDefault();

  let nome = document.getElementById("nome").value.trim();
  let quantidade = parseInt(document.getElementById("quantidade").value);
  let preco = parseFloat(document.getElementById("preco").value);
  // Aplica limites do cliente
  if (nome.length > 120) nome = nome.slice(0, 120);
  if (!Number.isInteger(quantidade) || quantidade < 0) quantidade = NaN;
  if (isNaN(preco) || preco <= 0) preco = NaN;

  if (!nome) {
    document.getElementById("erro-nome").textContent = "Digite o nome do produto."; 
    return;
  }
  document.getElementById("erro-nome").textContent = "";

  if (isNaN(quantidade) || quantidade < 0 || quantidade > 100000) {
    document.getElementById("erro-quantidade").textContent = "Quantidade inválida."; 
    return;
  }
  document.getElementById("erro-quantidade").textContent = "";

  if (isNaN(preco) || preco <= 0 || preco > 1000000) {
    document.getElementById("erro-preco").textContent = "Preço inválido."; 
    return;
  }
  document.getElementById("erro-preco").textContent = "";

  try {
    await addDoc(collection(db, "produtos"), { nome, quantidade, preco });
    document.getElementById("msg-sucesso").textContent = "Produto cadastrado com sucesso!";
    this.reset();
    carregarProdutos();
  } catch (error) {
    console.error("Erro ao adicionar produto: ", error);
  }

  setTimeout(() => document.getElementById("msg-sucesso").textContent = "", 3000);
});

async function removerProduto() {
  const nome = document.getElementById("acaoNome").value.trim();
  const produto = estoque.find(p => p.nome.toLowerCase() === nome.toLowerCase());
  if (produto) {
    await deleteDoc(doc(db, "produtos", produto.id));
    carregarProdutos();
    document.getElementById("msg-estoque").textContent = "Produto removido!";
  } else {
    document.getElementById("msg-estoque").textContent = "Produto não encontrado!";
  }
  setTimeout(() => document.getElementById("msg-estoque").textContent = "", 3000);
}

async function comprarProduto() {
  const nome = document.getElementById("acaoNome").value.trim();
  const qtd = parseInt(document.getElementById("acaoQtd").value);
  const produto = estoque.find(p => p.nome.toLowerCase() === nome.toLowerCase());

  if (produto && qtd > 0) {
    const ref = doc(db, "produtos", produto.id);
    await updateDoc(ref, { quantidade: produto.quantidade + qtd });
    carregarProdutos();
    document.getElementById("msg-estoque").textContent = "Compra registrada!";
  } else {
    document.getElementById("msg-estoque").textContent = "Produto não encontrado ou quantidade inválida!";
  }
  setTimeout(() => document.getElementById("msg-estoque").textContent = "", 3000);
}

async function venderProduto() {
  const nome = document.getElementById("acaoNome").value.trim();
  const qtd = parseInt(document.getElementById("acaoQtd").value);
  const produto = estoque.find(p => p.nome.toLowerCase() === nome.toLowerCase());

  if (produto && qtd > 0 && produto.quantidade >= qtd) {
    const ref = doc(db, "produtos", produto.id);
    await updateDoc(ref, { quantidade: produto.quantidade - qtd });
    carregarProdutos();
    document.getElementById("msg-estoque").textContent = "Venda registrada!";
  } else {
    document.getElementById("msg-estoque").textContent = "Produto não encontrado ou estoque insuficiente!";
  }
  setTimeout(() => document.getElementById("msg-estoque").textContent = "", 3000);
}

async function editarPreco() {
  const nome = document.getElementById("precoNome").value.trim();
  const novoPreco = parseFloat(document.getElementById("novoPreco").value);
  const produto = estoque.find(p => p.nome.toLowerCase() === nome.toLowerCase());

  if (produto && novoPreco > 0) {
    const ref = doc(db, "produtos", produto.id);
    await updateDoc(ref, { preco: novoPreco });
    carregarProdutos();
    document.getElementById("msg-preco").textContent = "Preço atualizado!";
  } else {
    document.getElementById("msg-preco").textContent = "Produto não encontrado ou preço inválido!";
  }
  setTimeout(() => document.getElementById("msg-preco").textContent = "", 3000);
}

function pesquisarProduto() {
  const termo = document.getElementById("pesquisa").value.toLowerCase();
  const filtrados = estoque.filter(p => p.nome.toLowerCase().includes(termo));
  atualizarTabela(filtrados);
}

function ordenarPor(campo) {
  estoque.sort((a,b) => {
    if(campo === 'nome') return ordemAsc ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome);
    return ordemAsc ? a[campo] - b[campo] : b[campo] - a[campo];
  });
  ordemAsc = !ordemAsc;
  atualizarTabela();
}

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

function exportarCSV() {
  let csv = "Produto,Quantidade,Preço\n";
  estoque.forEach(p=>csv+=`${p.nome},${p.quantidade},${p.preco}\n`);
  const blob = new Blob([csv],{type:"text/csv"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "estoque.csv";
  link.click();
}

carregarProdutos();

window.removerProduto = removerProduto;
window.comprarProduto = comprarProduto;
window.venderProduto = venderProduto;
window.editarPreco = editarPreco;
window.pesquisarProduto = pesquisarProduto;
window.ordenarPor = ordenarPor;
window.exportarCSV = exportarCSV;
