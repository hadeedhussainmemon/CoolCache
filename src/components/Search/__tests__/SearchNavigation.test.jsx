import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SearchPage from '../SearchPage';
import ProductDetail from '../../ProductDetail/ProductDetail';

beforeEach(() => {
  vi.restoreAllMocks();
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

    // Render app with routes for search and product detail
    render(
      <MemoryRouter initialEntries={["/search?q=ex"]}>
        <Routes>
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for results to appear
    await waitFor(() => expect(screen.getByText('Example Product')).toBeInTheDocument());

    // Click the product link (should route to product detail)
    fireEvent.click(screen.getByText('Example Product'));
    await waitFor(() => expect(screen.getByText('Details')).toBeInTheDocument());

    // Simulate back
    window.history.back();
    await waitFor(() => expect(screen.getByText('Example Product')).toBeInTheDocument());
  });
});
