import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/models/Product';

export async function GET(req, { params }) {
  try {
    const { idOrSlug } = await params;
    await connectToDatabase();
    
    let product;
    if (/^\d+$/.test(idOrSlug)) {
      product = await Product.findOne({ id: parseInt(idOrSlug) });
    }
    if (!product) {
      product = await Product.findOne({ slug: idOrSlug });
    }

    const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.coolcache.app';
    if (!product) {
      return NextResponse.redirect(FRONTEND_URL);
    }

    const title = `${product.title} | CoolCache Pakistan`;
    const description = product.description ? product.description.substring(0, 150) + '...' : 'Check out this amazing product on CoolCache!';
    let finalImage = product.image || `${FRONTEND_URL}/og-image.jpg`;
    if (!finalImage.startsWith('http')) {
        finalImage = `${FRONTEND_URL}${finalImage.startsWith('/') ? '' : '/'}${finalImage}`;
    }

    const productUrl = `${FRONTEND_URL}/product/${product.slug || product.id}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <meta property="og:type" content="product" />
    <meta property="og:url" content="${productUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${finalImage}" />
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${finalImage}" />
    <script>window.location.href = "${productUrl}";</script>
</head>
<body><p>Redirecting to ${product.title}...</p></body>
</html>
    `;

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Share error:', error);
    return NextResponse.redirect(process.env.NEXT_PUBLIC_APP_URL || 'https://www.coolcache.app');
  }
}
