document.addEventListener("DOMContentLoaded", () => {
  // --- Gopika's Disclaimer Banner Logic ---
  
  const banner = document.getElementById("gopika-disclaimer");
  const closeBtn = document.getElementById("close-disclaimer");

  const userName = localStorage.getItem('userName'); 
    const userDisplay = document.getElementById('user-display');

    if (userDisplay && userName) {
        userDisplay.innerText = userName; 
    }

  if (banner && closeBtn) {
      let hideTimer = null;

      setTimeout(() => {
          // Ensure it exists when timer fires
          if (!document.body.contains(banner)) return;
          banner.classList.add("show");
      }, 1000);

      const hideBanner = () => {
          // Stop any pending auto-hide
          if (hideTimer) clearTimeout(hideTimer);
          hideTimer = null;

          // If already removed, no-op
          if (!banner || !document.body.contains(banner)) return;

          banner.classList.remove("show");
          banner.classList.add("dismissed");

          // Immediate, forceful style changes (covers mobile paint/z-index quirks)
          try {
            banner.style.setProperty("top", "-100px");
            banner.style.setProperty("display", "none", "important");
            banner.style.setProperty("pointer-events", "none", "important");
          } catch (e) {}

          // Hard stop for any weird mobile overlays
          try { closeBtn.setAttribute("disabled", "true"); } catch (e) {}

          // Fully remove from DOM so it can't block clicks
          try {
            if (banner.parentNode) banner.parentNode.removeChild(banner);
          } catch (e) {
            // Final fallback: keep it hidden even if removal fails
            try { banner.style.setProperty("display", "none", "important"); } catch (e2) {}
          }
      };

      closeBtn.addEventListener("click", hideBanner, { passive: true });
      hideTimer = setTimeout(hideBanner, 15000);
  }

  
  // --- 2. RETRIEVE GLOBAL PERSISTED THEME ---
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const themeIcon = themeToggleBtn.querySelector("i");

  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light-theme");
    themeIcon.classList.replace("fa-moon", "fa-sun");
  }

  themeToggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    const isLight = document.body.classList.contains("light-theme");
    themeIcon.classList.replace(
      isLight ? "fa-moon" : "fa-sun",
      isLight ? "fa-sun" : "fa-moon",
    );
    localStorage.setItem("theme", isLight ? "light" : "dark");
  });

  // --- 4. FILTER BUTTON INITIALIZATION ---
  const searchBtn = document.getElementById("search-btn");
  const grid = document.getElementById("papers-grid");
  let hasSearched = false;

  // USE VERCEL PATH (Relative URL)
  const backendBase = "/api"; 

  loadSamplePapers();

  searchBtn.addEventListener("click", () => {
    hasSearched = true;
    if (grid) grid.innerHTML = "";

    const subName = document.getElementById("filter-sub-name").value;
    const subCode = document.getElementById("filter-sub-code").value;
    const examType = document.getElementById("filter-type").value;

    fetchPapers({ subName, subCode, examType, hasSearched });
  });

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
          <a href="#" class="sample-paper-link" data-paper-id="${paper._id}" style="text-decoration:none;color:inherit;">
            <div class="paper-card card" style="cursor:pointer;">
              <h3>${paper.subjectName}</h3>
              <p>Code: ${paper.subjectCode}</p>
              <span class="badge">${paper.examType}</span>
            </div>
          </a>
        `,
        )
        .join("");

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
    } catch (err) {
      console.error("loadSamplePapers error:", err);
    }
  }

  async function fetchPapers({ subName = "", subCode = "", examType = "", hasSearched = false }) {
    try {
      let queryUrl = `${backendBase}/papers/list`;
      const params = new URLSearchParams();

      if (subName) params.append("subjectName", subName);
      if (subCode) params.append("subjectCode", subCode);
      if (examType) params.append("examType", examType);

      if (params.toString()) queryUrl += `?${params.toString()}`;

      const response = await fetch(queryUrl, { credentials: 'include' });
      const papers = await response.json();

      if (response.ok && Array.isArray(papers) && papers.length > 0) {
        grid.innerHTML = `<div id="filtered-papers" style="display:flex; flex-direction:row; flex-wrap:wrap; gap:24px; width:100%; justify-content:flex-start;"></div>`;
        const filteredWrap = document.getElementById("filtered-papers");

        filteredWrap.innerHTML = papers
          .map(
            (paper) => `
              <a href="#" target="_blank" class="paper-card-link" data-paper-id="${paper._id}" style="text-decoration:none; color:inherit; display:block;">
                <div class="paper-card card" style="cursor:pointer; width:260px; height:170px; box-sizing:border-box; display:flex; flex-direction:column;">
                  <h3 style="font-size:1.05rem; margin-bottom:8px; line-height:1.2;">${paper.subjectName}</h3>
                  <p style="margin:0 0 6px 0;">Code: ${paper.subjectCode}</p>
                  <span class="badge" style="margin-top:auto;">${paper.examType}</span>
                </div>
              </a>
            `,
          )
          .join("");

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
      } else {
        if (hasSearched) {
          grid.innerHTML = `<p class="no-data">No papers found matching your criteria.</p>`;
        }
      }
    } catch (err) {
      console.error("Detailed Fetch Error:", err);
      if (hasSearched) {
        grid.innerHTML = `<p class="no-data">Error fetching files from database.</p>`;
      }
    }
  }
});
