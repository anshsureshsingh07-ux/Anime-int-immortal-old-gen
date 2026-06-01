import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Award, GitPullRequest, Zap, Shield, Check, Lock, ChevronRight, Play } from 'lucide-react';

const SKILLS = [
  { id: 'bash', label: 'Terminal Access', cost: 100, category: 'Operations', description: 'Unlock core SSH pipeline access. Buffs database querying speeds.', levelRequired: 1, unlocked: true },
  { id: 'decrypter', label: 'Log Decryptor', cost: 250, category: 'Operations', description: 'Decompile secure news logging packets automatically. Increases XP output by +15%.', levelRequired: 2, unlocked: false },
  { id: 'samurai', label: 'Cyber Samurai', cost: 500, category: 'Combat', description: 'Enforce security firewalls against digital intrusions. Adds +10% protection attributes.', levelRequired: 3, unlocked: false },
  { id: 'sovereign', label: 'Faction Sovereign', cost: 1000, category: 'Sovereignty', description: 'Establish high-level influence. Overrun minor territory nodes instantly during wars.', levelRequired: 5, unlocked: false }
];

export default function SkillTree() {
  const [level, setLevel] = useState(2); // Mock current level
  const [tokens, setTokens] = useState(450); // Mock progression tokens / XP
  const [unlockedSkills, setUnlockedSkills] = useState<string[]>(['bash']);
  const [selectedSkill, setSelectedSkill] = useState(SKILLS[0]);

  const handleUnlockSkill = (skill: any) => {
    if (unlockedSkills.includes(skill.id)) return;
    if (tokens >= skill.cost && level >= skill.levelRequired) {
      setTokens(prev => prev - skill.cost);
      setUnlockedSkills(prev => [...prev, skill.id]);
    } else {
      alert('REQUISITE LEVELS OR Progression Tokens INSUFFICIENT to initialize node decryption.');
    }
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-gray-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3">
            <Award size={28} className="text-crimson shrink-0" />
            Skill <span className="text-crimson">Tree</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Visual progression path and capability enhancement modules
          </p>
        </div>
        
        {/* Dynamic progression info */}
        <div className="flex items-center gap-4 bg-[#0c0911] border border-purple-500/15 p-3 rounded-2xl">
          <div className="flex flex-col hover:opacity-95 font-mono">
            <span className="text-[7px] text-zinc-500 uppercase font-black">PROGRESSION LEVEL</span>
            <span className="text-sm font-black text-[#00BFFF]">LV {level} COPROCESSOR</span>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col hover:opacity-95 font-mono">
            <span className="text-[7px] text-zinc-500 uppercase font-black">CORE TOKENS</span>
            <span className="text-sm font-black text-emerald-400">{tokens} XPTS</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Visual Path (Left) and Unlock Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Skill Node Graph */}
        <div className="lg:col-span-8 bg-[#040206] p-6 rounded-3xl border border-white/5 flex flex-col gap-6 relative min-h-[400px] justify-center">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(168,85,247,0.01),rgba(0,0,0,0.1),rgba(168,85,247,0.01))] bg-[size:100%_4px,3px_100%] opacity-20 pointer-events-none" />

          <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-500 border-b border-white/5 pb-2 mb-4 select-none">
            PROGRESSION MAP // HARDWARE NODE LINKERS
          </h3>

          <div className="relative flex flex-col items-center gap-12 z-10 w-full max-w-md mx-auto py-4">
            {SKILLS.map((skill, index) => {
              const isUnlocked = unlockedSkills.includes(skill.id);
              const isSelected = selectedSkill.id === skill.id;
              const hasRequirement = level >= skill.levelRequired;

              return (
                <div key={skill.id} className="relative flex flex-col items-center w-full">
                  {/* Connecting cable lines */}
                  {index < SKILLS.length - 1 && (
                    <div className="absolute top-14 bottom-[-48px] w-[2px] bg-gradient-to-b from-purple-500/30 to-purple-500/10 pointer-events-none" />
                  )}

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedSkill(skill)}
                    className={`flex items-center justify-between w-full max-w-sm p-4 rounded-2xl cursor-pointer border transition-all duration-300 ${
                      isSelected
                        ? 'bg-purple-950/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)]'
                        : isUnlocked
                        ? 'bg-black/40 border-emerald-500/30 text-white'
                        : 'bg-black/60 border-white/5 text-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-mono font-black border ${
                        isUnlocked 
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                          : 'bg-black/80 border-white/10 text-zinc-500'
                      }`}>
                        {isUnlocked ? <Check size={16} /> : <Lock size={16} />}
                      </div>
                      <div className="text-left font-sans">
                        <h4 className={`text-xs font-extrabold uppercase tracking-wide ${
                          isSelected ? 'text-white' : isUnlocked ? 'text-gray-200' : 'text-zinc-500'
                        }`}>
                          {skill.label}
                        </h4>
                        <span className="text-[8px] font-mono text-zinc-400 uppercase">
                          REQ: LV {skill.levelRequired} • {skill.cost} XPTS
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-zinc-600" />
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Capabilities Detail */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="plexiglass p-6 rounded-3xl border border-white/5">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/5 pb-2.5 mb-4 flex items-center gap-1.5">
              <Zap size={12} className="text-crimson animate-pulse" /> Capability Detail
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <span className="text-[7px] text-zinc-500 font-mono font-black uppercase block mb-1">CAPABILITY TIER</span>
                <span className="text-xs font-sans font-black text-white uppercase tracking-wider block">
                  {selectedSkill.category} System
                </span>
              </div>

              <div className="bg-black/60 border border-white/5 p-4 rounded-xl">
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {selectedSkill.description}
                </p>
              </div>

              <div className="border-t border-white/5 pt-4">
                {unlockedSkills.includes(selectedSkill.id) ? (
                  <div className="w-full text-center py-2 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-black uppercase tracking-widest">
                    Node Synchronized ✔
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleUnlockSkill(selectedSkill)}
                    disabled={tokens < selectedSkill.cost || level < selectedSkill.levelRequired}
                    className={`w-full py-3.5 px-4 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                      tokens < selectedSkill.cost || level < selectedSkill.levelRequired
                        ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                        : 'bg-crimson hover:bg-crimson/80 text-white border border-crimson hover:shadow-[0_0_15px_rgba(229,9,20,0.4)]'
                    }`}
                  >
                    <Play size={10} className="fill-white" /> Initialize Decryption Node
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
