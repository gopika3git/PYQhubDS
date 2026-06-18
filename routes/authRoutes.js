const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// Routes mapped to controllers
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);
router.get('/logout', authController.logout);

module.exports = router;


// Safety: make it impossible for consumers to receive an undefined router.
// (This should never trigger because router is always created above.)
if (!router) {
  throw new Error('authRoutes: router export is undefined');
}
