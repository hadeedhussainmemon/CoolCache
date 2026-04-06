import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/db';
import Product from '../../../lib/models/Product';
import { productSlug } from '../../../lib/utils/slug';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GET /api/products
export async function GET(req) {
  try {
    const conn = await connectToDatabase();
    console.log('--- API Products Debug ---');
    console.log('DB Name:', conn.connection?.name);
    console.log('Collection Name:', Product.collection.name);
    
    // Check if the collection actually has any documents at all
    const rawCount = await Product.countDocuments({});
    console.log('Raw count in collection:', rawCount);
    
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const pageSize = parseInt(searchParams.get('pageSize')) || 24;
    const search = (searchParams.get('q') || searchParams.get('search') || '').trim();
    const categoryParam = (searchParams.get('categories') || searchParams.get('category') || '').trim();
    const categories = categoryParam ? categoryParam.split(',').map(s => s.trim()).filter(Boolean) : [];
    
    const minPrice = isFinite(Number(searchParams.get('minPrice'))) ? Number(searchParams.get('minPrice')) : null;
    const maxPrice = isFinite(Number(searchParams.get('maxPrice'))) ? Number(searchParams.get('maxPrice')) : null;
    const inStock = searchParams.get('inStock') === 'true';
    const showHidden = searchParams.get('showHidden') === 'true';

    const matchStage = {};
    // Temporarily bypass visibility filter for debugging
    // if (!showHidden) matchStage.isVisible = true;

    if (categories.length > 0) {
      const regexCats = categories.map(c => new RegExp(`^${c}$`, 'i'));
      matchStage.category = { $in: regexCats };
    }

    if (search) {
      const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = new RegExp(escapeRegExp(search), 'i');
      matchStage.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { material: searchRegex },
        { vendor: searchRegex },
        { category: searchRegex }
      ];
    }

    if (minPrice !== null || maxPrice !== null) {
      matchStage.price = {};
      if (minPrice !== null) matchStage.price.$gte = minPrice;
      if (maxPrice !== null) matchStage.price.$lte = maxPrice;
    }

    if (inStock) matchStage.stock = { $gt: 0 };

    console.log('Match Stage:', JSON.stringify(matchStage, null, 2));

    let secondarySort = { _id: -1 };
    const sort = searchParams.get('sort');
    if (sort === 'priceAsc') secondarySort = { price: 1, _id: -1 };
    else if (sort === 'priceDesc') secondarySort = { price: -1, _id: -1 };
    else if (sort === 'featured') secondarySort = { stock: -1, _id: -1 };

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          availabilityScore: {
            $switch: {
              branches: [
                { case: { $and: [{ $gt: ["$stock", 0] }, { $gt: ["$price", 0] }] }, then: 3 },
                { case: { $gt: ["$stock", 0] }, then: 2 }
              ],
              default: 1
            }
          }
        }
      },
      { $sort: { availabilityScore: -1, ...secondarySort } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize }
          ]
        }
      }
    ];

    const result = await Product.aggregate(pipeline);
    console.log('Aggregate Result Length:', result[0]?.data?.length || 0);
    const total = result[0].metadata.length > 0 ? result[0].metadata[0].total : 0;
    const productsData = result[0].data;

    const payload = productsData.map(d => ({
      id: d.id,
      title: d.title,
      price: d.price,
      purchasePrice: d.purchasePrice,
      vendor: d.vendor,
      image: d.image,
      slug: d.slug,
      category: d.category,
      stock: d.stock,
      isVisible: d.isVisible,
      description: (d.description && d.description.length > 120) ? `${d.description.slice(0, 120)}...` : d.description
    }));

    return NextResponse.json({ products: payload, total, page, pageSize }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' }
    });
  } catch (error) {
    console.error('API Products GET error:', error);
    return NextResponse.json({ 
      message: 'Error fetching products', 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
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
