import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import AdminSettings from '@/lib/models/AdminSettings';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function verifyAdmin(req) {
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.role !== 'admin') throw new Error('Forbidden');
  return decoded;
}

// GET /api/admin/settings
export async function GET(req) {
  try {
    // Only admins should ideally see full settings including private emails
    await verifyAdmin(req);
    await connectToDatabase();
    let settings = await AdminSettings.findOne();
    if (!settings) settings = await AdminSettings.create({});
    return NextResponse.json(settings);
  } catch (error) {
    console.error('API Admin Settings GET error:', error);
    const status = error.message === 'Unauthorized' ? 401 : (error.message === 'Forbidden' ? 403 : 500);
    return NextResponse.json({ message: error.message }, { status });
  }
}

// PUT /api/admin/settings
export async function PUT(req) {
  try {
    await verifyAdmin(req);
    await connectToDatabase();
    const updates = await req.json();
    const settings = await AdminSettings.findOneAndUpdate({}, updates, { new: true, upsert: true });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('API Admin Settings PUT error:', error);
    const status = error.message === 'Unauthorized' ? 401 : (error.message === 'Forbidden' ? 403 : 500);
    return NextResponse.json({ message: error.message }, { status });
  }
}
