'use client';
import React, { useState, useEffect } from 'react';
import ProductCard from '../ProductCard/ProductCard';

const RecentlyViewed = () => {
    const [recentProducts, setRecentProducts] = useState([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            // Parse history from existing localStorage key
            const history = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('coolcacheViewHistory') || '[]') : [];

            // We only have basic info in history (id, title, category) plus maybe image/price if stored
            // But typically RecommendedProducts stored: { id, title, category, viewedAt }
            // Ideally we need full product data to render the card.
            // Since we don't want to fetch individual products one by one, we can:
            // 1. Check if we have enough data in history. 
            // 2. Or better, fetch details for these IDs.

            // Let's assume for now we might need to fetch them if the history object is thin.
            // However, looking at RecommendedProducts.jsx, it pushes: { id, title, category, viewedAt }
            // This is missing image and price which are critical for the card.

            // STRATEGY: Fetch all products and filter by ID. 
            // This is efficient enough for client-side given < 1000 items usually, 
            // or we can hit an endpoint like /api/products?ids=... if it exists.
            // Given the current API structure, let's fetch 'featured' or just all to match IDs.
            // A cleaner way is to fetch the specific IDs if possible, but let's try to find them in a general fetch
            // or rely on a "get by ids" if we implemented it. 
            // Let's stick to client-side filtering from a general fetch for simplicity if list is small,
            // OR update the `useTrackProductView` in RecommendedProducts to store MORE data so we don't need a fetch.
            // But we can't change existing localStorage data easily.

            // Let's try fetching the products corresponding to the IDs.
            if (history.length > 0) {
                const ids = history.map(h => h.id).slice(0, 8); // Top 8 recent
                if (ids.length === 0) return;

                // Fetch all products to find matches (simplest given current API)
                // Optimization: In a real large app, we'd want an endpoint /api/products/batch?ids=1,2,3
                const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
                fetch(`${API_BASE_URL}/api/products?limit=1000`)
                    .then(res => res.json())
                    .then(data => {
                        const all = Array.isArray(data) ? data : data.products || [];
                        // Map history IDs to full product objects preserving order
                        const found = ids.map(id => all.find(p => p.id == id)).filter(Boolean);
                        // Remove duplicates just in case
                        const unique = [];
                        const seen = new Set();
                        found.forEach(p => {
                            if (!seen.has(p.id)) {
                                seen.add(p.id);
                                unique.push(p);
                            }
                        });
                        setRecentProducts(unique);
                    })
                    .catch(err => console.error("Failed to load recent products", err));
            }
        } catch (e) {
            console.error(e);
        }
    }, []);

    if (!mounted || recentProducts.length === 0) return null;

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Recently Viewed</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {recentProducts.map(product => (
                    <ProductCard key={product.id} {...product} />
                ))}
            </div>
        </section>
    );
};

export default RecentlyViewed;
