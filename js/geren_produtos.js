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
const tabelaEstoque = document.getElementById("tabelaEstoque")?.querySelector("tbody");
const produtosRef = collection(db, "produtos");

const LIMITES = {
  nome: 120,
  comentario: 50,
  quantidade: 99999,
  preco: 999999
};

function validarImagem(file) {
  const tiposPermitidos = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp'
  ];
  
  const tamanhoMaximo = 5 * 1024 * 1024;
  
  if (!tiposPermitidos.includes(file.type)) {
    return {
      valido: false,
      mensagem: `❌ Apenas imagens são permitidas.\nArquivo: ${file.name}\nTipo: ${file.type}\n\nTipos aceitos: JPEG, PNG, GIF, WebP, SVG`
    };
  }
  
  const extensao = file.name.split('.').pop().toLowerCase();
  const extensoesPermitidas = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
  
  if (!extensoesPermitidas.includes(extensao)) {
    return {
      valido: false,
      mensagem: `❌ Extensão não permitida: .${extensao}\nArquivo: ${file.name}\n\nExtensões aceitas: ${extensoesPermitidas.join(', ')}`
    };
  }
  
  if (file.size > tamanhoMaximo) {
    const tamanhoMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      valido: false,
      mensagem: `❌ Imagem muito grande!\nArquivo: ${file.name}\nTamanho: ${tamanhoMB}MB\n\nTamanho máximo: 5MB`
    };
  }
  
  if (file.size === 0) {
    return {
      valido: false,
      mensagem: `❌ Arquivo vazio ou corrompido: ${file.name}`
    };
  }
  
  return { valido: true };
}

function validarArquivosUpload(files) {
  const erros = [];
  
  if (!files || files.length === 0) {
    return { valido: true, erros: [] };
  }
  
  if (files.length > 3) {
    return {
      valido: false,
      erros: [`❌ Máximo de 3 imagens permitido.\n\nVocê tentou enviar: ${files.length} arquivos`]
    };
  }
  
  for (let i = 0; i < files.length; i++) {
    const validacao = validarImagem(files[i]);
    if (!validacao.valido) {
      erros.push(`\n Arquivo ${i + 1}:\n${validacao.mensagem}`);
    }
  }
  
  return {
    valido: erros.length === 0,
    erros: erros
  };
}

