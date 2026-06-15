const QuestionPaper = require('../models/QuestionPaper');
const path = require('path');
const axios = require('axios');
const ImageKit = require('imagekit');

// ImageKit client for server-side download proxy
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});


// 1. SAVE A NEW QUESTION PAPER ENTRY IN MONGODB
exports.uploadPaper = async (req, res) => {
    try {
        console.log("📥 RECEIVED PAYLOAD AT CONTROLLER:", req.body);
        const { subjectName, subjectCode, examType, images, uploadedBy } = req.body;

        const newPaper = new QuestionPaper({
            subjectName,
            subjectCode,
            examType,
            images: images || [],
            uploadedBy: uploadedBy || null
        });

        console.log("💾 Writing document to MongoDB Atlas...");
        await newPaper.save();

        console.log("✅ SUCCESS: Saved to database!");
        res.status(201).json({ message: 'Question Paper uploaded successfully!', paper: newPaper });

    } catch (err) {
        console.error("❌ DATABASE FAULT:", err.message);
        res.status(500).json({ error: err.message });
    }
};

// 2. GET ALL PAPERS (WITH FILTERS)
exports.getPapers = async (req, res) => {
    try {
        const { subjectName, subjectCode, examType } = req.query;
        let queryObj = {};

        if (subjectName) queryObj.subjectName = { $regex: subjectName, $options: 'i' };
        if (subjectCode) queryObj.subjectCode = { $regex: subjectCode, $options: 'i' };
        if (examType) queryObj.examType = examType;

        const papers = await QuestionPaper.find(queryObj);
        res.json(papers);

    } catch (err) {
        console.error("❌ Failed to fetch papers:", err.message);
        res.status(500).json({ error: err.message });
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


