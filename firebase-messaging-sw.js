// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
    apiKey: "AIzaSyD7AWZX-mcrwSX85Pv6Db23miIH9ruW9mQ",
    authDomain: "habitflow-af3d3.firebaseapp.com",
    projectId: "habitflow-af3d3",
    storageBucket: "habitflow-af3d3.firebasestorage.app",
    messagingSenderId: "1050299256022",
    appId: "1:1050299256022:web:8a04c309b83e2fb1f28d77"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('📩 Background message received:', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/static/checklist_16688556.png',
        badge: '/static/checklist_16688556.png',
        vibrate: [200, 100, 200],
        data: payload.data,
        requireInteraction: true,
        actions: [
            { action: 'open', title: 'Open HabitFlow' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.action);
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
                for (let client of clientList) {
                    if ('focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
        );
    }
});