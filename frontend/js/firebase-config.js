import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ============================================
// ✅ CONFIGURAÇÃO CORRETA DO FIREBASE
// ============================================
// Valores obtidos do Firebase Console
// Screenshot: 07/12/2025 14:09
// ============================================

const firebaseConfig = {
  apiKey: "AIzaSyC8MASTlWG-rYMdAVQGfDm5zP-IGtdp42Q",
  authDomain: "lanchonetetestedesistemas.firebaseapp.com",
  projectId: "lanchonetetestedesistemas",
  storageBucket: "lanchonetetestedesistemas.firebasestorage.app",
  messagingSenderId: "983784344399",
  appId: "1:983784344399:web:bd76034c939f3dffcc533a"
};

console.log('✅ Firebase Config CORRETO carregado');
console.log('📦 Projeto:', firebaseConfig.projectId);
console.log('🔑 API Key:', firebaseConfig.apiKey.substring(0, 20) + '...');

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('✅ Firebase inicializado com sucesso');