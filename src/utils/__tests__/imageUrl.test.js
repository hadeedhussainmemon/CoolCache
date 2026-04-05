import { beforeEach, describe, expect, it } from 'vitest';

beforeEach(() => {
  // Reset any config
  delete window.__APP_CONFIG__;
});

describe('getImageUrl util', () => {
  it('returns absolute URLs unchanged', async () => {
    // Import dynamically so we can mutate window before module runs
    window.__APP_CONFIG__ = { IMAGE_BASE_URL: 'http://localhost:5000/images' };
    const { getImageUrl } = await import('../imageUrl');
    const url = 'https://example.com/foo.png';
    expect(getImageUrl(url)).toBe(url);
  });

  it('prepends the base URL when path starts with /products', async () => {
    window.__APP_CONFIG__ = { IMAGE_BASE_URL: 'http://localhost:5000/images' };
    const { getImageUrl } = await import('../imageUrl');
    const path = '/products/bracelet/foo.avif';
    expect(getImageUrl(path)).toBe('http://localhost:5000/images/products/bracelet/foo.avif');
  });

  it('handles relative paths without leading slash', async () => {
    window.__APP_CONFIG__ = { IMAGE_BASE_URL: 'http://localhost:5000/images' };
    const { getImageUrl } = await import('../imageUrl');
    const path = 'products/bracelet/foo.avif';
    expect(getImageUrl(path)).toBe('http://localhost:5000/images/products/bracelet/foo.avif');
  });

  it('returns fallback when path is falsy', async () => {
    const { getImageUrl } = await import('../imageUrl');
    const fallback = getImageUrl(null);
    expect(fallback.endsWith('/og-image.jpg')).toBe(true);
  });
});
