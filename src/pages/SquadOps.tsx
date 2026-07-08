import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Target, Users, Plus, Check, Award, Flame, Zap } from 'lucide-react';

function TypewriterText({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    let index = 0;
    setDisplayedText('');
    const interval = setInterval(() => {
      // Functional state update prevents stale closures
      setDisplayedText((prev) => prev + text.charAt(index));
      index++;
      if (index >= text.length) {
        clearInterval(interval);
      }
    }, 15); // Snappy decryption simulation
    return () => clearInterval(interval);
  }, [text]);

  return (
    <span className="font-mono text-xs text-rose-300 leading-relaxed drop-shadow-[0_0_8px_rgba(229,9,20,0.5)]">
      {displayedText}
      <span className="inline-block w-1.5 h-3.5 bg-crimson ml-1 animate-pulse" />
    </span>
  );
}

const SQUAD_DATA = [
  { id: 1, name: 'Cyberpunk Run Crew', anime: 'Cyberpunk: Edgerunners', members: 14, slots: 20, leader: 'David_Sandevistan', status: 'Streaming Now', goal: 'Watch Episodes 1-6 tonight' },
  { id: 2, name: 'Infinity Castle Vanguard', anime: 'Demon Slayer Trilogy', members: 45, slots: 50, leader: 'Tanjiro_Alpha', status: 'Pending', goal: 'Movie 1 broadcast debriefing session' },
  { id: 3, name: 'Steins;Gate Loop Council', anime: 'Steins;Gate', members: 8, slots: 10, leader: 'Okabe_Rintarou', status: 'Active', goal: 'Examine divergence logs' }
];

