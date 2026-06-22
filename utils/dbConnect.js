const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI;

if (!MONGO_URL) {
  throw new Error('Please define MONGO_URL or MONGODB_URI environment variable inside your configuration settings.');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and serverless function invocations in Vercel.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // 🔑 Stops Mongoose from hanging/buffering when connection drops
    };

    cached.promise = mongoose.connect(MONGO_URL, opts).then((mongooseInstance) => {
      console.log('Successfully connected to MongoDB Cluster');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('Database connection crash registry:', e);
    throw e;
  }

  return cached.conn;
}

module.exports = dbConnect;