import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/models/Product';

// GET /api/products/trending-searches
export async function GET() {
  try {
    await connectToDatabase();
    const result = await Product.aggregate([
      { $unwind: "$category" },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const terms = result.map(r => r._id)
      .filter(c => c && c.trim())
      .map(c => String(c).replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase()));

    return NextResponse.json({ terms: terms.slice(0, 8) }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' }
    });
  } catch (error) {
    console.error('API Trending Searches error:', error);
    return NextResponse.json({ terms: [] });
  }
}
