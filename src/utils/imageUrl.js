const IMAGE_BASE_URL = (import.meta.env.VITE_IMAGE_BASE_URL || window.__APP_CONFIG__?.IMAGE_BASE_URL || '').replace(/\/$/, '');

export function getImageBaseUrl() {
  return IMAGE_BASE_URL;
}

export function getImageUrl(path, options = {}) {
  const fallback = `${window.location.origin}/og-image.jpg`;
  if (!path) return fallback;
  const s = String(path).trim();

  // Cloudinary Optimization
  if (s.includes('res.cloudinary.com')) {
    // Split key depends on upload type, but usually it's /upload/
    const parts = s.split('/upload/');
    if (parts.length === 2) {
      let transforms = [];
      // Default optimization
      if (!s.includes('f_auto')) transforms.push('f_auto');
      if (!s.includes('q_auto')) transforms.push('q_auto');

      // Resizing
      if (options.width) transforms.push(`w_${options.width}`);
      if (options.height) transforms.push(`h_${options.height}`);
      if (options.crop) transforms.push(`c_${options.crop}`); // e.g., 'fill' or 'scale'

      // If existing url has params between upload/ and vSomething/, we might need to handle that, 
      // but usually we can prepend ours. Cloudinary processes sequentially.
      // Ideally, we inject right after /upload/.

      const transformStr = transforms.join(',');
      if (transformStr) {
        return `${parts[0]}/upload/${transformStr}/${parts[1]}`;
      }
    }
  }

  if (/^https?:\/\//i.test(s)) return s; // absolute

  // if base empty, just return path as-is with leading slash
  const base = IMAGE_BASE_URL || '';
  if (s.startsWith('/images/')) return base ? `${base}${s}` : s;
  return base ? `${base}${s.startsWith('/') ? '' : '/'}${s}` : (s.startsWith('/') ? s : `/${s}`);
}

export default getImageUrl;
