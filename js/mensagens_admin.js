// ============================================
// MENSAGENS ADMIN - FORÇAR SERVIDOR DIRETO
// ============================================
// Esta versão FORÇA busca DIRETO no servidor
// Ignora completamente o cache offline
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs,
  getDocsFromServer,  // ← NOVO: Força servidor
  query,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
  disableNetwork,
  enableNetwork
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ============================================
// CONFIGURAÇÃO FIREBASE
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyCBMASTLnc-YVN6AVQrfDm52P-IGtQe94zQ",
  authDomain: "lanchonetetestedesistemas.firebaseapp.com",
  projectId: "lanchonetetestedesistemas",
  storageBucket: "lanchonetetestedesistemas.firebasestorage.app",
  messagingSenderId: "983784344399",
  appId: "1:983784344399:web:b2f6034e939f3dffcc533a"
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

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 mensagens_admin.js SERVIDOR DIRETO');
console.log('⚠️  Cache offline IGNORADO');
console.log('⚠️  Todas as queries vão DIRETO ao servidor');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// ============================================
// CARREGAR FEEDBACKS - SERVIDOR DIRETO
// ============================================
async function carregarFeedbacks() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 carregarFeedbacks() SERVIDOR DIRETO');
  console.log('⏰ Timestamp:', new Date().toISOString());
  
  const loadingDiv = document.getElementById('loadingFeedbacks');
  const containerDiv = document.getElementById('feedbacksContainer');
  const emptyDiv = document.getElementById('emptyState');

  try {
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (containerDiv) containerDiv.innerHTML = '';
    if (emptyDiv) emptyDiv.style.display = 'none';

    console.log('🔥 Conectando ao Firestore...');
    console.log('📦 Database:', db ? 'CONECTADO' : 'ERRO');
    console.log('📦 Projeto:', db._databaseId?.projectId);
    
    const feedbacksRef = collection(db, 'feedbacks');
    console.log('📁 Coleção: feedbacks');
    console.log('');

    // ============================================
    // MÉTODO 1: SEM orderBy, DIRETO DO SERVIDOR
    // ============================================
    console.log('🔷 MÉTODO 1: getDocsFromServer (SEM cache)');
    
    try {
      console.log('   ⏳ Executando getDocsFromServer()...');
      const snapshot1 = await getDocsFromServer(feedbacksRef);
      
      console.log(`   📊 Documentos: ${snapshot1.size}`);
      console.log(`   📍 Vazio?: ${snapshot1.empty}`);
      console.log(`   📍 Fonte: ${snapshot1.metadata.fromCache ? 'CACHE ❌' : 'SERVIDOR ✅'}`);
      
      if (snapshot1.size > 0) {
        console.log('   ✅ SUCESSO! Documentos encontrados!');
        
        feedbacksAtuais = [];
        snapshot1.forEach((doc) => {
          console.log(`   📄 Doc ID: ${doc.id}`);
          feedbacksAtuais.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Ordenar manualmente por timestamp
        feedbacksAtuais.sort((a, b) => {
          const timeA = a.timestamp?.toMillis() || 0;
          const timeB = b.timestamp?.toMillis() || 0;
          return timeB - timeA;
        });
        
        console.log(`   ✅ ${feedbacksAtuais.length} feedbacks carregados`);
        
        atualizarEstatisticas();
        exibirFeedbacks();
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
      }
    } catch (error1) {
      console.error('   ❌ Método 1 falhou:', error1.code, error1.message);
    }

    // ============================================
    // MÉTODO 2: COM orderBy, DIRETO DO SERVIDOR
    // ============================================
    console.log('');
    console.log('🔶 MÉTODO 2: getDocsFromServer COM orderBy');
    
    try {
      const q = query(feedbacksRef, orderBy('timestamp', 'desc'));
      console.log('   ⏳ Executando query com orderBy...');
      
      const snapshot2 = await getDocsFromServer(q);
      
      console.log(`   📊 Documentos: ${snapshot2.size}`);
      console.log(`   📍 Vazio?: ${snapshot2.empty}`);
      console.log(`   📍 Fonte: ${snapshot2.metadata.fromCache ? 'CACHE ❌' : 'SERVIDOR ✅'}`);
      
      if (snapshot2.size > 0) {
        console.log('   ✅ SUCESSO! Documentos encontrados!');
        
        feedbacksAtuais = [];
        snapshot2.forEach((doc) => {
          console.log(`   📄 Doc ID: ${doc.id}`);
          feedbacksAtuais.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        console.log(`   ✅ ${feedbacksAtuais.length} feedbacks carregados`);
        
        atualizarEstatisticas();
        exibirFeedbacks();
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        return;
      }
    } catch (error2) {
      console.error('   ❌ Método 2 falhou:', error2.code, error2.message);
      
      if (error2.code === 'failed-precondition') {
        console.error('   ⚠️ FALTA CRIAR ÍNDICE no Firestore!');
        console.error('   👉 Crie índice: timestamp (desc)');
      }
    }

    // ============================================
    // MÉTODO 3: getDocs normal (fallback)
    // ============================================
    console.log('');
    console.log('🔸 MÉTODO 3: getDocs normal (pode usar cache)');
    
    try {
      console.log('   ⏳ Executando getDocs()...');
      const snapshot3 = await getDocs(feedbacksRef);
      
      console.log(`   📊 Documentos: ${snapshot3.size}`);
      console.log(`   📍 Vazio?: ${snapshot3.empty}`);
      console.log(`   📍 Fonte: ${snapshot3.metadata.fromCache ? 'CACHE ⚠️' : 'SERVIDOR ✅'}`);
      
      if (snapshot3.size > 0) {
        feedbacksAtuais = [];
        snapshot3.forEach((doc) => {
          feedbacksAtuais.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        // Ordenar manualmente
        feedbacksAtuais.sort((a, b) => {
          const timeA = a.timestamp?.toMillis() || 0;
          const timeB = b.timestamp?.toMillis() || 0;
          return timeB - timeA;
        });
        
        console.log(`   ✅ ${feedbacksAtuais.length} feedbacks carregados`);
      } else {
        console.log('   ❌ Nenhum documento encontrado');
      }
    } catch (error3) {
      console.error('   ❌ Método 3 falhou:', error3.code, error3.message);
    }

    atualizarEstatisticas();
    exibirFeedbacks();
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERRO CRÍTICO!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('📝 Mensagem:', error.message);
    console.error('🔗 Código:', error.code);
    console.error('📦 Stack:', error.stack);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    mostrarNotificacao('❌ Erro ao carregar feedbacks. Veja console (F12)', 'error');
    
  } finally {
    if (loadingDiv) loadingDiv.style.display = 'none';
  }
}

// ============================================
// EXIBIR FEEDBACKS
// ============================================
function exibirFeedbacks() {
  console.log('🎨 exibirFeedbacks()');
  
  const containerDiv = document.getElementById('feedbacksContainer');
  const emptyDiv = document.getElementById('emptyState');

  if (!containerDiv || !emptyDiv) {
    console.error('❌ Elementos DOM não encontrados!');
    return;
  }

  let feedbacksFiltrados = feedbacksAtuais;
  
  if (filtroAtual === 'novos') {
    feedbacksFiltrados = feedbacksAtuais.filter(f => f.status === 'novo');
  } else if (filtroAtual === 'lidos') {
    feedbacksFiltrados = feedbacksAtuais.filter(f => f.status === 'lido');
  }

  console.log(`📊 Total: ${feedbacksAtuais.length}`);
  console.log(`📊 Filtrados: ${feedbacksFiltrados.length}`);

  if (feedbacksFiltrados.length === 0) {
    containerDiv.innerHTML = '';
    emptyDiv.style.display = 'block';
    console.log('📭 Mostrando estado vazio');
    return;
  }

  emptyDiv.style.display = 'none';

  containerDiv.innerHTML = feedbacksFiltrados.map(feedback => {
    const data = feedback.timestamp ? 
      formatarData(feedback.timestamp.toDate()) : 
      'Data não disponível';
    const isNovo = feedback.status === 'novo';

    return `
      <div class="feedback-card ${isNovo ? 'novo' : 'lido'}">
        <div class="feedback-header">
          <div class="feedback-user-info">
            <div class="feedback-avatar">
              ${feedback.userName ? feedback.userName.charAt(0).toUpperCase() : '?'}
            </div>
            <div class="feedback-user-details">
              <h3>${escapeHtml(feedback.userName || 'Anônimo')}</h3>
              <p>✉️ ${escapeHtml(feedback.userEmail || 'N/A')}</p>
            </div>
          </div>
          <div class="feedback-status-badge ${feedback.status}">
            ${isNovo ? '🔵 Novo' : '✅ Lido'}
          </div>
        </div>
        <div class="feedback-body">
          <p>${escapeHtml(feedback.mensagem || '')}</p>
        </div>
        <div class="feedback-footer">
          <span>🕒 ${data}</span>
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
  
  console.log(`✅ ${feedbacksFiltrados.length} feedbacks renderizados`);
}

// ============================================
// ATUALIZAR ESTATÍSTICAS
// ============================================
function atualizarEstatisticas() {
  const total = feedbacksAtuais.length;
  const novos = feedbacksAtuais.filter(f => f.status === 'novo').length;
  const lidos = feedbacksAtuais.filter(f => f.status === 'lido').length;

  const totalEl = document.getElementById('totalFeedbacks');
  const novosEl = document.getElementById('novosFeedbacks');
  const lidosEl = document.getElementById('lidosFeedbacks');

  if (totalEl) totalEl.textContent = total;
  if (novosEl) novosEl.textContent = novos;
  if (lidosEl) lidosEl.textContent = lidos;
  
  console.log('📊 Estatísticas:', { total, novos, lidos });
}

// ============================================
// MARCAR COMO LIDO
// ============================================
window.marcarComoLido = async function(id) {
  try {
    const ref = doc(db, 'feedbacks', id);
    await updateDoc(ref, { 
      status: 'lido', 
      lidoEm: Timestamp.now() 
    });
    
    const feedback = feedbacksAtuais.find(f => f.id === id);
    if (feedback) feedback.status = 'lido';
    
    exibirFeedbacks();
    atualizarEstatisticas();
    mostrarNotificacao('✅ Marcado como lido', 'success');
  } catch (error) {
    console.error('Erro ao marcar como lido:', error);
    mostrarNotificacao('❌ Erro ao atualizar', 'error');
  }
};

// ============================================
// MARCAR COMO NOVO
// ============================================
window.marcarComoNovo = async function(id) {
  try {
    const ref = doc(db, 'feedbacks', id);
    await updateDoc(ref, { status: 'novo' });
    
    const feedback = feedbacksAtuais.find(f => f.id === id);
    if (feedback) feedback.status = 'novo';
    
    exibirFeedbacks();
    atualizarEstatisticas();
    mostrarNotificacao('✅ Marcado como novo', 'success');
  } catch (error) {
    console.error('Erro ao marcar como novo:', error);
    mostrarNotificacao('❌ Erro ao atualizar', 'error');
  }
};

// ============================================
// CONFIRMAR EXCLUSÃO
// ============================================
window.confirmarExclusao = function(id) {
  const feedback = feedbacksAtuais.find(f => f.id === id);
  if (!feedback) return;
  
  if (confirm(`Excluir feedback de "${feedback.userName}"?`)) {
    excluirFeedback(id);
  }
};

async function excluirFeedback(id) {
  try {
    const ref = doc(db, 'feedbacks', id);
    await deleteDoc(ref);
    
    feedbacksAtuais = feedbacksAtuais.filter(f => f.id !== id);
    
    exibirFeedbacks();
    atualizarEstatisticas();
    mostrarNotificacao('✅ Excluído com sucesso', 'success');
  } catch (error) {
    console.error('Erro ao excluir:', error);
    mostrarNotificacao('❌ Erro ao excluir', 'error');
  }
}

// ============================================
// EXPORTAR CSV
// ============================================
window.exportarFeedbacks = function() {
  if (feedbacksAtuais.length === 0) {
    mostrarNotificacao('⚠️ Nenhum feedback para exportar', 'info');
    return;
  }

  const csv = [
    ['Data', 'Nome', 'Email', 'Mensagem', 'Status'],
    ...feedbacksAtuais.map(f => [
      f.timestamp ? f.timestamp.toDate().toLocaleString('pt-BR') : '',
      f.userName || '',
      f.userEmail || '',
      f.mensagem || '',
      f.status || ''
    ])
  ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `feedbacks_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  
  mostrarNotificacao('✅ CSV exportado!', 'success');
};

// ============================================
// UTILIDADES
// ============================================
function formatarData(data) {
  const diff = new Date() - data;
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  
  if (dias > 7) return data.toLocaleDateString('pt-BR');
  if (dias > 0) return `${dias} dia${dias > 1 ? 's' : ''} atrás`;
  if (horas > 0) return `${horas} hora${horas > 1 ? 's' : ''} atrás`;
  if (minutos > 0) return `${minutos} min atrás`;
  return 'Agora';
}

function escapeHtml(text) {
  if (!text) return '';
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

function mostrarNotificacao(msg, tipo = 'info') {
  const cores = { 
    'success': '#28a745', 
    'error': '#dc3545', 
    'info': '#8b5cf6' 
  };
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; top: 20px; right: 20px;
    background: ${cores[tipo]}; color: white;
    padding: 15px 25px; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000; font-weight: bold;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ============================================
// CONFIGURAR FILTROS
// ============================================
function configurarFiltros() {
  const botoesFiltro = document.querySelectorAll('[data-filtro]');
  
  botoesFiltro.forEach(botao => {
    botao.addEventListener('click', () => {
      filtroAtual = botao.dataset.filtro;
      
      botoesFiltro.forEach(b => b.classList.remove('ativo'));
      botao.classList.add('ativo');
      
      exibirFeedbacks();
    });
  });
}

// ============================================
// CONFIGURAR BUSCA
// ============================================
function configurarBusca() {
  const inputBusca = document.getElementById('buscaFeedback');
  
  if (inputBusca) {
    inputBusca.addEventListener('input', (e) => {
      const termo = e.target.value.toLowerCase();
      
      const cards = document.querySelectorAll('.feedback-card');
      cards.forEach(card => {
        const texto = card.textContent.toLowerCase();
        card.style.display = texto.includes(termo) ? 'block' : 'none';
      });
    });
  }
}

// ============================================
// CONFIGURAR BOTÃO ATUALIZAR
// ============================================
function configurarBotaoAtualizar() {
  const btnAtualizar = document.getElementById('btnAtualizar');
  
  if (btnAtualizar) {
    btnAtualizar.addEventListener('click', () => {
      console.log('🔄 Atualização manual solicitada');
      btnAtualizar.disabled = true;
      btnAtualizar.textContent = '⏳ Atualizando...';
      
      carregarFeedbacks().finally(() => {
        btnAtualizar.disabled = false;
        btnAtualizar.textContent = '🔄 Atualizar';
      });
    });
  }
}

// ============================================
// CONFIGURAR BOTÃO VOLTAR
// ============================================
function configurarBotaoVoltar() {
  const btnVoltar = document.getElementById('btnVoltar');
  
  if (btnVoltar) {
    btnVoltar.addEventListener('click', () => {
      window.location.href = 'pag_adm.html';
    });
  }
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Inicializando sistema...');
  
  setTimeout(() => {
    carregarFeedbacks();
    configurarFiltros();
    configurarBusca();
    configurarBotaoAtualizar();
    configurarBotaoVoltar();
    
    console.log('✅ Sistema inicializado');
  }, 500);
});