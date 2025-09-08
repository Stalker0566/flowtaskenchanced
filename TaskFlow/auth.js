(() => {
  const USERS_KEY = 'taskflow.auth.users.v1';
  const SESSION_KEY = 'taskflow.auth.session.v1';
  const SESSION_EXP_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  const RECOVERY_KEY = 'taskflow.auth.recovery.v1';
  const SIGNUP_VERIF_KEY = 'taskflow.auth.signup.verif.v1';

  function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch(_) { return []; }
  }
  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
  function getSession() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (!s) return null;
      if (s.expiresAt && Date.now() > s.expiresAt) { clearSession(); return null; }
      return s;
    } catch(_) { return null; }
  }
  function setSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  function clearSession() { localStorage.removeItem(SESSION_KEY); }

  async function hash(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  window.auth = {
    getSession,
    clearSession,
    async signup(email, password) {
      const users = getUsers();
      if (users.find(u=>u.email===email)) throw new Error('Пользователь уже существует');
      const passwordHash = await hash(password);
      // create pending signup with verification code
      const code = Math.floor(100000 + Math.random()*900000).toString().slice(0, Math.random()>0.5 ? 5 : 6);
      const pending = JSON.parse(localStorage.getItem(SIGNUP_VERIF_KEY) || '{}');
      pending[email] = { passwordHash, code, ts: Date.now() };
      localStorage.setItem(SIGNUP_VERIF_KEY, JSON.stringify(pending));
      // In real app, email would be sent. Here we return code so UI can show hint (optional)
      return { email, code };
    },
    async login(email, password, remember=false) {
      const users = getUsers();
      const user = users.find(u=>u.email===email);
      if (!user) throw new Error('Неверный email или пароль');
      const passwordHash = await hash(password);
      if (user.passwordHash !== passwordHash) throw new Error('Неверный email или пароль');
      const session = { userId: user.id, email: user.email, createdAt: Date.now() };
      if (remember) session.expiresAt = Date.now() + SESSION_EXP_MS;
      setSession(session);
      return user;
    },
    // Recovery code flow (stored locally, demo only)
    requestRecovery(email) {
      const users = getUsers();
      const user = users.find(u=>u.email===email);
      if (!user) throw new Error('Email не найден');
      const code = Math.floor(100000 + Math.random()*900000).toString();
      const byEmail = JSON.parse(localStorage.getItem(RECOVERY_KEY) || '{}');
      byEmail[email] = { code, ts: Date.now() };
      localStorage.setItem(RECOVERY_KEY, JSON.stringify(byEmail));
      return code; // в реальном мире отправили бы email
    },
    async resetPassword(email, code, newPassword) {
      const byEmail = JSON.parse(localStorage.getItem(RECOVERY_KEY) || '{}');
      const rec = byEmail[email];
      if (!rec || rec.code !== code) throw new Error('Неверный код');
      const users = getUsers();
      const user = users.find(u=>u.email===email);
      if (!user) throw new Error('Email не найден');
      user.passwordHash = await hash(newPassword);
      saveUsers(users);
      delete byEmail[email];
      localStorage.setItem(RECOVERY_KEY, JSON.stringify(byEmail));
      return true;
    },
    resendSignupCode(email) {
      const pending = JSON.parse(localStorage.getItem(SIGNUP_VERIF_KEY) || '{}');
      if (!pending[email]) throw new Error('Нет незавершённой регистрации');
      const code = Math.floor(100000 + Math.random()*900000).toString().slice(0, Math.random()>0.5 ? 5 : 6);
      pending[email].code = code; pending[email].ts = Date.now();
      localStorage.setItem(SIGNUP_VERIF_KEY, JSON.stringify(pending));
      return code;
    },
    async verifySignup(email, code) {
      const pending = JSON.parse(localStorage.getItem(SIGNUP_VERIF_KEY) || '{}');
      const rec = pending[email];
      if (!rec || rec.code !== code) throw new Error('Неверный или просроченный код');
      // finalize user
      const users = getUsers();
      if (users.find(u=>u.email===email)) { delete pending[email]; localStorage.setItem(SIGNUP_VERIF_KEY, JSON.stringify(pending)); throw new Error('Пользователь уже существует'); }
      const user = { id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, email, passwordHash: rec.passwordHash };
      users.push(user); saveUsers(users);
      delete pending[email]; localStorage.setItem(SIGNUP_VERIF_KEY, JSON.stringify(pending));
      setSession({ userId: user.id, email: user.email, createdAt: Date.now() });
      return user;
    }
  };
})();


