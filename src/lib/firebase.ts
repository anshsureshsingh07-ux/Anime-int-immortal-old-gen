import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getMessaging, getToken } from 'firebase/messaging';
import { supabase } from './supabase';

const firebaseConfig = {
   apiKey: "AIzaSyD6a3arlQnlz_vR4E9u5OQ74klXxCn-5IE",
   authDomain: "anime-news-f3d26.firebaseapp.com",
   projectId: "anime-news-f3d26",
   storageBucket: "anime-news-f3d26.firebasestorage.app",
   messagingSenderId: "860860324110",
   appId: "1:860860324110:web:f5c8d4121b72a1b3681f5f"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use lazy getter for messaging in case browser environment doesn't support notifications/FCM
export const getMessagingInstance = () => {
  if (typeof window === 'undefined') return null;
  try {
    return getMessaging(app);
  } catch (error) {
    console.warn("Firebase Messaging is not supported or failed to initialize:", error);
    return null;
  }
};

export const requestNotificationPermissionAndGetToken = async (): Promise<string | null> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn("Notifications are not supported in this browser environment.");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log("Notification permission denied/dismissed.");
      return null;
    }

    const messaging = getMessagingInstance();
    if (!messaging) return null;

    // Retrieve VAPID Key from environment or defaults
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (err) {
    console.error("Error retrieving FCM device token:", err);
    return null;
  }
};

export const registerPushNotifications = async (userId: string) => {
  if (!userId) return;

  const fcmToken = await requestNotificationPermissionAndGetToken();
  if (!fcmToken) return;

  console.log("Successfully fetched FCM device token:", fcmToken);

  // Clean, resilient save mechanism:
  // First, attempt to update fcm_token directly (supporting cases where the table includes fcm_token)
  let { error } = await supabase
    .from('profiles')
    .update({ fcm_token: fcmToken } as any)
    .eq('id', userId);

  // Fallback: If direct update fails (e.g., column does not exist on Supabase), use 'bio' as JSON storage
  if (error) {
    console.log("Direct 'fcm_token' column update failed or not supported, falling back to 'bio' serializing backup...", error.message);
    const fcmPayload = { fcm_token: fcmToken };
    const fallbackResult = await supabase
      .from('profiles')
      .update({ bio: JSON.stringify(fcmPayload) })
      .eq('id', userId);
    error = fallbackResult.error;
  }

  if (error) {
    console.error("Failed to save FCM token to Supabase profiles:", error.message);
  } else {
    console.log("FCM device token successfully registered and saved!");
  }
};

