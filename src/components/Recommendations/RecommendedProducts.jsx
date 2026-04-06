'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ProductCard from '../ProductCard/ProductCard';


const RecommendedProducts = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get browsing history from localStorage
    const viewedProducts = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('coolcacheViewHistory') || '[]') : [];
    const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

    // Fetch recommendations based on viewed categories
    async function fetchRecommendations() {
      try {
        setLoading(true);

        // Get unique categories from viewed products (flatten arrays)
        const viewedCategories = [...new Set(viewedProducts.flatMap(p => (Array.isArray(p.category) ? p.category : [p.category])).filter(Boolean))];

        if (viewedCategories.length === 0) {
          // No history, show trending products
          const res = await fetch(`${API_BASE_URL}/api/products?sort=featured&pageSize=8`);
          const data = await res.json();
          const products = Array.isArray(data) ? data : data.products || [];
          setRecommendations(products);
        } else {
          // Fetch products from viewed categories
          const categoryPromises = viewedCategories.slice(0, 3).map(cat =>
            fetch(`${API_BASE_URL}/api/products/category/${encodeURIComponent(cat)}?limit=3`)
              .then(res => res.json())
          );

          const categoryResults = await Promise.all(categoryPromises);
          // Each result may be an array or {products: []} object — extract product arrays
          const allProducts = categoryResults.flatMap(r => Array.isArray(r) ? r : (r.products || []));

          // Deduplicate products based on ID (fixing the issue where same product in multiple categories repeats)
          const uniqueProductsMap = new Map();
          allProducts.forEach(p => {
            if (p && p.id && !uniqueProductsMap.has(p.id)) {
              uniqueProductsMap.set(p.id, p);
            }
          });
          const uniqueProducts = Array.from(uniqueProductsMap.values());

          // Filter out already viewed products
          const viewedIds = new Set(viewedProducts.map(p => p.id));
          const filtered = uniqueProducts.filter(p => !viewedIds.has(p.id));

          // Randomize and limit
          const shuffled = filtered.sort(() => Math.random() - 0.5);
          setRecommendations(shuffled.slice(0, 8));
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="h-4 bg-gray-200 rounded w-40 mt-2"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-full bg-white border border-gray-100 rounded-xl shadow-sm p-3 animate-pulse">
              <div className="w-full aspect-square rounded-lg bg-gray-100" />
              <div className="h-4 bg-gray-100 rounded mt-3 w-3/4" />
              <div className="h-3 bg-gray-100 rounded mt-2 w-1/2" />
              <div className="h-9 bg-gray-100 rounded mt-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mb-20 md:mb-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            🤖 Recommended For You
          </h2>
          <p className="text-gray-600">Based on your browsing history</p>
        </div>
        <Link
          href="/recommendations"
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
        >
          <span className="inline">View All</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {recommendations.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>
    </section>
  );
};



export default RecommendedProducts;
