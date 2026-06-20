const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paperController');



// 1. VIEW PAPERS: Anyone can see the list of papers
router.get('/list', paperController.getPapers);

// 2. UPLOAD PAPERS: Public (no login required)
router.post('/upload', paperController.uploadPaper);

// 3. DELETE PAPERS: Disabled in no-auth mode
router.delete('/:id', (req, res) => res.status(403).json({ error: 'Deletion disabled in no-auth mode.' }));

// Download proxy: Public (no login required)
router.get('/download/:id', paperController.downloadPaper);


module.exports = router;


