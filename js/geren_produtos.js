/** ================================
 *  GERENCIAMENTO DE PRODUTOS (com múltiplas imagens)
 *  ================================ */
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const produtoForm = document.getElementById("produtoForm");
const tabelaEstoque = document.getElementById("tabelaEstoque").querySelector("tbody");
const produtosRef = collection(db, "produtos");

/** =============================
 * FUNÇÃO PARA LER IMAGEM COMO BASE64
 * ============================= */
const lerImagemDataUrl = (file) => new Promise((res, rej) => {
  const reader = new FileReader();
  reader.onload = () => res(reader.result);
  reader.onerror = rej;
  reader.readAsDataURL(file);
});

/** =============================
 * ADICIONAR PRODUTO
 * ============================= */
produtoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const quantidade = document.getElementById("quantidade").value.trim();
  const preco = document.getElementById("preco").value.trim();
  const comentario = document.getElementById("comentario").value.trim();
  const inputImagens = document.getElementById("imagem");

  // Validação de número máximo de imagens
  if (inputImagens?.files?.length > 3) {
    alert("Você só pode enviar até 3 imagens por produto.");
    return;
  }

  let valido = true;
  document.querySelectorAll(".error-msg").forEach(el => el.textContent = "");

  // Validações
  if (!nome) {
    document.getElementById("erro-nome").textContent = "Digite o nome do produto.";
    valido = false;
  }

  // Quantidade: inteiro positivo
  const qtdNum = parseInt(quantidade);
  if (!Number.isInteger(qtdNum) || qtdNum < 0) {
    document.getElementById("erro-quantidade").textContent = "Quantidade inválida (apenas inteiros positivos).";
    valido = false;
  }

  // Preço: número positivo
  const precoNum = parseFloat(preco);
  if (isNaN(precoNum) || precoNum <= 0) {
    document.getElementById("erro-preco").textContent = "Preço inválido (apenas números positivos).";
    valido = false;
  }

  if (comentario.length > 50) {
    document.getElementById("erro-comentario").textContent = "Comentário muito longo (máx 50 caracteres).";
    valido = false;
  }

  if (!valido) return;

  // Converte imagens para base64
  const imagens = [];
  if (inputImagens?.files?.length > 0) {
    for (let i = 0; i < inputImagens.files.length; i++) {
      imagens.push(await lerImagemDataUrl(inputImagens.files[i]));
    }
  }

  try {
    await addDoc(produtosRef, {
      nome,
      quantidade: qtdNum,
      preco: precoNum,
      comentario,
      imagens,
      createdAt: new Date()
    });
    produtoForm.reset();
    alert("✅ Produto cadastrado com sucesso!");
  } catch (err) {
    console.error("Erro ao adicionar produto:", err);
    alert("❌ Erro ao cadastrar produto.");
  }
});

/** =============================
 * CARREGAR PRODUTOS EM TEMPO REAL
 * ============================= */
function carregarProdutos() {
  onSnapshot(produtosRef, (snapshot) => {
    const produtos = [];
    snapshot.forEach((docSnap) => {
      produtos.push({ id: docSnap.id, ...docSnap.data() });
    });

    produtos.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));

    tabelaEstoque.innerHTML = "";
    produtos.forEach((p, index) => {
      const statusEstoque = p.quantidade === 0
        ? `<span style="color:red;font-weight:bold;">Esgotado</span>`
        : p.quantidade;
      const estilo = p.quantidade === 0 ? "style='background-color:#ffe6e6;'" : "";

      const linha = document.createElement("tr");
      linha.innerHTML = `
        <tr ${estilo}>
          <td>${String(index + 1).padStart(3, "0")}</td>
          <td>${p.nome}</td>
          <td>${statusEstoque}</td>
          <td>R$ ${parseFloat(p.preco).toFixed(2)}</td>
          <td>${p.comentario || "-"}</td>
          <td>
            <button class="btn-editar" onclick="abrirEditarProduto('${p.id}')">Editar</button>
            <button class="btn-excluir" onclick="excluirProduto('${p.id}')">Excluir</button>
          </td>
        </tr>`;
      tabelaEstoque.appendChild(linha);
    });
  });
}
carregarProdutos();

/** =============================
 * EXCLUIR PRODUTO
 * ============================= */
window.excluirProduto = async function (id) {
  try {
    await deleteDoc(doc(db, "produtos", id));
    alert("🗑️ Produto excluído com sucesso!");
  } catch (err) {
    console.error("Erro ao excluir produto:", err);
    alert("❌ Erro ao excluir produto.");
  }
};

/** =============================
 * EDITAR PRODUTO (mantém imagens antigas)
 * ============================= */
