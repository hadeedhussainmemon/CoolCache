import { useState, useEffect } from 'react';

const useProducts = ({ page = 1, pageSize = 12, signal, search } = {}) => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || window.__APP_CONFIG__?.API_BASE_URL || '').replace(/\/$/, '');
  const API_PRODUCTS = (import.meta.env.VITE_API_PRODUCTS || window.__APP_CONFIG__?.API_PRODUCTS || '/api/products');

  const fetchProducts = async (p = currentPage, ps = currentPageSize, retryAttempt = 0) => {
    if (retryAttempt === 0) {
      setIsLoading(true);
      setError(null);
    }

    // Prepare session seed for server-side seeded shuffle
    const seedKey = 'coolcache_products_seed';
    let seed = sessionStorage.getItem(seedKey);
    if (!seed) {
      seed = String(Math.floor(Math.random() * 1e9));
      try { sessionStorage.setItem(seedKey, seed); } catch (e) { /* ignore */ }
    }

    // Build a cache key that includes either the search term or the seed + page so cached pages
    // match the server-side shuffled pages for this session.
    const cacheKey = search ? `products-search-${search}-page-${p}-ps-${ps}` : `products-seed-${seed}-page-${p}-ps-${ps}`;
    
    try {
      // First, try to get from localStorage cache
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Use cache if it's less than 1 hour old since data is mostly static
        if (Date.now() - timestamp < 60 * 60 * 1000) {
          // using cached products
          setProducts(data.products || []);
          setTotal(data.total || 0);
          setCurrentPage(p);
          setCurrentPageSize(ps);
          setIsLoading(false);
          return;
        }
      }

      // Build URL safely
      const base = (API_BASE_URL || '').replace(/\/$/, '');
      const path = API_PRODUCTS.startsWith('/') ? API_PRODUCTS : `/${API_PRODUCTS}`;
      const apiUrl = base ? `${base}${path}` : path;

      let url;
      try {
        url = new URL(apiUrl, window.location.origin);
      } catch (e) {
        // If URL construction fails, try without origin
        url = new URL(apiUrl.startsWith('http') ? apiUrl : `http://localhost:5000${apiUrl}`);
      }
      
      url.searchParams.set('page', String(p));
      url.searchParams.set('pageSize', String(ps));
      if (search) {
        url.searchParams.set('q', search);
      } else {
        // Request server-side seeded shuffle for non-search views
        url.searchParams.set('shuffle', 'true');
        url.searchParams.set('seed', seed);
      }

  // fetching products
      
      const response = await fetch(url.toString(), { 
        signal,
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products (${response.status}). Please try again.`);
      }
      
  const data = await response.json();
      
      if (!Array.isArray(data.products)) {
        throw new Error('Invalid product data received');
      }

      // Cache the successful response in localStorage since data is mostly static
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data }));
      } catch (e) {
  // ignore cache failure
      }

      // Use server-provided ordering. For page 1, replace products; for other pages, append
      if (p === 1) {
        setProducts(data.products || []);
      } else {
        setProducts(prevProducts => [...prevProducts, ...(data.products || [])]);
      }
      
      setTotal(typeof data.total === 'number' ? data.total : 0);
      setCurrentPage(p);
      setCurrentPageSize(ps);
    } catch (err) {
      if (err.name === 'AbortError') return;

      console.error('Error fetching products:', err);
      setError('Unable to load products. Please refresh the page or try again later.');

      // Try to use any available cached data as fallback
      try {
        const fallbackCache = localStorage.getItem(cacheKey);
        if (fallbackCache) {
          const { data } = JSON.parse(fallbackCache);
          // using cached fallback
          setProducts(data.products || []);
          setTotal(data.total || 0);
          setCurrentPage(p);
          setCurrentPageSize(ps);
          return;
        }
      } catch (e) {
  // ignore cached load failure
      }

      // Only retry once to prevent infinite loops
      if (retryAttempt === 0) {
        // silent retry once
        setTimeout(() => {
          fetchProducts(p, ps, 1);
        }, 1000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search]);

  const refetch = (p = page, ps = pageSize) => fetchProducts(p, ps);

  return {
    products,
    isLoading,
    error,
    refetch,
    total,
    page: currentPage,
    pageSize: currentPageSize
  };
};

export default useProducts;