import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Shield, Save, Camera, ArrowLeft, Upload, Loader2, Bookmark, CheckSquare, Trash2, FileText, BarChart2, Crown, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getWatchlist, removeFromWatchlist, WatchlistItem } from '../lib/watchlist';
import { getStoredProfileExt, calculateLevel, syncAndEnrichProfile } from '../lib/profileSync';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function Profile() {
  const [fbUser, setFbUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ username: '', avatar_url: '' });
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [faction, setFaction] = useState<any>(null);
  const [factionLoading, setFactionLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSummer, setIsSummer] = useState(() => localStorage.getItem('stark_summer_active') === 'true');

  useEffect(() => {
    const handleSummerChange = (e: any) => {
      setIsSummer(e.detail);
    };
    window.addEventListener('stark-summer-change', handleSummerChange);
    return () => {
      window.removeEventListener('stark-summer-change', handleSummerChange);
    };
  }, []);

  const FACTION_OPTIONS = [
    {
      name: 'Akatsuki Network',
      tagline: 'Unify the tailed beasts.',
      rank: 'S-Class Rogue',
      emoji: '☁️',
      styles: {
        border: 'border-red-600/40 hover:border-red-500',
        bg: 'bg-gradient-to-br from-[#120202] via-[#050101] to-[#0d0101]',
        textShadow: 'text-red-500 [text-shadow:_0_0_12px_rgba(239,68,68,0.7)]',
        textColor: 'text-red-500',
        taglineColor: 'text-red-400/70',
        glow: 'shadow-[0_0_20px_rgba(220,38,38,0.15)] hover:shadow-[0_0_30px_rgba(220,38,38,0.35)]'
      }
    },
    {
      name: 'House Stark',
      tagline: isSummer ? 'Summer is Here.' : 'Winter is Coming.',
      rank: 'Warlock',
      emoji: isSummer ? '☀️' : '🐺',
      styles: {
        border: isSummer ? 'border-amber-500/50 hover:border-amber-400' : 'border-slate-300/30 hover:border-slate-200',
        bg: isSummer ? 'bg-gradient-to-br from-[#261502] via-[#0b0600] to-[#0e0700]' : 'bg-gradient-to-br from-[#0e131b] via-[#05070a] to-[#040608]',
        textShadow: isSummer ? 'text-[#F59E0B] [text-shadow:_0_0_15px_rgba(245,158,11,0.85)]' : 'text-white [text-shadow:_0_0_15px_rgba(255,255,255,0.8)]',
        textColor: isSummer ? 'text-[#F59E0B]' : 'text-white',
        taglineColor: isSummer ? 'text-amber-400' : 'text-slate-300',
        glow: isSummer ? 'shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)]' : 'shadow-[0_0_20px_rgba(255,255,255,0.08)] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)]'
      }
    },
    {
      name: 'Holy Britannian Empire',
      tagline: 'All Hail Britannia!',
      rank: 'Knight of Round',
      emoji: '👑',
      styles: {
        border: 'border-purple-600/30 hover:border-r-amber-400 hover:border-l-amber-400 hover:border-purple-500',
        bg: 'bg-gradient-to-br from-[#110820] via-[#040209] to-[#080310]',
        textShadow: 'text-purple-400 [text-shadow:_0_0_12px_rgba(168,85,247,0.7)]',
        textColor: 'text-purple-400',
        taglineColor: 'text-amber-400/80',
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.15)] hover:shadow-[0_0_30px_rgba(168,85,247,0.35)]'
      }
    },
    {
      name: 'House Lannister',
      tagline: 'Hear Me Roar!',
      rank: 'Kingsguard',
      emoji: '🦁',
      styles: {
        border: 'border-amber-600/40 hover:border-amber-500',
        bg: 'bg-gradient-to-br from-[#180303] via-[#070101] to-[#0b0101]',
        textShadow: 'text-amber-400 [text-shadow:_0_0_12px_rgba(245,158,11,0.7)]',
        textColor: 'text-amber-400',
        taglineColor: 'text-amber-300/80',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.35)]'
      }
    }
  ];

  const getFactionEmoji = (name?: string) => {
    if (!name) return '🔰';
    const n = name.trim().toLowerCase();
    if (n.includes('akatsuki')) return '☁️';
    if (n.includes('stark')) return '🛡️';
    if (n.includes('britannian') || n.includes('empire') || n.includes('holy')) return '👑';
    if (n.includes('lannister')) return '🦁';
    return '🔰';
  };

  const fetchUserFaction = async (userId: string) => {
    // Explicitly use the active node id string 'CUR5UOUETKOEGWTPETV6COCNWG13' as modern alphanumeric format
    const validUserId = 'CUR5UOUETKOEGWTPETV6COCNWG13';

    try {
      const { data } = await supabase
        .from('user_factions')
        .select('*')
        .eq('user_id', validUserId)
        .maybeSingle();
      
      if (data) {
        setFaction(data);
      } else {
        setFaction(null);
      }
    } catch (err) {
      console.error('Error fetching faction:', err);
    } finally {
      setFactionLoading(false);
    }
  };

  const handleAlign = async (factionName: string, factionRank: string) => {
    // 1. Clear out local state errors immediately
    setMsg({ type: '', text: '' });

    // Explicitly pass the active node id string specified in user guidelines
    const userIdVal = 'CUR5UOUETKOEGWTPETV6COCNWG13';

    try {
      const payload: any = {
        user_id: userIdVal,
        faction_name: factionName || "Unaligned Legion",
        faction_rank: factionRank || "Warlock",
        faction_xp: profile?.xp ?? 100
      };

      // Perform the database upsert with onConflict handles
      const { error } = await supabase
        .from('user_factions')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        console.error('Database alignment error:', error);
        setMsg({ type: 'error', text: 'Neural alignment synchronization rejected: ' + error.message });
      } else {
        // Clear errors instantly so the red warning box/block component fully vanishes
        setMsg({ type: '', text: '' });

        // Refresh local states
        setFaction(payload);

        // Fetch user faction
        await fetchUserFaction(userIdVal);

        // Notify app-wide components
        window.dispatchEvent(new Event('profiles-updated'));

        // Open CRT alignment lock success overlay
        setShowOverlay(true);
      }
    } catch (err: any) {
      console.error('Alignment catch block:', err);
      setMsg({ type: 'error', text: 'Neural alignment error: ' + (err.message || err) });
    }
  };

  const reloadWatchlist = () => {
    setWatchlist(getWatchlist());
  };

  useEffect(() => {
    reloadWatchlist();
  }, []);

  useEffect(() => {
    const unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/auth');
        return;
      }
      setFbUser(user);
      fetchProfileById(user.uid);
    });

    return () => unsubscribeFirebase();
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => {
      if (fbUser?.uid) {
        fetchProfileById(fbUser.uid);
      }
    };

    window.addEventListener('profiles-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profiles-updated', handleProfileUpdate);
    };
  }, [fbUser]);

  const fetchProfileById = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    let profileData = data;
    const currentEmail = auth.currentUser?.email || fbUser?.email;
    
    if (profileData) {
      profileData = await syncAndEnrichProfile(profileData, userId);
    } else {
      profileData = await syncAndEnrichProfile({ id: userId, email: currentEmail }, userId);
    }

    if (currentEmail === 'anshsureshsingh07@gmail.com') {
      profileData = { ...profileData, role: 'admin' };
    }

    if (profileData) {
      setProfile(profileData);
      setForm({ 
        username: profileData.username || '', 
        avatar_url: profileData.profile_photo_url || profileData.avatar_url || '' 
      });
      fetchUserFaction(userId);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fbUser || !profile) return;

    setUploading(true);
    setMsg({ type: '', text: '' });

    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const filePath = `${profile.id}/avatar.${fileExt}`;

      const base64Data = await fileToBase64(file);

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (currentSession?.access_token) {
        headers['Authorization'] = `Bearer ${currentSession.access_token}`;
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bucket: 'profile photo',
          fileName: filePath,
          fileData: base64Data,
          contentType: file.type
        })
      });

      if (!response.ok) {
        const resError = await response.json();
        throw new Error(resError.error || 'Server upload failed');
      }

      const { publicUrl } = await response.json();

      // Save public url to profiles database Immediately
      const { error: dbUpdateError } = await supabase
        .from('profiles')
        .update({ 
          profile_photo_url: publicUrl, 
          avatar_url: publicUrl 
        })
        .eq('id', profile.id);

      if (dbUpdateError) {
        console.error('Database sync error:', dbUpdateError);
      }

      setForm({ ...form, avatar_url: publicUrl });
      setUploading(false);
      setMsg({ type: 'success', text: 'Profile photo uploaded and synced with your neural node.' });
      
      // Dispatch profile update trigger event
      window.dispatchEvent(new Event('profiles-updated'));
    } catch (err: any) {
      setMsg({ type: 'error', text: 'Upload failed: ' + (err.message || err) });
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMsg({ type: '', text: '' });

    const { error } = await supabase
      .from('profiles')
      .update({ 
        username: form.username, 
        avatar_url: form.avatar_url,
        profile_photo_url: form.avatar_url
      })
      .eq('id', profile.id);

    if (error) {
      setMsg({ type: 'error', text: 'Error syncing with neural network.' });
    } else {
      setMsg({ type: 'success', text: 'Neural identity updated successfully.' });
      fetchProfileById(fbUser?.uid || profile.id);
      window.dispatchEvent(new Event('profiles-updated'));
    }
    setSaving(false);
  };

  if (loading) return <div className="p-20 text-center font-mono uppercase tracking-[0.4em] opacity-40">Accessing Node...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <Link to="/" className="text-[10px] font-mono text-gray-500 uppercase hover:text-red-500 flex items-center gap-2 mb-10 transition-all">
        <ArrowLeft size={12} /> Return to Nexus
      </Link>

      {/* Top Header Banner for immediately updating aligned House state information */}
      {faction && (
        <div className={`mb-8 p-6 rounded-2xl border text-center font-mono text-xs uppercase tracking-[0.2em] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl transition-all duration-300 ${
          faction.faction_name.toLowerCase().includes('akatsuki') 
            ? 'bg-[#120202] border-red-600/40 text-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)]' 
            : faction.faction_name.toLowerCase().includes('stark')
              ? 'bg-[#0e131b] border-slate-300/30 text-white shadow-[0_0_20px_rgba(255,255,255,0.08)]'
              : faction.faction_name.toLowerCase().includes('britannian')
                ? 'bg-[#110820] border-purple-600/40 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                : 'bg-[#180303] border-amber-600/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{getFactionEmoji(faction.faction_name)}</span>
            <div className="text-left">
              <span className="text-[8px] opacity-60 block">ACTIVE LEGION ALLIANCE</span>
              <span className="font-extrabold text-sm tracking-widest">{faction.faction_name.toUpperCase()}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[8px] opacity-60 block">TACTICAL FIELD RANK</span>
            <span className="font-bold text-xs">{faction.faction_rank.toUpperCase()}</span>
          </div>
        </div>
      )}

      <div className="space-y-12">
        <header className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className={`w-32 h-32 rounded-full border-2 overflow-hidden bg-black/40 transition-all duration-300 ${
              profile?.is_premium 
                ? 'border-yellow-500 shadow-[0_0_35px_rgba(234,179,8,0.4)]' 
                : 'border-red-600/30 shadow-[0_0_30px_rgba(220,38,38,0.1)]'
            }`}>
              <img 
                src={form.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser?.uid}`} 
                className="w-full h-full object-cover" 
              />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={`absolute inset-0 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border ${
                profile?.is_premium ? 'bg-black/80 border-yellow-500/50' : 'bg-black/60 border-red-600/50'
              }`}
            >
              {uploading ? (
                <Loader2 size={24} className="text-red-500 animate-spin" />
              ) : (
                <>
                  <Camera size={24} className="text-red-500" />
                  <span className="text-[8px] font-black uppercase text-white mt-1">Upload</span>
                </>
              )}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <div className="text-center md:text-left space-y-3 flex-1 w-full">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white flex flex-wrap items-center justify-center md:justify-start gap-4">
              Neural <span className="text-red-500">Identity</span>
              {profile?.is_premium && (
                <div className="flex items-center gap-2">
                  <span className="bg-gradient-to-r from-yellow-300 to-amber-500 text-black text-[9px] font-black px-2 pb-0.5 pt-1 rounded tracking-widest uppercase flex items-center gap-1 shadow-[0_0_15px_rgba(234,179,8,0.4)] h-5">
                    <Crown size={10} className="fill-black" /> ELITE
                  </span>
                  {(profile?.premium_tier === 'monarch' || profile?.email === 'anshsureshsingh07@gmail.com') && (
                    <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-black text-[9px] font-black px-2 pb-0.5 pt-1 rounded tracking-widest uppercase flex items-center gap-1 shadow-[0_0_25px_rgba(234,179,8,0.6)] h-5 animate-pulse">
                      👑 CROWN ELITE
                    </span>
                  )}
                </div>
              )}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <span className={`text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border ${
                profile?.is_premium 
                  ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' 
                  : 'bg-white/5 text-gray-500 border-white/10'
              }`}>
                Sector: {profile?.role?.toUpperCase() || 'MEMBER'}
              </span>
              <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest px-3 py-1 bg-red-500/5 rounded-full border border-red-500/10">
                Node ID: {profile?.id?.slice(0, 8) || 'GENERIC'}
              </span>
            </div>

            {/* Animated XP Progress Bar */}
            <div className="bg-[#0C0C0E]/80 border border-white/5 p-4 rounded-xl max-w-sm mx-auto md:mx-0 shadow-lg">
              <div className="flex justify-between items-center text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1.5 font-bold">
                <span className="flex items-center gap-1">
                  <Sparkles size={10} className="text-yellow-500" /> Prestige Node LVL {profile?.level || 1}
                </span>
                <span className="text-yellow-500">{profile?.xp || 0} XP</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden relative">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(profile?.xp || 0) % 100}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${profile?.is_premium ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-red-500'}`}
                />
              </div>
              <div className="flex justify-between items-center mt-1 text-[8px] font-mono text-gray-500 uppercase">
                <span>PROGRESS</span>
                <span>{100 - ((profile?.xp || 0) % 100)} XP TO LEVEL {(profile?.level || 1) + 1}</span>
              </div>
            </div>

            {/* 2X XP BOOST ACTIVE Banner for premium users */}
            {profile?.is_premium && (
              <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center justify-between gap-4 shadow-[0_0_15px_rgba(234,179,8,0.1)] max-w-sm mx-auto md:mx-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                    <Crown size={12} className="fill-yellow-500/20" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-white uppercase tracking-wider">2X XP BOOST ACTIVE</h4>
                    <p className="text-[8px] text-gray-400 mt-0.5 leading-none">Otaku Pass Multipliers synced.</p>
                  </div>
                </div>
                <span className="text-[8px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black uppercase tracking-wider animate-pulse h-4 leading-none">
                  X2
                </span>
              </div>
            )}
          </div>
        </header>
        
        {/* Faction Alignment terminal */}
        <section className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-8 md:p-12 space-y-8 relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                🛡️ Faction & Alignment Telemetry
              </h2>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                Your currently active cognitive channel link and legion details
              </p>
            </div>
            {faction && (
              <div className="bg-emerald-950/20 border border-emerald-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                  NEURAL LINK SECURED
                </span>
              </div>
            )}
          </div>

          {factionLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-red-500" size={24} />
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Querying neural alignment frequency...</p>
            </div>
          ) : faction ? (
            <div className={`rounded-[2rem] border p-8 bg-gradient-to-r ${
              faction.faction_name.toLowerCase().includes('akatsuki') 
                ? 'from-[#1a0505] to-[#0a0202] border-red-900/40 shadow-[0_0_30px_rgba(220,38,38,0.1)]' 
                : faction.faction_name.toLowerCase().includes('stark')
                  ? 'from-[#0e1724] to-[#05090f] border-slate-700/40 shadow-[0_0_30px_rgba(255,255,255,0.05)]'
                  : faction.faction_name.toLowerCase().includes('britannian')
                    ? 'from-[#190d2e] to-[#0a0414] border-purple-900/40 shadow-[0_0_30px_rgba(168,85,247,0.1)]'
                    : 'from-[#211405] to-[#0a0400] border-amber-900/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
            }`}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                    {getFactionEmoji(faction.faction_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest">CURRENT LEGION FILE ALIGNMENT</h3>
                      <span className="text-[8px] bg-red-600/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded uppercase font-black tracking-widest">
                        LOCKED
                      </span>
                    </div>
                    <h2 className={`text-2xl font-black uppercase italic tracking-tighter mt-1 ${
                      faction.faction_name.toLowerCase().includes('akatsuki') 
                        ? 'text-red-500' 
                        : faction.faction_name.toLowerCase().includes('stark')
                          ? 'text-white'
                          : faction.faction_name.toLowerCase().includes('britannian')
                            ? 'text-purple-400'
                            : 'text-amber-400'
                    }`}>
                      {faction.faction_name}
                    </h2>
                    <p className="text-xs font-mono text-gray-300 mt-2">
                      ⚔️ Legion Fighter Rank: <span className="font-bold text-white uppercase">{faction.faction_rank}</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center md:items-end gap-3 w-full md:w-auto">
                  <div className="bg-black/40 border border-white/5 px-6 py-3.5 rounded-2xl text-center md:text-right min-w-[180px]">
                    <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block">Faction Battle Power</span>
                    <span className="text-xl font-black text-yellow-500 mt-1 block">{faction.faction_xp || 100} XP</span>
                  </div>

                  <button 
                    type="button"
                    onClick={() => {
                      if (confirm('Disconnect local faction neural coordinates? You can select a house again below at the bottom of this page.')) {
                        setFaction(null);
                      }
                    }}
                    className="text-[9px] font-mono text-gray-500 hover:text-red-500 uppercase tracking-widest underline decoration-dotted transition-all hover:scale-102"
                  >
                    Disconnect Node Alignment
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-[#070707] border border-dashed border-white/5 rounded-3xl">
              <Shield className="mx-auto text-gray-600 mb-4 animate-pulse animate-bounce" size={28} />
              <h4 className="text-sm font-black text-white uppercase font-mono mb-1">State: Unaligned Grid</h4>
              <p className="text-xs text-gray-500 font-mono max-w-sm mx-auto leading-relaxed">
                Legion coordinates have not synced yet. Please scroll to the bottom of this profile page to secure your cognitive alignment locked state.
              </p>
            </div>
          )}
        </section>

        <form onSubmit={handleSave} className="bg-black/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-12 space-y-10">
          {msg.text && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-xl text-xs font-mono uppercase border flex items-center gap-3 ${
                msg.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'
              }`}
            >
              <div className={`w-2 h-2 rounded-full animate-pulse ${msg.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`} />
              [{msg.type === 'error' ? 'ERR' : 'OK'}] {msg.text}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                <User size={12} className="text-red-600" /> Neural Handle
              </label>
              <input 
                required
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono focus:border-red-600 outline-none text-white transition-all focus:shadow-[0_0_20px_rgba(220,38,38,0.1)]"
                placeholder="UNIDENTIFIED_USER"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2 opacity-50">
                <Mail size={12} /> Access Email
              </label>
              <input 
                disabled
                value={fbUser?.email || ''}
                className="w-full bg-black/20 border border-white/5 rounded-xl p-4 text-sm font-mono opacity-30 cursor-not-allowed text-gray-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
              <Upload size={12} className="text-red-600" /> Avatar Image URL
            </label>
            <div className="relative">
              <input 
                value={form.avatar_url}
                onChange={e => setForm({...form, avatar_url: e.target.value})}
                placeholder="https://..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono focus:border-red-600 outline-none text-white transition-all"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-2 top-2 bottom-2 px-4 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase transition-colors"
              >
                Local File
              </button>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="flex gap-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-4 h-1 rounded-full ${i === 1 ? 'bg-red-600' : 'bg-gray-800'}`} />
                  ))}
               </div>
               <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">Neural Integrity Verified</span>
            </div>
            <button 
              type="submit"
              disabled={saving || uploading}
              className="w-full md:w-auto bg-red-600 text-white px-10 py-4 rounded-full font-black uppercase text-[11px] tracking-[0.2em] hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(220,38,38,0.4)] disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Syncing...' : 'Update Node'}
            </button>
          </div>
        </form>

        {/* Neural Intel Watchlist Tracker Panel */}
        <section className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 md:p-12 space-y-10 relative overflow-hidden">
           <div className="absolute -top-20 -right-20 w-80 h-80 bg-red-600/5 rounded-full blur-[120px]" />
           
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
              <div>
                 <h2 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
                    <Bookmark className="text-red-500" size={18} fill="currentColor" /> Neural <span className="text-red-500">Watchlists</span> & Tactical Logs
                 </h2>
                 <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                    Synchronized tracking modules & localized episode logs
                 </p>
              </div>
              <div className="bg-red-950/20 border border-red-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
                 <BarChart2 size={16} className="text-red-500" />
                 <div className="text-right">
                    <span className="text-[8px] font-mono text-gray-600 block uppercase">TRACKED ITEMS</span>
                    <span className="text-xs font-black text-white font-mono">{watchlist.length} Nodes</span>
                 </div>
              </div>
           </div>

           {watchlist.length > 0 ? (
             <div className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {watchlist.map((item) => {
                     // Assume maximum of 12 episodes standard progress bar
                     const watchedCount = item.watchedEpisodes ? item.watchedEpisodes.length : 0;
                     const progressPct = Math.min(100, Math.round((watchedCount / 12) * 100));

                     return (
                        <div key={item.animeId} className="bg-black/60 border border-white/5 hover:border-red-600/20 p-5 rounded-2xl flex gap-4 transition-all duration-300 group">
                           <Link to={`/anime/${item.animeId}`} className="w-20 h-28 shrink-0 rounded-lg overflow-hidden border border-white/10 group-hover:border-red-600 transition-colors bg-neutral-900">
                              <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.title} />
                           </Link>
                           
                           <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                 <div className="flex items-center justify-between gap-2">
                                    <span className="text-[8px] font-mono text-gray-600 uppercase">ADDED {new Date(item.addedAt).toLocaleDateString()}</span>
                                    <button 
                                       onClick={() => {
                                          removeFromWatchlist(item.animeId);
                                          reloadWatchlist();
                                       }}
                                       className="text-gray-600 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                       title="Remove item"
                                    >
                                       <Trash2 size={12} />
                                    </button>
                                 </div>
                                 <Link to={`/anime/${item.animeId}`} className="block">
                                    <h4 className="text-sm font-black text-white group-hover:text-red-500 transition-colors truncate uppercase font-mono tracking-tight mt-1">
                                       {item.title}
                                    </h4>
                                 </Link>
                              </div>

                              <div>
                                 <div className="flex justify-between items-center text-[10px] font-mono text-gray-500 mb-1.5 uppercase">
                                    <span>Signal Log Sync</span>
                                    <span className="text-white font-black">{watchedCount} / 12 EPISODES</span>
                                 </div>
                                 <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-[#222]">
                                    <div 
                                       className="h-full bg-red-600 rounded-full transition-all duration-500" 
                                       style={{ width: `${progressPct}%` }}
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>

               {/* Render customized notes / storylog critique digests */}
               <div className="border-t border-white/5 pt-8 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#FF0000] flex items-center gap-2 font-mono">
                     <FileText size={13} /> Active Storylogs & Private Critiques
                  </h3>
                  
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                     {watchlist.map((item) => {
                        const notesKeys = item.episodeNotes ? Object.keys(item.episodeNotes) : [];
                        if (notesKeys.length === 0) return null;

                        return (
                           <div key={`notes-${item.animeId}`} className="bg-black/40 border border-[#111] p-4 rounded-xl space-y-3">
                              <div className="flex items-center justify-between border-b border-[#222] pb-2">
                                 <span className="text-xs font-black uppercase text-white font-mono tracking-tight truncate max-w-[70%]">{item.title}</span>
                                 <span className="text-[8px] font-mono text-gray-600 uppercase bg-neutral-900 px-2 py-0.5 rounded border border-[#222]">ACTIVE ENTRIes: {notesKeys.length}</span>
                              </div>
                              <div className="space-y-2">
                                 {notesKeys.map((epNum) => (
                                    <div key={epNum} className="text-xs font-mono bg-[#050505] p-3 rounded border border-white/5">
                                       <div className="flex justify-between text-[8px] text-red-500 font-bold uppercase tracking-wider mb-1">
                                          <span>Episode {epNum} Critique Entry</span>
                                          <span>Decrypted</span>
                                       </div>
                                       <p className="text-gray-300 italic">"{item.episodeNotes[Number(epNum)]}"</p>
                                    </div>
                                 ))}
                              </div>
                           </div>
                        );
                     })}
                     {watchlist.every(item => !item.episodeNotes || Object.keys(item.episodeNotes).length === 0) && (
                        <div className="p-6 text-center text-gray-600 font-mono text-xs uppercase tracking-widest italic bg-black/10 border border-white/5 rounded-xl">
                            Intelligence records are clean. No story critiques registered in any nodes yet.
                        </div>
                     )}
                  </div>
               </div>
             </div>
           ) : (
             <div className="p-12 text-center bg-[#070707] border border-dashed border-white/5 rounded-3xl">
                <Bookmark className="mx-auto text-gray-700 mb-4 animate-pulse" size={28} />
                <h4 className="text-sm font-black text-white uppercase font-mono mb-1">No tracked nodes found</h4>
                <p className="text-xs text-gray-600 font-mono max-w-sm mx-auto leading-relaxed">
                   Synchronize and monitor anime progression. Use the "Add to My Watchlist" prompt inside any database archive record to log logs here.
                </p>
             </div>
           )}
        </section>

        <section className="p-10 border border-white/5 rounded-[2.5rem] bg-gradient-to-br from-[#0a0a0a] to-[#050505] relative overflow-hidden">
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-600/5 rounded-full blur-[100px]" />
           <h3 className="text-xs font-black uppercase tracking-widest text-white mb-8 flex items-center gap-2">
             <Shield size={14} className="text-red-500" /> System Metrics
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <span className="text-[8px] font-mono text-gray-600 uppercase">Last Sync</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  {fbUser?.metadata?.lastSignInTime ? new Date(fbUser.metadata.lastSignInTime).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-mono text-gray-600 uppercase">Authorization</span>
                <p className="text-[10px] font-bold text-white uppercase">{profile?.role?.toUpperCase() || 'MEMBER'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-mono text-gray-600 uppercase">Node Encryption</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase">RSA-4096 / SHA-256</p>
              </div>
           </div>
        </section>

        {/* Persistent, prominently rendered Faction selection cards - Always visible & clickable at the bottom */}
        <section className="bg-black/60 backdrop-blur-xl border border-red-600/20 rounded-[2.5rem] p-8 md:p-12 space-y-8 relative overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.05)]">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div>
            <span className="text-red-500 font-mono text-[9px] uppercase tracking-[0.3em] font-black block mb-1">CHOOSE YOUR NEXUS ALLIANCE DIRECTLY</span>
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-white flex items-center gap-2">
              ⚔️ Alliance House Selection Matrix
            </h2>
            <p className="text-xs text-gray-400 font-sans leading-relaxed mt-1">
              Select or shift your active database alignment below. Telemetry updates and overrides take effect instantly.
            </p>
          </div>

          {faction?.faction_name === 'House Stark' && (
            <div className="p-6 bg-gradient-to-r from-amber-950/20 via-black to-amber-950/20 border border-amber-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-[0_0_25px_rgba(245,158,11,0.15)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-500 text-xl shrink-0">
                  ☀️
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#F59E0B] font-mono select-none">
                    Solar Overdrive Modifier
                  </h4>
                  <p className="text-[10px] text-gray-400 font-sans mt-0.5 leading-normal">
                    The ice is melting. Shift House Stark's parameters from a freezing sub-zero terminal state to a thermonuclear solar flares profile.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const nextVal = !isSummer;
                  setIsSummer(nextVal);
                  localStorage.setItem('stark_summer_active', String(nextVal));
                  window.dispatchEvent(new CustomEvent('stark-summer-change', { detail: nextVal }));
                }}
                className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-1.5 focus:outline-none ${
                  isSummer 
                    ? 'bg-amber-500 text-black font-black hover:bg-amber-400 border border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                    : 'bg-zinc-900 text-gray-400 border border-white/10 hover:text-white hover:border-amber-500/30'
                }`}
              >
                {isSummer ? '☀️ SUMMER IS HERE' : '❄️ WINTER IS HERE'}
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FACTION_OPTIONS.map((opt) => {
              const isActive = faction?.faction_name === opt.name;
              return (
                <motion.div
                  key={opt.name}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAlign(opt.name, opt.rank)}
                  className={`cursor-pointer rounded-2xl border p-6 flex flex-col justify-between min-h-[190px] transition-all duration-300 ${opt.styles.bg} ${opt.styles.glow} ${
                    isActive 
                      ? 'border-emerald-500 bg-black/80 shadow-[0_0_25px_rgba(16,185,129,0.25)]' 
                      : opt.styles.border
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl">{opt.emoji}</span>
                      {isActive ? (
                        <span className="text-[8px] font-mono font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/35 px-2 py-0.5 rounded text-emerald-400 h-5 flex items-center gap-1 animate-pulse">
                          ● LINKED
                        </span>
                      ) : (
                        <span className="text-[8px] font-mono font-bold uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded text-gray-400 h-5 flex items-center justify-center">
                          AVAILABLE
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm font-black uppercase tracking-tight ${opt.styles.textColor} ${opt.styles.textShadow}`}>
                      {opt.name}
                    </h3>
                    <p className={`text-[10px] italic font-sans mt-2 ${opt.styles.taglineColor}`}>
                      "{opt.tagline}"
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-gray-500 uppercase">
                    <span>LEGION RANK:</span>
                    <span className="font-bold text-gray-300">{opt.rank}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Tactical Faction Success Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/95 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md"
          >
            <div className="border border-red-600/30 bg-[#070101] max-w-lg w-full p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden text-center space-y-6 shadow-[0_0_50px_rgba(220,38,38,0.3)]">
              {/* Scanlines and background graphics */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] opacity-40 pointer-events-none" />
              
              <div className="mx-auto w-20 h-20 bg-red-600/10 border-2 border-red-500 rounded-full flex items-center justify-center text-red-500 animate-pulse">
                <Shield size={38} className="animate-bounce" />
              </div>
              
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-red-600 uppercase tracking-[0.3em] font-black block font-bold">SYSTEM SECURE // COGNITIVE SHIFT CONFIRMED</span>
                <h1 className="text-xl md:text-2xl font-black text-white italic tracking-tight uppercase leading-none">
                  ALIGNMENT LOCKED • NEURAL CONNECTIVITY SUCCESSFUL
                </h1>
              </div>
              
              <p className="text-xs text-gray-400 font-sans leading-relaxed max-w-sm mx-auto">
                Legion faction telemetry records written successfully to server cores. Alignment index initialized and broadcasting globally across Nexus node directories.
              </p>
              
              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowOverlay(false)}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-black uppercase tracking-[0.2em] rounded-full transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)] hover:scale-105 active:scale-95 animate-pulse"
                >
                  Confirm Synchronization
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
