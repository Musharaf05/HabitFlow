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
            // Keep only last 50 notifications
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
        console.log('Initializing Notification Manager...');
        await this.registerServiceWorker();
        await this.requestPermission();
        this.startChecking();
        this.scheduleResetAtMidnight();
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
            
            console.log('Service Worker registered');
            await navigator.serviceWorker.ready;
            console.log('Service Worker ready');
            
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    async requestPermission() {
        if (!("Notification" in window)) {
            console.log("Notifications not supported");
            return;
        }

        if (Notification.permission === "granted") {
            this.permissionGranted = true;
            console.log('✓ Notification permission granted');
        } else if (Notification.permission !== "denied") {
            const permission = await Notification.requestPermission();
            this.permissionGranted = (permission === "granted");
            
            if (this.permissionGranted) {
                console.log('✓ Notification permission granted');
            }
        }
    }

    startChecking() {
        console.log('Starting reminder checks every 30 seconds...');
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
        if (!data.reminders || data.reminders.length === 0) {
            console.log('No reminders to check');
            return;
        }

        const now = new Date();
        const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD (internal)
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        // Display formats
        const currentDateDisplay = this.formatDateToDisplay(currentDate);
        const currentTimeDisplay = this.convertTo12Hour(currentTime);

        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🕐 Checking reminders at ${currentTimeDisplay} on ${currentDateDisplay}`);
        console.log(`📋 Total reminders: ${data.reminders.length}`);

        for (const reminder of data.reminders) {
            console.log(`\n📌 Checking reminder: "${reminder.text}"`);
            
            // Skip if no date or time
            if (!reminder.date || !reminder.time) {
                console.log(`   ⚠️ SKIPPED: Missing date or time`);
                console.log(`   Date: ${reminder.date}, Time: ${reminder.time}`);
                continue;
            }

            // Normalize reminder time to HH:MM format (remove seconds if present)
            let reminderTime = reminder.time;
            if (reminderTime.length === 8) {
                // Format is HH:MM:SS, convert to HH:MM
                reminderTime = reminderTime.substring(0, 5);
            }

            const reminderDateDisplay = this.formatDateToDisplay(reminder.date);
            const reminderTimeDisplay = this.convertTo12Hour(reminderTime);

            console.log(`   📅 Reminder Date: ${reminderDateDisplay} (${reminder.date})`);
            console.log(`   ⏰ Reminder Time: ${reminderTimeDisplay} (${reminderTime})`);
            console.log(`   📅 Current Date: ${currentDateDisplay} (${currentDate})`);
            console.log(`   ⏰ Current Time: ${currentTimeDisplay} (${currentTime})`);

            // Skip if not today's date
            if (reminder.date !== currentDate) {
                console.log(`   ⏭️ SKIPPED: Not today (${reminderDateDisplay} vs ${currentDateDisplay})`);
                continue;
            }

            // Create unique key for this reminder on this date
            const reminderKey = `${reminder.id}-${currentDate}`;
            
            // Skip if already notified today
            if (this.notifiedReminders.has(reminderKey)) {
                console.log(`   ✓ ALREADY NOTIFIED TODAY`);
                continue;
            }

            // Check if current time matches reminder time
            const timeMatch = currentTime === reminderTime;
            console.log(`   🔍 Time Match: ${timeMatch} (${currentTime} === ${reminderTime})`);
            
            if (timeMatch) {
                console.log(`   🔔 ✓✓✓ TRIGGERING NOTIFICATION NOW! ✓✓✓`);
                await this.triggerNotification(reminder);
                this.notifiedReminders.add(reminderKey);
                this.saveNotifiedReminders();
                this.addToHistory(reminder);
                console.log(`   ✅ Notification sent and logged`);
            } else {
                console.log(`   ⏳ Waiting for time to match...`);
            }
        }
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }

    formatDateToDisplay(dateStr) {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    }

    async triggerNotification(reminder) {
        await this.showDesktopNotification(reminder);
        this.showVisualNotification(reminder);
        this.playNotificationSound();
    }

    async showDesktopNotification(reminder) {
        if (!this.permissionGranted) {
            console.log('Notification permission not granted');
            return;
        }

        const time12Hour = this.convertTo12Hour(reminder.time);
        const title = "🔔 Reminder";
        const options = {
            body: `${reminder.text}\nTime: ${time12Hour}`,
            icon: "/static/checklist_16688556.png",
            badge: "/static/checklist_16688556.png",
            tag: `reminder-${reminder.id}-${Date.now()}`,
            requireInteraction: true,
            vibrate: [200, 100, 200],
            data: {
                reminderId: reminder.id
            }
        };

        try {
            if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
                await this.serviceWorkerRegistration.showNotification(title, options);
                console.log('✓ Desktop notification sent');
            } else {
                const notification = new Notification(title, options);
                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };
                console.log('✓ Browser notification sent');
            }
        } catch (error) {
            console.error('Desktop notification error:', error);
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
        // Handle both HH:MM and HH:MM:SS formats
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
            console.log('Resetting notified reminders at midnight');
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
    const navbarActions = document.querySelector('.navbar-actions');
    if (navbarActions && !navbarActions.querySelector('.notification-settings-btn')) {
        const notifBtn = document.createElement('button');
        notifBtn.className = 'notification-settings-btn';
        notifBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
        `;
        notifBtn.onclick = showNotificationHistory;
        
        const logoutBtn = navbarActions.querySelector('.logout-btn');
        navbarActions.insertBefore(notifBtn, logoutBtn);
    }
}

