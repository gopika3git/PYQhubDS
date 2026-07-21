document.addEventListener("DOMContentLoaded", () => {
  // --- Gopika's Disclaimer Banner Logic ---
  const banner = document.getElementById("gopika-disclaimer");
  const closeBtn = document.getElementById("close-disclaimer");

  // --- User Identity Extraction ---
  let userName = localStorage.getItem('userName'); 

  const cookieMatch = document.cookie && document.cookie.match(/(?:^|;\s*)userNamePayload=([^;]+)/i);
  if (cookieMatch && cookieMatch[1]) {
    userName = decodeURIComponent(cookieMatch[1]);
    localStorage.setItem('userName', userName);
    
    document.cookie = "userNamePayload=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; secure; SameSite=None;";
  }

  const userDisplay = document.getElementById('user-display');
  if (userDisplay && userName) {
      userDisplay.innerText = userName; 
  }

  if (banner && closeBtn) {
      let hideTimer = null;

      setTimeout(() => {
          if (!document.body.contains(banner)) return;
          banner.classList.add("show");
      }, 1000);

      const hideBanner = () => {
          if (hideTimer) clearTimeout(hideTimer);
          hideTimer = null;

          if (!banner || !document.body.contains(banner)) return;

          banner.classList.remove("show");
          banner.classList.add("dismissed");

          try {
            banner.style.setProperty("top", "-100px");
            banner.style.setProperty("display", "none", "important");
            banner.style.setProperty("pointer-events", "none", "important");
          } catch (e) {}

          try { closeBtn.setAttribute("disabled", "true"); } catch (e) {}

          try {
            if (banner.parentNode) banner.parentNode.removeChild(banner);
          } catch (e) {
            try { banner.style.setProperty("display", "none", "important"); } catch (e2) {}
          }
      };

      closeBtn.addEventListener("click", hideBanner, { passive: true });
      hideTimer = setTimeout(hideBanner, 15000);
  }

  // --- 2. GLOBAL PERSISTED THEME ---
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  if (themeToggleBtn) {
    const themeIcon = themeToggleBtn.querySelector("i");

    if (localStorage.getItem("theme") === "light") {
      document.body.classList.add("light-theme");
      if (themeIcon) themeIcon.classList.replace("fa-moon", "fa-sun");
    }

    themeToggleBtn.addEventListener("click", () => {
      document.body.classList.toggle("light-theme");
      const isLight = document.body.classList.contains("light-theme");
      if (themeIcon) {
        themeIcon.classList.replace(
          isLight ? "fa-moon" : "fa-sun",
          isLight ? "fa-sun" : "fa-moon",
        );
      }
      localStorage.setItem("theme", isLight ? "light" : "dark");
    });
  }

  // --- 3. ADAPTIVE DIFFICULTY HELPER FUNCTIONS ---
  function getDifficultyBadge(rating = 5.0) {
    let label = 'Medium';
    let color = '#f39c12'; // Yellow/Orange

    if (rating < 4.0) {
      label = 'Easy';
      color = '#2ecc71'; // Green
    } else if (rating >= 7.0) {
      label = 'Hard';
      color = '#e74c3c'; // Red
    }

    return `<span class="badge" style="background-color: ${color}; color: #fff; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: bold;">
              ${label} (${rating})
            </span>`;
  }

  async function submitVote(paperId) {
    const userRating = prompt("Rate this paper's difficulty on a scale of 1 to 10 (1 = Super Easy, 10 = Extremely Hard):");
    if (!userRating) return;

    const ratingNum = parseFloat(userRating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 10) {
      alert("Invalid input! Please enter a number between 1 and 10.");
      return;
    }

    try {
      const res = await fetch(`${backendBase}/papers/vote/${paperId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: ratingNum }),
        credentials: 'include'
      });

      const data = await res.json();
      if (res.ok) {
        alert(`Thank you! New difficulty rating: ${data.difficultyRating} (${data.totalVotes} total votes)`);
        
        // Refresh grid or samples to reflect newly calculated rating
        if (hasSearched) {
          triggerSearch();
        } else {
          loadSamplePapers();
        }
      } else {
        alert(data.error || "Failed to submit vote.");
      }
    } catch (err) {
      console.error("Voting error:", err);
      alert("Error submitting vote.");
    }
  }

  // --- 4. FILTER BUTTON INITIALIZATION ---
  const searchBtn = document.getElementById("search-btn");
  const grid = document.getElementById("papers-grid");
  let hasSearched = false;
  const backendBase = "/api"; 

  loadSamplePapers();

  function triggerSearch() {
    hasSearched = true;
    if (grid) grid.innerHTML = "";

    const subName = document.getElementById("filter-sub-name")?.value || "";
    const subCode = document.getElementById("filter-sub-code")?.value || "";
    const examType = document.getElementById("filter-type")?.value || "";
    const difficulty = document.getElementById("filter-difficulty")?.value || "";

    fetchPapers({ subName, subCode, examType, difficulty, hasSearched });
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", triggerSearch);
  }

  async function loadSamplePapers() {
    const sampleContainer = document.getElementById("sample-papers");
    if (!sampleContainer) return;

    try {
      const response = await fetch(`${backendBase}/papers/list`, { credentials: 'include' });
      if (!response.ok) throw new Error(`Failed to load samples (${response.status})`);

      const papers = await response.json();
      if (!Array.isArray(papers) || papers.length === 0) {
        sampleContainer.innerHTML = `<p class="no-data">No sample papers available yet.</p>`;
        return;
      }

      const samplePapers = papers.slice(0, 3);
      sampleContainer.innerHTML = samplePapers
        .map(
          (paper) => `
          <div class="sample-paper-wrapper" style="margin-bottom: 15px;">
            <a href="#" class="sample-paper-link" data-paper-id="${paper._id}" style="text-decoration:none;color:inherit;">
              <div class="paper-card card" style="cursor:pointer; min-height: 180px;">
                <h3>${paper.subjectName}</h3>
                <p>Code: ${paper.subjectCode}</p>
                <div style="display: flex; gap: 8px; margin-top: 10px; align-items: center; flex-wrap: wrap;">
                  <span class="badge">${paper.examType}</span>
                  ${getDifficultyBadge(paper.difficultyRating)}
                </div>
              </div>
            </a>
            <button class="vote-btn btn" data-paper-id="${paper._id}" style="margin-top: 6px; padding: 4px 10px; font-size: 0.8rem; cursor: pointer;">
              ⭐ Rate Difficulty
            </button>
          </div>
        `,
        )
        .join("");

      // Attach download event listener
      sampleContainer.querySelectorAll(".sample-paper-link").forEach((a) => {
        a.addEventListener("click", async (ev) => {
          ev.preventDefault();
          const paperId = a.getAttribute("data-paper-id");
          if (!paperId) return;

          try {
            const pdfResp = await fetch(`${backendBase}/papers/download/${paperId}`, { credentials: 'include' });
            if (!pdfResp.ok) throw new Error(`Download failed`);

            const blob = await pdfResp.blob();
            const objectUrl = URL.createObjectURL(blob);
            window.open(objectUrl, "_blank", "noopener");
            setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
          } catch (err) {
            console.error("Sample PDF download error:", err);
            alert("Failed to download the sample paper.");
          }
        });
      });

      // Attach vote event listener
      sampleContainer.querySelectorAll(".vote-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const paperId = btn.getAttribute("data-paper-id");
          if (paperId) submitVote(paperId);
        });
      });

    } catch (err) {
      console.error("loadSamplePapers error:", err);
    }
  }

  async function fetchPapers({ subName = "", subCode = "", examType = "", difficulty = "", hasSearched = false }) {
    try {
      let queryUrl = `${backendBase}/papers/list`;
      const params = new URLSearchParams();

      if (subName) params.append("subjectName", subName);
      if (subCode) params.append("subjectCode", subCode);
      if (examType) params.append("examType", examType);
      if (difficulty) params.append("difficulty", difficulty);

      if (params.toString()) queryUrl += `?${params.toString()}`;

      const response = await fetch(queryUrl, { credentials: 'include' });
      const papers = await response.json();

      if (response.ok && Array.isArray(papers) && papers.length > 0) {
        if (grid) {
          grid.innerHTML = `<div id="filtered-papers" style="display:flex; flex-direction:row; flex-wrap:wrap; gap:24px; width:100%; justify-content:flex-start;"></div>`;
        }
        const filteredWrap = document.getElementById("filtered-papers");

        if (filteredWrap) {
          filteredWrap.innerHTML = papers
            .map(
              (paper) => `
                <div style="display:flex; flex-direction:column; width:260px;">
                  <a href="#" target="_blank" class="paper-card-link" data-paper-id="${paper._id}" style="text-decoration:none; color:inherit; display:block;">
                    <div class="paper-card card" style="cursor:pointer; width:100%; min-height:180px; box-sizing:border-box; display:flex; flex-direction:column;">
                      <h3 style="font-size:1.05rem; margin-bottom:8px; line-height:1.2;">${paper.subjectName}</h3>
                      <p style="margin:0 0 6px 0;">Code: ${paper.subjectCode}</p>
                      <div style="margin-top:auto; display:flex; gap:6px; flex-wrap:wrap;">
                        <span class="badge">${paper.examType}</span>
                        ${getDifficultyBadge(paper.difficultyRating)}
                      </div>
                    </div>
                  </a>
                  <button class="vote-btn btn" data-paper-id="${paper._id}" style="margin-top:6px; padding:4px 10px; font-size:0.8rem; cursor:pointer;">
                    ⭐ Rate Difficulty
                  </button>
                </div>
              `,
            )
            .join("");

          // Attach download listener
          filteredWrap.querySelectorAll(".paper-card-link").forEach((a) => {
            a.addEventListener("click", async (ev) => {
              ev.preventDefault();
              const paperId = a.getAttribute("data-paper-id");
              if (!paperId) return;

              try {
                const pdfResp = await fetch(`${backendBase}/papers/download/${paperId}`, { credentials: 'include' });
                if (!pdfResp.ok) throw new Error(`Download failed`);

                const blob = await pdfResp.blob();
                const objectUrl = URL.createObjectURL(blob);
                window.open(objectUrl, "_blank", "noopener");
                setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
              } catch (err) {
                console.error("PDF download error:", err);
                alert("Failed to download the paper.");
              }
            });
          });

          // Attach vote listener
          filteredWrap.querySelectorAll(".vote-btn").forEach((btn) => {
            btn.addEventListener("click", (e) => {
              e.stopPropagation();
              const paperId = btn.getAttribute("data-paper-id");
              if (paperId) submitVote(paperId);
            });
          });
        }
      } else {
        if (hasSearched && grid) {
          grid.innerHTML = `<p class="no-data">No papers found matching your criteria.</p>`;
        }
      }
    } catch (err) {
      console.error("Detailed Fetch Error:", err);
      if (hasSearched && grid) {
        grid.innerHTML = `<p class="no-data">Error fetching files from database.</p>`;
      }
    }
  }
});