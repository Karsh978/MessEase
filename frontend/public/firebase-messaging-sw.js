// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCjROwVOsO4qmm-2yfWn-ydf2-fWOkhhNs",
  projectId: "mess-esse",
  messagingSenderId: "702606597787",
  appId: "1:702606597787:web:6e58035b24f558a7b4f03e"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background Message:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png' // Aapka app icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});