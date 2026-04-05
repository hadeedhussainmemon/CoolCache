import React from 'react';
import { usePushNotification } from '../../hooks/usePushNotification';
import { Bell, BellRing, Loader2 } from 'lucide-react';

export default function PushToggle() {
    const { isSubscribed, subscribe, unsubscribe, loading, error } = usePushNotification();

    const handleToggle = async () => {
        if (loading) return;

        if (isSubscribed) {
            if (confirm('Turn off notifications?')) {
                await unsubscribe();
            }
        } else {
            const success = await subscribe();
            if (success) {
                // Success message handling
            }
        }
    };

    if (error) {
        return <p className="text-xs text-red-500">Push Error: {error}</p>;
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${isSubscribed
                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                : 'bg-violet-600 text-white hover:bg-violet-700 shadow-md hover:shadow-lg'
                }`}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : isSubscribed ? (
                <BellRing className="w-4 h-4" />
            ) : (
                <Bell className="w-4 h-4" />
            )}
            {isSubscribed ? 'Notifications On' : 'Enable Notifications'}
        </button>
    );
}
