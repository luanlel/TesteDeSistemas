// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC8MASTlWG-rYMdAVQGfDm5zP-IGtdp42Q",
  authDomain: "lanchonetetestedesistemas.firebaseapp.com",
  projectId: "lanchonetetestedesistemas",
  storageBucket: "lanchonetetestedesistemas.firebasestorage.app",
  messagingSenderId: "983784344399",
  appId: "1:983784344399:web:bd76034c939f3dffcc533a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);