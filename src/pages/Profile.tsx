import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Shield, Save, Camera, ArrowLeft, Upload, Loader2, Bookmark, Trash2, FileText, BarChart2, Sparkles, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getWatchlist, removeFromWatchlist, WatchlistItem } from '../lib/watchlist';
import { getStoredProfileExt, calculateLevel, syncAndEnrichProfile, awardXP } from '../lib/profileSync';
import { VerifiedBadge } from '../components/VerifiedBadge';
import Cropper from 'react-easy-crop';


const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const getHouseColorGlow = (houseId: string) => {
  const h = (houseId || '').toLowerCase();
  if (h.includes('saiyan')) return 'rgba(250, 204, 21, 0.15)';
  if (h.includes('targaryen')) return 'rgba(239, 68, 68, 0.15)';
  if (h.includes('stark')) return 'rgba(56, 189, 248, 0.15)';
  if (h.includes('uchiha')) return 'rgba(255, 0, 60, 0.15)';
  if (h.includes('ackerman')) return 'rgba(148, 163, 184, 0.15)';
  if (h.includes('uzumaki')) return 'rgba(249, 115, 22, 0.15)';
  if (h.includes('japanese') || h === 'sakura') return 'rgba(255, 94, 126, 0.15)';
  if (h.includes('lannister')) return 'rgba(245, 158, 11, 0.15)';
  if (h.includes('akatsuki')) return 'rgba(220, 38, 38, 0.15)';
  if (h.includes('baratheon')) return 'rgba(251, 191, 36, 0.15)';
  if (h.includes('britannian')) return 'rgba(168, 85, 247, 0.15)';
  return 'rgba(239, 68, 68, 0.12)';
};

