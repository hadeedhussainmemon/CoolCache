import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import Review from '../../../lib/models/Review';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/reviews (Public)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const includePending = searchParams.get('includePending') === 'true';

    await connectToDatabase();
    let filter = { status: 'approved' };
    let projection = 'name rating review productPurchased createdAt';

    if (includePending) {
      const token = req.headers.get('authorization')?.split(' ')[1];
      if (token) {
        try {
          jwt.verify(token, JWT_SECRET);
          filter = { status: { $in: ['approved', 'pending'] } };
          projection = 'name rating review productPurchased createdAt status';
        } catch (e) {}
      } else if (process.env.NODE_ENV !== 'production') {
        filter = { status: { $in: ['approved', 'pending'] } };
        projection = 'name rating review productPurchased createdAt status';
      }
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .select(projection)
      .lean();

    return NextResponse.json(reviews, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' }
    });
  } catch (error) {
    console.error('API Reviews GET error:', error);
    return NextResponse.json({ message: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST /api/reviews (Submit)
export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, email, productPurchased, rating, review } = body;
    const parsedRating = Number(rating);

    if (!name || !email || isNaN(parsedRating) || !review) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (review.length < 20) {
      return NextResponse.json({ message: 'Review must be at least 20 characters long' }, { status: 400 });
    }

    if (parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json({ message: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const newReview = new Review({
      name, email, productPurchased: productPurchased || '',
      rating: parsedRating, review, status: 'pending'
    });

    await newReview.save();
    return NextResponse.json({
      message: 'Review submitted successfully! It will appear after admin approval.',
      success: true
    }, { status: 201 });

  } catch (error) {
    console.error('API Reviews POST error:', error);
    return NextResponse.json({ message: 'Failed to submit review' }, { status: 500 });
  }
}
