import { useState, useEffect } from 'react';
import { Terminal, ShieldAlert, Cpu, RefreshCw, Layers } from 'lucide-react';

interface RatingRelayProps {
  animeId: string | number;
}

interface EpisodeInfo {
  number: number;
  title: string;
  date: string;
}

interface RelayData {
  rating: number | null;
  episodes: EpisodeInfo[];
}

const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function RatingRelay({ animeId }: RatingRelayProps) {
  const [data, setData] = useState<RelayData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setDebugLogs((prev) => [...prev, `[${time}] ${msg}`].slice(-6));
  };

  useEffect(() => {
    if (!animeId) {
      setError(true);
      setLoading(false);
      return;
    }

    // If it's a UUID, it's a local database custom entry, not hosted in MyAnimeList (Jikan)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(animeId));

    if (isUUID) {
      addLog("UUID_NODE_DETECTED - LOCAL ARCHIVE");
      setError(true);
      setLoading(false);
      return;
    }

    const cacheKey = `vanguard_rating_relay_${animeId}`;
    const cachedItem = localStorage.getItem(cacheKey);

    if (cachedItem) {
      try {
        const parsed = JSON.parse(cachedItem);
        const now = Date.now();
        if (parsed && parsed.timestamp && now - parsed.timestamp < CACHE_EXPIRY_MS) {
          setData({
            rating: parsed.rating,
            episodes: parsed.episodes
          });
          addLog("CACHE_HIT - NEURAL DATA RETRIEVED");
          setLoading(false);
          return;
        } else {
          addLog("CACHE_EXPIRED - RE-SYNC INITIATED");
        }
      } catch (e) {
        addLog("CACHE_CORRUPTED - CLEARING CACHE");
        localStorage.removeItem(cacheKey);
      }
    }

    const fetchData = async () => {
      setLoading(true);
      setError(false);
      addLog(`LINKING NEURAL SECURE COORDINATES FOR MAL_${animeId}...`);

      try {
        // Fetch anime details
        const detailsRes = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
        if (!detailsRes.ok) {
          if (detailsRes.status === 429) {
            addLog("UPSTREAM_RATE_LIMIT_DELAY (429)");
            // Wait 1.5s and retry details
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const retryRes = await fetch(`https://api.jikan.moe/v4/anime/${animeId}`);
            if (!retryRes.ok) throw new Error("Upstream details failed");
          } else {
            throw new Error(`Details status: ${detailsRes.status}`);
          }
        }
        
        const detailsJson = await detailsRes.json();
        const score = detailsJson.data?.score || null;
        addLog(`SYNCED RATING: ${score !== null ? `${score}/10` : 'N/A'}`);

        // Wait 1s between Jikan requests to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Fetch episode list
        const epsRes = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/episodes`);
        let episodesList: EpisodeInfo[] = [];

        if (epsRes.ok) {
          const epsJson = await epsRes.json();
          episodesList = (epsJson.data || []).map((item: any) => {
            let airedDate = "N/A";
            if (item.aired) {
              try {
                const rawDate = new Date(item.aired);
                if (!isNaN(rawDate.getTime())) {
                  airedDate = rawDate.toISOString().split('T')[0];
                }
              } catch {
                airedDate = item.aired;
              }
            }
            return {
              number: item.mal_id,
              title: item.title || `Episode ${item.mal_id}`,
              date: airedDate
            };
          });
          addLog(`SYNCED EPISODES: ${episodesList.length} LOGS INGESTED`);
        } else {
          addLog("EPISODE_FEED_UNAVAILABLE - PROCEEDING ");
        }

        const freshData: RelayData = {
          rating: score,
          episodes: episodesList
        };

        // Save cache
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            ...freshData,
            timestamp: Date.now()
          })
        );

        setData(freshData);
        addLog("SYNC_COMPLETE - NEURAL MATRIX UPDATED");
      } catch (err) {
        addLog("TRANSMISSION_ERROR - SIGNAL LOSS");
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [animeId]);

  return (
    <div className="bg-[#050508] border border-crimson/20 rounded-2xl p-5 font-mono shadow-[0_0_20px_rgba(0,0,0,0.8)] flex flex-col gap-4 relative overflow-hidden">
      {/* Visual cyber design grids/lines */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-crimson/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-crimson/15 pb-3">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-crimson animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">
            NEURAL_RATING_RELAY // NODE_3.0
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
          <span className="text-[8px] font-black text-red-500/80 uppercase">
            LIVE_FEED
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center gap-3">
          <RefreshCw size={20} className="text-crimson animate-spin" />
          <span className="text-[9px] uppercase tracking-widest text-[#FF0000]">
            ESTABLISHING_NEURAL_UPLINK...
          </span>
        </div>
      ) : error ? (
        <div className="py-6 flex flex-col items-center justify-center gap-2.5 text-center">
          <ShieldAlert size={28} className="text-red-500 animate-bounce" />
          <div className="text-xs font-black text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1 rounded">
            [DATA_UNAVAILABLE]
          </div>
          <span className="text-[9px] text-zinc-500 uppercase max-w-[280px]">
            Node connection failed or local registry identity target cannot be routed through external index.
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Main Sync Rating display */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex items-center justify-between relative overflow-hidden group hover:border-crimson/25 transition-all">
            <div className="flex items-center gap-3">
              <Cpu className="text-crimson size-4" />
              <div className="flex flex-col">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest">RELAY_IDENTITY_SCORE</span>
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  [NEURAL_SYNC_RATING: {data?.rating !== null ? `${data?.rating}/10` : "DATA_SHIELDED"}]
                </span>
              </div>
            </div>
            {data?.rating && (
              <div className="text-right">
                <div className="text-xs font-black text-crimson italic">
                  {(data.rating * 10).toFixed(0)}% MATCH
                </div>
              </div>
            )}
          </div>

          {/* Episode Scroll list */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">
              EPISODIC_NARRATIVE_LOGS ({data?.episodes.length || 0})
            </span>
            
            {data?.episodes && data.episodes.length > 0 ? (
              <div className="max-h-52 overflow-y-auto pr-1 border border-white/5 rounded-xl bg-black/30 text-[10px] space-y-1.5 p-3 scrollbar-thin scrollbar-thumb-crimson/20 scrollbar-track-transparent">
                {data.episodes.map((ep) => {
                  const paddedEpNum = String(ep.number).padStart(2, '0');
                  return (
                    <div 
                      key={ep.number} 
                      className="border border-white/[0.03] hover:border-crimson/20 bg-zinc-950/60 hover:bg-zinc-950 px-2.5 py-1.5 rounded flex justify-between items-center font-mono text-zinc-300 hover:text-white transition-all text-[10px]"
                    >
                      <span className="truncate max-w-[70%] font-black uppercase text-zinc-400">
                        [EP_{paddedEpNum}: {ep.title}]
                      </span>
                      <span className="text-[8px] text-zinc-600 bg-black px-1.5 py-0.5 rounded border border-white/5 font-mono select-none">
                        {ep.date}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 bg-black/20 border border-white/5 rounded-xl text-[9px] text-zinc-500 uppercase">
                No episode timeline streams indexed for this node.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terminal Diagnostic Logs footer */}
      <div className="bg-[#020203] border border-white/5 rounded-xl p-3 flex flex-col gap-1 select-none">
        <div className="flex items-center gap-1.5 border-b border-white/5 pb-1 mb-1">
          <Layers size={10} className="text-zinc-600" />
          <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">
            REALTIME_DIAG_LOGS
          </span>
        </div>
        <div className="space-y-0.5 max-h-16 overflow-y-auto pr-1">
          {debugLogs.map((log, index) => (
            <div key={index} className="text-[8px] text-zinc-600 font-mono tracking-tight leading-normal uppercase">
              {log}
            </div>
          ))}
          {debugLogs.length === 0 && (
            <div className="text-[8px] text-zinc-700 italic uppercase">
              Initializing signal buffer...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
