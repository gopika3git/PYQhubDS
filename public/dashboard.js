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

    // --- 4. FILTER BUTTON INITIALIZATION ---
    const searchBtn = document.getElementById('search-btn');
    searchBtn.addEventListener('click', () => {
        const subName = document.getElementById('filter-sub-name').value;
        const subCode = document.getElementById('filter-sub-code').value;
        const examType = document.getElementById('filter-type').value;
        
        // Pass selections into fetch pipeline
        fetchPapers(subName, subCode, examType);
    });

    // --- 5. INITIAL PYQ DATA FETCH ---
    fetchPapers();
});

// Main layout structure to query your Render backend endpoints
async function fetchPapers(subName = '', subCode = '', examType = '') {
    const grid = document.getElementById('papers-grid');
    try {
        let queryUrl = 'https://pyqhubds.onrender.com/api/papers/list';
        const params = new URLSearchParams();
        if (subName) params.append('subjectName', subName);
        if (subCode) params.append('subjectCode', subCode);
        if (examType) params.append('examType', examType);
        
        if (params.toString()) {
            queryUrl += `?${params.toString()}`;
        }

        const response = await fetch(queryUrl, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        console.log("Backend Response Status:", response.status);
        
        const papers = await response.json();
        console.log("Data received from backend:", papers);
        
        if (response.ok && papers.length > 0) {
            grid.innerHTML = papers.map(paper => {
                // Safeguard lookup mapping your exact schema layout structure: paper.images[0].url
                const fileLink = paper.images && paper.images.length > 0 && paper.images[0].url 
                    ? paper.images[0].url 
                    : '#';
                
                // Wrap the whole card block layout cleanly inside an anchor link component
                return `
                    <a href="${fileLink}" target="_blank" class="paper-card-link" style="text-decoration: none; color: inherit; display: block;">
                        <div class="paper-card card" style="cursor: pointer;">
                            <h3>${paper.subjectName}</h3>
                            <p>Code: ${paper.subjectCode}</p>
                            <span class="badge">${paper.examType}</span>
                        </div>
                    </a>
                `;
            }).join('');
        } else {
            grid.innerHTML = `<p class="no-data">No papers found matching your criteria.</p>`;
        }
    } catch (err) {
        console.error("Detailed Fetch Error:", err);
        grid.innerHTML = `<p class="no-data">Error fetching files from database.</p>`;
    }
}