// --- NOTIFICATION SYSTEM WITH HISTORY ---
class NotificationManager {
    constructor() {
        this.checkInterval = null;
        this.notifiedReminders = this.loadNotifiedReminders();
        this.notificationHistory = this.loadNotificationHistory();
        this.permissionGranted = false;
        this.serviceWorkerRegistration = null;
        this.init();
    }

    loadNotifiedReminders() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const stored = localStorage.getItem('notifiedReminders');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.date === today) {
                    return new Set(data.reminders);
                }
            }
        } catch (error) {
            console.error('Error loading notified reminders:', error);
        }
        return new Set();
    }

    saveNotifiedReminders() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const data = {
                date: today,
                reminders: Array.from(this.notifiedReminders)
            };
            localStorage.setItem('notifiedReminders', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving notified reminders:', error);
        }
    }

    loadNotificationHistory() {
        try {
            const stored = localStorage.getItem('notificationHistory');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading notification history:', error);
        }
        return [];
    }

    saveNotificationHistory() {
        try {
            const history = this.notificationHistory.slice(0, 50);
            localStorage.setItem('notificationHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Error saving notification history:', error);
        }
    }

    addToHistory(reminder) {
        const historyItem = {
            id: Date.now(),
            reminderText: reminder.text,
            scheduledTime: reminder.time,
            notifiedAt: new Date().toISOString(),
            date: reminder.date
        };
        this.notificationHistory.unshift(historyItem);
        this.saveNotificationHistory();
    }

    async init() {
        console.log('🔔 Initializing Notification Manager...');
        await this.registerServiceWorker();
        await this.requestPermission();
        this.startChecking();
        this.scheduleResetAtMidnight();
    }

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.log('⚠️ Service Workers not supported');
            return;
        }

        try {
            // Register with correct path
            this.serviceWorkerRegistration = await navigator.serviceWorker.register('/static/service-worker.js', {
                scope: '/'
            });
            
            console.log('✅ Service Worker registered');
            await navigator.serviceWorker.ready;
            console.log('✅ Service Worker ready');
            
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
        }
    }

    async requestPermission() {
        if (!("Notification" in window)) {
            console.log("⚠️ Notifications not supported");
            return;
        }

        if (Notification.permission === "granted") {
            this.permissionGranted = true;
            console.log('✅ Notification permission already granted');
        } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            this.permissionGranted = (permission === "granted");
            
            if (this.permissionGranted) {
                console.log('✅ Notification permission granted');
            } else {
                console.log('❌ Notification permission denied');
            }
        } else {
            console.log('❌ Notification permission was previously denied');
        }
    }

    startChecking() {
        console.log('🕐 Starting reminder checks every 10 seconds...');
        this.checkReminders();
        
        this.checkInterval = setInterval(() => {
            this.checkReminders();
        }, 10000);
    }

    stopChecking() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }

    async checkReminders() {
        // Wait for data to be available
        if (typeof data === 'undefined' || !data.reminders || data.reminders.length === 0) {
            return;
        }

        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        console.log(`🕐 Checking at ${currentTime} on ${currentDate} - ${data.reminders.length} reminders`);

        for (const reminder of data.reminders) {
            if (!reminder.date || !reminder.time) {
                continue;
            }

            let reminderTime = reminder.time;
            if (reminderTime.length === 8) {
                reminderTime = reminderTime.substring(0, 5);
            }

            if (reminder.date !== currentDate) {
                continue;
            }

            const reminderKey = `${reminder.id}-${currentDate}`;
            
            if (this.notifiedReminders.has(reminderKey)) {
                continue;
            }

            const timeMatch = currentTime === reminderTime;
            
            if (timeMatch) {
                console.log(`🔔 ✓✓✓ TRIGGERING NOTIFICATION: "${reminder.text}"`);
                await this.triggerNotification(reminder);
                this.notifiedReminders.add(reminderKey);
                this.saveNotifiedReminders();
                this.addToHistory(reminder);
                console.log(`✅ Notification sent`);
            }
        }
    }

    async triggerNotification(reminder) {
        const time12 = this.convertTo12Hour(reminder.time);
        const title = "🔔 HabitFlow Reminder";
        const body = `${reminder.text}\nScheduled for ${time12}`;

        try {
            if (this.serviceWorkerRegistration) {
                await this.serviceWorkerRegistration.showNotification(title, {
                    body: body,
                    icon: '/static/checklist_16688556.png',
                    badge: '/static/checklist_16688556.png',
                    vibrate: [200, 100, 200],
                    tag: `reminder-${reminder.id}`,
                    requireInteraction: true,
                    actions: [
                        { action: 'open', title: 'Open App' },
                        { action: 'close', title: 'Dismiss' }
                    ]
                });
                console.log('✅ Service Worker notification displayed');
            } else {
                new Notification(title, {
                    body: body,
                    icon: '/static/checklist_16688556.png',
                    requireInteraction: false
                });
                console.log('✅ Basic notification displayed');
            }
            
            this.playNotificationSound();
            
        } catch (error) {
            console.error('❌ Notification error:', error);
        }
    }

    formatDateToDisplay(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    convertTo12Hour(time24) {
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
            console.log("Audio failed:", error);
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
            console.log('🌙 Resetting notified reminders at midnight');
            this.notifiedReminders.clear();
            this.saveNotifiedReminders();
            this.scheduleResetAtMidnight();
        }, msToMidnight);
    }

    clearHistory() {
        this.notificationHistory = [];
        this.saveNotificationHistory();
    }
}

// Global notification manager
let notificationManager;

// Initialize after DOM and data are ready
function initNotificationSystem() {
    if (!notificationManager) {
        notificationManager = new NotificationManager();
        console.log('✅ Notification system initialized');
    }
}

// Export for use in tasks.js
window.initNotificationSystem = initNotificationSystem;
window.notificationManager = notificationManager;