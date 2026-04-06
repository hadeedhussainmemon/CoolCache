import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/models/Product';

// GET /api/products/category/[category]
export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const { category } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const pageSize = parseInt(searchParams.get('pageSize')) || 24;

    const regex = new RegExp(`^${category}$`, 'i');
    const query = { category: regex, isVisible: true };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    const payload = products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      description: p.description,
      image: p.image,
      slug: p.slug,
      category: p.category,
      material: p.material,
      stock: p.stock,
      isCustomizable: p.isCustomizable
    }));

    return NextResponse.json({ products: payload, total, page, pageSize }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching products by category', error: error.message }, { status: 500 });
  }
}
