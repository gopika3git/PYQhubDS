document.addEventListener("DOMContentLoaded", () => {
    // --- 1. SESSION GUARD ---
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (!token || !user) {
        window.location.href = '/index.html';
        return;
    }

    // Theme Persistent Settings
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-theme');
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        localStorage.setItem('theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
    });

    // Update chosen file name display
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            document.getElementById('file-count').innerText = fileInput.files[0].name;
        } else {
            document.getElementById('file-count').innerText = "No file selected";
        }
    });
});

// --- 2. IMAGEKIT INITIALIZATION ---
const imagekit = new ImageKit({
    publicKey: "youpublic_0qoA3EltjzuJLUw80ihXx5h=",
    urlEndpoint: "https://ik.imagekit.io/goqp123",
    authenticationEndpoint: "https://pyqhubds.onrender.com/api/imagekit-auth" // Points directly to endpoint in server.js
});

// --- 3. UPLOAD AND MAPPING CONTROL ---
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusMsg = document.getElementById('upload-status');
    const submitBtn = document.getElementById('submit-upload-btn');
    
    const fileInput = document.getElementById('file-input');
    const files = fileInput.files;
    const subjectName = document.getElementById('sub-name').value;
    const subjectCode = document.getElementById('sub-code').value;
    const examType = document.getElementById('exam-type').value;

    const savedToken = localStorage.getItem('token');

    if (files.length === 0) {
        alert("Select a PDF file to upload.");
        return;
    }

    const file = files[0];
    submitBtn.disabled = true;
    statusMsg.innerText = "Uploading PDF document to ImageKit...";

    try {
        const uploadedImages = [];

        // Upload the PDF directly using ImageKit
        const ikResponse = await new Promise((resolve, reject) => {
            imagekit.upload({
                file: file,
                fileName: `${subjectCode}_${examType}.pdf`,
                folder: "/pyqs"
            }, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        // Map the PDF response data cleanly into your existing array structure
        uploadedImages.push({
            fileId: ikResponse.fileId,
            url: ikResponse.url,
            thumbnailUrl: "https://ik.imagekit.io/goqp123/default-pdf-icon.png"
        });

        statusMsg.innerText = "Saving data to MongoDB database...";

        // Send final bundle payload down to Render with explicit Bearer token header syntax
        const backendResponse = await fetch('https://pyqhubds.onrender.com/api/papers/upload', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${savedToken}`
            },
            body: JSON.stringify({ subjectName, subjectCode, examType, images: uploadedImages })
        });

        if (backendResponse.ok) {
            statusMsg.innerText = "🚀 PDF Paper uploaded successfully!";
            setTimeout(() => { window.location.href = '/dashboard.html'; }, 1500);
        } else {
            const errData = await backendResponse.json();
            throw new Error(errData.message || errData.error || "Failed to save data");
        }

    } catch (err) {
        console.error("Upload error client side trace:", err);
        statusMsg.innerText = `❌ Error: ${err.message || "Something went wrong"}`;
        submitBtn.disabled = false;
    }
});