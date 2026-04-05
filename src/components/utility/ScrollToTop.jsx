import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// ScrollToTop: scrolls window to top whenever the location pathname changes.
// Keeps behavior simple and predictable for route navigation in this SPA.
export default function ScrollToTop({ behavior = 'auto' }) {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use instant behavior for reliability; allow 'smooth' if caller prefers
    // Always force instant scrolling on route change to be reliable
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
