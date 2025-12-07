// ============================================
// TESTE DE DIAGNÓSTICO COMPLETO
// ============================================
// Este arquivo verifica EXATAMENTE onde está o problema
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { 
  getAuth, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ============================================
// CONFIGURAÇÃO FIREBASE
// ============================================
const firebaseConfig = {
  apiKey: "AIzaSyBiguKTELhL6nJHyi52p7QkhG2BS_dpQJA",
  authDomain: "papelaria-f49d8.firebaseapp.com",
  projectId: "papelaria-f49d8",
  storageBucket: "papelaria-f49d8.firebasestorage.app",
  messagingSenderId: "309560032967",
  appId: "1:309560032967:web:b6bee43e2f57c1dd5f6c88"
};

console.log('═══════════════════════════════════════════════════════════');
console.log('🔬 TESTE DE DIAGNÓSTICO COMPLETO');
console.log('═══════════════════════════════════════════════════════════');
console.log('');

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log('✅ Firebase inicializado');
console.log('');

// ============================================
// TESTE 1: VERIFICAR PROJETO
// ============================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📋 TESTE 1: Verificar Projeto Firebase');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Config enviada:');
console.log('  projectId:', firebaseConfig.projectId);
console.log('  authDomain:', firebaseConfig.authDomain);
console.log('');
console.log('Firestore configurado:');
console.log('  app.options.projectId:', app.options.projectId);
console.log('  db._databaseId.projectId:', db._databaseId?.projectId);
console.log('  db._databaseId.database:', db._databaseId?.database);
console.log('');

// ============================================
// TESTE 2: VERIFICAR AUTENTICAÇÃO
// ============================================
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔐 TESTE 2: Verificar Autenticação');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('✅ Usuário AUTENTICADO');
    console.log('  Email:', user.email);
    console.log('  UID:', user.uid);
    console.log('  Provider:', user.providerData[0]?.providerId);
    console.log('');
    
    // ============================================
    // TESTE 3: BUSCAR DOCUMENTO ESPECÍFICO
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 TESTE 3: Buscar Documento Específico');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Tentando buscar: feedbacks/F14mBOwH2eJe4G9Cy9C5');
    
    try {
      const docRef = doc(db, 'feedbacks', 'F14mBOwH2eJe4G9Cy9C5');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        console.log('✅ DOCUMENTO ENCONTRADO!');
        console.log('  Dados:', docSnap.data());
        console.log('  Fonte:', docSnap.metadata.fromCache ? 'CACHE' : 'SERVIDOR');
      } else {
        console.error('❌ DOCUMENTO NÃO EXISTE!');
        console.error('  ⚠️ Isso significa que estamos no PROJETO ERRADO!');
      }
    } catch (error) {
      console.error('❌ ERRO ao buscar documento:');
      console.error('  Código:', error.code);
      console.error('  Mensagem:', error.message);
    }
    
    console.log('');
    
    // ============================================
    // TESTE 4: LISTAR TODOS OS FEEDBACKS
    // ============================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 TESTE 4: Listar TODOS os Feedbacks (SEM orderBy)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const feedbacksRef = collection(db, 'feedbacks');
      console.log('📁 Referência criada:', feedbacksRef.path);
      
      console.log('⏳ Executando getDocs()...');
      const snapshot = await getDocs(feedbacksRef);
      
      console.log('📊 Resultado:');
      console.log('  Total de documentos:', snapshot.size);
      console.log('  Vazio?', snapshot.empty);
      console.log('  Fonte:', snapshot.metadata.fromCache ? 'CACHE ⚠️' : 'SERVIDOR ✅');
      console.log('');
      
      if (snapshot.size > 0) {
        console.log('✅ DOCUMENTOS ENCONTRADOS!');
        console.log('');
        snapshot.forEach((doc, index) => {
          console.log(`  ${index + 1}. Doc ID: ${doc.id}`);
          const data = doc.data();
          console.log('     userName:', data.userName);
          console.log('     userEmail:', data.userEmail);
          console.log('     status:', data.status);
          console.log('     timestamp:', data.timestamp);
          console.log('');
        });
      } else {
        console.error('❌ NENHUM DOCUMENTO ENCONTRADO!');
        console.error('');
        console.error('🔍 POSSÍVEIS CAUSAS:');
        console.error('  1. Projeto Firebase errado');
        console.error('  2. Database errado');
        console.error('  3. Coleção com nome diferente');
        console.error('  4. Cache offline vazio');
        console.error('');
      }
      
    } catch (error) {
      console.error('❌ ERRO ao listar feedbacks:');
      console.error('  Código:', error.code);
      console.error('  Mensagem:', error.message);
      console.error('  Stack:', error.stack);
    }
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 TESTES CONCLUÍDOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 RESUMO:');
    console.log('  ✅ Projeto configurado:', app.options.projectId);
    console.log('  ✅ Usuário autenticado:', user.email);
    console.log('  ❓ Documentos encontrados: Veja acima');
    console.log('');
    console.log('═══════════════════════════════════════════════════════════');
    
  } else {
    console.error('❌ USUÁRIO NÃO AUTENTICADO!');
    console.error('  Faça login primeiro!');
  }
});

console.log('⏳ Aguardando resposta do Firebase Auth...');
console.log('');