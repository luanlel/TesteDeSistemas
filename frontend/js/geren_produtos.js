import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const tabela = document.querySelector("#tabelaEstoque tbody");
const modal = document.getElementById("modalEditar");

let produtoEditandoId = null;

async function carregarProdutos() {
  tabela.innerHTML = "<tr><td colspan='6'>Carregando...</td></tr>";

  const snap = await getDocs(collection(db, "produtos"));
  tabela.innerHTML = "";

  snap.forEach((docSnap) => {
    const p = docSnap.data();

    const linha = document.createElement("tr");
    linha.innerHTML = `
      <td>${docSnap.id}</td>
      <td>${p.nome}</td>
      <td>${p.quantidade}</td>
      <td>R$ ${p.preco}</td>
      <td>${p.comentario || ""}</td>
      <td>
        <button class="btn-editar" data-id="${docSnap.id}">Editar</button>
        <button class="btn-excluir" data-id="${docSnap.id}">Excluir</button>
      </td>
    `;
    tabela.appendChild(linha);
  });

  ativarBotoes();
}

function ativarBotoes() {
  document.querySelectorAll(".btn-excluir").forEach((btn) => {
    btn.onclick = async () => {
      if (!confirm("Excluir produto?")) return;
      await deleteDoc(doc(db, "produtos", btn.dataset.id));
      carregarProdutos();
    };
  });

  document.querySelectorAll(".btn-editar").forEach((btn) => {
    btn.onclick = () => abrirModalEditar(btn.dataset.id);
  });
}


async function abrirModalEditar(id) {
  produtoEditandoId = id;

  const snap = await getDoc(doc(db, "produtos", id));
  const p = snap.data();

  document.getElementById("editNome").value = p.nome;
  document.getElementById("editQuantidade").value = p.quantidade;
  document.getElementById("editPreco").value = p.preco;
  document.getElementById("editComentario").value = p.comentario || "";

  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}


document.getElementById("btnFecharModal").onclick = fecharModal;

function fecharModal() {
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
}

document.getElementById("editarForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  await updateDoc(doc(db, "produtos", produtoEditandoId), {
    nome: document.getElementById("editNome").value,
    quantidade: document.getElementById("editQuantidade").value,
    preco: document.getElementById("editPreco").value,
    comentario: document.getElementById("editComentario").value,
  });

  fecharModal();
  carregarProdutos();
});


document.getElementById("produtoForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  await addDoc(collection(db, "produtos"), {
    nome: document.getElementById("nome").value,
    quantidade: Number(document.getElementById("quantidade").value),
    preco: Number(document.getElementById("preco").value),
    comentario: document.getElementById("comentario").value,
    criadoEm: new Date().toISOString()
  });

  e.target.reset();
  carregarProdutos();
});

// ------------------------------
carregarProdutos();
