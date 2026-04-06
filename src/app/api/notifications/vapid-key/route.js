import { NextResponse } from 'next/server';

// GET /api/notifications/vapid-key
export async function GET() {
  return NextResponse.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
}
