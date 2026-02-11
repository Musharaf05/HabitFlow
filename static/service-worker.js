// Service Worker for HabitFlow Notifications
const CACHE_NAME = 'habitflow-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(self.clients.claim());
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked');
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Try to focus existing window
            for (let client of clientList) {
                if (client.url.includes('dashboard') && 'focus' in client) {
                    return client.focus();
                }
            }
            // Open new window if none exists
            if (clients.openWindow) {
                return clients.openWindow('/dashboard');
            }
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed');
});