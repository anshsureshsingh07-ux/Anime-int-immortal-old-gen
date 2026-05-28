import { useState, useEffect } from 'react';
import { supabase } from './supabase';

export interface AuthState {
  userId: string | null;
  loading: boolean;
  isLoggedIn: boolean;
  username: string | null;
  avatarUrl: string | null;
  session: any | null;
}

export function useAuth(): AuthState {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [session, setSession] = useState<any | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile(uid: string) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, avatar_url, profile_photo_url')
          .eq('id', uid)
          .single();
        
        if (mounted && !error && data) {
          setUsername(data.username || null);
          setAvatarUrl(data.avatar_url || data.profile_photo_url || null);
        }
      } catch (err) {
        console.warn('Profile fetch failed in auth hook:', err);
      }
    }

    // Initialize session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setSession(session);
        const uid = session?.user?.id || null;
        setUserId(uid);
        if (uid) {
          fetchProfile(uid).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setLoading(false);
        }
      }
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session);
        const uid = session?.user?.id || null;
        setUserId(uid);
        if (uid) {
          fetchProfile(uid).finally(() => {
            if (mounted) setLoading(false);
          });
        } else {
          setUsername(null);
          setAvatarUrl(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    userId,
    loading,
    isLoggedIn: !!userId,
    username,
    avatarUrl,
    session,
  };
}
