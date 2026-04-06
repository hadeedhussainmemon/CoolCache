import React, { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

const Analytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page views
    if (typeof window.gtag !== 'undefined') {
      const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      window.gtag('event', 'page_view', {
        page_path: url,
        page_title: document.title,
      });
    }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
};

export default Analytics;