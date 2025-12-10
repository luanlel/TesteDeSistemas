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
  style.textContent = `/* ============================================
   MODAL DE FEEDBACK - TEMA DARK DO PROJETO
   Paleta: Roxo (#654E92) + Dourado (#D4AF37)
   Background Dark: #1C1C28
   ============================================ */

/* ===== OVERLAY ===== */
.feedback-modal {
  display: none;
  position: fixed;
  z-index: 10000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
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

/* ===== MODAL CONTENT ===== */
.feedback-modal-content {
  background: linear-gradient(145deg, #2D2D3F 0%, #3D3D4F 100%);
  border-radius: 1rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
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

/* ===== HEADER ===== */
.feedback-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border-bottom: 1px solid #4D4D5F;
  background: linear-gradient(135deg, #654E92 0%, #D4AF37 100%);
  border-radius: 1rem 1rem 0 0;
  position: relative;
  overflow: hidden;
}

/* Efeito pulse no header */
.feedback-modal-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.feedback-modal-header h2 {
  margin: 0;
  color: #E6E6FA;
  font-size: 1.5rem;
  font-weight: 700;
  font-family: 'Playfair Display', serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
}

/* Botão fechar */
.feedback-close-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #E6E6FA;
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
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
}

.feedback-close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: rotate(90deg);
}

/* ===== BODY ===== */
.feedback-modal-body {
  padding: 2rem;
}

.feedback-descricao {
  color: #9D9DAF;
  margin-bottom: 1.5rem;
  font-size: 1rem;
  line-height: 1.6;
  display: flex;
  align-items: center;
  gap: 10px;
}

.feedback-descricao::before {
  content: '💬';
  font-size: 20px;
}

/* ===== FORM GROUP ===== */
.feedback-form-group {
  margin-bottom: 1.5rem;
}

.feedback-form-group label {
  display: block;
  margin-bottom: 0.75rem;
  color: #E6E6FA;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.feedback-form-group label .required {
  color: #ff6b6b;
  font-size: 1rem;
}

/* ===== TEXTAREA ===== */
.feedback-form-group textarea {
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.5rem;
  color: #E6E6FA;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  transition: all 0.3s ease;
  resize: vertical;
  min-height: 160px;
  box-sizing: border-box;
}

.feedback-form-group textarea:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.08);
  border-color: #D4AF37;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.feedback-form-group textarea::placeholder {
  color: #8D8D9F;
}

/* ===== CONTADOR DE CARACTERES ===== */
.feedback-contador {
  display: block;
  text-align: right;
  color: #8D8D9F;
  font-size: 0.75rem;
  margin-top: 0.5rem;
  font-weight: 600;
  transition: color 0.3s ease;
}

.feedback-contador.warning {
  color: #f39c12;
}

.feedback-contador.danger {
  color: #c0392b;
}

.feedback-contador.success {
  color: #27ae60;
}

.feedback-hint {
  display: block;
  color: #8D8D9F;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* ===== FOOTER ===== */
.feedback-modal-footer {
  display: flex;
  gap: 1rem;
  padding: 2rem;
  border-top: 1px solid #4D4D5F;
  justify-content: flex-end;
  background: rgba(0, 0, 0, 0.2);
}

/* ===== BOTÕES ===== */
.feedback-btn-cancelar,
.feedback-btn-enviar {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Montserrat', sans-serif;
  position: relative;
  overflow: hidden;
}

/* Efeito ripple */
.feedback-btn-cancelar::before,
.feedback-btn-enviar::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.feedback-btn-cancelar:hover::before,
.feedback-btn-enviar:hover::before {
  width: 300px;
  height: 300px;
}

/* Botão cancelar */
.feedback-btn-cancelar {
  background: rgba(255, 255, 255, 0.08);
  color: #9D9DAF;
  border: 2px solid rgba(255, 255, 255, 0.1);
}

.feedback-btn-cancelar span {
  position: relative;
  z-index: 1;
}

.feedback-btn-cancelar:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #E6E6FA;
  border-color: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* Botão enviar */
.feedback-btn-enviar {
  background: linear-gradient(135deg, #654E92 0%, #D4AF37 100%);
  color: #E6E6FA;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
  min-width: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.feedback-btn-enviar:hover:not(:disabled) {
  box-shadow: 0 6px 25px rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
}

.feedback-btn-enviar:active {
  transform: translateY(0);
}

.feedback-btn-enviar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.feedback-btn-text,
.feedback-btn-loading {
  position: relative;
  z-index: 1;
}

.feedback-btn-loading {
  display: none;
  align-items: center;
  gap: 8px;
}

/* Spinner */
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

/* ===== MENSAGENS DE STATUS ===== */
.feedback-mensagem-status {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.75rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 500;
  display: none;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feedback-mensagem-status.success {
  background: rgba(39, 174, 96, 0.15);
  border: 1px solid #27ae60;
  color: #51cf66;
  display: block;
}

.feedback-mensagem-status.error {
  background: rgba(192, 57, 43, 0.15);
  border: 1px solid #c0392b;
  color: #ff6b6b;
  display: block;
}

/* ===== BOTÃO FLUTUANTE ===== */
.feedback-floating-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(135deg, #654E92 0%, #D4AF37 100%);
  color: #E6E6FA;
  border: none;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.4);
  transition: all 0.3s ease;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.feedback-floating-btn:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 32px rgba(212, 175, 55, 0.6);
}

.feedback-floating-btn:active {
  transform: translateY(-2px) scale(1.02);
}

/* ===== SCROLLBAR CUSTOMIZADA ===== */
.feedback-modal-content::-webkit-scrollbar {
  width: 8px;
}

.feedback-modal-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.feedback-modal-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.feedback-modal-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* ===== ANIMAÇÃO DE SAÍDA ===== */
.feedback-modal.closing {
  animation: fadeOut 0.3s ease forwards;
}

.feedback-modal.closing .feedback-modal-content {
  animation: slideDownExit 0.3s ease forwards;
}

@keyframes fadeOut {
  to { opacity: 0; }
}

@keyframes slideDownExit {
  to {
    transform: translateY(20px);
    opacity: 0;
  }
}

/* ===== RESPONSIVO ===== */
@media (max-width: 768px) {
  .feedback-modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .feedback-modal-header {
    padding: 1.5rem;
  }

  .feedback-modal-header h2 {
    font-size: 1.25rem;
  }

  .feedback-modal-body {
    padding: 1.5rem;
  }

  .feedback-modal-footer {
    flex-direction: column;
    padding: 1.5rem;
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

/* ===== ESTADOS LOADING ===== */
.feedback-btn-enviar.loading .feedback-btn-text {
  display: none;
}

.feedback-btn-enviar.loading .feedback-btn-loading {
  display: flex;
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