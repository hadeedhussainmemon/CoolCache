import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Coupon from '@/lib/models/Coupon';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// DELETE /api/coupons/[id] (Admin Only)
export async function DELETE(req, { params }) {
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
    const { id } = await params;
    await Coupon.findByIdAndDelete(id);
    return NextResponse.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('API Coupons DELETE error:', error);
    return NextResponse.json({ message: 'Error deleting coupon', error: error.message }, { status: 500 });
  }
}
