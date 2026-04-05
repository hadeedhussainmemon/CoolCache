import React from "react";
import getImageUrl from '../../utils/imageUrl';
import PushToggle from '../Notifications/PushToggle';

export default function OrderSuccess({ order, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-80 flex items-center justify-center p-2 sm:p-6">
      <div className="bg-white rounded-xl shadow-2xl w-[95vw] sm:w-full max-w-sm sm:max-w-2xl p-2 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Success Icon */}
        <div className="text-center pt-8 pb-4">
          <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-playfair font-bold text-gray-900 mb-2">
            <span className="text-xl sm:text-2xl font-playfair font-bold text-gray-900 mb-2">
              Order Placed Successfully!
            </span>
          </h2>
          <p className="text-gray-600">
            <span className="text-sm sm:text-base text-gray-600">
              Thank you for your order. We'll contact you shortly.
            </span>
          </p>
        </div>

        {/* Order Details */}
        <div className="px-6 pb-6 space-y-4">

          {/* Push Notification Upsell */}
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100 mb-4">
            <h3 className="font-bold text-violet-900 flex items-center gap-2">
              <span className="text-xl">🔔</span>
              Get Instant Updates
            </h3>
            <p className="text-sm text-violet-700 mt-1 mb-3">
              Receive real-time notifications about your order status directly on your device.
            </p>
            <PushToggle />
          </div>

          <div className="bg-linear-to-r from-purple-50 to-pink-50 rounded-lg p-3 sm:p-6 border border-purple-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-base text-gray-600">
                Order ID
              </span>
              <span className="text-base sm:text-xl font-bold text-purple-600">
                #{order.id}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-base text-gray-600">
                Total Amount
              </span>
              <span className="text-lg sm:text-2xl font-bold text-gray-900">
                {order.total} PKR
              </span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <svg
                className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <div>
                <p className="font-medium text-gray-900">
                  {order.customerName}
                </p>
                <p className="text-xs sm:text-base text-gray-600">
                  {order.customerPhone}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <svg
                className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <div>
                <p className="text-gray-900">{order.shippingAddress}</p>
                <p className="text-xs sm:text-base text-gray-600">
                  {order.city}
                  {order.postalCode && `, ${order.postalCode}`}
                </p>
              </div>
            </div>
          </div>

          {/* Items Summary */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-900 mb-3 text-base sm:text-xl">
              Order Items
            </h3>
            <div className="space-y-2 max-h-32 sm:max-h-60 overflow-y-auto">
              {order.items.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 bg-gray-100 rounded shrink-0 overflow-hidden">
                    <img
                      src={getImageUrl(item.image)}
                      alt={item.title}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs sm:text-base text-gray-600">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    <span className="text-xs sm:text-lg">
                      {item.price * item.quantity} PKR
                    </span>
                  </p>
                </div>
              ))}
              {order.items.length > 5 && (
                <div className="text-center text-xs text-gray-500 py-2">
                  +{order.items.length - 5} more items
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
            <svg
              className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600 mt-0.5 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm">
              <p className="font-medium text-blue-900">
                Cash on Delivery (COD)
              </p>
              <p className="text-blue-700">
                Pay {order.total} PKR when you receive your order
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 text-base sm:text-xl">
              What's Next?
            </h4>
            <ul className="space-y-2 text-xs sm:text-base text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">1.</span>
                <span>
                  We'll call you to confirm your order within 24 hours
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">2.</span>
                <span>Your order will be processed and shipped</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">3.</span>
                <span>Pay cash when you receive your beautiful jewelry!</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={() => window.location.href = `/track-order/${order.id}`}
              className="flex-1 px-4 py-2 sm:px-8 sm:py-4 bg-white border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-all font-semibold text-base sm:text-xl"
            >
              Track Order
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 sm:px-8 sm:py-4 bg-linear-to-r from-purple-600 to-pink-500 text-white rounded-lg hover:from-purple-700 hover:to-pink-600 transition-all font-semibold text-base sm:text-xl"
            >
              Continue Shopping
            </button>
          </div>

          {/* Contact Info */}
          <div className="text-center text-sm text-gray-500 pt-2">
            <p className="text-xs sm:text-base">Questions about your order?</p>
            <a
              href={`https://www.instagram.com/${import.meta.env.VITE_INSTAGRAM_USERNAME
                }`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-700 font-medium text-xs sm:text-base"
            >
              Contact us on Instagram
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
