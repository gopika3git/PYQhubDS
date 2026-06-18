const mongoose = require('mongoose');

// Email-only login model (no username/password fields)
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    displayName: {
      type: String,
      default: '',
    },
    // Keep for backward compatibility (older Google/OAuth users may exist)
    googleId: {
      type: String,
      required: false,
      unique: true,
      index: true,
    },
    profilePicture: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);


