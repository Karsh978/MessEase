// public/firebase-messaging-sw.js

// ✅ FIXED: Version 9.0.0 → 10.12.0 (stable latest)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCjROwVOsO4qmm-2yfWn-ydf2-fWOkhhNs",
  authDomain: "mess-esse.firebaseapp.com",
  projectId: "mess-esse",
  storageBucket: "mess-esse.firebasestorage.app",
  messagingSenderId: "702606597787",
  appId: "1:702606597787:web:6e58035b24f558a7b4f03e"
});// public/firebase-messaging-sw.js

// ✅ FIXED: Version 9.0.0 → 10.12.0 (stable latest)
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCjROwVOsO4qmm-2yfWn-ydf2-fWOkhhNs",
  authDomain: "mess-esse.firebaseapp.com",
  projectId: "mess-esse",
  storageBucket: "mess-esse.firebasestorage.app",
  messagingSenderId: "702606597787",
  appId: "1:702606597787:web:6e58035b24f558a7b4f03e"
});

const messaging = firebase.messaging();

// ✅ Background message handler (jab app band ho ya minimize ho)
messaging.onBackgroundMessage((payload) => {
  console.log('📩 Background Message received:', payload);

  const notificationTitle = payload.notification?.title || "Didi's Mess";
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

const messaging = firebase.messaging();

// ✅ Background message handler (jab app band ho ya minimize ho)
messaging.onBackgroundMessage((payload) => {
  console.log('📩 Background Message received:', payload);

  const notificationTitle = payload.notification?.title || "Didi's Mess";
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});