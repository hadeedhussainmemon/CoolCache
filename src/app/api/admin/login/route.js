import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Rate limiting in-memory (ephemeral on Vercel)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000;

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

export async function POST(req) {
  try {
    const body = await req.json();
    const { username, password } = body;
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';

    if (!username || !password) {
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
    }

    const attemptKey = `${clientIP}-${username}`;
    const attempts = loginAttempts.get(attemptKey) || { count: 0, lockedUntil: null };

    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const remainingMinutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
      return NextResponse.json({
        message: `Too many failed attempts. Account locked for ${remainingMinutes} more minute(s).`
      }, { status: 429 });
    }

    if (attempts.lockedUntil && Date.now() >= attempts.lockedUntil) {
      loginAttempts.delete(attemptKey);
      attempts.count = 0;
      attempts.lockedUntil = null;
    }

    const isValidUsername = timingSafeEqual(username, ADMIN_USERNAME);
    const isValidPassword = timingSafeEqual(password, ADMIN_PASSWORD);

    if (isValidUsername && isValidPassword) {
      loginAttempts.delete(attemptKey);
      const token = jwt.sign(
        { username, role: "admin" },
        JWT_SECRET,
        { expiresIn: "8h" }
      );

      return NextResponse.json({ token, message: "Login successful" });
    }

    attempts.count += 1;
    if (attempts.count >= MAX_ATTEMPTS) {
      attempts.lockedUntil = Date.now() + LOCKOUT_TIME;
      loginAttempts.set(attemptKey, attempts);
      return NextResponse.json({ message: `Too many failed attempts. Account locked for 15 minutes.` }, { status: 429 });
    }

    loginAttempts.set(attemptKey, attempts);
    const remainingAttempts = Math.max(0, MAX_ATTEMPTS - attempts.count);
    return NextResponse.json({
      message: "Invalid username or password",
      remainingAttempts
    }, { status: 401 });

  } catch (error) {
    console.error('API Admin Login error:', error);
    return NextResponse.json({ message: "Server error during login" }, { status: 500 });
  }
}
