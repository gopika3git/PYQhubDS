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

    // Update chosen file name display count
    const fileInput = document.getElementById('file-input');
    fileInput.addEventListener('change', () => {
        const count = fileInput.files.length;
        document.getElementById('file-count').innerText = `${count} file(s) selected`;
    });
});

// --- 2. IMAGEKIT INITIALIZATION ---
// Replace these dummy values with your actual ImageKit details
const imagekit = new ImageKit({
    publicKey: "your_imagekit_public_key",
    urlEndpoint: "https://ik.imagekit.io/your_imagekit_id",
    authenticationEndpoint: "http://localhost:5000/api/papers/auth" // Your node backend URL
});

// --- 3. UPLOAD AND MAPPING CONTROL ---
document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusMsg = document.getElementById('upload-status');
    const submitBtn = document.getElementById('submit-upload-btn');
    
    const files = document.getElementById('file-input').files;
    const subjectName = document.getElementById('sub-name').value;
    const subjectCode = document.getElementById('sub-code').value;
    const examType = document.getElementById('exam-type').value;

    submitBtn.disabled = true;
    statusMsg.innerText = "Uploading images to ImageKit...";

    try {
        const uploadedImages = [];

        // Upload files sequentially loop
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Send to ImageKit directly
            const ikResponse = await new Promise((resolve, reject) => {
                imagekit.upload({
                    file: file,
                    fileName: `${subjectCode}_${examType}_page_${i+1}.jpg`,
                    folder: "/pyqs"
                }, (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });

            uploadedImages.push({
                fileId: ikResponse.fileId,
                url: ikResponse.url,
                thumbnailUrl: ikResponse.thumbnailUrl
            });
        }

        statusMsg.innerText = "Saving data to MongoDB database...";

        // Send final bundle to backend server node
        const backendResponse = await fetch('/api/papers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ subjectName, subjectCode, examType, images: uploadedImages })
        });

        if (backendResponse.ok) {
            statusMsg.innerText = "🚀 Paper uploaded successfully!";
            setTimeout(() => { window.location.href = '/dashboard.html'; }, 1500);
        } else {
            const errData = await backendResponse.json();
            throw new Error(errData.message || "Failed to save data");
        }

    } catch (err) {
        console.error(err);
        statusMsg.innerText = `❌ Error: ${err.message || "Something went wrong"}`;
        submitBtn.disabled = false;
    }
});