export default function Profile() {
  const [fbUser, setFbUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ username: '', avatar_url: '' });
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localFileBlobUrl, setLocalFileBlobUrl] = useState<string>('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [faction, setFaction] = useState<any>(null);
  const [factionLoading, setFactionLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageRaw, setCropImageRaw] = useState<File | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPanX, setCropPanX] = useState(0);
  const [cropPanY, setCropPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSummer, setIsSummer] = useState(() => localStorage.getItem('stark_summer_active') === 'true');

  // 🕹️ Retro 2D Tactical Arcade Game States
  const [gameActive, setGameActive] = useState(false);
  const [gameTimeLeft, setGameTimeLeft] = useState(20);
  const [gameScore, setGameScore] = useState(0);
  const [gameHighscore, setGameHighscore] = useState(() => Number(localStorage.getItem('trainer_highest_score') || 0));
  const [gameTargets, setGameTargets] = useState<{ id: number; x: number; y: number; premium: boolean }[]>([]);
  const [gameParticles, setGameParticles] = useState<{ id: number; x: number; y: number; text: string; color: string }[]>([]);
  const [gameStatusText, setGameStatusText] = useState<'IDLE' | 'TRAINING' | 'FINISHED'>('IDLE');
  const [earnedXPBonus, setEarnedXPBonus] = useState(0);
  const gameIntervalRef = useRef<any>(null);
  const targetSpawnRef = useRef<any>(null);

  // Custom audio synthesizer sounds powered by Web Audio API
  const playLaserSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(850, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      console.warn('Web Audio laser bypass:', e);
    }
  };

  const playStartSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, ctx.currentTime); // E
      osc.frequency.setValueAtTime(440, ctx.currentTime + 0.08); // A
      osc.frequency.setValueAtTime(554, ctx.currentTime + 0.16); // C#
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.24); // E
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn('Web Audio start bypass:', e);
    }
  };

  const playGameOverSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(330, ctx.currentTime + 0.15);
      osc.frequency.setValueAtTime(277, ctx.currentTime + 0.3);
      osc.frequency.setValueAtTime(220, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch (e) {
      console.warn('Web Audio game over bypass:', e);
    }
  };

  useEffect(() => {
    return () => {
      if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
      if (targetSpawnRef.current) clearInterval(targetSpawnRef.current);
    };
  }, []);

  useEffect(() => {
    const handleSummerChange = (e: any) => {
      setIsSummer(e.detail);
    };
    window.addEventListener('stark-summer-change', handleSummerChange);
    return () => {
      window.removeEventListener('stark-summer-change', handleSummerChange);
    };
  }, []);

  const getMultiplierAndPPH = () => {
    const activeTheme = localStorage.getItem('active_house_theme') || (faction?.faction_name ? getHouseIdFromName(faction.faction_name) : 'stark');
    const isPremiumHouse = ['japanese', 'lannister', 'akatsuki'].includes(activeTheme.toLowerCase());
    const mult = isPremiumHouse ? 3 : 1;
    return { multiplier: mult, pointsPerHit: 10 * mult, isPremiumHouse };
  };

  const startTrainerGame = () => {
    playStartSound();
    
    // Clear any active game loop
    if (gameIntervalRef.current) clearInterval(gameIntervalRef.current);
    if (targetSpawnRef.current) clearInterval(targetSpawnRef.current);
    
    setGameScore(0);
    setGameTimeLeft(20);
    setGameTargets([]);
    setGameParticles([]);
    setEarnedXPBonus(0);
    setGameActive(true);
    setGameStatusText('TRAINING');
    
    const { pointsPerHit } = getMultiplierAndPPH();
    
    // Target spawn builder helper
    const spawnTarget = () => {
      const newY = Math.floor(Math.random() * 65) + 15; // 15% to 80% safe zone
      const newX = Math.floor(Math.random() * 80) + 10; // 10% to 90% safe zone
      const targetId = Date.now() + Math.random();
      const isPremiumNode = Math.random() > 0.75; 
      
      setGameTargets(prev => [...prev, { id: targetId, x: newX, y: newY, premium: isPremiumNode }]);
      
      // Auto-erase targeted node if not poked in 1.4 seconds
      setTimeout(() => {
        setGameTargets(prev => prev.filter(t => t.id !== targetId));
      }, 1400);
    };
    
    // Quick burst at start and interval
    spawnTarget();
    targetSpawnRef.current = setInterval(spawnTarget, 850);
    
    // Timer counter down
    gameIntervalRef.current = setInterval(() => {
      setGameTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(gameIntervalRef.current!);
          clearInterval(targetSpawnRef.current!);
          setGameActive(false);
          setGameStatusText('FINISHED');
          playGameOverSound();
          
          setGameScore(finalScore => {
            const finalBonus = finalScore * pointsPerHit;
            setEarnedXPBonus(finalBonus);
            
            // Save local and live profile
            if (finalScore > gameHighscore) {
              setGameHighscore(finalScore);
              localStorage.setItem('trainer_highest_score', String(finalScore));
            }
            
            // Submit live award XP to backend sync profiles
            const authId = fbUser?.uid || profile?.id || auth.currentUser?.uid || '';
            if (authId && finalBonus > 0) {
              awardXP(authId, finalBonus).then(updatedP => {
                if (updatedP) setProfile(updatedP);
              });
            }
            return finalScore;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTargetClick = (targetId: number, x: number, y: number, isP: boolean) => {
    playLaserSound();
    
    // Instant drop triggered node
    setGameTargets(prev => prev.filter(t => t.id !== targetId));
    setGameScore(prev => prev + 1);
    
    const { pointsPerHit } = getMultiplierAndPPH();
    const awarded = isP ? Math.round(pointsPerHit * 1.5) : pointsPerHit;
    
    // Push expanding micro laser particle
    const pId = Date.now() + Math.random();
    setGameParticles(prev => [
      ...prev,
      {
        id: pId,
        x,
        y,
        text: `+${awarded} XP`,
        color: isP ? 'text-amber-400 font-extrabold text-[11px] scale-110' : 'text-cyan-400 font-bold text-[10px]'
      }
    ]);
    
    setTimeout(() => {
      setGameParticles(prev => prev.filter(p => p.id !== pId));
    }, 1000);
  };

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
    },
    {
      name: 'House Baratheon',
      tagline: 'Ours is the Fury!',
      rank: 'Storm Lord',
      emoji: '🦌',
      styles: {
        border: 'border-amber-500/50 hover:border-amber-400',
        bg: 'bg-gradient-to-br from-[#211905] via-[#0b0802] to-[#0c0903]',
        textShadow: 'text-amber-500 [text-shadow:_0_0_12px_rgba(245,158,11,0.6)]',
        textColor: 'text-amber-500',
        taglineColor: 'text-amber-400/70',
        glow: 'shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]'
      }
    },
    {
      name: 'House Targaryen',
      tagline: 'Fire and Blood.',
      rank: 'Dragon Lord',
      emoji: '🐉',
      styles: {
        border: 'border-red-700/40 hover:border-red-500',
        bg: 'bg-gradient-to-br from-[#141414] via-[#0c0c0c] to-[#121212]',
        textShadow: 'text-red-500 [text-shadow:_0_0_15px_rgba(229,9,20,0.5)]',
        textColor: 'text-red-500',
        taglineColor: 'text-red-400/60',
        glow: 'shadow-[0_0_20px_rgba(229,9,20,0.1)] hover:shadow-[0_0_30px_rgba(229,9,20,0.3)]'
      }
    },
    {
      name: 'House Uzumaki',
      tagline: 'Believe it!',
      rank: 'Hokage',
      emoji: '🌀',
      styles: {
        border: 'border-orange-500/40 hover:border-orange-400',
        bg: 'bg-gradient-to-br from-[#1b0d05] via-[#0b0502] to-[#0e0703]',
        textShadow: 'text-orange-500 [text-shadow:_0_0_12px_rgba(249,115,22,0.6)]',
        textColor: 'text-orange-500',
        taglineColor: 'text-orange-400/70',
        glow: 'shadow-[0_0_20px_rgba(249,115,22,0.15)] hover:shadow-[0_0_30px_rgba(249,115,22,0.35)]'
      }
    },
    {
      name: 'Japanese House',
      tagline: 'Honor and Sakura Scroll.',
      rank: 'Shogun',
      emoji: '🌸',
      styles: {
        border: 'border-[#ff5e7e]/40 hover:border-[#ff5e7e]',
        bg: 'bg-gradient-to-br from-[#1c080e] via-[#0c0306] to-[#120509]',
        textShadow: 'text-[#ff5e7e] [text-shadow:_0_0_12px_rgba(255,94,126,0.6)]',
        textColor: 'text-[#ff5e7e]',
        taglineColor: 'text-[#ff8ca3]/70',
        glow: 'shadow-[0_0_20px_rgba(255,94,126,0.15)] hover:shadow-[0_0_30px_rgba(255,94,126,0.35)]'
      }
    },
    {
      name: 'House Uchiha',
      tagline: 'Behold the Sharingan.',
      rank: 'Clan Head',
      emoji: '👁️',
      styles: {
        border: 'border-[#ff003c]/40 hover:border-[#ff003c]',
        bg: 'bg-gradient-to-br from-[#0c0103] via-[#000000] to-[#0d0104]',
        textShadow: 'text-[#ff003c] [text-shadow:_0_0_15px_rgba(255,0,60,0.7)]',
        textColor: 'text-[#ff003c]',
        taglineColor: 'text-red-500/70',
        glow: 'shadow-[0_0_20px_rgba(255,0,60,0.2)] hover:shadow-[0_0_30px_rgba(255,0,60,0.45)]'
      }
    },
    {
      name: 'House Ackerman',
      tagline: 'Perfect tactical precision.',
      rank: 'Captain',
      emoji: '⚔️',
      styles: {
        border: 'border-slate-500/40 hover:border-slate-400',
        bg: 'bg-gradient-to-br from-[#1e222b] via-[#101217] to-[#14171d]',
        textShadow: 'text-[#4a90e2] [text-shadow:_0_0_12px_rgba(74,144,226,0.5)]',
        textColor: 'text-slate-200',
        taglineColor: 'text-slate-400/80',
        glow: 'shadow-[0_0_20px_rgba(74,144,226,0.11)] hover:shadow-[0_0_30px_rgba(74,144,226,0.25)]'
      }
    },
    {
      name: 'House Saiyans',
      tagline: 'Surpass your limits!',
      rank: 'Super Saiyan',
      emoji: '⚡',
      styles: {
        border: 'border-yellow-400/50 hover:border-sky-400',
        bg: 'bg-gradient-to-br from-[#090e1f] via-[#04060d] to-[#0b1228]',
        textShadow: 'text-yellow-400 [text-shadow:_0_0_12px_rgba(250,204,21,0.6)]',
        textColor: 'text-yellow-400',
        taglineColor: 'text-sky-300/80',
        glow: 'shadow-[0_0_20px_rgba(0,191,255,0.15)] hover:shadow-[0_0_30px_rgba(255,215,0,0.35)]'
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
    if (n.includes('baratheon')) return '🦌';
    if (n.includes('targaryen')) return '🐉';
    if (n.includes('uzumaki')) return '🌀';
    if (n.includes('japanese')) return '🌸';
    if (n.includes('uchiha')) return '👁️';
    if (n.includes('ackerman')) return '⚔️';
    if (n.includes('saiyan')) return '⚡';
    return '🔰';
  };

  const getHouseIdFromName = (name: string): string => {
    const norm = (name || '').toLowerCase();
    if (norm.includes('saiyan')) return 'saiyans';
    if (norm.includes('targaryen')) return 'targaryen';
    if (norm.includes('stark')) return 'stark';
    if (norm.includes('uchiha')) return 'uchiha';
    if (norm.includes('ackerman')) return 'ackerman';
    if (norm.includes('uzumaki')) return 'uzumaki';
    if (norm.includes('japanese')) return 'japanese';
    if (norm.includes('lannister')) return 'lannister';
    if (norm.includes('akatsuki')) return 'akatsuki';
    if (norm.includes('baratheon')) return 'baratheon';
    if (norm.includes('britannia') || norm.includes('empire')) return 'britannian';
    return norm;
  };



  const fetchUserFaction = async (userId: string) => {
    const activeUserId = userId || fbUser?.uid || auth.currentUser?.uid;
    if (!activeUserId) return;

    try {
      const { data } = await supabase
        .from('user_factions')
        .select('*')
        .eq('user_id', activeUserId)
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
    // Clear out local state errors immediately
    setMsg({ type: '', text: '' });

    const hId = getHouseIdFromName(factionName);

    // Immediate Alignment Activation: set attribute right away for instantaneous response!
    document.documentElement.setAttribute('data-theme', hId.toLowerCase().replace(/\s+/g, '-'));
    localStorage.setItem('active_house_theme', hId);

    const authId = fbUser?.uid || profile?.id || auth.currentUser?.uid || '';

    try {
      const payload: any = {
        user_id: authId,
        faction_name: factionName || "Unaligned Legion",
        faction_rank: factionRank || "Warlock",
        faction_xp: profile?.xp ?? 9999
      };

      // Perform the database upsert with onConflict handles
      try {
        await supabase
          .from('user_factions')
          .upsert(payload, { onConflict: 'user_id' });
      } catch (e) {
        console.warn('user_factions write bypassed:', e);
      }

      // Update user_profiles table as requested
      try {
        await supabase
          .from('user_profiles')
          .upsert({
            user_id: authId,
            active_faction: factionName,
            faction_name: factionName
          }, { onConflict: 'user_id' });
      } catch (upErr) {
        console.warn('user_profiles custom theme sync warning:', upErr);
      }

      // Keep standard profiles table in sync so change highlights correctly across menus
      try {
        await supabase
          .from('profiles')
          .update({ active_faction: factionName })
          .eq('id', authId);
      } catch (pErr) {
        console.warn('profiles active_faction sync warning:', pErr);
      }

      // Save selection directly to local storage to make the theme immediately available
      localStorage.setItem('active_faction_name', factionName);

      // Execute immediate page color palette shifts on documentElement
      const dataThemeVal = factionName.toLowerCase().replace(/\s+/g, '-');
      document.documentElement.setAttribute('data-theme', dataThemeVal);
      document.documentElement.setAttribute('data-faction-theme', hId);

      // Refresh local states
      setFaction(payload);

      // Clear errors instantly so the red warning box/block component fully vanishes
      setMsg({ type: '', text: '' });

      // Fetch user faction
      await fetchUserFaction(authId);

      // Notify app-wide components
      window.dispatchEvent(new Event('profiles-updated'));
      window.dispatchEvent(new Event('storage'));

      // Open CRT alignment lock success overlay
      setShowOverlay(true);
    } catch (err: any) {
      console.warn('Database alignment issue, aligning locally:', err);
      // Fallback for custom sandbox sandbox constraints to make sure the state updates instantly
      localStorage.setItem('active_faction_name', factionName);
      const dataThemeVal = factionName.toLowerCase().replace(/\s+/g, '-');
      document.documentElement.setAttribute('data-theme', dataThemeVal);
      document.documentElement.setAttribute('data-faction-theme', hId);
      setFaction({
        user_id: authId,
        faction_name: factionName,
        faction_rank: factionRank,
        faction_xp: profile?.xp ?? 9999
      });
      window.dispatchEvent(new Event('profiles-updated'));
      window.dispatchEvent(new Event('storage'));
      setShowOverlay(true);
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

      // Hydrate state from localStorage immediately to bypass the loading screen and flicker
      const cachedAvatar = localStorage.getItem('cached_avatar_url_' + user.uid) || localStorage.getItem(`cached_avatar_url_${user.uid}`);
      if (cachedAvatar) {
        setProfile({
          id: user.uid,
          email: user.email,
          username: user.email?.split('@')[0] || '',
          profile_photo_url: cachedAvatar,
          avatar_url: cachedAvatar,
        });
        setForm({
          username: user.email?.split('@')[0] || '',
          avatar_url: cachedAvatar,
        });
        setLoading(false);
      }

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
    // Look up user_profiles first for the avatar profile image to support long-term persistence
    let userProfilesAvatar: string | null = null;
    try {
      const { data: upData } = await supabase
        .from('user_profiles')
        .select('avatar_public_url')
        .eq('user_id', userId)
        .maybeSingle();
      if (upData?.avatar_public_url) {
        userProfilesAvatar = upData.avatar_public_url;
      }
    } catch (upErr) {
      console.warn('user_profiles query bypassed/failed on startup:', upErr);
    }

    // Try reading the cached avatar, prioritizing user_profiles DB row, then falling back to localStorage
    const cachedAvatar = userProfilesAvatar || localStorage.getItem(`cached_avatar_url_${userId}`);

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
      if (cachedAvatar) {
        profileData.profile_photo_url = cachedAvatar;
        profileData.avatar_url = cachedAvatar;
        localStorage.setItem(`cached_avatar_url_${userId}`, cachedAvatar);
      }
      setProfile(profileData);
      setForm({ 
        username: profileData.username || '', 
        avatar_url: cachedAvatar || profileData.profile_photo_url || profileData.avatar_url || '' 
      });
      fetchUserFaction(userId);
    }
    setLoading(false);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fbUser || !profile) return;

    // Reset crop mechanics and open calibration modal overlay
    setCropImageRaw(file);
    const blobUrl = URL.createObjectURL(file);
    setCropImageSrc(blobUrl);
    setCropZoom(1);
    setCropPanX(0);
    setCropPanY(0);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setShowCropModal(true);

    // Clear element value to allow subsequent selections of the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropPanX, y: e.clientY - cropPanY });
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCropPanX(e.clientX - dragStart.x);
    setCropPanY(e.clientY - dragStart.y);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setCropZoom(prev => Math.min(3, prev + 0.1));
  };

  const handleZoomOut = () => {
    setCropZoom(prev => Math.max(1, prev - 0.1));
  };

  const handleCropConfirm = () => {
    if (!cropImageSrc || !croppedAreaPixels) return;

    const imgElement = new Image();
    imgElement.src = cropImageSrc;
    imgElement.crossOrigin = 'anonymous';
    imgElement.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        
        // Compression: Force 1:1 max pixel boundaries (500x500 px) to keep avatars lightweight and high performance
        const outputSize = 500;
        canvas.width = outputSize;
        canvas.height = outputSize;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to capture 2D graphics render plane.');

        // Elegantly clear the canvas with full aesthetic deep dark background
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, outputSize, outputSize);

        // Draw image mapping cropped area coordinates to 500x500 canvas coordinates
        ctx.drawImage(
          imgElement,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          outputSize,
          outputSize
        );

        // Convert the uniform canvas into a high performance client-side Base64 data URL
        const croppedBase64 = canvas.toDataURL('image/png');
        setLocalFileBlobUrl(croppedBase64);

        // Upload the clean base64 via the API proxy
        await executeBase64Upload(croppedBase64);
        setShowCropModal(false);
      } catch (err: any) {
        setMsg({ type: 'error', text: 'Cropping computation error: ' + err.message });
      }
    };
  };

  const executeBase64Upload = async (base64String: string) => {
    if (!fbUser || !profile) return;

    setUploading(true);
    setMsg({ type: '', text: '' });

    try {
      // Use the user's ID as folder name to conform strictly with RLS / storage policies
      const randomSeed = Math.random().toString(36).substring(2);
      const filePath = `${profile.id}/${randomSeed}.png`;

      // Use the server-side /api/upload proxy which runs as service role / master client
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
          bucket: 'avatar',
          fileName: filePath,
          fileData: base64String,
          contentType: 'image/png'
        })
      });

      if (!response.ok) {
        const resError = await response.json();
        throw new Error(resError.error || 'Server upload proxy failed');
      }

      const { publicUrl } = await response.json();

      if (!publicUrl) {
        throw new Error('Verification failure: Public URL generation rejected from backend.');
      }

      // 2. Fallback double updates to keep other tables in exact parity
      try {
        await supabase
          .from('user_profiles')
          .update({ 
            avatar_public_url: publicUrl, 
            avatar_url: publicUrl, 
            avatar: publicUrl 
          })
          .eq('user_id', profile?.id);
      } catch (upErr) {
        console.warn('user_profiles database sync notice:', upErr);
      }

      // 3. Update core profiles table with compressed, pristine link
      const { error: dbUpdateError } = await supabase
        .from('profiles')
        .update({ 
          profile_photo_url: publicUrl, 
          avatar_url: publicUrl 
        })
        .eq('id', profile?.id);

      if (dbUpdateError) {
        throw dbUpdateError;
      }

      // 4. Ensure long-term local caches are in lockstep
      localStorage.setItem('cached_avatar_url_' + profile.id, publicUrl);
      localStorage.setItem(`cached_avatar_url_${profile.id}`, publicUrl);

      setForm(prev => ({ ...prev, avatar_url: publicUrl }));
      setUploading(false);
      setMsg({ type: 'success', text: 'Neural identity avatar uploaded and synchronized successfully.' });

      // Signal cross-component interface elements to re-verify public identity link instantly
      window.dispatchEvent(new CustomEvent('profiles-updated', { 
        detail: { blobUrl: publicUrl } 
      }));
    } catch (err: any) {
      console.error('Core base64 upload failure:', err);
      setMsg({ type: 'error', text: 'Biological interface upload fault: ' + (err.message || err) });
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
      localStorage.setItem(`cached_avatar_url_${profile.id}`, form.avatar_url);
      setMsg({ type: 'success', text: 'Neural identity updated successfully.' });
      fetchProfileById(fbUser?.uid || profile.id);
      window.dispatchEvent(new Event('profiles-updated'));
    }
    setSaving(false);
  };

  if (loading) return <div className="p-20 text-center font-mono uppercase tracking-[0.4em] opacity-40">Accessing Node...</div>;

  const avatar_public_url = form.avatar_url || profile?.profile_photo_url || profile?.avatar_url || '';
  const defaultPlaceholder = `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser?.uid || 'default'}`;
  const user = fbUser || auth.currentUser;

  const activeHouseId = localStorage.getItem('active_house_theme') || (faction?.faction_name ? getHouseIdFromName(faction.faction_name) : 'stark');
  const glowColor = getHouseColorGlow(activeHouseId);

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-background pb-12 bg-gradient-to-b from-[#030305] to-[#010102] relative text-gray-200">
      {/* Premium Atmospheric Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute -top-[10%] -left-[10%] w-[60vh] h-[60vh] rounded-full blur-[140px] transition-all duration-1000 ease-in-out" 
          style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute -bottom-[10%] -right-[10%] w-[60vh] h-[60vh] rounded-full blur-[140px] transition-all duration-1000 ease-in-out" 
          style={{ background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` }}
        />
        {/* Subtle Cyber-Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-70" />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 relative z-10">
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmerSweep {
            0% { transform: translateX(-150%) rotate(25deg); }
            100% { transform: translateX(150%) rotate(25deg); }
          }
        `}} />
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
                : faction.faction_name.toLowerCase().includes('lannister')
                  ? 'bg-[#180303] border-amber-600/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                  : faction.faction_name.toLowerCase().includes('baratheon')
                    ? 'bg-[#0F0C05] border-amber-500/40 text-amber-500 shadow-[0_0_20px_rgba(255,179,0,0.25)]'
                    : faction.faction_name.toLowerCase().includes('targaryen')
                      ? 'bg-[#141414] border-red-700/40 text-red-500 shadow-[0_0_20px_rgba(229,9,20,0.25)]'
                      : faction.faction_name.toLowerCase().includes('uzumaki')
                        ? 'bg-[#120A05] border-orange-500/40 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.25)]'
                        : faction.faction_name.toLowerCase().includes('japanese')
                          ? 'bg-[#1c080e] border-[#ff5e7e]/40 text-[#ff5e7e] shadow-[0_0_20px_rgba(255,94,126,0.25)]'
                          : faction.faction_name.toLowerCase().includes('uchiha')
                            ? 'bg-[#0c0103] border-[#ff003c]/40 text-[#ff003c] shadow-[0_0_20px_rgba(255,0,60,0.3)]'
                            : faction.faction_name.toLowerCase().includes('ackerman')
                              ? 'bg-[#1e222b] border-slate-500/40 text-[#4a90e2] shadow-[0_0_20px_rgba(74,144,226,0.15)]'
                              : 'bg-[#090e1f] border-yellow-400/50 text-yellow-400 shadow-[0_0_20px_rgba(255,215,0,0.25)]'
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
            <div className="w-32 h-32 rounded-full border-2 overflow-hidden bg-black/40 transition-all duration-300 border-[var(--faction-primary,rgba(220,38,38,0.3))] shadow-[0_0_30px_var(--faction-primary-glow,rgba(220,38,38,0.15))] font-[sans-serif]">
              <img 
                src={avatar_public_url || localFileBlobUrl || defaultPlaceholder} 
                key={avatar_public_url || localFileBlobUrl}
                className="w-full h-full object-cover" 
              />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border bg-black/75 border-[var(--faction-primary,rgba(220,38,38,0.5))]"
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
              onChange={handleFileSelected} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <div className="text-center md:text-left space-y-3 flex-1 w-full">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white flex flex-wrap items-center justify-center md:justify-start gap-4">
              Neural <span className="text-[var(--faction-primary,#E50914)]">Identity</span>
            </h1>
            <p className="text-sm font-mono font-black text-gray-300 tracking-widest uppercase md:text-left text-center break-all select-all flex items-center justify-center md:justify-start gap-1.5">
              <span>{(form.username || profile?.username || 'ANSHSURESHSINGH07').toUpperCase()} {faction?.faction_name ? `| ${faction.faction_name.toUpperCase()}` : ''}</span>
              <VerifiedBadge isVerified={profile?.is_verified} size={11} />
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <span className="text-[10px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border bg-white/5 text-gray-450 border-white/10">
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
                  className="h-full rounded-full bg-[var(--faction-primary,#E50914)]"
                />
              </div>
              <div className="flex justify-between items-center mt-1 text-[8px] font-mono text-gray-500 uppercase">
                <span>PROGRESS</span>
                <span>{100 - ((profile?.xp || 0) % 100)} XP TO LEVEL {(profile?.level || 1) + 1}</span>
              </div>
            </div>
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
                    : faction.faction_name.toLowerCase().includes('lannister')
                      ? 'from-[#211405] to-[#0a0400] border-amber-900/40 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
                      : faction.faction_name.toLowerCase().includes('baratheon')
                        ? 'from-[#191404] to-[#050401] border-amber-500/40 shadow-[0_0_30px_rgba(255,179,0,0.15)]'
                        : faction.faction_name.toLowerCase().includes('targaryen')
                          ? 'from-[#1a1a1a] to-[#0c0c0c] border-red-700/40 shadow-[0_0_30px_rgba(229,9,20,0.15)]'
                          : faction.faction_name.toLowerCase().includes('uzumaki')
                            ? 'from-[#1f0f05] to-[#0a0502] border-orange-500/40 shadow-[0_0_30px_rgba(249,115,22,0.15)]'
                            : faction.faction_name.toLowerCase().includes('japanese')
                              ? 'from-[#210910] to-[#0a0305] border-[#ff5e7e]/40 shadow-[0_0_30px_rgba(255,94,126,0.15)]'
                              : faction.faction_name.toLowerCase().includes('uchiha')
                                ? 'from-[#0c0103] to-[#000000] border-[#ff003c]/40 shadow-[0_0_30px_rgba(255,0,60,0.2)]'
                                : faction.faction_name.toLowerCase().includes('ackerman')
                                  ? 'from-[#252a36] to-[#101217] border-slate-500/40 shadow-[0_0_30px_rgba(74,144,226,0.1)]'
                                  : 'from-[#121b3a] to-[#050914] border-yellow-400/40 shadow-[0_0_30px_rgba(255,215,0,0.15)]'
            }`}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                    {getFactionEmoji(faction.faction_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest">CURRENT LEGION FILE ALIGNMENT</h3>
                      <span className="text-[8px] bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-black tracking-widest">
                        AUTHORIZED
                      </span>
                    </div>
                    <h2 className={`text-2xl font-black uppercase italic tracking-tighter mt-1 ${
                      faction.faction_name.toLowerCase().includes('akatsuki') 
                        ? 'text-red-500' 
                        : faction.faction_name.toLowerCase().includes('stark')
                          ? 'text-white'
                          : faction.faction_name.toLowerCase().includes('britannian')
                            ? 'text-purple-400'
                            : faction.faction_name.toLowerCase().includes('lannister')
                              ? 'text-amber-400'
                              : faction.faction_name.toLowerCase().includes('baratheon')
                                ? 'text-amber-500'
                                : faction.faction_name.toLowerCase().includes('targaryen')
                                  ? 'text-red-500'
                                  : faction.faction_name.toLowerCase().includes('uzumaki')
                                    ? 'text-orange-500'
                                    : faction.faction_name.toLowerCase().includes('japanese')
                                      ? 'text-[#ff5e7e]'
                                      : faction.faction_name.toLowerCase().includes('uchiha')
                                        ? 'text-[#ff003c]'
                                        : faction.faction_name.toLowerCase().includes('ackerman')
                                          ? 'text-[#4a90e2]'
                                          : 'text-yellow-400'
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
                        localStorage.removeItem('active_faction_name');
                        setFaction(null);
                        window.dispatchEvent(new Event('profiles-updated'));
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

        <form onSubmit={handleSave} className="bg-[#0f0f19]/70 backdrop-blur-md border border-white/10 rounded-[2rem] p-8 md:p-12 space-y-10 relative overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
          {/* Sci-fi corner telemetry crosshair brackets */}
          <div className="absolute top-4 left-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ + ]</div>
          <div className="absolute top-4 right-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ + ]</div>
          <div className="absolute bottom-4 left-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ * ]</div>
          <div className="absolute bottom-4 right-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ * ]</div>
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
              className="w-full md:w-auto bg-gradient-to-r from-red-600 via-red-500 to-red-600 hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 ease-out text-white px-10 py-4 rounded-xl font-mono font-black uppercase text-[11px] tracking-[0.16em] flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(220,38,38,0.35)] hover:shadow-[0_0_35px_rgba(220,38,38,0.6)] border border-red-500/25 disabled:opacity-50 overflow-hidden relative group"
            >
              <div className="absolute inset-0 pointer-events-none z-0" style={{ transform: 'skewX(-25deg) translateX(-150%)', opacity: 0.25, background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4) 50%, transparent)', animation: 'shimmerSweep 2.2s infinite linear' }} />
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span className="relative z-10">{saving ? 'SYNCHRONIZING...' : 'UPDATE SECURE NODE'}</span>
            </button>
          </div>
        </form>

        {/* Neural Intel Watchlist Tracker Panel */}
        <section className="bg-[#0f0f19]/70 backdrop-blur-md border border-white/10 rounded-[2.5rem] p-8 md:p-12 space-y-10 relative overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
           {/* Sci-fi corner telemetry crosshair brackets */}
           <div className="absolute top-4 left-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ + ]</div>
           <div className="absolute top-4 right-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ + ]</div>
           <div className="absolute bottom-4 left-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ * ]</div>
           <div className="absolute bottom-4 right-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ * ]</div>
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
                   Synchronize and monitor anime progression. Use the "Add to My Watchlist" prompt inside any database archive record to log items here.
                 </p>
              </div>
            )}
         </section>

         <section className="p-10 border border-white/10 rounded-[2.5rem] bg-[#0f0f19]/70 backdrop-blur-md relative overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
           {/* Sci-fi corner telemetry crosshair brackets */}
           <div className="absolute top-4 left-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ + ]</div>
           <div className="absolute top-4 right-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ + ]</div>
           <div className="absolute bottom-4 left-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ * ]</div>
           <div className="absolute bottom-4 right-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ * ]</div>
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-600/5 rounded-full blur-[100px]" />
           <h3 className="text-xs font-mono font-black uppercase tracking-widest text-white mb-8 flex items-center gap-2 relative z-10">
             <Shield size={14} className="text-red-500" /> SYSTEM METRICS NODE SLOTS
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
              <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-1 font-mono">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-black">LAST DATABASE SYNC</span>
                <p className="text-[11px] font-black text-gray-300 uppercase">
                  {fbUser?.metadata?.lastSignInTime ? new Date(fbUser.metadata.lastSignInTime).toLocaleString() : 'OFFLINE SECURE'}
                </p>
              </div>
              <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-1 font-mono">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-black">AUTHORIZATION PROFILE</span>
                <p className="text-[11px] font-black text-white uppercase">{profile?.role?.toUpperCase() || 'MEMBER'}</p>
              </div>
              <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-1 font-mono">
                <span className="text-[8px] text-zinc-500 uppercase tracking-widest block font-black">NODE CIPHER ENCRYPTION</span>
                <p className="text-[11px] font-black text-red-400 uppercase">RSA-4096 / SHA-256 [ACTIVE]</p>
              </div>
           </div>
        </section>

        {/* Isolated Cognitive integral calibration & Digital ID card section container - Clean & pristine */}
        <section className="bg-[#0f0f19]/75 backdrop-blur-md border border-red-500/20 rounded-[2.5rem] p-8 md:p-12 space-y-8 relative overflow-hidden shadow-[0_0_40px_rgba(220,38,38,0.15)]">
           <div className="absolute top-4 left-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ + ]</div>
           <div className="absolute top-4 right-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ + ]</div>
           <div className="absolute bottom-4 left-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ * ]</div>
           <div className="absolute bottom-4 right-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ * ]</div>
           <div className="absolute -top-20 -left-20 w-80 h-80 bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />

          {/* 🕹️ RETRO 2D TACTICAL ARCADE GAME SECTION */}
          <div className="space-y-4">
            <span className="text-red-500 font-mono text-[9px] uppercase tracking-[0.3em] font-black block mb-2">🕹️ COGNITIVE INTEGRAL CALIBRATION</span>
            <div className="border border-red-500/20 rounded-[2.5rem] bg-gradient-to-b from-[#0e0303] to-[#040101] p-6 md:p-8 relative overflow-hidden shadow-[0_0_35px_rgba(239,68,68,0.04)]">
              {/* Retro scanline & matrix visual overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.005),rgba(0,0,255,0.03))] bg-[size:100%_4px,3px_100%] opacity-40 pointer-events-none" />

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-white/5 relative z-10">
                <div>
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2 font-mono">
                    🕹️ NEURAL CHANNEL FACTION TRAINER
                  </h3>
                  <p className="text-xs text-gray-400 font-sans leading-relaxed max-w-xl">
                    Train your synapse response pathways by hitting active tactical node points. Aligning premium treasury cards increases rewards!
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-mono">
                    <span className="text-[8px] text-gray-500 block">TRAINER RECORD</span>
                    <span className="text-xs text-yellow-400 font-black tracking-wider">{gameHighscore} NODES</span>
                  </div>
                  {!gameActive ? (
                    <button
                      type="button"
                      onClick={startTrainerGame}
                      className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-mono text-[10px] font-black uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.3)] hover:scale-[1.03] active:scale-[0.98]"
                    >
                      {gameStatusText === 'FINISHED' ? '⚡ RE-CALIBRATE NEURALS' : '🕹️ START TRAINING MODE'}
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="px-4 py-2 bg-red-600/10 border border-red-500/30 rounded-lg text-center font-mono animate-pulse">
                        <span className="text-[8.5px] text-red-400 block tracking-widest font-black">TIME REMAINING</span>
                        <span className="text-lg text-white font-extrabold">{gameTimeLeft}s</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Game Screen Frame / Grid Area */}
              <div className="mt-6 relative h-[360px] md:h-[420px] bg-black/80 rounded-2xl border border-white/5 overflow-hidden select-none cursor-crosshair">
                <div className="absolute inset-0 bg-radial-gradient from-transparent to-black pointer-events-none" />
                
                {/* Horizontal & Vertical Retro Scope Grid Lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#111111_1px,transparent_1px),linear-gradient(to_bottom,#111111_1px,transparent_1px)] bg-[size:30px_30px]" />

                {gameStatusText === 'IDLE' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 relative z-10">
                    <span className="text-red-500 text-3xl animate-bounce">🕹️</span>
                    <div className="space-y-1">
                      <h4 className="font-mono text-xs font-black text-white tracking-[0.2em] uppercase">SYSTEM WAITING FOR TRIGGER</h4>
                      <p className="text-[10px] text-gray-500 max-w-xs leading-normal">
                        Synchronize cognitive telemetry before starting. Current active alignment multiplier: <strong className="text-emerald-400">x{getMultiplierAndPPH().multiplier}</strong> multiplier.
                      </p>
                    </div>
                    {getMultiplierAndPPH().isPremiumHouse && (
                      <div className="px-3 py-1 bg-yellow-400/10 border border-yellow-500/20 text-yellow-400 font-mono text-[8.5px] font-extrabold uppercase tracking-widest rounded-full animate-pulse">
                        🔥 PREMIUM ACTIVE: x3 BONUS REWARDS ACTIVE!
                      </div>
                    )}
                  </div>
                )}

                {gameStatusText === 'TRAINING' && (
                  <>
                    {/* Live score overlay */}
                    <div className="absolute top-4 left-4 font-mono z-20 space-y-1">
                      <span className="text-[8px] text-gray-500 block uppercase tracking-widest">ACTIVE NODES SECURED</span>
                      <span className="text-xl font-black text-emerald-400 tracking-wider flex items-center gap-1.5">
                        <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                        {gameScore}
                      </span>
                    </div>

                    <div className="absolute top-4 right-4 font-mono z-20 text-right space-y-1">
                      <span className="text-[8px] text-gray-500 block uppercase tracking-widest">NODE MULTIPLIER</span>
                      {getMultiplierAndPPH().isPremiumHouse ? (
                        <div className="px-2.5 py-1 bg-red-600/10 border border-red-500/40 rounded-lg text-center font-mono">
                          <span className="text-[10px] text-red-400 font-extrabold tracking-widest animate-pulse">
                            🔥 MULTIPLIER ACTIVE x3
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">STANDARD (x1 BASELINE)</span>
                      )}
                    </div>

                    {/* SPAWNING TARGETS */}
                    {gameTargets.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTargetClick(t.id, t.x, t.y, t.premium);
                        }}
                        style={{ left: `${t.x}%`, top: `${t.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 p-4 focus:outline-none focus:ring-0 group z-30"
                      >
                        <span className="absolute inset-0 rounded-full border border-teal-500/20 group-hover:border-teal-400/50 animate-ping" />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-mono text-[8.5px] font-black transition-all transform scale-100 group-hover:scale-110 active:scale-90 shadow-[0_0_15px_rgba(20,184,166,0.3)] ${
                          t.premium
                            ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                            : getMultiplierAndPPH().isPremiumHouse
                            ? 'bg-red-500/10 border-red-500 text-red-400'
                            : 'bg-teal-900/40 border-teal-400 text-teal-300'
                        }`}>
                          ◎
                        </div>
                      </button>
                    ))}

                    {/* EXPANDING PARTICLES WAVE EFFECT */}
                    {gameParticles.map(p => (
                      <div
                        key={p.id}
                        style={{ left: `${p.x}%`, top: `${p.y}%` }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 font-mono text-[10px] flex flex-col items-center select-none"
                      >
                        <span className={`animate-bounce ${p.color}`}>{p.text}</span>
                        <div className="w-10 h-10 border border-cyan-400/40 rounded-full animate-ping opacity-0" />
                      </div>
                    ))}
                  </>
                )}

                {gameStatusText === 'FINISHED' && (
                  <div className="absolute inset-0 bg-[#070101]/95 flex flex-col items-center justify-center p-6 text-center space-y-6 relative z-10 transition-all">
                    <div className="mx-auto w-16 h-16 bg-emerald-600/10 border border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 animate-pulse">
                      <span className="text-2xl font-black">✓</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-[0.25em] font-black block">CALIBRATION RUN COMPLETED</span>
                      <h2 className="text-xl font-black text-white uppercase italic tracking-tight font-mono">
                        COGNITIVE REWARDS HANDSHAKE GRANTED
                      </h2>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 max-w-sm w-full grid grid-cols-2 gap-4 divide-x divide-white/5">
                      <div className="text-center font-mono">
                        <span className="text-[8.5px] text-gray-500 uppercase tracking-wider block">NODES SECURED</span>
                        <span className="text-xl font-black text-white">{gameScore}</span>
                      </div>
                      <div className="text-center font-mono">
                        <span className="text-[8.5px] text-gray-500 uppercase tracking-wider block">XP CONVERTED & ADDED</span>
                        <span className="text-xl font-black text-yellow-400 animate-pulse">+{earnedXPBonus} XP</span>
                      </div>
                    </div>

                    <p className="text-[9.5px] text-gray-500 font-sans leading-relaxed max-w-xs">
                      The live profile telemetry database has processed the cognitive data. Check your Aligned Digital Identity Card live balance below!
                    </p>

                    <button
                      type="button"
                      onClick={startTrainerGame}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-[10px] font-extrabold uppercase tracking-[0.15em] rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:scale-102 active:scale-98"
                    >
                      🔁 START NEXT SESSION
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DIGITAL IDENTITY CARD SUB-COMPONENT */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <span className="text-red-500 font-mono text-[9px] uppercase tracking-[0.3em] font-black block mb-2">SECURE ENDPOINT INFRASTRUCTURE</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-black uppercase italic tracking-tighter text-white flex items-center gap-2 font-mono">
                  💳 Aligned Digital Identity Card
                </h3>
                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                  Your registered biometric keycard and neural theme inventory pass. Contains real-time credential handshakes, database clearances, and physical telemetry status.
                </p>
                
                {/* Micro-table tracking the user's unlocked house card list */}
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                  <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block mb-3 font-black">
                     📡 SYNCHRONIZED TELEMETRY INVENTORY CARD SLOTS:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {FACTION_OPTIONS.map((opt) => {
                      const hId = getHouseIdFromName(opt.name);
                      const isUnlocked = true;
                      return (
                        <div 
                          key={opt.name}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-mono tracking-wider transition-all cursor-default uppercase bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold"
                        >
                          <span>{opt.emoji}</span>
                          <span className="font-bold">{opt.name.replace(' Network', '').replace(' House', '')}</span>
                          <span className="text-[7.5px] opacity-70">[ ⚡ SYNCED & ACTIVE ]</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* The I.D. Card security pass frame itself */}
              <div className="relative overflow-hidden group rounded-[2rem] border border-red-500/30 bg-[#070101] p-6 shadow-[0_0_30px_rgba(239,68,68,0.15)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(239,68,68,0.3)]">
                {/* Advanced Holographic light reflections & Shimmer Sweep */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem] z-10">
                  <div 
                    className="absolute -inset-y-20 -inset-x-20 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2) 50%, transparent)',
                      animation: 'shimmerSweep 3.2s infinite linear',
                    }}
                  />
                  {/* Cyber grid overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:10px_10px] opacity-20" />
                </div>

                {/* Cyberpunk Scanner Lines & Background details */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] opacity-20 pointer-events-none" />

                {/* Top Badge Title Header */}
                <div className="flex items-center justify-between border-b border-red-500/20 pb-4 mb-4 relative z-20">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="font-mono text-[9px] text-red-500 tracking-[0.2em] font-black">
                      NEXUS PASS SECURE v4.11
                    </span>
                  </div>
                  <span className="text-[14px] leading-none select-none">
                    {getFactionEmoji(faction?.faction_name)}
                  </span>
                </div>

                {/* ID Frame Core Face Content */}
                <div className="flex flex-col gap-4 relative z-20">
                  {/* Row 1: Biometric Photo Thumbnail & Identity Details */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl border border-red-500/40 p-0.5 bg-black/60 shrink-0 overflow-hidden shadow-inner">
                      <img 
                        src={avatar_public_url || localFileBlobUrl || defaultPlaceholder} 
                        key={avatar_public_url || localFileBlobUrl}
                        alt="Security Pass Biometrics"
                        className="w-full h-full object-cover rounded-xl font-[sans-serif]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultPlaceholder;
                        }}
                      />
                    </div>
                    <div className="space-y-1 overflow-hidden">
                      <div className="text-[8px] font-mono text-gray-500 uppercase tracking-widest leading-none">
                        Biometric Subject:
                      </div>
                      <div className="font-mono text-xs font-black text-white uppercase truncate tracking-tight">
                        ANSHSURESHSINGH07
                      </div>
                      <div className="text-[9px] font-mono text-red-400 truncate leading-none mt-0.5">
                        @ANSHSURESHSINGH07
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Tactical rank, balances, status information */}
                  <div className="space-y-3 bg-black/80 border border-white/5 rounded-xl p-3 font-mono">
                    <div>
                      <span className="text-[8px] text-gray-500 uppercase tracking-widest block leading-none mb-1">
                        Tactical Clearance / Rank:
                      </span>
                      <span className="text-[10px] font-black text-yellow-400 uppercase tracking-wide flex items-center gap-1 leading-normal">
                        👑 ADMIN • ELITE WARLOCK
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-2 mt-2">
                      <div>
                        <span className="text-[7px] text-gray-500 uppercase block tracking-wider">
                          Telemetry Bal:
                        </span>
                        <span className="text-[10px] font-black text-white block mt-0.5">
                          9999 LVL
                        </span>
                      </div>
                      <div>
                        <span className="text-[7px] text-gray-500 uppercase block tracking-wider">
                          Active XP:
                        </span>
                        <span className="text-[10px] font-bold text-red-400 block mt-0.5">
                          9999 XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footing barcode lookalike or indicator */}
                  <div className="border-t border-red-500/20 pt-3 flex items-center justify-between text-[8px] font-mono">
                    <div className="text-gray-400 uppercase font-black">
                      ALLIANCE SYNC STATUS:
                    </div>
                    <div className="text-emerald-400 font-bold tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      OK // ONLINE
                    </div>
                  </div>

                  {/* Aesthetic laser security key code strip */}
                  <div className="bg-red-500/[0.03] border border-red-500/10 rounded py-1 text-center font-mono text-[7px] text-red-500/70 tracking-[0.25em] font-extrabold uppercase select-none">
                    * {profile?.user_id || user?.id} *
                  </div>

                </div>
              </div>
            </div>
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

      {/* Interactive Faction Lock Warning Popup Modal */}


      {/* Interactive Photo Cropping Overlay Modal */}
      <AnimatePresence>
        {showCropModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-zinc-950 border border-red-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(229,9,20,0.15)]"
            >
              {/* Header */}
              <div className="p-5 border-b border-zinc-900 bg-black/40 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase font-black tracking-[0.2em] text-[#E50914] flex items-center gap-2">
                  <Sparkles size={14} className="animate-pulse" /> Neural Photo Crop
                </span>
                <button 
                  onClick={() => setShowCropModal(false)}
                  type="button"
                  className="text-zinc-500 hover:text-white font-mono text-[9px] uppercase tracking-widest hover:underline transition-colors"
                >
                  Cancel
                </button>
              </div>

              {/* Viewport Frame with Adjustable Mask Overlay */}
              <div className="p-8 flex flex-col items-center justify-center space-y-6">
                <div className="relative w-80 h-80 rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-900">
                  <Cropper
                    image={cropImageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={true}
                    onCropChange={setCrop}
                    onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                    onZoomChange={setZoom}
                    classes={{
                      containerClassName: "bg-zinc-950",
                      mediaClassName: "max-w-none opacity-85",
                      cropAreaClassName: "border-2 border-[#E50914] rounded-full shadow-[0_0_40px_rgba(229,9,20,0.3)]"
                    }}
                  />
                </div>

                {/* Micro-Adjustment sliders */}
                <div className="w-full space-y-4">
                  {/* Zoom Controller */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-[0.1em]">
                      <span>Calibration Focal Range</span>
                      <span className="text-[#E50914]">{(zoom * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        type="button"
                        onClick={() => setZoom(prev => Math.max(1, prev - 0.1))}
                        className="w-7 h-7 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center font-mono text-sm tracking-tighter hover:bg-zinc-850 transition-colors"
                      >
                        -
                      </button>
                      <input 
                        type="range"
                        min="1"
                        max="3"
                        step="0.05"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1 accent-[#E50914] h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <button 
                        type="button"
                        onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
                        className="w-7 h-7 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center font-mono text-sm tracking-tighter hover:bg-zinc-850 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="text-[9px] font-mono text-zinc-500 text-center uppercase tracking-widest leading-relaxed">
                    ⚙️ Drag biosensor relative plane or slide to adjust frame
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-5 bg-zinc-900/40 border-t border-zinc-900/60 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowCropModal(false)}
                  className="px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-zinc-400 hover:text-white transition-all bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-850"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  onClick={handleCropConfirm}
                  className="px-5 py-2 rounded-xl font-mono text-[9px] uppercase font-black tracking-widest bg-[#E50914] text-white hover:bg-red-700 hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_15px_rgba(229,9,20,0.4)]"
                >
                  Apply Adjustment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
   </div>
  );
}
