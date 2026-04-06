const IMAGE_BASE_URL = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '').replace(/\/$/, '');

export function getImageBaseUrl() {
  return IMAGE_BASE_URL;
}

export function getImageUrl(path, options = {}) {
  const fallback = typeof window !== 'undefined' ? `${window.location.origin}/og-image.jpg` : '/og-image.jpg';
  
  if (!path) return fallback;

  // Debug: catch [object Object] origins
  if (typeof path === 'object' || (typeof path === 'string' && path.includes('[object Object]'))) {
    console.warn('⚠️ getImageUrl detected object or stringified object:', path);
    // Try to extract a URL property if it's an object
    if (path && typeof path === 'object') {
      if (path.url) return getImageUrl(path.url, options);
      if (path.secure_url) return getImageUrl(path.secure_url, options);
      if (path.src) return getImageUrl(path.src, options);
    }
    return fallback;
  }

  const s = String(path).trim();
  if (s === 'undefined' || s === 'null' || s === '') return fallback;

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
