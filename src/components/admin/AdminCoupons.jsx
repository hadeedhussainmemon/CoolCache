import React, { useState, useEffect, useMemo } from 'react';
import { Ticket, Trash2, Plus, Calendar, AlertCircle, Percent, DollarSign, Loader, X } from 'lucide-react';

export default function AdminCoupons() {
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [creating, setCreating] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage', // percentage | fixed
        discountValue: '',
        minOrderAmount: '0',
        expiryDate: '',
        usageLimit: ''
    });

    const API_BASE_URL = useMemo(() =>
        (import.meta.env.VITE_API_BASE_URL || window.__APP_CONFIG__?.API_BASE_URL || '').replace(/\/$/, ''),
        []
    );

    const fetchCoupons = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('adminToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${API_BASE_URL}/api/coupons`, { headers });
            if (!response.ok) throw new Error('Failed to fetch coupons');

            const data = await response.json();
            setCoupons(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, [API_BASE_URL]);

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this coupon?')) return;
        try {
            const token = localStorage.getItem('adminToken');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch(`${API_BASE_URL}/api/coupons/${id}`, {
                method: 'DELETE',
                headers
            });

            if (!response.ok) throw new Error('Failed to delete coupon');

            setCoupons(prev => prev.filter(c => c._id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setCreating(true);
            const token = localStorage.getItem('adminToken');
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };

            const payload = {
                ...formData,
                usageLimit: formData.usageLimit || null // Send null if empty string
            };

            const response = await fetch(`${API_BASE_URL}/api/coupons`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Failed to create coupon');

            setCoupons(prev => [data, ...prev]);
            setShowAddModal(false);
            setFormData({
                code: '',
                discountType: 'percentage',
                discountValue: '',
                minOrderAmount: '0',
                expiryDate: '',
                usageLimit: ''
            });
        } catch (err) {
            alert(err.message);
        } finally {
            setCreating(false);
        }
    };

    const isExpired = (dateString) => new Date(dateString) < new Date();

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-200 border-t-violet-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Discount Coupons</h2>
                    <p className="text-slate-600">Manage promo codes and discounts</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                    <Plus size={20} />
                    Create Coupon
                </button>
            </div>

            {error && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 font-medium flex items-center gap-3">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {/* Coupons Grid */}
            {coupons.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg p-16 text-center border-2 border-slate-100">
                    <div className="w-20 h-20 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Ticket size={40} className="text-violet-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">No coupons yet</h3>
                    <p className="text-slate-500 mt-2">Create your first discount code to boost sales!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.map(coupon => (
                        <div key={coupon._id} className={`bg-white rounded-xl shadow-md border-2 p-5 relative overflow-hidden transition-all hover:shadow-lg ${isExpired(coupon.expiryDate) || !coupon.isActive ? 'border-slate-100 opacity-75' : 'border-violet-100'}`}>

                            {/* Status Badge */}
                            <div className={`absolute top-4 right-4 text-xs font-bold px-2 py-1 rounded-full ${!coupon.isActive ? 'bg-slate-100 text-slate-500' :
                                    isExpired(coupon.expiryDate) ? 'bg-rose-100 text-rose-600' :
                                        'bg-emerald-100 text-emerald-700'
                                }`}>
                                {!coupon.isActive ? 'INACTIVE' : isExpired(coupon.expiryDate) ? 'EXPIRED' : 'ACTIVE'}
                            </div>

                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2.5 bg-violet-50 text-violet-600 rounded-lg">
                                    <Ticket size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 tracking-wide">{coupon.code}</h3>
                                    <div className="flex items-center gap-1 text-sm text-violet-600 font-semibold">
                                        {coupon.discountType === 'percentage' ? <Percent size={14} /> : <DollarSign size={14} />}
                                        {coupon.discountValue}{coupon.discountType === 'percentage' ? '% OFF' : ' PKR OFF'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-slate-600 mt-4 bg-slate-50 p-3 rounded-lg">
                                <div className="flex justify-between">
                                    <span>Usage:</span>
                                    <span className="font-semibold">{coupon.usedCount} / {coupon.usageLimit || '∞'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Min Order:</span>
                                    <span className="font-semibold">{coupon.minOrderAmount} PKR</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        Expires:
                                    </div>
                                    <span className={isExpired(coupon.expiryDate) ? 'text-rose-500 font-bold' : ''}>
                                        {new Date(coupon.expiryDate).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => handleDelete(coupon._id)}
                                    className="text-rose-500 hover:text-rose-700 p-2 hover:bg-rose-50 rounded-lg transition-colors"
                                    title="Delete Coupon"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Coupon Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-900">Create New Coupon</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Coupon Code</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. SUMMER2024"
                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none uppercase font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal"
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Type</label>
                                    <select
                                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none bg-white"
                                        value={formData.discountType}
                                        onChange={e => setFormData({ ...formData, discountType: e.target.value })}
                                    >
                                        <option value="percentage">Percentage (%)</option>
                                        <option value="fixed">Fixed Amount (PKR)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Value</label>
                                    <input
                                        required
                                        type="number"
                                        min="0"
                                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                                        value={formData.discountValue}
                                        onChange={e => setFormData({ ...formData, discountValue: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Min Order (PKR)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                                        value={formData.minOrderAmount}
                                        onChange={e => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Usage Limit</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Unlimited"
                                        className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                                        value={formData.usageLimit}
                                        onChange={e => setFormData({ ...formData, usageLimit: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Expiry Date</label>
                                <input
                                    required
                                    type="date"
                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-violet-500 focus:outline-none"
                                    value={formData.expiryDate}
                                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border-2 border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {creating ? <Loader className="animate-spin" size={18} /> : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
