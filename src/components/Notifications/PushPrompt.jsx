import React, { useState, useEffect } from 'react';
import { usePushNotification } from '../../hooks/usePushNotification';
import { Bell, X } from 'lucide-react';

export default function PushPrompt() {
    const { isSubscribed, subscribe, loading } = usePushNotification();
    const [show, setShow] = useState(false);

    useEffect(() => {
        // 1. If already subscribed, don't show
        if (isSubscribed || loading) return;

        // 2. Check if user dismissed it recently (e.g., last 24h)
        const lastDismissed = localStorage.getItem('push_prompt_dismissed');
        if (lastDismissed) {
            const hoursSince = (Date.now() - parseInt(lastDismissed)) / 1000 / 60 / 60;
            if (hoursSince < 24) return;
        }

        // 3. Show after 5 seconds
        const timer = setTimeout(() => {
            setShow(true);
        }, 5000);

        return () => clearTimeout(timer);
    }, [isSubscribed, loading]);

    const handleDismiss = () => {
        setShow(false);
        localStorage.setItem('push_prompt_dismissed', Date.now().toString());
    };

    const handleSubscribe = async () => {
        const success = await subscribe();
        if (success) {
            setShow(false);
        } else {
            alert('Could not enable notifications. Please check your browser settings or ensure you are not in Incognito/Private mode.');
        }
    };

    if (!show) return null;

    return (
        <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 flex justify-center pointer-events-none animate-slide-up">
            <div className="bg-white/90 backdrop-blur-xl border border-white/40 shadow-2xl rounded-2xl p-5 max-w-sm w-full pointer-events-auto relative overflow-hidden ring-1 ring-black/5">

                {/* Decorative Gradient Background */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500" />
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-200/50 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-pink-200/50 rounded-full blur-2xl" />

                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 bg-white/50 hover:bg-white rounded-full transition-all"
                >
                    <X size={16} />
                </button>

                <div className="flex gap-4 relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-fuchsia-50 rounded-xl flex items-center justify-center shrink-0 shadow-inner border border-white/50">
                        <Bell className="w-6 h-6 text-violet-600 fill-violet-600/20" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">Enable Updates? ⚡</h3>
                        <p className="text-sm text-gray-600 mt-1 mb-4 leading-relaxed">
                            Be the first to know about flash sales, restocks, and exclusive offers.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleSubscribe}
                                disabled={loading}
                                className={`flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 ${loading ? 'opacity-80 cursor-wait' : ''}`}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Allowing...</span>
                                    </>
                                ) : (
                                    'Yes, Notify Me'
                                )}
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2.5 text-gray-600 text-sm font-medium hover:text-gray-900 hover:bg-gray-100/80 rounded-lg transition-colors"
                            >
                                Later
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
