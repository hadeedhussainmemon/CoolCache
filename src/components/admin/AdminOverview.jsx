import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, ShoppingBag, AlertTriangle, ArrowRight } from 'lucide-react';
import getImageUrl from '../../utils/imageUrl';
import SalesChart from './SalesChart';

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, gradient }) => (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl shadow-lg p-6 border border-white/20 text-white relative overflow-hidden group`}>
        <div className="relative z-10">
            <p className="text-sm font-medium opacity-90 mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 p-3 rounded-xl backdrop-blur-sm group-hover:scale-110 transition-transform">
            <Icon size={24} />
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
    </div>
);

export default function AdminOverview({ onChangeSection }) {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalProfit: 0,
        totalOrders: 0,
        totalProducts: 0,
        pendingOrders: 0,
        lowStockCount: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [chartData, setChartData] = useState([]); // New chart data state
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || window.__APP_CONFIG__?.API_BASE_URL || '';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                // Fetch Orders (for stats & recent)
                // Note: In a real app, use dedicated stats endpoints. Here we fetch all/recent lists if needed or mock aggregation if endpoints missing.
                // Re-using the summary endpoint seen in AdminOrders
                const statsRes = await fetch(`${API_BASE_URL}/api/orders/stats/summary`, { headers });
                const statsData = statsRes.ok ? await statsRes.json() : null;

                // Fetch Recent Orders (First page)
                const ordersRes = await fetch(`${API_BASE_URL}/api/orders?page=1&pageSize=5`, { headers });
                const ordersData = ordersRes.ok ? await ordersRes.json() : [];

                // Fetch Products (for stock)
                const prodRes = await fetch(`${API_BASE_URL}/api/products?pageSize=1000`);
                const prodData = prodRes.ok ? await prodRes.json() : [];
                const products = Array.isArray(prodData) ? prodData : prodData.products || [];

                // Process Data
                // Update process data logic
                const lowStock = products.filter(p => p.stock < 5 && p.stock > 0);

                // Sort monthly sales properly by month index if needed, or rely on backend
                const chartData = statsData?.monthlySales || [];

                setStats({
                    totalRevenue: statsData?.totalRevenue || 0,
                    totalProfit: statsData?.totalProfit || 0, // New field
                    totalOrders: statsData?.total || 0, // Count of all non-cancelled orders
                    pendingOrders: statsData?.pending || 0,
                    totalProducts: products.length,
                    lowStockCount: lowStock.length
                });

                setRecentOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);
                setLowStockProducts(lowStock.slice(0, 5));
                setChartData(chartData); // Need state for this
            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [API_BASE_URL]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-800">Dashboard Overview</h2>
                <p className="text-gray-500">Welcome back! Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Revenue"
                    value={`Rs. ${stats.totalRevenue.toLocaleString()}`}
                    icon={TrendingUp}
                    gradient="from-emerald-500 to-teal-500"
                />
                <StatsCard
                    title="Total Profit"
                    value={`Rs. ${stats.totalProfit.toLocaleString()}`}
                    icon={TrendingUp}
                    gradient="from-blue-500 to-indigo-500"
                />
                <StatsCard
                    title="Total Orders"
                    value={stats.totalOrders}
                    icon={ShoppingBag}
                    gradient="from-violet-500 to-purple-500"
                />
                {/* Replaced Pending with Profit, moved Pending to generic list or removed */}
                <StatsCard
                    title="Low Stock Items"
                    value={stats.lowStockCount}
                    icon={AlertTriangle}
                    gradient="from-rose-500 to-pink-500"
                />
            </div>

            {/* Monthly Sales Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Monthly Sales (Delivered)</h3>
                <SalesChart data={chartData.length > 0 ? chartData : [{ name: 'No Data', value: 0 }]} />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Recent Orders</h3>
                        <button onClick={() => onChangeSection('orders')} className="text-purple-600 hover:text-purple-700 text-sm font-semibold flex items-center gap-1">
                            View All <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {recentOrders.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No recent orders.</p>
                        ) : (
                            recentOrders.map(order => (
                                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-purple-50 transition-colors">
                                    <div>
                                        <div className="font-semibold text-gray-900">Order #{order.id}</div>
                                        <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-gray-800">Rs. {order.total}</div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800">Low Stock Alert</h3>
                        <button onClick={() => onChangeSection('products')} className="text-purple-600 hover:text-purple-700 text-sm font-semibold flex items-center gap-1">
                            Manage Inventory <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {lowStockProducts.length === 0 ? (
                            <div className="text-center py-8 text-green-600 bg-green-50 rounded-xl">
                                <p className="font-medium">All items are well stocked! 🎉</p>
                            </div>
                        ) : (
                            lowStockProducts.map(product => (
                                <div key={product.id} className="flex items-center gap-4 p-3 bg-red-50/50 border border-red-100 rounded-xl">
                                    <div className="w-12 h-12 bg-white rounded-lg flex-shrink-0 p-1">
                                        <img src={getImageUrl(product.image, { width: 100, crop: 'fill' })} alt={product.title} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{product.title}</p>
                                        <p className="text-xs text-red-600 font-semibold">Only {product.stock} left in stock</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
