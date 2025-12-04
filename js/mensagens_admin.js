// ============================================
// MENSAGENS ADMIN - Sistema de Visualização de Feedbacks
// ============================================
// Arquivo: mensagens_admin.js
// Descrição: Gerencia visualização de feedbacks para admin
// Autor: Sistema de Papelaria
// Data: 04/12/2025

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth,
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBiguKTELhL6nJHyi52p7QkhG2BS_dpQJA",
  authDomain: "papelaria-f49d8.firebaseapp.com",
  projectId: "papelaria-f49d8",
  storageBucket: "papelaria-f49d8.firebasestorage.app",
  messagingSenderId: "309560032967",
  appId: "1:309560032967:web:b6bee43e2f57c1dd5f6c88"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let feedbacksAtuais = [];
let filtroAtual = 'todos';

// ============================================
// VERIFICAR AUTENTICAÇÃO
// ============================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Redirecionar para login se não estiver autenticado
    window.location.href = '../index.html';
    return;
  }

  // Verificar se é admin
  const logadoComo = localStorage.getItem("logado");
  if (logadoComo !== "admin") {
    alert("Acesso negado! Apenas administradores podem acessar esta página.");
    window.location.href = '../index.html';
    return;
  }

  console.log('✅ Admin autenticado:', user.email);
  
  // Carregar feedbacks
  await carregarFeedbacks();
  
  // Configurar listeners em tempo real
  configurarListenersTempoReal();
});

