import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchAutocomplete from './SearchAutocomplete';
import ProductCard from '../ProductCard/ProductCard';
import { getAllRecentSearchTerms } from '../../hooks/useRecentSearches';
import { aliasMap, compileAliasMap } from '../../utils/aliasMap.esm';
import ProductCardSkeleton from '../Skeletons/ProductCardSkeleton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.__APP_CONFIG__?.API_BASE_URL || '';
const API_PRODUCTS = import.meta.env.VITE_API_PRODUCTS || window.__APP_CONFIG__?.API_PRODUCTS || '/api/products';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') || '';
  const initialPageParam = Number(searchParams.get('page') || 1);
  const [query, setQuery] = useState(qParam);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(initialPageParam);
  const perPage = 24; // per page requirement
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
  // Expose to window for inline handler above (hacky but works with the previous huge replace)
  if (typeof window !== 'undefined') {
    window.isMobileFilterOpen = isMobileFilterOpen;
    window.setMobileFilterOpen = setMobileFilterOpen;
  }

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
        // Log no_results event once per submitted query
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
  }, [query, page, filters, sort]);

  // Fetch trending searches from backend and recent from local storage
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

  // Fetch category shortcuts only after submit (based on submittedQuery)
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

  // Sync page from URL
  useEffect(() => {
    const p = Number(searchParams.get('page') || 1);
    setPage(p);
  }, [searchParams]);

  // Scroll results into view whenever page changes
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
    const params = new URLSearchParams(searchParams);
    params.set('q', val);
    params.set('page', '1');
    setSearchParams(params);
    setSubmittedQuery(val);
    try { fetch(`${API_BASE_URL}/api/search/log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ term: val }) }); } catch (_) { }
  };

  // Alias-based simple suggestions for "Did you mean"
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

    // Fuzzy matching (Damerau–Levenshtein) against categories and trending terms
    function damerauLevenshtein(a, b) {
      const al = a.length, bl = b.length;
      const INF = al + bl;
      const score = Array(al + 2).fill(0).map(() => Array(bl + 2).fill(0));
      const da = {};
      score[0][0] = INF;
      for (let i = 0; i <= al; i++) { score[i + 1][1] = i; score[i + 1][0] = INF; }
      for (let j = 0; j <= bl; j++) { score[1][j + 1] = j; score[0][j + 1] = INF; }
      for (let i = 1; i <= al; i++) {
        let db = 0;
        for (let j = 1; j <= bl; j++) {
          const i1 = (da[b[j - 1]] || 0);
          const j1 = db;
          let cost = 1;
          if (a[i - 1] === b[j - 1]) { cost = 0; db = j; }
          score[i + 1][j + 1] = Math.min(
            score[i][j] + cost,           // substitution
            score[i + 1][j] + 1,            // insertion
            score[i][j + 1] + 1,            // deletion
            score[i1] && score[i1][j1] !== undefined ? (score[i1][j1] + (i - i1 - 1) + 1 + (j - j1 - 1)) : Infinity // transposition
          );
        }
        da[a[i - 1]] = i;
      }
      return score[al + 1][bl + 1];
    }

    const candidates = new Set();
    (topCategories || []).forEach(c => candidates.add(String(c.name || '')));
    (trending || []).forEach(t => candidates.add(String(t)));
    candidates.add('Watch'); candidates.add('Wallet'); candidates.add('Drinkware'); candidates.add('Keychain'); candidates.add('Bracelet'); candidates.add('Bag');

    const qlc = q.toLowerCase();
    const scored = Array.from(candidates)
      .map(term => ({ term, d: damerauLevenshtein(qlc, String(term).toLowerCase()) }))
      .filter(x => x.d > 0 && x.d <= 2)
      .sort((a, b) => a.d - b.d)
      .slice(0, 5)
      .map(x => x.term);

    scored.forEach(s => matched.add(s));
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
          {/* Trending + Recent search chips */}
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
          {/* Filters + Sort */}
          {allCategories.length > 0 && (
            <>
              {/* Desktop Filters (Hidden on Mobile) */}
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
                  {/* ... (Existing Desktop Filter JSX) ... */}
                  <div className="flex-1 min-w-[200px]">
                    {/* Categories */}
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
                            const params = new URLSearchParams(searchParams);
                            if (newCategories.length) {
                              params.set('categories', newCategories.join(','));
                            } else {
                              params.delete('categories');
                            }
                            params.set('page', '1');
                            setSearchParams(params);
                          }} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${active ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent shadow-md transform scale-105' : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-sm'}`}>{c.name}</button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Price */}
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Price Range
                    </div>
                    <div className="flex items-center gap-2">
                      <input value={filters.minPrice} onChange={e => {
                        const params = new URLSearchParams(searchParams);
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (val) { params.set('minPrice', val); } else { params.delete('minPrice'); }
                        params.set('page', '1');
                        setSearchParams(params);
                      }} className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Min" inputMode="numeric" />
                      <span className="text-gray-400">–</span>
                      <input value={filters.maxPrice} onChange={e => {
                        const params = new URLSearchParams(searchParams);
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (val) { params.set('maxPrice', val); } else { params.delete('maxPrice'); }
                        params.set('page', '1');
                        setSearchParams(params);
                      }} className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="Max" inputMode="numeric" />
                    </div>
                  </div>
                  {/* Availability */}
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                      Availability
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm cursor-pointer group">
                      <input type="checkbox" checked={filters.inStock} onChange={e => {
                        const params = new URLSearchParams(searchParams);
                        if (e.target.checked) { params.set('inStock', 'true'); } else { params.delete('inStock'); }
                        params.set('page', '1');
                        setSearchParams(params);
                      }} className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500" />
                      <span className="group-hover:text-purple-600 transition-colors">In stock only</span>
                    </label>
                  </div>
                  {/* Discount */}
                  <div>
                    <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                      Min. Discount %
                    </div>
                    <input value={filters.minDiscount} onChange={e => {
                      const params = new URLSearchParams(searchParams);
                      const val = e.target.value.replace(/[^0-9]/g, '');
                      if (val) { params.set('minDiscount', val); } else { params.delete('minDiscount'); }
                      params.set('page', '1');
                      setSearchParams(params);
                    }} className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent" placeholder="e.g. 20" inputMode="numeric" />
                  </div>
                  {/* Sort */}
                  <div className="ml-auto">
                    <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                      Sort By
                    </div>
                    <select value={sort} onChange={e => {
                      const params = new URLSearchParams(searchParams);
                      params.set('sort', e.target.value);
                      params.set('page', '1');
                      setSearchParams(params);
                    }} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white cursor-pointer hover:border-purple-300 transition-colors">
                      <option value="featured">Featured</option>
                      <option value="priceAsc">Price: Low to High</option>
                      <option value="priceDesc">Price: High to Low</option>
                    </select>
                  </div>
                </div>
                {/* Applied filter chips */}
                {(filters.categories.length || filters.minPrice || filters.maxPrice || filters.inStock || filters.minDiscount) && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Filters:</span>
                      {filters.categories.map(s => {
                        const c = allCategories.find(x => x.slug === s);
                        return (
                          <button key={`chip-${s}`} onClick={() => {
                            const newCategories = filters.categories.filter(x => x !== s);
                            const params = new URLSearchParams(searchParams);
                            if (newCategories.length) { params.set('categories', newCategories.join(',')); } else { params.delete('categories'); }
                            setSearchParams(params);
                          }} className="group px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200 hover:border-purple-300 transition-all duration-200 flex items-center gap-1">
                            {c ? c.name : s}
                            <svg className="w-3 h-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        );
                      })}
                      {(filters.minPrice || filters.maxPrice) && (
                        <button onClick={() => { const params = new URLSearchParams(searchParams); params.delete('minPrice'); params.delete('maxPrice'); setSearchParams(params); }} className="group px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200 hover:border-blue-300 transition-all duration-200 flex items-center gap-1">Price: {filters.minPrice || '0'}–{filters.maxPrice || '∞'} <svg className="w-3 h-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      )}
                      {filters.inStock && (
                        <button onClick={() => { const params = new URLSearchParams(searchParams); params.delete('inStock'); setSearchParams(params); }} className="group px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 hover:border-green-300 transition-all duration-200 flex items-center gap-1">In stock <svg className="w-3 h-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      )}
                      {filters.minDiscount && (
                        <button onClick={() => { const params = new URLSearchParams(searchParams); params.delete('minDiscount'); setSearchParams(params); }} className="group px-3 py-1.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700 border border-pink-200 hover:bg-pink-200 hover:border-pink-300 transition-all duration-200 flex items-center gap-1">Discount ≥ {filters.minDiscount}% <svg className="w-3 h-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                      )}
                      <button onClick={() => { const params = new URLSearchParams(searchParams); params.delete('categories'); params.delete('minPrice'); params.delete('maxPrice'); params.delete('inStock'); params.delete('minDiscount'); params.delete('sort'); params.set('page', '1'); setSearchParams(params); }} className="ml-auto px-4 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200">Clear all</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Filter Sticky Bar */}
              <div className="md:hidden sticky top-16 z-20 -mx-4 px-4 py-2 bg-white/95 backdrop-blur shadow-sm border-b border-gray-100 flex items-center gap-3 mb-6">
                <button onClick={() => window.setMobileFilterOpen?.(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold text-gray-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                  Filter {(filters.categories.length || filters.minPrice || filters.maxPrice || filters.inStock || filters.minDiscount) ? `(${(filters.categories.length || 0) + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0) + (filters.inStock ? 1 : 0) + (filters.minDiscount ? 1 : 0)})` : ''}
                </button>
                <div className="w-[1px] h-8 bg-gray-200"></div>
                <div className="flex-1 relative">
                  <select value={sort} onChange={e => { const params = new URLSearchParams(searchParams); params.set('sort', e.target.value); params.set('page', '1'); setSearchParams(params); }} className="w-full appearance-none py-2.5 pl-4 pr-8 bg-gray-100 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none">
                    <option value="featured">Featured</option>
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Mobile Filter Drawer */}
              <MobileFilterDrawer
                isOpen={!!window.isMobileFilterOpen}
                onClose={() => window.setMobileFilterOpen?.(false)}
                filters={filters}
                setSearchParams={setSearchParams}
                searchParams={searchParams}
                allCategories={allCategories}
              />
            </>
          )}
          {/* Top categories for query */}
          {submittedQuery && topCategories.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Top categories for "{submittedQuery}"</div>
              <div className="flex flex-wrap gap-2">
                {topCategories.map(c => (
                  <a key={`topc-${c.slug}`} href={`/category/${c.slug}`} onMouseEnter={() => { try { import('../Category/CategoryPage'); } catch (_) { } }} className="px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100">
                    {c.name} {typeof c.count === 'number' ? `(${c.count})` : ''}
                  </a>
                ))}
              </div>
            </div>
          )}
          {/* live region for results count */}
          <div className="sr-only" aria-live="polite" aria-atomic="true">{loading ? 'Loading results' : `${total} ${total === 1 ? 'result' : 'results'} for ${submittedQuery}`}</div>

          {/* ... (in render) */}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/5] md:aspect-auto">
                  <ProductCardSkeleton />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="max-w-md mx-auto">
                <svg className="w-24 h-24 mx-auto mb-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600 mb-6">We couldn't find anything matching "{submittedQuery}"</p>
              </div>
              {(didYouMean.length > 0 || categoryShortcuts.length > 0) && (
                <div className="mt-8">
                  <div className="text-sm font-semibold text-gray-700 mb-3">Try these instead:</div>
                  <div className="flex flex-wrap gap-3 justify-center max-w-2xl mx-auto">
                    {didYouMean.map(term => (
                      <button key={`dym-${term}`} onClick={() => onSubmit(term)} className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-200">{term}</button>
                    ))}
                    {categoryShortcuts.slice(0, 6).map(c => (
                      <a key={`dymc-${c.slug}`} href={`/category/${c.slug}`} className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 hover:from-blue-100 hover:to-cyan-100 border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                        {c.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div ref={resultsRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="search-results">
              {results.map((p) => (
                <div key={p.id} onClick={() => { try { fetch(`${API_BASE_URL}/api/search/event`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'result_click', payload: { term: submittedQuery, productId: p.id, slug: p.slug } }) }); } catch (_) { } }}>
                  <ProductCard {...p} />
                </div>
              ))}
            </div>
          )}
          {/* Show category shortcuts after submit when we have some results too */}
          {results.length > 0 && categoryShortcuts.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-600 mb-2">Search in</div>
              <div className="flex flex-wrap gap-2">
                {categoryShortcuts.map(c => (
                  <a key={c.slug} href={`/category/${c.slug}`} onMouseEnter={() => { try { import('../Category/CategoryPage'); } catch (_) { } }} className="px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100">{c.name}</a>
                ))}
              </div>
            </div>
          )}
          {results.length > 0 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(Math.max(1, page - 1)));
                setSearchParams(params);
              }} disabled={page === 1} className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                ← Prev
              </button>
              <div className="px-4 py-2 rounded-lg bg-purple-50 text-purple-700 font-semibold">Page {page} of {Math.max(1, Math.ceil(total / perPage))}</div>
              <button onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('page', String(Math.min(Math.max(1, Math.ceil(total / perPage)), page + 1)));
                setSearchParams(params);
              }} disabled={page === Math.max(1, Math.ceil(total / perPage))} className="px-4 py-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mobile Filter Drawer Component
const MobileFilterDrawer = ({ isOpen, onClose, filters, setSearchParams, searchParams, allCategories }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Drawer */}
      <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col animate-slide-left">
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          <button onClick={onClose} className="p-2 -mr-2 text-gray-500 hover:text-gray-900 bg-gray-50 rounded-full">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 block">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {allCategories.map(c => {
                const active = filters.categories.includes(c.slug);
                return (
                  <button key={`mfc-${c.slug}`} onClick={() => {
                    const newCategories = active ? filters.categories.filter(s => s !== c.slug) : [...filters.categories, c.slug];
                    const params = new URLSearchParams(searchParams);
                    if (newCategories.length) params.set('categories', newCategories.join(',')); else params.delete('categories');
                    params.set('page', '1');
                    setSearchParams(params);
                  }} className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors w-full text-left flex justify-between items-center ${active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                    {c.name}
                    {active && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3 block">Price Range</h3>
            <div className="flex gap-3">
              <input type="number" placeholder="Min" value={filters.minPrice} onChange={e => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('minPrice', e.target.value); else params.delete('minPrice');
                params.set('page', '1');
                setSearchParams(params);
              }} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" />
              <input type="number" placeholder="Max" value={filters.maxPrice} onChange={e => {
                const params = new URLSearchParams(searchParams);
                if (e.target.value) params.set('maxPrice', e.target.value); else params.delete('maxPrice');
                params.set('page', '1');
                setSearchParams(params);
              }} className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" />
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="font-semibold text-gray-700">In Stock Only</span>
              <input type="checkbox" checked={filters.inStock} onChange={e => {
                const params = new URLSearchParams(searchParams);
                if (e.target.checked) params.set('inStock', 'true'); else params.delete('inStock');
                params.set('page', '1');
                setSearchParams(params);
              }} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500" />
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <button onClick={() => {
            const params = new URLSearchParams(searchParams);
            params.delete('categories');
            params.delete('minPrice');
            params.delete('maxPrice');
            params.delete('inStock');
            params.delete('minDiscount');
            setSearchParams(params);
            onClose();
          }} className="w-full py-3 text-red-600 font-semibold mb-3 bg-red-50 rounded-xl">Reset All</button>
          <button onClick={onClose} className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl shadow-lg">View Results</button>
        </div>
      </div>
    </div>
  );
};
