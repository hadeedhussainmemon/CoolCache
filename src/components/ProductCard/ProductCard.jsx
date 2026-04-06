import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { fetchProductFn } from '../../hooks/useProductQuery';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import getImageUrl from '../../utils/imageUrl';

const ProductCard = (inputProps) => {
    // Handle case where properties are wrapped in a 'product' prop (common in usage)
    const props = inputProps.product ? { ...inputProps.product, ...inputProps } : inputProps;

    const {
        id,
        title,
        price,
        description,
        image,
        slug,
        material = "",
        category = "Bracelet",
        stock = 0,
        isCustomizable = false,
        disableTitleLink = false,
        isTrending = false,
        priority = false 
    } = props;

    const { addToCart, isInCart, openCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const [imgLoaded, setImgLoaded] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalImageLoaded, setModalImageLoaded] = useState(false);
    const isSoldOut = stock === 0;

    const isWishlisted = isInWishlist(id);
    const IMAGE_FALLBACK = typeof window !== 'undefined' ? `${window.location.origin}/og-image.jpg` : '/og-image.jpg';

    const product = { id, title, price, description, image, material, category, stock, isCustomizable };

    const handleAddToCart = () => {
        setIsAdding(true);
        addToCart(product);
        setTimeout(() => setIsAdding(false), 600);
    };

    const handleBuyNow = () => {
        if (!isInCart(id)) addToCart(product);
        setTimeout(() => openCart(), 300);
    };

    const handleWishlistToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
    };

    const handleWhatsAppShare = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!id) return;
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.coolcache.app';
        const productUrl = `${origin}/product/${slug || id}`;
        const message = `Check out this product: ${title} - Rs. ${Number(price).toLocaleString('en-PK')}\n${productUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    React.useEffect(() => {
        if (showModal) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            const onKey = (e) => { if (e.key === 'Escape') setShowModal(false); };
            window.addEventListener('keydown', onKey);
            return () => {
                document.body.style.overflow = prev;
                window.removeEventListener('keydown', onKey);
            };
        }
    }, [showModal]);

    const closeModal = () => setShowModal(false);
    const qc = useQueryClient();

    const handleMouseEnter = () => {
        if (id || slug) {
            const key = slug || id;
            qc.prefetchQuery({
                queryKey: ['product', String(key)],
                queryFn: fetchProductFn,
                staleTime: 5 * 60 * 1000
            });
        }
    };

    return (
        <>
            <div
                className={`group relative bg-white border border-stone-100 rounded-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-700 flex flex-col h-full overflow-hidden ${isSoldOut ? 'opacity-80' : ''}`}
                itemScope
                itemType="https://schema.org/Product"
                onMouseEnter={handleMouseEnter}
            >
                {/* Image Section */}
                <div className="relative aspect-[4/5] overflow-hidden bg-[#fafafa]">
                    <Link
                        href={`/product/${slug || id}`}
                        className="block w-full h-full"
                        tabIndex={-1}
                    >
                        {!imgLoaded && (
                            <div className="absolute inset-0 luxury-shimmer z-10"></div>
                        )}

                        <img
                            className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
                            src={getImageUrl(image, { width: 600, height: 750, crop: 'fill' })}
                            alt={title}
                            itemProp="image"
                            loading={priority ? "eager" : "lazy"}
                            decoding="async"
                            fetchPriority={priority ? "high" : "auto"}
                            onLoad={() => setImgLoaded(true)}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = IMAGE_FALLBACK;
                            }}
                        />

                        {isSoldOut && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/5 backdrop-blur-[1px]">
                                <span className="bg-white/90 text-luxury-black text-[10px] uppercase tracking-[0.2em] font-bold px-4 py-2 border border-stone-200 shadow-sm">
                                    Archived
                                </span>
                            </div>
                        )}
                    </Link>

                    <div className="absolute top-4 right-4 flex flex-col gap-3 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                        <button
                            onClick={handleWishlistToggle}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm backdrop-blur-md border transition-all duration-300 ${isWishlisted
                                ? 'bg-luxury-gold border-luxury-gold text-white'
                                : 'bg-white/80 border-stone-100 text-stone-600 hover:text-luxury-gold hover:border-luxury-gold'
                                }`}
                        >
                            <svg className="w-4 h-4" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </button>
                        <button
                            onClick={handleWhatsAppShare}
                            className="w-10 h-10 bg-white/80 backdrop-blur-md border border-stone-100 rounded-full flex items-center justify-center text-stone-600 hover:text-green-600 hover:border-green-100 transition-all duration-300 shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                        </button>
                    </div>

                    <div className="absolute bottom-4 left-4">
                        <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-stone-400 bg-white/60 backdrop-blur-sm px-2 py-1 rounded-sm border border-white/40">
                            {Array.isArray(category) ? category[0] : category}
                        </span>
                    </div>
                </div>

                <div className="p-5 flex flex-col flex-grow bg-white">
                    <div className="flex-grow">
                        <Link href={`/product/${slug || id}`} className="block group/title">
                            <h3 className="text-lg font-serif font-bold text-luxury-black mb-2 line-clamp-1 group-hover/title:text-luxury-gold transition-colors duration-300">
                                {title}
                            </h3>
                        </Link>
                        
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-base font-bold text-luxury-black">
                                Rs. {Number(price).toLocaleString('en-PK')}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-stone-50">
                        <button
                            onClick={handleAddToCart}
                            disabled={isAdding || isSoldOut}
                            className="text-[10px] uppercase tracking-widest font-bold py-3 border border-stone-200 hover:border-luxury-black transition-all duration-300 disabled:opacity-30"
                        >
                            {isAdding ? 'Wait...' : 'Bag It'}
                        </button>
                        <button
                            onClick={handleBuyNow}
                            disabled={isSoldOut}
                            className="bg-luxury-black text-white text-[10px] uppercase tracking-widest font-bold py-3 hover:bg-luxury-gold transition-all duration-500 disabled:opacity-30 shadow-sm"
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>

            {showModal && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-luxury-black/90 backdrop-blur-md p-4 md:p-10" onClick={closeModal}>
                        <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
                            <button className="absolute top-0 right-0 text-white/50 hover:text-white transition-colors" onClick={closeModal}>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <img
                                src={getImageUrl(image)}
                                alt={title}
                                className={`max-h-[85vh] w-auto object-contain transition-all duration-700 ${modalImageLoaded ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
                                onLoad={() => setModalImageLoaded(true)}
                            />
                        </div>
                    </div>
                </ModalPortal>
            )}
        </>
    );
};

export default React.memo(ProductCard);

const ModalPortal = ({ children }) => {
    if (typeof document === 'undefined') return null;
    return createPortal(children, document.body);
};
