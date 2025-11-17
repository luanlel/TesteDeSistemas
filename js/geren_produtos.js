// js/geren_produtos.js - CORREÇÃO COMPLETA

/** =============================
 * SELECIONAR / DESMARCAR TODOS
 * ============================= */
const checkTodos = document.getElementById("checkTodos");
checkTodos.addEventListener("change", () => {
  const checkboxes = document.querySelectorAll(".check-produto");
  checkboxes.forEach(cb => cb.checked = checkTodos.checked);
});

/** ================================
 *  GERENCIAMENTO DE PRODUTOS (com validações)
 *  ================================ */
import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const produtoForm = document.getElementById("produtoForm");
const tabelaEstoque = document.getElementById("tabelaEstoque").querySelector("tbody");
const produtosRef = collection(db, "produtos");

// LIMITES DE CARACTERES
const LIMITES = {
  nome: 120,
  comentario: 50,
  quantidade: 99999,
  preco: 999999
};

/** =============================
 * VALIDAÇÃO DE IMAGEM
 * ============================= */
function validarImagem(file) {
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  const tamanhoMaximo = 5 * 1024 * 1024; // 5MB
  
  if (!tiposPermitidos.includes(file.type)) {
    return {
      valido: false,
      mensagem: "Apenas arquivos de imagem são permitidos (JPEG, PNG, GIF, WebP, SVG)."
    };
  }
  
  if (file.size > tamanhoMaximo) {
    return {
      valido: false,
      mensagem: "A imagem não pode ser maior que 5MB."
    };
  }
  
  return { valido: true };
}

/** =============================
 * VERIFICAR DUPLICAÇÃO
 * ============================= */
