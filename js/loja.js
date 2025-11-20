// js/loja.js - CORREÇÃO COMPLETA TODOS OS TESTES DE LOJA

import { db, auth } from "./firebase-config.js";
import {
  collection,
  doc,
  runTransaction,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

const listaProdutos = document.getElementById("lista-produtos");
const carrinhoContagem = document.getElementById("carrinho-contagem");
const listaCarrinho = document.getElementById("lista-carrinho");
const carrinhoTotal = document.getElementById("carrinho-total");
const btnFinalizarCompra = document.getElementById("btnFinalizarCompra");
const modalAuth = document.getElementById("modalAuth");

let produtos = [];
let carrinho = {};
let currentUser = null;
let processandoCheckout = false;

// ========== CONSTANTES ==========
const STORAGE_KEY = 'carrinho_papelaria';
const SESSION_KEY = 'usuario_sessao';

// ========== PERSISTÊNCIA DO CARRINHO (Teste 36) ==========
function salvarCarrinho() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      itens: carrinho,
      timestamp: new Date().getTime(),
      userId: currentUser ? currentUser.uid : null
    }));
    console.log('Carrinho salvo:', carrinho);
  } catch (e) {
    console.error("Erro ao salvar carrinho:", e);
  }
}

function carregarCarrinho() {
  try {
    const dados = localStorage.getItem(STORAGE_KEY);
    if (!dados) {
      carrinho = {};
      return;
    }
    
    const { itens, timestamp, userId } = JSON.parse(dados);
    
    // Verifica se o carrinho não é muito antigo (24 horas)
    const agora = new Date().getTime();
    const umDia = 24 * 60 * 60 * 1000;
    
    if (agora - timestamp > umDia) {
      console.log('Carrinho expirado, limpando...');
      limparCarrinho();
      return;
    }
    
    // Se houver usuário logado, verifica se é o mesmo
    if (currentUser && userId && userId !== currentUser.uid) {
      console.log('Carrinho de outro usuário, limpando...');
      limparCarrinho();
      return;
    }
    
    carrinho = itens || {};
    console.log('Carrinho carregado:', carrinho);
    atualizarResumoCarrinho();
  } catch (e) {
    console.error("Erro ao carregar carrinho:", e);
    carrinho = {};
  }
}

function limparCarrinho() {
  carrinho = {};
  localStorage.removeItem(STORAGE_KEY);
  atualizarResumoCarrinho();
  console.log('Carrinho limpo');
}

// Carrega o carrinho ao iniciar (Teste 36)
window.addEventListener('DOMContentLoaded', () => {
  carregarCarrinho();
});

// Previne perda de dados ao recarregar (Teste 36)
window.addEventListener('beforeunload', (e) => {
  salvarCarrinho();
});

// ========== GERENCIAMENTO DE AUTENTICAÇÃO (Testes 30, 39, 40) ==========
onAuthStateChanged(auth, (user) => {
  const usuarioAnterior = currentUser;
  currentUser = user;
  
  console.log("Status de autenticação:", user ? `Logado: ${user.email}` : "Não logado");
  
  // Teste 39: Logout durante compra
  if (usuarioAnterior && !user) {
    // Usuário fez logout
    console.log('Usuário deslogou');
    
    if (processandoCheckout) {
      alert('Você foi desconectado durante a compra. Por favor, faça login novamente para continuar.');
      processandoCheckout = false;
    }
    
    // Limpa carrinho ao deslogar
    limparCarrinho();
    
    // Redireciona para login se estava em processo de compra
    if (Object.keys(carrinho).length > 0) {
      abrirModal('login');
    }
  }
  
  // Se usuário logou, carrega carrinho dele
  if (user && !usuarioAnterior) {
    carregarCarrinho();
  }
  
  // Atualiza UI baseado no status de login (Teste 40)
  atualizarUIAutenticacao();
});

