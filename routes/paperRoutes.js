const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paperController');

// Import authentication & authorization middleware functions
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');

// 1. VIEW PAPERS: Anyone can see the list of papers
router.get('/list', paperController.getPapers);

// 2. UPLOAD PAPERS: Must be logged in, and can be a student OR an admin
router.post('/upload', authenticateUser, authorizeRoles('student', 'admin'), paperController.uploadPaper);

// 3. DELETE PAPERS: Must be logged in, and ONLY an admin can do it
router.delete('/:id', authenticateUser, authorizeRoles('admin'), paperController.deletePaper);

// Download proxy: returns the original PDF file (proxied through this backend)
router.get('/download/:id', authenticateUser, paperController.downloadPaper);

module.exports = router;


