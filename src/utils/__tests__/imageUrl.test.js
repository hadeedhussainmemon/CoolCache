import { beforeEach, describe, expect, it } from 'vitest';

beforeEach(() => {
  vi.unstubAllEnvs();
});

describe('getImageUrl util', () => {
  it('returns absolute URLs unchanged', async () => {
    vi.stubEnv('NEXT_PUBLIC_IMAGE_BASE_URL', 'http://localhost:5000/images');
    const { getImageUrl } = await import('../imageUrl');
    const url = 'https://example.com/foo.png';
    expect(getImageUrl(url)).toBe(url);
  });

  it('prepends the base URL when path starts with /products', async () => {
    vi.stubEnv('NEXT_PUBLIC_IMAGE_BASE_URL', 'http://localhost:5000/images');
    const { getImageUrl } = await import('../imageUrl');
    const path = '/products/bracelet/foo.avif';
    // Current imageUrl logic prepends base if it starts with /products
    // Wait, imageUrl.js line 43: return base ? `${base}${s.startsWith('/') ? '' : '/'}${s}` : ...
    expect(getImageUrl(path)).toBe('http://localhost:5000/images/products/bracelet/foo.avif');
  });

  it('handles relative paths without leading slash', async () => {
    vi.stubEnv('NEXT_PUBLIC_IMAGE_BASE_URL', 'http://localhost:5000/images');
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
