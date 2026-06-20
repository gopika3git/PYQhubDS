const passport = require('passport');
const jwt = require('jsonwebtoken');

// 1. Initiates the Google OAuth Flow
exports.googleAuth = passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account'
});

// 2. Handles the incoming redirect payload from Google safely in serverless environments
exports.googleCallback = (req, res, next) => {
  // We use a custom callback function here to prevent Vercel from crashing
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    try {
      // If passport fails, redirect to home page with an error parameter instead of throwing a 500
      if (err || !user) {
        console.error("🔴 Passport Authentication Failure:", err || info);
        return res.redirect('/index.html?error=auth_failed');
      }

      const email = user.email ? user.email.toLowerCase().trim() : '';

      // Double check university email restrictions explicitly
      if (!email.endsWith('@vitstudent.ac.in') && !email.endsWith('@vit.ac.in')) {
        console.warn(`⚠️ Blocked unauthorized email domain attempt: ${email}`);
        return res.redirect('/index.html?error=invalid_domain');
      }

      // Generate the stateless JWT token
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'fallback_secret_production_key_123',
        { expiresIn: '7d' }
      );

      // Set the verification cookie for the frontend
      res.cookie('token', token, {
        httpOnly: false, // Set to false so public/dashboard.js can read it if needed
        secure: true,    // Critical for production HTTPS on Vercel
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // SUCCESS: Send them cleanly straight into your dashboard.html file
      return res.redirect('/dashboard.html');

    } catch (catchErr) {
      console.error("🔴 Fatal Catch in OAuth Callback:", catchErr);
      return res.redirect('/index.html?error=server_error');
    }
  })(req, res, next); // Crucial: executes the passport strategy invocation
};

// 3. Simple Stateless Cookie Reset
exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.redirect('/index.html');
};