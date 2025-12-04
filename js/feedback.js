import { db, auth } from "./firebase-config.js";
import { 
  collection, 
  addDoc,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

let usuarioAtual = null;

function criarModalFeedback() {
  if (document.getElementById('feedbackModal')) {
    return;
  }

  const modalHTML = `
    <div id="feedbackModal" class="feedback-modal">
      <div class="feedback-modal-content">
        <div class="feedback-modal-header">
          <h2>Enviar Feedback</h2>
          <button class="feedback-close-btn" id="closeFeedbackModal">&times;</button>
        </div>
        
        <div class="feedback-modal-body">
          <p class="feedback-descricao">
            Sua opinião é muito importante! Conte-nos sobre sua experiência, sugestões ou problemas.
          </p>
          
          <div class="feedback-form-group">
            <label for="feedbackMensagem">Mensagem *</label>
            <textarea 
              id="feedbackMensagem" 
              placeholder="Escreva seu feedback aqui..."
              rows="6"
              maxlength="1000"
            ></textarea>
            <small id="feedbackContador" class="feedback-contador">0 / 1000 caracteres</small>
            <small class="feedback-hint">Mínimo de 10 caracteres</small>
          </div>
        </div>
        
        <div class="feedback-modal-footer">
          <button type="button" class="feedback-btn-cancelar" id="cancelarFeedback">
            Cancelar
          </button>
          <button type="button" class="feedback-btn-enviar" id="enviarFeedback">
            <span class="feedback-btn-text">Enviar Feedback</span>
            <span class="feedback-btn-loading" style="display: none;">
              <span class="spinner"></span> Enviando...
            </span>
          </button>
        </div>
        
        <div id="feedbackMensagemStatus" class="feedback-mensagem-status"></div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);

  adicionarEstilosFeedback();

  configurarEventListeners();
}

function adicionarEstilosFeedback() {
  if (document.getElementById('feedbackStyles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'feedbackStyles';
  style.textContent = `
    /* Modal de Feedback */
    .feedback-modal {
      display: none;
      position: fixed;
      z-index: 10000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(5px);
      animation: fadeIn 0.3s ease;
    }

    .feedback-modal.show {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .feedback-modal-content {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        transform: translateY(50px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .feedback-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 2px solid #f0f0f0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px 16px 0 0;
    }

    .feedback-modal-header h2 {
      margin: 0;
      color: white;
      font-size: 24px;
      font-weight: 600;
    }

    .feedback-close-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      font-size: 32px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      line-height: 1;
    }

    .feedback-close-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }

    .feedback-modal-body {
      padding: 24px;
    }

    .feedback-descricao {
      color: #666;
      margin-bottom: 20px;
      font-size: 15px;
      line-height: 1.6;
    }

    .feedback-form-group {
      margin-bottom: 20px;
    }

    .feedback-form-group label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 600;
      font-size: 14px;
    }

    .feedback-form-group textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-family: inherit;
      font-size: 14px;
      transition: all 0.3s ease;
      resize: vertical;
      min-height: 120px;
      box-sizing: border-box;
    }

    .feedback-form-group textarea:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .feedback-contador {
      display: block;
      text-align: right;
      color: #999;
      font-size: 12px;
      margin-top: 4px;
    }

    .feedback-contador.warning {
      color: #ff9800;
    }

    .feedback-contador.danger {
      color: #f44336;
    }

    .feedback-hint {
      display: block;
      color: #999;
      font-size: 12px;
      margin-top: 4px;
    }

    .feedback-modal-footer {
      display: flex;
      gap: 12px;
      padding: 24px;
      border-top: 2px solid #f0f0f0;
      justify-content: flex-end;
    }

    .feedback-btn-cancelar,
    .feedback-btn-enviar {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      font-family: inherit;
    }

    .feedback-btn-cancelar {
      background: #f5f5f5;
      color: #666;
    }

    .feedback-btn-cancelar:hover {
      background: #e0e0e0;
    }

    .feedback-btn-enviar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-width: 180px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .feedback-btn-enviar:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .feedback-btn-enviar:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .feedback-btn-loading {
      display: none;
      align-items: center;
      gap: 8px;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .feedback-mensagem-status {
      margin-top: 16px;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
      font-size: 14px;
      font-weight: 500;
      display: none;
    }

    .feedback-mensagem-status.success {
      background: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #a5d6a7;
      display: block;
    }

    .feedback-mensagem-status.error {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #ef9a9a;
      display: block;
    }

    /* Botão de Feedback Flutuante */
    .feedback-floating-btn {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .feedback-floating-btn:hover {
      transform: translateY(-4px) scale(1.05);
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
    }

    .feedback-floating-btn:active {
      transform: translateY(-2px) scale(1.02);
    }

    /* Responsivo */
    @media (max-width: 768px) {
      .feedback-modal-content {
        width: 95%;
        max-height: 95vh;
      }

      .feedback-modal-header h2 {
        font-size: 20px;
      }

      .feedback-modal-footer {
        flex-direction: column;
      }

      .feedback-btn-cancelar,
      .feedback-btn-enviar {
        width: 100%;
      }

      .feedback-floating-btn {
        bottom: 20px;
        right: 20px;
        width: 56px;
        height: 56px;
        font-size: 22px;
      }
    }
  `;

  document.head.appendChild(style);
}

function configurarEventListeners() {
  const modal = document.getElementById('feedbackModal');
  const btnFechar = document.getElementById('closeFeedbackModal');
  const btnCancelar = document.getElementById('cancelarFeedback');
  const btnEnviar = document.getElementById('enviarFeedback');
  const textarea = document.getElementById('feedbackMensagem');
  const contador = document.getElementById('feedbackContador');

  btnFechar.addEventListener('click', fecharModal);
  btnCancelar.addEventListener('click', fecharModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      fecharModal();
    }
  });

  textarea.addEventListener('input', () => {
    const length = textarea.value.length;
    contador.textContent = `${length} / 1000 caracteres`;

    contador.classList.remove('warning', 'danger');
    if (length > 900) {
      contador.classList.add('danger');
    } else if (length > 800) {
      contador.classList.add('warning');
    }
  });

  btnEnviar.addEventListener('click', enviarFeedback);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) {
      fecharModal();
    }
  });
}

function abrirModal() {
  const modal = document.getElementById('feedbackModal');
  const textarea = document.getElementById('feedbackMensagem');
  
  textarea.value = '';
  document.getElementById('feedbackContador').textContent = '0 / 1000 caracteres';
  document.getElementById('feedbackMensagemStatus').style.display = 'none';
  
  modal.classList.add('show');
  setTimeout(() => textarea.focus(), 300);
}

function fecharModal() {
  const modal = document.getElementById('feedbackModal');
  modal.classList.remove('show');
}

async function enviarFeedback() {
  const textarea = document.getElementById('feedbackMensagem');
  const mensagem = textarea.value.trim();
  const btnEnviar = document.getElementById('enviarFeedback');
  const statusDiv = document.getElementById('feedbackMensagemStatus');

  if (mensagem.length < 10) {
    mostrarMensagem('Por favor, escreva pelo menos 10 caracteres.', 'error');
    textarea.focus();
    return;
  }

  if (!usuarioAtual) {
    mostrarMensagem('Você precisa estar logado para enviar feedback.', 'error');
    return;
  }

  try {
    btnEnviar.disabled = true;
    document.querySelector('.feedback-btn-text').style.display = 'none';
    document.querySelector('.feedback-btn-loading').style.display = 'flex';

    console.log('Enviando feedback...', {
      userId: usuarioAtual.uid,
      userEmail: usuarioAtual.email,
      mensagemLength: mensagem.length
    });

    const feedbacksRef = collection(db, 'feedbacks');
    await addDoc(feedbacksRef, {
      userId: usuarioAtual.uid,
      userName: usuarioAtual.displayName || usuarioAtual.email.split('@')[0],
      userEmail: usuarioAtual.email,
      mensagem: mensagem,
      timestamp: serverTimestamp(),
      status: 'novo'
    });

    mostrarMensagem('✅ Feedback enviado com sucesso! Obrigado pela contribuição.', 'success');
    
    setTimeout(() => {
      fecharModal();
    }, 2000);

    console.log('✅ Feedback enviado com sucesso');

  } catch (error) {
    console.error('❌ Erro ao enviar feedback:', error);
    mostrarMensagem('Erro ao enviar feedback. Tente novamente.', 'error');
  } finally {
    btnEnviar.disabled = false;
    document.querySelector('.feedback-btn-text').style.display = 'inline';
    document.querySelector('.feedback-btn-loading').style.display = 'none';
  }
}

function mostrarMensagem(texto, tipo) {
  const statusDiv = document.getElementById('feedbackMensagemStatus');
  statusDiv.textContent = texto;
  statusDiv.className = `feedback-mensagem-status ${tipo}`;
  statusDiv.style.display = 'block';

  if (tipo === 'error') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
}

function criarBotaoFlutuante() {
  if (document.getElementById('feedbackFloatingBtn')) {
    return;
  }

  const botao = document.createElement('button');
  botao.id = 'feedbackFloatingBtn';
  botao.className = 'feedback-floating-btn';
  botao.innerHTML = '💬';
  botao.title = 'Enviar Feedback';
  botao.setAttribute('aria-label', 'Abrir modal de feedback');

  botao.addEventListener('click', abrirModal);

  document.body.appendChild(botao);
}
onAuthStateChanged(auth, (user) => {
  usuarioAtual = user;
  
  if (user) {
    console.log('✅ Usuário logado para feedback:', user.email);
    console.log('📝 User object:', {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName
    });
  } else {
    console.log('⚠️ Usuário não logado - feedback desabilitado');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Sistema de Feedback inicializado (usando Firebase existente)');
  
  criarModalFeedback();
  criarBotaoFlutuante();
});

window.feedbackModal = {
  abrir: abrirModal,
  fechar: fecharModal
};