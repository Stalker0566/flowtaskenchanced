(() => {
  const form = document.getElementById('auth-form');
  const email = document.getElementById('auth-email');
  const password = document.getElementById('auth-password');
  const errorEl = document.getElementById('auth-error');
  const toggleBtn = document.getElementById('toggle-mode');
  const submitBtn = document.getElementById('auth-submit');
  const remember = document.getElementById('remember-me');
  const togglePass = document.getElementById('toggle-password');
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
  const backToLogin = document.getElementById('back-to-login');
  const pageTitle = document.getElementById('page-title');
  const pageSubtitle = document.getElementById('page-subtitle');

  let mode = 'login'; // or 'signup'

  function setError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
  }
  
  function clearError() { 
    if (errorEl) errorEl.classList.add('hidden'); 
  }

  function showForm(formToShow) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.add('hidden');
    });
    
    // Show the requested form
    if (formToShow) {
      formToShow.classList.remove('hidden');
    }
  }

  function updatePageTitle(title, subtitle) {
    if (pageTitle) pageTitle.textContent = title;
    if (pageSubtitle) pageSubtitle.textContent = subtitle;
  }

  toggleBtn.addEventListener('click', () => {
    mode = mode === 'login' ? 'signup' : 'login';
    
    if (mode === 'login') {
      submitBtn.textContent = 'Sign In';
      toggleBtn.textContent = 'Create New Account';
      updatePageTitle('Welcome Back', 'Sign in to your account to continue');
    } else {
      submitBtn.textContent = 'Create Account';
      toggleBtn.textContent = 'Already have an account?';
      updatePageTitle('Create Account', 'Join TaskFlow and boost your productivity');
    }
    
    showForm(form);
    clearError();
  });

  togglePass.addEventListener('click', () => {
    const isPwd = password.type === 'password';
    password.type = isPwd ? 'text' : 'password';
    togglePass.textContent = isPwd ? 'Hide' : 'Show';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    const mail = email.value.trim();
    const pass = password.value;
    
    if (!mail || !pass) { 
      setError('Please enter both email and password'); 
      return; 
    }
    
    try {
      if (mode === 'signup') {
        const res = await window.authAPI.signup(mail, pass);
        verifyEmail.value = res.email;
        verifyHint.textContent = `Demo code: ${res.verification_code}`;
        updatePageTitle('Verify Your Account', 'Check your email for the verification code');
        showForm(verifyForm);
      } else {
        await window.authAPI.login(mail, pass, !!remember.checked);
        window.location.href = 'index.html';
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  });

  verifyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    verifyError.classList.add('hidden');
    
    try {
      await window.authAPI.verifySignup(verifyEmail.value.trim(), verifyCode.value.trim());
      window.location.href = 'index.html';
    } catch (err) {
      verifyError.textContent = err.message || 'Verification failed';
      verifyError.classList.remove('hidden');
    }
  });

  resendCode.addEventListener('click', async () => {
    verifyError.classList.add('hidden');
    
    try {
      const res = await window.authAPI.resendCode(verifyEmail.value.trim());
      verifyHint.textContent = `Code sent (demo): ${res.verification_code}`;
    } catch (err) {
      verifyError.textContent = err.message || 'Failed to resend code';
      verifyError.classList.remove('hidden');
    }
  });

  // Forgot / Recovery
  forgotBtn.addEventListener('click', () => {
    updatePageTitle('Reset Password', 'Enter your email to receive a recovery code');
    showForm(recForm);
  });

  backToLogin.addEventListener('click', () => {
    updatePageTitle('Welcome Back', 'Sign in to your account to continue');
    showForm(form);
    clearError();
  });

  document.getElementById('request-code').addEventListener('click', async () => {
    recErr.classList.add('hidden');
    recHint.textContent = '';
    
    try {
      const res = await window.authAPI.requestRecovery(recEmail.value.trim());
      recHint.textContent = `Code sent (demo): ${res.recovery_code}`;
    } catch (e) {
      recErr.textContent = e.message || 'Failed to send recovery code';
      recErr.classList.remove('hidden');
    }
  });

  recForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    recErr.classList.add('hidden');
    
    try {
      await window.authAPI.resetPassword(recEmail.value.trim(), recCode.value.trim(), recNewPass.value);
      recHint.textContent = 'Password reset successfully. Please sign in with your new password.';
      recHint.style.color = '#16a34a';
      
      // Auto redirect to login after 2 seconds
      setTimeout(() => {
        updatePageTitle('Welcome Back', 'Sign in to your account to continue');
        showForm(form);
        clearError();
      }, 2000);
    } catch (e) {
      recErr.textContent = e.message || 'Password reset failed';
      recErr.classList.remove('hidden');
    }
  });
})();


