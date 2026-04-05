import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { formatOrderConfirmationMessage, formatOrderThankYouMessage } from '../../utils/orderMessages';

import getImageUrl from '../../utils/imageUrl';

// Memoized status color utility
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

// Memoized date formatter
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Memoized Stats Card Component
const StatsCard = React.memo(({ title, value, icon: Icon, color, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-white/20`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-white/80 font-medium mb-2">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className="bg-white/20 backdrop-blur-sm p-4 rounded-xl shadow-lg">
        <Icon />
      </div>
    </div>
  </div>
));

StatsCard.displayName = 'StatsCard';

// Memoized Order Item Component with improved image tag (skeleton, lazy load, accessible)
const OrderItem = React.memo(({ item }) => {
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const src = getImageUrl(item.image);

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="w-16 h-16 bg-white rounded-lg flex-shrink-0 overflow-hidden border border-purple-100 shadow-sm flex items-center justify-center transition-shadow duration-200 hover:shadow-md focus-within:shadow-md">
        {/* placeholder skeleton */}
        <div className={`absolute w-12 h-12 rounded-md bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse ${imgLoaded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}></div>
        <img
          src={src}
          alt={item.title || 'Product image'}
          className={`w-full h-full object-contain transition-opacity duration-200 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImgLoaded(true)}
          onError={(e) => {
            e.currentTarget.onerror = null; // Prevent infinite loop
            e.currentTarget.src = '/logo.png';
            setImgLoaded(true);
          }}
          tabIndex={0}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{item.title}</p>
        <p className="text-gray-600 text-xs">Qty: {item.quantity} × {item.price} PKR</p>
      </div>
      <p className="font-semibold">{item.quantity * item.price} PKR</p>
    </div>
  );
});

OrderItem.displayName = 'OrderItem';

// Memoized Order Card Component
const OrderCard = React.memo(({
  order,
  onStatusUpdate,
  onPaymentUpdate,
  onDelete,
  onCopyConfirmation,
  onCopyThankYou
}) => (
  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-100">
    <div className="p-6">
      {/* Order Header */}
      <div className="bg-gradient-to-r from-slate-50 to-violet-50 rounded-xl p-5 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-xl font-bold text-slate-900">Order #{order.id}</h3>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${getStatusColor(order.status)} shadow-sm`}>
                {order.status.toUpperCase()}
              </span>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 shadow-sm ${order.paymentStatus === 'paid'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}>
                {order.paymentStatus === 'paid' ? '💳 PAID' : '💵 COD'}
              </span>
            </div>
            <p className="text-sm text-slate-600 font-medium">{formatDate(order.createdAt)}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">{order.total} PKR</p>
            <p className="text-sm text-slate-600 mt-1 font-medium">{order.items.length} item(s)</p>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
          <p className="text-xs text-blue-600 font-bold mb-2 uppercase tracking-wide">👤 Customer</p>
          <p className="font-bold text-slate-900 text-lg mb-1">{order.customerName}</p>
          <p className="text-sm text-slate-700 font-medium">{order.customerPhone}</p>
          {order.customerEmail && <p className="text-sm text-slate-600">{order.customerEmail}</p>}
        </div>
        <div className="p-4 bg-orange-50 rounded-xl border-2 border-orange-100">
          <p className="text-xs text-orange-600 font-bold mb-2 uppercase tracking-wide">📍 Shipping Address</p>
          <p className="text-sm text-slate-900 font-semibold">{order.shippingAddress}</p>
          <p className="text-sm text-slate-700 font-medium">{order.city}{order.postalCode && `, ${order.postalCode}`}</p>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-5">
        <p className="text-xs text-violet-600 font-bold mb-3 uppercase tracking-wide">📦 Items</p>
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          {order.items.map((item, idx) => (
            <OrderItem key={idx} item={item} />
          ))}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
          <p className="text-xs text-blue-900 font-bold mb-2 uppercase tracking-wide">📝 Customer Notes:</p>
          <p className="text-sm text-blue-900 font-medium">{order.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-5 border-t-2 border-slate-200">
        <select
          value={order.status}
          onChange={(e) => onStatusUpdate(order.id, e.target.value)}
          className="px-4 py-2.5 border-2 border-violet-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white hover:border-violet-400 transition-colors"
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {order.paymentStatus === 'pending' && (
          <button
            onClick={() => onPaymentUpdate(order.id, 'paid')}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
          >
            💳 Mark as Paid
          </button>
        )}

        <button
          onClick={() => onCopyConfirmation(order)}
          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
          title="Copy personalized confirmation message"
        >
          📋 Confirmation
        </button>

        <button
          onClick={() => onCopyThankYou(order)}
          className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
          title="Copy thank-you message"
        >
          ✨ Thank You
        </button>

        <button
          onClick={() => onDelete(order.id)}
          className="ml-auto px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl text-sm font-semibold hover:from-rose-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
        >
          🗑️ Delete
        </button>
      </div>
    </div>
  </div>
));

OrderCard.displayName = 'OrderCard';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(8);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const API_BASE_URL = useMemo(() =>
    (import.meta.env.VITE_API_BASE_URL || window.__APP_CONFIG__?.API_BASE_URL || '').replace(/\/$/, ''),
    []
  );

  // IMAGE_BASE_URL is deprecated in favor of getImageUrl() utility

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const url = filter === 'all'
        ? `${API_BASE_URL}/api/orders`
        : `${API_BASE_URL}/api/orders?status=${filter}`;
      // Attach admin auth header if available
      const token = localStorage.getItem('adminToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(url, { headers });
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }
      if (response.status === 503) {
        setError('Service temporarily unavailable. Orders require the database.');
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, filter]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      const response = await fetch(`${API_BASE_URL}/api/orders/stats/summary`, { headers });
      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }
      if (response.status === 503) {
        // Surface stats error silently but do not crash main UI
        setError('Service temporarily unavailable. Unable to load statistics.');
        return;
      }
      if (!response.ok) return;
      const data = await response.json();
      setStats(data);
    } catch (err) {
      // Silent fail for stats
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchOrders();
    // reset to first page when filter or query changes
    setPage(1);
  }, [fetchOrders]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Filter and paginate orders client-side for nicer UX
  const filteredOrders = useMemo(() => {
    if (!query) return orders;
    const q = query.trim().toLowerCase();
    return orders.filter(o => {
      return String(o.id).includes(q) ||
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.customerPhone || '').toLowerCase().includes(q) ||
        (o.customerEmail || '').toLowerCase().includes(q);
    });
  }, [orders, query]);

  const totalPages = Math.max(1, Math.ceil((filteredOrders?.length || 0) / perPage));
  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * perPage;
    return (filteredOrders || []).slice(start, start + perPage);
  }, [filteredOrders, page, perPage]);

  const updateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };

      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (response.status === 503) {
        alert('Service temporarily unavailable. Order updates require the database.');
        return;
      }
      if (!response.ok) throw new Error('Failed to update order');

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
      fetchStats();
    } catch (err) {
      alert('Error updating order: ' + err.message);
      fetchOrders();
    }
  }, [API_BASE_URL, fetchOrders, fetchStats]);

  const updatePaymentStatus = useCallback(async (orderId, paymentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const headers = { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };

      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/payment`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ paymentStatus })
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (response.status === 503) {
        alert('Service temporarily unavailable. Payment updates require the database.');
        return;
      }
      if (!response.ok) throw new Error('Failed to update payment status');

      setOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, paymentStatus } : order
        )
      );
      fetchStats();
    } catch (err) {
      alert('Error updating payment status: ' + err.message);
      fetchOrders();
    }
  }, [API_BASE_URL, fetchOrders, fetchStats]);

  const deleteOrder = useCallback(async (orderId) => {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers
      });

      if (response.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
        return;
      }

      if (response.status === 503) {
        alert('Service temporarily unavailable. Deleting orders requires the database.');
        return;
      }
      if (!response.ok) throw new Error('Failed to delete order');

      setOrders(prev => prev.filter(order => order.id !== orderId));
      fetchStats();
    } catch (err) {
      alert('Error deleting order: ' + err.message);
      fetchOrders();
    }
  }, [API_BASE_URL, fetchOrders, fetchStats]);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return true;
      } catch {
        return false;
      }
    }
  }, []);

  const handleCopyConfirmation = useCallback(async (order) => {
    const msg = formatOrderConfirmationMessage(order);
    const ok = await copyToClipboard(msg);
    alert(ok ? '✅ Confirmation message copied to clipboard!' : '❌ Failed to copy message');
  }, [copyToClipboard]);

  const handleCopyThankYou = useCallback(async (order) => {
    const msg = formatOrderThankYouMessage(order);
    const ok = await copyToClipboard(msg);
    alert(ok ? '✅ Thank-you message copied to clipboard!' : '❌ Failed to copy message');
  }, [copyToClipboard]);

  const statsIcons = useMemo(() => ({
    total: () => (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    pending: () => (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    delivered: () => (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
      </svg>
    ),
    revenue: () => (
      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }), []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-200 border-t-violet-600"></div>
        <p className="mt-6 text-lg font-semibold text-slate-700">Loading orders...</p>
        <p className="mt-2 text-sm text-slate-500">Please wait while we fetch your data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gradient-to-br from-rose-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-rose-600 font-bold text-lg mb-2">Error Loading Orders</p>
          <p className="text-slate-600 mb-6 text-sm">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg hover:scale-105"
          >
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Orders" value={stats.total} icon={statsIcons.total} gradient="from-violet-600 to-purple-600" />
          <StatsCard title="Pending Orders" value={stats.pending} icon={statsIcons.pending} gradient="from-amber-500 to-orange-500" />
          <StatsCard title="Delivered" value={stats.delivered} icon={statsIcons.delivered} gradient="from-emerald-600 to-teal-600" />
          <StatsCard title="Total Revenue" value={`${stats.totalRevenue} PKR`} icon={statsIcons.revenue} gradient="from-blue-600 to-cyan-600" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-slate-100">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-700 font-semibold">Per page</label>
            <select value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }} className="px-4 py-2 border-2 border-violet-300 rounded-xl font-semibold focus:ring-2 focus:ring-violet-500 focus:border-violet-500 bg-white hover:border-violet-400 transition-colors">
              <option value={5}>5</option>
              <option value={8}>8</option>
              <option value={12}>12</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => { setFilter(status); setPage(1); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all shadow-sm hover:shadow-md ${filter === status
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white scale-105'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {status}
                {stats && status !== 'all' && <span className="ml-2 text-xs opacity-90">({stats[status]})</span>}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-16 text-center border-2 border-slate-100">
          <div className="w-24 h-24 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-12 h-12 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">No orders found</h3>
          <p className="text-slate-600">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onStatusUpdate={updateOrderStatus}
              onPaymentUpdate={updatePaymentStatus}
              onDelete={deleteOrder}
              onCopyConfirmation={handleCopyConfirmation}
              onCopyThankYou={handleCopyThankYou}
            />
          ))}
        </div>
      )}

      {/* Pagination - Only show in Grid Mode */}
      {/* Pagination */}
      {
        <div className="flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-slate-50 to-violet-50 rounded-2xl shadow-lg p-6 border-t-2 border-slate-100 gap-4">
          <div className="text-sm text-slate-700 font-semibold">Showing {(filteredOrders?.length ? (Math.min(page * perPage, filteredOrders.length) - ((page - 1) * perPage)) : 0)} of {filteredOrders?.length || 0} orders</div>
          <div className="flex items-center gap-3">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-5 py-2 rounded-xl bg-white border-2 border-slate-200 font-semibold hover:border-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md">← Prev</button>
            <div className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold shadow-md">Page {page} / {totalPages}</div>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-5 py-2 rounded-xl bg-white border-2 border-slate-200 font-semibold hover:border-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md">Next →</button>
          </div>
        </div>
      }
    </div >
  );
}

