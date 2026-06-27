// --- AUTH.JS (Google OAuth ONLY)
// Login page now contains ONLY a “Sign in with Google” button.
// This script only keeps the optional dark/light theme toggle if present.

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


