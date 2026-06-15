document.addEventListener("DOMContentLoaded", () => {
    // --- 1. SECURITY/SESSION GUARD ---
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!token || !user) {
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

    // Grid should stay empty until user searches
    const grid = document.getElementById('papers-grid');
    if (grid) grid.innerHTML = '';

    let hasSearched = false;

    searchBtn.addEventListener('click', () => {
        hasSearched = true;

        const subName = document.getElementById('filter-sub-name').value;
        const subCode = document.getElementById('filter-sub-code').value;
        const examType = document.getElementById('filter-type').value;

        fetchPapers({ subName, subCode, examType, hasSearched });
    });

    // Main layout structure to query your Render backend endpoints
    async function fetchPapers({ subName = '', subCode = '', examType = '', hasSearched = false }) {
        try {
            const backendBase = 'https://pyqhubds.onrender.com/api';

            let queryUrl = `${backendBase}/papers/list`;
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

            const papers = await response.json();

            if (response.ok && Array.isArray(papers) && papers.length > 0) {
                grid.innerHTML = papers
                    .map(paper => `
                    <a href="#" target="_blank" class="paper-card-link" data-paper-id="${paper._id}" style="text-decoration: none; color: inherit; display: block;">
                        <div class="paper-card card" style="cursor: pointer;">
                            <h3>${paper.subjectName}</h3>
                            <p>Code: ${paper.subjectCode}</p>
                            <span class="badge">${paper.examType}</span>
                        </div>
                    </a>
                `)
                    .join('');

                grid.querySelectorAll('.paper-card-link').forEach(a => {
                    a.addEventListener('click', async (ev) => {
                        ev.preventDefault();

                        const paperId = a.getAttribute('data-paper-id');
                        if (!paperId) return;

                        const downloadUrl = `${backendBase}/papers/download/${paperId}`;

                        try {
                            const pdfResp = await fetch(downloadUrl, {
                                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                            });

                            if (!pdfResp.ok) {
                                const txt = await pdfResp.text().catch(() => '');
                                throw new Error(`Download failed (${pdfResp.status}). ${txt}`);
                            }

                            const blob = await pdfResp.blob();
                            const objectUrl = URL.createObjectURL(blob);

                            window.open(objectUrl, '_blank', 'noopener');
                            setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
                        } catch (err) {
                            console.error('PDF download/open error:', err);
                            alert('Failed to download the paper.');
                        }
                    });
                });
            } else {
                if (hasSearched) {
                    grid.innerHTML = `<p class="no-data">No papers found matching your criteria.</p>`;
                }
            }
        } catch (err) {
            console.error('Detailed Fetch Error:', err);
            if (hasSearched) {
                grid.innerHTML = `<p class="no-data">Error fetching files from database.</p>`;
            }
        }
    }
});

