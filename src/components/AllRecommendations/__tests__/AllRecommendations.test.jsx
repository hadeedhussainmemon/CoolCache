import { describe, beforeEach, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import AllRecommendations from '../AllRecommendations';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn());
  vi.mock('next/navigation', () => ({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      prefetch: vi.fn(),
    }),
  }));
});

describe('AllRecommendations', () => {
  it('shows list of products when history present', async () => {
    // Seed view history with a product with a category 'Bracelet'
    localStorage.setItem('coolcacheViewHistory', JSON.stringify([{ id: 1, category: ['Bracelet'], title: 'Seed' }]));

    // Stub fetch for category-based requests; return { products: [{ id: 2, title: 'Rec 1', image: '/products/1.png' }] }
    vi.mocked(fetch).mockImplementation((url) => {
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ products: [{ id: 2, title: 'Rec 1', image: '/products/1.png' }] }) });
    });

    render(
      <AllRecommendations />
    );

    await waitFor(() => expect(screen.getByText('Recommended for You')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Rec 1')).toBeInTheDocument());
  });
});
