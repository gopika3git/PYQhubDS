// --- 1. PASSWORD EYE TOGGLE ---
const togglePasswordEye = document.getElementById('toggle-password-eye');
const passwordInput = document.getElementById('auth-password');

togglePasswordEye.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    
    // Toggle icon looks
    togglePasswordEye.classList.toggle('fa-eye');
    togglePasswordEye.classList.toggle('fa-eye-slash');
});

// --- 2. DARK / LIGHT THEME TOGGLE ---
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const themeIcon = themeToggleBtn.querySelector('i');

// Check system/local preference
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-theme');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    
    themeIcon.classList.replace(isLight ? 'fa-moon' : 'fa-sun', isLight ? 'fa-sun' : 'fa-moon');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
});

// --- 3. LOGIN & REDIRECT LOGIC ---
const loginBtn = document.getElementById('login-btn');

loginBtn.addEventListener('click', async () => {
    const email = document.getElementById('auth-email').value;
    const password = passwordInput.value;

    if (!email || !password) {
        alert("Please fill in all fields");
        return;
    }

    try {
        // Updated to your exact Render URL string
        const response = await fetch('https://pyqhubds.onrender.com/api/auth/login', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Save authentication data securely in user's browser
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user)); // contains name, role, etc.
            
            // MAGIC LINE: Send them to the dashboard page!
            window.location.href = '/dashboard.html';
        } else {
            alert(data.message || "Authentication failed");
        }
    } catch (err) {
        console.error("Login error:", err);
        alert("Something went wrong with the server.");
    }
});