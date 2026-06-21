require('dotenv').config();

const express = require('express');
const cors = require('cors');
const ImageKit = require('imagekit');
const path = require('path');

const paperRoutes = require(path.resolve(__dirname, 'routes/paperRoutes'));

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ➡️ ${req.method} request to: ${req.url}`);
  next();
});

app.use('/api/papers', paperRoutes);

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

// Landing -> dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard.html');
});

app.use((err, req, res, next) => {
  console.error('🔴 GLOBAL ERROR:', err.stack);
  res.status(500).json({ success: false, error: err.message });
});

module.exports = app;
