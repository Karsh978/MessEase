// src/firebase-config.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCjROwVOsO4qmm-2yfWn-ydf2-fWOkhhNs",
  authDomain: "mess-esse.firebaseapp.com",
  projectId: "mess-esse",
  storageBucket: "mess-esse.firebasestorage.app",
  messagingSenderId: "702606597787",
  appId: "1:702606597787:web:6e58035b24f558a7b4f03e",
  measurementId: "G-8WE8GT37KV"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const VAPID_KEY = "BJigyPfjuvdsA54TWXUcTB7wwYzRi2hTz_Lub3W4o6dO5o4G8433qIST7TxIBrrkKRRTk9TSnhK1O6FrTqleB0w";

// ✅ FIXED: Pehle permission maango, phir token lo
export const requestForToken = async () => {
  try {
    // Step 1: Notification permission maango — yahi popup dikhata hai user ko
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('❌ Notification permission denied by user');
      return null;
    }

    console.log('✅ Notification permission granted');

    // Step 2: Service Worker ready hone ka wait karo
    const registration = await navigator.serviceWorker.ready;

    // Step 3: FCM Token lo
    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      console.log('✅ FCM Token mila:', currentToken);
      return currentToken;
    } else {
      console.log('❌ Token nahi mila — service worker ya VAPID key check karo');
      return null;
    }
  } catch (err) {
    console.error('🔴 requestForToken error:', err);
    return null;
  }
};

// Foreground messages handle karna (jab app khula ho)
export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log('📩 Foreground message:', payload);
      resolve(payload);
    });
  });