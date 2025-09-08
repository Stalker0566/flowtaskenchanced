(() => {
  const STORAGE_KEY = 'taskflow.expenses.v1';
  const SUBS_STORAGE_KEY = 'taskflow.subscriptions.v1';
  
  const form = document.getElementById('expense-form');
  const titleInput = document.getElementById('expense-title');
  const amountInput = document.getElementById('expense-amount');
  const categorySelect = document.getElementById('expense-category');
  const dateInput = document.getElementById('expense-date');
  const expenseItems = document.getElementById('expense-items');
  const clearAllBtn = document.getElementById('clear-all-expenses');
  const exportBtn = document.getElementById('export-expenses');
  const exportExcelBtn = document.getElementById('export-expenses-excel');
  const filterBtns = document.querySelectorAll('.filter-btn');

  // Subscriptions elements
  const subsForm = document.getElementById('subscription-form');
  const subsTitleInput = document.getElementById('sub-title');
  const subsAmountInput = document.getElementById('sub-amount');
  const subsItems = document.getElementById('subscriptions-items');
  const subsTotalEl = document.getElementById('subscriptions-total');
  
  // Statistics elements
  const totalExpensesEl = document.getElementById('total-expenses');
  const monthlyExpensesEl = document.getElementById('monthly-expenses');
  const dailyAverageEl = document.getElementById('daily-average');
  const expenseCountEl = document.getElementById('expense-count');
  const categoryChartEl = document.getElementById('category-chart');

  // Calculator elements
  const calcModal = document.getElementById('calculator-modal');
  const openCalcBtn = document.getElementById('open-calculator');
  const closeCalcBtn = document.getElementById('close-calculator');
  const calcDisplay = document.getElementById('calc-display');
  const calcApplyBtn = document.getElementById('calc-apply');

  // Forecast elements
  const forecastForm = document.getElementById('forecast-form');
  const forecastBalance = document.getElementById('forecast-balance');
  const forecastIncome = document.getElementById('forecast-income');
  const forecastVariable = document.getElementById('forecast-variable');
  const forecastMonths = document.getElementById('forecast-months');
  const forecastResult = document.getElementById('forecast-result');
  const forecastMonthlyFree = document.getElementById('forecast-monthly-free');

  // Savings elements
  const savingsGoalForm = document.getElementById('savings-goal-form');
  const savingsName = document.getElementById('savings-name');
  const savingsTarget = document.getElementById('savings-target');
  const savingsDeadline = document.getElementById('savings-deadline');
  const savingsProgressBar = document.getElementById('savings-progress-bar');
  const savingsProgressText = document.getElementById('savings-progress-text');
  const savingsEta = document.getElementById('savings-eta');
  const savingsAddForm = document.getElementById('savings-add-form');
  const savingsAmount = document.getElementById('savings-amount');
  const savingsNote = document.getElementById('savings-note');
  const savingsItems = document.getElementById('savings-items');

  // Budgets elements
  const budgetForm = document.getElementById('budget-form');
  const budgetCategory = document.getElementById('budget-category');
  const budgetAmount = document.getElementById('budget-amount');
  const budgetsItems = document.getElementById('budgets-items');

  // Custom categories elements
  const customCatForm = document.getElementById('custom-cat-form');
  const customCatName = document.getElementById('custom-cat-name');
  const customCatEmoji = document.getElementById('custom-cat-emoji');
  const customCatColor = document.getElementById('custom-cat-color');
  const customCatsList = document.getElementById('custom-cats-items');
  
  /** @type {{id:string, title:string, amount:number, category:string, date:string, tags?:string[]}[]} */
  let expenses = [];
  /** @type {{id:string, title:string, amount:number}[]} */
  let subscriptions = [];
  /** @type {{goal:{name:string,target:number,deadline:string|null}, deposits:{id:string, amount:number, note:string, date:string}[]}} */
  let savings = { goal: { name: '', target: 0, deadline: null }, deposits: [] };
  /** @type {Record<string, number>} */
  let budgets = {}; // category -> monthly limit
  /** @type {Record<string, {name:string, color:string, emoji:string}>} */
  let customCategories = {};
  let selectedTag = '';
  let currentFilter = 'all';
  
  const categoryConfig = {
    food: { name: 'Еда и напитки', color: '#ef4444', icon: '🍔' },
    transport: { name: 'Транспорт', color: '#3b82f6', icon: '🚗' },
    shopping: { name: 'Покупки', color: '#8b5cf6', icon: '🛍️' },
    entertainment: { name: 'Развлечения', color: '#f59e0b', icon: '🎬' },
    health: { name: 'Здоровье', color: '#10b981', icon: '🏥' },
    education: { name: 'Образование', color: '#06b6d4', icon: '📚' },
    utilities: { name: 'Коммунальные услуги', color: '#f97316', icon: '🏠' },
    rent: { name: 'Аренда/Ипотека', color: '#ef4444', icon: '🏢' },
    internet: { name: 'Интернет', color: '#60a5fa', icon: '🌐' },
    phone: { name: 'Связь', color: '#22c55e', icon: '📱' },
    fitness: { name: 'Фитнес', color: '#f59e0b', icon: '🏋️' },
    travel: { name: 'Путешествия', color: '#14b8a6', icon: '✈️' },
    gifts: { name: 'Подарки', color: '#e879f9', icon: '🎁' },
    pets: { name: 'Питомцы', color: '#a3e635', icon: '🐾' },
    baby: { name: 'Дети', color: '#fb7185', icon: '🍼' },
    beauty: { name: 'Красота', color: '#f472b6', icon: '💄' },
    taxes: { name: 'Налоги/Штрафы', color: '#fca5a5', icon: '💼' },
    savings: { name: 'Сбережения', color: '#38bdf8', icon: '💰' },
    investments: { name: 'Инвестиции', color: '#22d3ee', icon: '📈' },
    subscriptions: { name: 'Подписки', color: '#64748b', icon: '🔁' },
    other: { name: 'Прочее', color: '#6b7280', icon: '📝' }
  };
  
  function loadExpenses() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      expenses = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(expenses)) expenses = [];
    } catch (_) {
      expenses = [];
    }
  }
  
  function saveExpenses() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }

  function loadSubscriptions() {
    try {
      const raw = localStorage.getItem(SUBS_STORAGE_KEY);
      subscriptions = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(subscriptions)) subscriptions = [];
    } catch (_) {
      subscriptions = [];
    }
  }

  function saveSubscriptions() {
    localStorage.setItem(SUBS_STORAGE_KEY, JSON.stringify(subscriptions));
  }

  const SAVINGS_KEY = 'taskflow.savings.v1';
  const BUDGETS_KEY = 'taskflow.budgets.v1';
  const CUSTOM_CATS_KEY = 'taskflow.customcats.v1';
  function loadSavings() {
    try {
      const raw = localStorage.getItem(SAVINGS_KEY);
      savings = raw ? JSON.parse(raw) : savings;
      if (!savings || typeof savings !== 'object') savings = { goal: { name: '', target: 0, deadline: null }, deposits: [] };
    } catch (_) { /* noop */ }
  }
  function saveSavings() {
    localStorage.setItem(SAVINGS_KEY, JSON.stringify(savings));
  }

  function loadBudgets() {
    try {
      const raw = localStorage.getItem(BUDGETS_KEY);
      budgets = raw ? JSON.parse(raw) : {};
      if (!budgets || typeof budgets !== 'object') budgets = {};
    } catch (_) { budgets = {}; }
  }
  function saveBudgets() { localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets)); }

  function loadCustomCats() {
    try {
      const raw = localStorage.getItem(CUSTOM_CATS_KEY);
      customCategories = raw ? JSON.parse(raw) : {};
      if (!customCategories || typeof customCategories !== 'object') customCategories = {};
    } catch (_) { customCategories = {}; }
  }
  function saveCustomCats() { localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(customCategories)); }
  
  function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  
  function getFilteredExpenses() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      if (selectedTag && (!expense.tags || !expense.tags.includes(selectedTag))) {
        return false;
      }
      
      switch (currentFilter) {
        case 'today':
          return expenseDate >= today;
        case 'week':
          return expenseDate >= weekAgo;
        case 'month':
          return expenseDate >= monthAgo;
        default:
          return true;
      }
    });
  }
  
  function updateStatistics() {
    const filtered = getFilteredExpenses();
    const total = filtered.reduce((sum, expense) => sum + expense.amount, 0);
    const count = filtered.length;
    
    // Monthly expenses
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthly = expenses
      .filter(expense => new Date(expense.date) >= monthStart)
      .reduce((sum, expense) => sum + expense.amount, 0);

    // Subscriptions monthly total (subscriptions are monthly recurring)
    const subsMonthly = subscriptions.reduce((sum, s) => sum + s.amount, 0);
    
    // Daily average
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyAverage = (monthly + subsMonthly) / daysInMonth;
    
    totalExpensesEl.textContent = formatCurrency(total);
    monthlyExpensesEl.textContent = formatCurrency(monthly + subsMonthly);
    dailyAverageEl.textContent = formatCurrency(dailyAverage);
    expenseCountEl.textContent = count.toString();

    // Update subscriptions total card
    subsTotalEl && (subsTotalEl.textContent = formatCurrency(subsMonthly));
  }
  
  function updateCategoryChart() {
    const categoryTotals = {};
    // Current month only
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    expenses.forEach(expense => {
      const d = new Date(expense.date);
      if (d < monthStart) return;
      if (!categoryTotals[expense.category]) {
        categoryTotals[expense.category] = 0;
      }
      categoryTotals[expense.category] += expense.amount;
    });

    // Include subscriptions as separate category for the month
    const subsMonthly = subscriptions.reduce((sum, s) => sum + s.amount, 0);
    if (subsMonthly > 0) {
      categoryTotals['subscriptions'] = (categoryTotals['subscriptions'] || 0) + subsMonthly;
    }

    const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);

    if (total === 0) {
      categoryChartEl.innerHTML = 'График появится после добавления расходов';
      return;
    }

    const chartData = Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / total) * 100,
        config: categoryConfig[category] || categoryConfig.other
      }))
      .sort((a, b) => b.amount - a.amount);

    const chartHTML = chartData.map(item => `
      <div class="chart-item" style="margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-size: 14px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px;">
            <span style="width:10px; height:10px; border-radius:50%; background:${item.config.color}; display:inline-block;"></span>
            ${item.config.icon} ${item.config.name}
          </span>
          <span style="font-size: 14px; font-weight: 700;">
            ${formatCurrency(item.amount)}
          </span>
        </div>
        <div style="background: #f3f4f6; border-radius: 999px; height: 10px; overflow: hidden;">
          <div style="
            background: ${item.config.color};
            height: 100%;
            width: ${item.percentage}%;
            transition: width 0.3s ease;
          "></div>
        </div>
        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
          ${item.percentage.toFixed(1)}%
        </div>
      </div>
    `).join('');

    categoryChartEl.innerHTML = chartHTML;
  }

  // Budgets rendering and validation
  function getMonthCategoryTotals() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const totals = {};
    expenses.forEach(e => {
      const d = new Date(e.date);
      if (d < monthStart) return;
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return totals;
  }

  function renderBudgets() {
    if (!budgetsItems) return;
    const totals = getMonthCategoryTotals();
    const entries = Object.entries(budgets);
    if (entries.length === 0) {
      budgetsItems.innerHTML = '<div class="empty">Бюджеты не заданы.</div>';
      return;
    }
    budgetsItems.innerHTML = entries.map(([cat, limit]) => {
      const spent = totals[cat] || 0;
      const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
      const warn = spent > limit;
      const cfg = categoryConfig[cat] || customCategories[cat] || { name: cat, color: '#64748b', icon: '🏷️' };
      return `
        <div class="expense-item">
          <div class="expense-item__category" style="background:${cfg.color}"></div>
          <div class="expense-item__details" style="width:100%">
            <h3 class="expense-item__title">${cfg.icon || ''} ${cfg.name}</h3>
            <div class="progress" style="margin-top:6px;"><div class="progress__bar" style="width:${pct}%"></div></div>
            <p class="expense-item__date ${warn ? 'budget-warning' : 'budget-ok'}">${formatCurrency(spent)} / ${formatCurrency(limit)}</p>
          </div>
          <div class="expense-item__amount">${warn ? '⚠️' : ''}</div>
        </div>
      `;
    }).join('');
  }

  // Populate budget category select with known categories
  function refreshBudgetCategoryOptions() {
    if (!budgetCategory) return;
    const baseCats = Object.keys(categoryConfig);
    const customCats = Object.keys(customCategories);
    const all = [...new Set([...baseCats, ...customCats])].filter(c => c !== 'subscriptions');
    budgetCategory.innerHTML = '<option value="">Выберите категорию</option>' + all.map(c => {
      const cfg = categoryConfig[c] || customCategories[c];
      return `<option value="${c}">${(cfg?.icon || '🏷️')} ${cfg?.name || c}</option>`;
    }).join('');
  }
  
  function createExpenseItem(expense) {
    const config = categoryConfig[expense.category] || categoryConfig.other;
    
    return `
      <div class="expense-item" data-id="${expense.id}">
        <div class="expense-item__category" style="background: ${config.color}"></div>
        <div class="expense-item__details">
          <h3 class="expense-item__title">${expense.title}</h3>
          <p class="expense-item__date">${formatDate(expense.date)} • ${config.name}</p>
          ${expense.tags && expense.tags.length ? `<div>${expense.tags.map(t=>`<span class=\"tag-chip\" data-tag=\"${t}\">#${t}</span>`).join(' ')}</div>` : ''}
        </div>
        <div class="expense-item__amount">${formatCurrency(expense.amount)}</div>
        <button class="expense-item__delete" onclick="deleteExpense('${expense.id}')">Удалить</button>
      </div>
    `;
  }
  
  function renderExpenses() {
    const filtered = getFilteredExpenses();
    
    if (filtered.length === 0) {
      expenseItems.innerHTML = `
        <div class="empty">
          ${currentFilter === 'all' ? 'Нет записей о расходах. Добавьте первую сверху.' : 'Нет расходов за выбранный период.'}
        </div>
      `;
    } else {
      expenseItems.innerHTML = filtered
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(expense => createExpenseItem(expense))
        .join('');
    }
    
    updateStatistics();
    updateCategoryChart();
  }
  
  function addExpense(title, amount, category, date) {
    const expense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      amount: parseFloat(amount),
      category,
      date,
      tags: []
    };
    
    expenses.unshift(expense);
    saveExpenses();
    renderExpenses();
  }
  
  function deleteExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveExpenses();
    renderExpenses();
  }
  
  function clearAllExpenses() {
    if (expenses.length === 0) return;
    
    if (confirm('Вы уверены, что хотите удалить все записи о расходах?')) {
      expenses = [];
      saveExpenses();
      renderExpenses();
    }
  }
  
  function exportToCSV() {
    if (expenses.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }
    
    const headers = ['Дата', 'Описание', 'Сумма', 'Категория'];
    const csvContent = [
      headers.join(','),
      ...expenses.map(expense => [
        expense.date,
        `"${expense.title}"`,
        expense.amount,
        `"${categoryConfig[expense.category]?.name || 'Прочее'}"`
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  // Event listeners
  function parseFreeText(input) {
    const text = input.trim();
    const tags = Array.from(new Set((text.match(/#([\p{L}\d_]+)/giu) || []).map(m => m.slice(1).toLowerCase())));
    const amountMatch = text.match(/(\d+[\.,]?\d*)\s*(€|eur)?/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : NaN;
    // naive category inference by keywords
    const lower = text.toLowerCase();
    let category = '';
    const map = [
      ['coffee', 'Coffee'], ['кофе', 'Coffee'],
      ['такси', 'transport'], ['taxi', 'transport'],
      ['перекус', 'snacks'], ['snack', 'snacks'],
      ['супермаркет', 'food'], ['еда', 'food'], ['market', 'food'],
      ['интернет', 'internet'], ['связь', 'phone'], ['спорт', 'fitness'],
    ];
    for (const [k, v] of map) { if (lower.includes(k)) { category = v; break; } }
    // fallback by emoji
    if (!category) {
      if (/[☕️]/.test(text)) category = 'Coffee';
      else if (/[🍫]/.test(text)) category = 'snacks';
      else if (/[🛒]/.test(text)) category = 'food';
      else if (/[🚕🚗]/.test(text)) category = 'transport';
    }
    // cleaned title without tags and euro symbol
    const clean = text.replace(/#([\p{L}\d_]+)/giu, '').replace(/€|eur/gi, '').trim();
    return { cleanTitle: clean, parsedAmount: amount, tags, categoryHint: category };
  }

  function refreshTagFilter() {
    const select = document.getElementById('tag-filter');
    if (!select) return;
    const allTags = new Set();
    expenses.forEach(e => (e.tags || []).forEach(t => allTags.add(t)));
    const current = select.value;
    select.innerHTML = '<option value=""># Все теги</option>' + Array.from(allTags).sort().map(t => `<option value="${t}"># ${t}</option>`).join('');
    if (Array.from(allTags).includes(current)) select.value = current; else select.value = '';
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    let title = titleInput.value.trim();
    let amount = amountInput.value;
    let category = categorySelect.value;
    const date = dateInput.value;
    
    const parsed = parseFreeText(title);
    if ((!amount || Number(amount) <= 0) && !isNaN(parsed.parsedAmount)) {
      amount = String(parsed.parsedAmount);
    }
    if (!category && parsed.categoryHint) {
      category = parsed.categoryHint;
    }
    title = parsed.cleanTitle || title;

    if (!title || !amount || !category || !date) {
      alert('Пожалуйста, заполните все поля');
      return;
    }
    
    addExpense(title, amount, category, date);
    // attach tags to the last added expense
    if (parsed.tags.length) {
      expenses[0].tags = parsed.tags;
      saveExpenses();
    }
    refreshTagFilter();
    
    // Reset form
    form.reset();
    dateInput.value = new Date().toISOString().split('T')[0];
    titleInput.focus();
  });
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      currentFilter = btn.dataset.filter;
      renderExpenses();
    });
  });

  // Tag filter
  const tagFilter = document.getElementById('tag-filter');
  tagFilter && tagFilter.addEventListener('change', () => {
    selectedTag = tagFilter.value;
    renderExpenses();
  });
  
  clearAllBtn.addEventListener('click', clearAllExpenses);
  exportBtn.addEventListener('click', exportToCSV);

  function exportToExcel() {
    if (expenses.length === 0 && subscriptions.length === 0 && savings.deposits.length === 0) {
      alert('Нет данных для экспорта');
      return;
    }

    // Simple Excel XML Spreadsheet (compatible with .xls)
    function xmlEscape(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }

    const rowsExpenses = expenses.map(e => `
      <Row>
        <Cell><Data ss:Type="String">${xmlEscape(new Date(e.date).toLocaleDateString('ru-RU'))}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(e.title)}</Data></Cell>
        <Cell><Data ss:Type="Number">${e.amount}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(categoryConfig[e.category]?.name || 'Прочее')}</Data></Cell>
      </Row>`).join('');

    const rowsSubs = subscriptions.map(s => `
      <Row>
        <Cell><Data ss:Type="String">${xmlEscape(s.title)}</Data></Cell>
        <Cell><Data ss:Type="Number">${s.amount}</Data></Cell>
      </Row>`).join('');

    const rowsSavings = savings.deposits.map(d => `
      <Row>
        <Cell><Data ss:Type="String">${xmlEscape(new Date(d.date).toLocaleDateString('ru-RU'))}</Data></Cell>
        <Cell><Data ss:Type="String">${xmlEscape(d.note || 'Пополнение')}</Data></Cell>
        <Cell><Data ss:Type="Number">${d.amount}</Data></Cell>
      </Row>`).join('');

    const workbook = `<?xml version="1.0"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
        <Styles>
          <Style ss:ID="header">
            <Font ss:Bold="1"/>
            <Interior ss:Color="#E5E7EB" ss:Pattern="Solid"/>
          </Style>
        </Styles>
        <Worksheet ss:Name="Расходы">
          <Table>
            <Row ss:StyleID="header">
              <Cell><Data ss:Type="String">Дата</Data></Cell>
              <Cell><Data ss:Type="String">Описание</Data></Cell>
              <Cell><Data ss:Type="String">Сумма (EUR)</Data></Cell>
              <Cell><Data ss:Type="String">Категория</Data></Cell>
            </Row>
            ${rowsExpenses}
          </Table>
        </Worksheet>
        <Worksheet ss:Name="Подписки">
          <Table>
            <Row ss:StyleID="header">
              <Cell><Data ss:Type="String">Название</Data></Cell>
              <Cell><Data ss:Type="String">Сумма/мес (EUR)</Data></Cell>
            </Row>
            ${rowsSubs}
          </Table>
        </Worksheet>
        <Worksheet ss:Name="Сбережения">
          <Table>
            <Row ss:StyleID="header">
              <Cell><Data ss:Type="String">Дата</Data></Cell>
              <Cell><Data ss:Type="String">Заметка</Data></Cell>
              <Cell><Data ss:Type="String">Сумма (EUR)</Data></Cell>
            </Row>
            ${rowsSavings}
          </Table>
        </Worksheet>
      </Workbook>`;

    const blob = new Blob([workbook], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  exportExcelBtn && exportExcelBtn.addEventListener('click', exportToExcel);
  
  // Subscriptions logic
  function renderSubscriptions() {
    if (subscriptions.length === 0) {
      subsItems.innerHTML = '<div class="empty">Подписок пока нет.</div>';
      return;
    }
    subsItems.innerHTML = subscriptions.map(s => `
      <div class="expense-item" data-id="${s.id}">
        <div class="expense-item__category" style="background:#334155"></div>
        <div class="expense-item__details">
          <h3 class="expense-item__title">${s.title}</h3>
          <p class="expense-item__date">Ежемесячно</p>
        </div>
        <div class="expense-item__amount">${formatCurrency(s.amount)}</div>
        <button class="expense-item__delete" data-sub-delete="${s.id}">Удалить</button>
      </div>
    `).join('');
  }

  function addSubscription(title, amount) {
    const sub = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim(),
      amount: parseFloat(amount)
    };
    subscriptions.unshift(sub);
    saveSubscriptions();
    renderSubscriptions();
    updateStatistics();
  }

  function deleteSubscription(id) {
    subscriptions = subscriptions.filter(s => s.id !== id);
    saveSubscriptions();
    renderSubscriptions();
    updateStatistics();
  }

  subsForm && subsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = subsTitleInput.value.trim();
    const amount = subsAmountInput.value;
    if (!title || !amount) {
      alert('Введите название и сумму подписки');
      return;
    }
    addSubscription(title, amount);
    subsForm.reset();
    subsTitleInput.focus();
  });

  subsItems && subsItems.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.dataset && t.dataset.subDelete) {
      deleteSubscription(t.dataset.subDelete);
    }
  });

  // Calculator logic (iOS-like)
  const calc = {
    a: null,
    b: null,
    op: null,
    display: '0',
    justEvaluated: false,
  };

  function updateCalcDisplay() {
    if (!calcDisplay) return;
    calcDisplay.textContent = calc.display;
  }

  function inputDigit(d) {
    if (calc.justEvaluated) { calc.display = '0'; calc.justEvaluated = false; }
    if (calc.display === '0') calc.display = String(d);
    else calc.display += String(d);
    updateCalcDisplay();
  }

  function inputDot() {
    if (calc.justEvaluated) { calc.display = '0'; calc.justEvaluated = false; }
    if (!calc.display.includes(',')) {
      calc.display += ',';
      updateCalcDisplay();
    }
  }

  function setOperator(op) {
    const value = parseDisplay(calc.display);
    if (calc.a === null) {
      calc.a = value;
    } else if (!calc.justEvaluated) {
      calc.b = value;
      calc.a = evaluate(calc.a, calc.b, calc.op);
      calc.display = formatDisplay(calc.a);
    }
    calc.op = op;
    calc.justEvaluated = false;
    updateCalcDisplay();
    calc.display = '0';
  }

  function clearAll() {
    calc.a = null; calc.b = null; calc.op = null; calc.display = '0'; calc.justEvaluated = false; updateCalcDisplay();
  }

  function toggleSign() {
    if (calc.display === '0') return;
    if (calc.display.startsWith('-')) calc.display = calc.display.slice(1);
    else calc.display = '-' + calc.display;
    updateCalcDisplay();
  }

  function percent() {
    const value = parseDisplay(calc.display);
    calc.display = formatDisplay(value / 100);
    updateCalcDisplay();
  }

  function equals() {
    const value = parseDisplay(calc.display);
    if (calc.a === null) { calc.a = value; calc.display = formatDisplay(calc.a); }
    else {
      calc.b = value;
      const res = evaluate(calc.a, calc.b, calc.op);
      calc.display = formatDisplay(res);
      calc.a = res;
    }
    calc.justEvaluated = true;
    updateCalcDisplay();
  }

  function evaluate(a, b, op) {
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    if (op === '*') return a * b;
    if (op === '/') return b === 0 ? 0 : a / b;
    return b;
  }

  function parseDisplay(text) {
    return parseFloat(text.replace(/\s/g, '').replace(',', '.')) || 0;
    }

  function formatDisplay(num) {
    const parts = num.toString().split('.');
    if (parts.length === 1) return parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return `${parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${','}${parts[1].slice(0, 6)}`;
  }

  function openCalculator() { if (!calcModal) return; calcModal.style.display = 'block'; updateCalcDisplay(); }
  function closeCalculator() { if (!calcModal) return; calcModal.style.display = 'none'; }

  openCalcBtn && openCalcBtn.addEventListener('click', openCalculator);
  closeCalcBtn && closeCalcBtn.addEventListener('click', closeCalculator);
  calcModal && calcModal.addEventListener('click', (e) => { if (e.target.classList.contains('calc__overlay')) closeCalculator(); });

  // Delegate calculator buttons
  calcModal && calcModal.addEventListener('click', (e) => {
    const el = e.target;
    if (!el.classList || !el.classList.contains('calc__btn')) return;
    if (el.dataset.num) inputDigit(el.dataset.num);
    else if (el.dataset.dot !== undefined || el.dataset.dot === ',') inputDot();
    else if (el.dataset.op) setOperator(el.dataset.op);
    else if (el.dataset.act === 'clear') clearAll();
    else if (el.dataset.act === 'sign') toggleSign();
    else if (el.dataset.act === 'percent') percent();
    else if (el.dataset.act === 'equals') equals();
  });

  calcApplyBtn && calcApplyBtn.addEventListener('click', () => {
    const value = parseDisplay(calc.display);
    amountInput.value = String(value.toFixed(2));
    closeCalculator();
    amountInput.focus();
  });

  // Quick templates
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.classList && t.classList.contains('chip') && t.dataset.template) {
      try {
        const tpl = JSON.parse(t.dataset.template);
        titleInput.value = tpl.title || '';
        amountInput.value = typeof tpl.amount === 'number' ? tpl.amount.toFixed(2) : '';
        if (tpl.category) categorySelect.value = tpl.category;
      } catch (_) {}
    }
    if (t && t.classList && t.classList.contains('tag-chip') && t.dataset.tag) {
      const select = document.getElementById('tag-filter');
      if (select) {
        select.value = t.dataset.tag;
        selectedTag = t.dataset.tag;
        renderExpenses();
      }
    }
  });

  // Forecast logic
  function computeForecast() {
    const balance = parseFloat(forecastBalance.value || '0');
    const income = parseFloat(forecastIncome.value || '0');
    const variable = parseFloat(forecastVariable.value || '0');
    const months = Math.max(1, parseInt(forecastMonths.value || '1', 10));

    const subsMonthly = subscriptions.reduce((sum, s) => sum + s.amount, 0);

    const monthlyFree = income - (variable + subsMonthly);
    const projected = balance + monthlyFree * months;

    forecastMonthlyFree.textContent = formatCurrency(monthlyFree);
    forecastResult.textContent = formatCurrency(projected);
  }

  forecastForm && forecastForm.addEventListener('submit', (e) => {
    e.preventDefault();
    computeForecast();
  });

  // Savings logic
  function renderSavings() {
    // Goal
    const current = savings.deposits.reduce((s, d) => s + d.amount, 0);
    const target = savings.goal.target || 0;
    const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
    if (savingsProgressBar) savingsProgressBar.style.width = pct + '%';
    if (savingsProgressText) savingsProgressText.textContent = `${current.toFixed(2)} / ${target.toFixed(2)} €`;

    if (savings.goal.deadline) {
      const msLeft = new Date(savings.goal.deadline).getTime() - Date.now();
      const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
      savingsEta.textContent = daysLeft >= 0 ? `Осталось дней: ${daysLeft}` : 'Дедлайн прошёл';
    } else {
      savingsEta.textContent = 'Без дедлайна';
    }

    // Deposits
    if (!savingsItems) return;
    if (savings.deposits.length === 0) {
      savingsItems.innerHTML = '<div class="empty">Пополнений пока нет.</div>';
    } else {
      savingsItems.innerHTML = savings.deposits
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(d => `
          <div class="expense-item" data-id="${d.id}">
            <div class="expense-item__category" style="background:#22c55e"></div>
            <div class="expense-item__details">
              <h3 class="expense-item__title">${d.note || 'Пополнение'}</h3>
              <p class="expense-item__date">${new Date(d.date).toLocaleDateString('ru-RU')}</p>
            </div>
            <div class="expense-item__amount">${formatCurrency(d.amount)}</div>
            <button class="expense-item__delete" data-sav-delete="${d.id}">Удалить</button>
          </div>
        `).join('');
    }
  }

  savingsGoalForm && savingsGoalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    savings.goal.name = savingsName.value.trim();
    savings.goal.target = parseFloat(savingsTarget.value || '0');
    savings.goal.deadline = savingsDeadline.value || null;
    saveSavings();
    renderSavings();
  });

  savingsAddForm && savingsAddForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const amount = parseFloat(savingsAmount.value || '0');
    if (!amount || amount <= 0) return;
    const dep = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, amount, note: savingsNote.value.trim(), date: new Date().toISOString() };
    savings.deposits.unshift(dep);
    savingsAmount.value = '';
    savingsNote.value = '';
    saveSavings();
    renderSavings();
  });

  savingsItems && savingsItems.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.dataset && t.dataset.savDelete) {
      const id = t.dataset.savDelete;
      savings.deposits = savings.deposits.filter(d => d.id !== id);
      saveSavings();
      renderSavings();
    }
  });

  // Budget form
  budgetForm && budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cat = budgetCategory.value;
    const amt = parseFloat(budgetAmount.value || '0');
    if (!cat || !(amt >= 0)) return;
    budgets[cat] = amt;
    saveBudgets();
    renderBudgets();
  });

  // Custom categories
  function renderCustomCategories() {
    if (!customCatsList) return;
    const items = Object.entries(customCategories).map(([key, cfg]) => `
      <div class="rate">
        <span class="rate__currency">${cfg.emoji || '🏷️'} ${cfg.name}</span>
        <span class="rate__value" style="display:flex;align-items:center;gap:8px;">
          <span style="width:12px;height:12px;border-radius:50%;background:${cfg.color};display:inline-block;"></span>
          <button class="filter-btn" data-cat-remove="${key}">Удалить</button>
        </span>
      </div>
    `).join('');
    customCatsList.innerHTML = items || '<div class="empty">Нет собственных категорий.</div>';
    refreshBudgetCategoryOptions();
  }

  customCatForm && customCatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = customCatName.value.trim();
    if (!name) return;
    const key = name.toLowerCase().replace(/\s+/g, '_');
    customCategories[key] = { name, color: customCatColor.value || '#3b82f6', emoji: customCatEmoji.value || '🏷️' };
    saveCustomCats();
    renderCustomCategories();
    customCatForm.reset();
  });

  customCatsList && customCatsList.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.dataset && t.dataset.catRemove) {
      delete customCategories[t.dataset.catRemove];
      saveCustomCats();
      renderCustomCategories();
    }
  });

  // Dashboard calculations
  function computeDashboard() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekTotal = expenses.filter(e => new Date(e.date) >= weekAgo).reduce((s, e) => s + e.amount, 0);
    const monthTotal = expenses.filter(e => new Date(e.date) >= monthStart).reduce((s, e) => s + e.amount, 0) + subscriptions.reduce((s, sub) => s + sub.amount, 0);
    const avgCheck = expenses.length ? (expenses.reduce((s, e) => s + e.amount, 0) / expenses.length) : 0;

    const weekEl = document.getElementById('week-total');
    const monthEl = document.getElementById('month-total');
    const avgEl = document.getElementById('avg-check');
    if (weekEl) weekEl.textContent = formatCurrency(weekTotal);
    if (monthEl) monthEl.textContent = formatCurrency(monthTotal);
    if (avgEl) avgEl.textContent = formatCurrency(avgCheck);

    // Top categories current month
    const totals = {};
    expenses.forEach(e => { const d=new Date(e.date); if(d>=monthStart){ totals[e.category]=(totals[e.category]||0)+e.amount; } });
    const top = Object.entries(totals)
      .map(([cat, amt]) => ({ cat, amt, cfg: categoryConfig[cat] || customCategories[cat] || { name: cat, color: '#64748b', icon: '🏷️' } }))
      .sort((a,b)=>b.amt-a.amt).slice(0,6);
    const topWrap = document.getElementById('top-cats');
    if (topWrap) topWrap.innerHTML = top.map(x => `
      <div class="rate">
        <span class="rate__currency">${x.cfg.icon} ${x.cfg.name}</span>
        <span class="rate__value">${formatCurrency(x.amt)}</span>
      </div>
    `).join('');
  }

  // Heatmap (monthly)
  function renderHeatmap() {
    const wrap = document.getElementById('heatmap');
    if (!wrap) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const totals = new Array(daysInMonth).fill(0);
    expenses.forEach(e => {
      const d = new Date(e.date);
      if (d.getMonth() === month && d.getFullYear() === year) {
        totals[d.getDate() - 1] += e.amount;
      }
    });
    const max = Math.max(1, ...totals);
    const cells = [];
    const startOffset = (firstDay.getDay() + 6) % 7; // make Monday=0
    for (let i = 0; i < startOffset; i++) cells.push('<div></div>');
    for (let day = 1; day <= daysInMonth; day++) {
      const v = totals[day - 1];
      const intensity = v > 0 ? Math.min(1, v / max) : 0;
      const bg = `rgba(37,99,235,${0.12 + intensity * 0.5})`;
      cells.push(`<div title="${day}. ${formatCurrency(v)}" style="background:${v>0?bg:''}"></div>`);
    }
    wrap.innerHTML = cells.join('');
  }

  // Trend (30-day simple SVG)
  function renderTrend() {
    const el = document.getElementById('trend');
    if (!el) return;
    const now = new Date();
    const dates = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      dates.push(d);
    }
    const totals = dates.map(d => expenses.filter(e => {
      const ed = new Date(e.date);
      return ed.getFullYear()===d.getFullYear() && ed.getMonth()===d.getMonth() && ed.getDate()===d.getDate();
    }).reduce((s,e)=>s+e.amount,0));
    const w = 300, h = 80, pad = 6;
    const max = Math.max(1, ...totals);
    const stepX = (w - pad*2) / (totals.length - 1);
    const points = totals.map((v,i)=>{
      const x = pad + i*stepX;
      const y = h - pad - (v/max)*(h - pad*2);
      return `${x},${y}`;
    }).join(' ');
    el.innerHTML = `<svg width="100%" viewBox="0 0 ${w} ${h}"><polyline fill="none" stroke="var(--primary)" stroke-width="2" points="${points}"/></svg>`;
  }

  // Month-over-month comparison
  function renderMoM() {
    const el = document.getElementById('mom-compare');
    if (!el) return;
    const now = new Date();
    const ms = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMs = new Date(now.getFullYear(), now.getMonth()-1, 1);
    const prevMe = new Date(now.getFullYear(), now.getMonth(), 0);
    const sumInRange = (start,end) => expenses.filter(e=>{ const d=new Date(e.date); return d>=start && d<=end; }).reduce((s,e)=>s+e.amount,0);
    const cur = sumInRange(ms, now) + subscriptions.reduce((s,sub)=>s+sub.amount,0);
    const prev = sumInRange(prevMs, prevMe) + subscriptions.reduce((s,sub)=>s+sub.amount,0);
    const diff = cur - prev;
    const pct = prev>0 ? (diff/prev)*100 : 0;
    const arrow = diff>=0 ? '⬆️' : '⬇️';
    el.innerHTML = `
      <div class="rate">
        <span class="rate__currency">Текущий месяц</span>
        <span class="rate__value">${formatCurrency(cur)}</span>
      </div>
      <div class="rate">
        <span class="rate__currency">Прошлый месяц</span>
        <span class="rate__value">${formatCurrency(prev)}</span>
      </div>
      <div class="rate">
        <span class="rate__currency">Изменение</span>
        <span class="rate__value">${arrow} ${pct.toFixed(1)}%</span>
      </div>`;
  }
  
  // Set today's date as default
  dateInput.value = new Date().toISOString().split('T')[0];
  
  // Initialize
  loadExpenses();
  loadSubscriptions();
  loadSavings();
  loadBudgets();
  loadCustomCats();
  renderExpenses();
  renderSubscriptions();
  renderSavings();
  renderBudgets();
  renderCustomCategories();
  refreshBudgetCategoryOptions();
  computeDashboard();
  refreshTagFilter();
  renderHeatmap();
  renderTrend();
  renderMoM();
  
  // Make deleteExpense globally available for onclick handlers
  window.deleteExpense = deleteExpense;
})();
