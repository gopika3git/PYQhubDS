require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ImageKit = require('imagekit');

// =========================
// ✅ NEW: Passport + Session imports (PLACE at top of server.js)
// =========================
const session = require('express-session');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const User = require('./models/user');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ➡️ ${req.method} request sent to: ${req.url}`);
    next();
});

const path = require('path');
const authRoutes = require(path.resolve(__dirname, 'routes/authRoutes'));
const paperRoutes = require(path.resolve(__dirname, 'routes/paperRoutes'));

app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);

// =========================
// ✅ NEW: Session + Passport configuration (PLACE after app initialization)
// =========================
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev_session_secret_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // If you deploy to HTTPS (Vercel/Render), keep secure=true.
      // For local dev on http://localhost, keep it false.
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Serialize the whole minimal user info into the session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user || false);
  } catch (err) {
    done(err);
  }
});

// =========================
// ✅ NEW: Passport GoogleStrategy (PLACE after passport session setup)
// =========================
const ALLOWED_EMAIL_SUFFIXES = ['@vitstudent.ac.in', '@vit.ac.in'];

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract email from profile.emails[0].value
        const email = profile?.emails?.[0]?.value;

        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const isAllowed = ALLOWED_EMAIL_SUFFIXES.some((suffix) => normalizedEmail.endsWith(suffix));

        if (!isAllowed) {
          return done(null, false, {
            message: 'Access restricted to university students only',
          });
        }

        const displayName = profile?.displayName || 'Student';
        const googleId = profile.id;
        const profilePicture = profile?.photos?.[0]?.value || '';

        // Find or create the user document
        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            googleId,
            displayName,
            email,
            profilePicture,
          });
        } else {
          // Keep data fresh if user exists
          user.googleId = user.googleId || googleId;
          user.displayName = displayName;
          user.profilePicture = profilePicture;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// =========================
// ✅ NEW: EXPRESS AUTH ROUTES (PLACE after strategy registration)
// =========================
app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    // Ensure we always request profile + email
    prompt: 'select_account',
  })
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    // If you want the error message, add: failureMessage: true
    session: true,
  }),
  (req, res) => {
    // On success redirect to dashboard
    res.redirect('/dashboard');
  }
);

// Destroys session and redirects to '/'
app.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
});

// =========================
// ✅ NEW: RE-USABLE isLoggedIn middleware (PLACE before protected routes)
// =========================
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  return res.redirect('/login');
}

// =========================
// ✅ NEW: Apply middleware to GET /dashboard (PLACE where dashboard route is defined)
// =========================
// If your dashboard is a static HTML file under /public, you can still protect it by sending it here.
app.get('/dashboard', isLoggedIn, (req, res) => {
  // Serve your dashboard.html (static) safely after auth
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});


// ImageKit initialization mapping directly to your populated .env values
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Handshake endpoint mapped exactly to what app.js expects
// ImageKit authentication handshake token route
// ImageKit authentication handshake token route
// Inside server.js
app.get('/api/imagekit-auth', (req, res) => {
  try {
      // Force cross-origin headers so Vercel can safely talk to Render
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");

      const result = imagekit.getAuthenticationParameters();
      console.log("✅ ImageKit Auth Parameters Generated Successfully");
      res.json(result);
  } catch (err) {
      console.error("❌ ImageKit Auth Generator Error:", err.message);
      res.status(500).json({ error: "Failed to generate auth parameters", details: err.message });
  }
});

console.log("DEBUG - My MONGO_URL is:", process.env.MONGO_URL);

mongoose.connect(process.env.MONGO_URL)
  .then(() => console.log("🚀 Connected to Cloud MongoDB successfully!"))
  .catch(err => console.error("❌ Database connection error:", err));

app.get('/', (req, res) => {
  res.send('Your PYQ Platform Backend is officially running with ImageKit!');
});

app.use((err, req, res, next) => {
    console.error("🔴 GLOBAL BACKEND FAULT DETECTED:", err.stack);
    res.status(500).json({ 
        success: false, 
        message: "The server encountered a snag processing this request.",
        error: err.message 
    });
});

// At the bottom of server.js, change your listen block to this:
if (process.env.NODE_ENV !== 'production') {
  app.listen(5000, () => console.log('Server running locally'));
}

module.exports = app; // export for Vercel/Node (CommonJS)
