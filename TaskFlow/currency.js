(() => {
  const API_KEY = 'YOUR_API_KEY'; // Замените на ваш API ключ
  const API_BASE = 'https://api.exchangerate-api.com/v4/latest/';
  
  const amountInput = document.getElementById('amount');
  const fromSelect = document.getElementById('from-currency');
  const toSelect = document.getElementById('to-currency');
  const resultInput = document.getElementById('result');
  const swapBtn = document.getElementById('swap-currencies');
  const ratesList = document.getElementById('rates-list');
  const errorMessage = document.getElementById('error-message');
  const chartEURUSD = document.getElementById('chart-eurusd');
  const chartEURUAH = document.getElementById('chart-euruah');
  const chartUSDUAH = document.getElementById('chart-usduah');
  const FORM_STATE_KEY = 'taskflow.fx.form.v1';
  
  let exchangeRates = {};
  let baseCurrency = 'EUR';
  
  // Популярные валюты для отображения курсов (без RUB)
  const popularCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD'];
  
  async function fetchExchangeRates(currency = 'EUR') {
    try {
      const response = await fetch(`${API_BASE}${currency}`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      exchangeRates = data.rates;
      baseCurrency = currency;
      
      updateRatesDisplay();
      calculateConversion();
      errorMessage.style.display = 'none';
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      showError();
    }
  }
  
  function showError() {
    errorMessage.style.display = 'block';
    ratesList.innerHTML = `
      <div class="rate">
        <span class="rate__currency">Ошибка загрузки</span>
        <span class="rate__value">—</span>
      </div>
    `;
  }
  
  function updateRatesDisplay() {
    const rates = popularCurrencies
      .filter(currency => currency !== baseCurrency)
      .map(currency => {
        const rate = exchangeRates[currency];
        return `
          <div class="rate">
            <span class="rate__currency">1 ${baseCurrency} = ${currency}</span>
            <span class="rate__value">${rate ? rate.toFixed(4) : '—'}</span>
          </div>
        `;
      })
      .join('');
    
    ratesList.innerHTML = rates;
  }
  
  function calculateConversion() {
    const amount = parseFloat(amountInput.value);
    if (!amount || amount <= 0) {
      resultInput.value = '';
      return;
    }
    
    const fromCurrency = fromSelect.value;
    const toCurrency = toSelect.value;
    
    if (fromCurrency === toCurrency) {
      resultInput.value = amount.toFixed(2);
      return;
    }
    
    let result;
    
    if (fromCurrency === baseCurrency) {
      // Конвертируем из базовой валюты
      result = amount * (exchangeRates[toCurrency] || 0);
    } else if (toCurrency === baseCurrency) {
      // Конвертируем в базовую валюту
      result = amount / (exchangeRates[fromCurrency] || 1);
    } else {
      // Конвертируем через базовую валюту
      const toBase = amount / (exchangeRates[fromCurrency] || 1);
      result = toBase * (exchangeRates[toCurrency] || 0);
    }
    
    if (result && !isNaN(result)) {
      resultInput.value = result.toFixed(2);
    } else {
      resultInput.value = '';
    }
  }
  
  function swapCurrencies() {
    const fromValue = fromSelect.value;
    const toValue = toSelect.value;
    
    fromSelect.value = toValue;
    toSelect.value = fromValue;
    
    calculateConversion();
  }
  
  function formatCurrency(amount, currency) {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }
  
  // Event listeners
  amountInput.addEventListener('input', calculateConversion);
  fromSelect.addEventListener('change', calculateConversion);
  toSelect.addEventListener('change', calculateConversion);
  swapBtn.addEventListener('click', swapCurrencies);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      swapCurrencies();
    }
  });
  
  // Initialize
  // Restore form state
  try {
    const saved = JSON.parse(localStorage.getItem(FORM_STATE_KEY) || 'null');
    if (saved) {
      if (typeof saved.amount === 'number') amountInput.value = String(saved.amount);
      if (saved.from && fromSelect.querySelector(`option[value="${saved.from}"]`)) fromSelect.value = saved.from;
      if (saved.to && toSelect.querySelector(`option[value="${saved.to}"]`)) toSelect.value = saved.to;
    }
  } catch(_){}
  fetchExchangeRates();
  calculateConversion();
  
  // Auto-refresh rates every 5 minutes
  setInterval(() => {
    fetchExchangeRates(baseCurrency);
  }, 5 * 60 * 1000);

  // --- Realtime charts (simple polling and SVG) ---
  const CHART_INTERVAL_MS = 15 * 1000; // 15 seconds
  const HISTORY_POINTS = 96; // ~24h with 15s
  const history = {
    'EURUSD': [],
    'EURUAH': [],
    'USDUAH': [],
  };

  function pushHistory(key, value) {
    const arr = history[key];
    arr.push({ t: Date.now(), v: value });
    if (arr.length > HISTORY_POINTS) arr.shift();
  }

  function renderLineChart(el, values, colorVar) {
    if (!el) return;
    if (!values.length) { el.textContent = 'Нет данных'; return; }
    const w = 360, h = 120, pad = 8;
    const vs = values.map(x => x.v);
    const max = Math.max(...vs);
    const min = Math.min(...vs);
    const range = Math.max(1e-9, max - min);
    const stepX = (w - pad * 2) / Math.max(1, values.length - 1);
    const pts = values.map((x, i) => {
      const xPos = pad + i * stepX;
      const yPos = h - pad - ((x.v - min) / range) * (h - pad * 2);
      return `${xPos},${yPos}`;
    }).join(' ');
    const last = values[values.length - 1]?.v ?? 0;
    const first = values[0]?.v ?? 0;
    const diffPct = first ? ((last - first) / first) * 100 : 0;
    el.innerHTML = `<div style="display:flex;justify-content:space-between;margin-bottom:6px;">
        <span style="color:var(--muted)">Изм.: ${diffPct.toFixed(2)}%</span>
        <span style="font-weight:700;">${last.toFixed(4)}</span>
      </div>
      <svg width="100%" viewBox="0 0 ${w} ${h}"><polyline fill="none" stroke="var(${colorVar})" stroke-width="2" points="${pts}"/></svg>`;
  }

  async function pollRealtime() {
    try {
      // Reuse the same API base, but fetch per currency base for EUR / USD
      const eurRes = await fetch(`${API_BASE}EUR`);
      const usdRes = await fetch(`${API_BASE}USD`);
      if (!eurRes.ok || !usdRes.ok) throw new Error('Bad response');
      const eur = await eurRes.json();
      const usd = await usdRes.json();
      const eurUsd = eur.rates['USD'];
      const eurUah = eur.rates['UAH'] || (eur.rates['USD'] && usd.rates['UAH'] ? (usd.rates['UAH'] / (1/eur.rates['USD'])) : null);
      const usdUah = usd.rates['UAH'];

      if (eurUsd) pushHistory('EURUSD', eurUsd);
      if (eurUah) pushHistory('EURUAH', eurUah);
      if (usdUah) pushHistory('USDUAH', usdUah);

      renderLineChart(chartEURUSD, history['EURUSD'], '--primary');
      renderLineChart(chartEURUAH, history['EURUAH'], '--success');
      renderLineChart(chartUSDUAH, history['USDUAH'], '--warning');
    } catch (e) {
      console.warn('Realtime polling error', e);
    }
  }

  // kick off
  pollRealtime();
  setInterval(pollRealtime, CHART_INTERVAL_MS);

  // Quick amounts
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.classList && t.classList.contains('chip') && t.dataset.amount) {
      amountInput.value = t.dataset.amount;
      calculateConversion();
    }
  });

  // Persist form state
  function saveFormState() {
    try {
      localStorage.setItem(FORM_STATE_KEY, JSON.stringify({
        amount: parseFloat(amountInput.value || '0') || 0,
        from: fromSelect.value,
        to: toSelect.value,
      }));
    } catch(_){}
  }
  amountInput.addEventListener('input', saveFormState);
  fromSelect.addEventListener('change', saveFormState);
  toSelect.addEventListener('change', saveFormState);
})();
