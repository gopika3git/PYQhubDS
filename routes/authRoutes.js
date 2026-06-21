const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

// --- PASSPORT GOOGLE STRATEGY CONFIGURATION ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
    callbackURL: "/api/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // Extract user email from Google Profile safely
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    
    if (!email) {
      return done(new Error("No email found in Google profile"), null);
    }

    // Pass the user information to the next step
    const user = {
      _id: profile.id,
      email: email,
      displayName: profile.displayName
    };
    
    return done(null, user);
  }
));

// 1. Initiates the Google OAuth Flow
router.get('/google', (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    hd: 'vitstudent.ac.in', // Restricts account selection to this domain on the Google UI
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
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'fallback_secret_if_missing',
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production', // true in production, false for localhost
        sameSite: 'lax',
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

module.exports = router;