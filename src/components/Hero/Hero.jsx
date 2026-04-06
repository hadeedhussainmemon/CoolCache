'use client';
import React, { useEffect, useRef, useState } from "react";
import getImageUrl from '../../utils/imageUrl';

// Hero component with a lightweight image slider.
// - Accepts `images` prop: array of image URLs (your pictures). If not provided, uses the default image.
// - Autoplays slowly (7s), fades between slides, pauses on hover, and shows clickable indicators.
const Hero = ({ images = null, interval = 4000 }) => {
  // Use the backend-hosted hero images (these exist under Backend/public/images/hero)
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
  // Use centralized getImageUrl for constructing hero image URLs.
  const IMAGE_CDN = 'https://res.cloudinary.com/dend3adq0/image/upload';
  const defaultImages = [
    `${IMAGE_CDN}/hero/1.avif`,
    `${IMAGE_CDN}/hero/2.avif`,
    `${IMAGE_CDN}/hero/3.avif`,
    `${IMAGE_CDN}/hero/4.avif`,
    `${IMAGE_CDN}/hero/5.avif`,
    `${IMAGE_CDN}/hero/6.avif`,
    `${IMAGE_CDN}/hero/7.avif`,
    `${IMAGE_CDN}/hero/8.avif`,
    `${IMAGE_CDN}/hero/9.avif`,
  ];
  // slidesToShow will contain only images that successfully load.
  const [slidesToShow, setSlidesToShow] = useState([]);
  const candidateSlides = images && images.length ? images : defaultImages;

  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  // Detect mobile once on mount to avoid SSR/hydration mismatch
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug: log where hero images are loading from and which candidates are used
  // (debug logs removed)
  useEffect(() => {
    // no-op; kept to trigger re-evaluation when `images` prop changes
  }, [images]);

  // Preload candidate slides, but show them immediately for reliability.
  // We optimistically set slides first, then progressively refine if better variants load.
  useEffect(() => {
    let cancelled = false;

    const preload = (src, priority = false) =>
      new Promise((resolve) => {
        const img = new Image();
        if (priority) {
          img.fetchPriority = 'high';
          img.loading = 'eager';
        } else {
          img.loading = 'lazy';
        }
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = src;
      });

    // Enhanced image variant selection with better progressive loading
    const variantsFor = (base) => {
      if (!base) return [];
      // capture extension
      const m = base.match(/^(.*)\.(png|jpg|jpeg|webp|avif)$/i);
      const prefix = m ? m[1] : base.replace(/\.[^.]+$/, '');
      const ext = m ? m[2] : '';
      const tries = [];
      if (isMobile) {
        // mobile-first: optimized loading sequence
        tries.push(`${prefix}-thumb.avif`); // tiny thumb first
        tries.push(`${prefix}-thumb.webp`); // webp fallback
        tries.push(`${prefix}-sm.avif`);
        tries.push(`${prefix}-sm.webp`);
        tries.push(`${prefix}-sm.jpg`);
        tries.push(`${prefix}-sm.png`);
      } else {
        // desktop: optimized sequence with fallbacks
        tries.push(`${prefix}.avif`);
        tries.push(`${prefix}.webp`);
        tries.push(base);
        tries.push(`${prefix}-lg.jpg`);
      }
      return tries;
    };

    // 1) Show something immediately
    setSlidesToShow(candidateSlides);

    // 2) Progressive enhancement: try to load better variants; if none, keep current
    (async () => {
      try {
        const chosen = [];
        for (const base of candidateSlides) {
          const tries = variantsFor(base);
          let picked = null;
          for (const t of tries) {
            if (cancelled) break;
            // eslint-disable-next-line no-await-in-loop
            const ok = await preload(t);
            if (ok) { picked = t; break; }
          }
          chosen.push(picked || base);
        }
        if (cancelled) return;
        setSlidesToShow(chosen);
      } catch {
        // keep optimistic slides
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [images, isMobile]);

  // (debug logs removed)
  useEffect(() => {
    // no-op
  }, [slidesToShow]);

  // autoplay using slidesToShow
  useEffect(() => {
    if (isPaused) return;
    if (!slidesToShow || slidesToShow.length === 0) return;

    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % slidesToShow.length);
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [slidesToShow, interval, isPaused]);

  // Loading indicator while images are being prepared
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  useEffect(() => {
    if (!slidesToShow) return;
    setIsLoadingImages(slidesToShow.length === 0);
  }, [slidesToShow]);




  return (
    <section
      id="home"
      aria-label="Welcome to CoolCache Online Store"
      className="text-white py-8 md:py-20 relative overflow-hidden"
      itemScope
      itemType="https://schema.org/Store"
    >
      <meta itemProp="name" content="CoolCache Pakistan" />
      <meta itemProp="description" content="Shop trending electronics, smartwatches, wireless earbuds, power banks, premium gifts, lifestyle accessories & more across Pakistan. Fast delivery with COD available." />
      <meta itemProp="url" content="https://www.coolcache.app" />
      <link itemProp="image" href="https://www.coolcache.app/og-image.jpg" />

      {/* Mobile gradient background */}
      <div className="absolute inset-0 md:hidden bg-gradient-to-br from-blue-500 via-purple-600 to-blue-800 opacity-90" aria-hidden="true"></div>
      {/* Desktop gradient */}
      <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-cyan-300 to-blue-950" aria-hidden="true"></div>

      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center">
        <div
          className="w-full mt-6 relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="w-full h-[40vh] sm:h-[48vh] md:h-[460px] relative overflow-hidden md:rounded-2xl md:shadow-xl">
            <div className="flex flex-col md:flex-row h-full">
              {/* Desktop/tablet: left text, right image */}
              <div className="hidden md:flex w-3/5 items-center p-10">
                <div className="max-w-lg">
                  <h1 className="text-4xl lg:text-5xl font-playfair font-extrabold leading-tight text-white">
                    Everything in one cart
                  </h1>
                  <p className="mt-3 text-lg text-white/90">
                    Shop a wide selection across categories — essentials, gifts, and special finds — all in one convenient place.
                  </p>
                  <div className="mt-6">
                    <a
                      href="#products"
                      className="inline-block bg-white text-purple-700 font-semibold px-6 py-3 rounded-lg shadow hover:shadow-md transition-shadow duration-150"
                    >
                      Shop products
                    </a>
                  </div>
                </div>
              </div>

              {/* Image area (used on all sizes). We'll add a mobile overlay for small screens. */}
              <div
                className="w-full h-full md:w-2/5 relative overflow-hidden md:rounded-r-2xl bg-gradient-to-br from-blue-400 to-purple-600"
                style={{}}
              >
                {/* Optimized image loading strategy - enabled for mobile too for better LCP */}
                {slidesToShow.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Hero slide ${i + 1}`}
                    width="1200"
                    height="630"
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-linear transform-gpu ${i === index ? "opacity-100 z-10" : "opacity-0 z-0"
                      }`}
                    style={{
                      willChange: 'opacity'
                    }}
                    draggable={false}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 ? 'high' : 'low'}
                    decoding={i === 0 ? 'sync' : 'async'}
                  />
                ))}

                {/* mobile overlay: centered text on top of image for small screens */}
                <div className="md:hidden absolute inset-0 z-20 flex items-center justify-center px-4">
                  <div className="w-full max-w-md text-center">
                    <h1 className="text-4xl sm:text-5xl font-playfair font-extrabold text-white leading-tight mb-4 animate-fade-in-up"
                      style={{
                        textShadow: '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
                        letterSpacing: '-0.02em'
                      }}
                      itemProp="slogan">
                      Everything in one cart
                    </h1>
                    <p className="mt-3 text-base sm:text-lg text-white/95 leading-relaxed font-medium animate-fade-in-up"
                      style={{
                        textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        animationDelay: '0.1s'
                      }}
                      itemProp="description">
                      Electronics, watches, gifts and special finds — curated and ready to ship.
                    </p>
                    <div className="mt-8 flex flex-col items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                      <a
                        href="#products"
                        className="group relative inline-block bg-gradient-to-r from-white to-gray-50 text-purple-700 font-bold text-lg px-10 py-4 rounded-full shadow-2xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all duration-300 w-full max-w-xs text-center overflow-hidden"
                        aria-label="Browse our collection"
                        rel="nofollow"
                        itemProp="hasOfferCatalog"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          Shop Now
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                      </a>
                    </div>
                  </div>
                </div>

                {/* loading spinner while images are being prepared */}
                {!isMobile && isLoadingImages && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/25">
                    <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                    <span className="sr-only">Loading hero images</span>
                  </div>
                )}
              </div>

              {/* Removed duplicate mobile text section */}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