function atualizarUIAutenticacao() {
  const authLinks = document.querySelector('.auth-links');
  if (!authLinks) return;

  if (currentUser) {
    // Usuário logado
    const emailDisplay = currentUser.email.length > 20 
      ? currentUser.email.substring(0, 20) + '...' 
      : currentUser.email;
      
    authLinks.innerHTML = `
      <span style="color: var(--color-secondary); font-weight: 500;">
        👤 ${emailDisplay}
      </span>
      <a href="#" id="btnLogout" class="link-animated" style="color: var(--color-danger);">
        🚪 Sair
      </a>
    `;
    
    document.getElementById('btnLogout')?.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (processandoCheckout) {
        if (!confirm('Você está no meio de uma compra. Deseja realmente sair?')) {
          return;
        }
      }
      
      if (Object.keys(carrinho).length > 0) {
        if (!confirm('Você tem itens no carrinho. Ao sair, o carrinho será limpo. Deseja continuar?')) {
          return;
        }
      }
      
      auth.signOut().then(() => {
        limparCarrinho();
        alert('Você foi desconectado com sucesso.');
        window.location.reload();
      });
    });
  } else {
    // Usuário não logado
    authLinks.innerHTML = `
      <a href="#" id="btnAbrirLogin" class="link-animated">
        🔑 Login
      </a>
      <a href="#" id="btnAbrirCadastro" class="link-animated">
        📝 Cadastro
      </a>
    `;
    
    // Reconecta eventos do modal
    document.getElementById('btnAbrirLogin')?.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModal('login');
    });
    
    document.getElementById('btnAbrirCadastro')?.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModal('register');
    });
  }
}

// ========== VERIFICAÇÃO DE LOGIN (Teste 30, 40) ==========
function verificarLogin(acao = "realizar esta ação") {
  // Teste 40: Verificação de usuário logado
  if (!currentUser) {
    alert(`⚠️ Você precisa fazer login para ${acao}!`);
    abrirModal('login');
    return false;
  }
  return true;
}

function abrirModal(tab = 'login') {
  if (!modalAuth) {
    console.error('Modal de autenticação não encontrado');
    return;
  }
  
  modalAuth.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Ativa a aba correta
  const tabs = modalAuth.querySelectorAll('.tab-link');
  const contents = modalAuth.querySelectorAll('.tab-content');
  
  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  
  contents.forEach(c => {
    c.classList.toggle('active', c.id === tab);
  });
  
  // Focus no primeiro input
  setTimeout(() => {
    const input = modalAuth.querySelector('.tab-content.active input');
    if (input) input.focus();
  }, 100);
}

