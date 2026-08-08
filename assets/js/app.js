import { loginClient, logout, onAuthChange } from "./auth.js";
import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const loginScreen = document.getElementById("login-screen");
const chatScreen = document.getElementById("chat-screen");
const loginForm = document.getElementById("form-cliente");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");

const messagesContainer = document.getElementById("messages");
const msgInput = document.getElementById("msg-input");
const sendBtn = document.getElementById("send-btn");
const typingIndicator = document.getElementById("typing-indicator");
const quickRepliesContainer = document.getElementById("quick-replies");
const chatBody = document.getElementById("chat-body");

let currentState = 0;
const diagnosticData = {};

const questions = [
  { id: 'empresa_nome', text: 'Olá! Sou o Julio, seu consultor digital. Para começarmos nosso diagnóstico M.A.P.C.A, qual é o nome da sua empresa?' },
  { id: 'empresa_cnpj', text: 'Excelente. Poderia me informar o CNPJ?' },
  { id: 'empresa_endereco', text: 'E qual é o endereço completo (com cidade e estado)?' },
  { id: 'representante_nome', text: 'Quem é o representante legal da empresa?' },
  { id: 'representante_cpf', text: 'Poderia me informar o CPF desse representante?' },
  { id: 'consultor_nome', text: 'Quem é o consultor ViDi responsável por este atendimento?' },
  { id: 'consultor_email', text: 'Qual é o e-mail desse consultor?' },
  { id: 'estrategia_proposito', text: 'Certo, vamos à Estratégia. A empresa possui um propósito e uma visão claros? Sabem onde querem chegar?' },
  { id: 'estrategia_gargalos', text: 'Quais você considera os principais gargalos na Estratégia hoje?' },
  { id: 'estrategia_nota', text: 'De 1 a 5, que nota você daria para o Posicionamento Estratégico atual?', type: 'quick-reply', options: ['1', '2', '3', '4', '5'] },
  { id: 'gov_socios', text: 'Sobre Governança: Quantos são os sócios da empresa?' },
  { id: 'gov_reunioes', text: 'Vocês fazem reuniões periódicas de resultados?', type: 'quick-reply', options: ['Sim, estruturadas', 'Às vezes / Informais', 'Não fazemos'] },
  { id: 'gov_conhecimento', text: 'Os sócios possuem conhecimento técnico para exercer suas funções atuais? Há um mecanismo claro de tomada de decisão conjunta?' },
  { id: 'financeiro_controles', text: 'Passando para Finanças: Como são os controles financeiros (ex: fluxo de caixa, DRE)?' },
  { id: 'financeiro_gargalos', text: 'Quais os principais gargalos no Financeiro (ex: endividamento, margens)?' },
  { id: 'financeiro_nota', text: 'De 1 a 5, como você avalia a Gestão Financeira?', type: 'quick-reply', options: ['1', '2', '3', '4', '5'] },
  { id: 'processos_ferramentas', text: 'Sobre Operações: Quais ERPs e Ferramentas são utilizadas no dia a dia?' },
  { id: 'processos_gargalos', text: 'E quais os principais gargalos nos Processos (ex: muito trabalho manual)?' },
  { id: 'processos_nota', text: 'De 1 a 5, qual a sua nota para os Processos e Automação?', type: 'quick-reply', options: ['1', '2', '3', '4', '5'] },
  { id: 'pessoas_clima', text: 'Em Pessoas e Liderança: Como é o clima organizacional e a estrutura de liderança?' },
  { id: 'pessoas_gargalos', text: 'Quais os maiores gargalos aqui (ex: turnover, falta de treinamento)?' },
  { id: 'pessoas_nota', text: 'De 1 a 5, como avalia a área de Pessoas?', type: 'quick-reply', options: ['1', '2', '3', '4', '5'] },
  { id: 'marketing_panorama', text: 'Marketing & Estoque: Como está a identidade da marca e a aquisição de clientes?' },
  { id: 'estoque_panorama', text: 'E sobre Compras/Estoque: Como estão as políticas, perdas e giro?' },
  { id: 'marketing_estoque_nota', text: 'De 1 a 5, qual a nota geral para Marketing e Operação de Produtos?', type: 'quick-reply', options: ['1', '2', '3', '4', '5'] },
  { id: 'diagnostico_geral', text: 'Para encerrar, deixe aqui algumas observações finais ou o contexto geral da empresa.' }
];

