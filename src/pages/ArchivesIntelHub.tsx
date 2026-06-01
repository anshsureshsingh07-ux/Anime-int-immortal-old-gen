import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Archive, Lock, Unlock, Eye, Sparkles, Database, Search, ShieldCheck } from 'lucide-react';
import { playDigitalSound } from '../lib/sounds';

interface IntelCard {
  id: string;
  codename: string;
  series: string;
  classification: string;
  dateLogged: string;
  scrambledText: string;
  decryptedContent: string;
  factionSource: string;
}

const INTEL_DOSSIERS: IntelCard[] = [
  {
    id: 'intel-01',
    codename: 'PROJECT_GAWAYN_FRAME',
    series: 'Code Geass: Lelouch of the Rebellion',
    classification: 'MILITARY SEC LEVEL 9',
    dateLogged: 'A.S.T_2017.10',
    scrambledText: 'æßØþ®¥‡∂ƒø∆˜^%!@#^7129038',
    decryptedContent: 'Dual-seat Fifth Generation Knightmare Frame containing the revolutionary float system and active Hadron Canons. Pilot signature: ZERO. Remote link secured.',
    factionSource: 'Holy Britannian Empire'
  },
  {
    id: 'intel-02',
    codename: 'SEALING_CONTRACT_DEATH',
    series: 'Death Note',
    classification: 'METAPHYSICAL_CLASS_IV',
    dateLogged: 'A.S.T_2006.04',
    scrambledText: 'µ†¥®´œ≈å∫√¢≤≥÷≠±%*()90##',
    decryptedContent: 'Notebook rules state that any human whose name is written in this register shall cease metabolic activities. Rule 01: Host must picture victim face to prevent accidental proxy targeting.',
    factionSource: 'Shinigami Realm Register'
  },
  {
    id: 'intel-03',
    codename: 'RAIN_FOG_GRID_JAMMER',
    series: 'Naruto Shippuden',
    classification: 'TACTICAL RECON MASTER',
    dateLogged: 'A.S.T_2007.02',
    scrambledText: 'åß∂ƒ©˙∆˚¬…æœ∑´®¬^%#@+_89',
    decryptedContent: 'Rainwater chakra monitoring network tracking all kinetic vibrations passing under metropolitan barriers. Synced directly to Pain’s sensory node terminal.',
    factionSource: 'Akatsuki Outpost'
  },
  {
    id: 'intel-04',
    codename: 'DRAGONGLASS_INVENTORY_CORE',
    series: 'Game of Thrones',
    classification: 'ANCIENT WEAPONS RES',
    dateLogged: 'A.S.T_2011.04',
    scrambledText: '≈Ωç√∫˜µ≤≥÷@#_+)(*&^%$#!~',
    decryptedContent: 'Volcanic glass registers in Dragonstone mines mapped to yield 85,000 sub-units capable of molecularly dissolving icy wight matrices. Storage: Chamber 3.',
    factionSource: 'House Stark Sanctuary'
  },
  {
    id: 'intel-05',
    codename: 'ZERO_KAY_FREEZE_BARRIER',
    series: 'Bleach (Thousand-Year Blood War)',
    classification: 'SOUL_SOCIETY_CAPTAINS',
    dateLogged: 'A.S.T_2022.10',
    scrambledText: 'ø∂ƒ©˙∆˚¬…æœ∑#@!(*_&^%12',
    decryptedContent: 'Bankai: Hakka no Togame. Absolute zero physical state surrounding the user. Complete kinetic and elemental molecular motion arrested for 15 seconds. Danger: Rapid defrost required.',
    factionSource: 'Seireitei Defensive Unit'
  }
];

