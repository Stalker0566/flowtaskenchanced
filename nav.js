(() => {
  function updateNav() {
    try {
      const session = window.auth && window.auth.getSession ? window.auth.getSession() : null;
      const loginLink = document.getElementById('login-link');
      const logoutBtn = document.getElementById('logout-btn');
      const userChip = document.getElementById('user-chip');
      if (session) {
        if (loginLink) loginLink.style.display = 'none';
        if (userChip) {
          userChip.style.display = 'inline-flex';
          const name = session.email.split('@')[0];
          userChip.textContent = `👤 ${name}`;
        }
        if (logoutBtn) {
          logoutBtn.style.display = 'inline-flex';
          logoutBtn.onclick = () => {
            window.auth && window.auth.clearSession && window.auth.clearSession();
            window.location.href = 'login.html';
          };
        }
      } else {
        if (loginLink) loginLink.style.display = 'inline-flex';
        if (userChip) userChip.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
      }
    } catch (_) {}
  }
  document.addEventListener('DOMContentLoaded', updateNav);
})();


