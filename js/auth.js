import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ============================================
// LOGIN
// ============================================
export async function login(email, senha) {
  try {
    console.log('🔐 Tentando login:', email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;
    
    console.log('✅ Autenticação Firebase OK, UID:', user.uid);

    // Verificar se é admin
    const adminQuery = query(collection(db, "admins"), where("email", "==", email));
    const adminSnap = await getDocs(adminQuery);

    if (!adminSnap.empty) {
      console.log('👑 ADMIN DETECTADO!');
      console.log('📝 Setando localStorage: logado = admin');
      localStorage.setItem("logado", "admin");
      
      // VERIFICAR SE FOI SETADO
      const verificacao = localStorage.getItem("logado");
      console.log('✅ Verificação localStorage:', verificacao);
      
      console.log('🔀 Redirecionando para: ../html/pag_adm.html');
      window.location.href = "../html/pag_adm.html";
      return true;
    }

    // Verificar se é usuário comum
    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    if (userDoc.exists()) {
      console.log('👤 Usuário comum detectado');
      console.log('📝 Setando localStorage: logado = usuario');
      localStorage.setItem("logado", "usuario");
      
      console.log('🔀 Redirecionando para: ../html/index.html');
      window.location.href = "../html/index.html";
      return true;
    }

    console.warn('⚠️ Usuário não encontrado em admins nem usuarios');
    return false;
    
  } catch (error) {
    console.error("❌ Erro no login:", error);
    return false;
  }
}

// ============================================
// LOGOUT
// ============================================
export async function logout() {
  console.log('👋 Fazendo logout...');
  await signOut(auth);
  localStorage.removeItem("logado");
  console.log('✅ Logout completo');
  window.location.href = "../html/index.html";
}

// ============================================
// VERIFICAR LOGIN ADMIN - FINAL CORRIGIDO
// ============================================
export function verificarLoginAdmin(onSuccess) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 verificarLoginAdmin() INICIADO');
  console.log('📍 URL:', window.location.href);
  console.log('📍 Pathname:', window.location.pathname);
  
  // Verificar localStorage PRIMEIRO (mas NÃO redirecionar ainda)
  const logadoComo = localStorage.getItem("logado");
  console.log('📝 localStorage["logado"]:', logadoComo);
  
  if (logadoComo !== "admin") {
    console.log('⚠️ localStorage NÃO indica admin');
    console.log('⏳ Mas vou AGUARDAR Firebase Auth antes de redirecionar...');
  } else {
    console.log('✅ localStorage indica: É ADMIN');
  }
  
  console.log('⏳ Aguardando resposta do Firebase Auth...');
  
  // AGUARDAR Firebase Auth responder ANTES de tomar qualquer decisão
  onAuthStateChanged(auth, async (user) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔥 Firebase Auth RESPONDEU!');
    
    if (!user) {
      console.log('❌ Firebase: Nenhum usuário autenticado');
      console.log('🔀 Redirecionando para loja: index.html');
      localStorage.removeItem("logado");
      window.location.href = "index.html";
      return;
    }
    
    console.log('✅ Firebase: Usuário AUTENTICADO');
    console.log('📧 Email:', user.email);
    console.log('🆔 UID:', user.uid);
    
    // Agora verificar localStorage novamente
    const logadoComoAgora = localStorage.getItem("logado");
    console.log('📝 localStorage["logado"] atual:', logadoComoAgora);
    
    if (logadoComoAgora !== "admin") {
      console.log('❌ localStorage NÃO é "admin"');
      console.log('🔍 Verificando no banco de dados se é admin...');
      
      // Verificar no banco se é admin
      try {
        const adminQuery = query(collection(db, "admins"), where("email", "==", user.email));
        const adminSnap = await getDocs(adminQuery);
        
        if (!adminSnap.empty) {
          console.log('👑 ADMIN CONFIRMADO no banco de dados!');
          console.log('📝 Corrigindo localStorage...');
          localStorage.setItem("logado", "admin");
          console.log('✅ localStorage atualizado para: admin');
          console.log('🎉 Chamando onSuccess callback...');
          if (onSuccess) onSuccess();
          return;
        } else {
          console.log('❌ NÃO é admin no banco de dados');
          console.log('🔀 Redirecionando para loja: index.html');
          window.location.href = "index.html";
          return;
        }
      } catch (error) {
        console.error('❌ Erro ao verificar admin no banco:', error);
        console.log('🔀 Redirecionando para loja por segurança: index.html');
        window.location.href = "index.html";
        return;
      }
    }
    
    console.log('✅✅ TUDO VALIDADO! É ADMIN AUTENTICADO!');
    console.log('🎉 Chamando onSuccess callback...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (onSuccess) onSuccess();
  });
}

// ============================================
// VERIFICAR LOGIN USUÁRIO
// ============================================
export function verificarLoginUsuario(onSuccess) {
  console.log('🔍 verificarLoginUsuario() chamado');
  
  onAuthStateChanged(auth, (user) => {
    if (user && localStorage.getItem("logado") === "usuario") {
      console.log('✅ Usuário comum autenticado');
      if (onSuccess) onSuccess();
    } else {
      console.log('❌ Não é usuário comum');
      window.location.href = "index.html";
    }
  });
}

// ============================================
// IMPEDIR ADMIN DE ACESSAR LOJA
// ============================================
export function impedirAdminNaLoja() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🛡️ impedirAdminNaLoja() chamado');
  console.log('📍 URL:', window.location.href);
  
  const logadoComo = localStorage.getItem("logado");
  console.log('📝 localStorage["logado"]:', logadoComo);
  
  if (logadoComo === "admin") {
    console.log('⚠️⚠️ ADMIN DETECTADO TENTANDO ACESSAR LOJA!');
    console.log('🚫 BLOQUEANDO ACESSO!');
    console.log('🔀 Redirecionando para: pag_adm.html');
    alert('⚠️ Administradores não podem acessar a loja.\n\nVocê será redirecionado para o painel administrativo.');
    window.location.href = "pag_adm.html";
    return;
  }
  
  console.log('✅ Não é admin, acesso à loja permitido');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

console.log('✅ auth.js FINAL CORRIGIDO carregado');
console.log('📋 Funções disponíveis:');
console.log('   • login()');
console.log('   • logout()');
console.log('   • verificarLoginAdmin()');
console.log('   • verificarLoginUsuario()');
console.log('   • impedirAdminNaLoja()');