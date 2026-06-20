const passport = require('passport');
const jwt = require('jsonwebtoken'); // Ensure you run: npm install jsonwebtoken

// 1. Initiates the Google OAuth Flow
exports.googleAuth = passport.authenticate('google', { 
  scope: ['profile', 'email'],
  hd: 'vitstudent.ac.in' // Enforces VIT organization accounts
});

// 2. Handles the incoming redirect payload from Google
exports.googleCallback = [
  // CRITICAL STEP: Disable session support directly inside the Passport middleware array
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  
  async (req, res) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Authentication failed. No user profile returned from Google."
        });
      }

      // Enforce university email restriction
      if (!user.email.endsWith('@vitstudent.ac.in')) {
        return res.status(403).json({
          success: false,
          message: "Access Denied: Only @vitstudent.ac.in email addresses are allowed."
        });
      }

      // Generate a stateless token since Vercel has no server-side memory
      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET || 'fallback_secret_if_missing',
        { expiresIn: '7d' }
      );

      // Set cookie container for the browser frontend
      res.cookie('token', token, {
        httpOnly: false, // Allows public/dashboard.js to easily pull verification if needed
        secure: true,   // Required for HTTPS on Vercel production
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // SUCCESS: Direct drop onto your dashboard page from your public folder!
      return res.redirect('/dashboard.html');

    } catch (error) {
      console.error("OAuth Callback System Error:", error);
      return res.status(500).json({
        success: false,
        message: "The server encountered a snag processing this request.",
        error: error.message
      });
    }
  }
];

// 3. Simple Stateless Logout
exports.logout = (req, res) => {
  res.clearCookie('token');
  return res.redirect('/index.html');
};