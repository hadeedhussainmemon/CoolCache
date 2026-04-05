
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PushToggle from "../Notifications/PushToggle";

const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Smooth scroll function - works on all pages
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();

    // If not on home page, navigate to home first
    if (location.pathname !== "/") {
      navigate("/");
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
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-playfair text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">CoolCache</h3>
            <p className="text-gray-600 text-sm">
              Everything in one cart — a curated marketplace for everyday needs and special finds. Quality products across categories, delivered with care.
            </p>
            <a
              href={`https://www.instagram.com/${import.meta.env.VITE_INSTAGRAM_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-gray-600 hover:text-purple-700 transition-colors duration-200"
              aria-label="Follow us on Instagram"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Quick Links</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <a
                  href="#products"
                  onClick={(e) => scrollToSection(e, 'products')}
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Our Products
                </a>
              </li>
              <li>
                <a
                  href="https://books.coolcache.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Books
                </a>
              </li>
              {/* Size Guide removed from quick links */}
              <li>
                <a
                  href="#reviews"
                  onClick={(e) => scrollToSection(e, 'reviews')}
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Reviews
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => scrollToSection(e, 'faq')}
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Help & Info</h3>
            <ul className="mt-4 space-y-4">
              <li>
                <button
                  onClick={() => navigate('/track-order')}
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Track Order
                </button>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => scrollToSection(e, 'faq')}
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Shipping Info
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => scrollToSection(e, 'faq')}
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Return Policy
                </a>
              </li>
              {/* Size Guide removed from help & info */}
              <li>
                <a
                  href="#faq"
                  onClick={(e) => scrollToSection(e, 'faq')}
                  className="text-gray-600 hover:text-purple-600 transition-colors duration-200"
                >
                  Care Instructions
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Contact & Social</h3>
            <div className="mt-4 space-y-4">
              <p className="text-gray-700 text-sm">
                Follow us on Instagram for new designs, custom creations, and special offers!
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <a
                  href={`https://www.instagram.com/${import.meta.env.VITE_INSTAGRAM_USERNAME}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center space-x-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent transform transition-transform duration-300 hover:scale-105"
                >
                  <svg className="h-5 w-5 transform transition-all duration-300 hover:scale-110 hover:rotate-6" viewBox="0 0 24 24">
                    <defs>
                      <linearGradient id="instagramGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#feda75" />
                        <stop offset="25%" stopColor="#fa7e1e" />
                        <stop offset="50%" stopColor="#d62976" />
                        <stop offset="75%" stopColor="#962fbf" />
                        <stop offset="100%" stopColor="#4f5bd5" />
                      </linearGradient>
                    </defs>
                    <path fill="url(#instagramGradient)" d="M12 2c2.717 0 3.056.01 4.122.06 1.065.05 1.79.217 2.428.465.66.254 1.216.598 1.772 1.153.509.5.902 1.105 1.153 1.772.247.637.415 1.363.465 2.428.047 1.066.06 1.405.06 4.122 0 2.717-.01 3.056-.06 4.122-.05 1.065-.218 1.79-.465 2.428a4.883 4.883 0 01-1.153 1.772c-.5.508-1.105.902-1.772 1.153-.637.247-1.363.415-2.428.465-1.066.047-1.405.06-4.122.06-2.717 0-3.056-.01-4.122-.06-1.065-.05-1.79-.218-2.428-.465a4.89 4.89 0 01-1.772-1.153 4.904 4.904 0 01-1.153-1.772c-.248-.637-.415-1.363-.465-2.428C2.013 15.056 2 14.717 2 12c0-2.717.01-3.056.06-4.122.05-1.066.217-1.79.465-2.428a4.88 4.88 0 011.153-1.772A4.897 4.897 0 015.45 2.525c.638-.248 1.362-.415 2.428-.465C8.944 2.013 9.283 2 12 2zm0 5a5 5 0 100 10 5 5 0 000-10zm6.5-.25a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0zM12 9a3 3 0 110 6 3 3 0 010-6z" />
                  </svg>
                  <span>@{import.meta.env.VITE_INSTAGRAM_USERNAME}</span>
                </a>

                <a
                  href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '923121842124'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
                  aria-label="Chat on WhatsApp"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                    <path d="M12 22a9.9 9.9 0 01-5.03-1.38l-3.74.98.998-3.648A9.9 9.9 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zM12 4a8 8 0 100 16 8 8 0 000-16z" />
                  </svg>
                  WhatsApp
                </a>

                {/* Facebook */}
                <a
                  href={`https://facebook.com/coolcacheapp`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#1877F2] hover:text-[#0f6ae6] font-medium"
                  aria-label="Visit us on Facebook"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M22 12.07C22 6.48 17.52 2 11.93 2 6.35 2 1.86 6.48 1.86 12.07c0 4.99 3.64 9.13 8.4 9.93v-7.02H7.89V12.1h2.37V9.96c0-2.34 1.39-3.63 3.52-3.63.99 0 2.03.18 2.03.18v2.23h-1.14c-1.12 0-1.47.7-1.47 1.41v1.95h2.5l-.4 2.88h-2.1V22c4.76-.8 8.4-4.94 8.4-9.93z" />
                  </svg>
                  Facebook
                </a>
              </div>
              {import.meta.env.VITE_CONTACT_EMAIL && (
                <p className="text-gray-700 text-sm">
                  Email us:{' '}
                  <a
                    href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL}`}
                    className="text-purple-700 hover:text-purple-800 transition-colors duration-200"
                  >
                    {import.meta.env.VITE_CONTACT_EMAIL}
                  </a>
                </p>
              )}
              <div className="pt-2">
                <PushToggle />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-sm text-gray-700 text-center">
            &copy; {new Date().getFullYear()} CoolCache. All rights reserved.
          </p>
        </div>
      </div>
    </footer >
  );
};

export default Footer;
