(() => {
  const form = document.getElementById('auth-form');
  const email = document.getElementById('auth-email');
  const password = document.getElementById('auth-password');
  const errorEl = document.getElementById('auth-error');
  const toggleBtn = document.getElementById('toggle-mode');
  const submitBtn = document.getElementById('auth-submit');
  const remember = document.getElementById('remember-me');
  const togglePass = document.getElementById('toggle-password');
  const strength = document.getElementById('password-strength');
  const forgotBtn = document.getElementById('forgot-btn');
  const recForm = document.getElementById('recovery-form');
  const recEmail = document.getElementById('recovery-email');
  const recCode = document.getElementById('recovery-code');
  const recNewPass = document.getElementById('recovery-newpass');
  const recErr = document.getElementById('recovery-error');
  const recHint = document.getElementById('recovery-hint');
  const verifyForm = document.getElementById('verify-form');
  const verifyEmail = document.getElementById('verify-email');
  const verifyCode = document.getElementById('verify-code');
  const verifyError = document.getElementById('verify-error');
  const verifyHint = document.getElementById('verify-hint');
  const resendCode = document.getElementById('resend-code');

  let mode = 'login'; // or 'signup'

  function setError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }
  function clearError() { if (errorEl) errorEl.style.display = 'none'; }

  toggleBtn.addEventListener('click', () => {
    mode = mode === 'login' ? 'signup' : 'login';
    submitBtn.textContent = mode === 'login' ? 'Войти' : 'Зарегистрироваться';
    toggleBtn.textContent = mode === 'login' ? 'Перейти к регистрации' : 'У меня уже есть аккаунт';
    clearError();
  });

  togglePass.addEventListener('click', () => {
    const isPwd = password.type === 'password';
    password.type = isPwd ? 'text' : 'password';
    togglePass.textContent = isPwd ? 'Скрыть' : 'Показать';
  });

  password.addEventListener('input', () => {
    const val = password.value;
    const score = (val.length >= 8) + /[A-ZА-Я]/.test(val) + /[a-zа-я]/.test(val) + /\d/.test(val) + /[^\w\s]/.test(val);
    const labels = ['Очень слабый', 'Слабый', 'Средний', 'Хороший', 'Сильный'];
    const idx = Math.max(0, Math.min(labels.length-1, score-1));
    strength.textContent = `Надёжность: ${labels[idx]}`;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const mail = email.value.trim();
    const pass = password.value;
    if (!mail || !pass) { setError('Введите email и пароль'); return; }
    try {
      if (mode === 'signup') {
        const res = await window.auth.signup(mail, pass);
        verifyEmail.value = res.email;
        verifyHint.textContent = `Код (демо): ${res.code}`; // показываем код локально для демонстрации
        verifyForm.style.display = 'flex';
        form.style.display = 'none';
      } else {
        await window.auth.login(mail, pass, !!remember.checked);
        window.location.href = 'index.html';
      }
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    }
  });

  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    verifyError.style.display = 'none';
    try {
      await window.auth.verifySignup(verifyEmail.value.trim(), verifyCode.value.trim());
      window.location.href = 'index.html';
    } catch (err) {
      verifyError.textContent = err.message || 'Ошибка подтверждения';
      verifyError.style.display = 'block';
    }
  });

  resendCode.addEventListener('click', () => {
    verifyError.style.display = 'none';
    try {
      const code = window.auth.resendSignupCode(verifyEmail.value.trim());
      verifyHint.textContent = `Код отправлен (демо): ${code}`;
    } catch (err) {
      verifyError.textContent = err.message || 'Ошибка';
      verifyError.style.display = 'block';
    }
  });

  // Forgot / Recovery
  forgotBtn.addEventListener('click', () => {
    recForm.style.display = recForm.style.display === 'none' ? 'flex' : 'none';
  });
  document.getElementById('request-code').addEventListener('click', () => {
    recErr.style.display = 'none';
    recHint.textContent = '';
    try {
      const code = window.auth.requestRecovery(recEmail.value.trim());
      recHint.textContent = `Код отправлен (для демо): ${code}`;
    } catch (e) {
      recErr.textContent = e.message || 'Ошибка';
      recErr.style.display = 'block';
    }
  });
  recForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    recErr.style.display = 'none';
    try {
      await window.auth.resetPassword(recEmail.value.trim(), recCode.value.trim(), recNewPass.value);
      recHint.textContent = 'Пароль сброшен. Войдите с новым паролем.';
    } catch (e) {
      recErr.textContent = e.message || 'Ошибка';
      recErr.style.display = 'block';
    }
  });
})();


