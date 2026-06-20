const passport = require('passport');

// Triggers the Google login screen
exports.googleAuth = (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
    // IMPORTANT: disable session on initial auth too
    session: false,
  })(req, res, next);
};

// Handles the redirection back from Google
exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', {
    failureRedirect: '/login',
    // IMPORTANT: disable passport session handling (serverless/stateless)
    session: false,
  })(req, res, next);
};

// Clears the session
exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session?.destroy(() => {
      res.redirect('/');
    });
  });
};