window.abrirEditarProduto = async function (id) {
  const docs = await getDocs(produtosRef);
  const docSnap = docs.docs.find(d => d.id === id);
  if (!docSnap) return alert("Produto não encontrado");
  const p = docSnap.data();

  let modal = document.getElementById("modalEdicaoProduto");
  if (modal) modal.remove();

  modal = document.createElement("div");
  modal.id = "modalEdicaoProduto";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-card">
      <h3>Editar Produto</h3>
      <form id="formEditarProduto">
        <div><label>Nome:</label><input id="editNome" required></div>
        <div><label>Quantidade:</label><input id="editQuantidade" type="number" min="0" required></div>
        <div><label>Preço:</label><input id="editPreco" type="number" step="0.01" min="0.01" required></div>
        <div><label>Comentário:</label><input id="editComentario" maxlength="50"></div>

        <div><label>Imagens atuais:</label>
          <div id="previewImagens" style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;"></div>
        </div>

        <div><label>Adicionar novas (máx 3):</label>
          <input id="editImagens" type="file" accept="image/*" multiple>
        </div>

        <div style="display:flex;gap:8px;margin-top:10px;">
          <button type="submit" class="btn-primary">Salvar</button>
          <button type="button" id="cancelEdit" class="btn-secondary">Cancelar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  // Preenche os campos
  document.getElementById("editNome").value = p.nome || "";
  document.getElementById("editQuantidade").value = p.quantidade || 0;
  document.getElementById("editPreco").value = p.preco || 0;
  document.getElementById("editComentario").value = p.comentario || "";

  // Mostra imagens antigas
  const preview = document.getElementById("previewImagens");
  preview.innerHTML = "";
  let imagensAtuais = p.imagens ? [...p.imagens] : [];

  function atualizarPreview() {
    preview.innerHTML = "";
    if (imagensAtuais.length === 0) {
      preview.innerHTML = "<span class='small-muted'>Sem imagens</span>";
    } else {
      imagensAtuais.forEach((url, i) => {
        const container = document.createElement("div");
        container.style.position = "relative";
        container.style.display = "inline-block";

        const img = document.createElement("img");
        img.src = url;
        img.style.width = "80px";
        img.style.borderRadius = "6px";
        img.title = `Imagem ${i + 1}`;

        const btnRemover = document.createElement("button");
        btnRemover.textContent = "X";
        btnRemover.style.position = "absolute";
        btnRemover.style.top = "0";
        btnRemover.style.right = "0";
        btnRemover.style.background = "red";
        btnRemover.style.color = "white";
        btnRemover.style.border = "none";
        btnRemover.style.borderRadius = "50%";
        btnRemover.style.cursor = "pointer";
        btnRemover.style.width = "20px";
        btnRemover.style.height = "20px";
        btnRemover.addEventListener("click", () => {
          imagensAtuais.splice(i, 1);
          atualizarPreview();
        });

        container.appendChild(img);
        container.appendChild(btnRemover);
        preview.appendChild(container);
      });
    }
  }
  atualizarPreview();

  document.getElementById("cancelEdit").addEventListener("click", () => modal.remove());

  document.getElementById("formEditarProduto").addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("editNome").value.trim();
    const qtd = parseInt(document.getElementById("editQuantidade").value);
    const preco = parseFloat(document.getElementById("editPreco").value);
    const comentario = document.getElementById("editComentario").value.trim();

    if (!nome) return alert("Nome inválido.");
    if (!Number.isInteger(qtd) || qtd < 0) return alert("Quantidade inválida.");
    if (isNaN(preco) || preco <= 0) return alert("Preço inválido.");

    const inputImgs = document.getElementById("editImagens");
    let novasImgs = [...imagensAtuais];

    if (inputImgs.files.length > 0) {
      if (inputImgs.files.length + novasImgs.length > 3) {
        alert(`O total de imagens não pode exceder 3. Você já possui ${novasImgs.length} imagens.`);
        return;
      }

      for (let i = 0; i < inputImgs.files.length; i++) {
        novasImgs.push(await lerImagemDataUrl(inputImgs.files[i]));
      }
    }

    await updateDoc(doc(db, "produtos", id), {
      nome,
      quantidade: qtd,
      preco,
      comentario,
      imagens: novasImgs
    });

    modal.remove();
    alert("✅ Produto atualizado com sucesso!");
  });
};

/** =============================
 * CONTADOR DE COMENTÁRIO
 * ============================= */
const comentarioInput = document.getElementById("comentario");
const contadorComentario = document.getElementById("contador-comentario");
comentarioInput.addEventListener("input", () => {
  contadorComentario.textContent = `${comentarioInput.value.length} / 50`;
});