export default function SquadOps() {
  const [joinedSquads, setJoinedSquads] = useState<number[]>(() => {
    const saved = localStorage.getItem('nexus_joined_squads');
    return saved ? JSON.parse(saved) : [3];
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [squads, setSquads] = useState(() => {
    const saved = localStorage.getItem('nexus_squads');
    return saved ? JSON.parse(saved) : SQUAD_DATA;
  });

  useEffect(() => {
    localStorage.setItem('nexus_squads', JSON.stringify(squads));
  }, [squads]);

  useEffect(() => {
    localStorage.setItem('nexus_joined_squads', JSON.stringify(joinedSquads));
  }, [joinedSquads]);

  // AI Briefing Tracking States
  const [squadBriefings, setSquadBriefings] = useState<Record<number, string>>({});
  const [loadingBriefings, setLoadingBriefings] = useState<Record<number, boolean>>({});

  // Form states for squad creation
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadAnime, setNewSquadAnime] = useState('');
  const [newSquadGoal, setNewSquadGoal] = useState('');

  const handleJoinSquad = (id: number) => {
    if (joinedSquads.includes(id)) {
      setJoinedSquads(prev => prev.filter(item => item !== id));
    } else {
      setJoinedSquads(prev => [...prev, id]);
    }
  };

  const handleAnalyzeSquad = async (squadId: number, goal: string, anime: string) => {
    if (loadingBriefings[squadId]) return;
    setLoadingBriefings(prev => ({ ...prev, [squadId]: true }));
    try {
      const response = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ squadGoal: goal, animeTitle: anime }),
      });
      const data = await response.json();
      if (data.success && data.briefing) {
        setSquadBriefings(prev => ({ ...prev, [squadId]: data.briefing }));
      } else {
        setSquadBriefings(prev => ({ 
          ...prev, 
          [squadId]: `Target identified: ${anime}. Objective: Decode neural feed failure. Warning: Encryption protocol compromised, retry sync.` 
        }));
      }
    } catch (err) {
      console.error('Tactical decryption stream error:', err);
      setSquadBriefings(prev => ({ 
        ...prev, 
        [squadId]: `Target identified: ${anime}. Objective: Unscheduled link dropout recovery. Warning: Grid interference detected.` 
      }));
    } finally {
      setLoadingBriefings(prev => ({ ...prev, [squadId]: false }));
    }
  };

  const handleCreateSquad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSquadName || !newSquadAnime) return;

    const newSquad = {
      id: squads.length + 1,
      name: newSquadName,
      anime: newSquadAnime,
      members: 1,
      slots: 15,
      leader: 'You',
      status: 'Active',
      goal: newSquadGoal || 'Watch anime series'
    };

    setSquads(prev => [...prev, newSquad]);
    setJoinedSquads(prev => [...prev, newSquad.id]);
    setShowCreateModal(false);
    setNewSquadName('');
    setNewSquadAnime('');
    setNewSquadGoal('');
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-gray-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3">
            <Target size={28} className="text-crimson shrink-0" />
            Squad <span className="text-crimson">Ops</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Management screen for cooperative, user-led anime watch-groups and tactical raids
          </p>
        </div>
        
        {/* Create Squad group button */}
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-2.5 rounded-xl bg-crimson hover:bg-crimson/90 border border-crimson text-white text-[10px] font-mono font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(229,9,20,0.35)]"
        >
          <Plus size={11} /> Construct watch squad
        </button>
      </div>

      {/* Squad Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {squads.map(squad => {
          const isJoined = joinedSquads.includes(squad.id);

          return (
            <div 
              key={squad.id}
              className={`neural-glass rounded-3xl p-5 border relative overflow-hidden flex flex-col justify-between hover-pulse transition-all duration-300 ${
                isJoined 
                  ? 'border-crimson/35 bg-gradient-to-br from-[#0a0205] to-[#04010a]' 
                  : 'border-white/5 bg-black/40'
              }`}
            >
              {/* Squad Status Header */}
              <div className="flex items-center justify-between gap-2 mb-4 font-mono text-[8px] tracking-widest uppercase">
                <span className={`px-2 py-0.5 rounded border font-black ${
                  squad.status === 'Streaming Now' 
                    ? 'border-[#00BFFF]/40 text-[#00BFFF] bg-[#00BFFF]/10 animate-pulse' 
                    : 'border-white/10 text-zinc-400 bg-black/60'
                }`}>
                  {squad.status}
                </span>
                <span className="text-zinc-500 font-bold">
                  SQUAD S#{squad.id}
                </span>
              </div>

              {/* Title & Core Meta */}
              <div className="flex flex-col gap-1 mb-4">
                <h3 className="text-sm font-sans font-black text-white uppercase tracking-tight leading-tight group-hover:text-crimson transition-all">
                  {squad.name}
                </h3>
                <span className="text-[10px] font-mono text-zinc-400 font-black flex items-center gap-1">
                  <Flame size={10} className="text-crimson" /> {squad.anime}
                </span>
              </div>

              {/* Task Goal or AI briefing decryption block */}
              {squadBriefings[squad.id] ? (
                <div role="status" className="text-xs leading-relaxed font-sans mb-5 bg-[#0e0204]/95 p-3.5 rounded-xl border border-crimson/30 shadow-[0_0_15px_rgba(229,9,20,0.15)] flex flex-col gap-2 min-h-[96px] justify-between">
                  <div>
                    <span className="text-[7px] text-crimson font-mono font-black uppercase block tracking-wider mb-1 animate-pulse">
                      ▲ [DIRECTIVE DECRYPTED]
                    </span>
                    <TypewriterText text={squadBriefings[squad.id]} />
                  </div>
                  <span className="text-[7px] text-zinc-500 font-mono font-black block mt-2 tracking-widest border-t border-white/5 pt-1">
                    [BRIEFING_STATUS: ENCRYPTED_DATA_DECRYPTED]
                  </span>
                </div>
              ) : loadingBriefings[squad.id] ? (
                <div className="text-xs leading-relaxed font-sans mb-5 bg-black/60 p-3.5 rounded-xl border border-white/10 flex flex-col justify-center items-center min-h-[96px]">
                  <Zap size={14} className="text-crimson animate-spin mb-1.5" />
                  <span className="text-[8px] font-mono font-black text-crimson animate-pulse tracking-widest">
                    DECRYPTING INTEL FEED...
                  </span>
                </div>
              ) : (
                <div className="text-xs text-zinc-400 leading-relaxed font-sans mb-5 bg-black/40 p-3.5 rounded-xl border border-white/5 min-h-[96px] flex flex-col justify-between">
                  <div>
                    <span className="text-[7px] text-zinc-500 font-mono font-black uppercase block mb-1">
                      CURRENT SQUAD GOAL
                    </span>
                    <p className="text-xs text-zinc-300 font-sans leading-relaxed">{squad.goal}</p>
                  </div>
                  <span className="text-[7px] text-zinc-650 font-mono block mt-2 tracking-widest">
                    [BRIEFING_STATUS: ARMORED_ENCRYPTION_ACTIVE]
                  </span>
                </div>
              )}

              {/* Bottom Metadata & Tactical Actions */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto font-mono text-[9px] text-zinc-450 gap-2">
                <div className="flex flex-col shrink-0">
                  <span className="text-zinc-550 flex items-center gap-1 font-bold">
                    <Users size={11} className="text-crimson" /> MEMBERS ({squad.members}/{squad.slots})
                  </span>
                  <span className="text-zinc-500 font-bold mt-0.5">LEADER: {squad.leader}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAnalyzeSquad(squad.id, squad.goal, squad.anime)}
                    disabled={loadingBriefings[squad.id]}
                    className="px-2.5 py-1.5 rounded-xl text-[9px] font-mono font-bold uppercase tracking-widest border border-crimson/30 bg-crimson/5 hover:bg-crimson/15 text-crimson hover:text-white transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0"
                    title="Run centralized mainframe tactical decryption analyzer"
                  >
                    <Zap size={10} className={loadingBriefings[squad.id] ? "animate-spin" : ""} />
                    {loadingBriefings[squad.id] ? 'Syncing...' : 'Analyze'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleJoinSquad(squad.id)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1 transition-all shrink-0 ${
                      isJoined
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-white/10 bg-black hover:bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {isJoined ? <Check size={10} /> : <Plus size={9} />}
                    {isJoined ? 'Joined' : 'Join watch'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="plexiglass max-w-md w-full p-6 sm:p-8 rounded-3xl border border-crimson/30 shadow-[0_0_50px_rgba(229,9,20,0.25)] relative"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <span className="text-[9px] font-mono font-black text-crimson tracking-widest uppercase">
                COOPERATIVE RADAR // CONSTRUCT WATCH SQUAD
              </span>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white font-mono text-[9px] uppercase tracking-widest bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateSquad} className="flex flex-col gap-4 font-mono text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] font-black uppercase text-zinc-500">Squad Call Sign Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Solo Leveling Strike Team"
                  value={newSquadName}
                  onChange={e => setNewSquadName(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-crimson transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] font-black uppercase text-zinc-500">Anime Host Target Series</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Solo Leveling"
                  value={newSquadAnime}
                  onChange={e => setNewSquadAnime(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-crimson transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] font-black uppercase text-zinc-500">Operation Objectives goal</label>
                <textarea
                  placeholder="e.g. Watch starting episodes and discuss character stats"
                  value={newSquadGoal}
                  onChange={e => setNewSquadGoal(e.target.value)}
                  rows={3}
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-crimson transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-crimson hover:bg-crimson/90 border border-crimson text-white text-[10px] font-mono font-black uppercase tracking-widest transition-all mt-3 shadow-[0_0_15px_rgba(229,9,20,0.3)]"
              >
                Deploy Watch squad node
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
