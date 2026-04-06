import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
        }
    };

    const categories = [
        { name: 'Jewelry', slug: 'jewelry', emoji: '💍' },
        { name: 'Watches', slug: 'watches', emoji: '⌚' },
        { name: 'Fashion', slug: 'fashion', emoji: '👗' },
        { name: 'Electronics', slug: 'electronics', emoji: '📱' }
    ];

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 text-center overflow-hidden relative">
            {/* Background Decor */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-50 rounded-full blur-3xl -z-10 opacity-50 animate-pulse"></div>

            {/* Main 404 Visual */}
            <div className="relative mb-8 group cursor-default">
                <div className="text-[180px] font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-200 to-pink-200 select-none leading-none animate-bounce-slow">
                    404
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500">
                        <span className="text-6xl filter drop-shadow-md">🙈</span>
                    </div>
                </div>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 font-playfair">
                Whoops! Nothing to see here.
            </h1>
            <p className="text-gray-500 text-lg max-w-md mb-8 leading-relaxed">
                The page you're looking for might have been moved, deleted, or possibly never existed.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="w-full max-w-sm mb-10 relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-500 transition-colors">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Search for something else..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-gray-200 shadow-sm focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:outline-none transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 rounded-xl font-medium hover:shadow-lg transition-all active:scale-95"
                >
                    Go
                </button>
            </form>

            {/* Recent Categories */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
                {categories.map((cat) => (
                    <Link
                        key={cat.slug}
                        href={`/category/${cat.slug}`}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-full text-sm font-medium text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700 transition-all shadow-sm hover:shadow-md"
                    >
                        <span>{cat.emoji}</span>
                        {cat.name}
                    </Link>
                ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all"
                >
                    <ArrowLeft size={18} />
                    Go Back
                </button>
                <Link
                    href="/"
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-105 transition-all"
                >
                    <Home size={18} />
                    Back to Home
                </Link>
            </div>

            <style>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(-5%); }
                    50% { transform: translateY(5%); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
}
