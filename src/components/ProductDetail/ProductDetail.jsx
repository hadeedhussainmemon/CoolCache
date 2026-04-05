import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useProductQuery } from '../../hooks/useProductQuery';
import useTrackProductView from '../../hooks/useTrackProductView';
import SEO from '../SEO/SEO';
import getImageUrl from '../../utils/imageUrl';
import Breadcrumb from '../Breadcrumb/Breadcrumb';
import ProductCard from '../ProductCard/ProductCard';
import Reviews from '../Reviews/Reviews';


import ProductDetailSkeleton from '../Skeletons/ProductDetailSkeleton';

const ProductDetail = () => {
  const { idOrSlug } = useParams();
  const navigate = useNavigate();
  // React Query Fetch
  const { data: product, isLoading: loading, error: queryError } = useProductQuery(idOrSlug);
  const error = queryError ? queryError.message : null;

  // Cart Context
  const { addToCart, isInCart, openCart } = useCart();

  // Local State
  const [selectedColor, setSelectedColor] = useState(null);

  // Track product view using the hook
  useTrackProductView(product?.id, product);

  // Initialize selected color when product loads
  useEffect(() => {
    if (product?.colors?.length > 0) {
      setSelectedColor(product.colors[0]);
    }
  }, [product]);

  const API_BASE_URL = useMemo(() => (import.meta.env.VITE_API_BASE_URL || window.__APP_CONFIG__?.API_BASE_URL || '').replace(/\/$/, ''), []);

  // Effect removed (now handled by useProductQuery)

  if (loading) return <ProductDetailSkeleton />;
  if (error) return <div className="max-w-5xl mx-auto p-6 text-red-600">{error}</div>;
  if (!product) return null;

  const isSoldOut = product.stock === 0;

  const handleWhatsAppShare = () => {
    // Use the backend "smart share" link to ensure OG images work
    const shareUrl = `${API_BASE_URL}/api/share/product/${product.id}`;
    const message = `Check out this product: ${product.title}\n\nPrice: Rs. ${product.price}\n\n${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleBuyNow = () => {
    if (!isInCart(product.id)) {
      addToCart({ ...product, selectedOptions: { color: selectedColor } });
    }
    setTimeout(() => openCart(), 200);
  };

  // Structured data for SEO
  const IMAGE_FALLBACK = `${window.location.origin}/og-image.jpg`;
  let imageUrl = product && product.image ? getImageUrl(product.image) : IMAGE_FALLBACK;

  // Ensure absolute URL for OG tags
  if (imageUrl && !imageUrl.startsWith('http')) {
    // If it's a relative path from API (like /uploads/...), prepend API base or Origin?
    // Usually images are from API_BASE_URL. Let's check getImageUrl behavior.
    // If getImageUrl returns relative path, we need to know relative to what.
    // Assuming relative to current origin if it starts with /
    if (imageUrl.startsWith('/')) {
      imageUrl = `${window.location.origin}${imageUrl}`;
    }
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    category: Array.isArray(product.category) ? product.category.join(', ') : product.category,
    image: [imageUrl],
    brand: {
      '@type': 'Brand',
      name: 'CoolCache'
    },
    itemCondition: 'https://schema.org/NewCondition',
    offers: {
      '@type': 'Offer',
      priceCurrency: 'PKR',
      price: product.price,
      availability: isSoldOut ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      url: `https://www.coolcache.app/product/${product.slug || product.id}`,
      seller: {
        '@type': 'Organization',
        name: 'CoolCache Pakistan'
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'PK'
        },
        shippingRate: {
          '@type': 'MonetaryAmount',
          currency: 'PKR',
          value: 199
        },
        freeShippingThreshold: {
          '@type': 'MonetaryAmount',
          currency: 'PKR',
          value: 2000
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 2, unitCode: 'd' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 7, unitCode: 'd' }
        }
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        applicableCountry: 'PK',
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: 'https://schema.org/ReturnShippingFees',
        returnPolicyUrl: 'https://www.coolcache.app/faq'
      }
    },
    sku: product.id,
    mpn: product.id,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '124'
    }
  };

  const categoryLabel = Array.isArray(product.category) ? product.category[0] : product.category;
  const categorySlug = encodeURIComponent((categoryLabel || '').toLowerCase().replace(/\s+/g, '-'));
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.coolcache.app/' },
      { '@type': 'ListItem', position: 2, name: categoryLabel || 'Category', item: `https://www.coolcache.app/category/${categorySlug}` },
      { '@type': 'ListItem', position: 3, name: product.title, item: `https://www.coolcache.app/product/${product.slug || product.id}` }
    ]
  };

  const breadcrumbItems = [
    { name: 'Home', to: '/' },
    { name: categoryLabel || 'Category', to: `/category/${categorySlug}` },
    { name: product.title, to: null } // Current page
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <SEO
        title={`${product.title} | CoolCache Pakistan`}
        description={`Buy ${product.title} - ${String(product.description || '').substring(0, 150)}... | CoolCache Pakistan`}
        canonical={`https://www.coolcache.app/product/${product.slug || product.id}`}
        image={imageUrl}
        type="product"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-purple-600 transition-colors group"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
        <Breadcrumb items={breadcrumbItems} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-6 rounded-xl shadow">
        {/* Product Image */}
        <div className="relative">
          {isSoldOut && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
              Sold Out
            </div>
          )}
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-auto rounded-lg"
            onError={(e) => { try { e.target.onerror = null; e.target.src = IMAGE_FALLBACK; } catch { } }}
          />
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
          <div className="text-gray-600 mb-1">
            Category: {Array.isArray(product.category) ? product.category.join(', ') : product.category}
          </div>
          {product.material && product.material.toLowerCase() !== 'handmade' && (
            <div className="text-gray-600 mb-3">Material: {product.material}</div>
          )}

          {/* Price with Discount */}
          <div className="mb-4">
            {product.price > 0 ? (
              <>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl font-extrabold text-purple-700">
                    Rs. {product.price.toLocaleString('en-PK')}
                  </div>
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                    20% OFF
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg text-gray-400 line-through">
                    Rs. {Math.round(product.price / 0.8).toLocaleString('en-PK')}
                  </span>
                  <span className="text-sm text-green-600 font-semibold">
                    Save Rs. {(Math.round(product.price / 0.8) - product.price).toLocaleString('en-PK')}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-xl text-gray-500">Contact for price</div>
            )}
          </div>

          {/* Trust panel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 text-sm">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Cash on Delivery Available
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" /></svg>
              7‑day Return Policy
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3h18l-1 12H4L3 3zM7 21h10" /></svg>
              Open‑box delivery (Karachi)
            </div>
          </div>

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-700 mb-2">Choose color:</div>
              <div className="flex items-center gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={`w-8 h-8 rounded-full border-2 ${selectedColor === c ? 'ring-2 ring-offset-1 ring-purple-400' : ''}`}
                    style={{ background: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {product.price === 0 ? (
              <a
                href={`https://www.instagram.com/${import.meta.env.VITE_INSTAGRAM_USERNAME || window.__APP_CONFIG__?.INSTAGRAM_USERNAME || 'coolcache.app'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-lg text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                Ask price on Insta
              </a>
            ) : (
              <>
                <button
                  onClick={() => addToCart({ ...product, selectedOptions: { color: selectedColor } })}
                  disabled={isSoldOut}
                  className={`px-5 py-3 rounded-lg border text-purple-700 bg-purple-50 hover:bg-purple-100 ${isSoldOut ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Add to Cart
                </button>
                {!isSoldOut && (
                  <button
                    onClick={handleBuyNow}
                    className="px-5 py-3 rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                  >
                    Buy Now
                  </button>
                )}
              </>
            )}
            <button
              onClick={handleWhatsAppShare}
              className="px-5 py-3 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center gap-2"
              aria-label="Share on WhatsApp"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              Share
            </button>
          </div>

          {/* Description */}
          {/* Description & Specs */}
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-playfair font-bold mb-3 text-gray-900">Product Details</h3>
            <div className="prose prose-sm text-gray-700 leading-relaxed whitespace-pre-line mb-6">
              {product.description}
            </div>

            {/* Specifications Box */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Specifications</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium text-gray-900">{Array.isArray(product.category) ? product.category.join(', ') : product.category}</span>
                </div>
                {product.material && (
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="text-gray-500">Material</span>
                    <span className="font-medium text-gray-900">{product.material}</span>
                  </div>
                )}
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Stock Status</span>
                  <span className={`font-medium ${isSoldOut ? 'text-red-600' : 'text-green-600'}`}>
                    {isSoldOut ? 'Sold Out' : 'In Stock'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-2">
                  <span className="text-gray-500">Product ID</span>
                  <span className="font-medium text-gray-900 text-xs font-mono py-0.5">{product.id}</span>
                </div>
              </div>
            </div>
          </div>

          {product.isCustomizable && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              ✨ This item is customizable. Add notes at checkout.
            </div>
          )}
        </div>
      </div>

      {/* Related products (simple: same category) */}
      <RelatedProducts currentId={product.id} category={product.category} />

      {/* Reviews Section */}
      <div className="mt-12 border-t pt-8">
        <Reviews />
      </div>

      {/* Sticky mobile CTA */}
      {/* Sticky mobile CTA */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] animate-slide-up">
        {/* Price display removed to save space for big buttons, or kept compact */}
        <div className="flex-1 flex gap-3">
          {product.price > 0 && !isSoldOut ? (
            <>
              <button
                onClick={() => addToCart({ ...product, selectedOptions: { color: selectedColor } })}
                className="flex-1 py-3 px-4 rounded-xl border border-purple-200 text-purple-700 font-bold bg-purple-50 active:bg-purple-100 transition-colors text-sm"
              >
                Add to Cart
              </button>
              <button
                onClick={() => { if (!isInCart(product.id)) addToCart({ ...product, selectedOptions: { color: selectedColor } }); handleBuyNow(); }}
                className="flex-1 py-3 px-4 rounded-xl text-white font-bold bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg shadow-purple-500/20 active:scale-95 transition-all text-sm"
              >
                Buy Now
              </button>
            </>
          ) : (
            !isSoldOut ? (
              <a href={`https://www.instagram.com/${import.meta.env.VITE_INSTAGRAM_USERNAME || window.__APP_CONFIG__?.INSTAGRAM_USERNAME || 'coolcache.app'}`} target="_blank" rel="noopener noreferrer" className="w-full flex justify-center py-3 rounded-xl text-white bg-gradient-to-r from-pink-600 to-purple-600 font-bold shadow-lg">Ask Price on Instagram</a>
            ) : (
              <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-bold cursor-not-allowed">Sold Out</button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

const RelatedProducts = ({ currentId, category }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = useMemo(() => (import.meta.env.VITE_API_BASE_URL || window.__APP_CONFIG__?.API_BASE_URL || '').replace(/\/$/, ''), []);

  useEffect(() => {
    async function fetchRelated() {
      try {
        setLoading(true);
        // Use first category if it's an array
        const rawCategory = Array.isArray(category) ? category[0] : category;
        if (!rawCategory) return;

        // Convert to slug: basic version matching backend expectation usually
        const slug = rawCategory.toLowerCase().replace(/\s+/g, '-');

        // Use the main products endpoint with category filter
        const res = await fetch(`${API_BASE_URL}/api/products?category=${encodeURIComponent(slug)}&pageSize=8`);
        if (!res.ok) throw new Error('Fetch failed');

        const data = await res.json();
        // API usually returns { products: [...] } or just [...] depending on endpoint, 
        // but CategoryPage logic implies { products: [...] }
        const list = data.products || (Array.isArray(data) ? data : []);

        setItems(list.filter(p => p.id !== Number(currentId)).slice(0, 4));
      } catch (e) {
        console.error('RelatedProducts: fetch error', e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    fetchRelated();
  }, [API_BASE_URL, category, currentId]);

  if (loading || !items.length) return null;

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-6 font-playfair">You might also like</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map(p => (
          <div key={p.id} className="h-full">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductDetail;
