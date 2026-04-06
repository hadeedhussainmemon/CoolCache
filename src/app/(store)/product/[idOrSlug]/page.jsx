'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useProductQuery } from '@/hooks/useProductQuery';
import useTrackProductView from '@/hooks/useTrackProductView';
import getImageUrl from '@/utils/imageUrl';
import Breadcrumb from '@/components/Breadcrumb/Breadcrumb';
import ProductCard from '@/components/ProductCard/ProductCard';
import Reviews from '@/components/Reviews/Reviews';
import ProductDetailSkeleton from '@/components/Skeletons/ProductDetailSkeleton';

const ProductDetailPage = () => {
  const params = useParams();
  const idOrSlug = params.idOrSlug;
  const router = useRouter();
  
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

  const API_BASE_URL = useMemo(() => (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, ''), []);

  if (loading) return <ProductDetailSkeleton />;
  if (error) return <div className="max-w-5xl mx-auto p-6 text-red-600">{error}</div>;
  if (!product) return null;

  const isSoldOut = product.stock === 0;

  const handleWhatsAppShare = () => {
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

  const IMAGE_FALLBACK = typeof window !== 'undefined' ? `${window.location.origin}/og-image.jpg` : '/og-image.jpg';
  let imageUrl = product && product.image ? getImageUrl(product.image) : IMAGE_FALLBACK;

  if (imageUrl && imageUrl.startsWith('/') && typeof window !== 'undefined') {
    imageUrl = `${window.location.origin}${imageUrl}`;
  }

  const categoryLabel = Array.isArray(product.category) ? product.category[0] : product.category;
  const categorySlug = encodeURIComponent((categoryLabel || '').toLowerCase().replace(/\s+/g, '-'));

  const breadcrumbItems = [
    { name: 'Home', to: '/' },
    { name: categoryLabel || 'Category', to: `/category/${categorySlug}` },
    { name: product.title, to: null }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
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
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">{product.title}</h1>
          <div className="text-gray-600 mb-1">
            Category: {Array.isArray(product.category) ? product.category.join(', ') : product.category}
          </div>
          {product.material && product.material.toLowerCase() !== 'handmade' && (
            <div className="text-gray-600 mb-3">Material: {product.material}</div>
          )}

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4 text-sm">
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Cash on Delivery Available
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" /></svg>
              7-day Return Policy
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3h18l-1 12H4L3 3zM7 21h10" /></svg>
              Open-box delivery (Karachi)
            </div>
          </div>

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
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {product.price === 0 ? (
              <a
                href={`https://www.instagram.com/${process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME || 'coolcache.app'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-3 rounded-lg text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 flex items-center justify-center gap-2"
              >
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
            >
              Share
            </button>
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-playfair font-bold mb-3 text-gray-900">Product Details</h3>
            <div className="prose prose-sm text-gray-700 leading-relaxed whitespace-pre-line mb-6">
              {product.description}
            </div>

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
        </div>
      </div>

      <RelatedProductsSection currentId={product.id} category={product.category} />

      <div className="mt-12 border-t pt-8">
        <Reviews />
      </div>

      <div className="md:hidden fixed bottom-16 left-0 right-0 z-30 bg-white/90 backdrop-blur-xl border-t border-gray-100 p-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
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
              <a href={`https://www.instagram.com/${process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME || 'coolcache.app'}`} target="_blank" rel="noopener noreferrer" className="w-full flex justify-center py-3 rounded-xl text-white bg-gradient-to-r from-pink-600 to-purple-600 font-bold shadow-lg text-center">Ask Price on Instagram</a>
            ) : (
              <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-bold cursor-not-allowed">Sold Out</button>
            )
          )}
        </div>
      </div>
    </div>
  );
};

const RelatedProductsSection = ({ currentId, category }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = useMemo(() => (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, ''), []);

  useEffect(() => {
    async function fetchRelated() {
      try {
        setLoading(true);
        const rawCategory = Array.isArray(category) ? category[0] : category;
        if (!rawCategory) return;
        const slug = rawCategory.toLowerCase().replace(/\s+/g, '-');
        const res = await fetch(`${API_BASE_URL}/api/products?category=${encodeURIComponent(slug)}&pageSize=8`);
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
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
      <h2 className="text-xl font-semibold mb-6 font-playfair text-gray-900">You might also like</h2>
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

export default ProductDetailPage;
