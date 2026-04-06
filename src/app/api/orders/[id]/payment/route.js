import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/models/Order';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// PATCH /api/orders/[id]/payment (Admin Only)
export async function PATCH(req, { params }) {
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
    const { paymentStatus } = await req.json();
    const validStatuses = ['pending', 'paid'];
    if (!validStatuses.includes(paymentStatus)) return NextResponse.json({ message: 'Invalid payment status' }, { status: 400 });

    const updatedOrder = await Order.findOneAndUpdate({ id }, { $set: { paymentStatus, updatedAt: new Date() } }, { new: true, lean: true });
    if (!updatedOrder) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    return NextResponse.json({ message: 'Payment status updated successfully', order: { ...updatedOrder, _source: 'db' } });
  } catch (error) {
    console.error('API Order payment patch error:', error);
    return NextResponse.json({ message: 'Error updating payment status', error: error.message }, { status: 500 });
  }
}
