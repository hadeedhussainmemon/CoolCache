import { useState, useEffect, useMemo, useRef } from 'react';
import useRecentSearches, { getTrendingCategoriesFromSearches } from '../../hooks/useRecentSearches';
import { Link } from 'react-router-dom';

function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const recent = useRecentSearches();
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const scrollRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.__APP_CONFIG__?.API_BASE_URL || '';

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Use the dedicated categories endpoint instead of fetching all products
        // Support absolute API_BASE_URL or relative paths
        const base = (API_BASE_URL || '').replace(/\/$/, '');
        const url = base ? `${base}/api/products/categories` : `/api/products/categories`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Backend returns { categories: [...] }
        const categoriesData = data.categories || [];

        if (!categoriesData || categoriesData.length === 0) {
          setCategories([]);
          setLoading(false);
          return;
        }

        // categoriesData already contains alias categories where present in products
        setCategories(categoriesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Set empty array on error so component still renders
        setCategories([]);
        setLoading(false);
      }
    };

    fetchCategories();
  }, [API_BASE_URL]);

  // Better inline SVG icons for categories (consistent style)
  const Icon = ({ name }) => {
    const lc = String(name || '').toLowerCase();
    const commonProps = {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      className: 'w-7 h-7 text-white drop-shadow-sm'
    };

    if (lc.includes('watch')) {
      return (
        <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 9v3l2 1" />
          <rect x="8.5" y="1.5" width="7" height="4" rx="1" />
          <rect x="8.5" y="18.5" width="7" height="4" rx="1" />
        </svg>
      );
    }

    if (lc.includes('wallet')) {
      return (
        <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M17 10h3v4h-3a2 2 0 1 1 0-4z" />
        </svg>
      );
    }

    if (lc.includes('bag')) {
      return (
        <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 7h12l1.5 12a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2L6 7z" />
          <path d="M9 7a3 3 0 0 1 6 0" />
        </svg>
      );
    }

    if (lc.includes('drink') || lc.includes('bottle') || lc.includes('tumbler')) {
      return (
        <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2h4v3h-4z" />
          <path d="M9 5h6l-1 15a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2L9 5z" />
        </svg>
      );
    }

    if (lc.includes('keychain') || lc.includes('key')) {
      return (
        <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="3.5" />
          <path d="M11.3 10.3l2.7 2.7M14 13l3 0 0 3 2 0 0 2" />
        </svg>
      );
    }

    if (lc.includes('gift')) {
      return (
        <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="12" rx="2" />
          <path d="M3 12h18M12 8v12" />
          <path d="M7.5 8a2.5 2.5 0 1 1 0-5c2 0 3.5 2.5 3.5 5H7.5zM16.5 8c0-2.5-1.5-5-3.5-5a2.5 2.5 0 1 0 0 5h3.5z" />
        </svg>
      );
    }

    // default sparkle
    return (
      <svg {...commonProps} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5z" />
      </svg>
    );
  };

  const toSlug = (name) => encodeURIComponent(String(name).trim().toLowerCase().replace(/\s+/g, '-'));

  // Create duplicated list for seamless marquee on small screens
  // Compute trending categories from recent searches and API categories
  const trendingNames = useMemo(() => getTrendingCategoriesFromSearches(categories, 6), [categories]);

  // Show limited categories by default
  const VISIBLE_COUNT = 18;

  // Combine trending categories and standard categories, removing duplicates
  const mergedCategories = useMemo(() => {
    const seen = new Set();
    const list = [];
    // trending first
    trendingNames.forEach(name => {
      if (!seen.has(name)) {
        const found = (categories || []).find(c => String(c.name).toLowerCase() === String(name).toLowerCase());
        if (found) {
          list.push(found);
          seen.add(found.name);
        } else {
          list.push({ name, count: null });
          seen.add(name);
        }
      }
    });
    // then rest of categories (excluding those already added)
    (categories || []).forEach(c => {
      if (!seen.has(c.name)) {
        list.push(c);
        seen.add(c.name);
      }
    });
    return list;
  }, [trendingNames, categories]);

  // No additional alias counts needed — the server provides counts via /api/products/categories

  const visibleCategories = useMemo(() => (showAll ? mergedCategories : mergedCategories.slice(0, VISIBLE_COUNT)), [showAll, mergedCategories]);
  const marqueeItems = useMemo(() => {
    if (!visibleCategories || visibleCategories.length === 0) return [];
    // duplicate 2x for smooth loop
    return [...visibleCategories, ...visibleCategories];
  }, [visibleCategories]);

  // Drag to scroll handlers
  const handleMouseDown = (e) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  if (loading) {
    return (
      <section className="py-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse h-32 bg-gray-200 rounded-2xl"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-playfair font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
            Shop by Category
          </h2>
          <p className="text-gray-600 text-sm">Explore our collections</p>
        </div>

        {/* Breadcrumb structured data for the categories landing context (Home > Categories) */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.coolcache.app/' },
              { '@type': 'ListItem', position: 2, name: 'Categories', item: 'https://www.coolcache.app/categories' }
            ]
          })
        }} />

        {/* Mobile: native horizontal scroll (no marquee) */}
        <div className="md:hidden">
          <div
            className="flex gap-4 overflow-x-auto pb-6 -mb-6 px-1 snap-x scrollbar-hide"
            style={{ overscrollBehaviorX: 'contain' }}
          >
            {visibleCategories.map((category, idx) => (
              <Link
                key={`${category.name}-${idx}`}
                to={`/category/${toSlug(category.name)}`}
                className="group/item flex-shrink-0 w-28 snap-start"
              >
                <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-200 hover:border-purple-300 transition-all duration-300 active:scale-95 h-full flex flex-col items-center justify-between">
                  <div className="mb-2 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md group-hover/item:scale-105 transition-transform">
                      <Icon name={category.name} />
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-center text-gray-800 mb-1 line-clamp-2 capitalize group-hover/item:text-purple-600 w-full leading-tight">
                    {category.name}
                  </h3>
                  {typeof category.count === 'number' && (
                    <p className="text-[10px] text-gray-500 text-center">{category.count} items</p>
                  )}
                </div>
              </Link>
            ))}
            {/* Spacer for proper end padding */}
            <div className="w-1 flex-shrink-0" />
          </div>
        </div>

        {/* Desktop/tablet: draggable scroll with auto-scroll */}
        <div className="hidden md:block relative group">
          <div
            ref={scrollRef}
            className="category-marquee-desktop relative overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing rounded-lg"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            onMouseEnter={(e) => {
              e.currentTarget.classList.add('paused');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.classList.remove('paused');
            }}
          >
            <div className="marquee-track-desktop inline-flex gap-4 will-change-transform pb-2">
              {[...visibleCategories, ...visibleCategories].map((category, idx) => (
                <Link
                  key={`${category.name}-${idx}`}
                  to={`/category/${toSlug(category.name)}`}
                  className="group/item flex-shrink-0 w-32 snap-center"
                  onClick={(e) => {
                    if (isDragging) e.preventDefault();
                  }}
                >
                  <div className="bg-white rounded-2xl p-4 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-purple-300 hover:scale-105 active:scale-95">
                    <div className="mb-2 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-2xl grid place-items-center bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-md group-hover/item:scale-105 transition-transform">
                        <Icon name={category.name} />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-center text-gray-800 mb-1 capitalize group-hover/item:text-purple-600 transition-colors">{category.name}</h3>
                    {typeof category.count === 'number' && (
                      <p className="text-xs text-gray-500 text-center">{category.count} items</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-12 h-full bg-gradient-to-r from-gray-50 to-transparent pointer-events-none z-10"></div>
            <div className="absolute top-1/2 -translate-y-1/2 right-0 w-12 h-full bg-gradient-to-l from-gray-50 to-transparent pointer-events-none z-10"></div>
          </div>
        </div>

        {/* Show more / show less */}
        {mergedCategories.length > VISIBLE_COUNT && (
          <div className="flex items-center justify-center mt-6">
            <button
              type="button"
              onClick={() => setShowAll(v => !v)}
              className="px-5 py-2 bg-white text-purple-600 border border-purple-200 rounded-full shadow-sm hover:bg-purple-50">
              {showAll ? 'Show fewer' : `Show all (${mergedCategories.length})`}
            </button>
          </div>
        )}
      </div>

      {/* Add custom scrollbar styling */}
      <style>{`

        
        /* desktop marquee with drag scroll */
        .category-marquee-desktop {
          width: 100%;
          overflow-x: auto;
          scroll-behavior: smooth;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .marquee-track-desktop {
          animation: marquee-desktop 40s linear infinite;
          animation-play-state: running;
        }
        .category-marquee-desktop.paused .marquee-track-desktop {
          animation-play-state: paused !important;
        }
        .category-marquee-desktop:active {
          cursor: grabbing;
        }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-desktop {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}

export default CategoryGrid;
