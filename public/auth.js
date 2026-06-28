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

// --- 2. EMAIL-ONLY LOGIN ---
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginStatus = document.getElementById('login-status');
const submitButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;

let isRequestCooldown = false;

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isRequestCooldown) {
      loginStatus.textContent = 'Please wait 3 seconds before trying again...';
      return;
    }

    const email = loginEmailInput.value.trim();
    loginStatus.textContent = 'Verifying...';
    
    isRequestCooldown = true;
    if (submitButton) submitButton.disabled = true;

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

      // Safe extraction: fall back to the username part of the email if data.user.displayName isn't passed
      const determinedName = data?.user?.displayName || email.split('@')[0];
      localStorage.setItem('userName', determinedName);
      localStorage.setItem('userEmail', email);

      window.location.assign('/dashboard.html');

    } catch (err) {
      loginStatus.textContent = 'Network error';
      console.error(err);
    } finally {
      setTimeout(() => {
        isRequestCooldown = false;
        if (submitButton) submitButton.disabled = false;
        
        if (loginStatus.textContent.includes('Please wait')) {
          loginStatus.textContent = '';
        }
      }, 3000);
    }
  });
}