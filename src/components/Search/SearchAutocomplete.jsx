import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useRecentSearches, { addSearchTerm, getAllRecentSearchTerms, clearRecentSearches } from '../../hooks/useRecentSearches';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.__APP_CONFIG__?.API_BASE_URL || '';
const API_PRODUCTS = import.meta.env.VITE_API_PRODUCTS || window.__APP_CONFIG__?.API_PRODUCTS || '/api/products';
import getImageUrl from '../../utils/imageUrl';

const SearchAutocomplete = ({ value, onChange, onSubmit, placeholder = 'Search products...', className = '', enableAutocomplete = true, showOnlySearchSuggestions = false, enableVoice = false, showTrendingSuggestions = false, showSectionHeaders = false }) => {
  const [suggestions, setSuggestions] = useState([]); // products
  const [categorySuggestions, setCategorySuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingTerms, setTrendingTerms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const recent = useRecentSearches();

  // Note: normalize image path via shared util getImageUrl()

  // highlight match
  const renderHighlightedTitle = (title = '', query = '') => {
    if (!query) return title;
    const q = query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    const re = new RegExp(`(${q})`, 'i');
    const parts = String(title).split(re);
    return parts.map((part, i) => (re.test(part) ? <mark key={i} className="bg-yellow-100 text-yellow-900 px-0.5 rounded">{part}</mark> : <span key={i}>{part}</span>));
  };

  const fetchSuggestions = async (query) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ search: query, page: '1', pageSize: '6' });
      const productsReq = fetch(`${API_BASE_URL}${API_PRODUCTS}?${params}`, { signal: abortControllerRef.current.signal });
      const categoriesReq = fetch(`${API_BASE_URL}${API_PRODUCTS}/categories?q=${encodeURIComponent(query)}`);
      const [productsResp, categoriesResp] = await Promise.all([productsReq, categoriesReq]);

      // products
      if (productsResp.ok && enableAutocomplete && !showOnlySearchSuggestions) {
        const data = await productsResp.json();
        setSuggestions(data.products || []);
      } else {
        setSuggestions([]);
      }

      // categories
      if (categoriesResp && categoriesResp.ok) {
        try {
          const categoriesData = await categoriesResp.json();
          setCategorySuggestions(categoriesData.categories || []);
        } catch (e) {
          setCategorySuggestions([]);
        }
      } else setCategorySuggestions([]);

      if ((enableAutocomplete || showOnlySearchSuggestions) && document.activeElement === inputRef.current) setShowDropdown(true);
      setSelectedIndex(-1);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
        setCategorySuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keep recent searches updated
  useEffect(() => {
    const updateRecent = () => setRecentSearches(recent.getRecentSearchTerms());
    updateRecent();
    window.addEventListener('storage', updateRecent);
    return () => window.removeEventListener('storage', updateRecent);
  }, []); // Empty deps - only setup listeners once

  // Debounced user query handling: fetch suggestions when input >= 2 chars
  useEffect(() => {
    const q = String(value || '').trim();
    if (!q || q.length < 2) {
      if (showOnlySearchSuggestions) {
        // Only show if focused
        if (document.activeElement === inputRef.current) {
          setShowDropdown((recentSearches.length > 0) || (showTrendingSuggestions && trendingTerms.length > 0));
        }
        setSuggestions([]);
        setCategorySuggestions([]);
      } else {
        setShowDropdown(false);
        setSuggestions([]);
        setCategorySuggestions([]);
      }
      return;
    }

    const id = setTimeout(() => {
      // If we only want to show search suggestions, we don't need to call the network
      if (showOnlySearchSuggestions) {
        setSuggestions([]);
        setCategorySuggestions([]);
        setShowDropdown(true);
        setSelectedIndex(-1);
        return;
      }
      fetchSuggestions(q);
    }, 250);
    return () => clearTimeout(id);
  }, [value, showOnlySearchSuggestions, enableAutocomplete, recentSearches, trendingTerms.length, showTrendingSuggestions]);

  // Prefetch trending terms for showOnlySearchSuggestions contexts (navbar)
  useEffect(() => {
    if (!showTrendingSuggestions) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/search/trending?days=7&limit=8`);
        const data = await res.json();
        if (!mounted) return;
        const terms = Array.isArray(data?.terms) ? data.terms : [];
        setTrendingTerms(terms);
      } catch (_) {
        if (mounted) setTrendingTerms([]);
      }
    })();
    return () => { mounted = false; };
  }, [showTrendingSuggestions]);

  // Filter recent searches by query (if any)
  const filteredRecentSearches = recentSearches && recentSearches.length && String(value || '').trim()
    ? recentSearches.filter(t => String(t).toLowerCase().includes(String(value || '').toLowerCase()))
    : recentSearches || [];
  const filteredTrendingAll = showTrendingSuggestions
    ? (String(value || '').trim()
      ? trendingTerms.filter(t => String(t).toLowerCase().includes(String(value || '').toLowerCase()))
      : trendingTerms)
    : [];
  // De-duplicate trending vs recent (case-insensitive)
  const recentSet = new Set((filteredRecentSearches || []).map(s => String(s).toLowerCase()));
  const filteredTrending = filteredTrendingAll.filter(t => !recentSet.has(String(t).toLowerCase()));

  // Keyboard navigation
  const totalItems = showOnlySearchSuggestions
    ? ((filteredRecentSearches.length || 0) + (filteredTrending.length || 0))
    : ((categorySuggestions.length || 0) + (enableAutocomplete ? (suggestions.length || 0) : 0));
  const handleKeyDown = (e) => {
    // Always handle Enter to allow submission even when suggestions are not shown
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const product = suggestions[selectedIndex];
        navigate(`/product/${product.slug || product.id}`);
        setShowDropdown(false);
        inputRef.current?.blur();
        // only show dropdown when autocomplete enabled
        if (enableAutocomplete) setShowDropdown(true);
        return;
      }
      try { addSearchTerm(value); } catch (err) { }
      if (onSubmit) onSubmit(value);
      setShowDropdown(false);
      inputRef.current?.blur();
      return;
    }
    if (!showDropdown || (suggestions.length === 0 && categorySuggestions.length === 0 && !(showOnlySearchSuggestions && filteredRecentSearches.length > 0))) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          if (!showDropdown) return prev;
          if (prev < totalItems - 1) return prev + 1;
          return prev;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          if (prev > 0) return prev - 1;
          return -1;
        });
        break;
      case 'Home':
        e.preventDefault();
        if (totalItems > 0) setSelectedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        if (totalItems > 0) setSelectedIndex(totalItems - 1);
        break;
      case 'PageDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(totalItems - 1, (prev < 0 ? 0 : prev) + 5));
        break;
      case 'PageUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(-1, (prev < 0 ? -1 : prev) - 5));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (showOnlySearchSuggestions) {
            const recentCount = filteredRecentSearches.length;
            if (selectedIndex < recentCount) {
              const term = filteredRecentSearches[selectedIndex];
              if (term) { handleClickTerm(term, 'recent'); return; }
            } else {
              const tIndex = selectedIndex - recentCount;
              const term = filteredTrending[tIndex];
              if (term) { handleClickTerm(term, 'trending'); return; }
            }
          } else {
            if (selectedIndex < categorySuggestions.length) {
              const cat = categorySuggestions[selectedIndex];
              handleCategoryClick(cat.slug);
              return;
            }
            const productIndex = selectedIndex - categorySuggestions.length;
            if (productIndex >= 0 && productIndex < suggestions.length) {
              const product = suggestions[productIndex];
              navigate(`/product/${product.slug || product.id}`);
              setShowDropdown(false);
              inputRef.current?.blur();
              // record the search term
              try { addSearchTerm(value); } catch (err) { }
              return;
            }
          }
        } else {
          // No suggestion selected — submit the current query
          try { addSearchTerm(value); } catch (err) { }
          if (onSubmit) onSubmit(value);
          setShowDropdown(false);
          inputRef.current?.blur();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };



  const handleSuggestionNavigate = async (e, product) => {
    e.preventDefault();
    try { addSearchTerm(value); } catch (err) { }
    logEvent('result_click', { term: value, productId: product.id, slug: product.slug });
    // If not on /search, push a /search?q= entry so Back returns to search results
    if (location.pathname !== '/search') {
      // push search entry to history
      try { navigate(`/search?q=${encodeURIComponent(value)}`); } catch (e) { }
    }
    // navigate to product
    navigate(`/product/${product.slug || product.id}`);
    setShowDropdown(false);
    setSelectedIndex(-1);
    setCategorySuggestions([]);
    onChange('');
  };

  const handleCategoryClick = (slug) => {
    try { addSearchTerm(value); } catch (err) { }
    logEvent('suggestion_click', { term: value, source: 'category', slug });
    setShowDropdown(false);
    setCategorySuggestions([]);
    setSuggestions([]);
    onChange('');
    navigate(`/category/${slug}`);
  };

  async function logEvent(type, payload) {
    try { await fetch(`${API_BASE_URL}/api/search/event`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, payload }) }); } catch (_) { }
  }

  const handleClickTerm = (term, source = 'recent') => {
    onChange(term);
    try { addSearchTerm(term); } catch (_) { }
    logEvent('suggestion_click', { term, source });
    if (onSubmit) onSubmit(term); else navigate(`/?q=${encodeURIComponent(term)}`);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange('');
    setSuggestions([]);
    setCategorySuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Voice search (Web Speech API)
  const startVoice = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) return;
      const rec = new SpeechRecognition();
      rec.lang = 'en-US';
      rec.interimResults = true;
      let finalText = '';
      rec.onresult = (e) => {
        let t = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          t += e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText = t;
        }
        onChange(t);
      };
      rec.onerror = () => { };
      rec.onend = () => {
        const q = (finalText || value || '').trim();
        if (q && onSubmit) onSubmit(q);
      };
      rec.start();
    } catch (_) { }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative group">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 group-focus-within:text-purple-600 transition-colors pointer-events-none z-10">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            // Warm the Search page chunk for faster navigation
            try { import('./SearchPage'); } catch (_) { }
            if ((!showOnlySearchSuggestions && suggestions.length > 0) || (showOnlySearchSuggestions && filteredRecentSearches.length > 0)) setShowDropdown(true);
          }}
          placeholder={placeholder}
          className="w-full pl-10 pr-20 py-3 rounded-2xl bg-white/50 backdrop-blur-md border border-white/20 text-sm font-medium text-gray-800 placeholder:text-gray-500 hover:bg-white/60 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent focus:bg-white/80 shadow-inner hover:shadow-lg transition-all duration-300"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Search products"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          role="combobox"
        />

        {/* Right-side controls: clear + voice */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          {enableVoice && (
            <button
              type="button"
              onClick={startVoice}
              className="p-1 text-purple-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200"
              aria-label="Voice search"
              title="Voice search"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 1a3 3 0 00-3 3v6a3 3 0 006 0V4a3 3 0 00-3-3zm5 10a5 5 0 01-10 0M12 19v4m-4 0h8" />
              </svg>
            </button>
          )}
          {value?.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200"
              aria-label="Clear search"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <span className="absolute right-9 top-1/2 -translate-y-1/2 text-purple-500 animate-spin pointer-events-none" aria-hidden="true">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeOpacity=".25" strokeWidth="4" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeWidth="4" />
            </svg>
          </span>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && (isLoading || categorySuggestions.length > 0 || suggestions.length > 0 || (showOnlySearchSuggestions && (filteredRecentSearches.length > 0 || filteredTrending.length > 0))) && (
        <div
          id="search-suggestions"
          className="
            md:absolute md:top-full md:mt-2 md:w-full md:rounded-2xl md:border md:border-white/20 md:shadow-2xl md:max-h-[80vh]
            fixed inset-x-0 top-[70px] bottom-0 z-50 bg-white/95 backdrop-blur-2xl overflow-y-auto overscroll-contain
            animate-fadeIn backdrop-saturate-150 border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]
          "
          role="listbox"
        >
          {/* Mobile Closer Handle */}
          <div className="md:hidden flex justify-center py-2 sticky top-0 bg-white/50 backdrop-blur z-10" onClick={() => setShowDropdown(false)}>
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>

          {/* Loading indicator */}
          {isLoading && value && value.trim().length >= 2 && (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2 bg-white/50">
              <svg className="animate-spin h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching...
            </div>
          )}
          {showOnlySearchSuggestions && showSectionHeaders && (filteredRecentSearches.length > 0 || filteredTrending.length > 0) && !isLoading && (
            <div className="px-3 pt-3 text-[11px] uppercase tracking-wide text-gray-500">Suggestions</div>
          )}
          {showOnlySearchSuggestions && filteredRecentSearches.length > 0 && (
            <div className="divide-y border-b border-gray-100">
              {showSectionHeaders && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 flex items-center justify-between">
                  <span>Recent</span>
                  <button
                    type="button"
                    onClick={() => { try { clearRecentSearches(); } catch (_) { }; setRecentSearches([]); setSelectedIndex(-1); if (!filteredTrending.length) setShowDropdown(false); }}
                    className="text-[11px] font-medium text-gray-500 hover:text-purple-600"
                  >
                    Clear
                  </button>
                </div>
              )}
              {filteredRecentSearches.slice(0, 6).map((term, idx) => (
                <button key={`recent-${term}-${idx}`} onClick={() => handleClickTerm(term, 'recent')} className={`flex items-center gap-3 p-3 hover:bg-purple-500/5 transition-colors w-full text-left ${selectedIndex === idx ? 'bg-purple-500/10' : ''}`}>
                  <div className="flex-1 text-sm font-medium text-gray-900 truncate">{term}</div>
                </button>
              ))}
            </div>
          )}
          {showOnlySearchSuggestions && filteredTrending.length > 0 && (
            <div className="divide-y border-b border-gray-100">
              {showSectionHeaders && (<div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50">Trending</div>)}
              {filteredTrending.slice(0, 6).map((term, idx) => {
                const baseIndex = filteredRecentSearches.length;
                const absoluteIndex = baseIndex + idx;
                return (
                  <button key={`trend-${term}-${idx}`} onClick={() => handleClickTerm(term, 'trending')} className={`flex items-center gap-3 p-3 hover:bg-purple-500/5 transition-colors w-full text-left ${selectedIndex === absoluteIndex ? 'bg-purple-500/10' : ''}`}>
                    <div className="flex-1 text-sm font-medium text-gray-900 truncate">{term}</div>
                    <span className="text-xs text-gray-400">Popular</span>
                  </button>
                );
              })}
            </div>
          )}
          {(!showOnlySearchSuggestions && categorySuggestions.length > 0) && (
            <div className="divide-y border-b border-gray-100">
              {categorySuggestions.map((c, cIndex) => (
                <button
                  key={`cat-${c.slug}`}
                  onClick={() => handleCategoryClick(c.slug)}
                  className={`flex items-center gap-3 p-3 hover:bg-purple-500/5 transition-colors duration-150 w-full text-left ${selectedIndex === cIndex ? 'bg-purple-500/10' : ''}`}
                  aria-selected={selectedIndex === cIndex}
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                    <img src={getImageUrl(c.image)} alt={c.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { try { e.target.onerror = null; e.target.src = `${window.location.origin}/og-image.jpg`; } catch (_) { } }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.count} items</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          )}
          {filteredRecentSearches.length > 0 && (
            <div className="divide-y border-b border-gray-100">
              {filteredRecentSearches.map((term, idx) => (
                <button key={`recent-${term}-${idx}`} onClick={() => handleClickTerm(term, 'recent')} className="flex items-center gap-3 p-3 hover:bg-purple-500/5 transition-colors w-full text-left">
                  <div className="flex-1 text-sm font-medium text-gray-900 truncate">{term}</div>
                  <span className="text-xs text-gray-400">Recent</span>
                </button>
              ))}
            </div>
          )}
          {suggestions.map((product, index) => (
            <Link
              key={product.id}
              to={`/product/${product.slug || product.id}`}
              onClick={(e) => handleSuggestionNavigate(e, product)}
              className={`flex items-center gap-3 p-3 hover:bg-purple-500/5 transition-colors duration-150 border-b border-gray-100/50 last:border-0 ${(categorySuggestions.length + index) === selectedIndex ? 'bg-purple-500/10' : ''
                }`}
              role="option"
              aria-selected={(categorySuggestions.length + index) === selectedIndex}
            >
              {/* Product Image */}
              <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={getImageUrl(product.image)}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => { try { e.target.onerror = null; e.target.src = `${window.location.origin}/og-image.jpg`; } catch (_) { } }}
                />
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900 truncate">
                  {renderHighlightedTitle(product.title, value)}
                </h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-purple-600 font-medium">
                    {Array.isArray(product.category) ? product.category.join(', ') : product.category}
                  </span>
                  {product.stock === 0 && (
                    <span className="text-xs text-red-600 font-medium">
                      • Sold Out
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="flex-shrink-0 text-right">
                {Number(product.price) > 0 ? (
                  <span className="text-sm font-semibold text-purple-700">
                    Rs. {Number(product.price).toLocaleString('en-PK')}
                  </span>
                ) : (
                  <span className="text-xs text-gray-500">Contact</span>
                )}
              </div>

              {/* Arrow Icon */}
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}

          {/* View All Results Link */}
          {value && value.trim().length > 0 && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  try { addSearchTerm(value); } catch (err) { }
                  try { fetch(`${API_BASE_URL}/api/search/log`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ term: value }) }); } catch (_) { }
                  if (onSubmit) {
                    onSubmit(value);
                    return;
                  }
                  // Fallback navigation
                  navigate(`/?q=${encodeURIComponent(value)}`);
                }}
                className="w-full text-center text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
              >
                View all results for "{value}"
              </button>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {showDropdown && !isLoading && value?.trim().length >= 2 && suggestions.length === 0 && categorySuggestions.length === 0 && !showOnlySearchSuggestions && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-purple-200 rounded-2xl shadow-xl p-6 text-center animate-fadeIn">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 text-sm">No products found for "{value}"</p>
          <p className="text-gray-400 text-xs mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
