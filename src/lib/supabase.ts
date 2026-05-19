import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export const getSupabase = () => {
  if (supabaseClient) return supabaseClient;

  // Prefer environment variables
  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Fallbacks from user provided info if env vars are missing
  const fallbackUrl = 'https://ccjfmyfnitrmpnxsvrnk.supabase.co';
  const fallbackKey = 'sb_publishable_4ovIDv-yqUNhXOJnx1Jr3Q_dw-BVy-c'; // Re-check format if needed

  const url = supabaseUrl || fallbackUrl;
  const key = supabaseAnonKey || fallbackKey;

  if (!url || !key) {
    console.error('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Settings.');
    throw new Error('Supabase URL and Anon Key are required');
  }

  // Clean the URL if it contains /rest/v1/
  const cleanUrl = url.replace(/\/rest\/v1\/?$/, '');

  supabaseClient = createClient(cleanUrl, key);
  return supabaseClient;
};

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    try {
      const client = getSupabase();
      return (client as any)[prop];
    } catch (e) {
      // Return a dummy object if initialization fails
      console.warn('Supabase proxy failing back to empty object:', e);
      return () => ({ 
        then: () => ({ catch: () => {} }),
        catch: () => {},
        from: () => ({ select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: e }) }) }) }),
        auth: { getSession: () => Promise.resolve({ data: { session: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) }
      });
    }
  }
});
