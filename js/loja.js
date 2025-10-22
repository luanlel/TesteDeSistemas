// frontend/js/loja.js

import { db } from "./firebase-config.js";
import {
  collection,
  doc,
  runTransaction,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const listaProdutos = document.getElementById("lista-produtos");
const carrinhoContagem = document.getElementById("carrinho-contagem");
const listaCarrinho = document.getElementById("lista-carrinho");
const carrinhoTotal = document.getElementById("carrinho-total");
const btnFinalizarCompra = document.getElementById("btnFinalizarCompra");

let produtos = [];
let carrinho = {};
let intervalosCarrossel = {}; // Para controlar carrosséis

/** =============================
 * CARREGAR PRODUTOS E CARROSSEL
 * ============================= */
async function carregarProdutos() {
  const produtosRef = collection(db, "produtos");
  onSnapshot(produtosRef, (snapshot) => {
    listaProdutos.innerHTML = "";
    produtos = [];

    snapshot.forEach((docSnap) => {
      const produto = { id: docSnap.id, ...docSnap.data() };
      produtos.push(produto);

      const card = document.createElement("div");
      card.className = "produto-card";

      const imagens = Array.isArray(produto.imagens)
        ? produto.imagens
        : produto.imagemDataUrl
        ? [produto.imagemDataUrl]
        : produto.imagem
        ? [produto.imagem]
        : ["../imagens/imagem_padrao.png"];

      let imagensHTML = "";
      if (imagens.length > 1) {
        imagensHTML = `
          <div class="carousel" data-produto="${produto.id}">
            ${imagens.map((img, i) => `
              <div class="slide ${i === 0 ? "active" : ""}">
                <img src="${img}" alt="${produto.nome}" class="carousel-img">
              </div>`).join("")}
            <button class="prev">&#10094;</button>
            <button class="next">&#10095;</button>
          </div>
        `;
      } else {
        imagensHTML = `<img src="${imagens[0]}" alt="${produto.nome}" class="single-img"/>`;
      }

      if (produto.quantidade > 0) {
        card.innerHTML = `
          ${imagensHTML}
          <h3>${produto.nome}</h3>
          ${produto.comentario ? `<p class="comentario">${produto.comentario}</p>` : ""}
          <p class="preco">R$ ${parseFloat(produto.preco).toFixed(2)}</p>
          <p>Estoque: ${produto.quantidade}</p>
          <button data-id="${produto.id}">Adicionar ao Carrinho</button>
        `;
      } else {
        card.classList.add("esgotado");
        card.innerHTML = `
          ${imagensHTML}
          <h3>${produto.nome}</h3>
          <p class="preco">R$ ${parseFloat(produto.preco).toFixed(2)}</p>
          <p class="status-esgotado">Esgotado</p>
          <button disabled class="btn-esgotado">Indisponível</button>
        `;
      }

      listaProdutos.appendChild(card);

      // Inicia carrossel automático somente no hover
      if (imagens.length > 1) iniciarCarrosselAutomatico(card.querySelector(".carousel"));
    });
  });
}

/** =============================
 * CARROSSEL AUTOMÁTICO E MANUAL
 * ============================= */
function iniciarCarrosselAutomatico(carousel) {
  const slides = carousel.querySelectorAll(".slide");
  let activeIndex = 0;
  let interval = null;

  const nextSlide = () => {
    slides[activeIndex].classList.remove("active");
    activeIndex = (activeIndex + 1) % slides.length;
    slides[activeIndex].classList.add("active");
  };

  // Funções de hover
  carousel.addEventListener("mouseenter", () => {
    interval = setInterval(nextSlide, 3000);
  });
  carousel.addEventListener("mouseleave", () => {
    clearInterval(interval);
    interval = null;
  });

  // Botões manuais
  carousel.querySelector(".prev").addEventListener("click", () => {
    slides[activeIndex].classList.remove("active");
    activeIndex = (activeIndex - 1 + slides.length) % slides.length;
    slides[activeIndex].classList.add("active");
  });

  carousel.querySelector(".next").addEventListener("click", () => {
    slides[activeIndex].classList.remove("active");
    activeIndex = (activeIndex + 1) % slides.length;
    slides[activeIndex].classList.add("active");
  });
}

/** =============================
 * ADICIONAR AO CARRINHO
 * ============================= */
listaProdutos.addEventListener("click", async (e) => {
  if (e.target.tagName === "BUTTON" && !e.target.classList.contains("prev") && !e.target.classList.contains("next") && !e.target.classList.contains("btn-esgotado")) {
    const produtoId = e.target.dataset.id;
    e.target.disabled = true;

    try {
      await runTransaction(db, async (transaction) => {
        const produtoRef = doc(db, "produtos", produtoId);
        const sfDoc = await transaction.get(produtoRef);

        if (!sfDoc.exists()) throw "Produto não encontrado!";
        const novaQuantidade = sfDoc.data().quantidade - 1;
        if (novaQuantidade < 0) throw "Estoque insuficiente!";
        transaction.update(produtoRef, { quantidade: novaQuantidade });
      });

      carrinho[produtoId] = (carrinho[produtoId] || 0) + 1;
      atualizarResumoCarrinho();
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      alert(`Não foi possível adicionar o item: ${error}`);
    } finally {
      e.target.disabled = false;
    }
  }
});

/** =============================
 * REMOVER DO CARRINHO
 * ============================= */
listaCarrinho.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-remover")) return;

  const produtoId = e.target.dataset.id;
  e.target.disabled = true;

  try {
    await runTransaction(db, async (transaction) => {
      const produtoRef = doc(db, "produtos", produtoId);
      const sfDoc = await transaction.get(produtoRef);
      if (!sfDoc.exists()) throw "Produto não encontrado!";
      const novaQuantidade = sfDoc.data().quantidade + 1;
      transaction.update(produtoRef, { quantidade: novaQuantidade });
    });

    carrinho[produtoId] -= 1;
    if (carrinho[produtoId] === 0) delete carrinho[produtoId];
    atualizarResumoCarrinho();
  } catch (error) {
    console.error("Erro ao remover do carrinho:", error);
    alert(`Não foi possível remover o item: ${error}`);
  } finally {
    e.target.disabled = false;
  }
});

/** =============================
 * RESUMO DO CARRINHO
 * ============================= */
function atualizarResumoCarrinho() {
  let contagem = 0;
  let total = 0;
  listaCarrinho.innerHTML = "";

  for (const produtoId in carrinho) {
    const quantidade = carrinho[produtoId];
    const produto = produtos.find((p) => p.id === produtoId);

    if (produto) {
      const item = document.createElement("li");
      item.innerHTML = `
        ${produto.nome} (x${quantidade})
        <button class="btn-remover" data-id="${produto.id}">Remover</button>
      `;
      listaCarrinho.appendChild(item);
      contagem += quantidade;
      total += quantidade * produto.preco;
    }
  }

  carrinhoContagem.textContent = contagem;
  carrinhoTotal.textContent = total.toFixed(2);
}

/** =============================
 * FINALIZAR COMPRA
 * ============================= */
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
