// Hook to store recent searches and derive trending categories
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'coolcache_recent_searches_v1';
const MAX_TERMS = 100; // keep last 100

const SEARCH_TO_CATEGORY_KEYWORDS = {
  Watch: ['watch', 'watches', 'dial', 'chronograph', 'quartz', 'men', 'women'],
  Bracelet: ['bracelet', 'bracelets', 'friendship', 'bangle', 'beaded'],
  Drinkware: ['bottle', 'tumbler', 'flask', 'vacuum', 'cup', 'mug'],
  Wallet: ['wallet', 'wallets', 'long wallet', 'tri-fold'],
  Bag: ['bag', 'backpack', 'pouch', 'laptop bag'],
  Keychain: ['keychain', 'key', 'pompom'],
  Gift: ['gift', 'present', 'gifts', 'giftset', 'gift-items'],
  Electronics: ['charger', 'speaker', 'electronics', 'laptop', 'mouse'],
  Fragrance: ['perfume', 'fragrance', 'fogg', 'al-rehab', 'parfum', 'edp', 'body spray'],
  Toy: ['toy', 'die-cast', 'kawasaki', 'nissan', 'keyboard', 'piano'],
};

function readStorage() {
  if (typeof window === 'undefined') return { terms: {}, order: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { terms: {}, order: [] };
    return JSON.parse(raw);
  } catch (e) {
    return { terms: {}, order: [] };
  }
}

function writeStorage(data) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // ignore
  }
}

export function clearRecentSearches() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) { }
}

export function addSearchTerm(term) {
  if (!term) return;
  const q = String(term).trim().toLowerCase();
  if (!q || q.length < 2) return;

  const storage = readStorage();
  const { terms = {}, order = [] } = storage;
  if (!terms[q]) {
    terms[q] = { term: q, count: 0, lastSeen: Date.now() };
    order.unshift(q);
  }
  terms[q].count = (terms[q].count || 0) + 1;
  terms[q].lastSeen = Date.now();
  // Keep newest at front
  const idx = order.indexOf(q);
  if (idx > -1) order.splice(idx, 1);
  order.unshift(q);
  // Trim
  while (order.length > MAX_TERMS) order.pop();
  writeStorage({ terms, order });
}

function mapTermToCategories(term, categoriesFromApi) {
  const matched = new Set();
  const q = String(term || '').toLowerCase();
  Object.keys(SEARCH_TO_CATEGORY_KEYWORDS).forEach(cat => {
    const keywords = SEARCH_TO_CATEGORY_KEYWORDS[cat] || [];
    for (let k of keywords) {
      if (q.includes(k)) {
        matched.add(cat);
        break;
      }
    }
  });
  // Also try to match terms against the API categories (by name)
  if (Array.isArray(categoriesFromApi)) {
    categoriesFromApi.forEach(c => {
      const name = (c?.name || '').toLowerCase();
      if (!name) return;
      if (q.includes(name) || name.includes(q) || q.includes(name.split(' ')[0])) {
        matched.add(c.name);
      }
    });
  }
  return [...matched];
}

export function getTrendingCategoriesFromSearches(categoriesFromApi = [], topN = 5) {
  try {
    const storage = readStorage();
    const { terms = {}, order = [] } = storage;
    // Sum matches per category
    const totals = {};
    Object.keys(terms).forEach(k => {
      const t = terms[k];
      // Map to categories
      const cats = mapTermToCategories(t.term, categoriesFromApi);
      cats.forEach(cat => {
        totals[cat] = (totals[cat] || 0) + (t.count || 1);
      });
    });
    // Also factor in category counts from API to boost known categories
    if (Array.isArray(categoriesFromApi)) {
      categoriesFromApi.forEach(c => {
        const key = c.name;
        if (!totals[key]) totals[key] = c.count || 0;
        else totals[key] += (c.count || 0) * 0.5; // lesser weight
      });
    }
    let list = Object.keys(totals).map(k => ({ name: k, score: totals[k] })).sort((a, b) => b.score - a.score);
    // Ensure we have at least topN by falling back to categoriesFromApi sorted by count
    if (list.length < topN && Array.isArray(categoriesFromApi) && categoriesFromApi.length) {
      const existing = new Set(list.map(x => x.name));
      const extras = categoriesFromApi
        .map(c => ({ name: c.name, score: c.count || 0 }))
        .filter(c => !existing.has(c.name))
        .sort((a, b) => b.score - a.score);
      list = list.concat(extras);
    }
    return list.slice(0, topN).map(x => x.name);
  } catch (e) {
    return [];
  }
}

export function getAllRecentSearchTerms(limit = 20) {
  const storage = readStorage();
  const items = storage.order || [];
  return (items.sort((a, b) => (storage.terms[b]?.lastSeen || 0) - (storage.terms[a]?.lastSeen || 0))).slice(0, limit).map(s => storage.terms[s] ? storage.terms[s].term : s);
}

export default function useRecentSearches() {
  const [recent, setRecent] = useState(() => getAllRecentSearchTerms(10));
  useEffect(() => {
    const onStorage = () => setRecent(getAllRecentSearchTerms(10));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  return { getRecentSearchTerms: () => getAllRecentSearchTerms(10), getTrendingCategoriesFromSearches: (cats, n) => getTrendingCategoriesFromSearches(cats, n), addSearchTerm: (term) => { addSearchTerm(term); setRecent(getAllRecentSearchTerms(10)); }, clearRecent: () => { clearRecentSearches(); setRecent([]); } };
}
