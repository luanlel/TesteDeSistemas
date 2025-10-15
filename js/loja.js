import { db } from "./firebase-config.js";
import { collection, doc, runTransaction, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const listaProdutos = document.getElementById("lista-produtos");
const carrinhoContagem = document.getElementById("carrinho-contagem");
const listaCarrinho = document.getElementById("lista-carrinho");
const carrinhoTotal = document.getElementById("carrinho-total");
const btnFinalizarCompra = document.getElementById("btnFinalizarCompra");

let produtos = [];
let carrinho = {};

async function carregarProdutos() {
  const produtosRef = collection(db, "produtos");
  onSnapshot(produtosRef, (snapshot) => {
    listaProdutos.innerHTML = ""; 
    produtos = []; 
    snapshot.forEach(docSnap => {
      const produto = { id: docSnap.id, ...docSnap.data() };
      produtos.push(produto);

      if (produto.quantidade > 0) {
  const card = document.createElement("div");
  card.className = "produto-card product-card";
        card.innerHTML = `
          ${produto.imagemDataUrl ? `<img src="${produto.imagemDataUrl}" alt="${produto.nome}" />` : ''}
          <h3>${produto.nome}</h3>
          <p class="preco">R$ ${parseFloat(produto.preco).toFixed(2)}</p>
          <p>Estoque: ${produto.quantidade}</p>
          <button data-id="${produto.id}">Adicionar ao Carrinho</button>
        `;
        listaProdutos.appendChild(card);
      }
    });
  });
}

listaProdutos.addEventListener("click", async (e) => {
  if (e.target.tagName === "BUTTON") {
    const produtoId = e.target.dataset.id;
    e.target.disabled = true;

    try {
      await runTransaction(db, async (transaction) => {
        const produtoRef = doc(db, "produtos", produtoId);
        const sfDoc = await transaction.get(produtoRef);

        if (!sfDoc.exists()) {
          throw "Produto não encontrado!";
        }

        const novaQuantidade = sfDoc.data().quantidade - 1;
        if (novaQuantidade < 0) {
          throw "Estoque insuficiente!";
        }

        transaction.update(produtoRef, { quantidade: novaQuantidade });
      });

      carrinho[produtoId] = (carrinho[produtoId] || 0) + 1;
      atualizarResumoCarrinho();

    } catch (error) {
      console.error("Erro ao adicionar ao carrinho: ", error);
      alert(`Não foi possível adicionar o item: ${error}`);
    } finally {
      e.target.disabled = false;
    }
  }
});

listaCarrinho.addEventListener("click", async (e) => {
  if (e.target.classList.contains("btn-remover")) {
    const produtoId = e.target.dataset.id;
    e.target.disabled = true;

    try {
      await runTransaction(db, async (transaction) => {
        const produtoRef = doc(db, "produtos", produtoId);
        const sfDoc = await transaction.get(produtoRef);
        if (!sfDoc.exists()) {
          throw "Produto não encontrado!";
        }
        const novaQuantidade = sfDoc.data().quantidade + 1;
        transaction.update(produtoRef, { quantidade: novaQuantidade });
      });

      carrinho[produtoId] -= 1;
      if (carrinho[produtoId] === 0) {
        delete carrinho[produtoId];
      }
      atualizarResumoCarrinho();

    } catch (error) {
      console.error("Erro ao remover do carrinho: ", error);
      alert(`Não foi possível remover o item: ${error}`);
      e.target.disabled = false;
    }
  }
});

function atualizarResumoCarrinho() {
  let contagem = 0;
  let total = 0;
  listaCarrinho.innerHTML = "";

  for (const produtoId in carrinho) {
    const quantidade = carrinho[produtoId];
    const produto = produtos.find(p => p.id === produtoId);

    if (produto) {
      const itemCarrinho = document.createElement("li");
      itemCarrinho.innerHTML = `
        ${produto.nome} (x${quantidade})
        <button class="btn-remover" data-id="${produto.id}">Remover</button>
      `;
      listaCarrinho.appendChild(itemCarrinho);

      contagem += quantidade;
      total += quantidade * produto.preco;
    }
  }

  carrinhoContagem.textContent = contagem;
  carrinhoTotal.textContent = total.toFixed(2);
}

btnFinalizarCompra.addEventListener("click", () => {
  if (Object.keys(carrinho).length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  alert("Compra finalizada com sucesso!");
  
  carrinho = {};
  atualizarResumoCarrinho();
  carregarProdutos();
});

carregarProdutos();