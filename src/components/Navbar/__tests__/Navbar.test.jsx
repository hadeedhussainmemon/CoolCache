import { it, expect, describe, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../Navbar';

const mockedPush = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockedPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('Navbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  it('contains Search link to /search', () => {
    render(
      <Navbar />
    );

    const searchLink = screen.getByText(/Search/i);
    expect(searchLink).toBeInTheDocument();
    expect(searchLink.closest('a')).toHaveAttribute('href', '/search');
  });

  it('responds to Ctrl/Cmd+K keyboard shortcut to navigate to /search', () => {
    render(
      <Navbar />
    );

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(mockedPush).toHaveBeenCalledWith('/search');
  });
});
