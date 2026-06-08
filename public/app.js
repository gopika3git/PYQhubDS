// Global State Tracker (Restored from Session Storage if available)
let currentUser = JSON.parse(sessionStorage.getItem("currentUser")) || null;
let userToken = sessionStorage.getItem("userToken") || null;

const IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/goqp123"; 
const IMAGEKIT_PUBLIC_KEY = "public_0qoA3EltjzuJLUw80ihXx5hs8SQ=";

// Official Frontend SDK format
const imagekit = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY, 
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    authenticationEndpoint: "https://pyqhubds.onrender.com/api/imagekit-auth"
});

// --- AUTOMATIC LOADING ON START ---
document.addEventListener("DOMContentLoaded", () => {
    fetchPapers();
    setupDropdownToggle();
    checkExistingAuth(); // Restore UI state if user was already logged in
});

function setupDropdownToggle() {
    const toggleBtn = document.getElementById("toggle-upload-btn");
    const menu = document.getElementById("upload-dropdown-menu");

    if (toggleBtn && menu) {
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

// Check session on page reload
function checkExistingAuth() {
    if (currentUser && userToken) {
        document.getElementById("user-display").innerText = `Welcome, ${currentUser.name} (${currentUser.role})`;
        document.getElementById("logout-btn").style.display = "inline-block";
        document.getElementById("auth-section").style.display = "none";
        
        document.getElementById("main-app-content").style.display = "block";
        document.getElementById("upload-dropdown-container").style.display = "block";
        
        applyRoleBasedUI();
    }
}

// ==========================================
// REGISTRATION AND LOGIN UTILITIES
// ==========================================
document.getElementById("register-btn").addEventListener("click", async () => {
    const name = document.getElementById("auth-name").value;
    const email = document.getElementById("auth-email").value;
    const togglePassword = document.querySelector('#togglePassword');
    const passwordInput = document.querySelector('#password');

    if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
        // Toggle the type attribute
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Toggle the eye / eye-slash icon
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });
    }
    const role = "student"; 

    if (!name || !email || !password) {
        alert("Please fill out all registration fields.");
        return;
    }

    try {
        const res = await fetch("https://pyqhubds.onrender.com/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role })
        });
        const data = await res.json();
        alert(data.message || data.error);
    } catch (err) {
        alert("Registration failed. Backend might be offline.");
    }
});

document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("auth-email").value;
    const password = document.getElementById("auth-password").value;

    try {
        const res = await fetch("https://pyqhubds.onrender.com/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if (res.ok) {
            currentUser = data.user; 
            userToken = data.token;
            
            // Save state so page reloads don't break authentication
            sessionStorage.setItem("currentUser", JSON.stringify(currentUser));
            sessionStorage.setItem("userToken", userToken);
            
            document.getElementById("user-display").innerText = `Welcome, ${currentUser.name} (${currentUser.role})`;
            document.getElementById("logout-btn").style.display = "inline-block";
            document.getElementById("auth-section").style.display = "none";
            
            document.getElementById("main-app-content").style.display = "block";
            document.getElementById("upload-dropdown-container").style.display = "block";
            
            applyRoleBasedUI();
            fetchPapers(); // Re-fetch to show authorized delete parameters
        } else {
            alert(data.message || "Login failed");
        }
    } catch (err) {
        alert("Login failed. Check backend connection.");
    }
});

document.getElementById("logout-btn").addEventListener("click", () => {
    currentUser = null;
    userToken = null;
    sessionStorage.clear();
    window.location.reload();
});

function applyRoleBasedUI() {
    const deleteButtons = document.querySelectorAll(".delete-btn");
    deleteButtons.forEach(btn => {
        if (currentUser && currentUser.role === 'admin') {
            btn.style.setProperty("display", "inline-block", "important");
        } else {
            btn.style.setProperty("display", "none", "important");
        }
    });
}

