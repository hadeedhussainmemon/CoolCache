const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const getImageUrl = require('../utils/imageUrl'); // Ensure this utility exists in backend or duplicate logic

// Helper to resolve absolute image URL
const resolveImageUrl = (path) => {
    if (!path) return 'https://www.coolcache.app/og-image.jpg';
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.IMAGE_BASE_URL || 'https://www.coolcache.app';
    // If path starts with /, append to base. If not, maybe append /. Clean up logic similar to frontend
    return `${baseUrl.replace(/\/$/, '')}/${path.startsWith('/') ? path.slice(1) : path}`;
};

router.get('/product/:idOrSlug', async (req, res) => {
    try {
        const { idOrSlug } = req.params;
        let product;

        // Try numeric ID first
        if (/^\d+$/.test(idOrSlug)) {
            product = await Product.findOne({ id: parseInt(idOrSlug) });
        }

        // If not found or not numeric, try slug
        if (!product) {
            product = await Product.findOne({ slug: idOrSlug });
        }

        const FRONTEND_URL = process.env.FRONTEND_URL || 'https://www.coolcache.app';

        if (!product) {
            // Fallback to home
            return res.redirect(FRONTEND_URL);
        }

        const title = `${product.title} | CoolCache Pakistan`;
        const description = product.description ? product.description.substring(0, 150) + '...' : 'Check out this amazing product on CoolCache!';

        // Construct Image URL
        let finalImage = 'https://www.coolcache.app/og-image.jpg';
        if (product.image) {
            if (product.image.startsWith('http')) {
                finalImage = product.image;
            } else {
                // Resolve relative path
                // Backend serves:
                // /images -> public/images
                // /products -> public/images/products

                const protocol = req.headers['x-forwarded-proto'] || req.protocol;
                const host = req.get('host');
                const baseUrl = `${protocol}://${host}`;

                // Check if path implies a directory provided by static mounts
                let cleanPath = product.image.startsWith('/') ? product.image : `/${product.image}`;

                // If path is just a filename (no slashes), assume it's in /products mount (legacy behavior)
                // BUT, looking at data/products.js will confirm.
                // Safest approach: Use the /images mount as a catch-all if organized? 
                // Let's assume most are under /products based on server.js mount.

                // Better yet, use the environment variable if available, similar to frontend
                const envImageBase = process.env.IMAGE_BASE_URL;
                if (envImageBase) {
                    finalImage = `${envImageBase.replace(/\/$/, '')}${cleanPath}`;
                } else {
                    // Fallback to constructing using current host
                    // If cleanPath starts with /images/ or /products/, utilize it.
                    // Otherwise default to /products/ if it looks like a product image filename
                    if (!cleanPath.startsWith('/images/') && !cleanPath.startsWith('/products/')) {
                        cleanPath = `/products${cleanPath}`;
                    }
                    finalImage = `${baseUrl}${cleanPath}`;
                }
            }
        }

        const productUrl = `${FRONTEND_URL}/product/${product.slug || product.id}`;

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="product" />
    <meta property="og:url" content="${productUrl}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${finalImage}" />
    <meta property="og:image:width" content="800" />
    <meta property="og:image:height" content="600" />

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${productUrl}" />
    <meta property="twitter:title" content="${title}" />
    <meta property="twitter:description" content="${description}" />
    <meta property="twitter:image" content="${finalImage}" />

    <!-- Redirect script -->
    <script>
        window.location.href = "${productUrl}";
    </script>
</head>
<body>
    <p>Redirecting to ${product.title}...</p>
</body>
</html>
        `;

        res.send(html);

    } catch (error) {
        console.error('Share Error:', error);
        res.redirect('https://www.coolcache.app');
    }
});

module.exports = router;
