// Simple in-memory product cache with in-flight request deduplication
const cache = new Map();
const inFlight = new Map();

const defaultTTL = 1000 * 60 * 5; // 5 minutes for listings

const makeKey = (params = {}) => {
  // Keep stable key ordering
  const ordered = {};
  Object.keys(params).sort().forEach(k => { ordered[k] = params[k]; });
  return JSON.stringify(ordered);
};

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
  return res.json();
}

async function fetchProducts(params = {}) {
  // params: { baseUrl, path, page, pageSize, category, q, sort, ttl }
  const { baseUrl = '', path = '/api/products', ttl = defaultTTL } = params;
  const key = makeKey(params);

  // Return cached if fresh
  const cached = cache.get(key);
  if (cached && (Date.now() - cached.ts) < (ttl || defaultTTL)) {
    return cached.data;
  }

  // Deduplicate in-flight
  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    try {
      // Build URL
      const base = (baseUrl || '').replace(/\/$/, '');
      const apiPath = path.startsWith('/') ? path : `/${path}`;
      const urlBase = base ? `${base}${apiPath}` : apiPath;
      const url = new URL(urlBase, window.location.origin);

      if (params.page) url.searchParams.set('page', String(params.page));
      if (params.pageSize) url.searchParams.set('pageSize', String(params.pageSize));
      if (params.category) url.searchParams.set('category', params.category);
      if (params.q) url.searchParams.set('q', params.q);
      if (params.sort) url.searchParams.set('sort', params.sort);
      if (params.limit) url.searchParams.set('limit', String(params.limit));
      if (params.shuffle) url.searchParams.set('shuffle', String(params.shuffle));
      if (params.seed) url.searchParams.set('seed', String(params.seed));

      const data = await fetchJson(url.toString(), { headers: { Accept: 'application/json' } });

      cache.set(key, { ts: Date.now(), data });
      return data;
    } finally {
      inFlight.delete(key);
    }
  })();

  inFlight.set(key, promise);
  return promise;
}

function clearCache() {
  cache.clear();
}

export { fetchProducts, clearCache };
