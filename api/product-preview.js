/**
 * Serverless function to serve bot-friendly product previews
 * Handles WhatsApp, Facebook, Instagram, Twitter scrapers
 */

const SITE_URL = process.env.SITE_URL || 'https://www.coolcache.app';
const API_BASE = process.env.API_BASE || 'https://coolcache.onrender.com';
// No debug logs for production — envs are used by deployment platform

export default async function handler(req, res) {
  const { id } = req.query || {};
  
  if (!id) {
    return res.status(400).send('Product ID required');
  }

  // Fetch product from live API for correct ID mapping
  const apiRes = await fetch(`${API_BASE}/api/products/${encodeURIComponent(id)}`);
  if (!apiRes.ok) {
    return res.status(404).send('Product not found');
  }
  const product = await apiRes.json();

  const rawImage = product && product.image ? product.image : '/og-image.jpg';
  const imageUrl = String(rawImage).startsWith('http') ? rawImage : `${API_BASE}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
  const productUrl = `${SITE_URL}/product/${product.slug || id}`;
  const description = product.description || `Buy ${product.title} at CoolCache Pakistan`;
  const price = Number(product.price) > 0 ? `Rs. ${Number(product.price).toLocaleString('en-PK')}` : 'Contact for price';

  // Generate bot-friendly HTML with rich meta tags
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${product.title} | CoolCache Pakistan</title>
  <meta name="description" content="${description.substring(0, 160)}">
  
  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="product">
  <meta property="og:url" content="${productUrl}">
  <meta property="og:title" content="${product.title} | CoolCache Pakistan">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${imageUrl}">
  <meta property="og:image:secure_url" content="${imageUrl}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="CoolCache Pakistan">
  <meta property="product:price:amount" content="${product.price}">
  <meta property="product:price:currency" content="PKR">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${productUrl}">
  <meta name="twitter:title" content="${product.title} | CoolCache Pakistan">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${imageUrl}">
  
  <!-- Canonical URL -->
  <link rel="canonical" href="${productUrl}">
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: description,
    image: [imageUrl],
    sku: String(product.id),
    mpn: String(product.id),
    brand: { '@type': 'Brand', name: 'CoolCache Pakistan' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PKR',
      price: Number(product.price) || 0,
      availability: product.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: productUrl,
      seller: { '@type': 'Organization', name: 'CoolCache Pakistan' }
    }
  })}</script>
  <script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: (Array.isArray(product.category) ? product.category[0] : product.category) || 'Category', item: `${SITE_URL}/category/${String(Array.isArray(product.category) ? product.category[0] : product.category || '').toLowerCase().replace(/\s+/g, '-')}` },
      { '@type': 'ListItem', position: 3, name: product.title, item: productUrl }
    ]
  })}</script>
  

</head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px;">
  <h1>${product.title}</h1>
  <img src="${imageUrl}" alt="${product.title}" style="max-width: 100%; height: auto; border-radius: 12px; margin: 20px 0;">
  <p style="font-size: 24px; font-weight: bold; color: #7c3aed;">${price}</p>
  <p style="color: #4b5563; line-height: 1.6;">${description}</p>
  <a href="${productUrl}" style="display: inline-block; background: linear-gradient(to right, #7c3aed, #ec4899); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 20px;">View Product</a>
  <p style="margin-top: 30px; color: #9ca3af; font-size: 14px;">Redirecting to full site...</p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(html);
}
