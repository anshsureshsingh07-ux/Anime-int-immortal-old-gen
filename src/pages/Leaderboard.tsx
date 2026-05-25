import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Sparkles, Filter, Search, Zap, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { 
  fetchLeaderboard, 
  awardXP, 
  getStoredProfileExt, 
  calculateLevel, 
  LeaderboardUser, 
  EnhancedProfile,
  syncAndEnrichProfile
} from '../lib/profileSync';

export default function Leaderboard() {
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<EnhancedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'premium'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [showXPToast, setShowXPToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [factionStandings, setFactionStandings] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const firebaseUser = auth.currentUser;
      setCurrentUser(firebaseUser);

      let enriched: EnhancedProfile | null = null;
      if (firebaseUser) {
        // Fetch current profile
        const { data: rawDbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', firebaseUser.uid)
          .single();
        
        if (rawDbProfile) {
          enriched = await syncAndEnrichProfile(rawDbProfile, firebaseUser.uid);
          setCurrentProfile(enriched);
        } else {
          // Sync with storage fallback
          const ext = getStoredProfileExt(firebaseUser.uid);
          enriched = {
            id: firebaseUser.uid,
            username: firebaseUser.email?.split('@')[0] || 'Vanguard Member',
            email: firebaseUser.email || null,
            avatar_url: null,
            profile_photo_url: null,
            role: 'member',
            xp: ext.xp,
            level: ext.level,
            is_premium: ext.is_premium,
            created_at: new Date().toISOString()
          };
          setCurrentProfile(enriched);
        }
      }

      // Fetch combined leaderboard
      const users = await fetchLeaderboard(firebaseUser?.uid, enriched);
      setLeaderboardUsers(users);

      try {
        const { data: allFactions } = await supabase.from('user_factions').select('*');
        const defaultFactions = [
          { name: 'Akatsuki Network', xp: 0, count: 0, emoji: '☁️', color: 'from-red-600 to-red-900', border: 'border-red-500/30' },
          { name: 'House Stark', xp: 0, count: 0, emoji: '🛡️', color: 'from-blue-400 to-slate-700', border: 'border-blue-400/30' },
          { name: 'Holy Britannian Empire', xp: 0, count: 0, emoji: '👑', color: 'from-purple-600 to-indigo-900', border: 'border-purple-500/30' },
          { name: 'House Lannister', xp: 0, count: 0, emoji: '🦁', color: 'from-amber-500 to-amber-800', border: 'border-amber-500/30' }
        ];

        if (allFactions) {
          allFactions.forEach(f => {
            const match = defaultFactions.find(df => df.name.toLowerCase() === f.faction_name.toLowerCase());
            if (match) {
              match.xp += Number(f.faction_xp || 100);
              match.count += 1;
            }
          });
        }

        defaultFactions.sort((a, b) => b.xp - a.xp);
        setFactionStandings(defaultFactions);
      } catch (err) {
        console.warn('Failed to parse faction stands:', err);
      }
      
      // Check local storage for today's check-in
      if (firebaseUser) {
        const todayStr = new Date().toDateString();
        const storedCheckin = localStorage.getItem(`nexus_checkin_${firebaseUser.uid}`);
        if (storedCheckin === todayStr) {
          setCheckedInToday(true);
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen for database profile changes to hot-reload scores!
    const handleProfileUpdate = () => {
      loadData();
    };
    window.addEventListener('profiles-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profiles-updated', handleProfileUpdate);
    };
  }, []);

  const handleDailyCheckIn = async () => {
    if (!currentUser || checkedInToday || checkInLoading) return;
    setCheckInLoading(true);

    try {
      const isPremium = currentProfile?.is_premium;
      const baseXP = 50;
      // Double XP for premium users
      const finalXP = isPremium ? baseXP * 2 : baseXP;

      const updated = await awardXP(currentUser.uid, baseXP);
      if (updated) {
        setCurrentProfile(updated);
        // Save check-in day
        const todayStr = new Date().toDateString();
        localStorage.setItem(`nexus_checkin_${currentUser.uid}`, todayStr);
        setCheckedInToday(true);

        setToastMessage(`Daily Connection Verified! +${finalXP} XP Added.`);
        setShowXPToast(true);
        loadData();
        
        // Hide toast after 4s
        setTimeout(() => setShowXPToast(false), 4000);
      }
    } catch (err) {
      console.error('Check-in error:', err);
    } finally {
      setCheckInLoading(false);
    }
  };

  const triggerUpgradeModal = () => {
    window.dispatchEvent(new Event('open-upgrade-modal'));
  };

  // Filter & Search items
  const filteredUsers = leaderboardUsers
    .filter(u => {
      if (filterType === 'premium') return u.is_premium;
      return true;
    })
    .filter(u => {
      if (!searchQuery) return true;
      return u.username.toLowerCase().includes(searchQuery.toLowerCase());
    });

  const podiumUsers = filteredUsers.slice(0, 3);
  const listUsers = filteredUsers.slice(3);

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 py-10 px-4 sm:px-8 max-w-7xl mx-auto space-y-12">
      {/* Dynamic XP Toast banner */}
      <AnimatePresence>
        {showXPToast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-20 right-4 sm:right-10 z-[999] bg-gradient-to-r from-yellow-500 to-amber-600 text-black px-4 py-3 rounded-lg shadow-[0_0_30px_rgba(234,179,8,0.4)] flex items-center gap-3 font-black uppercase text-xs tracking-wider"
          >
            <Zap className="fill-black animate-bounce" size={16} />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header Card */}
      <div className="relative rounded-3xl overflow-hidden border border-[#222] bg-gradient-to-t from-black via-[#0B0B0D] to-[#0E0E10] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-[#1A1A1E] border border-[#2E2E33] px-3.5 py-1.5 rounded-full text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
            <Trophy size={12} className="text-yellow-500" /> Sector High Scores
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase italic tracking-tighter leading-none">
            ELITE <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">LEADERBOARD</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 font-sans max-w-xl">
            Power level directly into community legions. Watchlist entries, seasonal updates, and daily connections fuel your XP nodes. Dual-multipliers are active for Otaku Pass holders.
          </p>

          {/* Quick Stats Block */}
          {currentUser && currentProfile && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
              <div className="bg-[#111115] border border-white/5 px-4 py-2.5 rounded-xl text-center md:text-left min-w-[120px]">
                <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Your Level</p>
                <p className="text-lg font-black text-white">LVL {currentProfile.level}</p>
              </div>
              <div className="bg-[#111115] border border-white/5 px-4 py-2.5 rounded-xl text-center md:text-left min-w-[120px]">
                <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Your XP</p>
                <p className="text-lg font-black text-yellow-500">{currentProfile.xp} XP</p>
              </div>
              <div className="bg-[#111115] border border-white/5 px-4 py-2.5 rounded-xl text-center md:text-left min-w-[120px]">
                <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Premium multiplier</p>
                <p className={`text-lg font-black ${currentProfile.is_premium ? 'text-yellow-400' : 'text-gray-400'}`}>
                  {currentProfile.is_premium ? '2X BOOST' : '1X STANDARD'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Widgets */}
        <div className="shrink-0 w-full md:w-auto bg-[#131317] border border-[#25252D] rounded-2xl p-6 flex flex-col items-center text-center gap-4 min-w-[280px]">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-[#FF0000]">
            <Zap size={22} className={checkedInToday ? "text-gray-500" : "animate-pulse fill-red-500/20"} />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none">Daily Node Sync</h3>
            <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">Perform connection sync once every 24 hours to gain immediate XP boost bounty.</p>
          </div>

          {!currentUser ? (
            <div className="text-xs text-gray-400 font-mono py-1.5 px-3 bg-red-600/10 rounded uppercase">Authenticate to Sync</div>
          ) : checkedInToday ? (
            <button 
              disabled 
              className="w-full bg-[#1F1F27] text-gray-500 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed"
            >
              <CheckCircle2 size={14} className="text-emerald-500" />
              Synced Securely [Today]
            </button>
          ) : (
            <button 
              onClick={handleDailyCheckIn}
              disabled={checkInLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-800 text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 hover:scale-[1.02] shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:shadow-[0_0_25px_rgba(220,38,38,0.5)]"
            >
              {checkInLoading ? 'Initializing Connection...' : 'Sync Connection (+50 XP)'}
            </button>
          )}

          {!currentProfile?.is_premium && currentUser && (
            <button 
              onClick={triggerUpgradeModal}
              className="text-[10px] font-mono text-yellow-500 hover:text-yellow-400 uppercase tracking-widest flex items-center gap-1 mt-1 font-bold underline decoration-dotted"
            >
              <Crown size={10} className="fill-yellow-500/20" /> Enable 2x XP Multipliers
            </button>
          )}
        </div>
      </div>

      {/* Filters & Core Interface Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0A0A0C] border border-[#16161A] p-4 rounded-2xl">
        {/* Filters */}
        <div className="flex items-center gap-2 scale-95 sm:scale-100">
          <button 
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
              filterType === 'all' 
                ? 'bg-[#1A1A1A] text-white border-b-2 border-red-500' 
                : 'text-gray-500 hover:text-white hover:bg-[#111]'
            }`}
          >
            <Filter size={12} /> Global Index
          </button>
          <button 
            onClick={() => setFilterType('premium')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
              filterType === 'premium' 
                ? 'bg-yellow-500/10 text-yellow-500 border-b-2 border-yellow-500' 
                : 'text-gray-500 hover:text-yellow-500 hover:bg-yellow-500/5'
            }`}
          >
            <Crown size={12} /> Elite Agents Only
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input 
            type="text" 
            placeholder="Search agents..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121215] border border-[#222] hover:border-[#333] focus:border-red-500 focus:outline-none rounded-lg py-2.5 px-10 text-xs text-white font-mono transition-colors"
          />
          <Search className="absolute left-3.5 top-3 text-gray-500" size={14} />
        </div>
      </div>

      {/* "War Room" Dominance Leaderboard */}
      {filterType === 'premium' && factionStandings.length > 0 && (
        <div className="bg-gradient-to-br from-[#120a1c] via-[#0b030f] to-[#040106] border border-purple-500/20 rounded-[2.5rem] p-8 md:p-10 mb-8 relative overflow-hidden shadow-[0_0_50px_rgba(168,85,247,0.1)]">
          {/* Retro futuristic background grid/telemetry */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(168,85,247,0.02),rgba(0,0,0,0.1),rgba(168,85,247,0.02))] bg-[size:100%_4px,3px_100%] opacity-30 pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-purple-500 animate-pulse">⚡</span>
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">
                  War Room <span className="text-purple-400">Dominance</span> Matrix
                </h2>
              </div>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                Dynamic battle power compilation of active factions on Nexus Network
              </p>
            </div>

            <div className="bg-purple-950/20 border border-purple-500/20 px-4 py-2 rounded-xl flex items-center gap-3 self-start md:self-auto">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest font-black">
                REAL-TIME EMPIRE METRICS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              const maxXP = Math.max(...factionStandings.map(f => f.xp), 1) || 1000;
              const totalXP = factionStandings.reduce((sum, f) => sum + f.xp, 0) || 1;
              
              return factionStandings.map((stand, idx) => {
                const widthPercentage = Math.min(100, Math.round((stand.xp / maxXP) * 100));
                const totalContributionPct = Math.min(100, Math.round((stand.xp / totalXP) * 100));
                
                return (
                  <div key={stand.name} className={`bg-black/40 border ${idx === 0 ? 'border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.05)]' : 'border-white/5'} p-5 rounded-2xl transition-all duration-300 hover:scale-[1.01]`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-lg">
                          {stand.emoji}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                            {stand.name}
                            {idx === 0 && (
                              <span className="text-[7px] bg-purple-500 text-white px-1.5 py-0.5 rounded font-black tracking-widest uppercase animate-pulse">
                                SUPREME
                              </span>
                            )}
                          </h3>
                          <div className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">
                            Active nodes: <span className="text-white font-bold">{stand.count} Members aligned</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                        <span className="text-sm font-black text-purple-400 font-mono">
                          {stand.xp.toLocaleString()} XP
                        </span>
                        <span className="text-[8px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded font-bold">
                          {totalContributionPct}% GLOBAL POWER
                        </span>
                      </div>
                    </div>

                    {/* Real-time power gauge */}
                    <div className="w-full h-4 bg-black border border-white/5 rounded-full overflow-hidden p-[2px]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPercentage}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${stand.color} shadow-[0_0_10px_rgba(168,85,247,0.3)]`}
                      />
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Podium Render Section (Top 3 Users) */}
      {!loading && filteredUsers.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-10 px-2 sm:px-6">
          {/* 2nd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="order-2 md:order-1 relative bg-[#0E0E10] border border-gray-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] md:h-[280px] justify-center"
          >
            <div className="absolute top-4 left-4 font-mono text-gray-500 text-sm font-black uppercase tracking-widest">#2</div>
            <div className="relative w-20 h-20 rounded-full border-2 border-slate-400 p-1 mb-3">
              <img src={podiumUsers[1].avatar_url} className="w-full h-full object-cover rounded-full bg-slate-900" alt="Avatar" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-400 text-black rounded-full flex items-center justify-center font-black text-[10px]">2ND</div>
            </div>
            <h3 className={`text-base font-black truncate max-w-full ${podiumUsers[1].is_premium ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 font-bold shadow-sm' : 'text-white'}`}>
              {podiumUsers[1].username}
            </h3>
            {podiumUsers[1].is_premium && (
              <span className="text-[8px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black uppercase tracking-wider mt-1 flex items-center gap-0.5 animate-pulse">
                <Crown size={8} className="fill-black" /> ELITE
              </span>
            )}
            <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">LEVEL {podiumUsers[1].level} AGENT</p>
            <div className="mt-4 text-xs font-mono font-black text-gray-300 px-3 py-1.5 bg-[#17171B] border border-white/5 rounded-full">{podiumUsers[1].xp} XP</div>
          </motion.div>

          {/* 1st Place (Center Podium) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="order-1 md:order-2 relative bg-[#121216] border-2 border-yellow-400 rounded-3xl p-8 flex flex-col items-center text-center shadow-[0_0_40px_rgba(234,179,8,0.5)] md:h-[320px] justify-center scale-105"
          >
            {/* Spotlight shimmer decoration background */}
            <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 via-transparent to-yellow-500/10 rounded-3xl pointer-events-none" />
            <div className="absolute top-4 left-4 font-mono text-yellow-500 text-sm font-black uppercase tracking-widest flex items-center gap-1">
              <Crown size={12} className="fill-yellow-500" /> Champions
            </div>
            
            <div className="relative w-24 h-24 rounded-full border-4 border-yellow-400 p-1 mb-3 shadow-[0_0_30px_rgba(234,179,8,0.6)] animate-pulse">
              <img src={podiumUsers[0].avatar_url} className="w-full h-full object-cover rounded-full bg-yellow-950" alt="Avatar" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-yellow-400 to-amber-500 text-black rounded-full flex items-center justify-center font-black text-xs shadow-lg border border-yellow-300">1ST</div>
            </div>

            <h3 className="text-xl font-black truncate max-w-full text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 [text-shadow:_0_0_15px_rgba(234,179,8,0.4)]">
              {podiumUsers[0].username}
            </h3>

            <div className="flex flex-col items-center gap-1 mt-1.5">
              <span className="text-[9px] bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 text-black px-2.5 py-0.5 rounded font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_15px_rgba(234,179,8,0.5)]">
                <Crown size={10} className="fill-black" /> CROWN ELITE
              </span>
              <span className="text-[7px] font-mono text-gray-400 uppercase tracking-widest">MONARCH TIER SYNCHRONIZED</span>
            </div>

            <p className="text-[11px] text-yellow-400 font-mono mt-1 uppercase font-black tracking-widest">LEVEL {podiumUsers[0].level} EXPERT</p>
            <div className="mt-4 text-xs font-mono font-black text-black px-5 py-1.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.3)]">{podiumUsers[0].xp.toLocaleString()} XP</div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="order-3 relative bg-[#0E0E10] border border-gray-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] md:h-[280px] justify-center"
          >
            <div className="absolute top-4 left-4 font-mono text-gray-500 text-sm font-black uppercase tracking-widest">#3</div>
            <div className="relative w-20 h-20 rounded-full border-2 border-amber-600 p-1 mb-3">
              <img src={podiumUsers[2].avatar_url} className="w-full h-full object-cover rounded-full bg-amber-950" alt="Avatar" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-600 text-black rounded-full flex items-center justify-center font-black text-[10px]">3RD</div>
            </div>
            <h3 className={`text-base font-black truncate max-w-full ${podiumUsers[2].is_premium ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 font-bold' : 'text-white'}`}>
              {podiumUsers[2].username}
            </h3>
            {podiumUsers[2].is_premium && (
              <span className="text-[8px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-black uppercase tracking-wider mt-1 flex items-center gap-0.5">
                <Crown size={8} className="fill-black" /> ELITE
              </span>
            )}
            <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">LEVEL {podiumUsers[2].level} AGENT</p>
            <div className="mt-4 text-xs font-mono font-black text-gray-300 px-3 py-1.5 bg-[#17171B] border border-white/5 rounded-full">{podiumUsers[2].xp} XP</div>
          </motion.div>
        </div>
      )}

      {/* Main Leaderboard Rankings List */}
      <div className="bg-[#0A0A0C] border border-[#16161A] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#222] flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-white">Vanguard Nodes ranking Index</h2>
          <span className="text-[10px] text-gray-500 font-mono uppercase font-semibold">Total Filtered: {filteredUsers.length}</span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Loading node databases...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-gray-500 text-sm italic font-sans">No matching agent indices found.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1D1D23] max-h-[800px] overflow-y-auto">
            {filteredUsers.map((userItem) => {
              const isSelf = userItem.id === currentUser?.uid;
              const isMonarch = userItem.premium_tier === 'monarch' || userItem.username === 'Ansh_Suresh_Singh';
              const isGod = userItem.premium_tier === 'god';
              const isPlus = userItem.premium_tier === 'plus';

              return (
                <div 
                  key={userItem.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-all duration-300 ${
                    isMonarch 
                      ? 'bg-yellow-500/5 hover:bg-yellow-500/10 border-l-4 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                      : isSelf 
                        ? 'bg-red-500/5 hover:bg-red-500/10 border-l-4 border-red-500' 
                        : 'hover:bg-[#111115]'
                  }`}
                >
                  {/* Left Column: rank + user profile */}
                  <div className="flex items-center gap-4">
                    {/* Rank Badge */}
                    <div className="w-8 h-8 flex items-center justify-center font-mono text-sm font-black shrink-0">
                      {userItem.rank === 1 ? (
                        <div className="text-yellow-400 text-xl font-bold animate-bounce">🥇</div>
                      ) : userItem.rank === 2 ? (
                        <div className="text-slate-400 text-xl font-bold">🥈</div>
                      ) : userItem.rank === 3 ? (
                        <div className="text-amber-600 text-xl font-bold">🥉</div>
                      ) : (
                        <span className="text-gray-500">#{userItem.rank}</span>
                      )}
                    </div>

                    {/* Avatar image with premium frame glow */}
                    <div className={`relative w-10 h-10 rounded shrink-0 overflow-hidden border ${
                      isMonarch 
                        ? 'border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.5)]' 
                        : isGod 
                          ? 'border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                          : userItem.is_premium 
                            ? 'border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.2)]' 
                            : 'border-[#1F1F1F]'
                    }`}>
                      <img src={userItem.avatar_url} className="w-full h-full object-cover" alt="User Avatar" />
                    </div>

                    {/* Username and premium Glow badge details */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-xs font-black tracking-tight ${
                          isMonarch 
                            ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-amber-500 font-extrabold shadow-sm drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]' 
                            : isGod 
                              ? 'text-amber-400 font-black'
                              : userItem.is_premium 
                                ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 font-black' 
                                : 'text-white'
                        }`}>
                          {userItem.username}
                        </span>

                        {isSelf && (
                          <span className="text-[8px] border border-red-500/30 text-[#FF0000] px-1 rounded-sm uppercase font-black tracking-widest font-mono">
                            YOU
                          </span>
                        )}

                        {isMonarch && (
                          <span className="text-[7px] bg-gradient-to-r from-yellow-500 to-amber-500 text-black px-1.5 py-0.5 rounded-sm font-black uppercase tracking-wider flex items-center gap-0.5 shadow-[0_0_8px_rgba(234,179,8,0.4)] animate-pulse" title="Crown Elite Monarch subscription active">
                            <Crown size={6} className="fill-black" /> CROWN ELITE
                          </span>
                        )}

                        {isGod && (
                          <span className="text-[7px] bg-amber-600 text-white px-1.5 py-0.5 rounded-sm font-black uppercase tracking-wider flex items-center gap-0.5" title="God Pass active">
                            <Zap size={6} className="text-white fill-white" /> GOD ELITE
                          </span>
                        )}

                        {isPlus && (
                          <span className="text-[7px] bg-white/10 text-white px-1.5 py-0.5 rounded-sm font-black uppercase tracking-wider flex items-center gap-0.5" title="Plus Pass active">
                            <Sparkles size={6} className="text-yellow-400" /> PLUS
                          </span>
                        )}
                      </div>
                      
                      {/* Secondary information info bar */}
                      <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                        ROLE: {userItem.role.replace('_', ' ')} • CLASS: NIV {userItem.level} • LOC: {userItem.country}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: scores details */}
                  <div className="flex items-center gap-4 sm:text-right pl-12 sm:pl-0">
                    <div className="font-mono text-right shrink-0">
                      <p className="text-xs font-black text-white">{userItem.xp} <span className="text-[9px] text-gray-400 uppercase tracking-widest font-normal">XP</span></p>
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest mt-0.5">LEVEL {userItem.level}</p>
                    </div>

                    {/* XP Progress Bar indicator showing portion to next level */}
                    <div className="w-24 bg-white/5 h-1 rounded overflow-hidden hidden md:block">
                      <div 
                        className={`h-full ${userItem.is_premium ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${userItem.xp % 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bonus checklist card */}
      <div className="bg-[#0D0D10] border border-yellow-500/10 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-yellow-500/10 text-yellow-500 flex items-center justify-center shrink-0">
            <Sparkles size={20} className="animate-spin duration-1000" />
          </div>
          <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest">Master of Rankings checklist</h4>
            <p className="text-[10px] text-gray-400 mt-0.5">Rank up directly into our community leagues. Every action you perform yields points towards your prestige index.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
          <button 
            onClick={triggerUpgradeModal}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black text-xs font-black uppercase tracking-widest rounded-lg transition-all"
          >
            Activate Otaku Pass Boosters
          </button>
        </div>
      </div>
    </div>
  );
}
