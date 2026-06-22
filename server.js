require('dotenv').config();

const express = require('express');
const cors = require('cors');
const ImageKit = require('imagekit');
const path = require('path');

// 1. Route Imports
const paperRoutes = require(path.resolve(__dirname, 'routes/paperRoutes'));
const authRoutes = require(path.resolve(__dirname, 'routes/authRoutes')); 

const app = express();
app.enable('trust proxy'); // <--- ADD THIS LINE

// 2. Middleware Configuration
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Request Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ➡️ ${req.method} request to: ${req.url}`);
  next();
});

// 3. API Route Registration
app.use('/api/papers', paperRoutes);
app.use('/api/auth', authRoutes); 

// ImageKit Setup
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

app.get('/api/imagekit-auth', (req, res) => {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.json(imagekit.getAuthenticationParameters());
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate auth parameters' });
  }
});

// Landing Page Redirect
app.get('/', (req, res) => {
  res.redirect('/dashboard.html');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔴 GLOBAL ERROR:', err.stack);
  res.status(500).json({ success: false, error: err.message });
});

// 4. Local Server Listener
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is spinning up on http://localhost:${PORT}`);
});

module.exports = app;