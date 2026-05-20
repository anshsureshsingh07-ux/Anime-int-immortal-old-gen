import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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

