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

const STORAGE_KEY = 'carrinho_papelaria';

function salvarCarrinho() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      itens: carrinho,
      timestamp: new Date().getTime(),
      userId: currentUser ? currentUser.uid : null
    }));
    console.log('✅ Carrinho salvo:', carrinho);
  } catch (e) {
    console.error("❌ Erro ao salvar carrinho:", e);
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
    
    const agora = new Date().getTime();
    const umDia = 24 * 60 * 60 * 1000;
    
    if (agora - timestamp > umDia) {
      console.log('⏰ Carrinho expirado, limpando...');
      limparCarrinho();
      return;
    }
    
    if (currentUser && userId && userId !== currentUser.uid) {
      console.log('👤 Carrinho de outro usuário, limpando...');
      limparCarrinho();
      return;
    }
    
    carrinho = itens || {};
    console.log('✅ Carrinho carregado:', carrinho);
    atualizarResumoCarrinho();
  } catch (e) {
    console.error("❌ Erro ao carregar carrinho:", e);
    carrinho = {};
  }
}

function limparCarrinho() {
  carrinho = {};
  localStorage.removeItem(STORAGE_KEY);
  atualizarResumoCarrinho();
  console.log('🗑️ Carrinho limpo');
}

window.addEventListener('DOMContentLoaded', () => {
  carregarCarrinho();
});

window.addEventListener('beforeunload', (e) => {
  salvarCarrinho();
  
  if (processandoCheckout) {
    e.preventDefault();
    e.returnValue = '⚠️ Você está finalizando uma compra. Tem certeza que deseja sair?';
    return e.returnValue;
  }
  
  if (Object.keys(carrinho).length > 0) {
    e.preventDefault();
    e.returnValue = '⚠️ Você tem itens no carrinho. Deseja realmente sair?';
    return e.returnValue;
  }
});

