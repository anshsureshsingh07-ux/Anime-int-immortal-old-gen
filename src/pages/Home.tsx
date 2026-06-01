import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Flame, TrendingUp, Calendar, Play, ChevronRight, MessageSquare, Heart, ShieldAlert, Sparkles, Network } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { FALLBACK_AIRING } from '../lib/jikanFallback';
import { useNews } from '../App';
import AnnouncementsBanner from '../components/AnnouncementsBanner';
import LikeButton from '../components/LikeButton';
import CommentSection from '../components/CommentSection';
import Sparkline from '../components/Sparkline';
import { useThemeEngine } from '../context/ThemeEngineContext';
import { playDigitalSound } from '../lib/sounds';

// Text scrambling algorithm for local cyber intrusion visual effects
function scrambleText(text: string): string {
  const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/0123456789';
  return text
    .split('')
    .map(char => {
      if (char === ' ') return ' ';
      return chars[Math.floor(Math.random() * chars.length)];
    })
    .join('');
}

// Scrambler component for refreshing ticks during glitch periods
function Scrambler({ text, active }: { text: string; active: boolean }) {
  const [displayedText, setDisplayedText] = useState(text);

  useEffect(() => {
    if (!active) {
      setDisplayedText(text);
      return;
    }

    const interval = setInterval(() => {
      setDisplayedText(scrambleText(text));
    }, 100);

    return () => clearInterval(interval);
  }, [text, active]);

  return <>{displayedText}</>;
}

// Relevance Match and Summary Data Enrichment Builder
function enrichNewsArticles(rawArticles: any[]) {
  if (!rawArticles) return [];
  
  const summaries = [
    "Quantum encryption matrices successfully deployed across the Crimson Network nodes.",
    "Rival faction hackers detected routing proxy tunnels through deep-level databases.",
    "Consensus terminal logs report a 12% rise in decentralization voting parameters.",
    "Airing stream decryptors online, boosting regional bandwidth allocation rates by 22%.",
    "Elite Vanguard squad logs indicate imminent server-side territory updates near sector 9."
  ];

  const clusters = [
    ["Akatsuki Strategy", "Cloud Network Docs"],
    ["Britannian Tactics", "Imperial Geo-Sync"],
    ["Stark Thermal Shielding", "Tundra Grid Map"],
    ["Lannister Gold Accounts", "House Treasury Ledger"],
    ["Uzumaki Sage Mode", "Node Core Resonance"]
  ];

  return rawArticles.map((article, index) => {
    const seedId = Number(article.id) || index;
    const relevanceMatch = 65 + (seedId % 31);
    const summaryIndex = seedId % summaries.length;
    const clusterIndex = seedId % clusters.length;

    return {
      ...article,
      relevanceMatch,
      mainframeSummary: summaries[summaryIndex],
      dataClusters: clusters[clusterIndex]
    };
  }).sort((a, b) => b.relevanceMatch - a.relevanceMatch);
}

