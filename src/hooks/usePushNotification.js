import { useState, useEffect } from 'react';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function usePushNotification() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check initial status
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
                setIsSubscribed(false);
                setLoading(false);
                return;
            }

            const registration = await navigator.serviceWorker.ready;
            if (!registration.pushManager) {
                console.warn('PushManager not available');
                setIsSubscribed(false);
                return;
            }
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (err) {
            console.error('Error checking subscription:', err);
        } finally {
            setLoading(false);
        }
    };

    const subscribe = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!VAPID_PUBLIC_KEY) {
                throw new Error('VAPID Public Key key is missing in env');
            }

            // Check if SW is supported and ready
            if (!navigator.serviceWorker) {
                throw new Error('Service Worker not supported');
            }

            // Race key SW readiness
            const registration = await Promise.race([
                navigator.serviceWorker.ready,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Service Worker registration timeout')), 5000))
            ]);

            if (!registration.pushManager) {
                throw new Error('Push notifications are not supported on this device/browser.');
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Send to backend
            const response = await fetch(`${API_BASE_URL}/api/notifications/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(subscription)
            });

            if (!response.ok) {
                throw new Error('Failed to save subscription on server');
            }

            setIsSubscribed(true);
            return true;
        } catch (err) {
            console.error('Subscribe error:', err);
            setError(err.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const unsubscribe = async () => {
        try {
            setLoading(true);
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            if (subscription) {
                await subscription.unsubscribe();
                setIsSubscribed(false);
                return true;
            }
        } catch (err) {
            console.error('Unsubscribe error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { isSubscribed, subscribe, unsubscribe, loading, error };
}
