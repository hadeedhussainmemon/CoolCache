const mongoose = require('mongoose');

const DEFAULT_OPTIONS = {
  // Keep pool smaller on serverless platforms to avoid connection limits
  maxPoolSize: 8,
  minPoolSize: 0,
  // Wait longer for server selection to tolerate transient network blips
  serverSelectionTimeoutMS: 15000,
  // Time to establish TCP connection
  connectTimeoutMS: 8000,
  // Close sockets after this many ms of inactivity
  socketTimeoutMS: 30000,
  // How often to check server heartbeats
  heartbeatFrequencyMS: 5000,
  family: 4
};

// Cache connection across hot reloads / lambda warm instances
const globalRef = globalThis;
if (!globalRef.__mongo) globalRef.__mongo = { conn: null, promise: null };

async function connectToDatabase(uri) {
  if (!uri) throw new Error('MONGODB_URI not provided');

  // Return existing connected instance
  if (globalRef.__mongo.conn) {
    return globalRef.__mongo.conn;
  }

  // Implement a small retry/backoff strategy for transient network issues
  if (!globalRef.__mongo.promise) {
    mongoose.set('strictQuery', false);
    // Prevent Mongoose from buffering commands while disconnected to fail fast
    mongoose.bufferCommands = false;
    const maxAttempts = 3;
    let attempt = 0;
    globalRef.__mongo.promise = (async () => {
      while (attempt < maxAttempts) {
        try {
          attempt += 1;
          const mongooseInstance = await mongoose.connect(uri, DEFAULT_OPTIONS);

          // Attach debug listeners once
          mongoose.connection.on('connected', () => console.log('MongoDB connected'));
          mongoose.connection.on('error', (err) => console.error('MongoDB connection error', err));
          mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
          mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

          return mongooseInstance;
        } catch (err) {
          console.error(`MongoDB connect attempt ${attempt} failed:`, err.message || err);
          // reset promise on final failure so next caller can retry later
          if (attempt >= maxAttempts) {
            globalRef.__mongo.promise = null;
            throw err;
          }
          // exponential backoff: 500ms, 1000ms, 2000ms...
          const backoff = 500 * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, backoff));
        }
      }
    })();
  }

  globalRef.__mongo.conn = await globalRef.__mongo.promise;
  return globalRef.__mongo.conn;
}

function getMongoose() {
  return mongoose;
}

module.exports = { connectToDatabase, getMongoose };
