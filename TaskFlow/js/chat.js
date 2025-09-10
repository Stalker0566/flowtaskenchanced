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
              <p>How can I help?</p>
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
            <span>TaskFlow Assistant is typing...</span>
          </div>
          <div class="chat-widget__input-wrapper">
            <input type="text" id="chatInput" placeholder="Type your question..." autocomplete="off">
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
    this.addMessage('assistant', 'Hello! I\'m the TaskFlow assistant. I can help with:\n\n• How to use the task manager\n• How to convert currencies\n• How to track expenses\n• How to use the calculator\n• How to set up budgets\n\nWhat would you like to know?');
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
          ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
    if (lowerMessage.includes('task') || lowerMessage.includes('todo')) {
      return `To manage tasks in TaskFlow:\n\n✅ **Add task**: Type in the text box and click "Add"\n✅ **Mark as completed**: Click the checkbox next to the task\n✅ **Delete task**: Click the "Delete" button\n✅ **Clear all**: Use the "Clear all tasks" button\n\nTasks are automatically saved in your browser!`;
    }
    
    // Currency converter responses
    if (lowerMessage.includes('currency') || lowerMessage.includes('convert') || lowerMessage.includes('exchange')) {
      return `The currency converter allows:\n\n💱 **Convert values**: Enter the amount and select currencies\n💱 **Real-time rates**: Automatically updated\n💱 **Swap currencies**: Use the double arrow button\n💱 **Popular rates**: See main conversions\n\nRates are obtained from reliable sources and constantly updated!`;
    }
    
    // Expense tracker responses
    if (lowerMessage.includes('expense') || lowerMessage.includes('spending') || lowerMessage.includes('cost')) {
      return `The expense tracker offers:\n\n💰 **Add expenses**: Amount, category and date\n💰 **Categories**: Food, Transport, Entertainment, etc.\n💰 **Statistics**: Monthly total, daily average\n💰 **Charts**: Visualization by category\n💰 **Calculator**: Calculator button for calculations\n💰 **Forecasts**: Projections based on your spending\n💰 **Budgets**: Set limits by category\n\nEverything is automatically saved in your browser!`;
    }
    
    // Calculator responses
    if (lowerMessage.includes('calculator') || lowerMessage.includes('calculate') || lowerMessage.includes('math')) {
      return `The TaskFlow calculator:\n\n🧮 **Access**: Click the calculator icon in any value field\n🧮 **Features**: Basic operations (+, -, ×, ÷)\n🧮 **Result**: Click "Use" to insert the calculated value\n🧮 **Design**: iOS-like interface\n\nPerfect for quick expense calculations!`;
    }
    
    // Budget responses
    if (lowerMessage.includes('budget') || lowerMessage.includes('limit') || lowerMessage.includes('spending limit')) {
      return `Budget system:\n\n📊 **Set budgets**: By expense category\n📊 **Tracking**: Visual progress bar\n📊 **Alerts**: Warnings when near limit\n📊 **Reports**: Budget usage statistics\n\nKeep your finances under control!`;
    }
    
    // Weather responses
    if (lowerMessage.includes('weather') || lowerMessage.includes('climate') || lowerMessage.includes('temperature')) {
      return `Weather forecast:\n\n🌤️ **Auto location**: Uses your current location\n🌤️ **Information**: Temperature, description, wind\n🌤️ **City**: Your location name\n🌤️ **Update**: Real-time data\n\nAlways know the weather!`;
    }
    
    // General help
    if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
      return `TaskFlow is a complete application for:\n\n📝 **Task Management**: Organize your day\n💱 **Currency Conversion**: Real-time rates\n💰 **Expense Control**: Personal finances\n🧮 **Calculator**: Quick calculations\n🌤️ **Weather Forecast**: Climate information\n\nNavigate through the tabs at the top to access each feature!`;
    }
    
    // Default responses
    const defaultResponses = [
      "Interesting! Can you give me more details about what you'd like to know?",
      "I can help with TaskFlow features. How about asking about tasks, expenses or currency conversion?",
      "I didn't understand completely. Can you rephrase your question? I can help with the site features!",
      "Great that you're using TaskFlow! How can I help you today?",
      "I'm here to help! You can ask me about any TaskFlow feature."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new TaskFlowChat();
});
