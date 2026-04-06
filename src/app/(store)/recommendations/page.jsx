'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard/ProductCard';
import { fetchProducts as fetchProductsFromCache } from '@/utils/productCache';

const AllRecommendationsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  const API_PRODUCTS = '/api/products';

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        
        // Get view history from localStorage
        const historyStr = typeof window !== 'undefined' ? localStorage.getItem('coolcacheViewHistory') : '[]';
        const history = JSON.parse(historyStr || '[]');
        
        if (history.length === 0) {
          // If no history, fetch trending products (cached short-term)
          const cacheKey = 'trending_products_v1';
          const cachedStr = typeof window !== 'undefined' ? localStorage.getItem(cacheKey) : 'null';
          const cached = JSON.parse(cachedStr || 'null');
          
          if (cached && Date.now() - cached.ts < 1000 * 60 * 5) {
            setProducts(cached.data);
          } else {
            const data = await fetchProductsFromCache({ baseUrl: API_BASE_URL, path: API_PRODUCTS, pageSize: 20, ttl: 1000 * 60 * 5 });
            const list = data.products || data || [];
            setProducts(list);
            if (typeof window !== 'undefined') {
              try { localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: list })); } catch(e) {}
            }
          }
        } else {
          // Extract unique categories from history and fetch in parallel (flatten arrays)
          const categories = [...new Set(history.flatMap(item => (Array.isArray(item.category) ? item.category : [item.category])).filter(Boolean))];
          const fetches = categories.map(cat => fetchProductsFromCache({ baseUrl: API_BASE_URL, path: API_PRODUCTS, category: cat, pageSize: 50 }).catch(() => ({ products: [] })));
          const results = await Promise.all(fetches);
          // Each result may be an object with a `products` array — extract them and flatten.
          const allProducts = results.flatMap(r => (Array.isArray(r) ? r : (r.products || []))).filter(Boolean);

          // Filter out already viewed products
          const viewedIds = new Set(history.map(item => item.id));
          const filtered = allProducts.filter(p => !viewedIds.has(p.id));

          // Shuffle and limit
          const shuffled = filtered.sort(() => Math.random() - 0.5);
          setProducts(shuffled.slice(0, 20));
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16 text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-3 pb-2">
            Recommended for You
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-500 mx-auto rounded-full mb-4"></div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Based on your browsing history, we think you'll love these products
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="w-full bg-white border border-gray-100 rounded-xl shadow-sm p-4 animate-pulse">
                <div className="w-full aspect-square rounded-lg bg-gray-100" />
                <div className="h-4 bg-gray-100 rounded mt-3 w-3/4" />
                <div className="h-3 bg-gray-100 rounded mt-2 w-1/2" />
                <div className="h-9 bg-gray-100 rounded mt-4 w-full" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🛍️</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
              No recommendations yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start browsing products to get personalized recommendations
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full hover:from-purple-700 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl font-bold"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Back to Home */}
            <div className="text-center mt-12">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 rounded-full hover:bg-purple-50 transition-all duration-300 shadow-md hover:shadow-lg font-bold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AllRecommendationsPage;
