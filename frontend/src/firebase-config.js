// src/firebase-config.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

export const requestForToken = (studentId) => {
  return getToken(messaging, { vapidKey: VAPID_KEY })
    .then((currentToken) => {
      if (currentToken) {
        console.log('FCM Token:', currentToken);
      
        return currentToken;
      }
    })
    .catch((err) => console.log('Token error:', err));
};