/**
 * TaskFlow AJAX Authentication System
 * Система аутентификации TaskFlow с AJAX
 */

(() => {
  const API_BASE_URL = 'php/';
  const SESSION_KEY = 'taskflow.session.token';
  
  // Получение токена сессии из localStorage
  function getSessionToken() {
    return localStorage.getItem(SESSION_KEY);
  }
  
  // Сохранение токена сессии
  function setSessionToken(token) {
    localStorage.setItem(SESSION_KEY, token);
  }
  
  // Удаление токена сессии
  function clearSessionToken() {
    localStorage.removeItem(SESSION_KEY);
  }
  
  // Выполнение AJAX запроса
  async function makeRequest(endpoint, data = null, method = 'POST') {
    const url = API_BASE_URL + endpoint;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // Добавление токена авторизации, если есть
    const token = getSessionToken();
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Добавление данных для POST/PUT запросов
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Ошибка сервера');
      }
      
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
  
  // Проверка сессии
  async function checkSession() {
    try {
      const result = await makeRequest('auth.php', { action: 'check_session' });
      return result.user;
    } catch (error) {
      clearSessionToken();
      return null;
    }
  }
  
  // Вход пользователя
  async function login(email, password, remember = false) {
    const result = await makeRequest('auth.php', {
      action: 'login',
      email,
      password,
      remember
    });
    
    setSessionToken(result.session_token);
    return result.user;
  }
  
  // Регистрация пользователя
  async function signup(email, password) {
    const result = await makeRequest('auth.php', {
      action: 'signup',
      email,
      password
    });
    
    return result;
  }
  
  // Подтверждение регистрации
  async function verifySignup(email, code) {
    const result = await makeRequest('auth.php', {
      action: 'verify',
      email,
      code
    });
    
    setSessionToken(result.session_token);
    return result.user;
  }
  
  // Повторная отправка кода
  async function resendCode(email) {
    const result = await makeRequest('auth.php', {
      action: 'resend_code',
      email
    });
    
    return result;
  }
  
  // Запрос восстановления пароля
  async function requestRecovery(email) {
    const result = await makeRequest('auth.php', {
      action: 'recovery',
      email
    });
    
    return result;
  }
  
  // Сброс пароля
  async function resetPassword(email, code, newPassword) {
    const result = await makeRequest('auth.php', {
      action: 'reset_password',
      email,
      code,
      new_password: newPassword
    });
    
    return result;
  }
  
  // Выход пользователя
  async function logout() {
    try {
      await makeRequest('auth.php', { action: 'logout' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearSessionToken();
    }
  }
  
  // Отправка аналитики
  async function trackPageView(pageUrl, userInfo = {}) {
    try {
      await makeRequest('analytics.php', {
        action: 'track_page_view',
        page_url: pageUrl,
        ...userInfo
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }
  
  // Отправка события
  async function trackEvent(eventName, eventData = {}) {
    try {
      await makeRequest('analytics.php', {
        action: 'track_event',
        event_name: eventName,
        event_data: eventData
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }
  
  // Получение статистики
  async function getAnalytics(period = '7d') {
    try {
      const result = await makeRequest('analytics.php', {
        action: 'get_stats',
        period
      });
      return result.stats;
    } catch (error) {
      console.error('Analytics error:', error);
      return null;
    }
  }
  
  // Получение задач пользователя
  async function getTasks(completed = null, limit = 100, offset = 0) {
    const params = new URLSearchParams();
    if (completed !== null) params.append('completed', completed);
    params.append('limit', limit);
    params.append('offset', offset);
    
    return await makeRequest(`tasks.php?${params}`, null, 'GET');
  }
  
  // Создание задачи
  async function createTask(taskText, priority = 'medium') {
    return await makeRequest('tasks.php', {
      task_text: taskText,
      priority
    });
  }
  
  // Обновление задачи
  async function updateTask(taskId, updates) {
    return await makeRequest('tasks.php', {
      id: taskId,
      ...updates
    }, 'PUT');
  }
  
  // Удаление задачи
  async function deleteTask(taskId) {
    return await makeRequest('tasks.php', {
      id: taskId
    }, 'DELETE');
  }
  
  // Экспорт API для использования в других модулях
  window.authAPI = {
    // Аутентификация
    login,
    signup,
    verifySignup,
    resendCode,
    requestRecovery,
    resetPassword,
    logout,
    checkSession,
    
    // Сессия
    getSessionToken,
    setSessionToken,
    clearSessionToken,
    
    // Аналитика
    trackPageView,
    trackEvent,
    getAnalytics,
    
    // Задачи
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    
    // Утилиты
    makeRequest
  };
  
  // Автоматическая проверка сессии при загрузке
  document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkSession();
    if (user) {
      // Обновление UI для авторизованного пользователя
      updateAuthUI(user);
      
      // Отправка аналитики о просмотре страницы
      trackPageView(window.location.pathname, {
        user_id: user.id,
        screen_resolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    } else {
      // Обновление UI для неавторизованного пользователя
      updateAuthUI(null);
      
      // Отправка аналитики для неавторизованного пользователя
      trackPageView(window.location.pathname, {
        screen_resolution: `${screen.width}x${screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }
  });
  
  // Обновление UI в зависимости от статуса авторизации
  function updateAuthUI(user) {
    const loginLink = document.getElementById('login-link');
    const userChip = document.getElementById('user-chip');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (user) {
      // Пользователь авторизован
      if (loginLink) loginLink.style.display = 'none';
      if (userChip) {
        userChip.textContent = user.email;
        userChip.style.display = 'inline-block';
      }
      if (logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
      // Пользователь не авторизован
      if (loginLink) loginLink.style.display = 'inline-block';
      if (userChip) userChip.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'none';
    }
  }
  
  // Обработчик выхода
  document.addEventListener('click', async (e) => {
    if (e.target.id === 'logout-btn') {
      e.preventDefault();
      await logout();
      updateAuthUI(null);
      
      // Перенаправление на страницу входа
      if (window.location.pathname !== '/login.html') {
        window.location.href = 'login.html';
      }
    }
  });
  
  // Обработчик клика по ссылке входа
  document.addEventListener('click', (e) => {
    if (e.target.id === 'login-link') {
      e.preventDefault();
      window.location.href = 'login.html';
    }
  });
  
})();
