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

            <section id="products" className="py-20 bg-[#fefcf9]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Luxury Header */}
                    <div className="text-center mb-16 animate-luxury-in">
                        <span className="text-luxury-gold font-sans tracking-[0.3em] uppercase text-xs mb-4 block">Curated Collection</span>
                        <h2 className="text-5xl md:text-6xl font-serif font-bold text-luxury-black mb-6">
                            The Collection
                        </h2>
                        <div className="w-16 h-[1px] bg-luxury-gold mx-auto"></div>
                    </div>

                    {/* Sophisticated Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 p-8 bg-white border border-stone-100 shadow-sm rounded-sm">
                        <div className="w-full">
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="block w-full px-0 py-2 bg-transparent border-b border-stone-200 focus:border-luxury-gold outline-none text-sm transition-colors cursor-pointer"
                            >
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="w-full">
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3">Sort by</label>
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="block w-full px-0 py-2 bg-transparent border-b border-stone-200 focus:border-luxury-gold outline-none text-sm transition-colors cursor-pointer"
                            >
                                <option value="featured">Featured Selection</option>
                                <option value="priceAsc">Price: Low to High</option>
                                <option value="priceDesc">Price: High to Low</option>
                            </select>
                        </div>
                        <div className="w-full relative">
                            <label className="block text-[10px] uppercase tracking-widest font-bold text-stone-400 mb-3">Search</label>
                            <div className="relative">
                                <Search className="absolute right-0 top-2 text-stone-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Search the archive..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="block w-full px-0 py-2 bg-transparent border-b border-stone-200 focus:border-luxury-gold outline-none text-sm transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {isError ? (
                        <div className="text-center py-20 border border-red-50 bg-red-50/10">
                            <p className="text-stone-600 mb-6 font-serif italic">{error?.message || "An error occurred while curating the products."}</p>
                            <button onClick={() => window.location.reload()} className="px-8 py-3 bg-luxury-black text-white text-xs uppercase tracking-widest hover:bg-luxury-gold transition-colors">
                                Refresh Archive
                            </button>
                        </div>
                    ) : isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {[...Array(8)].map((_, i) => (
                                <ProductCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-32 border border-stone-100">
                            <p className="text-stone-400 font-serif italic text-lg">No pieces found in the current selection.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-8 text-[11px] uppercase tracking-widest text-stone-500 font-bold">
                                <span>{totalProducts} Distinct Pieces</span>
                                {soldOutCount > 0 && <span className="text-stone-300">Archived: {soldOutCount}</span>}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
                                {products.map((p, i) => (
                                    <div key={`${p.id}-${i}`} className="animate-luxury-in" style={{ animationDelay: `${i * 0.05}s` }}>
                                        <ProductCard product={p} priority={i < 4} />
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="flex justify-center items-center mt-20 gap-8">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1 || isPlaceholderData}
                                        className="text-[11px] uppercase tracking-[0.2em] font-bold disabled:opacity-20 hover:text-luxury-gold transition-colors"
                                    >
                                        Back
                                    </button>
                                    <div className="h-[1px] w-12 bg-stone-200"></div>
                                    <span className="text-[11px] font-bold tracking-widest">
                                        {currentPage} / {totalPages}
                                    </span>
                                    <div className="h-[1px] w-12 bg-stone-200"></div>
                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages || isPlaceholderData}
                                        className="text-[11px] uppercase tracking-[0.2em] font-bold disabled:opacity-20 hover:text-luxury-gold transition-colors"
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
