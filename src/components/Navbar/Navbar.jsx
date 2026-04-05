import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import logo from "../../assets/logo.png";
import SearchAutocomplete from "../Search/SearchAutocomplete";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { getCartItemsCount, toggleCart } = useCart();
  const { wishlistItems } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();
  const cartItemsCount = getCartItemsCount();
  const wishlistCount = wishlistItems.length;
  const [navSearch, setNavSearch] = useState("");

  // Memoized close handler
  const closeMenu = useCallback(() => setIsOpen(false), []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e) => {
      const target = e.target;
      if (
        target instanceof Element &&
        !target.closest(".mobile-menu") &&
        !target.closest(".menu-button")
      ) {
        closeMenu();
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [isOpen, closeMenu]);

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeMenu();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeMenu]);

  // Optimized smooth scroll function with requestAnimationFrame
  const scrollToSection = useCallback((e, sectionId) => {
    e.preventDefault();
    closeMenu();

    const performScroll = () => {
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 92; // navbar + announcement height
        const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementTop - offset;

        requestAnimationFrame(() => {
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        });
      }
    };

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(performScroll, 150);
    } else {
      performScroll();
    }
  }, [location.pathname, navigate, closeMenu]);

  // Instagram username with fallback
  const instagramUsername = useMemo(
    () => import.meta.env.VITE_INSTAGRAM_USERNAME || "coolcache",
    []
  );

  // Ensure body has padding for pages with navbar
  useEffect(() => {
    document.body.classList.add('has-fixed-nav');
    return () => document.body.classList.remove('has-fixed-nav');
  }, []);

  // Keyboard shortcut: Ctrl/Cmd + K to open search
  useEffect(() => {
    const onKey = (e) => {
      // Ignore when typing in inputs to avoid interrupting users
      const el = e.target;
      if (el && el.tagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/search');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  // Memoize active route checks
  const isHomePage = location.pathname === "/";
  const isCategoryPage = location.pathname.startsWith('/category');
  const isRecommendationsPage = location.pathname.startsWith('/recommendations');

  return (
    <nav className="fixed w-full top-0 z-50 will-change-transform">
      {/* Announcement bar */}
      <div className="bg-emerald-600 text-white text-[11px] md:text-xs overflow-hidden cursor-grab active:cursor-grabbing h-8 flex items-center">
        {/* Mobile marquee with user control */}
        <div
          className="md:hidden relative w-full h-full flex items-center scrollable-announcement overflow-x-auto scrollbar-hide"
          onTouchStart={(e) => {
            e.currentTarget.classList.add('paused');
          }}
          onTouchEnd={(e) => {
            setTimeout(() => e.currentTarget.classList.remove('paused'), 2000);
          }}
          onMouseEnter={(e) => {
            e.currentTarget.classList.add('paused');
          }}
          onMouseLeave={(e) => {
            e.currentTarget.classList.remove('paused');
          }}
        >
          <div className="absolute inset-y-0 left-0 animate-scroll-rtl whitespace-nowrap flex items-center pointer-events-none" aria-hidden="true">
            <span className="mx-3">🎁 Open‑box delivery across Karachi</span>
            <span className="mx-2 opacity-80">•</span>
            <span className="mx-3">Inspect your order on delivery</span>
            <span className="mx-2 opacity-80">•</span>
            <span className="mx-3">💰 Cash on Delivery Available</span>
            <span className="mx-2 opacity-80">•</span>
            <span className="mx-3">🚚 Free Shipping on Orders Over Rs. 4999</span>
            <span className="mx-2 opacity-80">•</span>
          </div>
          <div className="absolute inset-y-0 left-0 animate-scroll-rtl2 whitespace-nowrap flex items-center pointer-events-none" aria-hidden="true">
            <span className="mx-3">🎁 Open‑box delivery across Karachi</span>
            <span className="mx-2 opacity-80">•</span>
            <span className="mx-3">Inspect your order on delivery</span>
            <span className="mx-2 opacity-80">•</span>
            <span className="mx-3">💰 Cash on Delivery Available</span>
            <span className="mx-2 opacity-80">•</span>
            <span className="mx-3">🚚 Free Shipping on Orders Over Rs. 4999</span>
            <span className="mx-2 opacity-80">•</span>
          </div>
          <div className="sr-only" role="status" aria-live="polite">
            Open‑box delivery across Karachi • Inspect your order on delivery • Cash on Delivery Available • Free Shipping on Orders Over Rs. 4999
          </div>
        </div>
        {/* Desktop static line */}
        {/* Desktop marquee with user control */}
        <div
          className="hidden md:block relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing scrollable-announcement"
          onMouseEnter={(e) => {
            e.currentTarget.classList.add('paused');
          }}
          onMouseLeave={(e) => {
            e.currentTarget.classList.remove('paused');
          }}
        >
          <div className="absolute inset-y-0 left-0 animate-scroll-rtl whitespace-nowrap flex items-center pointer-events-none">
            <span className="mx-4">🎁 Open‑box delivery across Karachi</span>
            <span className="mx-2 opacity-80">•</span>
            <span className="mx-4">Inspect your order on delivery</span>
            <span className="mx-2 opacity-80">•</span>
            <span className="mx-4">💰 Cash on Delivery Available</span>
            <span className="mx-2 opacity-80">•</span>
            <span className="mx-4">🚚 Free Shipping on Orders Over Rs. 4999</span>
            <span className="mx-2 opacity-80">•</span>
          </div>
          <div className="absolute inset-y-0 left-0 animate-scroll-rtl2 whitespace-nowrap flex items-center pointer-events-none">
            <span className="mx-4">🎁 Open‑box delivery across Karachi</span>
            <span className="mx-2 opacity-80">•</span>
            <span className="mx-4">Inspect your order on delivery</span>
            <span className="mx-2 opacity-80">•</span>
            <span className="mx-4">💰 Cash on Delivery Available</span>
            <span className="mx-2 opacity-80">•</span>
            <span className="mx-4">🚚 Free Shipping on Orders Over Rs. 4999</span>
            <span className="mx-2 opacity-80">•</span>
          </div>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-2xl shadow-lg border-b border-gray-100/50" style={{ height: 'var(--nav-height)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full gap-2">
            {/* Logo - Always visible */}
            <div className="flex items-center flex-shrink-0">
              <Link
                to="/"
                onClick={(e) => scrollToSection(e, "home")}
                className="flex items-center gap-2 group hover:opacity-95 transition-all duration-300"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-500/15 to-purple-600/10 rounded-full blur-md transform scale-110 group-hover:scale-125 transition-transform duration-300"></div>
                  <img
                    src={logo}
                    alt="CoolCache"
                    width="44"
                    height="44"
                    className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 relative transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                  />
                </div>
                <div className="hidden sm:flex sm:flex-col">
                  <span className="font-playfair text-lg sm:text-xl md:text-[22px] font-bold bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 bg-clip-text text-transparent transition-all duration-300 group-hover:from-pink-500 group-hover:to-purple-600 leading-tight">
                    CoolCache
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.12em] sm:tracking-[0.15em] text-purple-600/70 font-semibold group-hover:text-purple-700/90 transition-colors leading-none">
                    Everything in one cart
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center justify-center flex-1 gap-1 lg:gap-3">

              <Link
                to="/categories"
                className={`px-4 py-2 text-sm font-semibold transition-all duration-200 rounded-xl ${isCategoryPage ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 shadow-sm' : 'text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50'}`}
              >
                Categories
              </Link>
              <a
                href="https://books.coolcache.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-200 rounded-xl"
              >
                Books
              </a>
              {/* Quick category shortcuts (responsive) */}
              <div className="hidden lg:flex items-center gap-2">
                <Link to="/category/Watch" onMouseEnter={() => { try { import('../Category/CategoryPage'); } catch (_) { } }} className="px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 hover:shadow-sm transition-all duration-200">Watches</Link>
                <Link to="/category/Electronics" onMouseEnter={() => { try { import('../Category/CategoryPage'); } catch (_) { } }} className="px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 hover:shadow-sm transition-all duration-200">Electronics</Link>
                <Link to="/category/Drinkware" onMouseEnter={() => { try { import('../Category/CategoryPage'); } catch (_) { } }} className="px-3 py-2 text-sm font-medium rounded-lg text-gray-600 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 hover:shadow-sm transition-all duration-200">Drinkware</Link>
              </div>
              <Link
                to="/recommendations"
                className={`px-4 py-2 text-sm font-semibold transition-all duration-200 rounded-xl ${isRecommendationsPage ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 shadow-sm' : 'text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50'}`}
              >
                For You
              </Link>
              {/* Inline Search - Desktop */}
              <div className="hidden lg:block w-72">
                <SearchAutocomplete
                  value={navSearch}
                  onChange={setNavSearch}
                  onSubmit={(val) => {
                    const q = typeof val === 'string' && val.length ? val : navSearch;
                    if (q && q.trim()) {
                      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
                      setNavSearch("");
                    }
                  }}
                  placeholder="Search…"
                  enableAutocomplete={false}
                  showOnlySearchSuggestions={false}
                  enableVoice={true}
                  showTrendingSuggestions={false}
                  showSectionHeaders={false}
                  className="min-w-0"
                />
              </div>
              <a
                href={`https://www.instagram.com/${instagramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 px-3 py-2 text-sm font-medium transition duration-150"
              >
                <div className="flex items-center space-x-2 group">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 opacity-0 group-hover:opacity-40 blur transition-all duration-300"></div>
                    <svg
                      className="relative w-5 h-5 transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                      viewBox="0 0 24 24"
                    >
                      <defs>
                        <linearGradient
                          id="instagramGradient"
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#feda75" />
                          <stop offset="25%" stopColor="#fa7e1e" />
                          <stop offset="50%" stopColor="#d62976" />
                          <stop offset="75%" stopColor="#962fbf" />
                          <stop offset="100%" stopColor="#4f5bd5" />
                        </linearGradient>
                      </defs>
                      <path
                        fill="url(#instagramGradient)"
                        d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.508-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z"
                      />
                    </svg>
                  </div>
                </div>
              </a>

              {/* My Orders Icon - Desktop */}
              <button
                onClick={() => navigate('/my-orders')}
                aria-label="My Orders"
                className="p-2.5 text-gray-600 hover:text-purple-600 transition-all duration-200 group rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:shadow-md"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Search Icon - Desktop (quick access) */}
              <button onClick={() => navigate('/search')} onMouseEnter={() => { try { import('../Search/SearchPage'); } catch (_) { } }} aria-label="Open search" className="p-2.5 text-gray-600 hover:text-purple-600 transition-all duration-200 group rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:shadow-md">
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </button>
              {/* Wishlist Icon - Desktop */}
              <Link
                to="/wishlist"
                className="relative p-2.5 text-gray-600 hover:text-pink-600 transition-all duration-200 group rounded-xl hover:bg-gradient-to-br hover:from-pink-50 hover:to-purple-50 hover:shadow-md"
                aria-label="Wishlist"
              >
                <div className="relative">
                  <svg
                    className="w-5 h-5 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-md">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </div>
              </Link>

              {/* Cart Icon - Desktop */}
              <button
                onClick={toggleCart}
                className="relative p-2.5 text-gray-600 hover:text-purple-600 transition-all duration-200 group rounded-xl hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:shadow-md"
                aria-label="Shopping cart"
              >
                <div className="relative">
                  <svg
                    className="w-5 h-5 transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-md">
                      {cartItemsCount > 9 ? '9+' : cartItemsCount}
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Mobile Icons - Simplified & Cleaner */}
            <div className="flex items-center gap-2 sm:gap-3 md:hidden">
              {/* Search Button */}
              <button
                onClick={() => navigate('/search')}
                aria-label="Search"
                className="p-2.5 text-gray-600 hover:text-purple-600 transition-all duration-200 rounded-lg hover:bg-purple-50 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10 18a8 8 0 100-16 8 8 0 000 16z" />
                </svg>
              </button>

              {/* Cart Button */}
              <button
                onClick={toggleCart}
                className="relative p-2.5 text-gray-600 hover:text-purple-600 transition-all duration-200 rounded-lg hover:bg-purple-50 active:scale-95"
                aria-label="Shopping cart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-md">
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </span>
                )}
              </button>

              <button
                className="text-gray-600 hover:text-purple-600 focus:outline-none menu-button p-2 rounded-md"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close menu" : "Open menu"}
                aria-expanded={isOpen}
                aria-controls="mobile-menu"
              >
                <svg
                  className={`h-6 w-6 transform transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={
                      isOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden mobile-menu bg-white/95 backdrop-blur-2xl shadow-2xl border-t border-gray-100 animate-slideIn" id="mobile-menu">
            <div className="px-4 pt-4 pb-5 space-y-2">
              <Link
                to="/"
                onClick={(e) => { scrollToSection(e, "home"); closeMenu(); }}
                className={`block px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 ${isHomePage ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 shadow-sm' : 'text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50'}`}
              >
                Home
              </Link>
              <Link
                to="/my-orders"
                onClick={closeMenu}
                className="block px-4 py-3.5 rounded-xl text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-200"
              >
                My Orders
              </Link>
              <Link
                to="/"
                onClick={(e) => { scrollToSection(e, "products"); closeMenu(); }}
                className="block px-4 py-3.5 rounded-xl text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-200"
              >
                Products
              </Link>
              <Link
                to="/categories"
                onClick={closeMenu}
                className={`block px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 ${isCategoryPage ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 shadow-sm' : 'text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50'}`}
              >
                All Categories
              </Link>
              <a
                href="https://books.coolcache.app/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenu}
                className="block px-4 py-3.5 rounded-xl text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-200"
              >
                Books
              </a>

              {/* Quick category shortcuts - mobile */}
              <div className="pt-2 pb-1">
                <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Popular</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/category/Watch" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200 text-center">Watches</Link>
                  <Link to="/category/Electronics" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200 text-center">Electronics</Link>
                  <Link to="/category/Drinkware" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200 text-center">Drinkware</Link>
                  <Link to="/category/Bags" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200 text-center">Bags</Link>
                </div>
              </div>

              <Link
                to="/recommendations"
                onClick={closeMenu}
                className={`block px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 ${isRecommendationsPage ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 shadow-sm' : 'text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50'}`}
              >
                For You
              </Link>
              <Link
                to="/wishlist"
                onClick={closeMenu}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-semibold text-gray-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-purple-50/50 transition-all duration-200"
              >
                <span>Wishlist</span>
                {wishlistCount > 0 && <span className="px-2.5 py-0.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-full">{wishlistCount}</span>}
              </Link>
              <Link
                to="/"
                onClick={(e) => { scrollToSection(e, "reviews"); closeMenu(); }}
                className="block px-4 py-3.5 rounded-xl text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-200"
              >
                Reviews
              </Link>
              <Link
                to="/"
                onClick={(e) => { scrollToSection(e, "faq"); closeMenu(); }}
                className="block px-4 py-3.5 rounded-xl text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-200"
              >
                FAQ
              </Link>
              <a
                href={`https://www.instagram.com/${instagramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600 hover:from-purple-100 hover:to-pink-100 transition-all duration-200 group mt-2"
              >
                <svg className="w-5 h-5 transform transition-transform group-hover:scale-110 group-hover:rotate-3" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="instagramGradientMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#feda75" />
                      <stop offset="25%" stopColor="#fa7e1e" />
                      <stop offset="50%" stopColor="#d62976" />
                      <stop offset="75%" stopColor="#962fbf" />
                      <stop offset="100%" stopColor="#4f5bd5" />
                    </linearGradient>
                  </defs>
                  <path fill="url(#instagramGradientMobile)" d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.508-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z" />
                </svg>
                <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Follow Us</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