function atualizarUIAutenticacao() {
  const authLinks = document.querySelector('.auth-links');
  if (!authLinks) return;

  if (currentUser) {
    const emailDisplay = currentUser.email.length > 25 
      ? currentUser.email.substring(0, 25) + '...' 
      : currentUser.email;
      
    authLinks.innerHTML = `
      <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
        <span style="color: var(--color-secondary); font-weight: 600; display: flex; align-items: center; gap: 5px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          ${emailDisplay}
        </span>
        <a href="#" id="btnLogout" class="link-animated" 
           style="color: var(--color-danger); font-weight: 500; display: flex; align-items: center; gap: 5px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sair
        </a>
      </div>
    `;
    
    document.getElementById('btnLogout')?.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (processandoCheckout) {
        if (!confirm('⚠️ Você está no meio de uma compra. Deseja realmente sair?')) {
          return;
        }
      }
      
      if (Object.keys(carrinho).length > 0) {
        if (!confirm('⚠️ Você tem itens no carrinho. Ao sair, o carrinho será limpo. Deseja continuar?')) {
          return;
        }
      }
      
      auth.signOut().then(() => {
        limparCarrinho();
        mostrarNotificacao('👋 Você foi desconectado com sucesso.', 'info');
        setTimeout(() => window.location.reload(), 1000);
      });
    });
  } else {
    authLinks.innerHTML = `
      <a href="#" id="btnAbrirLogin" class="link-animated" 
         style="display: flex; align-items: center; gap: 5px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
          <polyline points="10 17 15 12 10 7"/>
          <line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        Login
      </a>
      <a href="#" id="btnAbrirCadastro" class="link-animated"
         style="display: flex; align-items: center; gap: 5px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="8.5" cy="7" r="4"/>
          <line x1="20" y1="8" x2="20" y2="14"/>
          <line x1="23" y1="11" x2="17" y2="11"/>
        </svg>
        Cadastro
      </a>
    `;
    
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

function mostrarNotificacao(mensagem, tipo = 'info') {
  const notificacoesAnteriores = document.querySelectorAll('.notificacao-toast');
  notificacoesAnteriores.forEach(n => n.remove());
  
  const cores = {
    'success': 'var(--color-success)',
    'error': 'var(--color-danger)',
    'warning': 'var(--color-warning)',
    'info': 'var(--color-primary)'
  };
  
  const notificacao = document.createElement('div');
  notificacao.className = 'notificacao-toast';
  notificacao.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${cores[tipo] || cores.info};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideInRight 0.3s ease-out;
    max-width: 400px;
    font-weight: 500;
  `;
  notificacao.textContent = mensagem;
  
  document.body.appendChild(notificacao);
  
  setTimeout(() => {
    notificacao.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notificacao.remove(), 300);
  }, 3000);
}

if (!document.getElementById('toast-animations')) {
  const style = document.createElement('style');
  style.id = 'toast-animations';
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

onAuthStateChanged(auth, (user) => {
  const usuarioAnterior = currentUser;
  currentUser = user;
  
  console.log("🔐 Status de autenticação:", user ? `Logado: ${user.email}` : "Não logado");
  

  if (usuarioAnterior && !user) {
    console.log('👋 Usuário deslogou');
    
    if (processandoCheckout) {
      mostrarNotificacao('⚠️ Você foi desconectado. Por favor, faça login novamente.', 'warning');
      processandoCheckout = false;
    }
    
    limparCarrinho();
    
    if (Object.keys(carrinho).length > 0) {
      abrirModal('login');
    }
  }
  
  if (user && !usuarioAnterior) {
    mostrarNotificacao(`✅ Bem-vindo(a), ${user.email}!`, 'success');
    carregarCarrinho();
  }
  
  atualizarUIAutenticacao();
});

function verificarLogin(acao = "realizar esta ação") {
  if (!currentUser) {
    mostrarNotificacao(`⚠️ Você precisa fazer login para ${acao}!`, 'warning');
    abrirModal('login');
    return false;
  }
  return true;
}

function abrirModal(tab = 'login') {
  if (!modalAuth) {
    console.error('❌ Modal de autenticação não encontrado');
    return;
  }
  
  modalAuth.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  const tabs = modalAuth.querySelectorAll('.tab-link');
  const contents = modalAuth.querySelectorAll('.tab-content');
  
  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  
  contents.forEach(c => {
    c.classList.toggle('active', c.id === tab);
  });
  
  setTimeout(() => {
    const input = modalAuth.querySelector('.tab-content.active input');
    if (input) input.focus();
  }, 100);
}

const inputPesquisaLoja = document.getElementById("pesquisaLoja");
if (inputPesquisaLoja) {
  console.log('🔍 Campo de pesquisa encontrado e inicializado');
  
  inputPesquisaLoja.addEventListener("input", function(e) {
    const termo = e.target.value.toLowerCase().trim();
    console.log('🔍 Pesquisando:', termo);
    
    const cards = document.querySelectorAll(".produto-card");
    let encontrados = 0;
    
    cards.forEach(card => {
      const nome = card.querySelector("h3")?.textContent.toLowerCase() || "";
      const comentario = card.querySelector(".comentario")?.textContent.toLowerCase() || "";
      const preco = card.querySelector(".preco")?.textContent.toLowerCase() || "";
      
      const match = nome.includes(termo) || comentario.includes(termo) || preco.includes(termo);
      
      if (match || termo === "") {
        card.style.display = "";
        encontrados++;
      } else {
        card.style.display = "none";
      }
    });
    
    if (termo !== "" && encontrados === 0) {
      if (!document.getElementById('mensagem-sem-resultados')) {
        const msg = document.createElement('p');
        msg.id = 'mensagem-sem-resultados';
        msg.style.cssText = 'text-align: center; color: var(--color-gray-600); padding: 20px; font-size: 1.2em;';
        msg.innerHTML = '🔍 Nenhum produto encontrado para "<strong>' + termo + '</strong>"';
        listaProdutos.appendChild(msg);
      }
    } else {
      document.getElementById('mensagem-sem-resultados')?.remove();
    }
    
    console.log(`✅ ${encontrados} produtos encontrados`);
  });
  
  inputPesquisaLoja.addEventListener("focus", function() {
    this.select();
  });
}

async function carregarProdutos() {
  const produtosRef = collection(db, "produtos");
  onSnapshot(produtosRef, (snapshot) => {
    listaProdutos.innerHTML = "";
    produtos = [];

    snapshot.forEach((docSnap) => {
      const produto = { id: docSnap.id, ...docSnap.data() };
      produtos.push(produto);

      const card = document.createElement("div");
      card.className = "produto-card fade-in";

      let imagens = [];
      
      if (Array.isArray(produto.imagens) && produto.imagens.length > 0) {
        imagens = produto.imagens.filter(img => img && typeof img === 'string' && img.trim());
      }
      
      if (imagens.length === 0) {
        if (produto.imagemDataUrl) imagens = [produto.imagemDataUrl];
        else if (produto.imagem) imagens = [produto.imagem];
        else imagens = ["/imagens/imagem_padrao.svg"];
      }

      let imagensHTML = "";
      if (imagens.length > 1) {
        imagensHTML = `
          <div class="carousel" data-produto="${produto.id}">
            ${imagens.map((img, i) => `
              <div class="slide ${i === 0 ? "active" : ""}">
                <img src="${img || '/imagens/imagem_padrao.svg'}" alt="${produto.nome}" class="carousel-img" onerror="this.src='/imagens/imagem_padrao.svg'">
              </div>`).join("")}
            <button class="prev" aria-label="Imagem anterior">&#10094;</button>
            <button class="next" aria-label="Próxima imagem">&#10095;</button>
          </div>
        `;
      } else if (imagens.length === 1) {
        imagensHTML = `<img src="${imagens[0] || '/imagens/imagem_padrao.svg'}" alt="${produto.nome}" class="single-img" onerror="this.src='/imagens/imagem_padrao.svg'"/>`;
      } else {
        imagensHTML = `<img src="/imagens/imagem_padrao.svg" alt="${produto.nome}" class="single-img"/>`;
      }

      if (produto.quantidade > 0) {
        card.innerHTML = `
          ${imagensHTML}
          <h3>${produto.nome}</h3>
          ${produto.comentario ? `<p class="comentario">${produto.comentario}</p>` : ""}
          <p class="preco">R$ ${parseFloat(produto.preco).toFixed(2)}</p>
          <p style="color: var(--color-gray-700);">📦 Estoque: ${produto.quantidade}</p>
          <div class="controles-compra" style="display: flex; gap: 10px; align-items: center;">
            <input type="number" id="quantidade-${produto.id}" value="1" min="1" max="${produto.quantidade}" 
                   aria-label="Quantidade" style="width: 60px; padding: 8px; border-radius: 5px;">
            <button data-id="${produto.id}" class="btn-add-carrinho" style="flex: 1;">
              🛒 Adicionar
            </button>
          </div>
        `;
      } else {
        card.classList.add("esgotado");
        card.innerHTML = `
          ${imagensHTML}
          <h3>${produto.nome}</h3>
          ${produto.comentario ? `<p class="comentario">${produto.comentario}</p>` : ""}
          <p class="preco">R$ ${parseFloat(produto.preco).toFixed(2)}</p>
          <p class="status-esgotado">❌ Esgotado</p>
          <button disabled class="btn-esgotado">Indisponível</button>
        `;
      }

      listaProdutos.appendChild(card);

      if (imagens.length > 1) iniciarCarrosselAutomatico(card.querySelector(".carousel"));
    });
    
    atualizarResumoCarrinho();
    console.log(`✅ ${produtos.length} produtos carregados`);
  });
}

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

listaProdutos.addEventListener("click", async (e) => {
  const button = e.target.closest('.btn-add-carrinho');
  if (!button) return;
  
  if (!verificarLogin("adicionar produtos ao carrinho")) {
    return;
  }
  
  const produtoId = button.dataset.id;
  const inputQuantidade = document.getElementById(`quantidade-${produtoId}`);
  const quantidade = parseInt(inputQuantidade.value, 10);

  if (isNaN(quantidade) || quantidade <= 0) {
    mostrarNotificacao("⚠️ Por favor, insira uma quantidade válida.", 'warning');
    inputQuantidade.focus();
    return;
  }

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

    carrinho[produtoId] = (carrinho[produtoId] || 0) + quantidade;
    salvarCarrinho();
    atualizarResumoCarrinho();
    
    button.textContent = '✅ Adicionado!';
    button.style.backgroundColor = 'var(--color-success)';
    
    const produto = produtos.find(p => p.id === produtoId);
    mostrarNotificacao(`✅ ${produto?.nome} adicionado ao carrinho!`, 'success');
    
    setTimeout(() => {
      button.textContent = '🛒 Adicionar';
      button.style.backgroundColor = '';
    }, 1500);
    
  } catch (error) {
    console.error("Erro ao adicionar ao carrinho:", error);
    mostrarNotificacao(`❌ ${error}`, 'error');
  } finally {
    button.disabled = false;
  }
});

listaCarrinho.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("btn-remover")) return;

  const produtoId = e.target.dataset.id;
  const inputQuantidade = e.target.parentElement.querySelector(".quantidade-carrinho");
  const quantidadeParaRemover = parseInt(inputQuantidade.value, 10);

  if (isNaN(quantidadeParaRemover) || quantidadeParaRemover <= 0) {
    mostrarNotificacao("⚠️ Quantidade inválida para remover.", 'warning');
    inputQuantidade.focus();
    return;
  }

  const quantidadeNoCarrinho = carrinho[produtoId];
  if (quantidadeParaRemover > quantidadeNoCarrinho) {
    mostrarNotificacao(`⚠️ Você só tem ${quantidadeNoCarrinho} unidade(s) no carrinho.`, 'warning');
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
    mostrarNotificacao('✅ Item removido do carrinho.', 'info');
  } catch (error) {
    console.error("Erro ao remover do carrinho:", error);
    mostrarNotificacao(`❌ Erro: ${error}`, 'error');
  } finally {
    e.target.disabled = false;
  }
});

function atualizarResumoCarrinho() {
  let contagem = 0;
  let total = 0;
  listaCarrinho.innerHTML = "";

  const carrinhoVazio = Object.keys(carrinho).length === 0;

  if (carrinhoVazio) {
    listaCarrinho.innerHTML = '<li style="text-align: center; color: var(--color-gray-600); padding: 15px;">🛒 Carrinho vazio</li>';
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
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 10px;">
          <span style="flex: 1;">
            <strong>${produto.nome}</strong><br>
            <small style="color: var(--color-gray-700);">R$ ${produto.preco.toFixed(2)} × ${quantidade}</small>
          </span>
          <div class="controles-carrinho" style="display: flex; gap: 5px; align-items: center;">
            <input type="number" class="quantidade-carrinho" value="1" min="1" max="${quantidade}" 
                   style="width: 50px; padding: 5px; border-radius: 4px;" data-id="${produto.id}">
            <button class="btn-remover" data-id="${produto.id}" 
                    style="padding: 5px 10px; font-size: 0.85em; white-space: nowrap;">
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

btnFinalizarCompra.addEventListener("click", async () => {
  if (!verificarLogin("finalizar a compra")) {
    return;
  }

  if (Object.keys(carrinho).length === 0) {
    mostrarNotificacao("⚠️ Seu carrinho está vazio!", 'warning');
    return;
  }

  processandoCheckout = true;

  if (!currentUser) {
    mostrarNotificacao("❌ Sua sessão expirou. Por favor, faça login novamente.", 'error');
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
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (!currentUser) {
      throw new Error('Sessão expirou durante o processamento');
    }

    mostrarNotificacao(
      `✅ Compra finalizada com sucesso! Obrigado pela preferência! 🎉`,
      'success'
    );
    
    alert(
      `✅ PEDIDO CONFIRMADO!\n\n` +
      `Cliente: ${currentUser.email}\n` +
      `Itens: ${carrinhoContagem.textContent}\n` +
      `Total: R$ ${carrinhoTotal.textContent}\n\n` +
      `Você receberá um e-mail com os detalhes do pedido.`
    );
    
    limparCarrinho();
    processandoCheckout = false;
    
  } catch (error) {
    console.error('Erro ao finalizar compra:', error);
    mostrarNotificacao(`❌ Erro: ${error.message}`, 'error');
    processandoCheckout = false;
  } finally {
    btnFinalizarCompra.disabled = false;
    btnFinalizarCompra.textContent = 'Finalizar Compra';
  }
});

console.log('🏪 Iniciando loja...');
carregarProdutos();
console.log('✅ Loja inicializada com todas as melhorias');