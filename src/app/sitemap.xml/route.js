import { connectToDatabase } from '@/lib/db';
import Product from '@/lib/models/Product';

function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    await connectToDatabase();
    const products = await Product.find({}, 'id title slug image category updatedAt');
    const currentDate = new Date().toISOString().split('T')[0];
    const allCategories = products.flatMap(p => p.category || []);
    const categories = [...new Set(allCategories)].filter(Boolean);
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.coolcache.app';

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  
  <url>
    <loc>${APP_URL}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${APP_URL}/og-image.jpg</image:loc>
      <image:title>CoolCache Pakistan - Trending Electronics &amp; Premium Gifts</image:title>
    </image:image>
  </url>

  <url>
    <loc>${APP_URL}/categories</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

`;

    categories.forEach(category => {
      const slug = String(category).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      xml += `  <url>
    <loc>${APP_URL}/category/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;
    });

    products.forEach(product => {
      let imageUrl = product.image || `${APP_URL}/og-image.jpg`;
      const slug = product.slug || `${String(product.title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}-${product.id}`;
      const lastMod = product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : currentDate;

      xml += `  <url>
    <loc>${APP_URL}/product/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title>${escapeXml(product.title)}</image:title>
    </image:image>
  </url>
`;
    });

    xml += `  <url>
    <loc>${APP_URL}/faq</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <url>
    <loc>${APP_URL}/size-guide</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

</urlset>`;

    return new Response(xml, {
      headers: { 'Content-Type': 'application/xml' }
    });
  } catch (error) {
    console.error('API Sitemap error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
