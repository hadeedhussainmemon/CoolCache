import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SearchPage from '../SearchPage';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('SearchPage pagination', () => {
  it('fetches page size 30 and shows pagination controls', async () => {
    const products = Array.from({ length: 30 }).map((_, i) => ({ id: i + 1, title: `P${i + 1}`, image: '/products/foo.png' }));
    const res = { products, total: 65, page: 1, pageSize: 30 };
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(res) });

    render(
      <MemoryRouter initialEntries={["/search?q=test"]}>
        <SearchPage />
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText('Page 1 of 3')).toBeInTheDocument());
    const next = screen.getByText(/Next/);
    expect(next).toBeInTheDocument();
    // mock scrollIntoView on elements
    const orig = Element.prototype.scrollIntoView;
    const spyScroll = vi.fn();
    Element.prototype.scrollIntoView = spyScroll;

    fireEvent.click(next);
    await waitFor(() => expect(fetch).toHaveBeenLastCalledWith(expect.stringContaining('page=2')));
    // Ensure we scrolled to results
    await waitFor(() => expect(spyScroll).toHaveBeenCalled());
    Element.prototype.scrollIntoView = orig;
  });
});
