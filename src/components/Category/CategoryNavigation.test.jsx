import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import App from '../../App';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock scrollTo to prevent JSDOM errors
window.scrollTo = vi.fn();

// Mock dependencies that might cause issues or network requests
vi.mock('../../utils/productCache', () => ({
    fetchProducts: vi.fn().mockResolvedValue({
        products: [
            { id: 1, title: 'Test Product', price: 100, category: 'Watch', stock: 5 }
        ],
        total: 1
    })
}));

describe('Navigation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('navigates from home to category page without crashing', async () => {
        // We start at home
        render(
            <MemoryRouter initialEntries={['/']}>
                <App />
            </MemoryRouter>
        );

        // Check we are on home page
        expect(await screen.findByText(/All Products/i)).toBeInTheDocument();

        // Find a link to a category (e.g. Watches from the quick links or navbar)
        // The navbar usually has "Categories" or specific category links.
        // Based on Navbar.jsx, we have quick links like "Watches".
        const watchLink = screen.getAllByText(/Watches/i)[0]; // Navigate to Watches

        // Click navigation
        fireEvent.click(watchLink);

        // Wait for the new page content
        // CategoryPage displays the category name as title
        // "Watch" -> "Watch" or "Watches"
        expect(await screen.findByText('Watch')).toBeInTheDocument();

        // Ensure "All Products" (Home specific) is gone
        await waitFor(() => {
            expect(screen.queryByText('All Products')).not.toBeInTheDocument();
        });
    });
});
