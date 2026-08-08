import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Substitua pelas credenciais reais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBdxiZKq6QFRexkFQgXGc8JKidu-KWJ4ww",
  authDomain: "julio-bot-ecd02.firebaseapp.com",
  projectId: "julio-bot-ecd02",
  storageBucket: "julio-bot-ecd02.firebasestorage.app",
  messagingSenderId: "285462944271",
  appId: "1:285462944271:web:4eec8ca46a5c0cad8c217a",
  measurementId: "G-M462B61M9C"

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
