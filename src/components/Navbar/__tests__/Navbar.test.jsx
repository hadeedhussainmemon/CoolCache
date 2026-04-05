import { it, expect, describe, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from '../Navbar';

describe('Navbar', () => {
  it('contains Search link to /search', () => {
    render(
      <Router>
        <Navbar />
      </Router>
    );

    const searchLink = screen.getByText(/Search/i);
    expect(searchLink).toBeInTheDocument();
    expect(searchLink.closest('a')).toHaveAttribute('href', '/search');
  });

  it('responds to Ctrl/Cmd+K keyboard shortcut to navigate to /search', () => {
    // Mock useNavigate to capture navigation
    const mockedNavigate = vi.fn();
    const rr = require('react-router-dom');
    vi.spyOn(rr, 'useNavigate').mockImplementation(() => mockedNavigate);
    render(
      <Router>
        <Navbar />
      </Router>
    );

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    expect(mockedNavigate).toHaveBeenCalledWith('/search');
    vi.restoreAllMocks();
  });
});
