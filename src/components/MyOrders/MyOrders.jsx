import React, { useState } from 'react';

export default function MyOrders() {
  const [contact, setContact] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

  const handleSearch = async (e) => {
    e && e.preventDefault();
    if (!contact.trim()) return;
    setLoading(true);
    setError(null);
    setOrders([]);

    try {
      const url = `${API_BASE_URL}/api/orders/customer/${encodeURIComponent(contact.trim())}`;
      const res = await fetch(url);
      if (res.status === 503) {
        setError('Service temporarily unavailable. Please try again later.');
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to fetch orders');
      }

      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      setError(err.message || 'Unable to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">My Orders</h1>

      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="Enter phone number or email"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">Search</button>
      </form>

      {loading && <div className="text-gray-600">Searching orders...</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">{error}</div>}

      {!loading && orders.length === 0 && !error && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-600">No orders found for this contact</div>
      )}

      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold">Order #{order.id}</h2>
                <p className="text-sm text-gray-600">Placed: {new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-purple-600">{order.total} PKR</p>
                <p className="text-xs text-gray-500">{order.items?.length || 0} item(s)</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Shipping Address</p>
                <p className="font-medium">{order.shippingAddress}, {order.city}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Status</p>
                <p className="font-medium">{order.status}</p>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-2">Items</p>
              <div className="space-y-2">
                {order.items?.map((it, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{it.title}</p>
                      <p className="text-sm text-gray-600">Qty: {it.quantity} × {it.price} PKR</p>
                    </div>
                    <div className="font-semibold">{it.quantity * it.price} PKR</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 text-right">
              <button onClick={() => window.location.href = `/track-order/${order.id}`} className="px-3 py-2 bg-gray-100 rounded">Track</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
