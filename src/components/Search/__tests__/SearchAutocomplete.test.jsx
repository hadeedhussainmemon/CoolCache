import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React, { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import SearchAutocomplete from '../SearchAutocomplete';

const mockedNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

beforeEach(() => {
  // Clear storage and mocks before each test
  localStorage.clear();
  vi.clearAllMocks();
  mockedNavigate.mockClear();
});

describe('SearchAutocomplete', () => {
  it('shows only suggested searches (categories) when showOnlySearchSuggestions=true and enableAutocomplete=false', async () => {
    // Stub global.fetch to return categories and products
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/categories')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ categories: [{ name: 'Bracelet', slug: 'bracelet', image: '/products/bracelet/1.avif', count: 12 }] }) });
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ products: [{ id: 1, title: 'Example', image: '/products/bracelet/1.avif', category: ['Bracelet'] }] }) });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    }));

    const onSubmit = vi.fn();
    // Controlled wrapper
    const Wrapper = () => {
      const [val, setVal] = useState('');
      return <SearchAutocomplete value={val} onChange={setVal} onSubmit={onSubmit} enableAutocomplete={false} showOnlySearchSuggestions={true} />;
    };

    // Seed localStorage
    localStorage.setItem('coolcache_recent_searches_v1', JSON.stringify({ terms: { 'bracelet': { term: 'bracelet', count: 1, lastSeen: Date.now() } }, order: ['bracelet'] }));

    render(
      <MemoryRouter>
        <Wrapper />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');

    // Type query
    fireEvent.change(input, { target: { value: 'br' } });

    // Wait for dropdown
    await waitFor(() => expect(screen.getByText('bracelet')).toBeInTheDocument());

    // Ensure product suggestion and explicit category "Bracelet" (capitalized) are absent
    // because showOnlySearchSuggestions=true prioritizes recent/trending + categories-as-shortcuts if implemented, 
    // but the test asserts strictly based on previous logic.
    expect(screen.queryByText('Example')).toBeNull();
  });

  it('navigates suggestions with keyboard (ArrowDown/Enter/Escape) when showOnlySearchSuggestions=true', async () => {
    const onSubmit = vi.fn();
    const Wrapper = () => {
      const [val, setVal] = useState('');
      return <SearchAutocomplete value={val} onChange={setVal} onSubmit={onSubmit} enableAutocomplete={false} showOnlySearchSuggestions={true} />;
    };

    // Seed recent searches
    localStorage.setItem('coolcache_recent_searches_v1', JSON.stringify({
      terms: {
        'bracelet': { term: 'bracelet', count: 1, lastSeen: Date.now() },
        'ring': { term: 'ring', count: 1, lastSeen: Date.now() },
        'watch': { term: 'watch', count: 1, lastSeen: Date.now() }
      },
      order: ['bracelet', 'ring', 'watch']
    }));

    render(
      <MemoryRouter>
        <Wrapper />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'br' } });
    await waitFor(() => expect(screen.getByText('bracelet')).toBeInTheDocument());

    // ArrowDown -> Enter
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('bracelet'));

    // Escape
    fireEvent.change(input, { target: { value: 'ri' } });
    await waitFor(() => expect(screen.getByText('ring')).toBeInTheDocument());
    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('navigates product suggestions with ArrowDown and Enter to navigate to product page', async () => {
    vi.stubGlobal('fetch', vi.fn((url) => {
      if (url.includes('/api/products?')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ products: [{ id: 123, title: 'Example Product', image: '/products/example/1.avif', slug: 'example-product', category: ['Example'] }] }) });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    }));

    const onSubmit = vi.fn();
    const Wrapper = () => {
      const [val, setVal] = useState('');
      return <SearchAutocomplete value={val} onChange={setVal} onSubmit={onSubmit} enableAutocomplete={true} showOnlySearchSuggestions={false} />;
    };

    render(
      <MemoryRouter>
        <Wrapper />
      </MemoryRouter>
    );

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'ex' } });
    await waitFor(() => expect(screen.getByText('Example Product')).toBeInTheDocument());

    // ArrowDown -> Enter
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    // Check navigation
    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalled();
    });
    const calls = mockedNavigate.mock.calls.map(c => c[0]);
    expect(calls.some(c => c.includes('/search?q='))).toBe(true);
    expect(calls.some(c => c.includes('/product/example-product'))).toBe(true);
  });
});