// ========== CARREGAR PRODUTOS E CARROSSEL ==========
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
            <button class="prev" aria-label="Imagem anterior">&#10094;</button>
            <button class="next" aria-label="Próxima imagem">&#10095;</button>
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
          <div class="controles-compra">
            <input type="number" id="quantidade-${produto.id}" value="1" min="1" max="${produto.quantidade}" aria-label="Quantidade">
            <button data-id="${produto.id}" class="btn-add-carrinho">
              🛒 Adicionar ao Carrinho
            </button>
          </div>
        `;
      } else {
        card.classList.add("esgotado");
        card.innerHTML = `
          ${imagensHTML}
          <h3>${produto.nome}</h3>
          <p class="preco">R$ ${parseFloat(produto.preco).toFixed(2)}</p>
          <p class="status-esgotado">❌ Esgotado</p>
          <button disabled class="btn-esgotado">Indisponível</button>
        `;
      }

      listaProdutos.appendChild(card);

      if (imagens.length > 1) iniciarCarrosselAutomatico(card.querySelector(".carousel"));
    });
    
    // Atualiza carrinho após carregar produtos
    atualizarResumoCarrinho();
  });
}

// ========== CARROSSEL AUTOMÁTICO ==========
function iniciarCarrosselAutomatico(carousel) {
  const slides = carousel.querySelectorAll(".slide");
  let activeIndex = 0;
  let interval = null;

  const nextSlide = () => {
    slides[activeIndex].classList.remove("active");
    activeIndex = (activeIndex + 1) % slides.length;
    slides[activeIndex].classList.add("active");
  };

  carousel.addEventListener("mouseenter", () => {
    interval = setInterval(nextSlide, 3000);
  });
  
  carousel.addEventListener("mouseleave", () => {
    clearInterval(interval);
    interval = null;
  });

  carousel.querySelector(".prev").addEventListener("click", (e) => {
    e.stopPropagation();
    slides[activeIndex].classList.remove("active");
    activeIndex = (activeIndex - 1 + slides.length) % slides.length;
    slides[activeIndex].classList.add("active");
  });

  carousel.querySelector(".next").addEventListener("click", (e) => {
    e.stopPropagation();
    slides[activeIndex].classList.remove("active");
    activeIndex = (activeIndex + 1) % slides.length;
    slides[activeIndex].classList.add("active");
  });
}

// ========== ADICIONAR AO CARRINHO (Teste 30) ==========
listaProdutos.addEventListener("click", async (e) => {
  const button = e.target.closest('.btn-add-carrinho');
  if (!button) return;
  
  // Teste 30: Exige login antes de adicionar ao carrinho
  if (!verificarLogin("adicionar produtos ao carrinho")) {
    return;
  }
  
  const produtoId = button.dataset.id;
  const inputQuantidade = document.getElementById(`quantidade-${produtoId}`);
  const quantidade = parseInt(inputQuantidade.value, 10);

  if (isNaN(quantidade) || quantidade <= 0) {
    alert("⚠️ Por favor, insira uma quantidade válida.");
    inputQuantidade.focus();
    return;
  }

  // Desabilita botão durante processamento
  button.disabled = true;
  button.textContent = '⏳ Adicionando...';

  try {
    await runTransaction(db, async (transaction) => {
      const produtoRef = doc(db, "produtos", produtoId);
      const sfDoc = await transaction.get(produtoRef);

      if (!sfDoc.exists()) throw "Produto não encontrado!";
      
      const estoqueAtual = sfDoc.data().quantidade;
      
      if (quantidade > estoqueAtual) {
        throw `Estoque insuficiente! Disponível: ${estoqueAtual}`;
      }

      const novaQuantidade = estoqueAtual - quantidade;
      transaction.update(produtoRef, { quantidade: novaQuantidade });
    });

    // Atualiza carrinho
    carrinho[produtoId] = (carrinho[produtoId] || 0) + quantidade;
    salvarCarrinho();
    atualizarResumoCarrinho();
    
    // Feedback visual
    button.textContent = '✅ Adicionado!';
    button.style.backgroundColor = 'var(--color-success)';
    
    setTimeout(() => {
      button.textContent = '🛒 Adicionar ao Carrinho';
      button.style.backgroundColor = '';
    }, 1500);
    
  } catch (error) {
    console.error("Erro ao adicionar ao carrinho:", error);
    alert(`❌ Não foi possível adicionar o item: ${error}`);
  } finally {
    button.disabled = false;
  }
});

// ========== REMOVER DO CARRINHO ==========
listaCarrinho.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-remover")) return;

  const produtoId = e.target.dataset.id;
  const inputQuantidade = e.target.parentElement.querySelector(".quantidade-carrinho");
  const quantidadeParaRemover = parseInt(inputQuantidade.value, 10);

  if (isNaN(quantidadeParaRemover) || quantidadeParaRemover <= 0) {
    alert("⚠️ Por favor, insira uma quantidade válida para remover.");
    inputQuantidade.focus();
    return;
  }

  const quantidadeNoCarrinho = carrinho[produtoId];
  if (quantidadeParaRemover > quantidadeNoCarrinho) {
    alert(`⚠️ Você não pode remover mais do que possui no carrinho (${quantidadeNoCarrinho}).`);
    return;
  }

  e.target.disabled = true;

  try {
    await runTransaction(db, async (transaction) => {
      const produtoRef = doc(db, "produtos", produtoId);
      const sfDoc = await transaction.get(produtoRef);
      if (!sfDoc.exists()) throw "Produto não encontrado!";

      const estoqueAtual = sfDoc.data().quantidade;
      const novaQuantidade = estoqueAtual + quantidadeParaRemover;
      transaction.update(produtoRef, { quantidade: novaQuantidade });
    });

    carrinho[produtoId] -= quantidadeParaRemover;
    if (carrinho[produtoId] <= 0) {
      delete carrinho[produtoId];
    }
    
    salvarCarrinho();
    atualizarResumoCarrinho();
  } catch (error) {
    console.error("Erro ao remover do carrinho:", error);
    alert(`❌ Não foi possível remover o item: ${error}`);
  } finally {
    e.target.disabled = false;
  }
});

// ========== RESUMO DO CARRINHO (Teste 36) ==========
function atualizarResumoCarrinho() {
  let contagem = 0;
  let total = 0;
  listaCarrinho.innerHTML = "";

  const carrinhoVazio = Object.keys(carrinho).length === 0;

  if (carrinhoVazio) {
    listaCarrinho.innerHTML = '<li style="text-align: center; color: var(--color-gray-600);">🛒 Carrinho vazio</li>';
    carrinhoContagem.textContent = '0';
    carrinhoTotal.textContent = '0.00';
    btnFinalizarCompra.disabled = true;
    return;
  }

  for (const produtoId in carrinho) {
    const quantidade = carrinho[produtoId];
    const produto = produtos.find((p) => p.id === produtoId);

    if (produto) {
      const item = document.createElement("li");
      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <span style="flex: 1;">
            <strong>${produto.nome}</strong><br>
            <small>R$ ${produto.preco.toFixed(2)} × ${quantidade}</small>
          </span>
          <div class="controles-carrinho" style="display: flex; gap: 5px; align-items: center;">
            <input type="number" class="quantidade-carrinho" value="1" min="1" max="${quantidade}" 
                   style="width: 60px; padding: 5px;" data-id="${produto.id}">
            <button class="btn-remover" data-id="${produto.id}" 
                    style="padding: 5px 10px; font-size: 0.9em;">
              🗑️ Remover
            </button>
          </div>
        </div>
      `;
      listaCarrinho.appendChild(item);
      contagem += quantidade;
      total += quantidade * produto.preco;
    }
  }

  carrinhoContagem.textContent = contagem;
  carrinhoTotal.textContent = total.toFixed(2);
  btnFinalizarCompra.disabled = false;
}

