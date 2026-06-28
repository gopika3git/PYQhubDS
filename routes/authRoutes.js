const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');

// --- PASSPORT GOOGLE STRATEGY CONFIGURATION ---
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    // Extract user email from Google Profile safely
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    
    if (!email) {const express = require('express');
      const router = express.Router();
      const passport = require('passport');
      const GoogleStrategy = require('passport-google-oauth20').Strategy;
      const jwt = require('jsonwebtoken');
      
      // --- PASSPORT GOOGLE STRATEGY CONFIGURATION ---
      passport.use(new GoogleStrategy({
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/api/auth/google/callback"
        },
        function(accessToken, refreshToken, profile, done) {
          const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
          
          if (!email) {
            return done(new Error("No email found in Google profile"), null);
          }
      
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
            const emailStr = typeof user.email === 'string' ? user.email.toLowerCase().trim() : '';
            const allowed = emailStr.endsWith('@vitstudent.ac.in') || emailStr.endsWith('@vit.ac.in');
            
            if (!allowed) {
              return res.status(403).json({
                success: false,
                message: 'Access Denied: Only valid VIT email addresses are allowed.'
              });
            }
      
            const token = jwt.sign(
              { id: user._id, email: user.email },
              process.env.JWT_SECRET || 'fallback_secret_if_missing',
              { expiresIn: '7d' }
            );
      
            // --- CRITICAL FIX FOR DASHBOARD.HTML GUARD ---
            // httpOnly must be false so dashboard.html script can parse it client-side
            res.cookie('token', token, {
              httpOnly: false, 
              secure: true, // Required for cross-domain cookie storage on modern browsers
              sameSite: 'none', // Essential for modern production hosting like Vercel
              maxAge: 7 * 24 * 60 * 60 * 1000
            });
      
            // --- FIX FOR RACE CONDITION: Pass displayName via a transient cookie ---
            const displayName = user.displayName || emailStr.split('@')[0];
            res.cookie('userNamePayload', encodeURIComponent(displayName), {
              secure: true,
              sameSite: 'none',
              maxAge: 1 * 60 * 1000 // 1 minute expiration window
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
        res.clearCookie('userNamePayload');
        return res.redirect('/');
      });
      
      module.exports = router;
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
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // true in production, false for localhost
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });


      // Redirect to dashboard (AUTH-GATED route)
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
  return res.redirect('/');
});

module.exports = router;