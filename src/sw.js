/* eslint-env serviceworker */
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

// Clean old caches
cleanupOutdatedCaches();

// Precache resources
precacheAndRoute(self.__WB_MANIFEST);

// Take control immediately
self.skipWaiting();
clientsClaim();

// Handle Push Notifications
self.addEventListener('push', (event) => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'CoolCache Update';
    const options = {
        body: data.body || 'Check out our latest products!',
        icon: data.icon || '/pwa-192x192.png',
        image: data.image || null,
        badge: '/pwa-192x192.png',
        tag: 'coolcache-notification',
        renotify: true,
        data: data.data || { url: '/' },
        actions: []  // Explicitly remove any actions like 'Unsubscribe'
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const urlToOpen = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not, open a new window
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
