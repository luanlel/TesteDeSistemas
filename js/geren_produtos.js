import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const produtoForm = document.getElementById("produtoForm");
const tabelaEstoque = document.getElementById("tabelaEstoque").querySelector("tbody");
const produtosRef = collection(db, "produtos");

produtoForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  // coletar e normalizar valores
  let nome = document.getElementById("nome").value.trim();
  let quantidade = document.getElementById("quantidade").value;
  let preco = document.getElementById("preco").value;
  // aplicar limites do lado do cliente
  if (nome.length > 120) nome = nome.slice(0, 120);
  quantidade = Number(quantidade);
  preco = Number(preco);
  const inputImagem = document.getElementById('imagem');

  // Helper para ler arquivo como dataURL
  const lerImagemDataUrl = (file) => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  // Validações adicionais
  let valido = true;
  if (!nome) { document.getElementById('erro-nome').textContent = 'Digite o nome do produto.'; valido = false; } else { document.getElementById('erro-nome').textContent = ''; }
  if (!Number.isInteger(quantidade) || quantidade < 0 || quantidade > 100000) { document.getElementById('erro-quantidade').textContent = 'Quantidade inválida.'; valido = false; } else { document.getElementById('erro-quantidade').textContent = ''; }
  if (isNaN(preco) || preco <= 0 || preco > 1000000) { document.getElementById('erro-preco').textContent = 'Preço inválido.'; valido = false; } else { document.getElementById('erro-preco').textContent = ''; }

  if (valido) {
    try {
      const docData = {
        nome: nome,
        quantidade: parseInt(quantidade),
        preco: parseFloat(preco),
      };

      if (inputImagem && inputImagem.files && inputImagem.files[0]) {
        try {
          const dataUrl = await lerImagemDataUrl(inputImagem.files[0]);
          docData.imagemDataUrl = dataUrl;
        } catch (err) {
          console.warn('Erro ao ler imagem local:', err);
        }
      }

      await addDoc(produtosRef, docData);

      produtoForm.reset();
      console.log("Produto adicionado com sucesso!");
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
    }
  }
});

function carregarProdutos() {
  onSnapshot(produtosRef, (snapshot) => {
    tabelaEstoque.innerHTML = "";
    let contadorID = 1;

    snapshot.forEach((docSnap) => {
      const produto = docSnap.data();
      const id = docSnap.id;

      // Cria a linha da tabela
      const linha = document.createElement("tr");

      // Exibe a quantidade e status visual
      const statusEstoque =
        produto.quantidade === 0
          ? `<span style="color: red; font-weight: bold;">Esgotado</span>`
          : produto.quantidade;

      // Aplica cor diferente para itens esgotados
      const estiloLinha = produto.quantidade === 0 ? "style='background-color: #ffe6e6;'" : "";

      linha.innerHTML = `
        <tr ${estiloLinha}>
          <td>${String(contadorID).padStart(3, "0")}</td>
          <td>${produto.nome}</td>
          <td>${statusEstoque}</td>
          <td>R$ ${parseFloat(produto.preco).toFixed(2)}</td>
          <td>
            <button class="btn-editar" onclick="abrirEditarProduto('${id}')">Editar</button>
            <button class="btn-excluir" onclick="excluirProduto('${id}')">Excluir</button>
          </td>
        </tr>
      `;

      tabelaEstoque.appendChild(linha);
      contadorID++;
    });
  });
}


window.excluirProduto = async function (id) {
  try {
    await deleteDoc(doc(db, "produtos", id));
    console.log("Produto excluído com sucesso!");
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
  }
};

carregarProdutos();

    window.abrirEditarProduto = async function (id) {
      try {
        const produtosRef = collection(db, "produtos");
        const snapshot = await getDocs(produtosRef);
        const docSnap = snapshot.docs.find(d => d.id === id);
        if (!docSnap) return alert('Produto não encontrado');
        const p = docSnap.data();

        let modal = document.getElementById('modalEdicaoProduto');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'modalEdicaoProduto';
          modal.className = 'modal-overlay';
          modal.innerHTML = `
            <div class="modal-card">
              <h3>Editar Produto</h3>
                  <form id="formEditarProduto">
                    <div><label>Nome:</label><input id="editNome" required></div>
                    <div><label>Quantidade:</label><input id="editQuantidade" type="number" required></div>
                    <div><label>Preço:</label><input id="editPreco" type="number" step="0.01" required></div>
                    <div><label>Imagem atual:</label><div id="previewImagem" style="margin-top:6px"></div></div>
                    <div><label>Trocar imagem:</label><input id="editImagem" type="file" accept="image/*"></div>
                    <div style="display:flex;gap:8px;align-items:center;margin-top:6px;">
                      <button type="submit" class="btn-primary">Salvar</button>
                      <button type="button" id="removerImagem" class="btn-secondary">Remover imagem</button>
                      <button type="button" id="cancelEdit" class="btn-secondary">Cancelar</button>
                    </div>
                  </form>
            </div>`;
          document.body.appendChild(modal);

          const cancelar = () => modal.remove();
          document.getElementById('cancelEdit').addEventListener('click', cancelar);

          // Preview da imagem atual
          const previewDiv = document.getElementById('previewImagem');
          previewDiv.innerHTML = p.imagemDataUrl ? `<img src="${p.imagemDataUrl}" style="max-width:160px;border-radius:8px;object-fit:cover;display:block" />` : '<span class="small-muted">Sem imagem</span>';

          document.getElementById('removerImagem').addEventListener('click', async ()=>{
            if (!confirm('Remover a imagem deste produto?')) return;
            try {
              await updateDoc(doc(db, 'produtos', id), { imagemDataUrl: null });
              alert('Imagem removida');
              carregarProdutos();
              cancelar();
            } catch (err) {
              console.error('Erro ao remover imagem', err);
              alert('Erro ao remover imagem');
            }
          });

          document.getElementById('formEditarProduto').addEventListener('submit', async (e)=>{
            e.preventDefault();
            const novo = document.getElementById('editNome').value.trim();
            const qtd = parseInt(document.getElementById('editQuantidade').value);
            const preco = parseFloat(document.getElementById('editPreco').value);
            const inputEditImg = document.getElementById('editImagem');

            // Função para ler arquivo
            const lerImagemDataUrl = (file) => new Promise((res, rej) => {
              const reader = new FileReader();
              reader.onload = () => res(reader.result);
              reader.onerror = rej;
              reader.readAsDataURL(file);
            });

            try {
              const updates = { nome: novo, quantidade: qtd, preco: preco };
              if (inputEditImg && inputEditImg.files && inputEditImg.files[0]) {
                try {
                  updates.imagemDataUrl = await lerImagemDataUrl(inputEditImg.files[0]);
                } catch (err) {
                  console.warn('Erro ao ler nova imagem:', err);
                }
              }
              await updateDoc(doc(db, 'produtos', id), updates);
              modal.remove();
            } catch (err) {
              console.error('Erro ao atualizar produto', err);
              alert('Erro ao atualizar produto');
            }
          });
        }

        document.getElementById('editNome').value = p.nome || '';
        document.getElementById('editQuantidade').value = p.quantidade || 0;
        document.getElementById('editPreco').value = p.preco || 0;
        
      } catch (error) {
        console.error(error);
        alert('Erro ao abrir edição');
      }
    }
