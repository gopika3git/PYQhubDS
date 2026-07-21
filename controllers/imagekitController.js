const ImageKit = require("imagekit");

// Initialize ImageKit instance using your environment variables
const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Endpoint handler for ImageKit Client SDK
exports.getImageKitAuth = (req, res) => {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    // Returns flat JSON: { signature, token, expire }
    return res.status(200).json(authenticationParameters);
  } catch (error) {
    console.error("🔴 ImageKit Auth Error:", error);
    return res.status(500).json({ error: "Failed to generate ImageKit auth parameters" });
  }
};