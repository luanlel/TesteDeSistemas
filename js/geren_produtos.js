import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const produtoForm = document.getElementById("produtoForm");
const tabelaEstoque = document.getElementById("tabelaEstoque").querySelector("tbody");
const produtosRef = collection(db, "produtos");

produtoForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const quantidade = document.getElementById("quantidade").value;
  const preco = document.getElementById("preco").value;
  const categoria = document.getElementById("categoria").value;

  if (nome && quantidade && preco && categoria) {
    try {
      await addDoc(produtosRef, {
        nome: nome,
        quantidade: parseInt(quantidade),
        preco: parseFloat(preco),
        categoria: categoria,
      });

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
      
      if (produto.quantidade > 0) {
        const id = docSnap.id;
        const linha = document.createElement("tr");
        linha.innerHTML = `
          <td>${String(contadorID).padStart(3, "0")}</td>
          <td>${produto.nome}</td>
          <td>${produto.quantidade}</td>
          <td>${produto.preco}</td>
          <td>${produto.categoria || 'N/A'}</td>
          <td><button onclick="excluirProduto('${id}')">Excluir</button></td>
        `;
        tabelaEstoque.appendChild(linha);
        contadorID++;
      }
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
