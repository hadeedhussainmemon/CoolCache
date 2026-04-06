import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/db';
import Product from '../../../../lib/models/Product';
import { productSlug } from '../../../../lib/utils/slug';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/products/[id]
export async function GET(req, { params }) {
  try {
    await connectToDatabase();
    const idOrSlug = (await params).id;

    let product;
    if (/^\d+$/.test(idOrSlug)) {
      product = await Product.findOne({ id: parseInt(idOrSlug) });
    } else {
      product = await Product.findOne({ slug: idOrSlug });
    }

    if (!product) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

    return NextResponse.json(product, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' }
    });
  } catch (error) {
    return NextResponse.json({ message: 'Error fetching product', error: error.message }, { status: 500 });
  }
}

// PATCH /api/products/[id] (Admin)
export async function PATCH(req, { params }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();
    const productId = parseInt((await params).id);
    const body = await req.json();
    const { title, price, purchasePrice, description, category, material, stock, isCustomizable, colors, isVisible, image } = body;

    const product = await Product.findOne({ id: productId });
    if (!product) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

    if (title) {
      product.title = title;
      product.slug = productSlug({ ...product.toObject(), title });
    }

    if (price !== undefined && price !== '') product.price = parseFloat(price);
    if (purchasePrice !== undefined && purchasePrice !== '') product.purchasePrice = parseFloat(purchasePrice);
    if (description) product.description = description;

    if (category) {
      product.category = Array.isArray(category) ? category : (typeof category === 'string' ? category.split(',').map(c => c.trim()).filter(Boolean) : []);
    }

    if (material) product.material = material;
    if (stock !== undefined && stock !== '') product.stock = parseInt(stock);
    if (isCustomizable !== undefined) product.isCustomizable = !!isCustomizable;
    if (isVisible !== undefined) product.isVisible = !!isVisible;

    if (colors !== undefined) {
      product.colors = Array.isArray(colors) ? colors : (typeof colors === 'string' ? colors.split(',').map(s => s.trim()).filter(Boolean) : []);
    }

    if (image) product.image = image;

    await product.save();
    return NextResponse.json(product);
  } catch (error) {
    console.error('API Products PATCH error:', error);
    if (error.code === 11000) return NextResponse.json({ message: 'Duplicate value error' }, { status: 400 });
    return NextResponse.json({ message: 'Error updating product', error: error.message }, { status: 500 });
  }
}

// DELETE /api/products/[id] (Admin)
export async function DELETE(req, { params }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    
    try {
      jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    await connectToDatabase();
    const id = parseInt((await params).id);
    const result = await Product.findOneAndDelete({ id });

    if (!result) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting product', error: error.message }, { status: 500 });
  }
}
