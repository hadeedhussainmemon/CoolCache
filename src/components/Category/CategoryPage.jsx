'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '../ProductCard/ProductCard';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import ProductCardSkeleton from '../Skeletons/ProductCardSkeleton';

// Helper for query key
const fetchProductsQuery = async ({ queryKey }) => {
  const [_, { category, sort, q, page, pageSize }] = queryKey;

  // Construct URL
  const params = new URLSearchParams();
  if (category && category !== 'All') params.append('category', category);
  if (q) params.append('q', q);
  if (sort) params.append('sort', sort);
  params.append('page', page);
  params.append('pageSize', pageSize || 24);

  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  const baseUrl = (process.env.NEXT_PUBLIC_API_PRODUCTS || '/api/products');

  const response = await fetch(`${API_BASE_URL}${baseUrl}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
};

const ALIAS_SLUGS = [
  'girls-accessories',
  'boys-accessories',
  'womens-watches',
  'mens-watches',
  'couple-gifts',
  'friendship-bands',
  'kids-bracelets'
];
const toDisplayName = (slug) => String(slug || '').replace(/-/g, ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

function CategoryPage() {
  const params = useParams();
  const category = params?.category;
  const slug = category || "All";
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = (updater) => {
    const current = new URLSearchParams(searchParams.toString());
    const next = typeof updater === 'function' ? updater(current) : updater;
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  // State
  const [sortOption, setSortOption] = useState('featured');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activePromo, setActivePromo] = useState(0);

  // Pagination from URL or default to 1
  const pageParam = parseInt(searchParams.get('page')) || 1;
  const [currentPage, setCurrentPage] = useState(pageParam);

  // Update URL when page changes
  useEffect(() => {
    setSearchParams(prev => {
      prev.set('page', currentPage);
      return prev;
    });
  }, [currentPage, setSearchParams]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setCurrentPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset page on sort or category change
  useEffect(() => {
    setCurrentPage(1);
    setQuery('');
    setDebouncedQuery('');
  }, [slug]);

  // --- React Query ---
  const {
    data,
    isLoading,
    isError,
    error,
    isPlaceholderData
  } = useQuery({
    queryKey: ['products', {
      category: slug === 'All' ? '' : slug,
      sort: sortOption,
      q: debouncedQuery,
      page: currentPage,
      pageSize: 24
    }],
    queryFn: fetchProductsQuery,
    placeholderData: keepPreviousData,
  });

  const products = data?.products || [];
  const totalProducts = data?.total || 0;
  const totalPages = Math.ceil(totalProducts / 24);

  // Promos
  const promos = [
    "🚚 Free Shipping on Orders Over Rs. 4999",
    "✨ New Arrivals: Check out our latest collection!",
    "🎁 Buy 2 Get 5% Off - Limited Time Offer!"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePromo((prev) => (prev + 1) % promos.length);
    }, 4000);
    return () => clearTimeout(interval);
  }, [promos.length]);

  // Handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      const el = typeof document !== 'undefined' ? document.getElementById('product-grid') : null;
      if (el && typeof window !== 'undefined') {
        const offset = 100; // slightly more for category header
        const top = el.getBoundingClientRect().top + (window.pageYOffset || 0) - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      } else if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const displayName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const breadcrumbItems = [
    { name: 'Home', href: '/' },
    { name: displayName, href: `/category/${slug}` }
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50/50 pb-20">
        {/* Modern Hero Section */}
        <div className="relative bg-gradient-to-br from-violet-900 via-purple-900 to-fuchsia-900 text-white overflow-hidden pb-16 pt-12 lg:pt-20">
          {/* Abstract Shapes */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-500/30 rounded-full blur-3xl mix-blend-overlay" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-3xl mix-blend-overlay" />
          </div>

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="mb-6 flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm font-medium animate-fade-in">
                <span className="text-yellow-300">✨</span> {promos[activePromo]}
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight leading-tight capitalize bg-clip-text text-transparent bg-gradient-to-b from-white to-purple-200 drop-shadow-sm">
              {displayName}
            </h1>
            <p className="text-lg md:text-xl text-purple-200 max-w-2xl mx-auto font-light leading-relaxed mb-8">
              Discover our curated collection of {displayName}, designed for elegance and performance.
            </p>

            {/* Sub-Category Pills */}
            <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
              {ALIAS_SLUGS.map((slugKey) => (
                <Link key={slugKey} href={`/category/${slugKey}`} className="px-4 py-2 rounded-full text-xs md:text-sm font-medium text-white/90 bg-white/10 border border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 backdrop-blur-sm">
                  {toDisplayName(slugKey)}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-8 relative z-20">
          {/* Glass Filter Bar */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-2 md:p-4 flex flex-col md:flex-row gap-4 items-center justify-between ring-1 ring-black/5">
            <div className="w-full md:w-96 relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                type="search"
                placeholder={`Search ${displayName}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all placeholder:text-gray-400 text-gray-900"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative w-full md:w-48">
                <select
                  aria-label="Sort products"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none text-gray-700 cursor-pointer transition-all"
                >
                  <option value="featured">✨ Featured</option>
                  <option value="priceAsc">💰 Price: Low to High</option>
                  <option value="priceDesc">💎 Price: High to Low</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-8 lg:mt-12">
          <Breadcrumb items={breadcrumbItems} className="mb-6 opacity-70 hover:opacity-100 transition-opacity" />
          <div id="product-grid" className="scroll-mt-32"></div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong.</h2>
              <p className="text-gray-500 mb-6">{error?.message || 'Failed to load products'}</p>
              <button onClick={() => window.location.reload()} className="px-6 py-2 bg-purple-600 text-white rounded-lg">Try Again</button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 px-6 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No items found</h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">We couldn't find any products in this category matching your criteria.</p>
              <button onClick={() => { setQuery(''); setSortOption('featured'); }} className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-black transition-all shadow-lg hover:shadow-xl">
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                {products.map((product, i) => (
                  <div key={product.id} className="animate-stagger-item h-full">
                    <ProductCard product={product} priority={i < 4} />
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isPlaceholderData}
                    className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  >
                    Previous
                  </button>
                  <span className="text-gray-600 font-medium px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isPlaceholderData}
                    className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default CategoryPage;
