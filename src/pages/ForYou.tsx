import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  User, 
  Library, 
  Check, 
  Plus, 
  RefreshCw, 
  Cpu, 
  Activity, 
  ListChecks, 
  Heart,
  TrendingUp,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getWatchlist, addToWatchlist, isInWatchlist } from '../lib/watchlist';
import { playDigitalSound } from '../lib/sounds';

interface RecommendedAnime {
  title: string;
  mal_id: string;
  score: string;
  synopsis: string;
  reason: string;
  genres: string[];
  image: string;
}

const AVAILABLE_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", 
  "Sci-Fi", "Cyberpunk", "Mecha", "Psychological", 
  "Supernatural", "Mystery", "Slice of Life", "Thriller"
];

// Helper to calculate a match percentage based on genres and score
function generateMatchPercentage(scoreStr: string, index: number): number {
  const scoreNum = parseFloat(scoreStr) || 8.0;
  // Deterministic percentage based on score + index to keep it realistic
  const match = Math.floor(scoreNum * 10) + (5 - index);
  return Math.min(99, Math.max(72, match));
}

export default function ForYou() {
  const [fbUser, setFbUser] = useState<any>(null);
  const [dbProfile, setDbProfile] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [faction, setFaction] = useState<any>(null);
  
  const [availableGenres, setAvailableGenres] = useState<string[]>([
    "Action", "Adventure", "Comedy", "Drama", "Fantasy", 
    "Sci-Fi", "Cyberpunk", "Mecha", "Psychological", 
    "Supernatural", "Mystery", "Slice of Life", "Thriller",
    "Rom-Com", "Isekai"
  ]);

  const [recommendations, setRecommendations] = useState<RecommendedAnime[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState("");
  const [error, setError] = useState("");
  const [watchlistUpdateTrigger, setWatchlistUpdateTrigger] = useState(0);

  // Sync watchlist and user auth
  useEffect(() => {
    setWatchlist(getWatchlist());

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFbUser(user);
        
        // Load Supabase Profile for operator level/xp context
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.uid)
          .single();
        if (profile) setDbProfile(profile);

        // Load active faction
        const { data: userFactions } = await supabase
          .from('user_factions')
          .select('*');
        if (userFactions && userFactions.length > 0) {
          setFaction(userFactions[0]);
        }
      }
    });

    // Load previously selected genres if available
    const savedGenres = localStorage.getItem('nexus_liked_genres');
    if (savedGenres) {
      try {
        setSelectedGenres(JSON.parse(savedGenres));
      } catch (e) {
        console.error("Failed to parse local genres preferences", e);
      }
    } else {
      // Default to Action & Sci-Fi
      setSelectedGenres(["Action", "Sci-Fi", "Cyberpunk"]);
    }

    // Load cached recommendations to prevent reloading on navigating back
    const cachedRecommendations = localStorage.getItem('nexus_ai_recommendations_v1');
    if (cachedRecommendations) {
      try {
        setRecommendations(JSON.parse(cachedRecommendations));
      } catch (e) {
        console.error("Failed to parse cached recommendations", e);
      }
    }

    return () => unsubscribe();
  }, [watchlistUpdateTrigger]);

  const toggleGenre = (genre: string) => {
    try {
      playDigitalSound('click');
    } catch {}
    let updated: string[];
    let wasSelected = false;
    if (selectedGenres.includes(genre)) {
      updated = selectedGenres.filter(g => g !== genre);
    } else {
      updated = [...selectedGenres, genre];
      wasSelected = true;
    }

    if (wasSelected && (genre === "Rom-Com" || genre === "Isekai")) {
      console.log(`[GENRE_MATRIX_UPDATED: ${genre.toUpperCase().replace('-', '_')}_WEIGHT_ADJUSTED]`);
    }

    setSelectedGenres(updated);
    localStorage.setItem('nexus_liked_genres', JSON.stringify(updated));

    if (genre === "Rom-Com" || genre === "Isekai") {
      handleRecommend(updated);
    }
  };

  const handleRecommend = async (overrideGenres?: string[] | any) => {
    setLoading(true);
    setError("");
    try {
      playDigitalSound('ping');
    } catch {}

    const phases = [
      "ESTABLISHING TACTICAL INTEL HANDSHAKE...",
      "TUNING CORRELATION MATRIX CHANNELS...",
      "PARSING OPERATIVE WATCHLIST RECORDS...",
      "INTEGRATING SECTOR FACTION MEMORY...",
      "DISPATCHING GEMINI-3.5 LOGIC ENGINE..."
    ];

    // Cycle through visual phases
    for (let i = 0; i < phases.length; i++) {
      setLoadingPhase(phases[i]);
      await new Promise(resolve => setTimeout(resolve, i === phases.length - 1 ? 1200 : 700));
    }

    try {
      const activeGenres = Array.isArray(overrideGenres) ? overrideGenres : selectedGenres;
      const payload = {
        watchlist: watchlist.map(w => ({
          title: w.title,
          addedAt: w.addedAt,
          watchedEpisodesCount: w.watchedEpisodes?.length || 0
        })),
        likedGenres: activeGenres,
        communityInteractions: (faction 
          ? `Operative belongs to ${faction.faction_name || "Vanguard"} faction. Current server Level: ${dbProfile?.level || 1} with ${dbProfile?.xp || 0} XP.`
          : "Independent rogue operator.") + (activeGenres.some(g => ["Rom-Com", "Isekai"].includes(g)) 
              ? ` Note: Operative has high interest in Rom-Com or Isekai. Please apply a massive weight bonus or priority to anime tagged with these genres.` 
              : "")
      };

      const response = await fetch("/api/ai/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Mainframe routed status ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.recommendations) {
        setRecommendations(data.recommendations);
        localStorage.setItem('nexus_ai_recommendations_v1', JSON.stringify(data.recommendations));
      } else {
        throw new Error(data.error || "Rec-Engine returned anomalous payload.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Internal telemetry failure during recommendation coupling.");
    } finally {
      setLoading(false);
      setLoadingPhase("");
    }
  };

  const handleAddShortcut = (rec: RecommendedAnime) => {
    try {
      playDigitalSound('click');
    } catch {}
    addToWatchlist(
      rec.mal_id,
      rec.title,
      rec.image || "https://cdn.myanimelist.net/images/anime/1066/141873.jpg"
    );
    // Force component state update
    setWatchlistUpdateTrigger(prev => prev + 1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full min-h-screen text-gray-300">
      {/* Title block */}
      <header id="for-you-header" className="mb-8 border-b border-[#1F1F1F] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-red-500 font-mono uppercase bg-red-950/20 px-2 py-0.5 border border-red-500/10 rounded">
            AI Operations Subsystem
          </span>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white mt-2 flex items-center gap-2">
            <Sparkles className="text-red-500 text-3xl animate-pulse" /> For You
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1 uppercase tracking-widest">
            COGNITIVE PREFERENCE ANALYSIS & SYNTHESIS DECK
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-gray-500">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></span>
          <span>RECON-ENGINE STREAM: ONLINE</span>
        </div>
      </header>

      {/* Main grid splitter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Operator input, watchlist index & preferences setup */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Biometrics Node info */}
          <div className="bg-[#0b0b0b] border border-[#161616] rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
            <h2 className="text-xs font-mono font-black text-white uppercase tracking-wider mb-4 border-b border-[#1F1F1F] pb-2 flex items-center justify-between">
              <span>[01] INGESTED BIOMETRICS</span>
              <User size={12} className="text-red-500" />
            </h2>
            
            {fbUser ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-600 to-amber-600 p-[1px] flex items-center justify-center">
                  <div className="w-full h-full bg-[#111] rounded-lg flex items-center justify-center font-black text-red-500 text-lg">
                    {dbProfile?.username ? dbProfile.username.substring(0, 2).toUpperCase() : "OP"}
                  </div>
                </div>
                <div className="flex-1 font-mono text-xs">
                  <div className="text-white font-bold">{dbProfile?.username || fbUser?.email || "Agent Admin"}</div>
                  <div className="text-gray-500 text-[10px] mt-0.5">
                    LEVEL {dbProfile?.level || "1"} • XP {dbProfile?.xp || "10"}
                  </div>
                  {faction && (
                    <div className="text-red-500 font-bold text-[9px] uppercase tracking-wider mt-1">
                      FACTION: {faction.faction_name}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-xs font-mono text-gray-600 lowercase italic">
                Operative credentials restricted. Connecting as guest profile...
              </div>
            )}
          </div>

          {/* Interests Tune Panel */}
          <div className="bg-[#0b0b0b] border border-[#161616] rounded-xl p-5">
            <h2 className="text-xs font-mono font-black text-white uppercase tracking-wider mb-3 border-b border-[#1F1F1F] pb-2 flex items-center justify-between">
              <span>[02] INTEREST MATRIX TUNER</span>
              <Cpu size={12} className="text-red-500" />
            </h2>
            <p className="text-[10px] text-gray-500 mb-4 uppercase tracking-normal">
              Toggle specific genres to guide the Gemini recommendation weights:
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1">
              {availableGenres.filter(g => g !== "Rom-Com" && g !== "Isekai").map((genre) => {
                const active = selectedGenres.includes(genre);
                return (
                  <button
                    key={genre}
                    onClick={() => toggleGenre(genre)}
                    className={`px-2.5 py-1 text-[10px] font-mono rounded transitions uppercase tracking-wider border ${
                      active 
                      ? 'bg-red-950/30 text-red-400 border-red-500/30 font-bold' 
                      : 'bg-[#121212] border-[#222] text-gray-500 hover:border-gray-800'
                    }`}
                  >
                    {active ? "● " : "○ "} {genre}
                  </button>
                );
              })}
            </div>

            {/* High-demand sectors: Rom-Com & Isekai */}
            <div className="mt-4 pt-4 border-t border-[#1F1F1F]">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
                HIGH-DEMAND MATRIX SECTORS
              </span>
              <div className="flex gap-2.5 w-full">
                {["Rom-Com", "Isekai"].map((genre) => {
                  const active = selectedGenres.includes(genre);
                  return (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      style={{
                        border: active ? "1px solid var(--faction-primary, #E50914)" : "1px solid #333",
                        background: active ? "rgba(229, 9, 20, 0.15)" : "transparent",
                        boxShadow: active ? "0 0 14px var(--faction-primary-glow, rgba(229, 9, 20, 0.6))" : "none"
                      }}
                      className={`flex-1 py-2 text-[10px] font-mono rounded transitions uppercase tracking-wider text-center transition-all ${
                        active 
                        ? 'text-red-400 font-bold border-[var(--faction-primary,#E50914)] shadow-lg' 
                        : 'text-gray-500 border-[#333] hover:text-gray-400 hover:border-gray-600'
                      }`}
                    >
                      {active ? "● " : "○ "} {genre}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Watchlist reference logs */}
          <div className="bg-[#0b0b0b] border border-[#161616] rounded-xl p-5 flex flex-col flex-1 min-h-[220px]">
            <h2 className="text-xs font-mono font-black text-white uppercase tracking-wider mb-3 border-b border-[#1F1F1F] pb-2 flex items-center justify-between">
              <span>[03] MEMORY CORE RECORDERS</span>
              <Library size={12} className="text-red-500" />
            </h2>
            <p className="text-[10px] text-gray-500 mb-3 uppercase tracking-normal">
              Anonymized streaming watchlist index analyzed for similarity:
            </p>

            {watchlist.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center border border-dashed border-[#1F1F1F] rounded-lg">
                <ListChecks className="text-gray-700 mb-2" size={24} />
                <span className="text-[10px] font-mono text-gray-600 uppercase">Watchlist cache empty</span>
                <Link to="/database" className="text-[9px] text-red-500 hover:underline uppercase font-mono mt-1 font-bold">
                  Add anime as source material &rarr;
                </Link>
              </div>
            ) : (
              <div className="flex-grow max-h-[240px] overflow-y-auto space-y-2 pr-1.5">
                {watchlist.map((item) => (
                  <div key={item.animeId} className="flex gap-2 p-1.5 rounded bg-[#111] hover:bg-[#151515] border border-white/[0.02]">
                    <img 
                      src={item.imageUrl} 
                      alt="" 
                      className="w-10 h-10 object-cover rounded-md bg-[#222]"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 min-w-0 font-mono text-[10px] flex flex-col justify-center">
                      <div className="text-white font-medium truncate uppercase">{item.title}</div>
                      <div className="text-gray-500 text-[8px] uppercase mt-0.5">
                        EP PROGRESS: {item.watchedEpisodes?.length || 0} SECTIONS
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="text-[8px] font-mono text-gray-600 mt-3 text-right uppercase">
              Total logs compiled: {watchlist.length} Nodes
            </div>
          </div>

        </div>

        {/* Right column: Main recommendations board display */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Main actionable trigger bar */}
          <div className="p-1 px-4 py-3 bg-[#0d0d0d] border border-red-500/10 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-950/45 rounded-lg text-red-500">
                <Activity size={16} className={loading ? "animate-spin" : "animate-pulse"} />
              </div>
              <div>
                <div className="text-xs font-mono font-black text-white uppercase">[NEURAL VECTOR MODEL COMPILING]</div>
                <div className="text-[10px] text-gray-500 font-mono">
                  Guiding {selectedGenres.length} target attributes over {watchlist.length} user watchlist assets
                </div>
              </div>
            </div>
            
            <button
              onClick={handleRecommend}
              disabled={loading}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-mono text-xs font-black uppercase tracking-wider transition ${
                loading 
                ? 'bg-[#1E1E1E] text-gray-500 cursor-not-allowed border border-[#333]' 
                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/10 active:scale-95 border border-red-500'
              }`}
            >
              {loading ? "SYNTHESIZING..." : "COUPLE AI MATRIX"}
            </button>
          </div>

          {/* Secondary Action output display (Recommendations results) */}
          <div className="flex-1 bg-[#070707] border border-[#141414] rounded-2xl p-6 md:p-8 relative min-h-[400px] flex flex-col">
            
            {/* Holographic grid highlight */}
            <div className="absolute inset-x-0 top-0 h-[100px] bg-gradient-to-b from-red-600/[0.02] to-transparent pointer-events-none" />
            
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex-grow flex flex-col items-center justify-center text-center p-8 font-mono"
                >
                  <Cpu className="text-red-500 animate-spin mb-4" size={32} />
                  <div className="text-white text-xs font-bold uppercase tracking-widest">{loadingPhase}</div>
                  <div className="mt-2 text-gray-600 text-[10px] flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-ping"></span>
                    NEURAL INFERENCE RETRIEVING CORRELATION SCORES...
                  </div>
                  
                  {/* Pseudo terminal logs */}
                  <div className="mt-8 bg-[#0b0b0b] border border-[#161616] p-4 rounded-lg w-full max-w-md text-left font-mono text-[9px] text-red-500/80 space-y-1">
                    <div>&gt; STABILIZING GEMINI MODEL CONNECTION INITIATED...</div>
                    <div className="text-gray-500">&gt; ANALYZING INTERESTS PILLS: [{selectedGenres.join(", ")}]</div>
                    <div className="text-gray-500">&gt; QUANTIZING WATCHLIST ARRAY ENCODING...</div>
                    <div className="animate-pulse">&gt; STREAM ENGINE PARSING RESPONSE CHUNKS...</div>
                  </div>
                </motion.div>

              ) : error ? (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-grow flex flex-col items-center justify-center text-center p-8 text-red-500 font-mono"
                >
                  <span className="text-sm font-black uppercase tracking-wider">CRITICAL ENGINE EXCEPTION</span>
                  <p className="max-w-md mt-2 text-xs text-gray-500 bg-[#0f0a0a] border border-red-500/10 p-3 rounded-lg">
                    {error}
                  </p>
                  <button 
                    onClick={handleRecommend}
                    className="mt-4 px-4 py-2 border border-red-500/20 rounded hover:bg-red-500/10 text-xs font-bold uppercase tracking-wider"
                  >
                    RETRY COUPLEMENT
                  </button>
                </motion.div>

              ) : recommendations.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-grow flex flex-col items-center justify-center text-center p-8"
                >
                  <Sparkles className="text-gray-800 mb-3 animate-pulse" size={36} />
                  <h3 className="text-sm font-black uppercase tracking-wider text-gray-400">RECOMMENDATION MAINFRAME DORMANT</h3>
                  <p className="text-xs text-gray-600 max-w-sm mt-1 mb-6">
                    Analyze user watch records, liked attributes, and generate custom recommended titles in the tactical mainframe portal.
                  </p>
                  <button
                    onClick={handleRecommend}
                    className="px-6 py-3 bg-[#111] hover:bg-[#151515] border border-red-500/25 rounded-xl text-red-500 text-xs font-bold uppercase tracking-widest transition flex items-center gap-2"
                  >
                    <RefreshCw size={13} /> Synchronize Preferences Node
                  </button>
                </motion.div>

              ) : (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3 mb-4">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                      RECOMMENDATIONS MATCHING OPERATIVE NODES
                    </span>
                    <span className="text-[9px] font-mono text-green-500 font-black bg-green-500/10 px-2.5 py-0.5 rounded border border-green-500/10 uppercase tracking-widest">
                      6 DECODE MODULES LOADED
                    </span>
                  </div>

                  {/* Recommendations Cards list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.map((rec, idx) => {
                      const scorePercentage = generateMatchPercentage(rec.score, idx);
                      const isAdded = isInWatchlist(rec.mal_id);
                      
                      return (
                        <motion.div
                          key={rec.mal_id + idx}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          className="bg-[#0b0b0b] border border-[#161616] hover:border-red-500/20 rounded-xl p-4 flex flex-col justify-between group transitions relative"
                        >
                          {/* Radial indicator */}
                          <div className="absolute top-3 right-3 bg-red-950/30 text-red-400 font-mono text-[9px] px-2 py-0.5 rounded-full border border-red-800/15 flex items-center gap-1">
                            <TrendingUp size={9} /> {scorePercentage}% Match
                          </div>

                          <div>
                            {/* Card Content Top */}
                            <div className="flex gap-3 mb-3">
                              <img 
                                src={rec.image || "https://cdn.myanimelist.net/images/anime/1066/141873.jpg"} 
                                alt="" 
                                className="w-16 h-20 object-cover rounded-lg bg-[#222]" 
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black uppercase text-white truncate tracking-wide mt-1 group-hover:text-red-500 transitions">
                                  {rec.title}
                                </h4>
                                <div className="text-[8px] font-mono text-gray-500 mt-1 uppercase">
                                  SCORE: {rec.score} • DB: #{rec.mal_id}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {rec.genres?.slice(0, 3).map((g) => (
                                    <span key={g} className="text-[8px] font-mono uppercase bg-[#181818] border border-[#262626] text-gray-400 px-1.5 py-0.5 rounded">
                                      {g}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Synopsis */}
                            <p className="text-[10px] text-gray-400 font-serif leading-relaxed mb-3 line-clamp-3">
                              {rec.synopsis}
                            </p>

                            {/* Operational rationale */}
                            <div className="bg-[#121212]/70 border-l-2 border-red-600 p-2.5 rounded-r-md mb-4 text-[9.5px] font-mono text-gray-500 leading-normal">
                              <span className="text-red-500 uppercase font-bold tracking-wider text-[8px] block mb-0.5">OPERATOR METRIC COUPLING:</span>
                              {rec.reason}
                            </div>
                          </div>

                          {/* Quick Add To Watchlist Action bar */}
                          <div className="flex items-center justify-between border-t border-[#121212] pt-3 mt-auto">
                            <Link 
                              to={`/anime/${rec.mal_id}`}
                              className="text-[9px] font-mono uppercase font-black text-gray-500 hover:text-white flex items-center gap-1 group/link"
                            >
                              <span>Inspect Files</span>
                              <ExternalLink size={10} className="group-hover/link:translate-x-0.5 transitions" />
                            </Link>

                            {isAdded ? (
                              <span className="text-[9px] font-mono text-green-500 font-black uppercase flex items-center gap-1.5 bg-green-950/20 px-2 py-0.5 border border-green-500/10 rounded">
                                <Check size={11} /> Saved to Core
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAddShortcut(rec)}
                                className="px-3 py-1.5 rounded bg-[#151515] hover:bg-red-600/10 border border-white/5 hover:border-red-500/20 text-white text-[9px] font-mono uppercase font-black tracking-wide flex items-center gap-1 transitions active:scale-95"
                              >
                                <Plus size={11} /> Add to watch
                              </button>
                            )}
                          </div>

                        </motion.div>
                      );
                    })}
                  </div>
                  
                  {/* Clean up action bottom */}
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleRecommend}
                      disabled={loading}
                      className="px-4 py-2 border border-red-500/10 rounded-lg text-red-500 text-[10px] font-mono uppercase hover:bg-red-500/5 transitions flex items-center gap-1.5"
                    >
                      <RefreshCw size={11} className={loading ? "animate-spin" : ""} /> RE-SYNCHRONIZE PREFERENCE CORES
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>
    </div>
  );
}
