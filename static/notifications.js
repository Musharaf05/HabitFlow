// FCM-POWERED NOTIFICATION SYSTEM - FIXED VERSION (No Duplicates!)
class FCMNotificationManager {
    constructor() {
        this.checkInterval = null;
        this.notifiedReminders = this.loadNotifiedReminders();
        this.notificationHistory = this.loadNotificationHistory();
        this.permissionGranted = false;
        this.fcmToken = null;
        this.init();
    }

    loadNotifiedReminders() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const stored = localStorage.getItem('notifiedReminders');
            if (stored) {
                const data = JSON.parse(stored);
                if (data.date === today) {
                    return new Map(data.reminders);
                }
            }
        } catch (error) {
            console.error('Error loading notified reminders:', error);
        }
        return new Map();
    }

    saveNotifiedReminders() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const data = {
                date: today,
                reminders: Array.from(this.notifiedReminders.entries())
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
        console.log('🔔 Initializing FCM Notification Manager...');
        
        // Load Firebase dynamically
        await this.loadFirebase();
        
        // Initialize FCM
        await this.initializeFCM();
        
        // Start checking reminders
        this.startChecking();
        this.scheduleResetAtMidnight();
    }

    async loadFirebase() {
        try {
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getMessaging, getToken, onMessage } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');
            
            this.firebase = { initializeApp, getMessaging, getToken, onMessage };
            console.log('✅ Firebase loaded');
        } catch (error) {
            console.error('❌ Error loading Firebase:', error);
        }
    }

    async initializeFCM() {
        if (!this.firebase) {
            console.log('⚠️ Firebase not available, using fallback notifications');
            this.permissionGranted = await this.requestBasicPermission();
            return;
        }

        try {
            const firebaseConfig = {
                apiKey: "AIzaSyD7AWZX-mcrwSX85Pv6Db23miIH9ruW9mQ",
                authDomain: "habitflow-af3d3.firebaseapp.com",
                projectId: "habitflow-af3d3",
                storageBucket: "habitflow-af3d3.firebasestorage.app",
                messagingSenderId: "1050299256022",
                appId: "1:1050299256022:web:8a04c309b83e2fb1f28d77",
                measurementId: "G-PN9XJC5EB4"
            };

            const app = this.firebase.initializeApp(firebaseConfig);
            this.messaging = this.firebase.getMessaging(app);
            
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                this.permissionGranted = true;
                console.log('✅ Notification permission granted');
                
                const token = await this.firebase.getToken(this.messaging, {
                    vapidKey: 'BOPIjv6JdU6VBLYQOmkQIJmgV6Lue885XBbq0dWKbHlasIGvpXO92XqCMX1cSe5CTyb_gIyczifkd7eOBHtXdpI'
                });
                
                if (token) {
                    this.fcmToken = token;
                    console.log('✅ FCM Token obtained');
                    
                    await this.saveFCMToken(token);
                    
                    // FIXED: Don't show notification in foreground - backend already sends it!
                    this.firebase.onMessage(this.messaging, (payload) => {
                        console.log('📩 Foreground message received:', payload);
                        // Backend already sent the notification via FCM
                        // Just log it, don't create duplicate notification
                        this.playNotificationSound();
                    });
                }
            }
        } catch (error) {
            console.error('❌ FCM initialization error:', error);
            this.permissionGranted = await this.requestBasicPermission();
        }
    }

    async requestBasicPermission() {
        if (!("Notification" in window)) {
            console.log("⚠️ Notifications not supported");
            return false;
        }

        if (Notification.permission === "granted") {
            return true;
        } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            return permission === "granted";
        }
        return false;
    }

    async saveFCMToken(token) {
        try {
            const response = await fetch('/save-fcm-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token })
            });
            
            if (response.ok) {
                console.log('✅ FCM token saved');
            }
        } catch (error) {
            console.error('❌ Error saving FCM token:', error);
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
        if (typeof data === 'undefined' || !data.reminders || data.reminders.length === 0) {
            return;
        }

        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        for (const reminder of data.reminders) {
            if (!reminder.date || !reminder.time || !reminder.id) {
                continue;
            }

            let reminderTime = reminder.time;
            if (reminderTime.length === 8) {
                reminderTime = reminderTime.substring(0, 5);
            }

            if (reminder.date !== currentDate) {
                continue;
            }

            const reminderKey = `${reminder.id}-${currentDate}-${reminderTime}`;
            const lastNotified = this.notifiedReminders.get(reminderKey);
            
            if (lastNotified && lastNotified === reminderTime) {
                continue;
            }

            const timeMatch = currentTime === reminderTime;
            
            if (timeMatch) {
                console.log(`🔔 Triggering reminder: "${reminder.text}"`);
                
                // FIXED: Backend sends notification, we just track it here
                // No local notification display to avoid duplicates
                this.notifiedReminders.set(reminderKey, reminderTime);
                this.saveNotifiedReminders();
                this.addToHistory(reminder);
                
                // Play sound for immediate feedback
                this.playNotificationSound();
            }
        }
    }

    formatDateToDisplay(dateStr) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    convertTo12Hour(time24) {
        const timeParts = time24.split(':');
        const hours = timeParts[0];
        const minutes = timeParts[1];
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
            console.log('🌙 Resetting at midnight');
            this.notifiedReminders.clear();
            this.saveNotifiedReminders();
            this.scheduleResetAtMidnight();
        }, msToMidnight);
    }

    clearHistory() {
        this.notificationHistory = [];
        this.saveNotificationHistory();
    }

    clearReminderFlag(reminderId, date, time) {
        const reminderKey = `${reminderId}-${date}-${time}`;
        if (this.notifiedReminders.has(reminderKey)) {
            this.notifiedReminders.delete(reminderKey);
            this.saveNotifiedReminders();
            console.log(`✅ Cleared notification flag for reminder ${reminderId}`);
        }
    }
}

// Global notification manager
let notificationManager;

function initNotificationSystem() {
    if (!notificationManager) {
        notificationManager = new FCMNotificationManager();
        console.log('✅ FCM Notification system initialized');
    }
}

window.initNotificationSystem = initNotificationSystem;
window.notificationManager = notificationManager;