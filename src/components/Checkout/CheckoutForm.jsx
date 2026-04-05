import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';

export default function CheckoutForm({ onBack, onSuccess, appliedCoupon }) {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    city: '',
    postalCode: '',
    notes: '',
    giftWrap: false,
    giftMessage: ''
  });

  const subtotal = getCartTotal();

  // Dynamic shipping: 200 PKR for Karachi, 250 PKR for others
  const calculateShipping = (city) => {
    if (!city) return 200; // default shown before city selected
    const c = String(city).toLowerCase();
    return c === 'karachi' ? 200 : 250;
  };
  const shippingCost = calculateShipping(formData.city);

  const giftWrapCost = formData.giftWrap ? 120 : 0;

  // Calculate discount
  const discountAmount = appliedCoupon ? appliedCoupon.calculatedDiscount : 0;

  const total = Math.max(0, subtotal + shippingCost + giftWrapCost - discountAmount);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Generate a simple idempotency key per submission to avoid duplicates
      const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const orderData = {
        ...formData,
        items: cartItems.map(item => ({
          productId: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        subtotal,
        shippingCost,
        giftWrapCost,
        total,
        giftWrap: formData.giftWrap,
        giftMessage: formData.giftMessage,

        requestId,
        couponCode: appliedCoupon ? appliedCoupon.code : null
      };

      const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (response.status === 503) {
        // Service unavailable - surface user-friendly message
        let errBody = { message: 'Service temporarily unavailable. Please try again later.' };
        try { errBody = await response.json(); } catch (e) { /* ignore parse errors */ }
        setError(errBody.message || 'Service temporarily unavailable. Please try again later.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order');
      }

      const data = await response.json();

      // Clear cart after successful order
      clearCart();

      // Call success callback with order details
      onSuccess(data.order);
    } catch (err) {
      setError(err.message);
      console.error('Order error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pakistanCities = [
    'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
    'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
    'Hyderabad', 'Sukkur', 'Bahawalpur', 'Sargodha', 'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl w-full max-w-2xl my-4 md:my-8 transform transition-all flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white px-6 py-6 rounded-t-2xl overflow-hidden sticky top-0 z-20">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-playfair font-bold">Checkout</h2>
                <p className="text-purple-100 text-sm">Complete your order</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="text-white hover:bg-white/20 p-2 rounded-full transition-all hover:rotate-90 duration-300"
              aria-label="Close checkout"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form (scrollable content area) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold">Error placing order</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Contact Information</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group">
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all group-hover:border-purple-300"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="group">
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all group-hover:border-purple-300"
                  placeholder="03XX XXXXXXX"
                />
              </div>
            </div>
            <div className="mt-4 group">
              <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all group-hover:border-purple-300"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Shipping Address</h3>
            </div>
            <div className="space-y-4">
              <div className="group">
                <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Complete Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="shippingAddress"
                  value={formData.shippingAddress}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all group-hover:border-blue-300 resize-none"
                  placeholder="House/Flat no., Street, Area, Landmark"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="group">
                  <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    City <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all group-hover:border-blue-300"
                  >
                    <option value="">Select City</option>
                    {pakistanCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Shipping is 200 PKR for Karachi, 250 PKR for other cities.</p>
                </div>
                <div className="group">
                  <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-2">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Postal Code <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all group-hover:border-blue-300"
                    placeholder="12345"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Notes */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
            <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-2">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Order Notes <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all hover:border-amber-300 resize-none"
              placeholder="Any special instructions or customization requests..."
            />
          </div>

          {/* Gift Wrap Option */}
          <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-5 border-2 border-pink-200">
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                id="giftWrap"
                name="giftWrap"
                checked={formData.giftWrap}
                onChange={handleChange}
                className="mt-1 w-5 h-5 text-pink-600 border-2 border-pink-300 rounded focus:ring-2 focus:ring-pink-500 cursor-pointer"
              />
              <div className="flex-1">
                <label htmlFor="giftWrap" className="flex items-center gap-2 text-base font-bold text-gray-900 mb-1 cursor-pointer">
                  <span>🎁 Add Gift Wrapping</span>
                  <span className="bg-pink-100 text-pink-700 text-xs font-bold px-2 py-1 rounded-full">
                    +Rs. 120
                  </span>
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Make it special! We'll wrap your order beautifully with a personalized gift message.
                </p>
                {formData.giftWrap && (
                  <div className="mt-3 animate-fadeIn">
                    <label className="flex items-center gap-1 text-sm font-semibold text-gray-700 mb-2">
                      <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Gift Message <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <textarea
                      name="giftMessage"
                      value={formData.giftMessage}
                      onChange={handleChange}
                      rows="3"
                      maxLength="200"
                      className="w-full px-4 py-3 bg-white border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all resize-none"
                      placeholder="Write your gift message here... (max 200 characters)"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.giftMessage.length}/200 characters
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Order Summary</h3>
            </div>

            <div className="bg-white rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-center text-gray-700">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
                </span>
                <span className="font-semibold">{subtotal} PKR</span>
              </div>

              <div className="flex justify-between items-center text-gray-700">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Shipping
                </span>
                <span className="font-semibold">{shippingCost} PKR</span>
              </div>

              {formData.giftWrap && (
                <div className="flex justify-between items-center text-gray-700">
                  <span className="flex items-center gap-2">
                    <span>🎁</span>
                    Gift Wrapping
                  </span>
                  <span className="font-semibold">{giftWrapCost} PKR</span>
                </div>
              )}

              {appliedCoupon && (
                <div className="flex justify-between items-center text-green-600 font-medium">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                    Discount ({appliedCoupon.code})
                  </span>
                  <span>- {discountAmount} PKR</span>
                </div>
              )}

              <div className="border-t-2 border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {total} PKR
                    </div>
                    <div className="text-xs text-gray-500">Inc. all taxes</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-white rounded-xl p-4 border-2 border-green-300">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 mb-1">💵 Cash on Delivery (COD)</div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Pay when you receive your order. No advance payment needed!
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons (sticky footer inside scroll area) */}
          <div className="sticky bottom-0 bg-white -mx-6 px-6 pt-4 pb-4 md:pb-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onBack}
              className="sm:flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold flex items-center justify-center gap-2 group"
            >
              <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Cart</span>
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="sm:flex-1 relative overflow-hidden px-6 py-4 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white rounded-xl hover:shadow-xl transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Placing Order...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Place Order Now</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
