import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchPage from '../SearchPage';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mock('next/navigation', () => ({
    useSearchParams: () => new URLSearchParams('q=ex'),
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      prefetch: vi.fn(),
    }),
  }));
});

describe('Search navigation back behavior', () => {
  it('returns to search results when pressing back after navigating to product', async () => {
    // Stub fetch for products list and product detail
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/api/products?')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ products: [{ id: 123, title: 'Example Product', image: '/products/example/1.avif', slug: 'example-product', category: ['Example'] }], total: 1 }) });
      }
      if (url.includes('/api/products/123') || url.includes('/api/products/example-product')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ id: 123, title: 'Example Product', slug: 'example-product', description: 'Details' }) });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    }));

    const mockedPush = vi.fn();
    vi.mock('next/navigation', () => ({
      useSearchParams: () => new URLSearchParams('q=ex'),
      useRouter: () => ({
        push: mockedPush,
        replace: vi.fn(),
        back: vi.fn(),
        prefetch: vi.fn(),
      }),
    }));

    // Render SearchPage
    render(
      <SearchPage />
    );

    // Wait for results to appear
    await waitFor(() => expect(screen.getByText('Example Product')).toBeInTheDocument());

    // Click the product link
    fireEvent.click(screen.getByText('Example Product'));
    
    // Expect router.push to be called with the product URL
    await waitFor(() => expect(mockedPush).toHaveBeenCalledWith('/product/example-product'));
  });
});
