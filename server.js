require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ImageKit = require('imagekit');
const path = require('path');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const jwt = require('jsonwebtoken'); // Ensure this is installed

const dbConnect = require('./utils/dbConnect');
const User = require('./models/user');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ➡️ ${req.method} request sent to: ${req.url}`);
    next();
});

// Initialize Passport (Without session support)
app.use(passport.initialize());

// ==========================================
// ✅ PASSPORT GOOGLE STRATEGY (Stateless)
// ==========================================
const ALLOWED_EMAIL_SUFFIXES = ['@vitstudent.ac.in', '@vit.ac.in'];

const computeGoogleCallbackURL = () => {
  if (process.env.GOOGLE_CALLBACK_URL) return process.env.GOOGLE_CALLBACK_URL;
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  return isProd 
    ? 'https://pyqhubds.vercel.app/api/auth/google/callback' 
    : 'http://localhost:5001/api/auth/google/callback';
};

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: computeGoogleCallbackURL(),
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        await dbConnect();
        const email = profile?.emails?.[0]?.value;
        const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        
        const isAllowed = ALLOWED_EMAIL_SUFFIXES.some((suffix) => normalizedEmail.endsWith(suffix));
        if (!isAllowed) {
          return done(null, false, { message: 'Access restricted to university students only' });
        }

        let user = await User.findOne({ email: normalizedEmail });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            displayName: profile?.displayName || 'Student',
            email: normalizedEmail,
            profilePicture: profile?.photos?.[0]?.value || '',
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// ==========================================
// 🛣️ ROUTE SEPARATION
// ==========================================
const authRoutes = require(path.resolve(__dirname, 'routes/authRoutes'));
const paperRoutes = require(path.resolve(__dirname, 'routes/paperRoutes'));

app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);

// ==========================================
// 🛡️ STATELESS COOKIE PROTECTION MIDDLEWARE
// ==========================================
function isLoggedIn(req, res, next) {
  // Try to grab the cookie from the request header manually
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(new RegExp('(^| )token=([^;]+)'));
  const token = match ? match[2] : null;

  if (!token) {
    return res.redirect('/index.html'); // Send back to login if no token found
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_if_missing');
    req.user = verified;
    next();
  } catch (err) {
    return res.redirect('/index.html');
  }
}

// Protect the static dashboard route
app.get('/dashboard.html', isLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// ==========================================
// 📷 IMAGEKIT CONFIGURATION
// ==========================================
const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

app.get('/api/imagekit-auth', (req, res) => {
  try {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      res.json(imagekit.getAuthenticationParameters());
  } catch (err) {
      res.status(500).json({ error: "Failed to generate auth parameters" });
  }
});

// Root Ping
app.get('/', (req, res) => {
  res.send('Your PYQ Platform Backend is running statelessly on Vercel!');
});

// Global Error Handler Block
app.use((err, req, res, next) => {
    console.error("🔴 GLOBAL BACKEND FAULT DETECTED:", err.stack);
    res.status(500).json({ 
        success: false, 
        message: "The server encountered a snag processing this request.",
        error: err.message 
    });
});

// Vercel Serverless environment handling
if (process.env.NODE_ENV !== 'production') {
  app.listen(5001, () => console.log('Server running locally on port 5001'));
}

module.exports = app;