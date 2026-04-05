import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = 'https://coolcache.onrender.com/api/products?pageSize=1000'; // Fetch all
const HOST = 'https://www.coolcache.app';
const TARGET_FILE = path.resolve(__dirname, '../public/sitemap.xml');

async function generateSitemap() {
    console.log('Fetching products from', API_URL);
    try {
        const res = await fetch(API_URL);
        const data = await res.json();
        const products = data.products || (Array.isArray(data) ? data : []);

        console.log(`Found ${products.length} products`);

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <url><loc>${HOST}</loc><priority>1.0</priority></url>
  <url><loc>${HOST}/categories</loc><priority>0.9</priority></url>
  <url><loc>${HOST}/faq</loc><priority>0.6</priority></url>

  <!-- Products -->
  ${products.map(p => {
            const slug = p.slug || p.id;
            const img = p.image ? (p.image.startsWith('http') ? p.image : `${HOST}${p.image.startsWith('/') ? '' : '/'}${p.image}`) : `${HOST}/og-image.jpg`;
            return `
  <url>
    <loc>${HOST}/product/${slug}</loc>
    <priority>0.8</priority>
    <image:image>
      <image:loc>${img.replace(/&/g, '&amp;')}</image:loc>
      <image:title>${(p.title || 'Product').replace(/&/g, '&amp;')}</image:title>
    </image:image>
  </url>`;
        }).join('')}

</urlset>`;

        fs.writeFileSync(TARGET_FILE, sitemap);
        console.log('Sitemap generated successfully at', TARGET_FILE);

    } catch (e) {
        console.error('Error generating sitemap:', e);
        process.exit(1);
    }
}

generateSitemap();
