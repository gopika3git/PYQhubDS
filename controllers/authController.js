const passport = require('passport');
const jwt = require('jsonwebtoken');

// 1. Initiates the Google OAuth Flow
exports.googleAuth = passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account'
});

// 2. Handles the incoming redirect payload from Google safely in serverless environments
exports.googleCallback = (req, res, next) => {
  // Delegate stateless callback handling to the route-level implementation in routes/authRoutes.js.
  // This avoids duplicate/competing handlers that can cause serverless crashes.
  return res.status(500).json({
    success: false,
    message: 'googleCallback is handled by routes/authRoutes.js in production.'
  });
};

// 3. Simple Stateless Cookie Reset
exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.redirect('/index.html');
};