async function verificarProdutoDuplicado(nome, preco, comentario, idExcluir = null) {
  try {
    const snapshot = await getDocs(produtosRef);
    
    for (const docSnap of snapshot.docs) {
      // Pula o próprio produto em caso de edição
      if (idExcluir && docSnap.id === idExcluir) continue;
      
      const prod = docSnap.data();
      
      // Verifica se nome, preço e comentário são iguais
      if (prod.nome.toLowerCase().trim() === nome.toLowerCase().trim() &&
          parseFloat(prod.preco) === parseFloat(preco) &&
          (prod.comentario || "").toLowerCase().trim() === comentario.toLowerCase().trim()) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Erro ao verificar duplicação:", error);
    return false;
  }
}

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
 * ADICIONAR PRODUTO - COM VALIDAÇÕES
 * ============================= */
produtoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value.trim();
  const quantidade = document.getElementById("quantidade").value.trim();
  const preco = document.getElementById("preco").value.trim();
  const comentario = document.getElementById("comentario").value.trim();
  const inputImagens = document.getElementById("imagem");

  let valido = true;
  document.querySelectorAll(".error-msg").forEach(el => el.textContent = "");

  // Validação de nome
  if (!nome) {
    document.getElementById("erro-nome").textContent = "Digite o nome do produto.";
    valido = false;
  } else if (nome.length > LIMITES.nome) {
    document.getElementById("erro-nome").textContent = `Nome muito longo (máx ${LIMITES.nome} caracteres).`;
    valido = false;
  }

  // Validação de quantidade: inteiro positivo
  const qtdNum = parseInt(quantidade);
  if (!Number.isInteger(qtdNum) || qtdNum < 0 || qtdNum > LIMITES.quantidade) {
    document.getElementById("erro-quantidade").textContent = `Quantidade inválida (deve ser um inteiro entre 0 e ${LIMITES.quantidade}).`;
    valido = false;
  }

  // Validação de preço: número positivo
  const precoNum = parseFloat(preco);
  if (isNaN(precoNum) || precoNum <= 0 || precoNum > LIMITES.preco) {
    document.getElementById("erro-preco").textContent = `Preço inválido (deve ser um número entre 0.01 e ${LIMITES.preco}).`;
    valido = false;
  }

  // Validação de comentário
  if (comentario.length > LIMITES.comentario) {
    document.getElementById("erro-comentario").textContent = `Comentário muito longo (máx ${LIMITES.comentario} caracteres).`;
    valido = false;
  }

  // Validação de imagens
  if (inputImagens?.files?.length > 0) {
    // Limita a 3 imagens
    if (inputImagens.files.length > 3) {
      alert("Você só pode enviar até 3 imagens por produto.");
      valido = false;
    }
    
    // Valida cada imagem
    for (let i = 0; i < inputImagens.files.length; i++) {
      const validacao = validarImagem(inputImagens.files[i]);
      if (!validacao.valido) {
        alert(validacao.mensagem);
        valido = false;
        break;
      }
    }
  }

  if (!valido) return;

  // Verifica duplicação
  const ehDuplicado = await verificarProdutoDuplicado(nome, precoNum, comentario);
  if (ehDuplicado) {
    alert("❌ Já existe um produto com o mesmo nome, preço e comentário cadastrado.");
    return;
  }

  // Converte imagens para base64
  const imagens = [];
  if (inputImagens?.files?.length > 0) {
    try {
      for (let i = 0; i < inputImagens.files.length; i++) {
        imagens.push(await lerImagemDataUrl(inputImagens.files[i]));
      }
    } catch (error) {
      alert("Erro ao processar imagens. Tente novamente.");
      return;
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
    // Reseta o contador de comentário
    document.getElementById("contador-comentario").textContent = "0 / 50";
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

      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td><input type="checkbox" class="check-produto" data-id="${p.id}"></td>
        <td>${String(index + 1).padStart(3, "0")}</td>
        <td>${p.nome}</td>
        <td>${statusEstoque}</td>
        <td>R$ ${parseFloat(p.preco).toFixed(2)}</td>
        <td>${p.comentario || "-"}</td>
        <td>
          <button class="btn btn-primary" onclick="abrirEditarProduto('${p.id}')">Editar</button>
          <button class="btn btn-outline" onclick="excluirProduto('${p.id}')">Excluir</button>
        </td>
      `;
      tabelaEstoque.appendChild(linha);
    });
  });
}
carregarProdutos();

/** =============================
 * PESQUISAR PRODUTOS
 * ============================= */
const inputPesquisa = document.getElementById("pesquisaProdutos");
inputPesquisa.addEventListener("input", () => {
  const termo = inputPesquisa.value.toLowerCase();
  const linhas = tabelaEstoque.querySelectorAll("tr");
  linhas.forEach(linha => {
    const nomeProduto = linha.children[2].textContent.toLowerCase();
    linha.style.display = nomeProduto.includes(termo) ? "" : "none";
  });
});

/** =============================
 * EXCLUIR PRODUTO
 * ============================= */
window.excluirProduto = async function (id) {
  if (!confirm("Tem certeza que deseja excluir este produto?")) return;
  
  try {
    await deleteDoc(doc(db, "produtos", id));
    alert("🗑️ Produto excluído com sucesso!");
  } catch (err) {
    console.error("Erro ao excluir produto:", err);
    alert("❌ Erro ao excluir produto.");
  }
};

/** =============================
 * EXCLUSÃO MÚLTIPLA DE PRODUTOS
 * ============================= */
document.getElementById("btnExcluirSelecionados").addEventListener("click", async () => {
  const selecionados = [...document.querySelectorAll(".check-produto:checked")];
  if (selecionados.length === 0) {
    alert("⚠️ Nenhum produto selecionado para exclusão.");
    return;
  }

  if (!confirm(`Tem certeza que deseja excluir ${selecionados.length} produto(s)?`)) return;

  try {
    for (const checkbox of selecionados) {
      const id = checkbox.getAttribute("data-id");
      await deleteDoc(doc(db, "produtos", id));
    }
    alert(`🗑️ ${selecionados.length} produto(s) excluído(s) com sucesso!`);
    checkTodos.checked = false;
  } catch (err) {
    console.error("Erro ao excluir múltiplos produtos:", err);
    alert("❌ Erro ao excluir produtos selecionados.");
  }
});

/** =============================
 * MODAL DE EDIÇÃO
 * ============================= */
function criarModalEdicao() {
  let modal = document.createElement("div");
  modal.id = "modalEdicaoProduto";
  modal.className = "modal-overlay hidden";
  modal.innerHTML = `
    <div class="modal-card card">
      <div class="modal-header">
        <h3>Editar Produto</h3>
        <button class="modal-close" id="btnFecharModalEdicao" aria-label="Fechar modal">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <form id="formEditarProduto" class="form-elegant">
        <div class="form-group">
          <label>Nome:</label>
          <input id="editNome" maxlength="${LIMITES.nome}" required>
          <div class="error-msg" id="edit-erro-nome"></div>
        </div>
        <div class="form-group">
          <label>Quantidade:</label>
          <input id="editQuantidade" type="number" min="0" max="${LIMITES.quantidade}" required>
          <div class="error-msg" id="edit-erro-quantidade"></div>
        </div>
        <div class="form-group">
          <label>Preço:</label>
          <input id="editPreco" type="number" step="0.01" min="0.01" max="${LIMITES.preco}" required>
          <div class="error-msg" id="edit-erro-preco"></div>
        </div>
        <div class="form-group">
          <label>Comentário:</label>
          <input id="editComentario" maxlength="${LIMITES.comentario}">
          <small id="edit-contador-comentario">0 / ${LIMITES.comentario}</small>
          <div class="error-msg" id="edit-erro-comentario"></div>
        </div>

        <div class="form-group">
          <label>Imagens atuais:</label>
          <div id="previewImagens" style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;"></div>
        </div>

        <div class="form-group">
          <label>Adicionar novas (máx 3):</label>
          <input id="editImagens" type="file" accept="image/*" multiple>
        </div>

        <div class="form-buttons" style="display:flex;gap:8px;margin-top:10px;">
          <button type="submit" class="btn btn-primary"><i class="bi bi-check-lg"></i> Salvar</button>
          <button type="button" id="cancelEdit" class="btn btn-outline"><i class="bi bi-x-lg"></i> Cancelar</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  document.getElementById("btnFecharModalEdicao").addEventListener("click", fecharModalEdicao);
  document.getElementById("cancelEdit").addEventListener("click", fecharModalEdicao);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) fecharModalEdicao();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.classList.contains("hidden")) {
      fecharModalEdicao();
    }
  });
  
  // Contador de caracteres para comentário na edição
  document.getElementById("editComentario").addEventListener("input", (e) => {
    document.getElementById("edit-contador-comentario").textContent = 
      `${e.target.value.length} / ${LIMITES.comentario}`;
  });
}

