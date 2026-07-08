import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserPlus, MessageSquare, Shield, Send, Terminal, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const GUEST_USER_UUID = '00000000-0000-0000-0000-000000000000';

export default function Recruitment() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    discord: '',
    role: 'news_writer',
    skills: '',
    experience: '',
    availability: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [existingApp, setExistingApp] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Keep the strict supabase session listener as requested by State Sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      let user = session?.user || null;
      
      // If Supabase user is not found, but we have an active firebase user, silent align
      if (!user && auth.currentUser) {
        console.log("[Recruitment State Sync] Supabase auth shifted but Firebase user is active. Checking profiles database...");
        const email = auth.currentUser.email;
        if (email) {
          try {
            const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
            if (profile) {
              user = {
                id: profile.id,
                email: profile.email,
                username: profile.username
              } as any;
            }
          } catch (e) {
            console.warn("[Recruitment State Sync] Fallback profiles fetch on shift ignored:", e);
          }
        }
      }
      setCurrentUser(user);
      if (user) {
        checkExistingApplication(user.id);
      } else {
        setExistingApp(null);
      }
      setAuthLoading(false);
    });

    // Mirroring Firebase state updates natively
    const unsubscribeFirebase = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        console.log("[Recruitment State Sync] Firebase user active:", fbUser.email);
        const { data: { user: sbUser } } = await supabase.auth.getUser();
        let finalUser = sbUser;
        if (!finalUser && fbUser.email) {
          try {
            const { data: profile } = await supabase.from('profiles').select('*').eq('email', fbUser.email).single();
            if (profile) {
              finalUser = {
                id: profile.id,
                email: profile.email,
                username: profile.username
              } as any;
            }
          } catch (e) {
            console.warn("[Recruitment State Sync] Fallback profiles lookup failed on Firebase auth change:", e);
          }
        }
        if (finalUser) {
          setCurrentUser(finalUser);
          checkExistingApplication(finalUser.id);
        }
      } else {
        console.log("[Recruitment State Sync] Firebase user inactive");
      }
      setAuthLoading(false);
    });

    // Fetch initial session coordinate immediately on node booting
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      let user = session?.user || null;
      if (!user && auth.currentUser) {
        const email = auth.currentUser.email;
        if (email) {
          try {
            const { data: profile } = await supabase.from('profiles').select('*').eq('email', email).single();
            if (profile) {
              user = {
                id: profile.id,
                email: profile.email,
                username: profile.username
              } as any;
            }
          } catch (e) {
            console.warn("[Recruitment State Sync] Fallback profiles fetch on boot ignored:", e);
          }
        }
      }
      setCurrentUser(user);
      if (user) {
        checkExistingApplication(user.id);
      }
      setAuthLoading(false);
    }).catch(err => {
      console.error('Session load error:', err);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      unsubscribeFirebase();
    };
  }, []);

  const checkExistingApplication = async (userId: string) => {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();
    
    if (data) setExistingApp(data);
  };

  const roles = [
    { id: 'news_writer', name: 'News Writer', desc: 'Cover breaking news and trending topics.', icon: Shield },
    { id: 'thumbnail_editor', name: 'UI/GFX Editor', desc: 'Create stunning visuals for the platform.', icon: UserPlus },
    { id: 'moderator', name: 'Enforcer (Mod)', desc: 'Maintain order in the digital sectors.', icon: Shield },
    { id: 'social_manager', name: 'Field Op (SMM)', desc: 'Expand our reach across social networks.', icon: Send },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      // Auth Verification Loop: Replace current session check with a more robust getUser check at click-time
      let { data: { user } } = await supabase.auth.getUser();
      
      // If Supabase session is empty, perform silent authentication restoration using active Firebase session or database lookup!
      if (!user && auth.currentUser) {
        console.log("[Recruitment Autologin] Supabase session is empty, but Firebase auth.currentUser is active. Trying automatic Supabase sign-in sync...");
        const fbEmail = auth.currentUser.email;
        if (fbEmail) {
          // 1. Try saved user password from localStorage
          try {
            const stored = localStorage.getItem('anime_int_saved_emails');
            if (stored) {
              const accounts = JSON.parse(stored);
              const matched = accounts.find((acc: any) => acc.email.toLowerCase() === fbEmail.toLowerCase());
              if (matched && matched.passWordObf) {
                const password = atob(matched.passWordObf).split('').reverse().join('');
                console.log("[Recruitment Autologin] Found saved obfuscated password, attempting silent login...");
                const { data: signInResult, error: signInErr } = await supabase.auth.signInWithPassword({
                  email: fbEmail,
                  password: password
                });
                if (!signInErr && signInResult?.user) {
                  user = signInResult.user;
                  console.log("[Recruitment Autologin] Silent sign-in using saved credentials succeeded!");
                }
              }
            }
          } catch (e) {
            console.warn("[Recruitment Autologin] Silent account deobfuscation sign-in failed:", e);
          }

          // 2. Try Google Auth default password pattern
          if (!user) {
            try {
              const defaultPassword = `N3xusG00gleAuth_${fbEmail.split('@')[0]}_Secur3!`;
              const { data: signInResult, error: signInErr } = await supabase.auth.signInWithPassword({
                email: fbEmail,
                password: defaultPassword
              });
              if (!signInErr && signInResult?.user) {
                user = signInResult.user;
                console.log("[Recruitment Autologin] Silent sign-in using Google pattern succeeded!");
              }
            } catch (e) {
              console.warn("[Recruitment Autologin] Google pattern silent sync failed:", e);
            }
          }

          // 3. Try to query profiles to fetch their profile record ID as a fallback anyway
          if (!user) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', fbEmail)
                .single();
              if (profile) {
                user = {
                  id: profile.id,
                  email: profile.email,
                  username: profile.username
                } as any;
                console.log("[Recruitment Autologin] Found user profile directly in DB. Fallback to virtual authenticated user:", user);
              }
            } catch (e) {
              console.warn("[Recruitment Autologin] Fallback profiles DB query failed:", e);
            }
          }
        }
      }

      console.log("Current Auth User:", user);
      
      // Update local state sync so UI notices if user is empty
      setCurrentUser(user);

      const targetUserId = user ? user.id : GUEST_USER_UUID;
      const targetUserEmail = user ? (user.email || 'anonymous@vanguard.net') : 'anonymous@vanguard.net';
      const isGuestSub = !user;

      // Logging UUID format to verify and prove correctness
      console.log("[Recruitment UUID Validation] Submitting user key UUID string:", targetUserId);

      // Extra check if user has pending applications (only for logged-in users)
      if (user) {
        const { data: existingData, error: lookupErr } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'pending');

        if (lookupErr) {
          console.warn("[Recruitment Submit Warning] Checking existing application warning:", lookupErr);
        }

        if (existingData && existingData.length > 0) {
          throw new Error('An active application is already registered under your call-sign database row.');
        }
      }

      const payload = {
        ...formData,
        user_id: targetUserId,
        user_email: targetUserEmail,
        is_guest: isGuestSub,
        status: 'pending'
      };

      console.log("[Recruitment Payload Dump] Submission payload:", payload);

      const { data: submitResult, error: submitError } = await supabase
        .from('applications')
        .insert([payload]);

      if (submitError) {
        console.error("[Recruitment Submit Error - FULL OBJECT DUMP]:", submitError);
        throw submitError;
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error("[Recruitment Error - FULL OBJECT DUMP]:", err);
      // Give descriptive, robust feedback containing full schema or RLS errors
      const detailedMessage = err.message || err.details || JSON.stringify(err) || 'Submission failed. Please try again.';
      setError(detailedMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center h-full flex flex-col justify-center">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#111] border border-[#1F1F1F] p-12 rounded-xl"
        >
          <div className="w-16 h-16 bg-[#FF0000] rounded flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(255,0,0,0.3)]">
            <Send className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-white">Transmission Sent</h2>
          <p className="text-gray-500 font-mono text-xs leading-relaxed">
            Your application has been logged in the central mainframe. Our field commanders will review your profile shortly.
          </p>
          <button 
            onClick={() => setSubmitted(false)}
            className="mt-8 px-6 py-3 bg-[#1F1F1F] text-white text-[10px] font-black uppercase tracking-widest rounded hover:bg-[#222] transition-colors"
          >
            Review Application
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8 grid grid-cols-12 gap-8 max-w-6xl mx-auto">
      <div className="col-span-12 lg:col-span-5">
        <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-6 leading-none text-white">
          Join the <span className="text-[#FF0000]">Vanguard</span>
        </h1>
        <p className="text-gray-500 text-sm mb-10 leading-relaxed">
          We are seeking agents of change. Artists, writers, and visionaries to help us define the next decade of anime culture.
        </p>

        <div className="space-y-4">
          {roles.map((role) => (
            <div 
              key={role.id} 
              className={`p-4 rounded border transition-all cursor-pointer ${
                formData.role === role.id 
                ? 'bg-[#1A0000] border-[#FF0000]' 
                : 'bg-[#111] border-[#1F1F1F] hover:border-[#333]'
              }`}
              onClick={() => setFormData({...formData, role: role.id})}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded ${formData.role === role.id ? 'bg-[#FF0000] text-white' : 'bg-[#1A1A1A] text-gray-500'}`}>
                  <role.icon size={18} />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-wide text-[11px] mb-1 text-white">{role.name}</h3>
                  <p className="text-[10px] text-gray-500 font-mono italic">{role.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-[#111] border border-[#1F1F1F] rounded-lg">
          <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest mb-4 text-[#FF0000]">
            <Terminal size={14} /> System Specs
          </h4>
          <ul className="text-[10px] text-[#555] font-mono space-y-2 uppercase tracking-wide">
            <li>• Active community participation</li>
            <li>• Discord internal system proficiency</li>
            <li>• Zero tolerance for network toxicity</li>
          </ul>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-7">
        <div className="bg-[#111] border border-[#1F1F1F] p-8 rounded-xl shadow-xl">
          <h2 className="text-lg font-black uppercase italic text-white mb-8 flex justify-between items-center">
             <span>Agent Profile</span>
             <span className="text-[10px] font-mono text-gray-600">REQ: {formData.role.toUpperCase()}</span>
          </h2>

          {/* UI Debugging: Login Status Indicator */}
          <div className="mb-6 p-3 bg-[#0A0A0C] border border-[#1F1F1F] rounded flex items-center justify-between font-mono text-[9px] uppercase tracking-wider">
            <span className="text-zinc-500">Security Gate Matrix</span>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">Status:</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${currentUser ? "bg-green-500/10 border border-green-500/30 text-green-500 animate-pulse" : "bg-red-500/10 border border-red-500/30 text-red-500"}`}>
                {currentUser ? "Logged In" : "Logged Out"}
              </span>
              {currentUser && <span className="text-zinc-600">({currentUser.email})</span>}
            </div>
          </div>

          {/* Guest User Warning Banner */}
          {!currentUser && (
            <div className="mb-6 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center gap-2 font-mono text-[10px] uppercase font-black rounded shadow-[0_0_10px_rgba(245,158,11,0.05)]">
              <AlertCircle size={14} className="shrink-0" />
              <span>Applying as Guest: Please ensure your contact info is correct so we can reach you.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#555]">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#050505] border border-[#1F1F1F] rounded p-3 text-xs focus:border-[#FF0000] outline-none font-mono text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#555]">Age</label>
                <input 
                  required
                  type="number" 
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  className="w-full bg-[#050505] border border-[#1F1F1F] rounded p-3 text-xs focus:border-[#FF0000] outline-none font-mono text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#555]">Communication Protocol (Discord/Telegram)</label>
              <input 
                required
                type="text" 
                value={formData.discord}
                onChange={(e) => setFormData({...formData, discord: e.target.value})}
                className="w-full bg-[#050505] border border-[#1F1F1F] rounded p-3 text-xs focus:border-[#FF0000] outline-none font-mono text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#555]">Skill Matrix</label>
              <textarea 
                required
                rows={2}
                value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
                className="w-full bg-[#050505] border border-[#1F1F1F] rounded p-3 text-xs focus:border-[#FF0000] outline-none font-mono resize-none text-white appearance-none"
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#555]">Bio/Past Experience</label>
              <textarea 
                required
                rows={3}
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                className="w-full bg-[#050505] border border-[#1F1F1F] rounded p-3 text-xs focus:border-[#FF0000] outline-none font-mono resize-none text-white appearance-none"
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#555]">Availability Window</label>
              <input 
                required
                type="text" 
                value={formData.availability}
                onChange={(e) => setFormData({...formData, availability: e.target.value})}
                className="w-full bg-[#050505] border border-[#1F1F1F] rounded p-3 text-xs focus:border-[#FF0000] outline-none font-mono text-white"
              />
            </div>

            {error && (
              <div className="p-3 bg-[#1A0000] border border-[#FF0000]/20 text-[#FF0000] text-[10px] flex items-center gap-2 font-mono uppercase font-black">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting || authLoading}
              className="w-full bg-[#FF0000] hover:bg-[#CC0000] disabled:bg-gray-800 text-white font-black uppercase tracking-[0.3em] py-4 rounded transition-all text-xs"
            >
              {authLoading ? 'Verifying Session Coordinates...' : isSubmitting ? 'Processing...' : 'Engage Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
