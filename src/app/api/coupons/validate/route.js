import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Coupon from '@/lib/models/Coupon';

// POST /api/coupons/validate (Public)
export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { code, cartTotal } = body;

    if (!code) return NextResponse.json({ message: 'Coupon code is required' }, { status: 400 });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) return NextResponse.json({ message: 'Invalid coupon code' }, { status: 404 });
    
    if (!coupon.isActive || (coupon.expiryDate && new Date() > coupon.expiryDate) || (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit)) {
      return NextResponse.json({ message: 'Coupon is expired or inactive' }, { status: 400 });
    }

    if (cartTotal !== undefined && coupon.minOrderAmount > 0 && cartTotal < coupon.minOrderAmount) {
      return NextResponse.json({ message: `Minimum order amount of ${coupon.minOrderAmount} PKR required` }, { status: 400 });
    }

    let discountAmount = coupon.discountType === 'percentage' ? (cartTotal * coupon.discountValue) / 100 : coupon.discountValue;
    if (cartTotal !== undefined && discountAmount > cartTotal) discountAmount = cartTotal;

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      calculatedDiscount: discountAmount
    });
  } catch (error) {
    console.error('API Coupons validate error:', error);
    return NextResponse.json({ message: 'Error validating coupon', error: error.message }, { status: 500 });
  }
}
