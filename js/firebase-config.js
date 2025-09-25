import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC8MASTlWG-rYMdAVQGfDm5zP-IGtdp42Q",
  authDomain: "lanchonetetestedesistemas.firebaseapp.com",
  projectId: "lanchonetetestedesistemas",
  storageBucket: "lanchonetetestedesistemas.firebasestorage.app",
  messagingSenderId: "983784344399",
  appId: "1:983784344399:web:bd76034c939f3dffcc533a"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);