const QuestionPaper = require('../models/QuestionPaper');
const path = require('path');
const axios = require('axios');
const ImageKit = require('imagekit');
const dbConnect = require('../utils/dbConnect');


// ImageKit client for server-side download proxy
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});


exports.uploadPaper = async (req, res) => {
    // 🔑 Ensure database is linked before running .create() or .insertOne()
    await dbConnect(); 

    try {
        const newPaper = await QuestionPaper.create(req.body);
        res.status(201).json({ success: true, data: newPaper });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// 3. DELETE A QUESTION PAPER ENTRY FROM MONGODB (ADMIN ONLY)
exports.deletePaper = async (req, res) => {
    try {
        const paperId = req.params.id;
        console.log(`🗑️ REQUEST RECEIVED: Deleting paper with ID: ${paperId}`);

        const deletedPaper = await QuestionPaper.findByIdAndDelete(paperId);

        if (!deletedPaper) {
            return res.status(404).json({ error: "Question paper not found." });
        }

        console.log("✅ SUCCESS: Deleted from database!");
        res.status(200).json({ message: "Question paper deleted successfully!" });

    } catch (err) {
        console.error("❌ DATABASE FAULT DURING DELETION:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// 4. DOWNLOAD (PROXY) PDF: returns the actual PDF bytes from ImageKit
// The frontend opens the response as a new browser tab via blob URL.
exports.downloadPaper = async (req, res) => {
    try {
        const paperId = req.params.id;
        const paper = await QuestionPaper.findById(paperId);

        if (!paper) {
            return res.status(404).json({ error: 'Question paper not found.' });
        }
        if (!paper.images || paper.images.length === 0) {
            return res.status(404).json({ error: 'No file found for this paper.' });
        }

        const firstFile = paper.images[0];
        const fileId = firstFile.fileId;

        // Create a signed download URL for private resources
        // (works for both public/private depending on your ImageKit setup)
        const downloadUrl = imagekit.urlEndpoint
            ? `https://${imagekit.urlEndpoint}/${fileId}`
            : firstFile.url;

        // Best effort: if fileId downloadUrl isn't valid for your setup,
        // fall back to stored URL.
        const finalUrl = fileId ? downloadUrl : firstFile.url;

        const filenameBase = `${paper.subjectCode || 'paper'}_${paper.examType || 'exam'}.pdf`;

        const pdfResponse = await axios.get(finalUrl, {
            responseType: 'stream',
            // Some setups require user-agent
            headers: { 'User-Agent': 'PYQhubDS' }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}"`);

        pdfResponse.data.pipe(res);
    } catch (err) {
        console.error('❌ downloadPaper error:', err.message);
        res.status(500).json({ error: err.message || 'Failed to download PDF.' });
    }
};


