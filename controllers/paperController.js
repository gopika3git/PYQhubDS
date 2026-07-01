const QuestionPaper = require('../models/QuestionPaper');
const path = require('path');
const axios = require('axios');
const ImageKit = require('imagekit');
const dbConnect = require(path.resolve(__dirname, '../utils/dbConnect'));

// ImageKit client for server-side download proxy
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// 1. SAVE A NEW QUESTION PAPER ENTRY IN MONGODB
exports.uploadPaper = async (req, res) => {
    try {
        await dbConnect();

        console.log("📥 RECEIVED PAYLOAD AT CONTROLLER:", req.body);
        const { subjectName, subjectCode, examType, images, uploadedBy } = req.body;

        const newPaper = new QuestionPaper({
            subjectName,
            subjectCode,
            examType,
            images: images || [],
            uploadedBy: uploadedBy || null
        });

        console.log("💾 Writing document...");
        await newPaper.save();

        console.log("✅ SUCCESS: Saved to database!");
        res.status(201).json({ message: 'Question Paper uploaded successfully!' });

    } catch (err) {
        console.error("❌ DATABASE FAULT:", err.message);
        res.status(500).json({ error: "Failed to save data secure pipeline entry." });
    }
};

// 2. GET ALL PAPERS (SANITIZED JSON FIX)
exports.getPapers = async (req, res) => {
    try {
        await dbConnect();

        const { subjectName, subjectCode, examType } = req.query;
        let queryObj = {};

        if (subjectName) queryObj.subjectName = { $regex: subjectName, $options: 'i' };
        if (subjectCode) queryObj.subjectCode = { $regex: subjectCode, $options: 'i' };
        if (examType) queryObj.examType = examType;

        // 🔑 SECURITY FIX: Use .select() to strip out sensitive fields like the 'images' object block
        // This ensures anyone inspecting or extracting JSON responses only gets metadata
        const papers = await QuestionPaper.find(queryObj).select('subjectName subjectCode examType _id');

        res.json(papers);
    } catch (err) {
        console.error("❌ Fetch error:", err.message);
        res.status(500).json({ error: "Failed to fetch question paper profiles securely." });
    }
};

// 3. SECURE DOWNLOAD FUNCTION
exports.downloadPaper = async (req, res) => {
    try {
        await dbConnect();
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

        const downloadUrl = imagekit.urlEndpoint
            ? `https://${imagekit.urlEndpoint}/${fileId}`
            : firstFile.url;

        const finalUrl = fileId ? downloadUrl : firstFile.url;
        const filenameBase = `${paper.subjectCode || 'paper'}_${paper.examType || 'exam'}.pdf`;

        const pdfResponse = await axios.get(finalUrl, {
            responseType: 'stream',
            headers: { 'User-Agent': 'PYQhubDS' }
        });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=\"${filenameBase}\"`);

        pdfResponse.data.pipe(res);
    } catch (err) {
        console.error('❌ downloadPaper error:', err.message);
        res.status(500).json({ error: "An error occurred compiling file streaming download handles." });
    }
};