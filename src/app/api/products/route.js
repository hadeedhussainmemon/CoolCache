import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import Product from '../../../lib/models/Product';
import { productSlug } from '../../../lib/utils/slug';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/products
export async function GET(req) {
  try {
    await connectToDatabase();
    
    // Total raw pipe: No filters, no pagination, no hydration limits.
    const products = await Product.find({})
      .sort({ createdAt: -1 })
      .lean();

    const total = products.length;

    return NextResponse.json({ 
      products, 
      total,
      message: "Data Archive Synchronized" 
    }, {
      headers: { 'Cache-Control': 's-maxage=1, stale-while-revalidate=59' }
    });
  } catch (error) {
    console.error('API Products GET error:', error);
    return NextResponse.json({ message: 'Error fetching products', error: error.message }, { status: 500 });
  }
}

// POST /api/products (Admin)
export async function POST(req) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();
    const { title, price, description, category, material, stock, isCustomizable, colors, isVisible, image } = body;

    const lastProduct = await Product.findOne().sort({ id: -1 });
    const nextId = (lastProduct && lastProduct.id) ? lastProduct.id + 1 : 1;

    const parsedColors = Array.isArray(colors) ? colors : (typeof colors === 'string' ? colors.split(',').map(s => s.trim()).filter(Boolean) : []);
    const categoryArray = Array.isArray(category) ? category : (typeof category === 'string' ? category.split(',').map(c => c.trim()).filter(Boolean) : []);

    const newProduct = new Product({
      id: nextId,
      title,
      price: parseFloat(price),
      description,
      image,
      category: categoryArray,
      material: material || '',
      stock: parseInt(stock) || 0,
      colors: parsedColors,
      isCustomizable: !!isCustomizable,
      isVisible: isVisible === undefined ? true : !!isVisible
    });

    newProduct.slug = productSlug(newProduct);
    await newProduct.save();

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('API Products POST error:', error);
    return NextResponse.json({ message: 'Error adding product', error: error.message }, { status: 500 });
  }
}
