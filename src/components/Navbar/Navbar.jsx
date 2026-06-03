'use client';

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import logo from "../../assets/logo.png";
import SearchAutocomplete from "../Search/SearchAutocomplete";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { getCartItemsCount, toggleCart } = useCart();
  const { wishlistItems } = useWishlist();
  const router = useRouter();
  const pathname = usePathname();
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

    if (pathname !== "/") {
      router.push("/");
      setTimeout(performScroll, 150);
    } else {
      performScroll();
    }
  }, [pathname, router, closeMenu]);

  // Instagram username with fallback
  const instagramUsername = useMemo(
    () => process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME || "coolcache",
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
        router.push('/search');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [router]);

  // Memoize active route checks
  const isHomePage = pathname === "/";
  const isCategoryPage = pathname.startsWith('/category');
  const isRecommendationsPage = pathname.startsWith('/recommendations');

  return (
    <nav className="fixed w-full top-0 z-50 will-change-transform">
      {/* Announcement bar - Silent Luxury Style */}
      <div className="bg-luxury-black text-stone-300 text-[10px] md:text-[11px] uppercase tracking-[0.2em] h-7 flex items-center justify-center border-b border-stone-800/50">
        <div className="animate-fade-in-up flex items-center gap-4">
          <span className="opacity-90">Open‑box delivery across Karachi</span>
          <span className="w-1 h-1 bg-luxury-gold rounded-full opacity-50"></span>
          <span className="opacity-90">Free Shipping over Rs. 4999</span>
        </div>
      </div>

      <div className="bg-stone-50/95 backdrop-blur-2xl shadow-sm border-b border-stone-200/50" style={{ height: 'var(--nav-height)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full">
          <div className="flex items-center justify-between h-full gap-2">
            {/* Logo - Always visible */}
            <div className="flex items-center flex-shrink-0">
              <Link
                href="/"
                onClick={(e) => scrollToSection(e, "home")}
                className="flex items-center gap-3 group hover:opacity-95 transition-all duration-300"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-luxury-gold/10 rounded-full blur-md transform scale-110 group-hover:scale-125 transition-transform duration-300"></div>
                  <img
                    src={logo.src || logo}
                    alt="CoolCache"
                    width="40"
                    height="40"
                    className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 relative filter grayscale brightness-90 group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <div className="hidden sm:flex sm:flex-col">
                  <span className="font-serif text-lg sm:text-xl md:text-[22px] font-bold text-luxury-black tracking-tight leading-tight">
                    CoolCache
                  </span>
                  <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.3em] text-stone-500 font-medium leading-none">
                    Curated Archive
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <div className="hidden md:flex items-center justify-center flex-1 gap-1 lg:gap-6">
              <Link
                href="/categories"
                className={`px-2 py-2 text-[11px] uppercase tracking-[0.2em] font-medium transition-all duration-300 ${isCategoryPage ? 'text-luxury-gold' : 'text-stone-600 hover:text-luxury-black'}`}
              >
                Archive
              </Link>
              <Link
                href="/recommendations"
                className={`px-2 py-2 text-[11px] uppercase tracking-[0.2em] font-medium transition-all duration-300 ${isRecommendationsPage ? 'text-luxury-gold' : 'text-stone-600 hover:text-luxury-black'}`}
              >
                Curated
              </Link>
              {/* Inline Search - Desktop */}
              <div className="hidden lg:block w-64 mr-4">
                <SearchAutocomplete
                  value={navSearch}
                  onChange={setNavSearch}
                  onSubmit={(val) => {
                    const q = (typeof val === 'string' && val.length ? val : navSearch).trim();
                    if (q) {
                      router.push(`/search?q=${encodeURIComponent(q)}`);
                      setNavSearch("");
                    }
                  }}
                  placeholder="DISCOVER PIECES..."
                  enableAutocomplete={false}
                  showOnlySearchSuggestions={false}
                  enableVoice={true}
                  showTrendingSuggestions={false}
                  showSectionHeaders={false}
                  className="search-silent-luxury"
                />
              </div>

              {/* Action Icons - Desktop */}
              <div className="flex items-center gap-2 border-l border-stone-200 pl-4">
                <button
                  onClick={() => router.push('/my-orders')}
                  aria-label="Account"
                  className="p-2 text-stone-600 hover:text-luxury-black transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </button>

                <Link
                  href="/wishlist"
                  className="relative p-2 text-stone-600 hover:text-luxury-black transition-colors"
                  aria-label="Wishlist"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                  {wishlistCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-luxury-gold text-white text-[8px] font-bold rounded-full h-3 w-3 flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <button
                  onClick={toggleCart}
                  className="relative p-2 text-stone-600 hover:text-luxury-black transition-colors"
                  aria-label="Cart"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                  {cartItemsCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-luxury-black text-white text-[8px] font-bold rounded-full h-3 w-3 flex items-center justify-center">
                      {cartItemsCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Icons - Simplified & Cleaner */}
            <div className="flex items-center gap-2 sm:gap-3 md:hidden">
              {/* Search Button */}
              <button
                onClick={() => router.push('/search')}
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
                href="/"
                onClick={(e) => { scrollToSection(e, "home"); closeMenu(); }}
                className={`block px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 ${isHomePage ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 shadow-sm' : 'text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50'}`}
              >
                Home
              </Link>
              <Link
                href="/my-orders"
                onClick={closeMenu}
                className="block px-4 py-3.5 rounded-xl text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-200"
              >
                My Orders
              </Link>
              <Link
                href="/"
                onClick={(e) => { scrollToSection(e, "products"); closeMenu(); }}
                className="block px-4 py-3.5 rounded-xl text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-200"
              >
                Products
              </Link>
              <Link
                href="/categories"
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
                  <Link href="/category/Watch" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200 text-center">Watches</Link>
                  <Link href="/category/Electronics" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200 text-center">Electronics</Link>
                  <Link href="/category/Drinkware" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200 text-center">Drinkware</Link>
                  <Link href="/category/Bags" onClick={closeMenu} className="px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:text-purple-600 border border-gray-200 hover:border-purple-300 hover:shadow-sm transition-all duration-200 text-center">Bags</Link>
                </div>
              </div>

              <Link
                href="/recommendations"
                onClick={closeMenu}
                className={`block px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200 ${isRecommendationsPage ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 shadow-sm' : 'text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50'}`}
              >
                For You
              </Link>
              <Link
                href="/wishlist"
                onClick={closeMenu}
                className="flex items-center justify-between px-4 py-3.5 rounded-xl text-base font-semibold text-gray-700 hover:text-pink-600 hover:bg-gradient-to-r hover:from-pink-50/50 hover:to-purple-50/50 transition-all duration-200"
              >
                <span>Wishlist</span>
                {wishlistCount > 0 && <span className="px-2.5 py-0.5 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-full">{wishlistCount}</span>}
              </Link>
              <Link
                href="/"
                onClick={(e) => { scrollToSection(e, "reviews"); closeMenu(); }}
                className="block px-4 py-3.5 rounded-xl text-base font-semibold text-gray-700 hover:text-purple-600 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-pink-50/50 transition-all duration-200"
              >
                Reviews
              </Link>
              <Link
                href="/"
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
