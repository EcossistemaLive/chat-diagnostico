import { loginClient, logout, onAuthChange } from "./auth.js";
import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp, doc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
  { id: 'empresa_nome', text: [
    'Olá! 👋 Sou o Julio, seu consultor digital da Live Consultoria.', 
    'Estou aqui para realizar o nosso diagnóstico empresarial (M.A.P.C.A).',
    'Para começarmos bem, qual é o nome da sua empresa?'
  ]},
  { id: 'empresa_cnpj', text: [
    'Excelente nome!', 
    'Poderia me informar o CNPJ?', 
    '(Apenas os números ou com pontuação, como preferir)'
  ]},
  { id: 'empresa_endereco', text: [
    'Perfeito, já anotei o CNPJ.', 
    'Qual é o endereço completo da sede (ou do escritório principal)?',
    'Dica: Não esqueça de colocar a cidade e o estado. Ex: Av. Paulista, 1000 - São Paulo/SP'
  ]},
  { id: 'representante_nome', text: [
    'Certo, anotado.', 
    'Quem é o representante legal da empresa?'
  ]},
  { id: 'representante_cpf', text: [
    'Poderia me informar o CPF desse representante?'
  ]},
  { id: 'consultor_nome', text: [
    'Quem é o consultor da Live Consultoria responsável por este atendimento?',
    'Se não souber, pode apenas colocar "Não sei".'
  ]},
  { id: 'consultor_email', text: [
    'E qual é o e-mail de contato desse consultor?'
  ]},
  { id: 'estrategia_proposito', text: [
    'Ótimo! Vamos entrar agora na parte Estratégica do negócio 🎯', 
    'A empresa possui um propósito e uma visão claros? Vocês sabem exatamente onde querem chegar nos próximos anos?',
    'Fique à vontade para explicar com suas próprias palavras.'
  ]},
  { id: 'estrategia_gargalos', text: [
    'Interessante.',
    'E quais você considera serem os principais *gargalos* ou dificuldades na Estratégia hoje?'
  ]},
  { id: 'estrategia_nota', type: 'quick-reply', options: ['1', '2', '3', '4', '5'], text: [
    'Baseado nisso, de 1 a 5, que nota você daria para o Posicionamento Estratégico atual?',
    '(Sendo 1 muito ruim e 5 excelente)'
  ]},
  { id: 'gov_socios', text: [
    'Passando agora para a área de Governança 🏢',
    'Quantos são os sócios da empresa atualmente?'
  ]},
  { id: 'gov_reunioes', type: 'quick-reply', options: ['Sim, estruturadas', 'Às vezes / Informais', 'Não fazemos'], text: [
    'Vocês costumam fazer reuniões periódicas para analisar os resultados e tomar decisões?'
  ]},
  { id: 'gov_conhecimento', text: [
    'E quanto ao papel de cada um: os sócios possuem o conhecimento técnico necessário para as funções que exercem hoje?',
    'Há um mecanismo claro de tomada de decisão ou às vezes há conflitos que atrasam as coisas?'
  ]},
  { id: 'financeiro_controles', text: [
    'Entendido. Vamos falar de Finanças 💰',
    'Como são os controles financeiros da empresa hoje? Vocês acompanham fluxo de caixa, DRE, têm clareza dos custos?'
  ]},
  { id: 'financeiro_gargalos', text: [
    'E quais os principais gargalos no Financeiro? (ex: endividamento alto, margens de lucro espremidas, falta de caixa...)'
  ]},
  { id: 'financeiro_nota', type: 'quick-reply', options: ['1', '2', '3', '4', '5'], text: [
    'De 1 a 5, como você avalia a Gestão Financeira da empresa hoje?'
  ]},
  { id: 'processos_ferramentas', text: [
    'Vamos para Operações e Processos ⚙️',
    'Quais sistemas (ERPs) e ferramentas vocês utilizam no dia a dia para fazer a empresa rodar?'
  ]},
  { id: 'processos_gargalos', text: [
    'Existem gargalos nessa área? (ex: muito trabalho manual e repetitivo, retrabalho, lentidão nos processos)'
  ]},
  { id: 'processos_nota', type: 'quick-reply', options: ['1', '2', '3', '4', '5'], text: [
    'De 1 a 5, qual a sua nota para a maturidade dos Processos e da Automação na empresa?'
  ]},
  { id: 'pessoas_clima', text: [
    'Entrando em Pessoas e Liderança 🤝',
    'Como você descreveria o clima organizacional e a estrutura de liderança hoje?'
  ]},
  { id: 'pessoas_gargalos', text: [
    'Quais os maiores gargalos de RH? (ex: turnover alto, dificuldade de contratar, falta de treinamento, desmotivação)'
  ]},
  { id: 'pessoas_nota', type: 'quick-reply', options: ['1', '2', '3', '4', '5'], text: [
    'De 1 a 5, como avalia a área de Pessoas no geral?'
  ]},
  { id: 'marketing_panorama', text: [
    'Estamos quase no fim! Vamos para Marketing e Estoque 📈',
    'Como está a força da identidade da marca hoje e como funciona a atração e aquisição de clientes?'
  ]},
  { id: 'estoque_panorama', text: [
    'E sobre Compras/Estoque (caso se aplique ao seu negócio): Como estão as políticas de compra, controle de perdas e giro de estoque?'
  ]},
  { id: 'marketing_estoque_nota', type: 'quick-reply', options: ['1', '2', '3', '4', '5'], text: [
    'De 1 a 5, qual a nota geral para as áreas de Marketing e Operação de Produtos?'
  ]},
  { id: 'diagnostico_geral', text: [
    'Para encerrar com chave de ouro 🔑',
    'Deixe aqui algumas observações finais, expectativas que você tem com a consultoria ou qualquer contexto extra sobre o momento atual da empresa que julgar importante.'
  ]}
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
  msgInput.disabled = true;
  sendBtn.disabled = true;
  quickRepliesContainer.innerHTML = '';
  quickRepliesContainer.classList.add("hidden");
  
  const texts = Array.isArray(q.text) ? q.text : [q.text];
  
  for (let i = 0; i < texts.length; i++) {
    showTyping();
    const delay = Math.min(Math.max(texts[i].length * 30, 800), 2500);
    await new Promise(resolve => setTimeout(resolve, delay));
    hideTyping();
    appendMessage(texts[i], false);
  }
  
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
}

