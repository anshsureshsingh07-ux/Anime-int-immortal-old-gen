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

  // Clean the URL of trailing slashes and redundant paths
  let cleanUrl = url.trim().replace(/\/+$/, '');
  cleanUrl = cleanUrl.replace(/\/rest\/v1\/?$/, '');
  cleanUrl = cleanUrl.replace(/\/+$/, '');

  try {
    supabaseClient = createClient(cleanUrl, key);
  } catch (err: any) {
    console.error('Failed to instantiate Supabase client:', err);
    throw err;
  }
  return supabaseClient;
};

const dummyClient = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
    signUp: async () => ({ data: { user: null, session: null }, error: null }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: null }),
        order: () => Promise.resolve({ data: [], error: null })
      }),
      order: () => Promise.resolve({ data: [], error: null })
    }),
    insert: () => Promise.resolve({ data: null, error: null }),
    update: () => ({ eq: () => Promise.resolve({ data: null, error: null }) }),
    delete: () => ({ eq: () => Promise.resolve({ data: null, error: null }) })
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
};

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    try {
      const client = getSupabase();
      const val = (client as any)[prop];
      if (val !== undefined) return val;
      return (dummyClient as any)[prop];
    } catch (e) {
      console.warn('Supabase proxy failing back to dummyClient:', e);
      return (dummyClient as any)[prop];
    }
  }
});
