require('dotenv').config();

const express = require('express');
const cors = require('cors');
const ImageKit = require('imagekit');
const path = require('path');
const rateLimit = require('express-rate-limit'); // 1. Import rate limiter

// Route Imports
const paperRoutes = require(path.resolve(__dirname, 'routes/paperRoutes'));
const authRoutes = require(path.resolve(__dirname, 'routes/authRoutes')); 
const { authenticateUser } = require(path.resolve(__dirname, 'middleware/authMiddleware'));

const app = express();
app.enable('trust proxy'); 

// 2. Define Rate Limiter (Stops script attacks from crashing the site)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 100, // Limit each IP to 100 requests per 15 minutes
  message: { success: false, error: "Too many requests from this device. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(require('cookie-parser')());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ➡️ ${req.method} request to: ${req.url}`);
  next();
});

// 3. Apply Rate Limiting to all APIs
app.use('/api/', apiLimiter);

// 4. Secure API Registration 
// This blocks random script scraping & JSON manipulation by forcing auth on all paper endpoints
app.use('/api/papers', authenticateUser, paperRoutes);
app.use('/api/auth', authRoutes); 

// ImageKit Setup
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

app.get('/api/imagekit-auth', authenticateUser, (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.json(imagekit.getAuthenticationParameters());
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate auth parameters' });
  }
});

// Auth-gated page routes
app.get('/dashboard', authenticateUser, (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public/dashboard.html'));
});

app.get('/dashboard.html', authenticateUser, (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public/dashboard.html'));
});

app.get('/upload', authenticateUser, (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public/upload.html'));
});

app.get('/upload.html', authenticateUser, (req, res) => {
  res.sendFile(path.resolve(__dirname, 'public/upload.html'));
});

// Static files served AFTER protected routes
app.use(express.static('public'));

// Landing Page Redirect
app.get('/', (req, res) => {
  return res.redirect('/dashboard');
});

// Global Sanitized Error Handler (Stops database trace/crash leaks)
app.use((err, req, res, next) => {
  console.error('🔴 GLOBAL ERROR:', err.stack);
  res.status(500).json({ success: false, error: "An internal server error occurred." });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is spinning up on http://localhost:${PORT}`);
});

module.exports = app;