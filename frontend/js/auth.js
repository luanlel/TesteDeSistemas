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

export async function login(email, senha) {
  try {
    console.log('🔐 Tentando login:', email);
    // ===== Verificação reCAPTCHA (chame o endpoint do backend) =====
    try {
      if (window.grecaptcha && typeof grecaptcha.execute === 'function') {
        const SITE_KEY = '6LcvSicsAAAAAHWearj0zp2oywaf_mkh9-oDsALe'; // reCAPTCHA v3
        const token = await grecaptcha.execute(SITE_KEY, { action: 'login' });

        const verifyResp = await fetch('/api/auth/verify-recaptcha', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const verifyJson = await verifyResp.json();
        if (!verifyJson.success) {
          console.error('❌ reCAPTCHA falhou:', verifyJson);
          alert('reCAPTCHA falhou. Tente novamente.');
          return false;
        }
      } else {
        console.warn('⚠️ grecaptcha não disponível. Pulando verificação reCAPTCHA.');
      }
    } catch (recapErr) {
      console.error('Erro durante verificação reCAPTCHA:', recapErr);
      alert('Erro ao validar reCAPTCHA. Tente novamente.');
      return false;
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, senha);
    const user = userCredential.user;

    const token = await user.getIdToken();
    localStorage.setItem("token", token);

    console.log("🟢 Token JWT salvo no localStorage.");

    // Verificar admin
    const adminQuery = query(collection(db, "admins"), where("email", "==", email));
    const adminSnap = await getDocs(adminQuery);

    if (!adminSnap.empty) {
      localStorage.setItem("logado", "admin");
      window.location.href = "/html/pag_adm.html";
      return true;
    }

    const userDoc = await getDoc(doc(db, "usuarios", user.uid));
    if (userDoc.exists()) {
      localStorage.setItem("logado", "usuario");
      window.location.href = "/html/index.html";
      return true;
    }

    return false;

  } catch (error) {
    console.error("❌ Erro no login:", error);
    return false;
  }
}



export async function logout() {
  console.log('👋 Fazendo logout...');
  await signOut(auth);
  localStorage.removeItem("logado");
  console.log('✅ Logout completo');
  window.location.href = "/html/index.html";
}


export function verificarLoginAdmin(onSuccess) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 verificarLoginAdmin() INICIADO');
  console.log('📍 URL:', window.location.href);
  console.log('📍 Pathname:', window.location.pathname);
  

  const logadoComo = localStorage.getItem("logado");
  console.log('📝 localStorage["logado"]:', logadoComo);
  
  if (logadoComo !== "admin") {
    console.log('⚠️ localStorage NÃO indica admin');
    console.log('⏳ Mas vou AGUARDAR Firebase Auth antes de redirecionar...');
  } else {
    console.log('✅ localStorage indica: É ADMIN');
  }
  
  console.log('⏳ Aguardando resposta do Firebase Auth...');
  
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
    
    const logadoComoAgora = localStorage.getItem("logado");
    console.log('📝 localStorage["logado"] atual:', logadoComoAgora);
    
    if (logadoComoAgora !== "admin") {
      console.log('❌ localStorage NÃO é "admin"');
      console.log('🔍 Verificando no banco de dados se é admin...');
      

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