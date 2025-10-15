import { auth, db } from "./firebase-config.js";
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const cadastroForm = document.getElementById("cadastroForm");
const userTable = document.getElementById("userTable");
const telefoneInput = document.getElementById("telefone");

if (telefoneInput) {
  telefoneInput.addEventListener("input", function () {
    let numero = this.value.replace(/\D/g, "");
    if (numero.length > 11) {
      numero = numero.slice(0, 11);
    }
    if (numero.length > 0) {
      numero = "(" + numero;
    }
    if (numero.length > 3) {
      numero = numero.slice(0, 3) + ") " + numero.slice(3);
    }
    if (numero.length > 10) {
      numero = numero.slice(0, 10) + "-" + numero.slice(10);
    }
    this.value = numero;
  });
}

cadastroForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;
  const telefone = document.getElementById("telefone").value;

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      senha
    );
    const user = userCredential.user;

    await setDoc(doc(db, "usuarios", user.uid), {
      nomeCompleto: nome,
      email: email,
      telefone: telefone,
    });

    alert("Usuário cadastrado com sucesso!");
    cadastroForm.reset();
    carregarUsuarios(); 
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    alert(`Erro ao cadastrar: ${error.message}`);
  }
});

async function carregarUsuarios() {
  try {
    const usuariosRef = collection(db, "usuarios");
    const snapshot = await getDocs(usuariosRef);

    userTable.innerHTML = "";

    if (snapshot.empty) {
      userTable.innerHTML = '<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>';
      return;
    }

    snapshot.forEach(docSnap => {
      const usuario = docSnap.data();
      const id = docSnap.id;

      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td>${id.substring(0, 8)}...</td>
        <td>${usuario.nomeCompleto || usuario.nome || 'N/A'}</td>
        <td>${usuario.email || 'N/A'}</td>
        <td>${usuario.telefone || 'N/A'}</td>
        <td class="acoes-coluna">
          <button class="btn-editar" data-id="${id}">Editar</button>
          <button class="btn-secondary" data-email="${usuario.email}" data-action="reset">Redefinir senha</button>
          <button class="btn-excluir" data-id="${id}">Excluir</button>
        </td>
      `;
      userTable.appendChild(linha);
    });
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    alert("Não foi possível carregar a lista de usuários.");
  }
}

async function excluirUsuario(id) {
  if (confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
    try {
      await deleteDoc(doc(db, "usuarios", id));
      alert("Usuário excluído com sucesso!");
      carregarUsuarios();
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      alert("Erro ao excluir usuário.");
    }
  }
}

// Edição de usuário
async function abrirEditarUsuario(id) {
  try {
    const usuariosRef = collection(db, 'usuarios');
    const snapshot = await getDocs(usuariosRef);
    const docSnap = snapshot.docs.find(d => d.id === id);
    if (!docSnap) return alert('Usuário não encontrado');
    const u = docSnap.data();

    let modal = document.getElementById('modalEdicaoUsuario');
    if (!modal) {
      modal = document.createElement('div');
        modal.id = 'modalEdicaoUsuario';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal-card">
            <h3>Editar Usuário</h3>
            <form id="formEditarUsuario">
              <div><label>Nome:</label><input id="editUserNome" required></div>
              <div><label>Email:</label><input id="editUserEmail" type="email" required></div>
              <div><label>Telefone:</label><input id="editUserTelefone"></div>
              <div class="actions-right">
                <button type="submit" class="btn-primary">Salvar</button>
                <button type="button" id="cancelEditUser" class="btn-secondary">Cancelar</button>
              </div>
            </form>
          </div>`;
        document.body.appendChild(modal);

        document.getElementById('cancelEditUser').addEventListener('click', ()=> modal.remove());
        document.getElementById('formEditarUsuario').addEventListener('submit', async (e)=>{
        e.preventDefault();
        const nome = document.getElementById('editUserNome').value.trim();
        const email = document.getElementById('editUserEmail').value.trim();
        const telefone = document.getElementById('editUserTelefone').value.trim();
        try {
          await setDoc(doc(db, 'usuarios', id), { nomeCompleto: nome, email, telefone }, { merge: true });
          modal.remove();
          carregarUsuarios();
        } catch (err) {
          console.error('Erro ao atualizar usuário', err);
          alert('Erro ao atualizar usuário');
        }
      });
    }

    document.getElementById('editUserNome').value = u.nomeCompleto || u.nome || '';
    document.getElementById('editUserEmail').value = u.email || '';
    document.getElementById('editUserTelefone').value = u.telefone || '';
  } catch (error) {
    console.error(error);
    alert('Erro ao abrir edição de usuário');
  }
}

document.addEventListener("DOMContentLoaded", carregarUsuarios);

userTable.addEventListener('click', async (e) => {
  if (e.target.classList.contains('btn-excluir')) {
    const userId = e.target.dataset.id;
    excluirUsuario(userId);
  } else if (e.target.classList.contains('btn-editar')) {
    const userId = e.target.dataset.id;
    abrirEditarUsuario(userId);
  } else if (e.target.dataset && e.target.dataset.action === 'reset') {
    const email = e.target.dataset.email;
    if (email) {
      if (confirm(`Enviar email de redefinição de senha para ${email}?`)) {
        try {
          await sendPasswordResetEmail(auth, email);
          alert('Email de redefinição enviado com sucesso.');
        } catch (err) {
          console.error('Erro ao enviar email de redefinição:', err);
          alert('Erro ao enviar email de redefinição.');
        }
      }
    } else {
      alert('Usuário não possui email cadastrado.');
    }
  }
});