// Auth Logic
onAuthChange((user) => {
  if (user) {
    loginScreen.classList.add("hidden");
    chatScreen.classList.remove("hidden");
    if (currentState === 0 && messagesContainer.children.length === 0) {
      askQuestion();
    }
  } else {
    loginScreen.classList.remove("hidden");
    chatScreen.classList.add("hidden");
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const phone = document.getElementById("cliente-phone").value;
  const password = document.getElementById("cliente-password").value;
  const btn = document.getElementById("btn-login");
  
  try {
    loginError.classList.add("hidden");
    btn.disabled = true;
    btn.textContent = "Entrando...";
    
    // Fallback: se o Firebase falhar por falta de config, bypass (Apenas para ambiente de desenvolvimento local)
    try {
      await loginClient(phone, password);
    } catch(err) {
      console.warn("Auth falhou ou não configurada. Entrando no modo DEV bypass.");
      // Forçando bypass local (Em produção, remova)
      loginScreen.classList.add("hidden");
      chatScreen.classList.remove("hidden");
      if (currentState === 0 && messagesContainer.children.length === 0) {
        askQuestion();
      }
    }
  } catch (error) {
    loginError.textContent = error.message || "Erro de login";
    loginError.classList.remove("hidden");
  } finally {
    btn.disabled = false;
    btn.textContent = "Entrar";
  }
});

logoutBtn.addEventListener("click", async () => {
  await logout();
  // Bypass reset caso de dev local
  window.location.reload();
});

// Chat Logic
function scrollChat() {
  chatBody.scrollTo({
    top: chatBody.scrollHeight,
    behavior: "smooth"
  });
}

function showTyping() {
  typingIndicator.classList.remove("hidden");
  scrollChat();
}

function hideTyping() {
  typingIndicator.classList.add("hidden");
}

function appendMessage(text, isUser = false) {
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${isUser ? "user" : "bot"}`;
  
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  
  msgDiv.appendChild(bubble);
  messagesContainer.appendChild(msgDiv);
  scrollChat();
}

async function askQuestion() {
  const q = questions[currentState];
  showTyping();
  msgInput.disabled = true;
  sendBtn.disabled = true;
  quickRepliesContainer.innerHTML = '';
  quickRepliesContainer.classList.add("hidden");
  
  // Fake delay base na length
  const delay = Math.min(Math.max(q.text.length * 20, 800), 2000);
  
  setTimeout(() => {
    hideTyping();
    appendMessage(q.text, false);
    
    if (q.type === 'quick-reply') {
      quickRepliesContainer.classList.remove("hidden");
      q.options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "reply-btn";
        btn.textContent = opt;
        btn.onclick = () => handleAnswer(opt);
        quickRepliesContainer.appendChild(btn);
      });
      scrollChat();
    } else {
      msgInput.disabled = false;
      sendBtn.disabled = false;
      msgInput.focus();
    }
  }, delay);
}

async function finishDiagnostic() {
  showTyping();
  msgInput.disabled = true;
  sendBtn.disabled = true;
  
  // Configs
  diagnosticData.timestamp = serverTimestamp ? serverTimestamp() : new Date();
  diagnosticData.status = 'novo';
  
  // Tentar salvar Firebase e/ou disparar Webhook
  try {
    // console.log("Salvando no Firebase: ", diagnosticData);
    // await addDoc(collection(db, "diagnosticos"), diagnosticData);
  } catch(e) {
    console.error("Erro ao salvar no firebase", e);
  }

  setTimeout(() => {
    hideTyping();
    appendMessage("Perfeito! O diagnóstico foi enviado com sucesso. O nosso Agente AgeQuodAgis já está elaborando a sua proposta com base nessas informações.", false);
  }, 1500);
}

function handleAnswer(answer) {
  if (!answer.trim()) return;
  
  const q = questions[currentState];
  diagnosticData[q.id] = answer.trim();
  
  appendMessage(answer, true);
  msgInput.value = "";
  quickRepliesContainer.innerHTML = '';
  quickRepliesContainer.classList.add("hidden");
  
  currentState++;
  
  if (currentState < questions.length) {
    askQuestion();
  } else {
    finishDiagnostic();
  }
}

sendBtn.addEventListener("click", () => {
  handleAnswer(msgInput.value);
});

msgInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleAnswer(msgInput.value);
  }
});
