(() => {
  const STORAGE_KEY = 'taskflow.theme';
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      const icon = toggle.querySelector('.theme-toggle__icon');
      const text = toggle.querySelector('.theme-toggle__text');
      if (theme === 'dark') {
        if (icon) icon.textContent = '🌙';
        if (text) text.textContent = 'Тёмная';
      } else {
        if (icon) icon.textContent = '🌞';
        if (text) text.textContent = 'Светлая';
      }
    }
  }

  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (_) {}
  }

  const saved = getStoredTheme();
  const initial = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(initial);

  document.addEventListener('click', (e) => {
    const target = e.target;
    const btn = target && (target.id === 'theme-toggle' ? target : target.closest && target.closest('#theme-toggle'));
    if (!btn) return;
    if (window.auth && window.auth.getSession && !window.auth.getSession()) {
      // allow theme toggle even if not logged, no-op
    }
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setStoredTheme(next);
  });
})();


