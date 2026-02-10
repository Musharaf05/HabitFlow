// --- ENHANCED NOTIFICATION SYSTEM WITH SERVICE WORKER ---
class NotificationManager {
    constructor() {
        this.checkInterval = null;
        this.notifiedReminders = new Set();
        this.permissionGranted = false;
        this.serviceWorkerRegistration = null;
        this.lastCheckTime = null;
        this.init();
    }

    async init() {
        await this.registerServiceWorker();
        await this.requestPermission();
        this.startChecking();
        this.scheduleResetAtMidnight();
        this.setupBackgroundSync();
    }

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('Service Workers not supported');
            return;
        }

        try {
            this.serviceWorkerRegistration = await navigator.serviceWorker.register('/service-worker.js', {
                scope: '/'
            });
            
            console.log('Service Worker registered successfully');
            await navigator.serviceWorker.ready;
            console.log('Service Worker is ready');
            
            navigator.serviceWorker.addEventListener('message', (event) => {
                console.log('Message from Service Worker:', event.data);
            });
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    async requestPermission() {
        if (!("Notification" in window)) {
            console.log("This browser does not support desktop notifications");
            return;
        }

        if (Notification.permission === "granted") {
            this.permissionGranted = true;
            console.log('Notification permission already granted');
        } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            this.permissionGranted = (permission === "granted");
            
            if (this.permissionGranted) {
                this.showTestNotification();
            } else {
                console.log("Notification permission denied");
            }
        } else {
            console.log("Notifications are blocked");
        }
    }

    async showTestNotification() {
        const title = "✅ HabitFlow Notifications Enabled";
        const options = {
            body: "You will receive reminder notifications at the scheduled time!",
            icon: "/static/checklist_16688556.png",
            badge: "/static/checklist_16688556.png",
            tag: "test-notification",
            requireInteraction: false,
            vibrate: [200, 100, 200]
        };

        if (this.serviceWorkerRegistration) {
            await this.serviceWorkerRegistration.showNotification(title, options);
        } else {
            new Notification(title, options);
        }
    }

    setupBackgroundSync() {
        if ('periodicSync' in this.serviceWorkerRegistration) {
            this.serviceWorkerRegistration.periodicSync.register('check-reminders', {
                minInterval: 60000
            }).then(() => {
                console.log('Periodic background sync registered');
            }).catch(err => {
                console.log('Periodic background sync failed:', err);
            });
        }
    }

    startChecking() {
        this.checkReminders();
        this.checkInterval = setInterval(() => {
            this.checkReminders();
        }, 30000); // Check every 30 seconds
    }

    stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    async checkReminders() {
        if (!data.reminders || data.reminders.length === 0) return;

        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMin;

        for (const reminder of data.reminders) {
            // Skip if no date or time
            if (!reminder.date || !reminder.time) continue;

            // Skip if reminder is not for today
            if (reminder.date !== currentDate) continue;

            // Create unique key for this reminder today
            const reminderKey = `${reminder.id}-${currentDate}`;
            
            // Skip if already notified
            if (this.notifiedReminders.has(reminderKey)) {
                continue;
            }

            // Parse reminder time (HH:MM format from database)
            const [reminderHour, reminderMin] = reminder.time.split(':').map(Number);
            const reminderTotalMinutes = reminderHour * 60 + reminderMin;

            // Check if current time matches reminder time (within 1 minute)
            // Only trigger if we're AT or JUST PAST the reminder time (not before, not long after)
            if (currentTotalMinutes >= reminderTotalMinutes && 
                currentTotalMinutes <= reminderTotalMinutes + 1) {
                
                console.log(`Triggering notification for reminder: ${reminder.text} at ${reminder.time}`);
                await this.triggerNotification(reminder);
                this.notifiedReminders.add(reminderKey);
            }
        }

        if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
            this.serviceWorkerRegistration.active.postMessage({
                type: 'CHECK_REMINDERS',
                reminders: data.reminders
            });
        }
    }

    async triggerNotification(reminder) {
        await this.showDesktopNotification(reminder);
        this.showVisualNotification(reminder);
        this.playNotificationSound();
    }

    async showDesktopNotification(reminder) {
        if (!this.permissionGranted) return;

        const time12Hour = this.convertTo12Hour(reminder.time);
        const title = "🔔 Reminder";
        const options = {
            body: `${reminder.text}\nTime: ${time12Hour}`,
            icon: "/static/checklist_16688556.png",
            badge: "/static/checklist_16688556.png",
            tag: `reminder-${reminder.id}`,
            requireInteraction: true,
            vibrate: [200, 100, 200, 100, 200],
            actions: [
                {
                    action: 'view',
                    title: 'View'
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

        try {
            if (this.serviceWorkerRegistration) {
                await this.serviceWorkerRegistration.showNotification(title, options);
            } else {
                new Notification(title, options);
            }
        } catch (error) {
            console.error('Error showing notification:', error);
        }
    }

    showVisualNotification(reminder) {
        const time12Hour = this.convertTo12Hour(reminder.time);
        
        const banner = document.createElement('div');
        banner.className = 'notification-banner';
        banner.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <svg viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                    </svg>
                </div>
                <div class="notification-text">
                    <div class="notification-title">Reminder</div>
                    <div class="notification-body">${reminder.text}</div>
                    <div class="notification-time">${time12Hour}</div>
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <svg viewBox="0 0 24 24" width="18" height="18">
                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
            </div>
        `;

        document.body.appendChild(banner);

        setTimeout(() => {
            if (banner.parentElement) {
                banner.classList.add('fade-out');
                setTimeout(() => banner.remove(), 300);
            }
        }, 10000);
    }

    convertTo12Hour(time24) {
        if (!time24) return '';
        const [hours, minutes] = time24.split(':');
        let hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        return `${hour}:${minutes} ${ampm}`;
    }

    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            for (let i = 0; i < 2; i++) {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.frequency.value = 800;
                oscillator.type = 'sine';

                const startTime = audioContext.currentTime + (i * 0.3);
                gainNode.gain.setValueAtTime(0.3, startTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

                oscillator.start(startTime);
                oscillator.stop(startTime + 0.2);
            }
        } catch (error) {
            console.log("Audio notification failed:", error);
        }
    }

    scheduleResetAtMidnight() {
        const now = new Date();
        const night = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            0, 0, 0
        );
        const msToMidnight = night.getTime() - now.getTime();

        setTimeout(() => {
            console.log('Resetting notified reminders at midnight');
            this.notifiedReminders.clear();
            this.scheduleResetAtMidnight();
        }, msToMidnight);
    }

    async testNotification() {
        const now = new Date();
        const testReminder = {
            id: 'test-' + Date.now(),
            text: 'This is a test desktop notification! 🎉',
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().slice(0, 5)
        };
        await this.triggerNotification(testReminder);
    }
}

// Initialize notification manager
let notificationManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
} else {
    initNotifications();
}

async function initNotifications() {
    notificationManager = new NotificationManager();
    addNotificationButton();
}

function addNotificationButton() {
    const navbar = document.querySelector('.navbar');
    if (navbar && !navbar.querySelector('.notification-settings-btn')) {
        const notifBtn = document.createElement('button');
        notifBtn.className = 'notification-settings-btn';
        notifBtn.setAttribute('aria-label', 'Notification Settings');
        notifBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
        `;
        notifBtn.onclick = showNotificationSettings;
        
        const logoutBtn = navbar.querySelector('.logout-btn');
        navbar.insertBefore(notifBtn, logoutBtn);
    }
}

function showNotificationSettings() {
    const modal = document.createElement('div');
    modal.className = 'notification-modal';
    modal.innerHTML = `
        <div class="notification-modal-content">
            <div class="notification-modal-header">
                <h2>Notification Settings</h2>
                <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="notification-modal-body">
                <div class="notification-status">
                    <span class="status-label">Desktop Notifications:</span>
                    <span class="status-value ${notificationManager.permissionGranted ? 'enabled' : 'disabled'}">
                        ${notificationManager.permissionGranted ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                </div>
                
                <div class="notification-status">
                    <span class="status-label">Service Worker:</span>
                    <span class="status-value ${notificationManager.serviceWorkerRegistration ? 'enabled' : 'disabled'}">
                        ${notificationManager.serviceWorkerRegistration ? '✓ Active' : '✗ Inactive'}
                    </span>
                </div>
                
                ${!notificationManager.permissionGranted ? `
                    <button class="enable-notifications-btn" onclick="enableNotifications()">
                        Enable Desktop Notifications
                    </button>
                ` : ''}
                
                <button class="test-notification-btn" onclick="notificationManager.testNotification()">
                    Send Test Notification
                </button>
                
                <div class="notification-info">
                    <h3>How it works:</h3>
                    <ul>
                        <li>Notifications appear at the exact scheduled time</li>
                        <li>Each reminder notifies only once per day</li>
                        <li>Works even when browser is minimized</li>
                        <li>Checks every 30 seconds for due reminders</li>
                    </ul>
                </div>
                
                <div class="notification-info warning">
                    <h3>⚠️ Important:</h3>
                    <ul>
                        <li>Browser must be running (can be minimized)</li>
                        <li>Enable system notifications in OS settings</li>
                        <li>Times are shown in 12-hour format</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

async function enableNotifications() {
    await notificationManager.requestPermission();
    setTimeout(() => {
        const modal = document.querySelector('.notification-modal');
        if (modal) modal.remove();
        setTimeout(() => showNotificationSettings(), 200);
    }, 100);
}

window.addEventListener('beforeunload', () => {
    if (notificationManager) {
        notificationManager.stopChecking();
    }
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && notificationManager) {
        notificationManager.checkReminders();
    }
});