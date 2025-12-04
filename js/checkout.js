import { db, auth } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

async function buscarCEP(cep) {
  const cepLimpo = cep.replace(/\D/g, "");
  if (cepLimpo.length !== 8) throw new Error("CEP deve ter 8 dígitos");
  
  const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
  const dados = await response.json();
  
  if (dados.erro) throw new Error("CEP não encontrado");
  
  return {
    logradouro: dados.logradouro,
    bairro: dados.bairro,
    cidade: dados.localidade,
    estado: dados.uf
  };
}

function aplicarMascaraCEP(input) {
  if (!input) return;
  
  input.setAttribute("maxlength", "9");
  input.addEventListener("input", function(e) {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 8) valor = valor.slice(0, 8);
    e.target.value = valor.length > 5 ? `${valor.slice(0,5)}-${valor.slice(5,8)}` : valor;
  });
  
  input.addEventListener("blur", async function(e) {
    const cep = e.target.value.replace(/\D/g, "");
    if (cep.length === 8) {
      try {
        const endereco = await buscarCEP(cep);
        document.getElementById("rua").value = endereco.logradouro;
        document.getElementById("bairro").value = endereco.bairro;
        document.getElementById("cidade").value = endereco.cidade;
        document.getElementById("estado").value = endereco.estado;
      } catch (error) {
        console.error(error);
      }
    }
  });
}

export async function processarCheckout(carrinho, usuario) {
  return new Promise((resolve, reject) => {
    const modal = criarModalCheckout();
    document.body.appendChild(modal);
    modal.classList.add("active");
    
    aplicarMascaraCEP(document.getElementById("cep"));
    
    const form = document.getElementById("formCheckout");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      const pedido = {
        usuario: { uid: usuario.uid, email: usuario.email },
        endereco: {
          cep: document.getElementById("cep").value,
          rua: document.getElementById("rua").value,
          numero: document.getElementById("numero").value,
          complemento: document.getElementById("complemento").value,
          bairro: document.getElementById("bairro").value,
          cidade: document.getElementById("cidade").value,
          estado: document.getElementById("estado").value
        },
        formaPagamento: document.getElementById("formaPagamento").value,
        carrinho: carrinho,
        criadoEm: new Date()
      };
      
      await addDoc(collection(db, "pedidos"), pedido);
      modal.remove();
      resolve(pedido);
    });
    
    document.getElementById("btnCancelarCheckout")?.addEventListener("click", () => {
      modal.remove();
      reject(new Error("Checkout cancelado"));
    });
  });
}

function criarModalCheckout() {
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content card" style="max-width: 600px; max-height: 90vh; overflow-y: auto;">
      <div class="modal-header">
        <h2>🛒 Finalizar Compra</h2>
        <button class="modal-close" id="btnCancelarCheckout">×</button>
      </div>
      <form id="formCheckout">
        <h3 style="color: var(--color-secondary);">📍 Endereço</h3>
        <div class="form-group"><label>CEP *</label><input type="text" id="cep" required></div>
        <div class="form-group"><label>Rua *</label><input type="text" id="rua" required></div>
        <div class="form-group"><label>Número *</label><input type="text" id="numero" required></div>
        <div class="form-group"><label>Complemento</label><input type="text" id="complemento"></div>
        <div class="form-group"><label>Bairro *</label><input type="text" id="bairro" required></div>
        <div class="form-group"><label>Cidade *</label><input type="text" id="cidade" required></div>
        <div class="form-group"><label>Estado *</label><input type="text" id="estado" required maxlength="2"></div>
        <h3 style="color: var(--color-secondary);">💳 Pagamento</h3>
        <div class="form-group">
          <label>Forma de Pagamento *</label>
          <select id="formaPagamento" required class="input">
            <option value="">-- Selecione --</option>
            <option value="credito">💳 Cartão de Crédito</option>
            <option value="debito">💳 Cartão de Débito</option>
            <option value="pix">📱 PIX</option>
            <option value="boleto">📄 Boleto</option>
            <option value="dinheiro">💵 Dinheiro</option>
          </select>
        </div>
        <div class="form-buttons"><button type="submit" class="btn btn-primary">💳 Finalizar</button></div>
      </form>
    </div>
  `;
  return modal;
}