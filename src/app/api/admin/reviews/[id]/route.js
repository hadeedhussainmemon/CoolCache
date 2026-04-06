import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Review from '@/lib/models/Review';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function verifyAdmin(req) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.role !== 'admin') throw new Error('Forbidden');
  return decoded;
}

// PATCH /api/admin/reviews/[id] (Admin Only)
export async function PATCH(req, { params }) {
  try {
    await verifyAdmin(req);
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    const review = await Review.findByIdAndUpdate(id, { status }, { new: true });
    if (!review) return NextResponse.json({ message: 'Review not found' }, { status: 404 });

    return NextResponse.json({ message: 'Review status updated successfully', review });
  } catch (error) {
    console.error('API Admin Reviews PATCH error:', error);
    const status = error.message === 'Unauthorized' ? 401 : (error.message === 'Forbidden' ? 403 : 500);
    return NextResponse.json({ message: error.message }, { status });
  }
}

// DELETE /api/admin/reviews/[id] (Admin Only)
export async function DELETE(req, { params }) {
  try {
    await verifyAdmin(req);
    await connectToDatabase();
    const { id } = await params;
    
    const review = await Review.findByIdAndDelete(id);
    if (!review) return NextResponse.json({ message: 'Review not found' }, { status: 404 });

    return NextResponse.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('API Admin Reviews DELETE error:', error);
    const status = error.message === 'Unauthorized' ? 401 : (error.message === 'Forbidden' ? 403 : 500);
    return NextResponse.json({ message: error.message }, { status });
  }
}
