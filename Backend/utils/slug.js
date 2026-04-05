function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function productSlug(product) {
  const titleSlug = slugify(product.title || product.name || 'product');
  return `${titleSlug}-${product.id}`;
}

module.exports = { slugify, productSlug };
