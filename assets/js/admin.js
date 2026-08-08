import { auth } from "./firebase-config.js";
import { createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const EMAIL_DOMAIN = "web.liveconsultoria.com.br";

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

const adminAuthDiv = document.getElementById("admin-auth");
const adminPanelDiv = document.getElementById("admin-panel");
const formAdminAuth = document.getElementById("form-admin-auth");
const adminError = document.getElementById("admin-error");

const formCreateUser = document.getElementById("form-create-user");
const createError = document.getElementById("create-error");
const successMsg = document.getElementById("success-msg");
const btnCreate = document.getElementById("btn-create");

// Simples proteção de frontend (Obviamente em um cenário real isso deveria ser validado no Backend)
formAdminAuth.addEventListener("submit", (e) => {
  e.preventDefault();
  const pass = document.getElementById("master-password").value;
  if (pass === "admin123") { // Senha mestra provisória
    adminAuthDiv.classList.add("hidden");
    adminPanelDiv.classList.remove("hidden");
  } else {
    adminError.textContent = "Senha incorreta.";
    adminError.classList.remove("hidden");
  }
});

formCreateUser.addEventListener("submit", async (e) => {
  e.preventDefault();
  const phone = document.getElementById("new-phone").value;
  const password = document.getElementById("new-password").value;
  
  try {
    createError.classList.add("hidden");
    successMsg.style.display = "none";
    btnCreate.disabled = true;
    btnCreate.textContent = "Criando...";
    
    const email = syntheticEmail(phone);
    
    // Cria o usuário
    await createUserWithEmailAndPassword(auth, email, password);
    
    // O Firebase Auth automaticamente faz o login do usuário recém criado.
    // Como estamos no painel Admin, precisamos deslogá-lo imediatamente para não perdermos a sessão
    await signOut(auth);
    
    successMsg.textContent = `Acesso criado com sucesso! O cliente já pode logar usando o telefone ${phone} e a senha gerada.`;
    successMsg.style.display = "block";
    
    // Limpar
    document.getElementById("new-phone").value = "";
    document.getElementById("new-password").value = "Live2026"; // Reseta para uma senha padrão
    
  } catch (error) {
    createError.textContent = "Erro ao criar: " + error.message;
    createError.classList.remove("hidden");
  } finally {
    btnCreate.disabled = false;
    btnCreate.textContent = "Criar Acesso";
  }
});