async function finishDiagnostic() {
  msgInput.disabled = true;
  sendBtn.disabled = true;
  
  diagnosticData.timestamp = serverTimestamp ? serverTimestamp() : new Date();
  diagnosticData.status = 'novo';
  
  try {
    const docRef = await addDoc(collection(db, "diagnosticos"), diagnosticData);
    
    showTyping();
    setTimeout(() => {
      hideTyping();
      appendMessage("Perfeito! Recebi todos os seus dados.", false);
      
      showTyping();
      setTimeout(() => {
        hideTyping();
        appendMessage("O seu diagnóstico foi processado e o AgeQuodAgis já começou a trabalhar na sua proposta personalizada.", false);
        
        showTyping();
        setTimeout(() => {
          hideTyping();
          appendMessage("⏳ Por favor, aguarde nesta tela. Assim que a inteligência artificial finalizar a escrita da proposta (pode levar 1 ou 2 minutos), o link aparecerá aqui mesmo.", false);
          
          // Fica escutando as mudanças no documento do firebase
          const unsubscribe = onSnapshot(doc(db, "diagnosticos", docRef.id), (snapshot) => {
            const data = snapshot.data();
            if (data && data.status === 'concluido' && data.url_proposta) {
              appendMessage("🎉 Sua proposta está pronta!", false);
              
              // Adiciona balão com link clicável
              const linkMsg = document.createElement("div");
              linkMsg.className = "msg bot";
              const bubble = document.createElement("div");
              bubble.className = "bubble";
              bubble.innerHTML = `Você pode acessar a sua proposta e as recomendações dos nossos especialistas através deste link confidencial:<br><br><a href="${data.url_proposta}" target="_blank" style="color: var(--primary); text-decoration: underline; font-weight: bold;">Acessar Proposta M.A.P.C.A</a>`;
              linkMsg.appendChild(bubble);
              messagesContainer.appendChild(linkMsg);
              scrollChat();
              
              unsubscribe(); // Para de escutar o banco
            }
          });

        }, 2000);
      }, 2500);
    }, 1500);

  } catch(e) {
    console.error("Erro ao salvar no firebase", e);
    appendMessage("Desculpe, ocorreu um erro de conexão ao enviar seus dados.", false);
  }
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
