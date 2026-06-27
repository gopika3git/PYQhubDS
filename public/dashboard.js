document.addEventListener("DOMContentLoaded", async () => {
  // --- 1. SECURITY/SESSION GUARD ---
  let user;
  try {
    const res = await fetch('/api/auth/me');
    if (!res.ok) throw new Error("Not logged in");
    const data = await res.json();
    user = data.user;
  } catch (err) {
    window.location.href = "/";
    return;
  }

  // --- Gopika's Disclaimer Banner Logic ---
  document.addEventListener("DOMContentLoaded", () => {
    const banner = document.getElementById("gopika-disclaimer");
    const closeBtn = document.getElementById("close-disclaimer");

    if (banner && closeBtn) {
        // 1. Smoothly slide the banner down 1 second after dashboard loads
        setTimeout(() => {
            banner.classList.add("show");
        }, 1000);

        // Function to hide the banner smoothly
        const hideBanner = () => {
            banner.classList.remove("show");
        };

        // 2. Close it when the student clicks the 'X' button
        closeBtn.addEventListener("click", hideBanner);

        // 3. Automatically close it after 15 seconds (15000 milliseconds)
        setTimeout(hideBanner, 15000);
    }
  });
  
  
  // Populate user greeting banner dynamically
  document.getElementById("user-display").innerText =
    `Welcome, ${user.displayName || user.name || "Student"}`;

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

  // --- 3. LOGOUT MECHANISM ---
  const logoutBtn = document.getElementById("logout-btn");
  logoutBtn.addEventListener("click", () => {
    window.location.href = "/logout";
  });

  // --- 4. FILTER BUTTON INITIALIZATION ---
  const searchBtn = document.getElementById("search-btn");

  // Keep sample cards visible until the user clicks search.
  const grid = document.getElementById("papers-grid");

  let hasSearched = false;

  // Load 3 sample papers from DB and render them as clickable cards.
  loadSamplePapers();

  searchBtn.addEventListener("click", () => {
    hasSearched = true;

    // Replace sample cards with results area content
    if (grid) grid.innerHTML = "";

    const subName = document.getElementById("filter-sub-name").value;
    const subCode = document.getElementById("filter-sub-code").value;
    const examType = document.getElementById("filter-type").value;

    fetchPapers({ subName, subCode, examType, hasSearched });
  });

  // Main layout structure to query your Render backend endpoints
  async function loadSamplePapers() {
    const sampleContainer = document.getElementById("sample-papers");
    if (!sampleContainer) return;

    try {
      const backendBase = "/api";
      // Fetch without filters, then show first 3.
      // (Still faster than showing everything in the UI; list endpoint is already supported.)
      const response = await fetch(`${backendBase}/papers/list`);

      if (!response.ok)
        throw new Error(`Failed to load samples (${response.status})`);

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

          const downloadUrl = `${backendBase}/papers/download/${paperId}`;
          try {
            const pdfResp = await fetch(downloadUrl);

            if (!pdfResp.ok) {
              const txt = await pdfResp.text().catch(() => "");
              throw new Error(`Download failed (${pdfResp.status}). ${txt}`);
            }

            const blob = await pdfResp.blob();
            const objectUrl = URL.createObjectURL(blob);

            window.open(objectUrl, "_blank", "noopener");
            setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
          } catch (err) {
            console.error("Sample PDF download/open error:", err);
            alert("Failed to download the sample paper.");
          }
        });
      });
    } catch (err) {
      console.error("loadSamplePapers error:", err);
      // Don't wipe the UI if samples fail; just keep grid for search.
    }
  }

  async function fetchPapers({
    subName = "",
    subCode = "",
    examType = "",
    hasSearched = false,
  }) {
    try {
      const backendBase = "/api";

      let queryUrl = `${backendBase}/papers/list`;
      const params = new URLSearchParams();

      if (subName) params.append("subjectName", subName);
      if (subCode) params.append("subjectCode", subCode);
      if (examType) params.append("examType", examType);

      if (params.toString()) {
        queryUrl += `?${params.toString()}`;
      }

      const response = await fetch(queryUrl);

      const papers = await response.json();

      if (response.ok && Array.isArray(papers) && papers.length > 0) {
        // Build a flex-row wrapping container for filtered results.
        // This prevents any accidental vertical stacking due to defaults/CSS.
        grid.innerHTML = `<div id="filtered-papers" style="display:flex; flex-direction:row; flex-wrap:wrap; gap:24px; width:100%; justify-content:flex-start;"></div>`;

        const filteredWrap = document.getElementById("filtered-papers");

        const cardHTML = papers
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

        filteredWrap.innerHTML = cardHTML;

        filteredWrap.querySelectorAll(".paper-card-link").forEach((a) => {
          a.addEventListener("click", async (ev) => {
            ev.preventDefault();

            const paperId = a.getAttribute("data-paper-id");
            if (!paperId) return;

            const downloadUrl = `${backendBase}/papers/download/${paperId}`;

            try {
              const pdfResp = await fetch(downloadUrl);

              if (!pdfResp.ok) {
                const txt = await pdfResp.text().catch(() => "");
                throw new Error(`Download failed (${pdfResp.status}). ${txt}`);
              }

              const blob = await pdfResp.blob();
              const objectUrl = URL.createObjectURL(blob);

              window.open(objectUrl, "_blank", "noopener");
              setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
            } catch (err) {
              console.error("PDF download/open error:", err);
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