function fecharModalEdicao() {
  const modal = document.getElementById("modalEdicaoProduto");
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
  // Limpa erros
  document.querySelectorAll("#modalEdicaoProduto .error-msg").forEach(el => el.textContent = "");
}

criarModalEdicao();

/** =============================
 * EDITAR PRODUTO - COM VALIDAÇÕES
 * ============================= */
window.abrirEditarProduto = async function (id) {
  const docs = await getDocs(produtosRef);
  const docSnap = docs.docs.find(d => d.id === id);
  if (!docSnap) return alert("Produto não encontrado");
  const p = docSnap.data();

  const modal = document.getElementById("modalEdicaoProduto");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Preenche os campos
  document.getElementById("editNome").value = p.nome || "";
  document.getElementById("editQuantidade").value = p.quantidade || 0;
  document.getElementById("editPreco").value = p.preco || 0;
  document.getElementById("editComentario").value = p.comentario || "";
  document.getElementById("edit-contador-comentario").textContent = 
    `${(p.comentario || "").length} / ${LIMITES.comentario}`;

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
        btnRemover.type = "button";
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

  document.getElementById("formEditarProduto").onsubmit = async (e) => {
    e.preventDefault();
    
    // Limpa erros anteriores
    document.querySelectorAll("#modalEdicaoProduto .error-msg").forEach(el => el.textContent = "");

    const nome = document.getElementById("editNome").value.trim();
    const qtd = parseInt(document.getElementById("editQuantidade").value);
    const preco = parseFloat(document.getElementById("editPreco").value);
    const comentario = document.getElementById("editComentario").value.trim();

    let valido = true;

    // Validações
    if (!nome || nome.length > LIMITES.nome) {
      document.getElementById("edit-erro-nome").textContent = 
        `Nome inválido (máx ${LIMITES.nome} caracteres).`;
      valido = false;
    }
    
    if (!Number.isInteger(qtd) || qtd < 0 || qtd > LIMITES.quantidade) {
      document.getElementById("edit-erro-quantidade").textContent = 
        `Quantidade inválida (0-${LIMITES.quantidade}).`;
      valido = false;
    }
    
    if (isNaN(preco) || preco <= 0 || preco > LIMITES.preco) {
      document.getElementById("edit-erro-preco").textContent = 
        `Preço inválido (0.01-${LIMITES.preco}).`;
      valido = false;
    }
    
    if (comentario.length > LIMITES.comentario) {
      document.getElementById("edit-erro-comentario").textContent = 
        `Comentário muito longo (máx ${LIMITES.comentario}).`;
      valido = false;
    }

    if (!valido) return;

    // Verifica duplicação (excluindo o próprio produto)
    const ehDuplicado = await verificarProdutoDuplicado(nome, preco, comentario, id);
    if (ehDuplicado) {
      alert("❌ Já existe outro produto com o mesmo nome, preço e comentário.");
      return;
    }

    const inputImgs = document.getElementById("editImagens");
    let novasImgs = [...imagensAtuais];

    if (inputImgs.files.length > 0) {
      const totalImagens = inputImgs.files.length + novasImgs.length;
      if (totalImagens > 3) {
        alert(`O total de imagens não pode exceder 3. Você já possui ${novasImgs.length} imagens.`);
        return;
      }

      // Valida cada nova imagem
      for (let i = 0; i < inputImgs.files.length; i++) {
        const validacao = validarImagem(inputImgs.files[i]);
        if (!validacao.valido) {
          alert(validacao.mensagem);
          return;
        }
      }

      // Converte novas imagens
      for (let i = 0; i < inputImgs.files.length; i++) {
        novasImgs.push(await lerImagemDataUrl(inputImgs.files[i]));
      }
    }

    try {
      await updateDoc(doc(db, "produtos", id), {
        nome,
        quantidade: qtd,
        preco,
        comentario,
        imagens: novasImgs
      });

      fecharModalEdicao();
      alert("✅ Produto atualizado com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert("❌ Erro ao atualizar produto.");
    }
  };
};

/** =============================
 * CONTADOR DE COMENTÁRIO
 * ============================= */
const comentarioInput = document.getElementById("comentario");
const contadorComentario = document.getElementById("contador-comentario");
comentarioInput.addEventListener("input", () => {
  contadorComentario.textContent = `${comentarioInput.value.length} / ${LIMITES.comentario}`;
});