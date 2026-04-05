const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// Generate dynamic sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await Product.find({}, 'id title slug image category updatedAt');
    const currentDate = new Date().toISOString().split('T')[0];

    // Extract unique categories (flatten arrays)
    const allCategories = products.flatMap(p => p.category || []);
    const categories = [...new Set(allCategories)].filter(Boolean);

    // Start XML
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  
  <!-- Homepage -->
  <url>
    <loc>https://www.coolcache.app</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://www.coolcache.app/og-image.jpg</image:loc>
      <image:title>CoolCache Pakistan - Trending Electronics &amp; Premium Gifts</image:title>
    </image:image>
  </url>

  <!-- Categories Page -->
  <url>
    <loc>https://www.coolcache.app/categories</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>

`;

    // Add category URLs
    categories.forEach(category => {
      const slug = String(category).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      xml += `  <!-- Category: ${escapeXml(category)} -->
  <url>
    <loc>https://www.coolcache.app/category/${slug}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>

`;
    });

    // Add individual product URLs
    products.forEach(product => {
      // Use Cloudinary URL directly if available
      let imageUrl = product.image;
      if (imageUrl && !imageUrl.startsWith('http')) {
        // Fallback for local paths if any remain
        imageUrl = `https://coolcache.onrender.com${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }
      if (!imageUrl) imageUrl = 'https://www.coolcache.app/og-image.jpg';

      // Prefer stored slug; compute fallback if missing
      const computedSlug = `${String(product.title || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')}-${product.id}`;
      const slug = product.slug || computedSlug;

      const lastMod = product.updatedAt ? new Date(product.updatedAt).toISOString().split('T')[0] : currentDate;

      xml += `  <!-- Product: ${escapeXml(product.title)} -->
  <url>
    <loc>https://www.coolcache.app/product/${slug}</loc>
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

    // Add static pages
    xml += `  <!-- FAQ Page -->
  <url>
    <loc>https://www.coolcache.app/faq</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Size Guide Page -->
  <url>
    <loc>https://www.coolcache.app/size-guide</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>

</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).send('Error generating sitemap');
  }
});

// Helper function to escape XML special characters
function escapeXml(unsafe) {
  return String(unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = router;
