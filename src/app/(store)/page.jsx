'use client';

import React, { useState, useEffect, Suspense, lazy, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronDown, Filter, X } from 'lucide-react';
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

const fetchAllProducts = async () => {
    const response = await fetch(`${API_BASE_URL}${API_PRODUCTS_ENDPOINT}`);
    if (!response.ok) throw new Error('Failed to synchronize archive');
    return response.json();
};

export default function StoreHomePage() {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortOption, setSortOption] = useState('featured');
    const [searchQuery, setSearchQuery] = useState('');
    const [visibleCount, setVisibleCount] = useState(24);
    
    // Custom Dropdown States
    const [isCatOpen, setIsCatOpen] = useState(false);
    const [isSortOpen, setIsSortOpen] = useState(false);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['products', 'all'],
        queryFn: fetchAllProducts,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const allProducts = data?.products || [];
    
    // Dynamic Categories from Data
    const categories = useMemo(() => {
        const cats = new Set(['All']);
        allProducts.forEach(p => {
            if (Array.isArray(p.category)) p.category.forEach(c => cats.add(c));
            else if (p.category) cats.add(p.category);
        });
        return Array.from(cats);
    }, [allProducts]);

    // Instant Client-Side Filter & Sort
    const filteredProducts = useMemo(() => {
        let result = [...allProducts];

        // 1. Category Filter
        if (selectedCategory !== 'All') {
            result = result.filter(p => {
                const cats = Array.isArray(p.category) ? p.category : [p.category];
                return cats.includes(selectedCategory);
            });
        }

        // 2. Search Filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(p => 
                p.title?.toLowerCase().includes(q) || 
                p.description?.toLowerCase().includes(q) ||
                (Array.isArray(p.category) ? p.category.join(' ') : p.category)?.toLowerCase().includes(q)
            );
        }

        // 3. Sorting
        if (sortOption === 'priceAsc') result.sort((a, b) => a.price - b.price);
        else if (sortOption === 'priceDesc') result.sort((a, b) => b.price - a.price);
        else if (sortOption === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        // 'featured' logic could be added here based on trending or stock
        
        return result;
    }, [allProducts, selectedCategory, searchQuery, sortOption]);

    const displayedProducts = filteredProducts.slice(0, visibleCount);
    const hasMore = visibleCount < filteredProducts.length;

    const loadMore = () => setVisibleCount(prev => prev + 24);

    return (
        <main id="main-content" className="bg-white">
            <Hero />
            <CategoryGrid />

            <section id="archive" className="py-24 bg-[#faf9f6]">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    
                    {/* Header Section */}
                    <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                        <div className="animate-luxury-in">
                            <span className="text-luxury-gold font-sans tracking-[0.4em] uppercase text-[10px] mb-4 block font-bold">
                                The Collection Archive
                            </span>
                            <h2 className="text-5xl font-serif font-bold text-luxury-black">
                                Curated <span className="italic text-luxury-gold font-light">Elegance</span>
                            </h2>
                        </div>
                        <div className="text-[11px] uppercase tracking-widest text-stone-400 font-bold hidden md:block">
                            {filteredProducts.length} Pieces Synchronized
                        </div>
                    </div>

                    {/* Sophisticated Filter Bar */}
                    <div className="flex flex-col lg:flex-row gap-6 mb-16 items-center">
                        {/* Search Input */}
                        <div className="relative flex-grow w-full lg:w-auto overflow-hidden group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 group-hover:text-luxury-gold transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Search the archive..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-stone-100 py-5 pl-16 pr-6 text-sm focus:border-luxury-gold outline-none transition-all duration-500 font-serif italic"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-6 top-1/2 -translate-y-1/2 text-stone-300 hover:text-luxury-black">
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Custom Dropdowns Container */}
                        <div className="flex gap-4 w-full lg:w-auto">
                            {/* Category Dropdown */}
                            <div className="relative flex-1 lg:w-56">
                                <button 
                                    onClick={() => { setIsCatOpen(!isCatOpen); setIsSortOpen(false); }}
                                    className="w-full bg-white border border-stone-100 px-8 py-5 text-[10px] uppercase tracking-widest font-bold flex justify-between items-center group hover:border-luxury-gold transition-colors"
                                >
                                    <span>{selectedCategory}</span>
                                    <ChevronDown size={14} className={`transition-transform duration-500 ${isCatOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isCatOpen && (
                                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-stone-100 mt-2 shadow-2xl animate-luxury-in overflow-hidden max-h-72 overflow-y-auto custom-scrollbar">
                                        {categories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => { setSelectedCategory(cat); setIsCatOpen(false); setVisibleCount(24); }}
                                                className={`w-full text-left px-8 py-4 text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors ${selectedCategory === cat ? 'text-luxury-gold bg-stone-50' : 'text-stone-600'}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative flex-1 lg:w-56">
                                <button 
                                    onClick={() => { setIsSortOpen(!isSortOpen); setIsCatOpen(false); }}
                                    className="w-full bg-white border border-stone-100 px-8 py-5 text-[10px] uppercase tracking-widest font-bold flex justify-between items-center group hover:border-luxury-gold transition-colors"
                                >
                                    <span>{sortOption === 'featured' ? 'Featured' : sortOption === 'priceAsc' ? 'Price: Low' : sortOption === 'priceDesc' ? 'Price: High' : 'Newest'}</span>
                                    <ChevronDown size={14} className={`transition-transform duration-500 ${isSortOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isSortOpen && (
                                    <div className="absolute top-full left-0 right-0 z-50 bg-white border border-stone-100 mt-2 shadow-2xl animate-luxury-in">
                                        {[
                                            { id: 'featured', label: 'Featured Selection' },
                                            { id: 'newest', label: 'Newest Arrivals' },
                                            { id: 'priceAsc', label: 'Price: Low to High' },
                                            { id: 'priceDesc', label: 'Price: High to Low' }
                                        ].map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => { setSortOption(opt.id); setIsSortOpen(false); }}
                                                className={`w-full text-left px-8 py-4 text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors ${sortOption === opt.id ? 'text-luxury-gold bg-stone-50' : 'text-stone-600'}`}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    {isError ? (
                        <div className="text-center py-32 border border-stone-100 bg-white">
                            <p className="text-stone-500 font-serif italic mb-8">Unable to synchronize pieces at this time.</p>
                            <button onClick={() => window.location.reload()} className="bg-luxury-black text-white px-10 py-4 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-luxury-gold transition-colors shadow-xl">
                                Retry Archive
                            </button>
                        </div>
                    ) : isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                            {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-40 bg-white border border-stone-50">
                            <Filter size={32} className="mx-auto text-stone-200 mb-6" />
                            <p className="text-stone-400 font-serif italic text-lg tracking-wide underline underline-offset-8 decoration-stone-100">
                                No matches found in our current archive.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
                                {displayedProducts.map((p, i) => (
                                    <div key={`${p.id}-${i}`} className="animate-luxury-in" style={{ animationDelay: `${(i % 8) * 0.1}s` }}>
                                        <ProductCard product={p} priority={i < 8} />
                                    </div>
                                ))}
                            </div>

                            {/* Load More Action */}
                            {hasMore && (
                                <div className="mt-32 flex flex-col items-center">
                                    <div className="w-px h-24 bg-stone-100 mb-12"></div>
                                    <button 
                                        onClick={loadMore}
                                        className="relative group text-[10px] uppercase tracking-[0.4em] font-bold py-6 px-16 border border-stone-200 hover:border-luxury-black transition-all duration-700 overflow-hidden"
                                    >
                                        <span className="relative z-10">Expand Selection</span>
                                        <div className="absolute inset-0 bg-stone-50 -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>

            {/* Supplementary Sections */}
            <LazyMount><Suspense fallback={null}><RecommendedProducts /></Suspense></LazyMount>
            <LazyMount><Suspense fallback={null}><RecentlyViewed /></Suspense></LazyMount>
            <LazyMount><Suspense fallback={null}><Reviews /></Suspense></LazyMount>
            <LazyMount><Suspense fallback={null}><FAQ /></Suspense></LazyMount>
        </main>
    );
}
