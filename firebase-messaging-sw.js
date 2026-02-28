// Firebase Cloud Messaging Service Worker
// This file MUST be at the root of your domain

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
firebase.initializeApp({
    apiKey: "AIzaSyD7AWZX-mcrwSX85Pv6Db23miIH9ruW9mQ",
    authDomain: "habitflow-af3d3.firebaseapp.com",
    projectId: "habitflow-af3d3",
    storageBucket: "habitflow-af3d3.firebasestorage.app",
    messagingSenderId: "1050299256022",
    appId: "1:1050299256022:web:8a04c309b83e2fb1f28d77",
    measurementId: "G-PN9XJC5EB4"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('📩 Background message received:', payload);
    
    const notificationTitle = payload.notification?.title || 'HabitFlow Reminder';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/static/checklist_16688556.png',
        badge: '/static/checklist_16688556.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: payload.data
    };
    
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('🖱️ Notification clicked');
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Focus existing window if open
                for (let client of clientList) {
                    if ('focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if none exists
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

console.log('✅ Firebase messaging service worker loaded');