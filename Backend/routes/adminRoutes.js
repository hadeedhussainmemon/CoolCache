const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();

// Admin credentials (in production, these should be in a database)
// SECURITY: Remove defaults in production - require environment variables
if (process.env.NODE_ENV === 'production') {
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || !process.env.JWT_SECRET) {
    console.error('❌ CRITICAL: Admin credentials not configured in production!');
    console.error('Set ADMIN_USERNAME, ADMIN_PASSWORD, and JWT_SECRET environment variables');
    process.exit(1);
  }
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
// Password should be bcrypt hash in env, not plaintext
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');

// Helper for timing-safe string comparison
function timingSafeEqual(a, b) {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// Rate limiting in memory (simple protection against brute force)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// Login route (optimized - debug logging removed)
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required" });
    }

    // Check rate limiting
    const attemptKey = `${clientIP}-${username}`;
    const attempts = loginAttempts.get(attemptKey) || { count: 0, lockedUntil: null };

    // Check if account is locked
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const remainingMinutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        message: `Too many failed attempts. Account locked for ${remainingMinutes} more minute(s).`
      });
    }

    // Reset if lockout expired
    if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
      loginAttempts.delete(attemptKey);
      attempts.count = 0;
      attempts.lockedUntil = null;
    }

    // Validate credentials using timing-safe comparison
    const isValidUsername = timingSafeEqual(username, ADMIN_USERNAME);
    const isValidPassword = timingSafeEqual(password, ADMIN_PASSWORD);

    if (isValidUsername && isValidPassword) {
      // Success - clear attempts
      loginAttempts.delete(attemptKey);
      
      // Generate JWT token with shorter expiration for security
      const token = jwt.sign(
        { username, role: "admin" },
        JWT_SECRET,
        { expiresIn: "8h" } // Changed from 1M (1 month) to 8h
      );

      return res.json({
        token,
        message: "Login successful",
      });
    }

    // Invalid credentials - increment attempts
    attempts.count += 1;
    
    if (attempts.count >= MAX_ATTEMPTS) {
      attempts.lockedUntil = Date.now() + LOCKOUT_TIME;
      loginAttempts.set(attemptKey, attempts);
      return res.status(429).json({
        message: `Too many failed attempts. Account locked for 15 minutes.`
      });
    }

    loginAttempts.set(attemptKey, attempts);
    
    const remainingAttempts = MAX_ATTEMPTS - attempts.count;
    return res.status(401).json({
      message: "Invalid username or password",
      remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error during login",
    });
  }
});

module.exports = router;
