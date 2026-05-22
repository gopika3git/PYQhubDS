// Global State Tracker
let currentUser = null;
let userToken = null;

const IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/goqp123/"; 
const IMAGEKIT_PUBLIC_KEY = "public_0qoA3EltjzuJLUw80ihXx5hs8SQ=";

const imagekit = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY, 
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    authenticationEndpoint: "http://localhost:5001/api/imagekit-auth"
});

// Helper utility to cleanly parse files into Base64 formats
const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result); 
        reader.onerror = (error) => reject(error);
    });
};

// --- AUTOMATIC LOADING ON START ---
document.addEventListener("DOMContentLoaded", () => {
    fetchPapers();
    setupDropdownToggle();
});

function setupDropdownToggle() {
    const toggleBtn = document.getElementById("toggle-upload-btn");
    const menu = document.getElementById("upload-dropdown-menu");

    if(toggleBtn && menu) {
        toggleBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            menu.classList.toggle("show");
        });

        document.addEventListener("click", (e) => {
            if (!menu.contains(e.target) && e.target !== toggleBtn) {
                menu.classList.remove("show");
            }
        });
    }
}

// ==========================================
// REGISTRATION AND LOGIN UTILITIES
// ==========================================
document.getElementById("register-btn").addEventListener("click", async () => {
    const name = document.getElementById("auth-name").value;
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;
    const role = "student"; 

    const res = await fetch("http://localhost:5001/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    alert(data.message || data.error);
});

document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;

    const res = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
        currentUser = data.user; // Stores user object including role ('admin' or 'student')
        userToken = data.token;
        
        document.getElementById("user-display").innerText = `Welcome, ${currentUser.name} (${currentUser.role})`;
        document.getElementById("logout-btn").style.display = "inline-block";
        document.getElementById("auth-section").style.display = "none";
        
        document.getElementById("main-app-content").style.display = "block";
        document.getElementById("upload-dropdown-container").style.display = "block";
        
        // Let's run a function to manage UI views depending on role
        applyRoleBasedUI();
    } else {
        alert(data.message || "Login failed");
    }
});

document.getElementById("logout-btn").addEventListener("click", () => {
    currentUser = null;
    userToken = null;
    window.location.reload();
});

// Helper function to manage what admins see vs what students see
function applyRoleBasedUI() {
    const deleteButtons = document.querySelectorAll(".delete-btn");
    
    deleteButtons.forEach(btn => {
        if (currentUser && currentUser.role === 'admin') {
            btn.style.display = "inline-block"; // Show delete option to you
        } else {
            btn.style.display = "none"; // Hide delete option from ordinary students
        }
    });
}

// ==========================================
// CORE UPLOAD ACTION
// ==========================================
document.getElementById("upload-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const statusText = document.getElementById("upload-status");
    statusText.innerText = "Processing files...";

    const files = document.getElementById("file-input").files;
    const uploadedImages = [];

    try {
        for (let file of files) {
            statusText.innerText = `Converting ${file.name}...`;
            const base64FileString = await convertFileToBase64(file);

            statusText.innerText = `Uploading to ImageKit...`;
            
            const uploadResponse = await imagekit.upload({
                file: base64FileString,
                fileName: file.name,
                folder: "/pyq_papers"
            });
            
            uploadedImages.push({
                fileId: uploadResponse.fileId,
                url: uploadResponse.url,
                thumbnailUrl: uploadResponse.thumbnailUrl
            });
        }

        statusText.innerText = "Saving to database...";

        const paperMetadata = {
            subjectName: document.getElementById("sub-name").value,
            subjectCode: document.getElementById("sub-code").value,
            examType: document.getElementById("exam-type").value,
            images: uploadedImages,
            uploadedBy: currentUser ? (currentUser._id || currentUser.id) : null
        };

        const dbRes = await fetch("http://localhost:5001/api/papers/upload", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}` // Pass token to backend securely
            },
            body: JSON.stringify(paperMetadata)
        });

        if (dbRes.ok) {
            statusText.innerText = "🚀 Uploaded successfully!";
            document.getElementById("upload-form").reset();
            setTimeout(() => {
                document.getElementById("upload-dropdown-menu").classList.remove("show");
                statusText.innerText = "";
            }, 1200);
            fetchPapers();
        } else {
            const errData = await dbRes.json();
            statusText.innerText = `❌ Database failed: ${errData.error || 'Unknown Error'}`;
        }

    } catch (err) {
        console.error("🔥 Upload execution error:", err);
        statusText.innerText = `Error: ${err.message}`;
    }
});

// ==========================================
// FETCH AND RENDER ENGINE
// ==========================================
async function fetchPapers() {
    const subName = document.getElementById("filter-sub-name").value;
    const subCode = document.getElementById("filter-sub-code").value;
    const type = document.getElementById("filter-type").value;
    
    let url = `http://localhost:5001/api/papers/list?`;
    if (subName) url += `subjectName=${encodeURIComponent(subName)}&`;
    if (subCode) url += `subjectCode=${encodeURIComponent(subCode)}&`;
    if (type) url += `examType=${type}`;

    try {
        const res = await fetch(url);
        const papers = await res.json();
        
        const grid = document.getElementById("papers-grid");
        grid.innerHTML = ""; 

        if (papers.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No papers found matching these filters.</p>`;
            return;
        }

        papers.forEach(paper => {
            const card = document.createElement("div");
            card.className = "paper-card";
            card.innerHTML = `
                <div>
                    <h3>${paper.subjectName}</h3>
                    <p style="color: #7c3aed; font-weight: bold; letter-spacing: 0.5px;">${paper.subjectCode}</p>
                    <p><strong>Exam:</strong> ${paper.examType}</p>
                </div>
                <div class="file-previews">
                    ${paper.images && paper.images.length > 0 ? paper.images.map(img => {
                        if (img.url.toLowerCase().endsWith('.pdf')) {
                            return `
                                <div class="pdf-link-box" onclick="window.open('${img.url}', '_blank')">
                                    <span>📄 Open PDF Question Paper</span>
                                </div>`;
                        } else {
                            return `<img src="${img.thumbnailUrl || img.url}" onclick="window.open('${img.url}', '_blank')" title="Click to view full image">`;
                        }
                    }).join('') : '<p style="color: grey; font-style: italic;">No attached preview files.</p>'}
                </div>
                <button class="delete-btn" style="display: none; background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 10px;" onclick="deletePaper('${paper._id}')">Delete</button>
            `;
            grid.appendChild(card);
        });

        // Trigger dynamic layout formatting changes right after rendering items
        applyRoleBasedUI();
    } catch (error) {
        console.error("Error loading papers configuration:", error);
    }
}

// Global scope attachment so the inline HTML click listener can find the delete operation logic
window.deletePaper = async function(paperId) {
    if (!confirm("Are you sure you want to delete this paper?")) return;

    try {
        const res = await fetch(`http://localhost:5001/api/papers/${paperId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${userToken}`
            }
        });

        const data = await res.json();
        alert(data.message);
        if (res.ok) {
            fetchPapers(); // Reload layout cleanly
        }
    } catch (err) {
        console.error("Error running request delete execution:", err);
    }
};

// Fixed execution intercept to stop native HTML form submission behaviors
document.getElementById("search-btn").addEventListener("click", (e) => {
    e.preventDefault(); 
    fetchPapers();
});