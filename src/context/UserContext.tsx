import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface UserContextType {
  firebaseUser: FirebaseUser | null;
  avatarUrl: string;
  setAvatarUrl: (url: string) => void;
  fetchProfileData: (userId: string) => Promise<string | null>;
  loadingAuth: boolean;
  user: any | null;
  setUser: React.Dispatch<React.SetStateAction<any | null>>;
  tradingProfile: any | null;
  setTradingProfile: React.Dispatch<React.SetStateAction<any | null>>;
  verifyUserIdentity: () => Promise<any>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState<any | null>(null);
  const [tradingProfile, setTradingProfile] = useState<any | null>(null);

  // Verification logic syncing user identity and metadata on login
  const verifyUserIdentity = async (): Promise<any> => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session && session.user) {
        setUser(session.user);
        
        // Query trading_users to get the username and balance associated with that user_id
        const { data: profileNode, error: profileError } = await supabase
          .from('trading_users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.warn('Error fetching trading_users profile node:', profileError);
        }

        if (profileNode) {
          setTradingProfile(profileNode);
          return { user: session.user, tradingProfile: profileNode };
        } else {
          // Fallback if record does not exist
          setTradingProfile(null);
          return { user: session.user, tradingProfile: null };
        }
      } else {
        setUser(null);
        setTradingProfile(null);
      }
    } catch (err) {
      console.warn('verifyUserIdentity calculation trace failed:', err);
    }
    return null;
  };

  // Persistence Logic: retrieves the avatar_url from user_avatars based on the logged-in user's uid
  const fetchProfileData = async (userId: string): Promise<string | null> => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('user_avatars')
        .select('avatar_url')
        .eq('id', userId)
        .single();
      
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
        // Sync with local fallback caches
        localStorage.setItem(`cached_avatar_url_${userId}`, data.avatar_url);
        localStorage.setItem('cached_avatar_url_' + userId, data.avatar_url);
        return data.avatar_url;
      }
    } catch (err) {
      console.log('user_avatars context fetch trace:', err);
    }
    return null;
  };

  useEffect(() => {
    const unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoadingAuth(false);
      if (user?.uid) {
        const cached = localStorage.getItem(`cached_avatar_url_${user.uid}`) || localStorage.getItem('cached_avatar_url_' + user.uid);
        if (cached) {
          setAvatarUrl(cached);
        }
        // Fetch from Supabase
        fetchProfileData(user.uid);
      } else {
        setAvatarUrl('');
      }
    });

    return () => unsubscribeFirebase();
  }, []);

  // Sync: Listen for "profiles-updated" triggered on avatar uploads to instantly update state
  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      if (e?.detail?.blobUrl) {
        setAvatarUrl(e.detail.blobUrl);
      } else if (firebaseUser?.uid) {
        fetchProfileData(firebaseUser.uid);
      }
    };
    window.addEventListener('profiles-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profiles-updated', handleProfileUpdate);
    };
  }, [firebaseUser]);

  return (
    <UserContext.Provider value={{
      firebaseUser,
      avatarUrl,
      setAvatarUrl,
      fetchProfileData,
      loadingAuth,
      user,
      setUser,
      tradingProfile,
      setTradingProfile,
      verifyUserIdentity
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
