'use client';

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import Hero from '@/components/Hero/Hero';
import ProductCard from '@/components/ProductCard/ProductCard';
import ProductCardSkeleton from '@/components/Skeletons/ProductCardSkeleton';
import CategoryGrid from '@/components/Category/CategoryGrid';
import LazyMount from '@/components/utility/LazyMount';

const Reviews = lazy(() => import('@/components/Reviews/Reviews'));
const FAQ = lazy(() => import('@/components/FAQ/FAQ'));
const RecommendedProducts = lazy(() => import('@/components/Recommendations/RecommendedProducts'));
const RecentlyViewed = lazy(() => import('@/components/RecentlyViewed/RecentlyViewed'));

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const API_PRODUCTS_ENDPOINT = '/api/products';

const PROMOS = [
    "🚚 Free Shipping on Orders Over Rs. 4999",
    "✨ New Arrivals: Check out our latest collection!",
    "🎁 Buy 2 Get 5% Off - Limited Time Offer!"
];

const fetchProductsQuery = async ({ queryKey }) => {
    const [_, { category, sort, q, page, pageSize }] = queryKey;
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (q) params.append('q', q);
    if (sort) params.append('sort', sort);
    params.append('page', page);
    params.append('pageSize', pageSize);

    const response = await fetch(`${API_BASE_URL}${API_PRODUCTS_ENDPOINT}?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
};

const fetchCategoriesQuery = async () => {
    const res = await fetch(`${API_BASE_URL}${API_PRODUCTS_ENDPOINT}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
};

export default function StoreHomePage() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortOption, setSortOption] = useState('featured');
    const [currentPage, setCurrentPage] = useState(1);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const pageSize = 24;
    const [activePromo, setActivePromo] = useState(0);

    const { data: categoryData } = useQuery({
        queryKey: ['categories'],
        queryFn: fetchCategoriesQuery,
        staleTime: 1000 * 60 * 60,
    });

    const categories = ['All', ...(categoryData?.categories?.map(c => typeof c === 'string' ? c : c.name) || [])];

    useEffect(() => {
        const interval = setInterval(() => {
            setActivePromo((prev) => (prev + 1) % PROMOS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, sortOption]);

    const { data, isLoading, isError, error, isPlaceholderData } = useQuery({
        queryKey: ['products', {
            category: selectedCategory === 'All' ? '' : selectedCategory,
            sort: sortOption,
            q: debouncedQuery,
            page: currentPage,
            pageSize
        }],
        queryFn: fetchProductsQuery,
        placeholderData: keepPreviousData,
    });

    const products = data?.products || [];
    const totalProducts = data?.total || 0;
    const totalPages = Math.ceil(totalProducts / pageSize);
    const soldOutCount = products.filter(p => p?.stock === 0).length;

    const handlePageChange = (p) => {
        if (p >= 1 && p <= totalPages) {
            setCurrentPage(p);
            const el = document.getElementById('products');
            if (el) {
                const offset = 80;
                const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        }
    };

    return (
        <main id="main-content">
            <Hero />
            <CategoryGrid />

            <div id="recommendations">
                <LazyMount>
                    <Suspense fallback={<div className="p-8 text-center text-gray-600">Loading recommendations…</div>}>
                        <RecommendedProducts />
                    </Suspense>
                </LazyMount>
            </div>

            <div id="recently-viewed">
                <LazyMount>
                    <Suspense fallback={null}>
                        <RecentlyViewed />
                    </Suspense>
                </LazyMount>
            </div>

            <section id="products" className="py-16 bg-gradient-to-b from-gray-50/50 to-white">
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3 overflow-hidden mb-8">
                    <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                        <div className="flex items-center gap-2 animate-fade-in-up">
                            <span className="text-xl">✨</span>
                            <p className="font-medium text-sm md:text-base tracking-wide">{PROMOS[activePromo]}</p>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                        <h2 className="text-4xl md:text-5xl font-playfair font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-3 animate-gradient">
                            All Products
                        </h2>
                        <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-500 mx-auto rounded-full mb-4"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 px-4 py-4 bg-gradient-to-br from-white/90 to-purple-50/60 backdrop-blur-xl rounded-3xl border border-white/40 shadow-xl shadow-purple-100/50">
                        <div className="w-full">
                            <label className="block text-xs font-semibold text-gray-700 mb-2">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="block w-full pl-4 pr-10 py-3 rounded-2xl bg-white/80 border border-purple-200/50 focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="w-full">
                            <label className="block text-xs font-semibold text-gray-700 mb-2">Sort by</label>
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="block w-full pl-4 pr-10 py-3 rounded-2xl bg-white/80 border border-purple-200/50 focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                <option value="featured">Featured</option>
                                <option value="priceAsc">Price: Low to High</option>
                                <option value="priceDesc">Price: High to Low</option>
                            </select>
                        </div>
                        <div className="w-full relative md:self-end">
                            <label className="block text-xs font-semibold text-gray-700 mb-2">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 rounded-2xl bg-white/80 border border-purple-200/50 focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {isError ? (
                        <div className="text-center py-12">
                            <p className="text-red-600 mb-4">{error?.message || "Error loading products"}</p>
                            <button onClick={() => window.location.reload()} className="px-6 py-2 bg-purple-600 text-white rounded-lg">Try Again</button>
                        </div>
                    ) : isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                            {[...Array(8)].map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-16 text-gray-500">
                            No products found.
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-4 px-2 text-sm text-gray-600">
                                <span>Showing {totalProducts} products</span>
                                {soldOutCount > 0 && <span className="bg-gray-100 px-2 py-0.5 rounded-full text-xs">Sold out: {soldOutCount}</span>}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                {products.map((p, i) => (
                                    <div key={`${p.id}-${i}`} className="animate-stagger-item h-full">
                                        <ProductCard product={p} priority={i < 4} />
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex justify-center mt-8 gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1 || isPlaceholderData}
                                        className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
                                    >
                                        Prev
                                    </button>
                                    <span className="flex items-center px-4 font-medium">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages || isPlaceholderData}
                                        className="px-4 py-2 bg-white border rounded-lg disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            <div id="reviews">
                <LazyMount><Suspense fallback={null}><Reviews /></Suspense></LazyMount>
            </div>
            <div id="faq">
                <LazyMount><Suspense fallback={null}><FAQ /></Suspense></LazyMount>
            </div>
        </main>
    );
}
