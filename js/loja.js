import { db } from "./firebase-config.js";
import { collection, getDocs, doc, updateDoc, runTransaction } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const listaProdutos = document.getElementById("lista-produtos");
const carrinhoContagem = document.getElementById("carrinho-contagem");
const carrinhoTotal = document.getElementById("carrinho-total");
const btnFinalizarCompra = document.getElementById("btnFinalizarCompra");

let produtos = [];
let carrinho = {};

async function carregarProdutos() {
  const produtosRef = collection(db, "produtos");
  const snapshot = await getDocs(produtosRef);

  listaProdutos.innerHTML = ""; 
  produtos = []; 

  snapshot.forEach(docSnap => {
    const produto = { id: docSnap.id, ...docSnap.data() };
    produtos.push(produto);

    if (produto.quantidade > 0) {
      const card = document.createElement("div");
      card.className = "produto-card";
      card.innerHTML = `
        <h3>${produto.nome}</h3>
        <p class="preco">R$ ${parseFloat(produto.preco).toFixed(2)}</p>
        <p>Estoque: ${produto.quantidade}</p>
        <button data-id="${produto.id}">Adicionar ao Carrinho</button>
      `;
      listaProdutos.appendChild(card);
    }
  });
}

listaProdutos.addEventListener("click", (e) => {
  if (e.target.tagName === "BUTTON") {
    const produtoId = e.target.dataset.id;
    
    carrinho[produtoId] = (carrinho[produtoId] || 0) + 1;
    
    console.log("Carrinho atual:", carrinho);
    atualizarResumoCarrinho();
  }
});

function atualizarResumoCarrinho() {
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

  carrinhoContagem.textContent = contagem;
  carrinhoTotal.textContent = total.toFixed(2);
}

btnFinalizarCompra.addEventListener("click", async () => {
  if (Object.keys(carrinho).length === 0) {
    alert("Seu carrinho está vazio!");
    return;
  }

  try {
    await runTransaction(db, async (transaction) => {
      const produtosParaAtualizar = [];

      for (const produtoId in carrinho) {
        const quantidadeComprada = carrinho[produtoId];
        const produtoRef = doc(db, "produtos", produtoId);
        const sfDoc = await transaction.get(produtoRef);

        if (!sfDoc.exists()) {
          throw `Produto com ID ${produtoId} não encontrado!`;
        }

        const novaQuantidade = sfDoc.data().quantidade - quantidadeComprada;
        if (novaQuantidade < 0) {
          throw `Estoque insuficiente para o produto ${sfDoc.data().nome}`;
        }
        
        produtosParaAtualizar.push({ ref: produtoRef, novaQuantidade: novaQuantidade });
      }

      for (const prod of produtosParaAtualizar) {
        transaction.update(prod.ref, { quantidade: prod.novaQuantidade });
      }
    });

    alert("Compra realizada com sucesso!");
    carrinho = {};
    atualizarResumoCarrinho();
    carregarProdutos();

  } catch (error) {
    console.error("Erro ao finalizar a compra: ", error);
    alert(`Erro na transação: ${error}`);
  }
});

carregarProdutos();