export default function Home() {
  const [news, setNews] = useState<any[]>([]);
  const [featuredAnime, setFeaturedAnime] = useState<any[]>([]);
  const { incrementEngagement } = useThemeEngine();

  // Data Integrity Glitch Trigger States
  const [scrambledId, setScrambledId] = useState<any>(null);
  const [restoredId, setRestoredId] = useState<any>(null);

  // Trigger temporary cognitive hack
  const triggerCognitiveHack = (forceId?: any) => {
    if (news.length === 0) return;
    
    const targetArticle = forceId !== undefined 
      ? news.find(n => n.id === forceId) 
      : news[Math.floor(Math.random() * news.length)];
      
    if (!targetArticle) return;

    setScrambledId(targetArticle.id);
    playDigitalSound('click');

    setTimeout(() => {
      setScrambledId(null);
      setRestoredId(targetArticle.id);
      playDigitalSound('ping');

      setTimeout(() => {
        setRestoredId(null);
      }, 3000);
    }, 1800);
  };

  // Run automatically every 90 seconds (with manual test override)
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        triggerCognitiveHack();
      }
    }, 90000);

    return () => clearInterval(glitchInterval);
  }, [news]);
  const [activePoll, setActivePoll] = useState<any>(null);
  const [pollVotes, setPollVotes] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // New robust states for the dynamic features
  const { breakingNews, setBreakingNews } = useNews();
  const [isEditingBreaking, setIsEditingBreaking] = useState(false);
  const [tempBreakingText, setTempBreakingText] = useState('');

  const [communityPoll, setCommunityPoll] = useState<any>({
    id: 1,
    question: "Should the Nexus terminal undergo full decentralization?",
    option_a: "EXECUTE DECENTRALIZATION",
    option_b: "MAINTAIN CENTRAL CORES",
    votes_a: 104,
    votes_b: 42
  });
  const [votedOption, setVotedOption] = useState<string | null>(null);
  const [showPollEdit, setShowPollEdit] = useState(false);
  const [pollEditForm, setPollEditForm] = useState({ question: '', option_a: '', option_b: '' });

  // Neural Feed log ticker state & automated generation hook
  const [systemLogs, setSystemLogs] = useState<any[]>([
    { id: 1, text: 'NODE_SYNC_COMPLETE', source: 'SEC-NODE-A4', timestamp: '05:58:47' },
    { id: 2, text: 'FACTION_WAR_STATUS: ACTIVE', source: 'CORE-WAR-UNIT', timestamp: '05:59:12' },
    { id: 3, text: 'DB_LATENCY: 12MS', source: 'SUPABASE-PING-0', timestamp: '05:59:30' },
    { id: 4, text: 'EMISSIVE_RAYTRACING: SOLVED', source: 'RASTER-G2', timestamp: '06:00:15' },
    { id: 5, text: 'MALWARE_INTRUSION: BLOCK_SHIELD_ACTIVE', source: 'SECURE-GATE-9', timestamp: '06:01:03' }
  ]);

  useEffect(() => {
    const logTemplates = [
      { text: 'NODE_SYNC_COMPLETE', source: 'SEC-NODE-A4' },
      { text: 'FACTION_WAR_STATUS: ACTIVE', source: 'CORE-WAR-UNIT' },
      { text: 'DB_LATENCY: 12MS', source: 'SUPABASE-PING-0' },
      { text: 'EMISSIVE_RAYTRACING: SOLVED', source: 'RASTER-G2' },
      { text: 'MALWARE_INTRUSION: BLOCK_SHIELD_ACTIVE', source: 'SECURE-GATE-9' },
      { text: 'CRIMSON_REVOLUTION: ONLINE_LOAD', source: 'ANIME-INT-HUB' },
      { text: 'TERRITORY_SURVEILLANCE: SYNCED', source: 'WAR-ROOM-MATRIX' },
      { text: 'MEM_POOL_FLUSH: 0.04s', source: 'C-MEM-CACHE' },
      { text: 'SYS_INTEGRITY: 99.8% SECURE', source: 'MAINFRAME-SYS' },
      { text: 'ANIME_STREAM_DECRYPTOR: ACTIVE', source: 'NEWS-CO-PROC' },
      { text: 'CHRONO_TAPE: TICK_UTC', source: 'CLOCK-UNIT' },
      { text: 'VANGUARD_XP_AWARDED_BOUNTY', source: 'LEADERBOARD-DB' }
    ];

    const logGeneratorInterval = setInterval(() => {
      const template = logTemplates[Math.floor(Math.random() * logTemplates.length)];
      const date = new Date();
      const timestampString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      
      const newLog = {
        id: Date.now(),
        text: template.text,
        source: template.source,
        timestamp: timestampString
      };

      setSystemLogs(prev => {
        const updated = [...prev, newLog];
        if (updated.length > 15) {
          updated.shift();
        }
        return updated;
      });
    }, 4500);

    return () => clearInterval(logGeneratorInterval);
  }, []);

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const isCurrentUserAdmin = currentUserEmail === 'anshsureshsingh07@gmail.com';

  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

  const toggleComments = (id: string | number) => {
    playDigitalSound('click');
    incrementEngagement(1);
    const strId = String(id);
    setOpenComments(p => ({
      ...p,
      [strId]: !p[strId]
    }));
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserEmail(user ? user.email : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Load local stored vote for the community poll
    const savedVote = localStorage.getItem('voted_community_poll_1');
    if (savedVote) {
      setVotedOption(savedVote);
    }

    const fetchData = async () => {
      // News
      let newsQuery;
      try {
        newsQuery = await supabase
          .from('news')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });
        
        if (newsQuery.error) {
          console.warn('News query with is_pinned ordering failed, retrying with basic order:', newsQuery.error.message);
          newsQuery = await supabase
            .from('news')
            .select('*')
            .order('created_at', { ascending: false });
        }
      } catch (err: any) {
        console.warn('News query exception, trying standard fallback:', err?.message);
        newsQuery = await supabase
          .from('news')
          .select('*')
          .order('created_at', { ascending: false });
      }
      const newsData = newsQuery?.data || null;
      
      // Polls (Legacy poll)
      const { data: pollData } = await supabase
        .from('polls')
        .select('*, poll_options(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Dynamic Feature 1: Get Breaking News (id: 1)
      try {
        const { data: bnData, error: bnErr } = await supabase
          .from('breaking_news')
          .select('*')
          .eq('id', 1)
          .single();

        if (bnData) {
          if (isMounted) setBreakingNews(bnData);
        } else if (bnErr && bnErr.code === 'PGRST116') {
          // Record doesn't exist, try initializing it
          const defaultBN = { id: 1, text: "Vanguard Ops: Archives System Expansion Initialized" };
          const { data: insertedBN } = await supabase.from('breaking_news').insert([defaultBN]).select().single();
          if (insertedBN && isMounted) setBreakingNews(insertedBN);
        }
      } catch (err) {
        console.warn('Unable to query breaking_news:', err);
      }

      // Dynamic Feature 3: Get Community Poll (id: 1)
      try {
        const { data: cpData, error: cpErr } = await supabase
          .from('community_poll')
          .select('*')
          .eq('id', 1)
          .single();

        if (cpData) {
          if (isMounted) setCommunityPoll(cpData);
        } else if (cpErr && cpErr.code === 'PGRST116') {
          // Record doesn't exist, initialize it
          const defaultPoll = {
            id: 1,
            question: "Should the Nexus terminal undergo full decentralization?",
            option_a: "EXECUTE DECENTRALIZATION",
            option_b: "MAINTAIN CENTRAL CORES",
            votes_a: 104,
            votes_b: 42
          };
          const { data: insertedCP } = await supabase.from('community_poll').insert([defaultPoll]).select().single();
          if (insertedCP && isMounted) setCommunityPoll(insertedCP);
        }
      } catch (err) {
        console.warn('Unable to query community_poll:', err);
      }
      
      if (isMounted) {
        if (newsData) setNews(enrichNewsArticles(newsData));
        if (pollData) {
          setActivePoll(pollData);
          fetchPollVotes(pollData.id);
        }
      }
    };

    fetchData();

    // Fetch Jikan with retry logic
    const fetchJikan = async (retries = 3) => {
      try {
        const res = await fetch('https://api.jikan.moe/v4/top/anime?limit=10&filter=airing');
        if (!res.ok) {
          if (res.status === 429 && retries > 0) {
            // Rate limited, wait and retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchJikan(retries - 1);
          }
          throw new Error(`Jikan error: ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          setFeaturedAnime(data.data || FALLBACK_AIRING);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Jikan fetch failed, loaded high-fidelity offline backup:', err);
        if (isMounted) {
          setFeaturedAnime(FALLBACK_AIRING);
          setLoading(false);
        }
      }
    };

    fetchJikan();

    return () => { isMounted = false; };
  }, []);

  const handleSaveBreaking = async () => {
    const value = tempBreakingText.trim();
    if (!value) return;

    try {
      const payload = {
        id: 1,
        text: value,
        title: value,
        content: value
      };
      
      const { error } = await supabase.from('breaking_news').upsert([payload]);
      if (error) {
        // Fallback update in case of column schema mismatch or triggers
        await supabase.from('breaking_news').update({ text: value }).eq('id', 1);
      }
      setBreakingNews({ ...breakingNews, text: value });
      setIsEditingBreaking(false);
    } catch (err) {
      console.error('Error saving breaking_news:', err);
      // Fallback local state update
      setBreakingNews({ ...breakingNews, text: value });
      setIsEditingBreaking(false);
    }
  };

  const handleCommunityVote = async (option: 'A' | 'B') => {
    if (localStorage.getItem('vanguard_guest_session') === 'true') {
      alert('WRITE ACTIONS RESERVED FOR AUTHENTICATED CHANNELS. GUEST_NODE ACCESS IS READ-ONLY.');
      return;
    }
    if (votedOption || !communityPoll) return;
    playDigitalSound('click');
    incrementEngagement(3);

    localStorage.setItem('voted_community_poll_1', option);
    setVotedOption(option);

    try {
      // Load latest values to prevent dirty writes or collisions
      const { data: latest } = await supabase.from('community_poll').select('*').eq('id', 1).single();
      const votesA = latest ? (latest.votes_a || 0) : (communityPoll.votes_a || 0);
      const votesB = latest ? (latest.votes_b || 0) : (communityPoll.votes_b || 0);

      const updatePayload = option === 'A' 
        ? { votes_a: votesA + 1 }
        : { votes_b: votesB + 1 };

      const { data } = await supabase
        .from('community_poll')
        .update(updatePayload)
        .eq('id', 1)
        .select()
        .single();

      if (data) {
        setCommunityPoll(data);
      } else {
        setCommunityPoll({
          ...communityPoll,
          votes_a: option === 'A' ? votesA + 1 : votesA,
          votes_b: option === 'B' ? votesB + 1 : votesB,
        });
      }
    } catch (err) {
      console.error('Error recording community vote:', err);
      // fallback in-memory
      setCommunityPoll({
        ...communityPoll,
        votes_a: option === 'A' ? (communityPoll.votes_a || 0) + 1 : (communityPoll.votes_a || 0),
        votes_b: option === 'B' ? (communityPoll.votes_b || 0) + 1 : (communityPoll.votes_b || 0),
      });
    }
  };

  const getCommunityPollPercentage = (option: 'A' | 'B') => {
    if (!communityPoll) return 50;
    const votesA = communityPoll.votes_a || 0;
    const votesB = communityPoll.votes_b || 0;
    const total = votesA + votesB;
    if (total === 0) return 50;
    return Math.round((option === 'A' ? votesA : votesB) / total * 100);
  };

  const fetchPollVotes = async (pollId: string) => {
    const { data: votes } = await supabase.from('poll_votes').select('*').eq('poll_id', pollId);
    if (votes) setPollVotes(votes);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const myVote = votes?.find(v => v.user_id === session.user.id);
      if (myVote) setUserVote(myVote.option_id);
    }
  };

  const handleVote = async (optionId: string) => {
    if (localStorage.getItem('vanguard_guest_session') === 'true') {
      alert('WRITE ACTIONS RESERVED FOR AUTHENTICATED CHANNELS. GUEST_NODE ACCESS IS READ-ONLY.');
      return;
    }
    if (userVote !== null || !activePoll) return;
    playDigitalSound('click');
    incrementEngagement(3);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return alert('Please login to vote.');

    const { error } = await supabase.from('poll_votes').insert([
      { poll_id: activePoll.id, user_id: session.user.id, option_id: optionId }
    ]);

    if (!error) {
      setUserVote(optionId as any);
      fetchPollVotes(activePoll.id);
    }
  };

  const getVotePercent = (optionId: string) => {
    if (pollVotes.length === 0) return 0;
    const count = pollVotes.filter(v => v.option_id === optionId).length;
    return Math.round((count / pollVotes.length) * 100);
  };

  const latestBreakingNews = news?.find(item => item.category?.toUpperCase() === 'BREAKING') || news?.[0];
  const heroImage = latestBreakingNews?.image_url || latestBreakingNews?.image || "/assets/vanguard-fallback.jpg";

  return (
    <div className="p-0 bg-carbon min-h-screen relative">
      {/* Dynamic Fading Announcements Slider (Neural Identity Aesthetic) */}
      <AnnouncementsBanner />

      <div className="p-8 grid grid-cols-12 gap-8">
        {/* Left Column: News & Feed */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="relative h-80 w-full rounded-xl overflow-hidden group aluminum-frame emissive-crimson border border-crimson/35 shadow-2xl">
            {/* Real-time physical console diagnostic indicators */}
            <div className="absolute top-3 right-4 font-mono text-[8px] text-zinc-500 select-none pointer-events-none flex items-center gap-3 z-30 tracking-widest bg-black/50 px-2 py-0.5 rounded border border-white/5">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" /> TEMP_01: 42.8°C</span>
              <span>BUFFER_LOAD: 93.4%</span>
              <span className="hidden sm:inline">VOLT_REF: +12.4V</span>
              <span className="hidden sm:inline">SYS_ID: INT-882</span>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
            <img 
              src={latestBreakingNews?.image_url || latestBreakingNews?.image || "/assets/vanguard-fallback.jpg"} 
              alt="Featured News"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src !== "/assets/vanguard-fallback.jpg") {
                  target.src = "/assets/vanguard-fallback.jpg";
                }
              }}
              className="w-full h-full object-cover transition-all duration-1000 brightness-75 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <span className="text-white text-[10px] font-mono font-black px-2.5 py-1 uppercase rounded tracking-wider bg-crimson shadow-[0_0_15px_rgba(229,9,20,0.6)]">Breaking</span>
              <span className="bg-black/80 text-white text-[10px] font-mono font-black px-2.5 py-1 uppercase rounded tracking-wider border border-white/10 backdrop-blur-md">Featured Unit</span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 z-20">
              {isEditingBreaking ? (
                <div className="flex flex-col gap-2 bg-black/95 p-4 rounded-xl border border-crimson/50 backdrop-blur-md shadow-2xl">
                  <span className="text-[9px] font-mono uppercase tracking-widest font-black text-crimson">Syncing Node Terminal Ticker // LIVE_UPDATE</span>
                  <textarea
                    value={tempBreakingText}
                    onChange={(e) => setTempBreakingText(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-crimson"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingBreaking(false)}
                      className="px-3 py-1.5 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-[10px] font-mono font-black uppercase rounded text-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBreaking}
                      className="px-3 py-1.5 text-[10px] text-white transition-all shadow-lg rounded bg-crimson tactile-button uppercase font-black"
                    >
                      Sync Banner
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group/banner flex items-start justify-between gap-4">
                  <h2 className="text-3xl font-black text-white leading-tight uppercase italic drop-shadow-[0_4px_12px_rgba(0,0,0,1)] leading-snug chromatic-text tracking-tight max-w-2xl">
                    {latestBreakingNews?.title || breakingNews?.text || breakingNews?.title || "Vanguard Ops: Archives System Expansion Initialized"}
                  </h2>
                  {isCurrentUserAdmin && (
                    <button
                      onClick={() => {
                        setTempBreakingText(breakingNews?.text || breakingNews?.title || "Vanguard Ops: Archives System Expansion Initialized");
                        setIsEditingBreaking(true);
                      }}
                      className="p-2 py-1 bg-black/80 text-white rounded-lg border border-crimson/60 transition-all flex items-center justify-center shrink-0 self-center shadow-[0_0_12px_rgba(229,9,20,0.3)] hover:bg-crimson hover-pulse"
                      title="Edit Terminal Banner"
                    >
                      <span className="text-[9px] font-mono font-black uppercase tracking-widest mr-1.5 hidden md:inline">Edit Banner</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-400 font-mono uppercase tracking-widest">
                <span>Core: Terminal_01</span>
                <span className="text-crimson">•</span>
                <span>Signal Strength: 100%</span>
                <span className="text-crimson">•</span>
                <span>Rasterizer Unit: Core_G2</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 mb-4 border-b border-white/5 pb-3 gap-2 pb-3">
             <h2 className="text-xs font-mono font-black uppercase tracking-widest text-white flex items-center gap-2">
               <TrendingUp size={14} className="text-crimson" /> ANALYZING <span className="text-crimson">INTELLIGENCE FEED</span>
             </h2>
             <div className="flex items-center gap-4">
               <button
                 type="button"
                 onClick={() => {
                   incrementEngagement(2);
                   triggerCognitiveHack();
                 }}
                 className="text-[8px] font-mono font-black px-2.5 py-1 text-red-400 border border-red-500/30 hover:border-red-500/70 hover:bg-red-500/10 rounded-lg uppercase tracking-wider transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.1)] hover:shadow-[0_0_12px_rgba(239,68,68,0.25)]"
               >
                 ⚡ SIMULATE FACTION INTRUSION
               </button>
               <Link to="/news" className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-1.5 transition-colors hover:text-crimson">
                  ACCESS STREAM <ChevronRight size={12} />
               </Link>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {news && news.length > 0 ? (
              news.map((item, idx) => {
                const isScrambled = scrambledId === item.id;
                const isRestored = restoredId === item.id;
                
                return (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 110,
                      damping: 12,
                      mass: 1.4,
                      delay: idx * 0.08 
                    }}
                    className={`plexiglass p-5 rounded-xl transition-all duration-300 hover-pulse group relative flex flex-col justify-between overflow-hidden ${
                      isScrambled ? 'animate-shake border-red-500 shadow-[0_0_20px_rgba(255,0,0,0.4)] bg-red-950/10' : ''
                    }`}
                  >
                    {/* Subtle machine diagnostics label */}
                    <div className="absolute top-2 right-3 font-mono text-[7px] text-zinc-600 select-none pointer-events-none uppercase tracking-widest">
                      SYS_FEED: {item.category?.toUpperCase() || "NEWS"}_ND // MATCH: {item.relevanceMatch}%
                    </div>

                    {/* Scrambled Threat Overlay */}
                    {isScrambled && (
                      <div className="absolute inset-0 bg-[#0c0303]/95 z-[30] flex flex-col items-center justify-center p-4 text-center select-none">
                        <ShieldAlert size={28} className="text-[#FF0000] animate-bounce mb-2" />
                        <span className="text-[10px] font-mono font-black text-[#FF0000] uppercase tracking-[0.25em] animate-pulse">
                          INTRUSION WARNING // COGNITIVE OVERRIDE
                        </span>
                        <span className="text-[7.5px] font-mono text-zinc-500 uppercase mt-1">
                          COGNITIVE SYSTEM OVERTAKEN BY RIVAL FACTION HACK
                        </span>
                      </div>
                    )}

                    {/* Decryptor safe restored notification anchor */}
                    {isRestored && (
                      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[40] bg-emerald-500 text-black font-mono font-black text-[8px] py-1 px-3 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)] uppercase tracking-widest select-none">
                        ✔ SECURE_RESTORATION_COMPLETE
                      </div>
                    )}

                    <div>
                      <Link to={`/news/${item.id}`} className="absolute inset-0 z-10" aria-label={`View ${item.title}`} />
                      
                      {/* Visual floating pane image layout */}
                      <div className="h-44 w-full bg-black/60 rounded-lg overflow-hidden mb-4 relative border border-white/5 shadow-inner">
                         <img 
                           src={item.image_url || item.image || "/assets/vanguard-fallback.jpg"} 
                           referrerPolicy="no-referrer"
                           className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                         />
                         <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
                           <span className="text-[8px] font-mono font-black text-white px-2 py-0.5 rounded tracking-widest bg-crimson shadow-[0_0_12px_rgba(229,9,20,0.5)] uppercase inline-block">
                             {item.category}
                           </span>

                           {/* Match weights logic indicators */}
                           {item.relevanceMatch >= 88 ? (
                             <span className="text-[8px] font-mono font-black text-amber-400 px-2 py-0.5 rounded tracking-widest bg-amber-500/20 border border-amber-500/30 uppercase flex items-center gap-1 inline-block">
                               <Sparkles size={8} className="animate-spin" /> HIGH_PROBABILITY_SYNC: {item.relevanceMatch}%
                             </span>
                           ) : (
                             <span className="text-[8px] font-mono text-zinc-400 px-2 py-0.5 rounded tracking-widest bg-zinc-800/20 border border-zinc-750/10 uppercase inline-block">
                               SYNC_PROB: {item.relevanceMatch}%
                             </span>
                           )}
                         </div>
                      </div>
                      
                      {/* Balanced rhythmic hierarchy - loosened heading padding */}
                      <h3 className="text-base font-extrabold text-white leading-snug group-hover:text-crimson transition-colors pt-1 pb-1.5 tracking-tight line-clamp-2">
                         <Scrambler text={item.title} active={isScrambled} />
                      </h3>
                      
                      {/* Body Text */}
                      <p className="text-xs text-zinc-400 font-sans leading-relaxed line-clamp-2 mb-3">
                        <Scrambler text={item.description} active={isScrambled} />
                      </p>

                      {/* Mainframe Summaries Decryptor Box */}
                      <div className="mb-4 p-2.5 bg-black/50 rounded-lg border border-red-500/10 hover:border-red-500/20 transition-colors font-mono text-[9px] text-[#A8A8B2] leading-relaxed relative overflow-hidden group/opt">
                        <div className="text-[8px] uppercase tracking-wider font-extrabold text-crimson mb-1 flex items-center gap-1.5 select-none leading-none">
                          <Network size={9} /> MAINFRAME RELEVANCE SUMMARY // CORES_SYNC
                        </div>
                        <Scrambler text={item.mainframeSummary} active={isScrambled} />
                      </div>
                    </div>

                    <div>
                      {/* Data Clusters tagging with hover highlights */}
                      <div className="mb-3 pt-2.5 border-t border-white/5 flex flex-wrap gap-1.5">
                        {item.dataClusters?.map((tag: string) => (
                          <span 
                            key={tag}
                            className="text-[7.5px] font-mono px-2 py-0.5 rounded-md border border-[#F59E0B]/20 hover:border-[#F59E0B]/40 text-[#F59E0B] bg-[#F59E0B]/5 transition-all duration-300 select-none cursor-default hover:shadow-[0_0_8px_rgba(245,158,11,0.15)] uppercase"
                            title={`Lore affinity category matching: ${tag}`}
                          >
                            📡 {tag}
                          </span>
                        ))}
                      </div>

                      {/* High contrast custom monospaced status pills and details (tightened tags) */}
                      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-gray-500">
                         <span className="flex items-center gap-1 text-zinc-400 font-semibold font-mono">
                           <Calendar size={10} className="text-crimson" /> {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: '2-digit' })} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                         <div className="flex items-center gap-1.5">
                            <img 
                              src={item.author_id ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author_id}` : undefined} 
                              className="w-4 h-4 rounded-full border border-white/10" 
                            />
                            <span className="text-gray-300 font-bold">{item.author_name || "VANGUARD"}</span>
                         </div>
                      </div>

                      {/* Neural Interactivity Hub (Likes and comments controller) */}
                      <div className="relative z-20 mt-3 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                        <LikeButton articleId={item.id} />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            toggleComments(item.id);
                          }}
                          className={`text-[9px] font-mono tracking-widest font-black uppercase px-3 py-1.5 rounded transition-all duration-300 tactile-button ${
                            openComments[String(item.id)] 
                              ? 'border-crimson text-crimson shadow-[0_0_15px_rgba(229,9,20,0.25)]' 
                              : 'text-zinc-400'
                          }`}
                        >
                          {openComments[String(item.id)] ? 'COLLAPSE▲_ND' : 'REPLIES▼_ND'}
                        </button>
                      </div>

                      {openComments[String(item.id)] && (
                        <div className="relative z-20 mt-2">
                          <CommentSection articleId={item.id} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : loading ? (
               [1,2,3,4].map(i => (
                <div key={i} className="bg-[#111] p-4 rounded-xl border border-[#1F1F1F] animate-pulse">
                  <div className="h-32 w-full bg-[#1A1A1A] rounded-lg mb-3"></div>
                  <div className="h-4 w-3/4 bg-[#1A1A1A] rounded mb-2"></div>
                  <div className="h-3 w-full bg-[#1A1A1A] rounded mb-1"></div>
                  <div className="h-3 w-5/6 bg-[#1A1A1A] rounded"></div>
                </div>
               ))
            ) : (
              <div className="col-span-full p-20 text-center text-gray-700 font-mono text-[10px] uppercase tracking-[0.3em] border border-dashed border-white/5 rounded-3xl">
                Nexus channel silent. no broadscasts detected.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Trending & Stats */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <section className="plexiglass rounded-xl p-5 hover-pulse border border-white/5 shadow-xl relative overflow-hidden">
            {/* Engineering micro-labels */}
            <div className="absolute top-2 right-3 text-[7px] font-mono text-zinc-600 select-none pointer-events-none uppercase">
              SCAN_FREQ: 60HZ // CHAN_COUNT: 06
            </div>
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-white mb-6 border-b border-white/5 pb-3 flex justify-between items-center text-zinc-300">
              <span className="flex items-center gap-2 chromatic-text"><Flame size={14} className="text-crimson animate-pulse" /> TRENDING CHANNELS</span>
              <Link to="/database" className="text-[9px] font-mono text-zinc-500 hover:text-crimson tracking-widest font-black uppercase">[FULL DATABASE]</Link>
            </h3>
            <div className="space-y-4">
              {featuredAnime.slice(0, 6).map((anime, idx) => (
                <motion.div 
                  key={`${anime.mal_id}-${idx}`}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="flex items-center gap-3 group cursor-pointer hover:bg-black/40 p-2.5 rounded-lg border border-transparent hover:border-white/5 transition-all duration-300"
                >
                  <span className="text-sm font-mono font-black italic w-6 text-zinc-600 group-hover:text-crimson transition-colors">0{idx + 1}</span>
                  <img src={anime.images.jpg.image_url || undefined} className="w-10 h-14 bg-black/60 rounded object-cover border border-white/10 shadow-md group-hover:scale-105 transition-all" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white group-hover:text-crimson transition-all truncate leading-snug">{anime.title}</div>
                    <div className="text-[9px] text-zinc-500 uppercase font-mono tracking-wider mt-0.5 truncate">{anime.studios?.[0]?.name || 'INTERNAL RESOURCE'}</div>
                  </div>
                  
                  {/* Small animated real-time SVG sparkline data stream */}
                  <div className="hidden sm:block shrink-0 px-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Sparkline color={idx % 2 === 0 ? '#E50914' : '#10B981'} width={64} height={20} />
                  </div>

                  <div className="text-right flex flex-col justify-center shrink-0">
                    <span className="text-[10px] text-emerald-400 font-extrabold font-mono tracking-tighter">+{Math.floor(Math.random() * 20) + 12}%</span>
                    <span className="text-[8px] text-zinc-500 font-mono tracking-widest uppercase">ACTIVE</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="plexiglass rounded-xl p-5 hover-pulse border border-white/5 shadow-xl relative overflow-hidden">
             {/* Engineering micro-labels */}
             <div className="absolute top-2 right-3 text-[7px] font-mono text-zinc-600 select-none pointer-events-none uppercase">
               CONSENSUS_UNIT: CN-109 // SAMPLE_REF: V-92
             </div>
             <h3 className="text-xs font-mono font-black uppercase tracking-widest mb-4 flex items-center justify-between text-white border-b border-white/5 pb-2 text-zinc-300">
               <span className="flex items-center gap-2 chromatic-text"><MessageSquare size={14} className="text-crimson" /> NEURAL CONSENSUS POLL</span>
               {isCurrentUserAdmin && (
                 <button 
                   type="button"
                   onClick={() => {
                     setPollEditForm({
                       question: communityPoll?.question || '',
                       option_a: communityPoll?.option_a || '',
                       option_b: communityPoll?.option_b || ''
                     });
                     setShowPollEdit(!showPollEdit);
                   }}
                   className="p-1.5 hover:bg-white/5 rounded border border-transparent hover:border-white/10 text-zinc-500 hover:text-crimson transition-all"
                   title="Edit Poll Settings"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                 </button>
               )}
             </h3>

             {isCurrentUserAdmin && showPollEdit ? (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const payload = {
                        id: 1,
                        question: pollEditForm.question,
                        option_a: pollEditForm.option_a,
                        option_b: pollEditForm.option_b,
                        votes_a: 0,
                        votes_b: 0
                      };
                      const { data } = await supabase.from('community_poll').upsert([payload]).select().single();
                      if (data) {
                        setCommunityPoll(data);
                      } else {
                        await supabase.from('community_poll').update({
                          question: pollEditForm.question,
                          option_a: pollEditForm.option_a,
                          option_b: pollEditForm.option_b,
                          votes_a: 0,
                          votes_b: 0
                        }).eq('id', 1);
                        setCommunityPoll({
                          ...communityPoll,
                          ...pollEditForm,
                          votes_a: 0,
                          votes_b: 0
                        });
                      }
                      localStorage.removeItem('voted_community_poll_1');
                      setVotedOption(null);
                      setShowPollEdit(false);
                    } catch (err) {
                      console.error('Error saving poll config:', err);
                      setCommunityPoll({
                        ...communityPoll,
                        ...pollEditForm,
                        votes_a: 0,
                        votes_b: 0
                      });
                      localStorage.removeItem('voted_community_poll_1');
                      setVotedOption(null);
                      setShowPollEdit(false);
                    }
                  }}
                  className="space-y-3 bg-black/90 p-3.5 rounded-lg border border-white/5 font-mono text-xs shadow-inner"
                >
                  <div className="text-[10px] uppercase font-black tracking-widest text-crimson">Configure Consensus Core</div>
                  <div>
                    <label className="text-[8px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Poll Question</label>
                    <input 
                      required
                      value={pollEditForm.question}
                      onChange={e => setPollEditForm({...pollEditForm, question: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-md p-2 focus:border-crimson outline-none text-white text-[11px] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Option A</label>
                    <input 
                      required
                      value={pollEditForm.option_a}
                      onChange={e => setPollEditForm({...pollEditForm, option_a: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-md p-2 focus:border-crimson outline-none text-white text-[11px] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-zinc-500 uppercase font-black tracking-wider block mb-1">Option B</label>
                    <input 
                      required
                      value={pollEditForm.option_b}
                      onChange={e => setPollEditForm({...pollEditForm, option_b: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-md p-2 focus:border-crimson outline-none text-white text-[11px] transition-colors"
                    />
                  </div>
                  <div className="flex gap-2 pt-1.5">
                    <button 
                      type="button" 
                      onClick={() => setShowPollEdit(false)}
                      className="flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-[9px] font-mono font-black uppercase tracking-widest rounded transition-colors text-zinc-400"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-1.5 text-white text-[9px] font-mono font-black uppercase tracking-widest rounded transition-all shadow-lg bg-crimson tactile-button"
                    >
                      Sync Core
                    </button>
                  </div>
                </form>
             ) : communityPoll ? (
                <div className="space-y-4">
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed font-sans">{communityPoll.question}</p>
                  <div className="space-y-3">
                     {['A', 'B'].map((optKey) => {
                        const optText = optKey === 'A' ? communityPoll.option_a : communityPoll.option_b;
                        const percent = getCommunityPollPercentage(optKey as any);
                        const isMyVote = votedOption === optKey;
                        const votesCount = optKey === 'A' ? (communityPoll.votes_a || 0) : (communityPoll.votes_b || 0);
                        return (
                          <button 
                            key={optKey}
                            disabled={votedOption !== null}
                            onClick={() => handleCommunityVote(optKey as any)}
                            className={`relative h-12 w-full flex items-center px-4 group overflow-hidden transition-all text-left border rounded-lg ${
                              isMyVote 
                                ? 'border-crimson bg-crimson/10 shadow-[0_0_20px_rgba(229,9,20,0.3)]' 
                                : 'border-white/10 bg-black/50 hover:border-crimson/50 hover:bg-black/90'
                            } ${votedOption === null ? 'tactile-button' : 'opacity-85'}`}
                          >
                             <div 
                               className="absolute inset-y-0 left-0 transition-all duration-1000" 
                               style={{ width: `${percent}%`, backgroundColor: 'rgba(229, 9, 20, 0.15)' }}
                             />
                             <span className="relative z-10 text-[11px] font-mono font-black italic uppercase tracking-tighter transition-colors text-white" style={isMyVote ? { color: '#E50914' } : {}}>
                               {optText}
                             </span>
                             {votedOption !== null && (
                               <span className="relative z-10 ml-auto text-[10px] font-mono font-black animate-pulse text-crimson">
                                 {percent}% ({votesCount}v)
                               </span>
                             )}
                          </button>
                        );
                     })}
                  </div>
                  {votedOption !== null && (
                    <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest text-center mt-4"> Consensus Data Recorded </p>
                  )}
                </div>
             ) : (
                <div className="p-10 text-center border border-dashed border-white/5 rounded-xl">
                  <p className="text-[10px] text-zinc-500 font-mono uppercase">Analyzing Consensus...</p>
                </div>
             )}
          </section>

          <div className="aluminum-frame emissive-crimson p-6 hover-pulse border border-crimson/35 rounded-xl relative overflow-hidden shadow-2xl">
             {/* Engineering micro-labels */}
             <div className="absolute top-2 right-3 text-[7px] font-mono text-zinc-600 select-none pointer-events-none uppercase">
               NODE: SEC-OP-01 // CORES: ONLINE
             </div>
             <div className="absolute top-0 right-0 p-2 opacity-5 text-crimson">
                <Flame size={80} />
             </div>
             <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] mb-2 text-crimson">VANGUARD SEC-OP ADMIN</p>
             <h4 className="text-sm font-bold text-white mb-4 leading-tight font-sans">Join the operations team to gain immediate decrypter logs.</h4>
             <Link to="/recruit" className="inline-block px-4 py-2 text-white text-[10px] font-mono font-black uppercase tracking-widest rounded transition-all tactile-button shadow-[0_0_15px_rgba(229,9,20,0.4)] bg-crimson">APPLY NODE</Link>
           </div>
        </div>

        {/* Full-width Neural Feed Ticker Tape */}
        <div className="col-span-12 mt-6">
          <div className="bg-gradient-to-r from-[#0d090f] via-[#050508] to-[#0d090f] border border-purple-500/10 hover:border-purple-500/25 p-4 rounded-2xl relative overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.8)] transition-all duration-300">
            {/* Ambient subtle glow and tech design rules */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/2 to-purple-500/0 opacity-50 pointer-events-none" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-[40px] pointer-events-none" />

            <div className="flex justify-between items-center px-1 pb-2 border-b border-white/5 mb-3 select-none font-mono text-zinc-500">
              <span className="text-[8px] text-crimson font-black tracking-[0.2em] uppercase flex items-center gap-1.5 leading-none">
                <span className="w-1.5 h-1.5 bg-crimson rounded-full animate-ping" /> CORE NEURAL COPROCESSOR FEED
              </span>
              <span className="text-[7px] uppercase tracking-widest leading-none">SYS_LINK_OKAY // SYS_LATENCY: 12ms</span>
            </div>

            {/* Marquee ticker container */}
            <div className="relative w-full overflow-hidden h-7 flex items-center rounded-lg bg-black/60 border border-white/5 px-4">
              <div className="flex items-center gap-16 whitespace-nowrap animate-marquee-slower">
                {/* Repetitive array elements for seamless infinite visual looping */}
                {[...systemLogs, ...systemLogs, ...systemLogs].map((log, index) => (
                  <div 
                    key={`${log.id}-${index}`} 
                    className="relative group/log flex items-center gap-2 cursor-crosshair pr-6 select-none"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse shrink-0" />
                    <span className="font-mono text-[9px] text-[#A8A8B2] font-black tracking-widest leading-none">
                      [{log.timestamp}] <span className="text-[#F2F2F5] hover:text-white transition-colors uppercase">{log.text}</span>
                    </span>
                    
                    {/* Tooltip on hover */}
                    <div className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover/log:block bg-[#0A0710] border border-red-500/50 text-[#FF0000] text-[8px] font-mono py-1 px-2.5 rounded shadow-[0_0_15px_rgba(229,9,20,0.5)] z-50 whitespace-nowrap">
                      <span className="text-zinc-500 mr-1.5 font-bold">SOURCE_TERM:</span>{log.source}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
