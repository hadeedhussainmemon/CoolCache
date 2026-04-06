import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../lib/db';
import Order from '../../../../../lib/models/Order';
import { sendOrderStatusUpdate } from '../../../../../lib/services/emailService';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// PATCH /api/orders/[id]/status (Admin Only)
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
    const { status } = await req.json();
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) return NextResponse.json({ message: 'Invalid status' }, { status: 400 });

    const updatedOrder = await Order.findOneAndUpdate({ id }, { $set: { status, updatedAt: new Date() } }, { new: true, lean: true });
    if (!updatedOrder) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    // Notify Customer
    sendOrderStatusUpdate(updatedOrder).catch(err => console.error('Status email error:', err));

    return NextResponse.json({ message: 'Order status updated successfully', order: { ...updatedOrder, _source: 'db' } });
  } catch (error) {
    console.error('API Order Stats status patch error:', error);
    return NextResponse.json({ message: 'Error updating status', error: error.message }, { status: 500 });
  }
}
