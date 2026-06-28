const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paperController');



const { authenticateUser } = require('../middleware/authMiddleware');

// 1. VIEW PAPERS: Auth required
router.get('/list', authenticateUser, paperController.getPapers);

// 2. UPLOAD PAPERS: Auth required
router.post('/upload', authenticateUser, paperController.uploadPaper);

// 3. DELETE PAPERS: Not enabled
router.delete('/:id', (req, res) => res.status(403).json({ error: 'Deletion disabled.' }));

// Download proxy: Auth required
router.get('/download/:id', authenticateUser, paperController.downloadPaper);



module.exports = router;


