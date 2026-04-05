import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SEO component for managing page-level meta tags and structured data
 * Updates document title, meta descriptions, and canonical URLs dynamically
 */
const SEO = ({ 
  title = 'CoolCache Pakistan | Electronics, Watches, Gifts & More - Online Shopping',
  description = "CoolCache Online Store — Pakistan's one‑stop shop for electronics, watches, gifts, and more. Premium quality products with nationwide delivery and open‑box delivery across Karachi.",
  canonical = 'https://www.coolcache.app',
  image = 'https://www.coolcache.app/og-image.jpg',
  type = 'website',
  prev = null,
  next = null
}) => {
  const location = useLocation();

  useEffect(() => {
    // Update page title
    document.title = title;

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }

    // Update OG tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', image);

    const ogType = document.querySelector('meta[property="og:type"]');
    if (ogType) ogType.setAttribute('content', type);

    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', canonical);

    // Update Twitter tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', title);

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', description);

    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) twitterImage.setAttribute('content', image);
    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    if (twitterCard) twitterCard.setAttribute('content', 'summary_large_image');

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonical);

    // Update rel=prev/next for paginated lists
    // Remove any existing prev/next to avoid duplicates
    document.querySelectorAll('link[rel="prev"], link[rel="next"]').forEach(el => el.parentNode.removeChild(el));
    if (prev) {
      const prevLink = document.createElement('link');
      prevLink.setAttribute('rel', 'prev');
      prevLink.setAttribute('href', prev);
      document.head.appendChild(prevLink);
    }
    if (next) {
      const nextLink = document.createElement('link');
      nextLink.setAttribute('rel', 'next');
      nextLink.setAttribute('href', next);
      document.head.appendChild(nextLink);
    }

    // Inject global Organization + WebSite (SearchAction) structured data only once
    if (!document.getElementById('structured-data-global')) {
      const orgLd = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://www.coolcache.app/#organization',
            'name': 'CoolCache Pakistan',
            'url': 'https://www.coolcache.app',
            'logo': {
              '@type': 'ImageObject',
              'url': 'https://www.coolcache.app/logo.png'
            },
            'sameAs': [
              'https://www.facebook.com/coolcacheapp',
              'https://www.instagram.com/coolcache.app'
            ]
          },
          {
            '@type': 'WebSite',
            '@id': 'https://www.coolcache.app/#website',
            'url': 'https://www.coolcache.app',
            'name': 'CoolCache Pakistan',
            'publisher': { '@id': 'https://www.coolcache.app/#organization' },
            'potentialAction': {
              '@type': 'SearchAction',
              'target': 'https://www.coolcache.app/?q={search_term_string}',
              'query-input': 'required name=search_term_string'
            }
          }
        ]
      };
      const script = document.createElement('script');
      script.id = 'structured-data-global';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(orgLd);
      document.head.appendChild(script);
    }

    // Track page view for analytics
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_title: title,
        page_location: canonical,
        page_path: location.pathname
      });
    }
  }, [title, description, canonical, image, type, prev, next, location.pathname]);

  return null; // This component doesn't render anything
};

export default SEO;
