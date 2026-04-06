import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Subscription from '@/lib/models/Subscription';

// POST /api/notifications/subscribe (Public)
export async function POST(req) {
  try {
    await connectToDatabase();
    const subscription = await req.json();
    
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ message: 'Invalid subscription' }, { status: 400 });
    }

    const exists = await Subscription.findOne({ endpoint: subscription.endpoint });
    if (!exists) {
      await Subscription.create(subscription);
      return NextResponse.json({ message: 'Subscribed successfully' }, { status: 201 });
    } else {
      return NextResponse.json({ message: 'Already subscribed' });
    }
  } catch (error) {
    console.error('API Notifications Subscribe error:', error);
    return NextResponse.json({ message: 'Failed to subscribe' }, { status: 500 });
  }
}
