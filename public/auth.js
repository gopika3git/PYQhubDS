// --- 1. PASSWORD EYE TOGGLE ---
const togglePasswordEye = document.getElementById('toggle-password-eye');
const passwordInput = document.getElementById('auth-password');

if (togglePasswordEye && passwordInput) {
    togglePasswordEye.addEventListener('click', () => {
        const isPassword = passwordInput.getAttribute('type') === 'password';
        passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
        togglePasswordEye.classList.toggle('fa-eye');
        togglePasswordEye.classList.toggle('fa-eye-slash');
    });
}

// --- 2. DARK / LIGHT THEME TOGGLE ---
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
            themeIcon.classList.replace(isLight ? 'fa-moon' : 'fa-sun', isLight ? 'fa-sun' : 'fa-moon');
        }
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

// --- 3. LOGIN LOGIC ---
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const password = passwordInput ? passwordInput.value : '';

        if (!email || !password) {
            alert("Please fill in all fields");
            return;
        }

        try {
            const response = await fetch('https://pyqhubds.onrender.com/api/auth/login', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token);
                
                const userPayload = {
                    id: data.user.id || data.user._id,
                    name: data.user.name || "User", 
                    email: data.user.email
                };
                localStorage.setItem('user', JSON.stringify(userPayload));
                window.location.href = '/dashboard.html';
            } else {
                alert(data.message || "Authentication failed");
                if (response.status === 403) {
                    window.location.href = '/register.html';
                }
            }
        } catch (err) {
            console.error("Login error:", err);
            alert("Something went wrong with the server.");
        }
    });
}

// --- 4. NEW: UNIFIED REGISTER LOGIC ---
const registerBtn = document.getElementById('register-btn');
if (registerBtn) {
    registerBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Pull input values (Make sure these element IDs match your register.html inputs!)
        const name = document.getElementById('reg-name')?.value.trim();
        const email = document.getElementById('reg-email')?.value.trim();
        const password = document.getElementById('reg-password')?.value;
        const role = document.getElementById('reg-role')?.value || 'student'; // Defaults to student

        if (!name || !email || !password) {
            alert("Please fill in all registration fields.");
            return;
        }

        try {
            const response = await fetch('https://pyqhubds.onrender.com/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role })
            });

            const data = await response.json();

            if (response.ok) {
                alert("🎉 Registration successful! Redirecting to login page...");
                // Send them straight back to your login script interface
                window.location.href = '/index.html'; 
            } else {
                alert(data.message || data.error || "Registration failed.");
                if (response.status === 403) {
                    window.location.href = '/register.html';
                }
            }
        } catch (err) {
            console.error("Registration error:", err);
            alert("Could not reach the authentication server.");
        }
    });
}