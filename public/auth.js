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

// --- 2. EMAIL-ONLY LOGIN (validate email exists with a 3-second cooldown) ---
const loginForm = document.getElementById('login-form');
const loginEmailInput = document.getElementById('login-email');
const loginStatus = document.getElementById('login-status');
const submitButton = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
// Inside your Google Auth success callback function:
const user = response.user; // Your Google user object

// Save their real full name and email to localStorage
localStorage.setItem('userName', user.displayName); 
localStorage.setItem('userEmail', user.email);
// Lock flag to prevent continuous rapid execution
let isRequestCooldown = false;

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. If cooldown is active, intercept the submit event and alert user
    if (isRequestCooldown) {
      loginStatus.textContent = 'Please wait 3 seconds before trying again...';
      return;
    }

    const email = loginEmailInput.value.trim();
    loginStatus.textContent = 'Verifying...';
    
    // 2. Lock execution loop and visually disable submit button
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

      // Server returns { token, user } for JWT flows.
      // For this app, we'll simply redirect if successful.
      window.location.href = '/dashboard';
    } catch (err) {
      loginStatus.textContent = 'Network error';
      console.error(err);
    } finally {
      // 3. Initiate the mandatory 3-second cooldown window before allowing next run
      setTimeout(() => {
        isRequestCooldown = false;
        if (submitButton) submitButton.disabled = false;
        
        // Clear status text if it's currently showing the cooldown warning
        if (loginStatus.textContent.includes('Please wait')) {
          loginStatus.textContent = '';
        }
      }, 3000); // 3000 milliseconds = 3 seconds
    }
  });
}