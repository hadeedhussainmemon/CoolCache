'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchAutocomplete from '@/components/Search/SearchAutocomplete';
import ProductCard from '@/components/ProductCard/ProductCard';
import { getAllRecentSearchTerms } from '@/hooks/useRecentSearches';
import { aliasMap, compileAliasMap } from '@/utils/aliasMap.esm';
import ProductCardSkeleton from '@/components/Skeletons/ProductCardSkeleton';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
const API_PRODUCTS = '/api/products';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const qParam = searchParams.get('q') || '';
  const initialPageParam = Number(searchParams.get('page') || 1);
  
  const [query, setQuery] = useState(qParam);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPageParam);
  const perPage = 24;
  const [total, setTotal] = useState(0);
  const resultsRef = useRef(null);
  const [trending, setTrending] = useState([]);
  const [recent, setRecent] = useState([]);
  const [submittedQuery, setSubmittedQuery] = useState(qParam);
  const [categoryShortcuts, setCategoryShortcuts] = useState([]);
  const compiledAliases = useMemo(() => compileAliasMap(aliasMap), []);
  const [topCategories, setTopCategories] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [filters, setFilters] = useState({ categories: [], minPrice: '', maxPrice: '', inStock: false, minDiscount: '' });
  const [sort, setSort] = useState('featured');
  const lastNoResultsRef = useRef('');
  const [isMobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Initialize filters/sort from URL
  useEffect(() => {
    const cat = searchParams.get('categories');
    const minP = searchParams.get('minPrice') || '';
    const maxP = searchParams.get('maxPrice') || '';
    const stock = searchParams.get('inStock') === 'true';
    const minD = searchParams.get('minDiscount') || '';
    const srt = searchParams.get('sort') || 'featured';
    setFilters({
      categories: cat ? cat.split(',').filter(Boolean) : [],
      minPrice: minP,
      maxPrice: maxP,
      inStock: stock,
      minDiscount: minD
    });
    setSort(srt);
    setPage(Number(searchParams.get('page') || 1));
  }, [searchParams]);

  useEffect(() => {
    setQuery(qParam);
    setSubmittedQuery(qParam);
  }, [qParam]);

  useEffect(() => {
    async function fetchResults() {
      if (!query || query.trim().length < 2) {
        setResults([]);
        setTotal(0);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('search', query);
        params.set('page', page);
        params.set('pageSize', perPage);
        if (filters.categories && filters.categories.length) params.set('categories', filters.categories.join(','));
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
        if (filters.inStock) params.set('inStock', 'true');
        if (filters.minDiscount) params.set('minDiscount', filters.minDiscount);
        if (sort) params.set('sort', sort);
        
        const res = await fetch(`${API_BASE_URL}${API_PRODUCTS}?${params.toString()}`);
        const data = await res.json();
        const items = Array.isArray(data?.products) ? data.products : (Array.isArray(data) ? data : []);
        const totalItems = (typeof data?.total === 'number') ? data.total : (Array.isArray(data) ? data.length : 0);
        setTotal(totalItems);
        setResults(items);
        
        const qTrim = String(query || '').trim();
        if (qTrim && qTrim === String(submittedQuery || '').trim() && items.length === 0 && lastNoResultsRef.current !== qTrim) {
          lastNoResultsRef.current = qTrim;
          try { fetch(`${API_BASE_URL}/api/search/event`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'no_results', payload: { term: qTrim } }) }); } catch (_) { }
        }
      } catch (e) {
        console.error('SearchPage: fetch error', e);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(fetchResults, 250);
    return () => clearTimeout(t);
  }, [query, page, filters, sort, submittedQuery]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/search/trending?days=7&limit=8`);
        const data = await res.json();
        setTrending(Array.isArray(data?.terms) ? data.terms : []);
      } catch (_) { setTrending([]); }
      try { setRecent(getAllRecentSearchTerms(8)); } catch (_) { setRecent([]); }
      try {
        const cat = await fetch(`${API_BASE_URL}${API_PRODUCTS}/categories`);
        const catData = await cat.json();
        setAllCategories(Array.isArray(catData?.categories) ? catData.categories : []);
      } catch (_) { setAllCategories([]); }
    })();
  }, []);

  useEffect(() => {
    const q = (submittedQuery || '').trim();
    if (!q || q.length < 2) { setCategoryShortcuts([]); return; }
    const t = setTimeout(async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}${API_PRODUCTS}/categories?q=${encodeURIComponent(q)}`);
        const json = await resp.json();
        const cats = Array.isArray(json?.categories) ? json.categories.slice(0, 6) : [];
        setCategoryShortcuts(cats);
        setTopCategories(cats);
      } catch (_) { setCategoryShortcuts([]); }
    }, 150);
    return () => clearTimeout(t);
  }, [submittedQuery]);

  useEffect(() => {
    if (page > 1 || results.length > 0) {
      const el = document.getElementById('search-results-top');
      if (el) {
        const offset = 100;
        const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    }
  }, [page, results.length]);

  const onSubmit = (val) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('q', val);
    params.set('page', '1');
    router.push(`/search?${params.toString()}`);
    setSubmittedQuery(val);
    try { fetch(`${API_BASE_URL}/api/search/log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ term: val }) }); } catch (_) { }
  };

  const updateURLParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    router.push(`/search?${params.toString()}`);
  };

  const didYouMean = useMemo(() => {
    const q = (submittedQuery || '').trim();
    if (!q || q.length < 2) return [];
    const matched = new Set();
    try {
      compiledAliases.forEach(a => {
        if (a.regex && a.regex.test(q)) {
          if (a.category) matched.add(a.category);
        }
      });
    } catch (_) { }
    return Array.from(matched).slice(0, 5);
  }, [submittedQuery, compiledAliases]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <SearchAutocomplete
            value={query}
            onChange={setQuery}
            onSubmit={onSubmit}
            placeholder="Search products..."
            enableAutocomplete={false}
            showOnlySearchSuggestions={true}
            enableVoice={true}
          />
          {(trending.length > 0 || recent.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Related searches">
              {trending.slice(0, 6).map(term => (
                <button key={`t-${term}`} type="button" onClick={() => onSubmit(term)} className="px-3 py-1.5 rounded-full text-sm bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-100">{term}</button>
              ))}
              {recent.slice(0, 6).map(term => (
                <button key={`r-${term}`} type="button" onClick={() => onSubmit(term)} className="px-3 py-1.5 rounded-full text-sm bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200">{term}</button>
              ))}
            </div>
          )}
        </div>

        <div id="search-results-top" className="scroll-mt-24">
          {allCategories.length > 0 && (
            <>
              <div className="hidden md:block mb-4 p-4 bg-white border border-gray-200 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Refine Results</h3>
                  {(filters.categories.length || filters.minPrice || filters.maxPrice || filters.inStock || filters.minDiscount) && (
                    <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded-full">
                      {(filters.categories.length || 0) + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0) + (filters.inStock ? 1 : 0) + (filters.minDiscount ? 1 : 0)} active
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 items-end">
                   <div className="flex-1 min-w-[200px]">
                    <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                      Categories
                      {filters.categories.length > 0 && <span className="text-purple-600">({filters.categories.length})</span>}
                    </div>
                    <div className="flex flex-wrap gap-2 max-w-full">
                      {allCategories.slice(0, 24).map(c => {
                        const active = filters.categories.includes(c.slug);
                        return (
                          <button key={`fc-${c.slug}`} onClick={() => {
                            const newCategories = active ? filters.categories.filter(s => s !== c.slug) : [...filters.categories, c.slug];
                            updateURLParams({ categories: newCategories.join(','), page: '1' });
                          }} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${active ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md transform scale-105' : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm'}`}>{c.name}</button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                       <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       Price Range
                    </div>
                    <div className="flex items-center gap-2">
                      <input value={filters.minPrice} onChange={e => updateURLParams({ minPrice: e.target.value.replace(/[^0-9]/g, ''), page: '1' })} className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" placeholder="Min" inputMode="numeric" />
                      <span className="text-gray-400">–</span>
                      <input value={filters.maxPrice} onChange={e => updateURLParams({ maxPrice: e.target.value.replace(/[^0-9]/g, ''), page: '1' })} className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none" placeholder="Max" inputMode="numeric" />
                    </div>
                  </div>
                  <div className="ml-auto">
                    <select value={sort} onChange={e => updateURLParams({ sort: e.target.value, page: '1' })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white cursor-pointer hover:border-purple-300 transition-colors">
                      <option value="featured">Featured</option>
                      <option value="priceAsc">Price: Low to High</option>
                      <option value="priceDesc">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="md:hidden sticky top-16 z-20 -mx-4 px-4 py-2 bg-white/95 backdrop-blur shadow-sm border-b border-gray-100 flex items-center gap-3 mb-6">
                <button onClick={() => setMobileFilterOpen(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold text-gray-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                  Filter {(filters.categories.length || filters.minPrice || filters.maxPrice || filters.inStock || filters.minDiscount) ? `(${(filters.categories.length || 0) + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0) + (filters.inStock ? 1 : 0) + (filters.minDiscount ? 1 : 0)})` : ''}
                </button>
                <div className="w-[1px] h-8 bg-gray-200"></div>
                <div className="flex-1 relative">
                  <select value={sort} onChange={e => updateURLParams({ sort: e.target.value, page: '1' })} className="w-full appearance-none py-2.5 pl-4 pr-8 bg-gray-100 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none">
                    <option value="featured">Featured</option>
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                  </select>
                </div>
              </div>

              {isMobileFilterOpen && (
                <MobileFilterDrawer
                  isOpen={isMobileFilterOpen}
                  onClose={() => setMobileFilterOpen(false)}
                  filters={filters}
                  updateURLParams={updateURLParams}
                  allCategories={allCategories}
                />
              )}
            </>
          )}

          {submittedQuery && topCategories.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Top categories for "{submittedQuery}"</div>
              <div className="flex flex-wrap gap-2">
                {topCategories.map(c => (
                  <button key={`topc-${c.slug}`} onClick={() => router.push(`/category/${c.slug}`)} className="px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100">
                    {c.name} {typeof c.count === 'number' ? `(${c.count})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 px-4">
              <svg className="w-24 h-24 mx-auto mb-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-6">We couldn't find anything matching "{submittedQuery}"</p>
            </div>
          ) : (
            <div ref={resultsRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="search-results">
              {results.map((p) => (
                <div key={p.id} onClick={() => { try { fetch(`${API_BASE_URL}/api/search/event`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'result_click', payload: { term: submittedQuery, productId: p.id, slug: p.slug } }) }); } catch (_) { } }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => updateURLParams({ page: Math.max(1, page - 1) })} disabled={page === 1} className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50">← Prev</button>
              <div className="px-4 py-2 rounded-lg bg-purple-50 text-purple-700 font-semibold">Page {page} of {Math.max(1, Math.ceil(total / perPage))}</div>
              <button onClick={() => updateURLParams({ page: Math.min(Math.ceil(total / perPage), page + 1) })} disabled={page === Math.max(1, Math.ceil(total / perPage))} className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50">Next →</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MobileFilterDrawer = ({ isOpen, onClose, filters, updateURLParams, allCategories }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Filters</h2>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-sm font-bold mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(c => {
                const active = filters.categories.includes(c.slug);
                return (
                  <button key={`mfc-${c.slug}`} onClick={() => {
                    const newCategories = active ? filters.categories.filter(s => s !== c.slug) : [...filters.categories, c.slug];
                    updateURLParams({ categories: newCategories.join(','), page: '1' });
                  }} className={`px-3 py-2 rounded-lg text-sm w-full text-left flex justify-between items-center ${active ? 'bg-purple-600 text-white' : 'bg-gray-50'}`}>
                    {c.name}
                    {active && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="p-4 border-t">
          <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl">View Results</button>
        </div>
      </div>
    </div>
  );
};

export default function SearchPage() {
  return (
    <Suspense fallback={<ProductCardSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}
