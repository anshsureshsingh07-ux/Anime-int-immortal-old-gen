import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Crown, Sparkles, Filter, Search, Zap, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { VerifiedBadge } from '../components/VerifiedBadge';
import Sparkline from '../components/Sparkline';
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
  const [pingFactionName, setPingFactionName] = useState<string | null>(null);

  // Helper to map articleId to a faction deterministically
  const getFactionNameForArticle = (articleIdStr: string): string => {
    const num = Array.from(articleIdStr).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = num % 4;
    const factions = [
      'akatsuki network',
      'house stark',
      'holy britannian empire',
      'house lannister'
    ];
    return factions[index];
  };

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
        const { data: allLikes } = await supabase.from('article_likes').select('article_id');

        const factionLikesMap: Record<string, number> = {
          'akatsuki network': 0,
          'house stark': 0,
          'holy britannian empire': 0,
          'house lannister': 0
        };

        if (allLikes) {
          allLikes.forEach(like => {
            const fName = getFactionNameForArticle(String(like.article_id));
            if (factionLikesMap[fName] !== undefined) {
              factionLikesMap[fName]++;
            }
          });
        }

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

        const factionsEnriched = defaultFactions.map(f => {
          const lKey = f.name.toLowerCase();
          const likesCount = factionLikesMap[lKey] || 0;
          // Every article like increases overall faction power by 250 XP
          const totalPower = f.xp + (likesCount * 250);
          return {
            ...f,
            likes: likesCount,
            boostedXP: totalPower
          };
        });

        factionsEnriched.sort((a, b) => b.boostedXP - a.boostedXP);

        setFactionStandings(prev => {
          if (prev && prev.length > 0) {
            factionsEnriched.forEach(newF => {
              const oldF = prev.find(o => o.name === newF.name);
              if (oldF && newF.likes > (oldF.likes || 0)) {
                // Ping/particle effect when faction gains points through article likes!
                setPingFactionName(newF.name);
                setTimeout(() => setPingFactionName(null), 2500);
              }
            });
          }
          return factionsEnriched;
        });
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

    // Live subscription to article likes updates for instantaneous faction standings refresh
    const likesSubscription = supabase
      .channel('realtime_faction_likes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'article_likes'
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    // Listen for database profile changes to hot-reload scores!
    const handleProfileUpdate = () => {
      loadData();
    };
    window.addEventListener('profiles-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profiles-updated', handleProfileUpdate);
      supabase.removeChannel(likesSubscription);
    };
  }, []);

  const handleDailyCheckIn = async () => {
    if (!currentUser || checkedInToday || checkInLoading) return;
    setCheckInLoading(true);

    try {
      const baseXP = 50;
      const finalXP = baseXP;

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
                <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Network Speed</p>
                <p className="text-lg font-black text-emerald-400">OPTIMAL</p>
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

          {/* Enable 2x multipliers removed */}
        </div>
      </div>

      {/* Filters & Core Interface Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0A0A0C] border border-[#16161A] p-4 rounded-2xl">
        {/* Filters */}
        <div className="flex items-center gap-2 scale-95 sm:scale-100">
          <button 
            type="button"
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
            type="button"
            onClick={() => setFilterType('premium')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
              filterType === 'premium' 
                ? 'bg-[#150a1c] text-white border-b-2 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]' 
                : 'text-gray-500 hover:text-white hover:bg-[#111]'
            }`}
          >
            <Trophy size={11} className="text-purple-400" /> War Room Dominance
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
              <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mt-1">
                Real-time territory capture. Each article like belonging to a faction adds +250 points (+1% dominance boost).
              </p>
            </div>

            <div className="bg-purple-950/20 border border-purple-500/20 px-4 py-2 rounded-xl flex items-center gap-3 self-start md:self-auto">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest font-black">
                REAL-TIME EMPIRE METRICS
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Side: Real SVG Geospatial Map Representation */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-[#040206] border border-purple-500/10 rounded-3xl relative overflow-hidden min-h-[350px]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(168,85,247,0.01),rgba(0,0,0,0.1),rgba(168,85,247,0.01))] bg-[size:100%_4px,3px_100%] opacity-20 pointer-events-none" />
              <div className="absolute top-2 left-4 text-[7px] font-mono text-zinc-500 tracking-[0.2em] uppercase select-none pointer-events-none">
                GEOSPATIAL FACTION MAP // SUBSECTION GRID_4
              </div>

              <div className="relative w-72 h-72 flex items-center justify-center">
                {/* SVG radar overlay rings */}
                <div className="absolute w-full h-full rounded-full border border-purple-500/5 pointer-events-none animate-pulse" />
                <div className="absolute w-[80%] h-[80%] rounded-full border border-purple-500/10 pointer-events-none" />
                <div className="absolute w-[60%] h-[60%] rounded-full border border-purple-500/15 pointer-events-none" />
                <div className="absolute w-[40%] h-[40%] rounded-full border border-purple-500/20 pointer-events-none" />
                
                {/* Living radar sweep */}
                <div className="absolute w-[90%] h-[90%] rounded-full bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 animate-spin pointer-events-none" style={{ animationDuration: '6s' }} />

                <svg viewBox="0 0 200 200" className="w-full h-full z-10 filter drop-shadow-[0_0_15px_rgba(0,0,0,0.95)]">
                  <defs>
                    <radialGradient id="akatsuki-glow" cx="30%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#E50914" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#E50914" stopOpacity="0.05" />
                    </radialGradient>
                    <radialGradient id="stark-glow" cx="70%" cy="30%" r="70%">
                      <stop offset="0%" stopColor="#00BFFF" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#00BFFF" stopOpacity="0.05" />
                    </radialGradient>
                    <radialGradient id="britannian-glow" cx="30%" cy="70%" r="70%">
                      <stop offset="0%" stopColor="#A855F7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#A855F7" stopOpacity="0.05" />
                    </radialGradient>
                    <radialGradient id="lannister-glow" cx="70%" cy="70%" r="70%">
                      <stop offset="0%" stopColor="#FF9900" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#FF9900" stopOpacity="0.05" />
                    </radialGradient>
                  </defs>

                  {/* Top-Left Quadrant: Akatsuki Network */}
                  <motion.path 
                    d="M 100 100 L 25 25 A 110 110 0 0 1 100 10 Z" 
                    fill="url(#akatsuki-glow)"
                    stroke="#E50914"
                    strokeWidth="1.5"
                    strokeOpacity={pingFactionName?.toLowerCase() === 'akatsuki network' ? "0.9" : "0.4"}
                    animate={{ scale: pingFactionName?.toLowerCase() === 'akatsuki network' ? [1, 1.06, 1] : 1 }}
                    transition={{ duration: 0.6 }}
                    className="cursor-pointer hover:fill-red-500/25 transition-all duration-300"
                  />
                  
                  {/* Top-Right Quadrant: House Stark */}
                  <motion.path 
                    d="M 100 100 L 100 10 A 110 110 0 0 1 175 25 Z" 
                    fill="url(#stark-glow)"
                    stroke="#00BFFF"
                    strokeWidth="1.5"
                    strokeOpacity={pingFactionName?.toLowerCase() === 'house stark' ? "0.9" : "0.4"}
                    animate={{ scale: pingFactionName?.toLowerCase() === 'house stark' ? [1, 1.06, 1] : 1 }}
                    transition={{ duration: 0.6 }}
                    className="cursor-pointer hover:fill-blue-400/25 transition-all duration-300"
                  />

                  {/* Bottom-Left Quadrant: Holy Britannian Empire */}
                  <motion.path 
                    d="M 100 100 L 25 175 A 110 110 0 0 0 100 190 Z" 
                    fill="url(#britannian-glow)"
                    stroke="#A855F7"
                    strokeWidth="1.5"
                    strokeOpacity={pingFactionName?.toLowerCase() === 'holy britannian empire' ? "0.9" : "0.4"}
                    animate={{ scale: pingFactionName?.toLowerCase() === 'holy britannian empire' ? [1, 1.06, 1] : 1 }}
                    transition={{ duration: 0.6 }}
                    className="cursor-pointer hover:fill-purple-500/25 transition-all duration-300"
                  />

                  {/* Bottom-Right Quadrant: House Lannister */}
                  <motion.path 
                    d="M 100 100 L 100 190 A 110 110 0 0 0 175 175 Z" 
                    fill="url(#lannister-glow)"
                    stroke="#FF9900"
                    strokeWidth="1.5"
                    strokeOpacity={pingFactionName?.toLowerCase() === 'house lannister' ? "0.9" : "0.4"}
                    animate={{ scale: pingFactionName?.toLowerCase() === 'house lannister' ? [1, 1.06, 1] : 1 }}
                    transition={{ duration: 0.6 }}
                    className="cursor-pointer hover:fill-amber-500/25 transition-all duration-300"
                  />

                  {/* Center Core HUD Node */}
                  <circle cx="100" cy="100" r="14" fill="#0C0612" stroke="#A855F7" strokeWidth="1.5" />
                  <circle cx="100" cy="100" r="10" fill="#020005" />
                  <circle cx="100" cy="100" r="4" fill="#E50914" className="animate-pulse" />

                  {/* Quadrant Text Identifiers */}
                  <text x="55" y="40" fill="#E50914" fontSize="5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">SEC_01 // AKATSUKI</text>
                  <text x="145" y="40" fill="#00BFFF" fontSize="5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">SEC_02 // STARK</text>
                  <text x="55" y="165" fill="#A855F7" fontSize="5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">SEC_03 // BRITANNIAN</text>
                  <text x="145" y="165" fill="#FF9900" fontSize="5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">SEC_04 // LANNISTER</text>
                </svg>

                {/* Concentric live tags displays */}
                <div className="absolute top-[38%] left-[20%] text-[8px] font-mono text-zinc-400 font-bold bg-black/85 px-1.5 py-0.5 rounded border border-[#E50914]/30">
                  {factionStandings.find(f => f.name.toLowerCase() === 'akatsuki network')?.likes || 0} Lks
                </div>
                <div className="absolute top-[38%] right-[20%] text-[8px] font-mono text-zinc-400 font-bold bg-black/85 px-1.5 py-0.5 rounded border border-[#00BFFF]/30">
                  {factionStandings.find(f => f.name.toLowerCase() === 'house stark')?.likes || 0} Lks
                </div>
                <div className="absolute bottom-[38%] left-[20%] text-[8px] font-mono text-zinc-400 font-bold bg-black/85 px-1.5 py-0.5 rounded border border-[#a855f7]/30">
                  {factionStandings.find(f => f.name.toLowerCase() === 'holy britannian empire')?.likes || 0} Lks
                </div>
                <div className="absolute bottom-[38%] right-[20%] text-[8px] font-mono text-zinc-400 font-bold bg-black/85 px-1.5 py-0.5 rounded border border-[#FF9900]/30">
                  {factionStandings.find(f => f.name.toLowerCase() === 'house lannister')?.likes || 0} Lks
                </div>
              </div>
            </div>

            {/* Right Side: Detailed Faction Gauges & Dominance Bars */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {(() => {
                const maxPower = Math.max(...factionStandings.map(f => f.boostedXP), 1) || 1000;
                const totalPowerSum = factionStandings.reduce((sum, f) => sum + f.boostedXP, 0) || 1;
                
                return factionStandings.map((stand, idx) => {
                  const hasPingActive = pingFactionName?.toLowerCase() === stand.name.toLowerCase();
                  const widthPercentage = Math.min(100, Math.round((stand.boostedXP / maxPower) * 100));
                  const totalContributionPct = Math.min(100, Math.round((stand.boostedXP / totalPowerSum) * 100));
                  
                  // Set color scheme for live sparkline
                  let sparklineColor = '#E50914';
                  if (stand.name.toLowerCase().includes('stark')) sparklineColor = '#00BFFF';
                  if (stand.name.toLowerCase().includes('britannian')) sparklineColor = '#A855F7';
                  if (stand.name.toLowerCase().includes('lannister')) sparklineColor = '#FF9900';

                  return (
                    <div 
                      key={stand.name} 
                      className={`plexiglass p-5 rounded-2xl relative border transition-all duration-300 overflow-hidden ${
                        hasPingActive 
                          ? 'border-purple-500 bg-purple-950/20 shadow-[0_0_25px_rgba(168,85,247,0.35)] scale-[1.01]' 
                          : 'border-white/5 bg-black/50 hover:border-white/10'
                      }`}
                    >
                      {/* Radiating Ping indicator */}
                      {hasPingActive && (
                        <div className="absolute inset-0 pointer-events-none border-2 border-purple-500 rounded-2xl animate-ping opacity-75" style={{ animationDuration: '1.8s' }} />
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-black/60 border flex items-center justify-center text-xl shadow-inner relative ${
                            hasPingActive ? 'border-purple-500 animate-pulse' : 'border-white/10'
                          }`}>
                            {stand.emoji}
                            {hasPingActive && (
                              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500" />
                              </span>
                            )}
                          </div>
                          <div>
                            <h3 className="text-sm font-sans font-black text-white uppercase tracking-tight flex items-center gap-2">
                              {stand.name}
                              {idx === 0 && (
                                <span className="text-[7px] bg-crimson text-white px-2 py-0.5 rounded font-black tracking-widest uppercase animate-pulse shadow-[0_0_10px_rgba(229,9,20,0.55)] font-mono">
                                  SUPREME
                                </span>
                              )}
                            </h3>
                            <div className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
                              Aligned terminals: <span className="text-white font-bold">{stand.count} Active co-processors</span>
                            </div>
                          </div>
                        </div>

                        {/* Sparkline and data stream percentage stacked layout */}
                        <div className="flex items-center gap-3 justify-between sm:justify-end">
                          <div className="opacity-80 hover:opacity-100 transition-opacity">
                            <Sparkline color={sparklineColor} width={80} height={24} />
                          </div>
                          
                          <div className="text-right flex flex-col items-end">
                            <span className="text-xs font-mono font-black border border-white/10 px-2 py-0.5 bg-black/45 rounded shadow-sm" style={{ color: sparklineColor }}>
                              {stand.boostedXP.toLocaleString()} POWER
                            </span>
                            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                              {totalContributionPct}% GLOBAL CAP (+{stand.likes} likes)
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Power grid linear/radial composite gauge */}
                      <div className="w-full h-3 bg-black/60 border border-white/5 rounded-full overflow-hidden p-[2px] relative z-10">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${widthPercentage}%` }}
                          transition={{ duration: 1.5, ease: 'easeOut' }}
                          className="h-full rounded-full shadow-[0_0_12px_rgba(255,255,255,0.15)]"
                          style={{
                            background: `linear-gradient(90deg, ${sparklineColor}dd, ${sparklineColor}33)`
                          }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {filterType === 'all' && (
        <>
          {/* Podium Render Section (Top 3 Users) */}
          {!loading && filteredUsers.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-10 px-2 sm:px-6">
          {/* 2nd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="order-2 md:order-1 relative neural-glass border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center hover-pulse md:h-[280px] justify-center shadow-lg"
          >
            <div className="absolute top-4 left-4 font-mono text-zinc-500 text-xs font-black uppercase tracking-widest">#2 RANK</div>
            <div className="relative w-22 h-22 rounded-full border-2 border-slate-400 p-1 mb-3">
              <img src={podiumUsers[1].avatar_url} className="w-full h-full object-cover rounded-full bg-slate-950" alt="Avatar" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-400 text-black rounded-full flex items-center justify-center font-black text-[10px] shadow">2ND</div>
            </div>
            <h3 className="text-base font-black truncate max-w-full text-white flex items-center justify-center gap-1.5">
              <span>{podiumUsers[1].username}</span>
              <VerifiedBadge isVerified={podiumUsers[1].is_verified} size={10} />
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono mt-1 uppercase">LEVEL {podiumUsers[1].level} EXPERT</p>
            <div className="mt-4 text-xs font-mono font-black text-slate-300 px-4 py-1.5 bg-black/45 border border-white/5 rounded-full">{podiumUsers[1].xp} XP</div>
          </motion.div>

          {/* 1st Place (Center Podium) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="order-1 md:order-2 relative neural-glass border-2 border-amber-400/80 rounded-3xl p-8 flex flex-col items-center text-center hover-pulse md:h-[320px] justify-center scale-105 shadow-2xl"
          >
            {/* Spotlight shimmer decoration background */}
            <div className="absolute inset-0 bg-gradient-to-t from-amber-500/5 via-transparent to-amber-500/10 rounded-3xl pointer-events-none" />
            <div className="absolute top-4 left-4 font-mono text-amber-500 text-xs font-black uppercase tracking-widest flex items-center gap-1">
              <Crown size={12} className="fill-amber-500" /> TOP NODE CHIEF
            </div>
            
            <div className="relative w-26 h-26 rounded-full border-4 border-amber-400 p-1 mb-3 shadow-[0_0_30px_rgba(245,158,11,0.45)] animate-pulse">
               <img src={podiumUsers[0].avatar_url} className="w-full h-full object-cover rounded-full bg-amber-950/20" alt="Avatar" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full flex items-center justify-center font-black text-xs shadow-lg border border-yellow-300">1ST</div>
            </div>

            <h3 className="text-xl font-black truncate max-w-full text-white flex items-center justify-center gap-1.5 text-center">
              <span>{podiumUsers[0].username}</span>
              <VerifiedBadge isVerified={podiumUsers[0].is_verified} size={12} />
            </h3>

            <div className="flex flex-col items-center gap-1 mt-1.5">
               <span className="text-[9px] bg-crimson/10 text-crimson border border-crimson/25 px-2.5 py-0.5 rounded font-mono font-black uppercase tracking-widest flex items-center gap-1">
                TOP VANGUARD
              </span>
            </div>

            <p className="text-[11px] text-amber-400 font-mono mt-2 uppercase font-black tracking-widest">LEVEL {podiumUsers[0].level} LEGEND</p>
            <div className="mt-4 text-xs font-mono font-black text-black px-5 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)]">{podiumUsers[0].xp.toLocaleString()} XP</div>
          </motion.div>

          {/* 3rd Place */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="order-3 relative neural-glass border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center hover-pulse md:h-[280px] justify-center shadow-lg"
          >
            <div className="absolute top-4 left-4 font-mono text-zinc-500 text-xs font-black uppercase tracking-widest">#3 RANK</div>
            <div className="relative w-22 h-22 rounded-full border-2 border-amber-700 p-1 mb-3">
              <img src={podiumUsers[2].avatar_url} className="w-full h-full object-cover rounded-full bg-amber-950/20" alt="Avatar" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-700 text-black rounded-full flex items-center justify-center font-black text-[10px] shadow">3RD</div>
            </div>
            <h3 className="text-base font-black truncate max-w-full text-white flex items-center justify-center gap-1.5">
              <span>{podiumUsers[2].username}</span>
              <VerifiedBadge isVerified={podiumUsers[2].is_verified} size={10} />
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono mt-1 uppercase">LEVEL {podiumUsers[2].level} EXPERT</p>
            <div className="mt-4 text-xs font-mono font-black text-zinc-300 px-4 py-1.5 bg-black/45 border border-white/5 rounded-full">{podiumUsers[2].xp} XP</div>
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
              const isMonarch = false;
              const isGod = false;
              const isPlus = false;

              return (
                <div 
                  key={userItem.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 transition-all duration-300 ${
                    isSelf 
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

                    {/* Avatar image with frame styling */}
                    <div className="relative w-10 h-10 rounded shrink-0 overflow-hidden border border-[#1F1F1F]">
                      <img src={userItem.avatar_url} className="w-full h-full object-cover" alt="User Avatar" />
                    </div>

                    {/* Username and details */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                          <span>{userItem.username}</span>
                          <VerifiedBadge isVerified={userItem.is_verified} size={8} />
                        </span>

                        {isSelf && (
                          <span className="text-[8px] border border-red-500/30 text-[#FF0000] px-1 rounded-sm uppercase font-black tracking-widest font-mono">
                            YOU
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
                        className="h-full bg-red-500"
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
        </>
      )}

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
