// Import and configure the Firebase SDK inside the service worker
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

firebase.initializeApp({
   apiKey: "AIzaSyD6a3arlQnlz_vR4E9u5OQ74klXxCn-5IE",
   authDomain: "anime-news-f3d26.firebaseapp.com",
   projectId: "anime-news-f3d26",
   storageBucket: "anime-news-f3d26.firebasestorage.app",
   messagingSenderId: "860860324110",
   appId: "1:860860324110:web:f5c8d4121b72a1b3681f5f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification?.title || "Anime Int Breaking News";
  const notificationOptions = {
    body: payload.notification?.body || "A new update has been posted!",
    icon: payload.notification?.image || '/favicon.ico',
    image: payload.notification?.image || undefined,
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
