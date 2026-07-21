const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paperController');
const imagekitController = require('../controllers/imagekitController'); // 1. Imported ImageKit controller

const { authenticateUser } = require('../middleware/authMiddleware');

// 1. VIEW PAPERS: Auth required (Controller handles difficulty filtering)
router.get('/list', authenticateUser, paperController.getPapers);

// 2. UPLOAD PAPERS: Auth required
router.post('/upload', authenticateUser, paperController.uploadPaper);

// 3. IMAGEKIT AUTHENTICATION: Auth required
router.get('/imagekit-auth', authenticateUser, imagekitController.getImageKitAuth);

// 4. VOTE ON PAPER DIFFICULTY: Auth required
router.post('/vote/:id', authenticateUser, paperController.votePaper);

// 5. DELETE PAPERS: Not enabled
router.delete('/:id', (req, res) => res.status(403).json({ error: 'Deletion disabled.' }));

// 6. Download proxy: Auth required
router.get('/download/:id', authenticateUser, paperController.downloadPaper);

module.exports = router;