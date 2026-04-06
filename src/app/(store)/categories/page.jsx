'use client';

import React, { useMemo, useState, useEffect } from 'react';
import getImageUrl from '@/utils/imageUrl';
import { getTrendingCategoriesFromSearches } from '@/hooks/useRecentSearches';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PageSkeleton from '@/components/Skeletons/PageSkeleton';

const AllCategoriesPage = () => {
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/categories`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const categoriesData = data.categories || [];

        if (!categoriesData || categoriesData.length === 0) {
          setCategories([]);
          setLoading(false);
          return;
        }

        try {
          const trending = getTrendingCategoriesFromSearches(categoriesData, 6);
          if (Array.isArray(trending) && trending.length) {
            const map = categoriesData.reduce((m, c) => { m[c.name] = c; return m; }, {});
            const ordered = [];
            trending.forEach(t => { if (map[t]) { ordered.push(map[t]); delete map[t]; } });
            Object.keys(map).forEach(k => ordered.push(map[k]));
            setCategories(ordered);
          } else {
            setCategories(categoriesData);
          }
        } catch (e) {
          setCategories(categoriesData);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
        setLoading(false);
      }
    };
    fetchCategories();
  }, [API_BASE_URL]);

  const trendingNames = useMemo(() => getTrendingCategoriesFromSearches(categories, 6), [categories]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 py-6 md:py-20 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-4 pb-2">
            Shop by Category
          </h1>
          <div className="w-32 h-1.5 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 mx-auto rounded-full mb-6"></div>
          <p className="text-gray-600 text-lg md:text-xl max-w-3xl mx-auto">
            Discover our diverse collection of premium products organized by category
          </p>
        </div>

        {trendingNames && trendingNames.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Trending categories</h3>
            <div className="flex flex-wrap gap-2">
              {trendingNames.map((name) => (
                <Link 
                  key={name} 
                  href={`/category/${encodeURIComponent(String(name).trim().toLowerCase().replace(/\s+/g, '-'))}`} 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-100 rounded-full text-sm font-semibold text-purple-700 hover:bg-purple-100 transition-all"
                >
                  <span>{name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/category/${encodeURIComponent(String(category.name).trim().toLowerCase().replace(/\s+/g, '-'))}`}
              className="group relative overflow-hidden rounded-xl md:rounded-2xl bg-white shadow-sm hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border border-gray-100"
            >
              <div className="aspect-[4/5] md:aspect-[4/3] overflow-hidden bg-gradient-to-br from-purple-100 via-pink-50 to-purple-100 relative">
                <img
                  src={getImageUrl(category.image)}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              </div>

              <div className="absolute inset-0 flex flex-col justify-end p-3 md:p-5 lg:p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2">
                  <h3 className="text-sm md:text-xl lg:text-2xl font-bold text-white leading-tight group-hover:text-purple-300 transition-colors capitalize drop-shadow-lg line-clamp-1">
                    {category.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-0.5 md:mt-0">
                  <p className="text-gray-300 text-[10px] md:text-sm font-medium drop-shadow">
                    {category.count} {category.count === 1 ? 'Item' : 'Items'}
                  </p>
                </div>
                <div className="hidden md:block mt-3 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white text-sm font-semibold rounded-lg border border-white/30">
                    View
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">No categories found</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-16">
          <button
            onClick={() => router.back()}
            type="button"
            className="inline-flex items-center gap-3 px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 text-base font-semibold rounded-full hover:bg-purple-50 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Go Back
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-lg font-semibold rounded-full hover:from-purple-700 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AllCategoriesPage;
