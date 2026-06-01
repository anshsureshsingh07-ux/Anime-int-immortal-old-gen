import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Swords, Flame, Trophy, ShieldAlert, Award, Sparkles, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FactionStats {
  name: string;
  emoji: string;
  count: number;
  xp: number;
  likes: number;
  boostedXP: number;
  influencePct: number;
}

export default function FactionWar() {
  const [factions, setFactions] = useState<FactionStats[]>([
    { name: 'Akatsuki Network', emoji: '☁️', count: 12, xp: 4500, likes: 25, boostedXP: 10750, influencePct: 25 },
    { name: 'House Stark', emoji: '🛡️', count: 9, xp: 3200, likes: 18, boostedXP: 7700, influencePct: 20 },
    { name: 'Holy Britannian Empire', emoji: '👑', count: 15, xp: 5120, likes: 29, boostedXP: 12370, influencePct: 30 },
    { name: 'House Lannister', emoji: '🦁', count: 8, xp: 2800, likes: 14, boostedXP: 6300, influencePct: 25 }
  ]);

  const [lastEvent, setLastEvent] = useState({
    message: 'NEX-SECURE WARP DRIVE ENGAGED',
    timestamp: '00:00:00',
    type: 'system'
  });

  const [boostingFaction, setBoostingFaction] = useState<string | null>(null);

  // Synchronize dynamic info if possible
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const { data: userFactions, error: fError } = await supabase.from('user_factions').select('*');
        const { data: likesData, error: lError } = await supabase.from('article_likes').select('*');

        if (userFactions) {
          const compiled = [
            { name: 'Akatsuki Network', emoji: '☁️', count: 0, xp: 0, likes: 0 },
            { name: 'House Stark', emoji: '🛡️', count: 0, xp: 0, likes: 0 },
            { name: 'Holy Britannian Empire', emoji: '👑', count: 0, xp: 0, likes: 0 },
            { name: 'House Lannister', emoji: '🦁', count: 0, xp: 0, likes: 0 }
          ];

          // Count alignments
          userFactions.forEach((row: any) => {
            const rowFaction = row.faction_name || '';
            const idx = compiled.findIndex(f => f.name.toLowerCase() === rowFaction.toLowerCase() || rowFaction.toLowerCase().includes(f.name.substring(0, 5).toLowerCase()));
            if (idx !== -1) {
              compiled[idx].count += 1;
              compiled[idx].xp += row.xp || 500;
            }
          });

          // Count likes belonging to each faction
          if (likesData) {
            likesData.forEach((like: any) => {
              const alignedFaction = like.faction_name || '';
              const idx = compiled.findIndex(f => f.name.toLowerCase() === alignedFaction.toLowerCase() || alignedFaction.toLowerCase().includes(f.name.substring(0, 5).toLowerCase()));
              if (idx !== -1) {
                compiled[idx].likes += 1;
              }
            });
          }

          // Compute boosted stats
          const mapped = compiled.map(f => {
            const rawXP = f.xp || (f.count * 450) || 500;
            const boostedXpVal = rawXP + (f.likes * 250);
            return {
              ...f,
              count: f.count || 2, // fallback
              xp: rawXP,
              boostedXP: boostedXpVal,
              influencePct: 0
            };
          });

          const totalBoosted = mapped.reduce((sum, f) => sum + f.boostedXP, 0) || 1;
          const finalStats = mapped.map(f => ({
            ...f,
            influencePct: Math.round((f.boostedXP / totalBoosted) * 100)
          }));

          setFactions(finalStats);
        }
      } catch (err) {
        console.error('Failed to sync live faction war data:', err);
      }
    };

    fetchRealData();
    const interval = setInterval(fetchRealData, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulateBoost = (factionName: string) => {
    setBoostingFaction(factionName);
    const date = new Date();
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    
    // Simulate updating client-side stats instantly
    setFactions(prev => {
      const updated = prev.map(f => {
        if (f.name === factionName) {
          const newLikes = f.likes + 1;
          const newBoosted = f.boostedXP + 250;
          return { ...f, likes: newLikes, boostedXP: newBoosted };
        }
        return f;
      });
      const totalBoosted = updated.reduce((sum, f) => sum + f.boostedXP, 0) || 1;
      return updated.map(f => ({
        ...f,
        influencePct: Math.round((f.boostedXP / totalBoosted) * 100)
      }));
    });

    setLastEvent({
      message: `TACTICAL INFLUENCE REINFORCED FOR ${factionName.toUpperCase()} (+250pts)`,
      timestamp: timeString,
      type: 'boost'
    });

    setTimeout(() => {
      setBoostingFaction(null);
    }, 1000);
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-gray-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3">
            <Swords size={28} className="text-crimson shrink-0" />
            Faction <span className="text-crimson">War</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Real-time territory capture and live community node influence matrix
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-crimson/10 border border-crimson/30 rounded-lg text-crimson text-[10px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
          WAR_ZONE: ACTIVE_CONFLICT
        </div>
      </div>

      {/* Main Grid: Visual Map representation & Gauges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Live Influence Meters */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="plexiglass p-6 rounded-3xl border border-white/5">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/5 pb-3 mb-5 flex items-center gap-2">
              <Flame size={14} className="text-crimson animate-pulse" /> Territory Dominance Standings
            </h3>

            <div className="flex flex-col gap-5">
              {factions.map((f, idx) => {
                const colors = {
                  'Akatsuki Network': '#E50914',
                  'House Stark': '#00BFFF',
                  'Holy Britannian Empire': '#A855F7',
                  'House Lannister': '#FF9900'
                }[f.name] || '#E50914';

                return (
                  <div key={f.name} className="relative bg-black/45 border border-white/5 p-4 rounded-xl flex flex-col gap-3 overflow-hidden">
                    {boostingFaction === f.name && (
                      <div className="absolute inset-0 pointer-events-none border border-white/40 bg-white/5 rounded-xl animate-pulse" />
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-black/60 border border-white/10 flex items-center justify-center text-lg shadow-inner">
                          {f.emoji}
                        </div>
                        <div>
                          <h4 className="text-xs font-sans font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                            {f.name}
                            {idx === 0 && (
                              <span className="text-[7px] bg-crimson text-white px-1.5 py-0.5 rounded font-black tracking-widest uppercase animate-pulse">
                                SUPREME
                              </span>
                            )}
                          </h4>
                          <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                            Aligned Nodes: {f.count} Terminals
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 justify-between sm:justify-end font-mono">
                        <div className="text-right">
                          <span className="text-xs font-black" style={{ color: colors }}>
                            {f.boostedXP.toLocaleString()} POWER
                          </span>
                          <span className="text-[7px] font-mono text-zinc-500 block">
                            (+{f.likes} LIKES / INFLUENCE)
                          </span>
                        </div>
                        <div className="bg-black/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-center min-w-[50px]">
                          <span className="text-xs font-black text-white">{f.influencePct}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Linear Gauge */}
                    <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden p-[1.5px] border border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${f.influencePct}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${colors}dd, ${colors}33)` }}
                      />
                    </div>

                    {/* Boost Tactical Support Button */}
                    <div className="flex justify-end mt-1">
                      <button
                        type="button"
                        onClick={() => handleSimulateBoost(f.name)}
                        className="px-3 py-1 rounded bg-[#111] hover:bg-crimson/10 border border-white/10 hover:border-crimson/40 text-[8px] font-mono font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all"
                      >
                        Boost Influence Node
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Command Center & Event LOG */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#09060c] border border-white/5 p-5 rounded-3xl flex flex-col gap-4">
            <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-[#F2F2F5] pb-2 border-b border-white/5 flex items-center gap-1.5">
              <ShieldAlert size={12} className="text-crimson" /> Tactical War logs
            </h3>

            {/* Simulated Live Ticker */}
            <div className="bg-black/50 border border-white/5 p-4 rounded-xl font-mono text-[9px] text-zinc-400 flex flex-col gap-3 min-h-[140px] justify-between">
              <div className="flex flex-col gap-2">
                <span className="text-zinc-500">[LAST ACTION DETECTED]</span>
                <p className="text-[#F2F2F5] font-black uppercase leading-tight tracking-wider">
                  {lastEvent.message}
                </p>
              </div>
              <div className="flex justify-between items-center border-t border-white/5 pt-2 text-zinc-500">
                <span>TIME: {lastEvent.timestamp}</span>
                <span className="text-crimson font-black">NEX_STATUS_OK</span>
              </div>
            </div>

            {/* Tactical rules briefing */}
            <div className="bg-[#060408] border border-purple-500/10 p-4 rounded-xl">
              <span className="text-[8px] font-mono font-black text-purple-400 uppercase tracking-widest block mb-1.5">CONFLIT SYSTEM SPECS</span>
              <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
                Each article like synchronizes +250 tactical power points onto aligned factions. Real-time territory capture calculations evaluate overall power distribution ratios instantly. Maintain peak server operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