// ============================================
// CARREGAR FEEDBACKS
// ============================================
async function carregarFeedbacks() {
  const loadingDiv = document.getElementById('loadingFeedbacks');
  const containerDiv = document.getElementById('feedbacksContainer');
  const emptyDiv = document.getElementById('emptyState');

  try {
    loadingDiv.style.display = 'block';
    containerDiv.innerHTML = '';
    emptyDiv.style.display = 'none';

    // Buscar feedbacks ordenados por data (mais recente primeiro)
    const feedbacksRef = collection(db, 'feedbacks');
    const q = query(feedbacksRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    feedbacksAtuais = [];
    snapshot.forEach((doc) => {
      feedbacksAtuais.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`📊 Total de feedbacks: ${feedbacksAtuais.length}`);

    // Atualizar estatísticas
    atualizarEstatisticas();

    // Exibir feedbacks
    exibirFeedbacks();

  } catch (error) {
    console.error('❌ Erro ao carregar feedbacks:', error);
    mostrarNotificacao('Erro ao carregar feedbacks', 'error');
  } finally {
    loadingDiv.style.display = 'none';
  }
}

// ============================================
// EXIBIR FEEDBACKS
// ============================================
function exibirFeedbacks() {
  const containerDiv = document.getElementById('feedbacksContainer');
  const emptyDiv = document.getElementById('emptyState');

  // Filtrar feedbacks
  let feedbacksFiltrados = feedbacksAtuais;
  
  if (filtroAtual === 'novos') {
    feedbacksFiltrados = feedbacksAtuais.filter(f => f.status === 'novo');
  } else if (filtroAtual === 'lidos') {
    feedbacksFiltrados = feedbacksAtuais.filter(f => f.status === 'lido');
  }

  // Verificar se há feedbacks
  if (feedbacksFiltrados.length === 0) {
    containerDiv.innerHTML = '';
    emptyDiv.style.display = 'block';
    return;
  }

  emptyDiv.style.display = 'none';

  // Renderizar cada feedback
  containerDiv.innerHTML = feedbacksFiltrados.map(feedback => {
    const data = feedback.timestamp ? 
      formatarData(feedback.timestamp.toDate()) : 
      'Data não disponível';

    const isNovo = feedback.status === 'novo';

    return `
      <div class="feedback-card ${isNovo ? 'novo' : 'lido'}" data-id="${feedback.id}">
        <div class="feedback-header">
          <div class="feedback-user-info">
            <div class="feedback-avatar">
              ${feedback.userName ? feedback.userName.charAt(0).toUpperCase() : '?'}
            </div>
            <div class="feedback-user-details">
              <h3 class="feedback-user-name">${feedback.userName || 'Usuário Anônimo'}</h3>
              <p class="feedback-user-email">
                ✉️ ${feedback.userEmail || 'Email não disponível'}
              </p>
            </div>
          </div>
          
          <div class="feedback-status-badge ${feedback.status}">
            ${isNovo ? '🔵 Novo' : '✅ Lido'}
          </div>
        </div>

        <div class="feedback-body">
          <p class="feedback-mensagem">${escapeHtml(feedback.mensagem)}</p>
        </div>

        <div class="feedback-footer">
          <span class="feedback-data">
            🕒 ${data}
          </span>
          
          <div class="feedback-actions">
            ${isNovo ? `
              <button class="btn-marcar-lido" onclick="marcarComoLido('${feedback.id}')">
                ✓ Marcar como lido
              </button>
            ` : `
              <button class="btn-marcar-novo" onclick="marcarComoNovo('${feedback.id}')">
                ↻ Marcar como novo
              </button>
            `}
            <button class="btn-excluir" onclick="confirmarExclusao('${feedback.id}')">
              🗑️ Excluir
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  console.log(`✅ ${feedbacksFiltrados.length} feedbacks exibidos`);
}

// ============================================
// ATUALIZAR ESTATÍSTICAS
// ============================================
function atualizarEstatisticas() {
  const totalFeedbacks = feedbacksAtuais.length;
  const novos = feedbacksAtuais.filter(f => f.status === 'novo').length;
  const lidos = feedbacksAtuais.filter(f => f.status === 'lido').length;

  document.getElementById('totalFeedbacks').textContent = totalFeedbacks;
  document.getElementById('novosFeedbacks').textContent = novos;
  document.getElementById('lidosFeedbacks').textContent = lidos;

  // Atualizar badge no botão filtro "novos"
  const btnNovos = document.querySelector('[data-filtro="novos"]');
  if (btnNovos && novos > 0) {
    btnNovos.innerHTML = `🔵 Novos <span class="badge">${novos}</span>`;
  }
}

// ============================================
// MARCAR COMO LIDO
// ============================================
window.marcarComoLido = async function(feedbackId) {
  try {
    const feedbackRef = doc(db, 'feedbacks', feedbackId);
    await updateDoc(feedbackRef, {
      status: 'lido'
    });

    // Atualizar localmente
    const feedback = feedbacksAtuais.find(f => f.id === feedbackId);
    if (feedback) {
      feedback.status = 'lido';
    }

    exibirFeedbacks();
    atualizarEstatisticas();
    mostrarNotificacao('Feedback marcado como lido', 'success');

    console.log('✅ Feedback marcado como lido:', feedbackId);

  } catch (error) {
    console.error('❌ Erro ao marcar como lido:', error);
    mostrarNotificacao('Erro ao atualizar feedback', 'error');
  }
};

// ============================================
// MARCAR COMO NOVO
// ============================================
window.marcarComoNovo = async function(feedbackId) {
  try {
    const feedbackRef = doc(db, 'feedbacks', feedbackId);
    await updateDoc(feedbackRef, {
      status: 'novo'
    });

    // Atualizar localmente
    const feedback = feedbacksAtuais.find(f => f.id === feedbackId);
    if (feedback) {
      feedback.status = 'novo';
    }

    exibirFeedbacks();
    atualizarEstatisticas();
    mostrarNotificacao('Feedback marcado como novo', 'success');

    console.log('✅ Feedback marcado como novo:', feedbackId);

  } catch (error) {
    console.error('❌ Erro ao marcar como novo:', error);
    mostrarNotificacao('Erro ao atualizar feedback', 'error');
  }
};

// ============================================
// CONFIRMAR EXCLUSÃO
// ============================================
window.confirmarExclusao = function(feedbackId) {
  const feedback = feedbacksAtuais.find(f => f.id === feedbackId);
  
  if (!feedback) return;

  const confirmacao = confirm(
    `Tem certeza que deseja excluir o feedback de "${feedback.userName}"?\n\nEsta ação não pode ser desfeita.`
  );

  if (confirmacao) {
    excluirFeedback(feedbackId);
  }
};

// ============================================
// EXCLUIR FEEDBACK
// ============================================
async function excluirFeedback(feedbackId) {
  try {
    const feedbackRef = doc(db, 'feedbacks', feedbackId);
    await deleteDoc(feedbackRef);

    // Remover localmente
    feedbacksAtuais = feedbacksAtuais.filter(f => f.id !== feedbackId);

    exibirFeedbacks();
    atualizarEstatisticas();
    mostrarNotificacao('Feedback excluído com sucesso', 'success');

    console.log('✅ Feedback excluído:', feedbackId);

  } catch (error) {
    console.error('❌ Erro ao excluir feedback:', error);
    mostrarNotificacao('Erro ao excluir feedback', 'error');
  }
}

// ============================================
// CONFIGURAR FILTROS
// ============================================
function configurarFiltros() {
  const botoesFiltro = document.querySelectorAll('[data-filtro]');

  botoesFiltro.forEach(botao => {
    botao.addEventListener('click', () => {
      // Remover classe ativa de todos
      botoesFiltro.forEach(b => b.classList.remove('active'));
      
      // Adicionar classe ativa ao clicado
      botao.classList.add('active');

      // Atualizar filtro
      filtroAtual = botao.dataset.filtro;

      // Exibir feedbacks filtrados
      exibirFeedbacks();

      console.log('📊 Filtro aplicado:', filtroAtual);
    });
  });
}

// ============================================
// CONFIGURAR LISTENERS EM TEMPO REAL
// ============================================
function configurarListenersTempoReal() {
  const feedbacksRef = collection(db, 'feedbacks');
  const q = query(feedbacksRef, orderBy('timestamp', 'desc'));

  // Escutar mudanças em tempo real
  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added' && feedbacksAtuais.length > 0) {
        // Novo feedback adicionado
        console.log('🆕 Novo feedback recebido!');
        mostrarNotificacao('Novo feedback recebido!', 'info');
        
        // Recarregar feedbacks
        carregarFeedbacks();
      }
    });
  });
}

// ============================================
// BUSCAR FEEDBACKS
// ============================================
function configurarBusca() {
  const inputBusca = document.getElementById('buscaFeedback');

  inputBusca.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase().trim();

    if (!termo) {
      exibirFeedbacks();
      return;
    }

    const containerDiv = document.getElementById('feedbacksContainer');
    const feedbackCards = containerDiv.querySelectorAll('.feedback-card');

    let encontrados = 0;

    feedbackCards.forEach(card => {
      const nome = card.querySelector('.feedback-user-name').textContent.toLowerCase();
      const email = card.querySelector('.feedback-user-email').textContent.toLowerCase();
      const mensagem = card.querySelector('.feedback-mensagem').textContent.toLowerCase();

      if (nome.includes(termo) || email.includes(termo) || mensagem.includes(termo)) {
        card.style.display = 'block';
        encontrados++;
      } else {
        card.style.display = 'none';
      }
    });

    console.log(`🔍 Busca: "${termo}" - ${encontrados} resultados`);
  });
}

// ============================================
// ATUALIZAR PÁGINA
// ============================================
function configurarAtualizacao() {
  const btnAtualizar = document.getElementById('btnAtualizar');

  btnAtualizar.addEventListener('click', async () => {
    btnAtualizar.disabled = true;
    btnAtualizar.innerHTML = '↻ Atualizando...';

    await carregarFeedbacks();

    setTimeout(() => {
      btnAtualizar.disabled = false;
      btnAtualizar.innerHTML = '🔄 Atualizar';
    }, 1000);
  });
}

// ============================================
// SAIR
// ============================================
function configurarSair() {
  const btnSair = document.getElementById('btnVoltar');

  btnSair.addEventListener('click', () => {
    window.location.href = 'pag_adm.html';
  });
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

// Formatar data
function formatarData(data) {
  const agora = new Date();
  const diff = agora - data;
  const segundos = Math.floor(diff / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (dias > 7) {
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } else if (dias > 0) {
    return `${dias} dia${dias > 1 ? 's' : ''} atrás`;
  } else if (horas > 0) {
    return `${horas} hora${horas > 1 ? 's' : ''} atrás`;
  } else if (minutos > 0) {
    return `${minutos} minuto${minutos > 1 ? 's' : ''} atrás`;
  } else {
    return 'Agora mesmo';
  }
}

// Escapar HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Mostrar notificação
function mostrarNotificacao(mensagem, tipo = 'info') {
  // Remover notificação existente
  const existente = document.querySelector('.notificacao-toast');
  if (existente) {
    existente.remove();
  }

  // Criar notificação
  const toast = document.createElement('div');
  toast.className = `notificacao-toast ${tipo}`;
  
  const icones = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };

  toast.innerHTML = `
    <span class="toast-icon">${icones[tipo] || icones.info}</span>
    <span class="toast-mensagem">${mensagem}</span>
  `;

  document.body.appendChild(toast);

  // Animar entrada
  setTimeout(() => toast.classList.add('show'), 10);

  // Remover após 3 segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Sistema de Mensagens Admin inicializado');

  // Configurar funcionalidades
  configurarFiltros();
  configurarBusca();
  configurarAtualizacao();
  configurarSair();
});