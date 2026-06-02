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

const authRoutes = require('./routes/authRoutes');
const paperRoutes = require('./routes/paperRoutes');

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
app.get('/api/imagekit-auth', (req, res) => {
  try {
      console.log("🔑 Frontend requested a secure ImageKit token signature...");
      
      const authParams = imagekit.getAuthenticationParameters();
      
      // 🛡️ Force explicit parameter mapping so the frontend never gets an "undefined" value
      res.json({
          signature: authParams.signature,
          token: authParams.token,
          expire: authParams.expire || authParams.expiry // <-- This fixes the version naming bug
      });
      
  } catch (error) {
      console.error("❌ ImageKit Handshake Failed:", error.message);
      res.status(500).json({ error: "Failed to generate ImageKit auth parameters" });
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

app.listen(PORT, () => {
  console.log(`Server is blasting off on port ${PORT}`);
});