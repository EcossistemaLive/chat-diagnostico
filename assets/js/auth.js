import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { auth } from "./firebase-config.js";

const EMAIL_DOMAIN = "web.vidiceo.com.br";

function normalizePhone(raw) {
  const digits = (raw || "").replace(/\D/g, "");
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
    return `55${digits}`;
  }
  return digits;
}

function syntheticEmail(phone) {
  return `${normalizePhone(phone)}@${EMAIL_DOMAIN}`;
}

export async function loginClient(phone, password) {
  // Para mock, caso o Firebase real não esteja configurado ainda, comente a linha abaixo 
  // e apenas retorne true ou gere um alert.
  const email = syntheticEmail(phone);
  await signInWithEmailAndPassword(auth, email, password);
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
