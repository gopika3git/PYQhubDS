const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");

// Endpoint: POST /api/ai/ask
router.post("/ask", aiController.askTutor);

module.exports = router;