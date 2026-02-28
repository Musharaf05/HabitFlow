// Firebase Configuration - UPDATED VERSION FOR BACKGROUND NOTIFICATIONS
const firebaseConfig = {
  apiKey: "AIzaSyD7AWZX-mcrwSX85Pv6Db23miIH9ruW9mQ",
  authDomain: "habitflow-af3d3.firebaseapp.com",
  projectId: "habitflow-af3d3",
  storageBucket: "habitflow-af3d3.firebasestorage.app",
  messagingSenderId: "1050299256022",
  appId: "1:1050299256022:web:8a04c309b83e2fb1f28d77",
  measurementId: "G-PN9XJC5EB4"
};

// Initialize Firebase (loads dynamically)
let messaging = null;
let fcmToken = null;

async function initializeFirebase() {
    try {
        console.log('🔥 Initializing Firebase...');
        
        // Import Firebase modules
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getMessaging, getToken, onMessage } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');
        
        // Initialize Firebase app
        const app = initializeApp(firebaseConfig);
        messaging = getMessaging(app);
        
        console.log('✅ Firebase initialized');
        
        // Request permission
        const permission = await Notification.requestPermission();
        console.log('📢 Notification permission:', permission);
        
        if (permission === 'granted') {
            // Get FCM token
            const token = await getToken(messaging, {
                vapidKey: 'BOPIjv6JdU6VBLYQOmkQIJmgV6Lue885XBbq0dWKbHlasIGvpXO92XqCMX1cSe5CTyb_gIyczifkd7eOBHtXdpI'  // Replace with YOUR VAPID key
            });
            
            if (token) {
                fcmToken = token;
                console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
                
                // Send token to backend
                await saveFCMTokenToBackend(token);
                
                // Listen for foreground messages
                onMessage(messaging, (payload) => {
                    console.log('📩 Foreground message:', payload);
                    showNotification(payload);
                });
                
                return true;
            }
        }
        
        return false;
        
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
        return false;
    }
}

async function saveFCMTokenToBackend(token) {
    try {
        const response = await fetch('/save-fcm-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: token })
        });
        
        if (response.ok) {
            console.log('✅ FCM token saved to backend');
        } else {
            console.error('❌ Failed to save token:', await response.text());
        }
    } catch (error) {
        console.error('❌ Error saving token:', error);
    }
}

function showNotification(payload) {
    const notificationTitle = payload.notification?.title || 'HabitFlow';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: '/static/checklist_16688556.png',
        badge: '/static/checklist_16688556.png',
        vibrate: [200, 100, 200],
        tag: 'habitflow-notification',
        requireInteraction: true
    };
    
    if (Notification.permission === 'granted') {
        new Notification(notificationTitle, notificationOptions);
    }
}

// Auto-initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(initializeFirebase, 2000);
    });
} else {
    setTimeout(initializeFirebase, 2000);
}