// ========== FINALIZAR COMPRA (Testes 30, 39) ==========
btnFinalizarCompra.addEventListener("click", async () => {
  // Teste 30: Verifica se está logado
  if (!verificarLogin("finalizar a compra")) {
    return;
  }

  if (Object.keys(carrinho).length === 0) {
    alert("⚠️ Seu carrinho está vazio!");
    return;
  }

  // Teste 39: Marca que está processando checkout
  processandoCheckout = true;

  // Verifica novamente se está logado (pode ter deslogado)
  if (!currentUser) {
    alert("❌ Sua sessão expirou. Por favor, faça login novamente.");
    processandoCheckout = false;
    abrirModal('login');
    return;
  }

  const confirmacao = confirm(
    `🛒 Finalizar compra?\n\n` +
    `Total de itens: ${carrinhoContagem.textContent}\n` +
    `Valor total: R$ ${carrinhoTotal.textContent}\n\n` +
    `Esta ação irá processar o pedido.`
  );

  if (!confirmacao) {
    processandoCheckout = false;
    return;
  }

  btnFinalizarCompra.disabled = true;
  btnFinalizarCompra.textContent = '⏳ Processando...';

  try {
    // Simula processamento de pagamento
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Verifica novamente se ainda está logado
    if (!currentUser) {
      throw new Error('Sessão expirou durante o processamento');
    }

    alert(
      `✅ Compra finalizada com sucesso!\n\n` +
      `Pedido registrado para: ${currentUser.email}\n` +
      `Total: R$ ${carrinhoTotal.textContent}\n\n` +
      `Obrigado pela preferência! 🎉`
    );
    
    limparCarrinho();
    processandoCheckout = false;
    
  } catch (error) {
    console.error('Erro ao finalizar compra:', error);
    alert(`❌ Erro ao finalizar compra: ${error.message}`);
    processandoCheckout = false;
  } finally {
    btnFinalizarCompra.disabled = false;
    btnFinalizarCompra.textContent = 'Finalizar Compra';
  }
});

// ========== PREVINE PERDA DE DADOS (Teste 36, 39) ==========
window.addEventListener('beforeunload', (e) => {
  salvarCarrinho();
  
  // Avisa se há itens no carrinho e está processando checkout
  if (processandoCheckout) {
    e.preventDefault();
    e.returnValue = '⚠️ Você está finalizando uma compra. Tem certeza que deseja sair?';
    return e.returnValue;
  }
  
  // Avisa se há itens no carrinho
  if (Object.keys(carrinho).length > 0) {
    e.preventDefault();
    e.returnValue = '⚠️ Você tem itens no carrinho. Deseja realmente sair?';
    return e.returnValue;
  }
});

// ========== PESQUISA DE PRODUTOS ==========
const inputPesquisaLoja = document.getElementById("pesquisaLoja");
if (inputPesquisaLoja) {
  inputPesquisaLoja.addEventListener("input", () => {
    const termo = inputPesquisaLoja.value.toLowerCase();
    const cards = document.querySelectorAll(".produto-card");
    
    cards.forEach(card => {
      const nome = card.querySelector("h3")?.textContent.toLowerCase() || "";
      const comentario = card.querySelector(".comentario")?.textContent.toLowerCase() || "";
      
      const match = nome.includes(termo) || comentario.includes(termo);
      card.style.display = match ? "" : "none";
    });
  });
}

// ========== INICIALIZAÇÃO ==========
console.log('🏪 Iniciando loja...');
carregarProdutos();
console.log('✅ Loja inicializada');