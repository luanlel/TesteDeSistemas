import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8MASTlWG-rYMdAVQGfDm5zP-IGtdp42Q",
  authDomain: "lanchonetetestedesistemas.firebaseapp.com",
  projectId: "lanchonetetestedesistemas",
  storageBucket: "lanchonetetestedesistemas.appspot.com",
  messagingSenderId: "983784344399",
  appId: "1:983784344399:web:bd76034c939f3dffcc533a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
