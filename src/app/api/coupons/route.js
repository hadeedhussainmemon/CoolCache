import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/coupons (Admin Only)
export async function GET(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    } catch (e) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return NextResponse.json(coupons);
  } catch (error) {
    console.error('API Coupons GET error:', error);
    return NextResponse.json({ message: 'Error fetching coupons', error: error.message }, { status: 500 });
  }
}

// POST /api/coupons (Admin Only)
export async function POST(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.role !== 'admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    } catch (e) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { code, discountType, discountValue, minOrderAmount, expiryDate, usageLimit } = body;

    if (!code || !discountType || !discountValue || !expiryDate) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const existing = await Coupon.findOne({ code: code.toUpperCase() });
    if (existing) return NextResponse.json({ message: 'Coupon code already exists' }, { status: 400 });

    const coupon = new Coupon({
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount || 0),
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? Number(usageLimit) : null
    });

    await coupon.save();
    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    console.error('API Coupons POST error:', error);
    return NextResponse.json({ message: 'Error creating coupon', error: error.message }, { status: 500 });
  }
}
