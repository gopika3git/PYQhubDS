const passport = require('passport');

// Triggers the Google login screen
exports.googleAuth = (req, res, next) => {
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })(req, res, next);
};

// Handles the redirection back from Google
exports.googleCallback = (req, res, next) => {
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: true,
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

