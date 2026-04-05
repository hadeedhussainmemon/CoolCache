import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SEO from '../SEO/SEO';

export default function OrderTracking() {
  const { orderId: paramOrderId } = useParams();
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState(paramOrderId || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId.trim()}`);
      if (response.status === 404) {
        setError('Order not found. Please check your order ID.');
        return;
      }

      if (response.status === 503) {
        setError('Service temporarily unavailable. Order tracking requires the database. Please try again later.');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch order');
      }

      const data = await response.json();
      setOrder(data);
      
      // Update URL without reloading
      if (window.history.pushState) {
        window.history.pushState({}, '', `/track-order/${orderId.trim()}`);
      }
    } catch (err) {
      setError('Unable to fetch order. Please try again later.');
      console.error('Order fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-purple-100 text-purple-800 border-purple-200',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      delivered: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusSteps = (currentStatus) => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: '📦' },
      { key: 'confirmed', label: 'Confirmed', icon: '✓' },
      { key: 'processing', label: 'Processing', icon: '⚙️' },
      { key: 'shipped', label: 'Shipped', icon: '🚚' },
      { key: 'delivered', label: 'Delivered', icon: '🎉' }
    ];

    if (currentStatus === 'cancelled') {
      return [{ key: 'cancelled', label: 'Cancelled', icon: '❌', active: true }];
    }

    const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    return steps.map((step, index) => ({
      ...step,
      completed: index < currentIndex,
      active: index === currentIndex,
      future: index > currentIndex
    }));
  };

  return (
    <>
      <SEO 
        title="Track Your Order - CoolCache"
        description="Track your CoolCache order status and delivery information"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-playfair font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent mb-3">
              Track Your Order
            </h1>
            <p className="text-gray-600">Enter your order ID to see the current status</p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="flex gap-2">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter Order ID (e.g., 123)"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !orderId.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Track'}
              </button>
            </div>
          </form>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Order Details */}
          {order && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Order Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Order #{order.id}</h2>
                    <p className="text-purple-100">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', day: 'numeric', year: 'numeric' 
                      })}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full font-semibold ${getStatusColor(order.status)} border`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Order Progress</h3>
                <div className="flex justify-between items-center">
                  {getStatusSteps(order.status).map((step, index, arr) => (
                    <React.Fragment key={step.key}>
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl mb-2 ${
                          step.completed ? 'bg-green-500 text-white' :
                          step.active ? 'bg-purple-600 text-white animate-pulse' :
                          'bg-gray-200 text-gray-400'
                        }`}>
                          {step.icon}
                        </div>
                        <span className={`text-xs text-center ${
                          step.active ? 'font-semibold text-purple-600' : 'text-gray-600'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                      {index < arr.length - 1 && (
                        <div className={`flex-1 h-1 mx-2 rounded ${
                          step.completed ? 'bg-green-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Customer Name</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{order.customerPhone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Shipping Address</p>
                    <p className="font-medium">{order.shippingAddress}, {order.city}</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="p-6 border-t">
                <h3 className="text-lg font-semibold mb-4">Order Items ({order.items?.length || 0})</h3>
                <div className="space-y-3">
                  {order.items?.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">Rs. {item.price * item.quantity}</p>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>Rs. {order.subtotal || 0}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>Rs. {order.shippingCost || 0}</span>
                  </div>
                  {order.giftWrap && (
                    <div className="flex justify-between text-gray-600">
                      <span>Gift Wrap</span>
                      <span>Rs. {order.giftWrapCost || 0}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total</span>
                    <span>Rs. {order.total}</span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              <div className="p-6 bg-gray-50 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Payment Status</span>
                  <span className={`px-3 py-1 rounded-full font-semibold ${
                    order.paymentStatus === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {order.paymentStatus === 'paid' ? '✓ Paid' : 'Cash on Delivery'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Help Section */}
          {!order && !loading && (
            <div className="text-center mt-8 p-6 bg-white rounded-xl shadow">
              <p className="text-gray-600 mb-2">Need help with your order?</p>
              <p className="text-sm text-gray-500">
                Contact us on WhatsApp at{' '}
                <a 
                  href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER}`}
                  className="text-purple-600 hover:underline font-semibold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {import.meta.env.VITE_WHATSAPP_NUMBER}
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
