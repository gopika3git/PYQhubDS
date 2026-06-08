// --- 1. PASSWORD EYE TOGGLE ---
const togglePasswordEye = document.getElementById('toggle-password-eye');
const passwordInput = document.getElementById('auth-password');

if (togglePasswordEye && passwordInput) {
    togglePasswordEye.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        
        // Toggle icon looks cleanly
        togglePasswordEye.classList.toggle('fa-eye');
        togglePasswordEye.classList.toggle('fa-eye-slash');
    });
}

// --- 2. DARK / LIGHT THEME TOGGLE ---
const themeToggleBtn = document.getElementById('theme-toggle-btn');
if (themeToggleBtn) {
    const themeIcon = themeToggleBtn.querySelector('i');

    // Check system/local preference
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-theme');
        if (themeIcon) themeIcon.classList.replace('fa-moon', 'fa-sun');
    }

    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        
        if (themeIcon) {
            themeIcon.classList.replace(isLight ? 'fa-moon' : 'fa-sun', isLight ? 'fa-sun' : 'fa-moon');
        }
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// --- 3. LOGIN & REDIRECT LOGIC ---
const loginBtn = document.getElementById('login-btn');

if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('auth-email').value;
        const password = passwordInput ? passwordInput.value : '';

        if (!email || !password) {
            alert("Please fill in all fields");
            return;
        }

        try {
            // Target the live Render authentication endpoint
            const response = await fetch('https://pyqhubds.onrender.com/api/auth/login', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // Save authentication token securely
                localStorage.setItem('token', data.token);
                
                // 🔥 THE FIX: Explicitly safeguard the name structure coming back from your database document
                const userPayload = {
                    _id: data.user._id || data.user.id || data.user.userId,
                    name: data.user.name || data.user.username || "User", 
                    email: data.user.email
                };
                
                // Save sanitized structural data block fresh into the browser's session storage
                localStorage.setItem('user', JSON.stringify(userPayload));
                
                // Route them cleanly into your feed grid dashboard layout
                window.location.href = '/dashboard.html';
            } else {
                alert(data.message || "Authentication failed");
            }
        } catch (err) {
            console.error("Login error:", err);
            alert("Something went wrong with the server.");
        }
    });
}