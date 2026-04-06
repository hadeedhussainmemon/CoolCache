'use client';

import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import getImageUrl from '../../utils/imageUrl';
import CheckoutForm from '../Checkout/CheckoutForm';
import OrderSuccess from '../Checkout/OrderSuccess';

export default function Cart() {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    increaseQuantity,
    decreaseQuantity,
    removeFromCart,
    getCartTotal
  } = useCart();

  const [showCheckout, setShowCheckout] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    setShowCheckout(true);
  };

  const handleCheckoutSuccess = (order) => {
    setShowCheckout(false);
    setCompletedOrder(order);
  };

  const handleCloseSuccess = () => {
    setCompletedOrder(null);
    closeCart();
  };

  const total = getCartTotal();

  // Calculate final total with discount
  const discountAmount = appliedCoupon ? appliedCoupon.calculatedDiscount : 0;
  const finalTotal = Math.max(0, total - discountAmount);

  if (completedOrder) {
    return <OrderSuccess order={completedOrder} onClose={handleCloseSuccess} />;
  }

  // Handle Coupon Application
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setIsValidating(true);
    setCouponError(null);

    try {
      const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
      const response = await fetch(`${API_BASE_URL}/api/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, cartTotal: total })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Invalid coupon');

      setAppliedCoupon(data);
      setCouponCode('');
      setShowCouponInput(false);
    } catch (err) {
      setCouponError(err.message);
      setAppliedCoupon(null);
    } finally {
      setIsValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError(null);
  };

  if (showCheckout) {
    return (
      <CheckoutForm
        onBack={() => setShowCheckout(false)}
        onSuccess={handleCheckoutSuccess}
        appliedCoupon={appliedCoupon}
      />
    );
  }

  return (
    <>
      {/* Darkened Backdrop with Blur */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] transition-all duration-300"
        onClick={closeCart}
      ></div>

      {/* Main Cart Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white/95 backdrop-blur-2xl shadow-2xl z-[60] transform transition-transform duration-300 ease-out flex flex-col border-l border-white/20">

        {/* Gradient Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 shadow-lg shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <h2 className="text-xl font-playfair font-bold text-white tracking-wide drop-shadow-md">Shopping Bag</h2>
                <span className="text-xs text-purple-100 font-medium tracking-wider uppercase opacity-90">
                  {cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'}
                </span>
              </div>
            </div>
            <button
              onClick={closeCart}
              className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all active:scale-95"
              aria-label="Close cart"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50/50 scrollbar-hide">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fadeIn">
              <div className="w-32 h-32 bg-purple-50 rounded-full flex items-center justify-center shadow-inner">
                <svg className="w-16 h-16 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-2xl font-playfair font-bold text-gray-900 mb-2">Your bag is empty</h3>
                <p className="text-gray-500 max-w-[200px] mx-auto text-sm">Looks like you haven't added anything to your cart yet.</p>
              </div>
              <button
                onClick={closeCart}
                className="px-8 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg hover:shadow-xl transform active:scale-95"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <ul className="space-y-6">
              {cartItems.map((item, index) => (
                <li
                  key={item.id}
                  className="group relative flex gap-4 animate-stagger-item"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Product Image */}
                  <div className="relative w-24 h-24 shrink-0 rounded-2xl bg-white border border-gray-100 overflow-hidden shadow-sm group-hover:shadow-md transition-all">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-purple-700 transition-colors">
                          {item.title}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                          <span className="bg-white border border-gray-100 px-2 py-0.5 rounded-md shadow-sm">
                            {item?.selectedOptions?.color && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full inline-block border border-gray-200" style={{ background: item.selectedOptions.color }} />
                                {item.category}
                              </span>
                            ) || item.category}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1 -mr-2"
                        title="Remove item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex items-end justify-between mt-2">
                      {/* Modern Quantity Pill */}
                      <div className="flex items-center bg-gray-100 rounded-full px-1 py-1 shadow-inner">
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-600 hover:text-purple-600 hover:shadow-sm transition-all text-xs active:scale-90"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-gray-900 tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-white text-gray-600 hover:text-purple-600 hover:shadow-sm transition-all text-xs active:scale-90"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          {(item.price * item.quantity).toLocaleString()} PKR
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer Summary */}
        {cartItems.length > 0 && (
          <div className="bg-white/80 backdrop-blur-md border-t border-gray-100 p-6 space-y-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-[70]">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">{total} PKR</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Shipping</span>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Calculated at checkout</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-3">
              {/* Coupon Section */}
              {!appliedCoupon ? (
                <div>
                  {!showCouponInput ? (
                    <button
                      onClick={() => setShowCouponInput(true)}
                      className="text-sm text-violet-600 font-semibold hover:text-violet-800 flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                      Have a coupon?
                    </button>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-violet-500 uppercase"
                          autoFocus
                        />
                        <button
                          type="submit"
                          disabled={isValidating || !couponCode.trim()}
                          className="px-3 py-2 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
                        >
                          {isValidating ? '...' : 'Apply'}
                        </button>
                      </div>
                      {couponError && <p className="text-xs text-red-500 font-medium">{couponError}</p>}
                      <button
                        type="button"
                        onClick={() => { setShowCouponInput(false); setCouponError(null); }}
                        className="text-xs text-gray-400 hover:text-gray-600 underline"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="bg-violet-50 border border-violet-100 rounded-lg p-3 flex justify-between items-center group">
                  <div>
                    <p className="text-sm font-bold text-violet-700 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {appliedCoupon.code} Applied
                    </p>
                    <p className="text-xs text-violet-600">
                      You saved {appliedCoupon.calculatedDiscount.toLocaleString()} PKR
                    </p>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Remove coupon"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}

              <div className="flex justify-between items-end pt-2">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Total Estimate</p>
                  <p className="text-2xl font-playfair font-bold text-gray-900">{finalTotal.toLocaleString()} <span className="text-sm text-gray-500 font-sans font-normal">PKR</span></p>
                  {appliedCoupon && (
                    <p className="text-xs text-gray-400 line-through">{total.toLocaleString()} PKR</p>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="group relative w-full overflow-hidden rounded-2xl bg-gray-900 py-4 text-white hover:shadow-2xl transition-all duration-300 active:scale-[0.99]"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 font-bold tracking-wide">
                Proceed to Checkout
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out" />
            </button>
            <p className="text-xs text-center text-gray-400">Secure Checkout powered by CoolCache</p>
          </div>
        )}
      </div>
    </>
  );
}