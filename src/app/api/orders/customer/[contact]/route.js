import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Order from '@/lib/models/Order';

// GET /api/orders/customer/[contact]
export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const { contact } = await params;
    if (!contact) return NextResponse.json({ message: 'Missing customer contact' }, { status: 400 });

    const query = {
      $or: [
        { customerPhone: contact },
        { customerEmail: { $regex: `^${contact}$`, $options: 'i' } }
      ]
    };

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(orders.map(o => ({ ...o, _source: 'db' })));
  } catch (error) {
    console.error('API Customer Orders error:', error);
    return NextResponse.json({ message: 'Error fetching customer orders', error: error.message }, { status: 500 });
  }
}
