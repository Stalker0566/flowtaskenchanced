// AI Chat Widget for TaskFlow
class TaskFlowChat {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.isTyping = false;
    
    this.init();
  }

  init() {
    this.createChatWidget();
    this.bindEvents();
    this.addWelcomeMessage();
  }

  createChatWidget() {
    // Create chat container
    const chatContainer = document.createElement('div');
    chatContainer.className = 'chat-widget';
    chatContainer.innerHTML = `
      <div class="chat-widget__toggle" id="chatToggle">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span class="chat-widget__badge" id="chatBadge">1</span>
      </div>
      
      <div class="chat-widget__panel" id="chatPanel">
        <div class="chat-widget__header">
          <div class="chat-widget__title">
            <div class="chat-widget__avatar">🤖</div>
            <div>
              <h3>TaskFlow Assistant</h3>
              <p>Como posso ajudar?</p>
            </div>
          </div>
          <button class="chat-widget__close" id="chatClose">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="chat-widget__messages" id="chatMessages">
          <!-- Messages will be inserted here -->
        </div>
        
        <div class="chat-widget__input-container">
          <div class="chat-widget__typing" id="chatTyping" style="display: none;">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>TaskFlow Assistant está digitando...</span>
          </div>
          <div class="chat-widget__input-wrapper">
            <input type="text" id="chatInput" placeholder="Digite sua pergunta..." autocomplete="off">
            <button id="chatSend" class="chat-widget__send">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(chatContainer);
  }

  bindEvents() {
    const toggle = document.getElementById('chatToggle');
    const close = document.getElementById('chatClose');
    const input = document.getElementById('chatInput');
    const send = document.getElementById('chatSend');

    toggle.addEventListener('click', () => this.toggleChat());
    close.addEventListener('click', () => this.closeChat());
    send.addEventListener('click', () => this.sendMessage());
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    // Close chat when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.chat-widget')) {
        this.closeChat();
      }
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    const panel = document.getElementById('chatPanel');
    const badge = document.getElementById('chatBadge');
    
    if (this.isOpen) {
      panel.classList.add('chat-widget__panel--open');
      badge.style.display = 'none';
      document.getElementById('chatInput').focus();
    } else {
      panel.classList.remove('chat-widget__panel--open');
    }
  }

  closeChat() {
    this.isOpen = false;
    const panel = document.getElementById('chatPanel');
    panel.classList.remove('chat-widget__panel--open');
  }

  addWelcomeMessage() {
    this.addMessage('assistant', 'Olá! Sou o assistente do TaskFlow. Posso ajudar com:\n\n• Como usar o gerenciador de tarefas\n• Como converter moedas\n• Como rastrear despesas\n• Como usar a calculadora\n• Como configurar orçamentos\n\nO que gostaria de saber?');
  }

  addMessage(sender, text, isTyping = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message--${sender}`;
    
    if (isTyping) {
      messageDiv.innerHTML = `
        <div class="chat-message__content">
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      `;
    } else {
      messageDiv.innerHTML = `
        <div class="chat-message__content">
          ${text.replace(/\n/g, '<br>')}
        </div>
        <div class="chat-message__time">
          ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    this.messages.push({ sender, text, timestamp: new Date() });
  }

  async sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message
    this.addMessage('user', message);
    input.value = '';
    
    // Show typing indicator
    this.showTyping();
    
    // Get AI response
    const response = await this.getAIResponse(message);
    
    // Hide typing indicator
    this.hideTyping();
    
    // Add AI response
    this.addMessage('assistant', response);
  }

  showTyping() {
    this.isTyping = true;
    const typing = document.getElementById('chatTyping');
    typing.style.display = 'flex';
    
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTyping() {
    this.isTyping = false;
    const typing = document.getElementById('chatTyping');
    typing.style.display = 'none';
  }

  async getAIResponse(message) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    const lowerMessage = message.toLowerCase();
    
    // Task management responses
    if (lowerMessage.includes('tarefa') || lowerMessage.includes('task')) {
      return `Para gerenciar tarefas no TaskFlow:\n\n✅ **Adicionar tarefa**: Digite na caixa de texto e clique "Adicionar"\n✅ **Marcar como concluída**: Clique no checkbox ao lado da tarefa\n✅ **Deletar tarefa**: Clique no botão "X" vermelho\n✅ **Limpar todas**: Use o botão "Limpar todas as tarefas"\n\nAs tarefas são salvas automaticamente no seu navegador!`;
    }
    
    // Currency converter responses
    if (lowerMessage.includes('moeda') || lowerMessage.includes('converter') || lowerMessage.includes('currency')) {
      return `O conversor de moedas permite:\n\n💱 **Converter valores**: Digite o valor e selecione as moedas\n💱 **Taxas em tempo real**: Atualizadas automaticamente\n💱 **Trocar moedas**: Use o botão de setas duplas\n💱 **Taxas populares**: Veja as principais conversões\n\nAs taxas são obtidas de fontes confiáveis e atualizadas constantemente!`;
    }
    
    // Expense tracker responses
    if (lowerMessage.includes('despesa') || lowerMessage.includes('gasto') || lowerMessage.includes('expense')) {
      return `O rastreador de despesas oferece:\n\n💰 **Adicionar despesas**: Valor, categoria e data\n💰 **Categorias**: Alimentação, Transporte, Lazer, etc.\n💰 **Estatísticas**: Total mensal, média diária\n💰 **Gráficos**: Visualização por categoria\n💰 **Calculadora**: Botão da calculadora para cálculos\n💰 **Previsões**: Projeções baseadas nos seus gastos\n💰 **Orçamentos**: Defina limites por categoria\n\nTudo é salvo automaticamente no seu navegador!`;
    }
    
    // Calculator responses
    if (lowerMessage.includes('calculadora') || lowerMessage.includes('calcular') || lowerMessage.includes('calculator')) {
      return `A calculadora do TaskFlow:\n\n🧮 **Acesso**: Clique no ícone da calculadora em qualquer campo de valor\n🧮 **Funcionalidades**: Operações básicas (+, -, ×, ÷)\n🧮 **Resultado**: Clique "Usar" para inserir o valor calculado\n🧮 **Design**: Interface similar ao iOS\n\nPerfeita para cálculos rápidos de despesas!`;
    }
    
    // Budget responses
    if (lowerMessage.includes('orçamento') || lowerMessage.includes('budget') || lowerMessage.includes('limite')) {
      return `Sistema de orçamentos:\n\n📊 **Definir orçamentos**: Por categoria de despesa\n📊 **Acompanhamento**: Barra de progresso visual\n📊 **Alertas**: Avisos quando próximo do limite\n📊 **Relatórios**: Estatísticas de uso do orçamento\n\nMantenha suas finanças sob controle!`;
    }
    
    // Weather responses
    if (lowerMessage.includes('tempo') || lowerMessage.includes('clima') || lowerMessage.includes('weather')) {
      return `A previsão do tempo:\n\n🌤️ **Localização automática**: Usa sua localização atual\n🌤️ **Informações**: Temperatura, descrição, vento\n🌤️ **Cidade**: Nome da sua localização\n🌤️ **Atualização**: Dados em tempo real\n\nSempre saiba como está o tempo!`;
    }
    
    // General help
    if (lowerMessage.includes('ajuda') || lowerMessage.includes('help') || lowerMessage.includes('como')) {
      return `TaskFlow é uma aplicação completa para:\n\n📝 **Gerenciamento de Tarefas**: Organize seu dia\n💱 **Conversão de Moedas**: Taxas em tempo real\n💰 **Controle de Despesas**: Finanças pessoais\n🧮 **Calculadora**: Cálculos rápidos\n🌤️ **Previsão do Tempo**: Informações climáticas\n\nNavegue pelas abas no topo para acessar cada funcionalidade!`;
    }
    
    // Default responses
    const defaultResponses = [
      "Interessante! Pode me dar mais detalhes sobre o que você gostaria de saber?",
      "Posso ajudar com funcionalidades do TaskFlow. Que tal perguntar sobre tarefas, despesas ou conversão de moedas?",
      "Não entendi completamente. Pode reformular sua pergunta? Posso ajudar com as funcionalidades do site!",
      "Que bom que você está usando o TaskFlow! Como posso ajudar você hoje?",
      "Estou aqui para ajudar! Pode me perguntar sobre qualquer funcionalidade do TaskFlow."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TaskFlowChat();
});