// ==========================================
// CORE UPLOAD ACTION
// ==========================================
document.getElementById("upload-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const statusText = document.getElementById("upload-status");
    
    // Front-end Guard: Prevent guest uploads
    if (!userToken) {
        statusText.innerText = "❌ You must be logged in to upload.";
        return;
    }

    statusText.innerText = "Processing files...";

    const files = document.getElementById("file-input").files;
    if (!files || files.length === 0) {
        statusText.innerText = "❌ Please choose a file first.";
        return;
    }

    const uploadedImages = [];

    try {
        for (let file of files) {
            statusText.innerText = `Fetching authorization parameters...`;

            // 1. Fetch secure credentials from backend
            const authRes = await fetch("https://pyqhubds.onrender.com/api/imagekit-auth");
            if (!authRes.ok) throw new Error("Could not acquire secure credentials from server.");
            const authData = await authRes.json();

            statusText.innerText = `Uploading ${file.name} to ImageKit...`;
            
            // 2. Package parameters directly into standard multipart FormData
            const uploadFormData = new FormData();
            uploadFormData.append("file", file); 
            uploadFormData.append("fileName", file.name);
            uploadFormData.append("folder", "/pyq_papers");
            uploadFormData.append("publicKey", IMAGEKIT_PUBLIC_KEY);
            
            uploadFormData.append("signature", authData.signature);
            uploadFormData.append("token", authData.token);
            uploadFormData.append("expire", String(authData.expire)); 

            // 3. Post payload directly to ImageKit's official upload endpoint
            const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
                method: "POST",
                body: uploadFormData
            });
            
            if (!uploadResponse.ok) {
                const errorPayload = await uploadResponse.json();
                throw new Error(errorPayload.message || "Storage upload failed");
            }

            const uploadResult = await uploadResponse.json();
            
            uploadedImages.push({
                fileId: uploadResult.fileId,
                url: uploadResult.url,
                thumbnailUrl: uploadResult.thumbnailUrl || uploadResult.url
            });
        }

        statusText.innerText = "Saving metadata to database...";

        const paperMetadata = {
            subjectName: document.getElementById("sub-name").value,
            subjectCode: document.getElementById("sub-code").value,
            examType: document.getElementById("exam-type").value,
            images: uploadedImages,
            uploadedBy: currentUser ? (currentUser._id || currentUser.id) : null
        };

        const dbRes = await fetch("https://pyqhubds.onrender.com/api/papers/upload", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${userToken}` 
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
    const subName = document.getElementById("filter-sub-name")?.value || "";
    const subCode = document.getElementById("filter-sub-code")?.value || "";
    const type = document.getElementById("filter-type")?.value || "";
    
    let url = `https://pyqhubds.onrender.com/api/papers/list?`;
    if (subName) url += `subjectName=${encodeURIComponent(subName)}&`;
    if (subCode) url += `subjectCode=${encodeURIComponent(subCode)}&`;
    if (type) url += `examType=${type}`;

    try {
        const res = await fetch(url);
        const papers = await res.json();
        
        const grid = document.getElementById("papers-grid");
        if (!grid) return;
        grid.innerHTML = ""; 

        if (!papers || papers.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: gray;">No papers found matching these filters.</p>`;
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
                            return `<img src="${img.thumbnailUrl || img.url}" onclick="window.open('${img.url}', '_blank')" title="Click to view full image" style="max-width:100px; cursor:pointer; margin:5px;">`;
                        }
                    }).join('') : '<p style="color: grey; font-style: italic;">No attached preview files.</p>'}
                </div>
                <button class="delete-btn" style="display: none; background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-top: 10px;" onclick="deletePaper('${paper._id}')">Delete</button>
            `;
            grid.appendChild(card);
        });

        // Run immediately after cards are injected into the DOM tree
        applyRoleBasedUI();
    } catch (error) {
        console.error("Error loading papers configuration:", error);
    }
}

// Assigned globally to window scope safely
window.deletePaper = async function(paperId) {
    if (!userToken) {
        alert("You must be logged in as Admin to perform this action.");
        return;
    }
    if (!confirm("Are you sure you want to delete this paper?")) return;

    try {
        const res = await fetch(`https://pyqhubds.onrender.com/api/papers/${paperId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${userToken}`
            }
        });

        const data = await res.json();
        alert(data.message || "Paper structural layout updated.");
        if (res.ok) {
            fetchPapers(); 
        }
    } catch (err) {
        console.error("Error running request delete execution:", err);
    }
};

document.getElementById("search-btn").addEventListener("click", (e) => {
    e.preventDefault(); 
    fetchPapers();
});
