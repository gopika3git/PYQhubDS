const mongoose = require('mongoose');

const QuestionPaperSchema = new mongoose.Schema({
    subjectName: { type: String, required: true },
    subjectCode: { type: String, required: true, uppercase: true },
    examType: { type: String, required: true, enum: ['CAT-1', 'CAT-2', 'FAT'] },
    images: [{
        fileId: { type: String, required: true },
        url: { type: String, required: true },
        thumbnailUrl: { type: String }
    }],
    // ⬇️ CHANGE THIS LINE HERE TO A STRING TYPE ⬇️
    uploadedBy: { type: String, required: false }, 
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuestionPaper', QuestionPaperSchema);