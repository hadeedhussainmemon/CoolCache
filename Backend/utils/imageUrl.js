const getImageUrl = (path) => {
    // Fallback for missing path
    if (!path) return 'https://www.coolcache.app/og-image.jpg';

    const s = String(path).trim();
    const IMAGE_BASE_URL = (process.env.IMAGE_BASE_URL || '').replace(/\/$/, '');

    // 1. Check for Cloudinary URLs and optimize
    if (s.includes('res.cloudinary.com')) {
        // If already optimized, skip
        if (s.includes('f_auto') || s.includes('q_auto')) return s;
        // Inject optimization params after /upload/
        return s.replace('/upload/', '/upload/f_auto,q_auto/');
    }

    // 2. Check if absolute URL
    if (/^https?:\/\//i.test(s)) return s;

    // 3. Handle relative paths
    // If base empty, just return path as-is with leading slash (or relative if intended, but usually absolute path for web)
    const base = IMAGE_BASE_URL || '';

    // If it starts with /images/ and base is set, append
    if (s.startsWith('/images/')) return base ? `${base}${s}` : s;

    // Default formatting
    return base ? `${base}${s.startsWith('/') ? '' : '/'}${s}` : (s.startsWith('/') ? s : `/${s}`);
};

module.exports = getImageUrl;
