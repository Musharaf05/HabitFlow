// Service Worker for Background Notifications
const CACHE_NAME = 'habitflow-v1';
const NOTIFICATION_TAG = 'habitflow-reminder';

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service Worker: Caching files');
            return cache.addAll([
                '/',
                '/static/tasks.css',
                '/static/tasks.js',
                '/static/notifications.css',
                '/static/notifications.js'
            ]).catch(err => {
                console.log('Cache addAll error:', err);
            });
        })
    );
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.notification.tag);
    
    event.notification.close();
    
    // Open or focus the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Check if app is already open
            for (let client of clientList) {
                if (client.url.includes('/dashboard') && 'focus' in client) {
                    return client.focus();
                }
            }
            // If not open, open new window
            if (clients.openWindow) {
                return clients.openWindow('/dashboard');
            }
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event.notification.tag);
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
    console.log('Service Worker received message:', event.data);
    
    if (event.data.type === 'CHECK_REMINDERS') {
        checkAndNotify(event.data.reminders);
    }
    
    if (event.data.type === 'SHOW_NOTIFICATION') {
        showNotification(event.data.reminder);
    }
});

// Check reminders and show notifications
function checkAndNotify(reminders) {
    if (!reminders || reminders.length === 0) return;
    
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    reminders.forEach(reminder => {
        if (reminder.date === currentDate && reminder.time) {
            if (isTimeMatch(currentTime, reminder.time)) {
                showNotification(reminder);
            }
        }
    });
}

function isTimeMatch(currentTime, reminderTime) {
    const [currentHour, currentMin] = currentTime.split(':').map(Number);
    const [reminderHour, reminderMin] = reminderTime.split(':').map(Number);
    
    const currentMinutes = currentHour * 60 + currentMin;
    const reminderMinutes = reminderHour * 60 + reminderMin;
    
    return Math.abs(currentMinutes - reminderMinutes) <= 1;
}

function showNotification(reminder) {
    const title = '🔔 HabitFlow Reminder';
    const options = {
        body: reminder.text,
        icon: '/static/checklist_16688556.png',
        badge: '/static/checklist_16688556.png',
        tag: `reminder-${reminder.id}`,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        actions: [
            {
                action: 'view',
                title: 'View Reminder'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        data: {
            reminderId: reminder.id,
            url: '/dashboard'
        },
        timestamp: Date.now()
    };
    
    self.registration.showNotification(title, options);
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-reminders') {
        event.waitUntil(checkRemindersBackground());
    }
});

async function checkRemindersBackground() {
    // Fetch reminders from server
    try {
        const response = await fetch('/getReminders');
        const reminders = await response.json();
        checkAndNotify(reminders);
    } catch (error) {
        console.error('Error checking reminders:', error);
    }
}