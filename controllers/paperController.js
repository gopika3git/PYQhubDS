const QuestionPaper = require('../models/QuestionPaper');

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
        const paperId = req.params.id; // Grabs the ID from the URL (e.g., /api/papers/12345)
        console.log(`🗑️ REQUEST RECEIVED: Deleting paper with ID: ${paperId}`);

        // Search the database and delete the item if found
        const deletedPaper = await QuestionPaper.findByIdAndDelete(paperId);

        // If the ID doesn't exist in the database, return a 404 error
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