export default function ArchivesIntelHub() {
  const [dossiers, setDossiers] = useState<IntelCard[]>(INTEL_DOSSIERS);
  const [decryptedState, setDecryptedState] = useState<{ [key: string]: boolean }>({});
  const [scrambleProgressState, setScrambleProgressState] = useState<{ [key: string]: string }>({});
  const [searchQuery, setSearchQuery] = useState('');

  // Settle scrambled texts
  useEffect(() => {
    const initialScramble: { [key: string]: string } = {};
    INTEL_DOSSIERS.forEach(d => {
      initialScramble[d.id] = d.scrambledText;
    });
    setScrambleProgressState(initialScramble);
  }, []);

  const triggerDecryption = (id: string, fullText: string) => {
    if (decryptedState[id]) return;
    
    playDigitalSound('whir');
    
    let iterations = 0;
    const maxIterations = 10;
    const scrambleInterval = setInterval(() => {
      setScrambleProgressState(prev => {
        // Generate dynamic scrambles
        const randomChars = '!@#$%^&*()_+{}|:"<>?[];\',./~`æßðø´¨ˆ';
        let customScramble = '';
        for (let i = 0; i < 28; i++) {
          customScramble += randomChars[Math.floor(Math.random() * randomChars.length)];
        }
        return {
          ...prev,
          [id]: customScramble
        };
      });

      iterations++;
      if (iterations >= maxIterations) {
        clearInterval(scrambleInterval);
        setDecryptedState(prev => ({
          ...prev,
          [id]: true
        }));
        setScrambleProgressState(prev => ({
          ...prev,
          [id]: fullText
        }));
        playDigitalSound('ping');
      }
    }, 50);
  };

  const filteredDossiers = dossiers.filter(d => 
    d.codename.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.series.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.factionSource.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-zinc-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
            <span className="text-[9px] font-mono tracking-widest text-crimson uppercase font-black">HIGH DENSITY INTEL</span>
          </div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3 chromatic-aberration">
            <Archive size={28} className="text-crimson shrink-0" />
            Archives & <span className="text-crimson">Intel Hub</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Secure, encrypted database storing classified cosmological events and faction logistics records
          </p>
        </div>

        {/* High Tech Search */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search archives..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              playDigitalSound('click');
            }}
            className="w-full bg-[#08040d]/80 border border-white/5 rounded-xl py-2 px-10 text-xs focus:outline-none focus:border-crimson transition-all font-mono premium-input"
          />
          <Search className="absolute left-3.5 top-2.5 text-zinc-500" size={13} />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-3 font-mono">
          <Database size={16} className="text-[var(--faction-primary,#E50914)]" />
          <div>
            <span className="text-[8px] text-zinc-500 block leading-none">TOTAL RECORDS</span>
            <span className="text-sm font-black text-white block mt-0.5">{dossiers.length} BLOCKS</span>
          </div>
        </div>

        <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-3 font-mono">
          <Unlock size={16} className="text-emerald-400" />
          <div>
            <span className="text-[8px] text-zinc-500 block leading-none">DECRYPTED STATE</span>
            <span className="text-sm font-black text-white block mt-0.5">
              {Object.values(decryptedState).filter(Boolean).length} / {dossiers.length} FILEs
            </span>
          </div>
        </div>

        <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-3 font-mono">
          <Lock size={16} className="text-crimson animate-pulse" />
          <div>
            <span className="text-[8px] text-zinc-500 block leading-none">ENCRYPTED CORES</span>
            <span className="text-sm font-black text-white block mt-0.5">
              {dossiers.length - Object.values(decryptedState).filter(Boolean).length} SYSTEMs
            </span>
          </div>
        </div>

        <div className="bg-black/40 border border-white/5 p-4 rounded-2xl flex items-center gap-3 font-mono">
          <ShieldCheck size={16} className="text-cyan-400" />
          <div>
            <span className="text-[8px] text-zinc-500 block leading-none">FIREWALL INTEGRITY</span>
            <span className="text-sm font-black text-emerald-400 block mt-0.5">99.88% INTEGRAL</span>
          </div>
        </div>
      </div>

      {/* Grid of high density intelligence cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {filteredDossiers.length === 0 ? (
          <div className="col-span-full py-16 text-center text-zinc-500 font-mono text-xs uppercase select-none">
            [0 RECORDS FOUND matching search query criteria]
          </div>
        ) : (
          filteredDossiers.map(card => {
            const isDecrypted = decryptedState[card.id];
            const currentScramble = scrambleProgressState[card.id] || card.scrambledText;

            return (
              <div
                key={card.id}
                className="neural-glass p-5 rounded-3xl flex flex-col justify-between border-[0.5px] border-white/10 hover-pulse relative overflow-hidden h-full group"
              >
                <div className="flex flex-col gap-3">
                  {/* Card Header information */}
                  <div className="flex justify-between items-center text-[8px] font-mono border-b border-white/5 pb-2">
                    <span className="text-zinc-500 font-bold uppercase">{card.dateLogged}</span>
                    <span className="text-[#00BFFF] uppercase tracking-wider font-extrabold">{card.factionSource}</span>
                  </div>

                  <h3 className="text-sm font-sans font-black text-white tracking-tight uppercase leading-snug">
                    {card.codename}
                  </h3>
                  <span className="text-[8px] font-mono text-zinc-400 uppercase leading-none">
                    Source: {card.series}
                  </span>

                  {/* Scrambled Area container representing technical document lock */}
                  <div className="bg-black/60 border border-white/5 p-3 rounded-2xl min-h-[105px] flex items-center justify-center font-mono text-xs relative overflow-hidden select-all mt-1">
                    <div className="absolute top-1 right-2 text-[6px] text-zinc-700 font-bold uppercase tracking-wider">
                      {isDecrypted ? 'DECRYPTED_CONTENT' : 'ENCRYPTED_VAULT_X72'}
                    </div>

                    <p className={`text-center leading-relaxed ${isDecrypted ? 'text-zinc-300 font-sans text-xs text-left' : 'text-crimson font-mono text-xs select-none tracking-widest break-all'}`}>
                      {currentScramble}
                    </p>
                  </div>
                </div>

                {/* Interactive Decryption Button */}
                <div className="mt-5 border-t border-white/5 pt-3.5 flex items-center justify-between">
                  {isDecrypted ? (
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 font-black uppercase tracking-widest">
                      <Sparkles size={11} className="animate-spin text-emerald-400" /> FILE SEC_OK
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-amber-500 font-black uppercase tracking-widest">
                      <Lock size={10} /> CORRUPTED DATA
                    </div>
                  )}

                  {!isDecrypted ? (
                    <button
                      type="button"
                      onClick={() => triggerDecryption(card.id, card.decryptedContent)}
                      className="px-4 py-2 bg-crimson hover:bg-crimson/90 text-white font-mono font-black text-[9px] uppercase tracking-widest rounded-lg flex items-center gap-2 shadow-[0_0_12px_rgba(229,9,20,0.3)] hover:scale-103 active:scale-97 border border-crimson/50 transition-all cursor-pointer"
                    >
                      <Eye size={10} /> Decrypt Codename
                    </button>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-500 font-semibold">[VERIFIED LOG]</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
