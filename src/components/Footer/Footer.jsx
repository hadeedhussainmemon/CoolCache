'use client';

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import PushToggle from "../Notifications/PushToggle";

const Footer = () => {
  const router = useRouter();
  const pathname = usePathname();

  // Smooth scroll function - works on all pages
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();

    // If not on home page, navigate to home first
    if (pathname !== "/") {
      router.push("/");
      // Wait for navigation, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const offset = 80;
          const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementTop - offset;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 100);
    } else {
      // On home page, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        const offset = 80;
        const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementTop - offset;
        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <footer className="bg-stone-50 border-t border-stone-200/60">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-serif text-2xl font-bold text-luxury-black">CoolCache</h3>
              <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500 font-medium">Curated Archive</p>
            </div>
            <p className="text-stone-600 text-sm leading-relaxed font-light">
              A meticulously curated marketplace for those who appreciate the intersection of utility and aesthetic. Every piece in our archive is selected with a commitment to quality and timeless design.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a
                href={`https://www.instagram.com/${process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME || 'coolcache'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-400 hover:text-luxury-gold transition-colors duration-300"
                aria-label="Instagram"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold text-luxury-black tracking-[0.2em] uppercase mb-6">Archive</h3>
            <ul className="space-y-4">
              <li>
                <a
                  href="#products"
                  onClick={(e) => scrollToSection(e, 'products')}
                  className="text-stone-500 hover:text-luxury-black text-sm transition-colors duration-300 font-light"
                >
                  All Collections
                </a>
              </li>
              <li>
                <Link
                  href="/recommendations"
                  className="text-stone-500 hover:text-luxury-black text-sm transition-colors duration-300 font-light"
                >
                  Curated For You
                </Link>
              </li>
              <li>
                <a
                  href="#reviews"
                  onClick={(e) => scrollToSection(e, 'reviews')}
                  className="text-stone-500 hover:text-luxury-black text-sm transition-colors duration-300 font-light"
                >
                  Client Reviews
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-semibold text-luxury-black tracking-[0.2em] uppercase mb-6">Concierge</h3>
            <ul className="space-y-4">
              <li>
                <button
                  onClick={() => router.push('/track-order')}
                  className="text-stone-500 hover:text-luxury-black text-sm transition-colors duration-300 font-light"
                >
                  Track Order
                </button>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => scrollToSection(e, 'faq')}
                  className="text-stone-500 hover:text-luxury-black text-sm transition-colors duration-300 font-light"
                >
                  Shipping & Returns
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => scrollToSection(e, 'faq')}
                  className="text-stone-500 hover:text-luxury-black text-sm transition-colors duration-300 font-light"
                >
                  Client Care
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-[10px] font-semibold text-luxury-black tracking-[0.2em] uppercase mb-6">Contact</h3>
            <div className="space-y-4">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '923121842124'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-stone-500 hover:text-luxury-gold transition-colors duration-300 text-sm font-light"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                </svg>
                WhatsApp Priority
              </a>
              <div className="pt-4">
                <PushToggle />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-20 border-t border-stone-200/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[10px] text-stone-400 uppercase tracking-[0.2em]">
            &copy; {new Date().getFullYear()} CoolCache Archive. All rights reserved.
          </p>
          <div className="flex gap-8">
            <span className="text-[10px] text-stone-400 uppercase tracking-[0.2em]">Karachi, PK</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
