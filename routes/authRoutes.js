const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

// 1. Initiates the Google OAuth Flow
router.get('/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    hd: 'vitstudent.ac.in',
    session: false,
  })(req, res, next);
});

// 2. Handles the incoming redirect payload from Google
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login',
  }, async (err, user) => {
    try {
      if (err) return next(err);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Authentication failed. No user profile returned from Google.'
        });
      }

      // Enforce university email restriction
      const allowed = typeof user.email === 'string' && user.email.endsWith('@vitstudent.ac.in');
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Access Denied: Only @vitstudent.ac.in email addresses are allowed.'
        });
      }

      const token = jwt.sign(
        { id: user._id?.toString?.() || user._id, email: user.email },
        process.env.JWT_SECRET || 'fallback_secret_if_missing',
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // Redirect to dashboard
      return res.redirect('/dashboard.html');
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'The server encountered a snag processing this request.',
        error: error.message
      });
    }
  })(req, res, next);
});

// 3. Simple Stateless Logout
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  return res.redirect('/index.html');
});

// CRITICAL: Export the router so server.js can use it
module.exports = router;