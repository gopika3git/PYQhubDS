document.addEventListener("DOMContentLoaded", () => {
    // --- 1. SECURITY/SESSION GUARD ---
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
        // Stop unauthorized access immediately
        window.location.href = '/index.html';
        return;
    }

    // Populate user greeting banner dynamically
    document.getElementById('user-display').innerText = `Welcome, ${user.name || 'User'}`;

    // --- 2. RETRIEVE GLOBAL PERSISTED THEME ---
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const themeIcon = themeToggleBtn.querySelector('i');

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

    // --- 3. LOGOUT MECHANISM ---
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/index.html';
    });

    // --- 4. INITIAL PYQ DATA FETCH ---
    fetchPapers();
});

// Main layout structure to query your Render backend endpoints 
async function fetchPapers() {
    const grid = document.getElementById('papers-grid');
    try {
        // Updated to point directly to your live Render server
        const response = await fetch('https://pyqhubds.onrender.com/api/papers', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const papers = await response.json();
        
        if (response.ok && papers.length > 0) {
            grid.innerHTML = papers.map(paper => `
                <div class="paper-card card">
                    <h3>${paper.subjectName}</h3>
                    <p>Code: ${paper.subjectCode}</p>
                    <span class="badge">${paper.examType}</span>
                </div>
            `).join('');
        } else {
            grid.innerHTML = `<p class="no-data">No papers uploaded yet.</p>`;
        }
    } catch (err) {
        grid.innerHTML = `<p class="no-data">Error fetching files from database.</p>`;
    }
}