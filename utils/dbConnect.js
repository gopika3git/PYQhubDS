// utils/dbConnect.js
const mongoose = require('mongoose');

let cached = global.__mongooseConn;

if (!cached) {
  cached = global.__mongooseConn = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) throw new Error('MONGO_URL is not defined');

    cached.promise = mongoose.connect(mongoUrl);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = dbConnect;

