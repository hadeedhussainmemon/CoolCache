import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/models/Product';

// GET /api/products/categories
export async function GET() {
  try {
    await connectToDatabase();
    
    const categories = await Product.aggregate([
      { $unwind: "$category" },
      {
        $group: {
          _id: { $toLower: "$category" },
          originalName: { $first: "$category" },
          count: { $sum: 1 },
          image: { $first: "$image" }
        }
      },
      { $sort: { originalName: 1 } }
    ]);

    const payload = categories.map(c => ({
      name: c.originalName,
      slug: String(c.originalName).toLowerCase().replace(/\s+/g, '-'),
      count: c.count,
      image: c.image || '/og-image.jpg'
    }));

    return NextResponse.json({ categories: payload }, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=7200' }
    });
  } catch (error) {
    console.error('API Categories error:', error);
    return NextResponse.json({ categories: [] });
  }
}
