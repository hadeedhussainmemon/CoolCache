import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import Order from '../../../../lib/models/Order';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/orders/[id]
export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const { id } = await params;
    if (!id) return NextResponse.json({ message: 'Invalid order ID' }, { status: 400 });

    const order = await Order.findOne({ id }).lean();
    if (!order) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    return NextResponse.json({ ...order, _source: 'db' });
  } catch (error) {
    console.error('API Order GET error:', error);
    return NextResponse.json({ message: 'Error fetching order', error: error.message }, { status: 500 });
  }
}

// DELETE /api/orders/[id] (Admin Only)
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
    const result = await Order.deleteOne({ id });
    if (result.deletedCount === 0) return NextResponse.json({ message: 'Order not found' }, { status: 404 });

    return NextResponse.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('API Order DELETE error:', error);
    return NextResponse.json({ message: 'Error deleting order', error: error.message }, { status: 500 });
  }
}
