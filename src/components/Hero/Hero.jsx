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
      aria-label="CoolCache Luxury Collection"
      className="relative bg-stone-50 overflow-hidden min-h-[70vh] flex items-center"
      itemScope
      itemType="https://schema.org/Store"
    >
      <div className="max-w-7xl mx-auto px-6 w-full py-20">
        <div className="flex flex-col md:flex-row items-center gap-16">
          {/* Text Content */}
          <div className="w-full md:w-1/2 animate-luxury-in">
            <span className="text-luxury-gold font-sans tracking-[0.4em] uppercase text-[10px] mb-6 block font-bold">
              EST. 2024 — THE CURATED ARCHIVE
            </span>
            <h1 className="text-6xl lg:text-8xl font-serif font-bold text-luxury-black leading-[0.9] mb-8">
              Silent <br /> <span className="italic text-luxury-gold">Luxury.</span>
            </h1>
            <p className="text-stone-500 text-sm md:text-base leading-relaxed max-w-md mb-12 font-serif italic">
              Discover a collection where every piece tells a story of craftsmanship and timeless elegance. Curated for the discerning few.
            </p>
            <div className="flex items-center gap-8">
              <a
                href="#products"
                className="bg-luxury-black text-white text-[10px] uppercase tracking-[0.3em] font-bold px-10 py-5 hover:bg-luxury-gold transition-all duration-500 shadow-xl"
              >
                Explore Archive
              </a>
              <div className="h-[1px] w-24 bg-stone-200 hidden lg:block"></div>
            </div>
          </div>

          {/* Luxury Image Slider */}
          <div className="w-full md:w-1/2 relative aspect-[4/5] bg-stone-100 overflow-hidden shadow-2xl group">
             {slidesToShow.map((src, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  i === index ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-110 rotate-1"
                }`}
              >
                <img
                  src={src}
                  alt={`Collection Piece ${i + 1}`}
                  className="w-full h-full object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'low'}
                />
                <div className="absolute inset-0 bg-black/5"></div>
              </div>
            ))}
            
            {/* Minimalist Progress Indicators */}
            <div className="absolute bottom-8 left-8 right-8 flex gap-2 z-20">
              {slidesToShow.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className="h-[2px] flex-1 bg-white/20 transition-all duration-300 relative overflow-hidden"
                >
                  {i === index && (
                    <div 
                      className="absolute inset-0 bg-luxury-gold animate-progress-line"
                      style={{ animationDuration: `${interval}ms` }}
                    ></div>
                  )}
                </button>
              ))}
            </div>

            {/* Corner Stamp */}
            <div className="absolute top-8 right-8 w-16 h-16 border border-white/20 rounded-full flex items-center justify-center text-white/40 text-[8px] uppercase tracking-widest font-bold rotate-12 backdrop-blur-sm">
                Luxury
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-stone-100/50 -z-10 skew-x-12 transform translate-x-1/2"></div>
    </section>
  );
};

export default Hero;
