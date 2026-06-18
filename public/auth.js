// AUTH.JS (Email-only login)

// --- 1. DARK / LIGHT THEME TOGGLE ---
const themeToggleBtn = document.getElementById('theme-toggle-btn');
if (themeToggleBtn) {
  const themeIcon = themeToggleBtn.querySelector('i');

  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-theme');
    if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
  }

  themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');

    if (themeIcon) {
      themeIcon.classList.replace(
        isLight ? 'fa-moon' : 'fa-sun',
        isLight ? 'fa-sun' : 'fa-moon'
      );
    }

    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });
}

// --- 2. EMAIL-ONLY LOGIN (validate email exists and allow session) ---
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginStatus = document.getElementById('login-status');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginEmailInput.value.trim();
    loginStatus.textContent = 'Verifying...';

    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await resp.json().catch(() => ({}));

      if (!resp.ok) {
        loginStatus.textContent = data?.message || 'Login failed';
        return;
      }

      // Server returns { token, user } for JWT flows.
      // For this app, we'll simply redirect if successful.
      window.location.href = '/dashboard';
    } catch (err) {
      loginStatus.textContent = 'Network error';
      console.error(err);
    }
  });
}



