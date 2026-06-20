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

      res.cookie('token', token, {
        httpOnly: false,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.redirect('/dashboard.html');

    } catch (catchErr) {
      console.error("🔴 Fatal Catch in OAuth Callback:", catchErr);
      return res.redirect('/index.html?error=server_error');
    }
  })(req, res, next);
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.redirect('/index.html');
};