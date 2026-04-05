const Product = require('../models/Product');
const getImageUrl = require('../utils/imageUrl'); // Ensure this utilizes the backend utility we fixed/checked

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.coolcache.app';

exports.getSitemap = async (req, res) => {
    try {
        // Fetch all VISIBLE products
        // Select only necessary fields to keep query light
        const products = await Product.find({ isVisible: true })
            .select('slug title image updatedAt category')
            .sort({ updatedAt: -1 });

        // Base static URLs
        const staticUrls = [
            { url: '/', priority: '1.0', changefreq: 'daily' },
            { url: '/categories', priority: '0.9', changefreq: 'weekly' },
            { url: '/faq', priority: '0.6', changefreq: 'monthly' }
        ];

        // 1. Hardcoded high-value Categories (from CategoryPage.jsx)
        const ALIAS_SLUGS = [
            'girls-accessories',
            'boys-accessories',
            'womens-watches',
            'mens-watches',
            'couple-gifts',
            'friendship-bands',
            'kids-bracelets'
        ];

        ALIAS_SLUGS.forEach(slug => {
            staticUrls.push({ url: `/category/${slug}`, priority: '0.8', changefreq: 'weekly' });
        });

        // 2. Dynamic Categories from DB products
        const dbCategories = await Product.distinct('category');
        dbCategories.forEach(cat => {
            if (!cat) return;
            // Handle array categories if distinct returns arrays (unlikely with .distinct but possible if schema is array)
            // Flatten just in case/normalize
            const catStr = String(cat);
            // Normalize to slug
            const slug = catStr.toLowerCase().replace(/\s+/g, '-');

            // Avoid duplicates if already in ALIAS_SLUGS
            if (!ALIAS_SLUGS.includes(slug)) {
                staticUrls.push({ url: `/category/${slug}`, priority: '0.8', changefreq: 'weekly' });
            }
        });

        let xml = '<?xml version="1.0" encoding="UTF-8"?>';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">';

        // Add Static URLs
        staticUrls.forEach(page => {
            xml += `
  <url>
    <loc>${FRONTEND_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
        });

        // Add Product URLs
        products.forEach(product => {
            const productUrl = `${FRONTEND_URL}/product/${product.slug || product.id}`;
            const lastMod = new Date(product.updatedAt).toISOString();

            // Resolve Image URL
            // Note: getImageUrl might return a full URL or a relative path depending on implementation.
            // If it returns a relative path starting with /, prepend FRONTEND_URL or API_BASE_URL depending on where it serves.
            // Current backend imageUrl util (if duplicated from frontend) might function differently. 
            // Let's assume simplest case: if it's a full URL (Cloudinary), use it. If relative, assume served from backend but sitemap expects public URL.
            // Since we don't have perfect image URL resolution for local files without knowing serving strategy perfectly, we will try our best.

            let imgLoc = product.image;
            if (imgLoc) {
                if (!imgLoc.startsWith('http')) {
                    // It's likely a local file.
                    // If backend serves 'uploads' statically, we might point there.
                    // Or if existing sitemap pointed to frontend public assets.
                    // For now, let's construct a reasonable guess or use a placeholder if unsure.
                    // The static sitemap used: https://www.coolcache.app/products/...
                    // If it is a new upload, it might be in 'uploads/'.
                    // Let's rely on the fact most new items are likely Cloudinary or handled genericly.
                    if (imgLoc.startsWith('/')) {
                        imgLoc = `${FRONTEND_URL}${imgLoc}`;
                    } else {
                        imgLoc = `${FRONTEND_URL}/${imgLoc}`;
                    }
                }
            }

            xml += `
  <url>
    <loc>${productUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <priority>0.8</priority>
    ${imgLoc ? `
    <image:image>
      <image:loc>${imgLoc}</image:loc>
      <image:title>${product.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}</image:title>
    </image:image>` : ''}
  </url>`;
        });

        xml += '</urlset>';

        res.header('Content-Type', 'application/xml');
        res.send(xml);

    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).send('Error generating sitemap');
    }
};
