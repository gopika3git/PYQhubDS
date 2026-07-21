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
    uploadedBy: { type: String, required: false }, 
    uploadedAt: { type: Date, default: Date.now },

    // 🚀 Adaptive Difficulty Tracking Fields
    totalVotes: { 
        type: Number, 
        default: 0 
    },
    totalRatingPoints: { 
        type: Number, 
        default: 0 
    },
    difficultyRating: { 
        type: Number, 
        default: 5.0 // Defaults to 5.0 out of 10 (Medium)
    }
});

module.exports = mongoose.model('QuestionPaper', QuestionPaperSchema);