function showNotificationHistory() {
    const modal = document.createElement('div');
    modal.className = 'notification-modal';
    
    let historyHTML = '';
    if (notificationManager.notificationHistory.length === 0) {
        historyHTML = '<div class="empty-history">No notifications yet. Notifications will appear here when reminders trigger.</div>';
    } else {
        historyHTML = notificationManager.notificationHistory.map(item => {
            const notifiedDate = new Date(item.notifiedAt);
            const time12 = notificationManager.convertTo12Hour(item.scheduledTime);
            
            // Format date as DD/MM/YYYY
            const day = notifiedDate.getDate().toString().padStart(2, '0');
            const month = (notifiedDate.getMonth() + 1).toString().padStart(2, '0');
            const year = notifiedDate.getFullYear();
            const dateStr = `${day}/${month}/${year}`;
            
            // Format time as 12-hour
            const hours = notifiedDate.getHours();
            const minutes = notifiedDate.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            const displayHours = hours % 12 || 12;
            const timeStr = `${displayHours}:${minutes} ${ampm}`;
            
            return `
                <div class="history-item">
                    <div class="history-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                        </svg>
                    </div>
                    <div class="history-details">
                        <div class="history-text">${item.reminderText}</div>
                        <div class="history-meta">
                            <span>Scheduled: ${time12}</span>
                            <span>•</span>
                            <span>Sent: ${dateStr} ${timeStr}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    modal.innerHTML = `
        <div class="notification-modal-content">
            <div class="notification-modal-header">
                <h2>Notification History</h2>
                <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="notification-modal-body">
                <div class="notification-status">
                    <span class="status-label">Notifications:</span>
                    <span class="status-value ${notificationManager.permissionGranted ? 'enabled' : 'disabled'}">
                        ${notificationManager.permissionGranted ? '✓ Enabled' : '✗ Disabled'}
                    </span>
                </div>
                
                ${!notificationManager.permissionGranted ? `
                    <button class="enable-notifications-btn" onclick="enableNotifications()">
                        Enable Notifications
                    </button>
                ` : ''}
                
                <div class="history-header">
                    <h3>Recent Notifications</h3>
                    ${notificationManager.notificationHistory.length > 0 ? 
                        '<button class="clear-history-btn" onclick="clearNotificationHistory()">Clear History</button>' : 
                        ''}
                </div>
                
                <div class="notification-history-list">
                    ${historyHTML}
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
        setTimeout(() => showNotificationHistory(), 200);
    }, 100);
}

function clearNotificationHistory() {
    if (confirm('Clear all notification history?')) {
        notificationManager.clearHistory();
        const modal = document.querySelector('.notification-modal');
        if (modal) modal.remove();
        showNotificationHistory();
    }
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && notificationManager) {
        notificationManager.checkReminders();
    }
});