const passport = require('passport');
const jwt = require('jsonwebtoken');

// 1. Initiates the Google OAuth Flow
exports.googleAuth = (req, res, next) => {
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })(req, res, next);
};

// 2. Handles the incoming redirect payload from Google
exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    try {
      if (err || !user) {
        console.error("🔴 Passport Authentication Failure:", err || info);
        return res.redirect('/index.html?error=auth_failed');
      }

      const email = user.email ? user.email.toLowerCase().trim() : '';

      if (!email.endsWith('@vitstudent.ac.in') && !email.endsWith('@vit.ac.in')) {
        return res.redirect('/index.html?error=invalid_domain');
      }

      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'fallback_secret_production_key_123',
        { expiresIn: '7d' }
      );

      // Main security token cookie
      res.cookie('token', token, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      // --- ADDED: Pass displayName securely via a transient cookie ---
      // We fall back to the email prefix if displayName isn't available
      const displayName = user.displayName || user.name || email.split('@')[0];
      res.cookie('userNamePayload', encodeURIComponent(displayName), {
        secure: true,
        sameSite: 'none',
        maxAge: 1 * 60 * 1000 // Lasts for 1 minute; just long enough for dashboard to pick it up
      });

      return res.redirect('/dashboard');

    } catch (catchErr) {
      console.error("🔴 Fatal Catch in OAuth Callback:", catchErr);
      return res.redirect('/index.html?error=server_error');
    }
  })(req, res, next);
};