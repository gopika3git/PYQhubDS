require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const ImageKit = require('imagekit');

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

export default app; // CRITICAL FOR VERCEL