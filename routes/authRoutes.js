const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// Routes mapped to controllers
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router; 

// Safety: make it impossible for consumers to receive an undefined router.
// (This should never trigger because router is always created above.)
if (!router) {
  throw new Error('authRoutes: router export is undefined');
}