async function verificarProdutoDuplicado(nome, preco, comentario, idExcluir = null) {
  try {
    const snapshot = await getDocs(produtosRef);
    
    for (const docSnap of snapshot.docs) {
      if (idExcluir && docSnap.id === idExcluir) continue;
      
      const prod = docSnap.data();
      
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

const lerImagemDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

function mostrarNotificacao(mensagem, tipo = 'info') {
  document.querySelectorAll('.notificacao-toast').forEach(n => n.remove());
  
  const cores = {
    'success': '#4CAF50',
    'error': '#f44336',
    'warning': '#ff9800',
    'info': '#2196F3'
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
    white-space: pre-line;
    line-height: 1.5;
  `;
  notificacao.textContent = mensagem;
  
  document.body.appendChild(notificacao);
  
  setTimeout(() => {
    notificacao.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notificacao.remove(), 300);
  }, 6000);
}

if (produtoForm) {
  produtoForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const quantidade = document.getElementById("quantidade").value.trim();
    const preco = document.getElementById("preco").value.trim();
    const comentario = document.getElementById("comentario").value.trim();
    const inputImagens = document.getElementById("imagem");

    let valido = true;
    
    document.querySelectorAll(".error-msg").forEach(el => el.textContent = "");

    if (!nome) {
      document.getElementById("erro-nome").textContent = "❌ Digite o nome do produto.";
      valido = false;
    } else if (nome.length > LIMITES.nome) {
      document.getElementById("erro-nome").textContent = `❌ Nome muito longo (máximo ${LIMITES.nome} caracteres).`;
      valido = false;
    }

    const qtdNum = parseInt(quantidade);
    if (!Number.isInteger(qtdNum) || qtdNum < 0 || qtdNum > LIMITES.quantidade) {
      document.getElementById("erro-quantidade").textContent = 
        `❌ Quantidade inválida (deve ser entre 0 e ${LIMITES.quantidade}).`;
      valido = false;
    }

    const precoNum = parseFloat(preco);
    if (isNaN(precoNum) || precoNum <= 0 || precoNum > LIMITES.preco) {
      document.getElementById("erro-preco").textContent = 
        `❌ Preço inválido (deve ser entre 0.01 e ${LIMITES.preco}).`;
      valido = false;
    }

    if (comentario.length > LIMITES.comentario) {
      document.getElementById("erro-comentario").textContent = 
        `❌ Comentário muito longo (máximo ${LIMITES.comentario} caracteres).`;
      valido = false;
    }

    if (inputImagens?.files?.length > 0) {
      const validacaoArquivos = validarArquivosUpload(inputImagens.files);
      
      if (!validacaoArquivos.valido) {
        mostrarNotificacao(
          "❌ ERRO NO UPLOAD DE IMAGENS:\n\n" + validacaoArquivos.erros.join('\n'),
          'error'
        );
        valido = false;
      }
    }

    if (!valido) return;

    const ehDuplicado = await verificarProdutoDuplicado(nome, precoNum, comentario);
    if (ehDuplicado) {
      mostrarNotificacao(
        "❌ PRODUTO DUPLICADO\n\nJá existe um produto com o mesmo nome, preço e comentário.",
        'error'
      );
      return;
    }
    const imagens = [];
    const btnSubmit = produtoForm.querySelector('button[type="submit"]');
    const textoOriginal = btnSubmit?.textContent;
    
    try {
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Processando imagens...';
      }
      
      if (inputImagens?.files?.length > 0) {
        for (let i = 0; i < inputImagens.files.length; i++) {
          if (btnSubmit) {
            btnSubmit.textContent = `Processando imagem ${i + 1}/${inputImagens.files.length}...`;
          }
          imagens.push(await lerImagemDataUrl(inputImagens.files[i]));
        }
      }
      
      if (btnSubmit) {
        btnSubmit.textContent = 'Salvando no banco...';
      }

      await addDoc(produtosRef, {
        nome,
        quantidade: qtdNum,
        preco: precoNum,
        comentario,
        imagens,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      produtoForm.reset();
      document.getElementById("contador-comentario").textContent = "0 / 50";
      mostrarNotificacao("✅ Produto cadastrado com sucesso!", 'success');
      
    } catch (err) {
      console.error("Erro ao adicionar produto:", err);
      mostrarNotificacao("❌ Erro ao cadastrar produto. Tente novamente.", 'error');
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = textoOriginal || 'Adicionar Produto';
      }
    }
  });
}

function carregarProdutos() {
  if (!tabelaEstoque) return;
  
  onSnapshot(produtosRef, (snapshot) => {
    const produtos = [];
    snapshot.forEach((docSnap) => {
      produtos.push({ id: docSnap.id, ...docSnap.data() });
    });

    produtos.sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0));

    tabelaEstoque.innerHTML = "";
    
    if (produtos.length === 0) {
      tabelaEstoque.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 20px; color: var(--color-gray-600);">
             Nenhum produto cadastrado ainda
          </td>
        </tr>
      `;
      return;
    }
    
    produtos.forEach((p, index) => {
      const statusEstoque = p.quantidade === 0
        ? `<span class="status-esgotado">❌ Esgotado</span>`
        : p.quantidade < 10
        ? `<span class="status-baixo">⚠️ ${p.quantidade}</span>`
        : `<span class="status-ok">${p.quantidade}</span>`;

      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td><input type="checkbox" class="check-produto" data-id="${p.id}"></td>
        <td>${String(index + 1).padStart(3, "0")}</td>
        <td>${p.nome}</td>
        <td>${statusEstoque}</td>
        <td>R$ ${parseFloat(p.preco).toFixed(2)}</td>
        <td>${p.comentario || "-"}</td>
        <td>
          <button class="btn-editar" onclick="abrirEditarProduto('${p.id}')">✏️ Editar</button>
          <button class="btn-excluir" onclick="excluirProduto('${p.id}')">🗑️ Excluir</button>
        </td>
      `;
      tabelaEstoque.appendChild(linha);
    });
  });
}

carregarProdutos();

const inputPesquisa = document.getElementById("pesquisaProdutos");
if (inputPesquisa) {
  inputPesquisa.addEventListener("input", () => {
    const termo = inputPesquisa.value.toLowerCase();
    const linhas = tabelaEstoque?.querySelectorAll("tr") || [];
    
    let encontrados = 0;
    linhas.forEach(linha => {
      const nomeProduto = linha.children[2]?.textContent.toLowerCase() || "";
      const match = nomeProduto.includes(termo);
      linha.style.display = match ? "" : "none";
      if (match) encontrados++;
    });
    
    console.log(`Pesquisa: "${termo}" → ${encontrados} produtos encontrados`);
  });
}

window.excluirProduto = async function (id) {
  if (!confirm("⚠️ ATENÇÃO!\n\nTem certeza que deseja excluir este produto?\n\nEsta ação NÃO pode ser desfeita.")) {
    return;
  }
  
  try {
    await deleteDoc(doc(db, "produtos", id));
    mostrarNotificacao("Produto excluído com sucesso!", 'success');
  } catch (err) {
    console.error("Erro ao excluir produto:", err);
    mostrarNotificacao("❌ Erro ao excluir produto.", 'error');
  }
};

const checkTodos = document.getElementById("checkTodos");
checkTodos?.addEventListener("change", () => {
  const checkboxes = document.querySelectorAll(".check-produto");
  checkboxes.forEach(cb => cb.checked = checkTodos.checked);
});

const btnExcluirSelecionados = document.getElementById("btnExcluirSelecionados");
if (btnExcluirSelecionados) {
  btnExcluirSelecionados.addEventListener("click", async () => {
    const selecionados = [...document.querySelectorAll(".check-produto:checked")];
    
    if (selecionados.length === 0) {
      mostrarNotificacao("⚠️ Nenhum produto selecionado.", 'warning');
      return;
    }

    if (!confirm(`⚠️ ATENÇÃO!\n\nTem certeza que deseja excluir ${selecionados.length} produto(s)?\n\nEsta ação NÃO pode ser desfeita.`)) {
      return;
    }

    const btnTexto = btnExcluirSelecionados.textContent;
    btnExcluirSelecionados.disabled = true;
    btnExcluirSelecionados.textContent = '⏳ Excluindo...';

    try {
      for (const checkbox of selecionados) {
        const id = checkbox.getAttribute("data-id");
        await deleteDoc(doc(db, "produtos", id));
      }
      mostrarNotificacao(`${selecionados.length} produto(s) excluído(s)!`, 'success');
      if (checkTodos) checkTodos.checked = false;
    } catch (err) {
      console.error("Erro ao excluir múltiplos:", err);
      mostrarNotificacao("❌ Erro ao excluir produtos.", 'error');
    } finally {
      btnExcluirSelecionados.disabled = false;
      btnExcluirSelecionados.textContent = btnTexto;
    }
  });
}

function criarModalEdicao() {
  let modal = document.createElement("div");
  modal.id = "modalEdicaoProduto";
  modal.className = "modal-overlay hidden";
  modal.innerHTML = `
    <div class="modal-card card">
      <div class="modal-header">
        <h3>Editar Produto</h3>
        <button class="modal-close" id="btnFecharModalEdicao" aria-label="Fechar">×</button>
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
          <div id="previewImagens" style="display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;"></div>
        </div>
        <div class="form-group">
          <label>Adicionar novas imagens (máx 3 no total):</label>
          <input id="editImagens" type="file" accept="image/*" multiple>
          <small style="color: var(--color-gray-600);">Apenas: JPEG, PNG, GIF, WebP, SVG (máx 5MB cada)</small>
        </div>
        <div class="form-buttons" style="display:flex;gap:10px;">
          <button type="submit" class="btn btn-primary">Salvar</button>
          <button type="button" id="cancelEdit" class="btn btn-outline">Cancelar</button>
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
  
  document.getElementById("editComentario").addEventListener("input", (e) => {
    document.getElementById("edit-contador-comentario").textContent = 
      `${e.target.value.length} / ${LIMITES.comentario}`;
  });
}

function fecharModalEdicao() {
  const modal = document.getElementById("modalEdicaoProduto");
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
  document.querySelectorAll("#modalEdicaoProduto .error-msg").forEach(el => el.textContent = "");
}

criarModalEdicao();

window.abrirEditarProduto = async function (id) {
  const docs = await getDocs(produtosRef);
  const docSnap = docs.docs.find(d => d.id === id);
  if (!docSnap) {
    mostrarNotificacao("❌ Produto não encontrado", 'error');
    return;
  }
  
  const p = docSnap.data();

  const modal = document.getElementById("modalEdicaoProduto");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  document.getElementById("editNome").value = p.nome || "";
  document.getElementById("editQuantidade").value = p.quantidade || 0;
  document.getElementById("editPreco").value = p.preco || 0;
  document.getElementById("editComentario").value = p.comentario || "";
  document.getElementById("edit-contador-comentario").textContent = 
    `${(p.comentario || "").length} / ${LIMITES.comentario}`;

  const preview = document.getElementById("previewImagens");
  let imagensAtuais = p.imagens ? [...p.imagens] : [];

  function atualizarPreview() {
    preview.innerHTML = "";
    if (imagensAtuais.length === 0) {
      preview.innerHTML = "<span style='color: var(--color-gray-600);'>📷 Sem imagens</span>";
    } else {
      imagensAtuais.forEach((url, i) => {
        const container = document.createElement("div");
        container.style.cssText = "position: relative; display: inline-block;";

        const img = document.createElement("img");
        img.src = url;
        img.style.cssText = "width: 80px; height: 80px; object-fit: cover; border-radius: 6px; border: 2px solid var(--color-gray-300);";

        const btnRemover = document.createElement("button");
        btnRemover.textContent = "×";
        btnRemover.type = "button";
        btnRemover.style.cssText = `
          position: absolute; top: -5px; right: -5px;
          background: #f44336; color: white; border: none;
          border-radius: 50%; cursor: pointer;
          width: 24px; height: 24px; font-size: 18px;
          display: flex; align-items: center; justify-content: center;
        `;
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
    
    document.querySelectorAll("#modalEdicaoProduto .error-msg").forEach(el => el.textContent = "");

    const nome = document.getElementById("editNome").value.trim();
    const qtd = parseInt(document.getElementById("editQuantidade").value);
    const preco = parseFloat(document.getElementById("editPreco").value);
    const comentario = document.getElementById("editComentario").value.trim();

    let valido = true;

    if (!nome || nome.length > LIMITES.nome) {
      document.getElementById("edit-erro-nome").textContent = `❌ Nome inválido (máx ${LIMITES.nome}).`;
      valido = false;
    }
    
    if (!Number.isInteger(qtd) || qtd < 0 || qtd > LIMITES.quantidade) {
      document.getElementById("edit-erro-quantidade").textContent = `❌ Quantidade inválida.`;
      valido = false;
    }
    
    if (isNaN(preco) || preco <= 0 || preco > LIMITES.preco) {
      document.getElementById("edit-erro-preco").textContent = `❌ Preço inválido.`;
      valido = false;
    }
    
    if (comentario.length > LIMITES.comentario) {
      document.getElementById("edit-erro-comentario").textContent = `❌ Comentário muito longo.`;
      valido = false;
    }

    if (!valido) return;

    const ehDuplicado = await verificarProdutoDuplicado(nome, preco, comentario, id);
    if (ehDuplicado) {
      mostrarNotificacao("❌ Já existe outro produto com os mesmos dados.", 'error');
      return;
    }

    const inputImgs = document.getElementById("editImagens");
    let novasImgs = [...imagensAtuais];

    if (inputImgs.files.length > 0) {
      const totalImagens = inputImgs.files.length + novasImgs.length;
      if (totalImagens > 3) {
        mostrarNotificacao(
          `❌ Total não pode exceder 3 imagens.\n\nAtual: ${novasImgs.length}\nNovas: ${inputImgs.files.length}\nTotal: ${totalImagens}`,
          'error'
        );
        return;
      }

      const validacaoArquivos = validarArquivosUpload(inputImgs.files);
      if (!validacaoArquivos.valido) {
        mostrarNotificacao("❌ ERRO NO UPLOAD:\n" + validacaoArquivos.erros.join('\n'), 'error');
        return;
      }

      const btnSubmit = document.getElementById("formEditarProduto").querySelector('button[type="submit"]');
      const textoOriginal = btnSubmit?.textContent;
      
      if (btnSubmit) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Processando...';
      }

      try {
        for (let i = 0; i < inputImgs.files.length; i++) {
          novasImgs.push(await lerImagemDataUrl(inputImgs.files[i]));
        }
      } catch (error) {
        console.error("Erro ao processar:", error);
        mostrarNotificacao("❌ Erro ao processar imagens.", 'error');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = textoOriginal;
        }
        return;
      }
    }

    try {
      await updateDoc(doc(db, "produtos", id), {
        nome,
        quantidade: qtd,
        preco,
        comentario,
        imagens: novasImgs,
        updatedAt: new Date()
      });

      fecharModalEdicao();
      mostrarNotificacao("✅ Produto atualizado!", 'success');
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      mostrarNotificacao("❌ Erro ao atualizar.", 'error');
    }
  };
};

const comentarioInput = document.getElementById("comentario");
const contadorComentario = document.getElementById("contador-comentario");
if (comentarioInput && contadorComentario) {
  comentarioInput.addEventListener("input", () => {
    contadorComentario.textContent = `${comentarioInput.value.length} / ${LIMITES.comentario}`;
  });
}

console.log("✅ Gerenciamento de Produtos inicializado - TODAS as validações ativas");
console.log("📋 Validações: Upload de imagens, Limites de campos, Duplicação, Pesquisa");