import { useState, useEffect, createContext, useContext } from 'react';
import { ThemeEngineProvider, useThemeEngine } from './context/ThemeEngineContext';
import { playDigitalSound } from './lib/sounds';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation 
} from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Database as DatabaseIcon, 
  UserPlus as RecruitIcon, 
  ShieldCheck as AdminIcon,
  Search,
  User as UserIcon,
  LogOut,
  Bell,
  Menu,
  X,
  Flame,
  User,
  FileText,
  Trophy,
  Crown,
  Sparkles,
  Zap,
  Check,
  Copy,
  ArrowLeft,
  Upload,
  Landmark,
  MessageSquare,
  ShieldAlert,
  Terminal,
  Library,
  Compass,
  Swords,
  Coins,
  Award,
  Calendar,
  Radio,
  Target,
  Settings2,
  Archive,
  Cpu,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { syncAndEnrichProfile, getStoredProfileExt, upgradeToPremium } from './lib/profileSync';
import Leaderboard from './pages/Leaderboard';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, registerPushNotifications } from './lib/firebase';
import { CommandPalette } from './components/CommandPalette';

// Pages
import Home from './pages/Home';
import Archives from './pages/Archives';
import NeuralMaps from './pages/NeuralMaps';
import FactionWar from './pages/FactionWar';
import Marketplace from './pages/Marketplace';
import SkillTree from './pages/SkillTree';
import EventHorizon from './pages/EventHorizon';
import DataRelay from './pages/DataRelay';
import SquadOps from './pages/SquadOps';
import TerminalLogs from './pages/TerminalLogs';
import NodeSettings from './pages/NodeSettings';

// God-Level Mainframe Pages
import CoreProcessingUnit from './pages/CoreProcessingUnit';
import SectorTacticalMaps from './pages/SectorTacticalMaps';
import ArchivesIntelHub from './pages/ArchivesIntelHub';
import NexusTreasury from './pages/NexusTreasury';
import VanguardCommand from './pages/VanguardCommand';

const getFactionEmoji = (name?: string) => {
  if (!name) return '🔰';
  const n = name.trim().toLowerCase();
  if (n.includes('akatsuki')) return '☁️';
  if (n.includes('stark')) return '🛡️';
  if (n.includes('britannian') || n.includes('empire') || n.includes('holy')) return '👑';
  if (n.includes('lannister')) return '🦁';
  return '🔰';
};

const getFactionStyleCSS = (factionName?: string, isSummerActive?: boolean) => {
  const name = factionName ? factionName.trim().toLowerCase() : '';
  
  let primary = '#FF0000';
  let primaryGlow = 'rgba(255, 0, 0, 0.4)';
  let bg = '#050505';
  let panelBg = '#0A0A0A';
  let border = '#1F1F1F';
  let extraStyles = '';

  if (name.includes('akatsuki')) {
    primary = '#E50914';
    primaryGlow = 'rgba(229, 9, 20, 0.6)';
    bg = '#0C0C0C';
    panelBg = '#141416';
    border = 'rgba(229, 9, 20, 0.3)';
    extraStyles = `
      body, #root, .flex.h-screen {
        background-color: #0C0C0C !important;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb, ::-webkit-scrollbar-thumb {
        background: #E50914 !important;
      }
      * {
        scrollbar-color: #E50914 #141416 !important;
      }
      /* neon red box shadow glows */
      .faction-box-glow, button:focus, .card-glow {
        box-shadow: 0 0 15px rgba(229, 9, 20, 0.4) !important;
      }
    `;
  } else if (name.includes('stark')) {
    if (isSummerActive) {
      primary = '#F59E0B';
      primaryGlow = 'rgba(245, 158, 11, 0.45)';
      bg = '#1c1204';
      panelBg = '#2d1e0a';
      border = '#F59E0B';
      extraStyles = `
        body, #root, .flex.h-screen {
          background-color: #1c1204 !important;
          transition: all 0.7s ease-in-out;
        }
        ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #F59E0B !important;
        }
        * {
          scrollbar-color: #F59E0B #1c1204 !important;
        }
        /* thermal heat-wave text glow */
        h1, h2, h3, .title-text {
          text-shadow: 0 0 15px rgba(245, 158, 11, 0.8), 0 0 4px rgba(245, 158, 11, 0.5) !important;
          transition: all 0.7s ease-in-out;
        }
        p, span, label, a, button {
          text-shadow: 0 0 6px rgba(245, 158, 11, 0.3) !important;
          transition: all 0.7s ease-in-out;
        }
        /* scale-up ripple effect animation applied to backdrops contextually */
        .cyber-card, .faction-themed-panel, aside, header {
          transition: all 0.7s ease-in-out !important;
        }
      `;
    } else {
      primary = '#A5F3FC';
      primaryGlow = 'rgba(165, 243, 252, 0.4)';
      bg = '#111822';
      panelBg = '#1F2937';
      border = 'rgba(165, 243, 252, 0.25)';
      extraStyles = `
        body, #root, .flex.h-screen {
          background-color: #111822 !important;
          transition: all 0.7s ease-in-out;
        }
        ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #A5F3FC !important;
        }
        * {
          scrollbar-color: #A5F3FC #111822 !important;
        }
        /* freezing light shadow text effects */
        h1, h2, h3, .title-text {
          text-shadow: 0 0 12px rgba(165, 243, 252, 0.55), 0 0 2px rgba(165, 243, 252, 0.8) !important;
          transition: all 0.7s ease-in-out;
        }
        p, span, label, a, button {
          text-shadow: 0 0 4px rgba(165, 243, 252, 0.2) !important;
          transition: all 0.7s ease-in-out;
        }
      `;
    }
  } else if (name.includes('britannian') || name.includes('empire') || name.includes('holy')) {
    primary = '#A855F7';
    primaryGlow = 'rgba(168, 85, 247, 0.5)';
    bg = '#0D061A';
    panelBg = '#1E1233';
    border = '#F59E0B';
    extraStyles = `
      body, #root, .flex.h-screen {
        background-color: #0D061A !important;
      }
      ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #A855F7 !important;
      }
      * {
        scrollbar-color: #A855F7 #1E1233 !important;
      }
      /* Regal velvet framing override on panels */
      aside, .bg-\\[\\#0A0A0A\\], .bg-\\[\\#111\\], .bg-\\[\\#17171B\\], .bg-[#0A0A0A], .faction-themed-panel {
        background-color: #1E1233 !important;
        border: 2px solid #F59E0B !important;
        box-shadow: 0 0 25px rgba(168, 85, 247, 0.2) !important;
      }
      .border-r { border-right-color: #F59E0B !important; }
      .border-b { border-bottom-color: #F59E0B !important; }
      .border-t { border-top-color: #F59E0B !important; }
    `;
  } else if (name.includes('lannister')) {
    primary = '#DC2626';
    primaryGlow = 'rgba(220, 38, 38, 0.5)';
    bg = '#140303';
    panelBg = '#260B0B';
    border = '#F59E0B';
    extraStyles = `
      body, #root, .flex.h-screen {
        background-color: #140303 !important;
      }
      ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #DC2626 !important;
      }
      * {
        scrollbar-color: #DC2626 #260B0B !important;
      }
      /* Amber glowing text nodes override */
      h1, h2, h3, a, button, span, .text-white {
        color: #F59E0B !important;
        text-shadow: 0 0 10px rgba(245, 158, 11, 0.6) !important;
      }
      .bg-\\[\\#FF0000\\], .bg-red-650\\/10, .bg-[#FF0000] {
        background-color: #DC2626 !important;
        color: #F59E0B !important;
        border: 1.5px solid #F59E0B !important;
        box-shadow: 0 0 15px rgba(245, 158, 11, 0.45) !important;
      }
      .bg-\\[\\#0C0C0C\\], .bg-\\[\\#050505\\], .bg-black {
        background-color: #140303 !important;
      }
      aside, .bg-\\[\\#0A0A0A\\], .bg-[#0A0A0A] {
        background-color: #260B0B !important;
        border-color: #F59E0B !important;
      }
    `;
  } else if (name.includes('baratheon')) {
    primary = '#FFB300';
    primaryGlow = 'rgba(255, 179, 0, 0.45)';
    bg = '#0F0C05';
    panelBg = '#191407';
    border = '#FFB300';
    extraStyles = `
      body, #root, .flex.h-screen {
        background-color: #0F0C05 !important;
      }
      ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #FFB300 !important;
      }
      * {
        scrollbar-color: #FFB300 #191407 !important;
      }
      /* heavy royal double borders and gold glows */
      aside, .cyber-card, .faction-themed-panel {
        background-color: #191407 !important;
        border: 2px double #FFB300 !important;
        box-shadow: 0 0 20px rgba(255, 179, 0, 0.25) !important;
      }
      .text-white {
        color: #FFE699 !important;
        text-shadow: 0 0 8px rgba(255, 179, 0, 0.35) !important;
      }
      .faction-box-glow, button:focus, .card-glow {
        box-shadow: 0 0 20px rgba(255, 179, 0, 0.4) !important;
      }
    `;
  } else if (name.includes('targaryen')) {
    primary = '#E50914';
    primaryGlow = 'rgba(229, 9, 20, 0.55)';
    bg = '#141414';
    panelBg = '#1C1C1C';
    border = '#E50914';
    extraStyles = `
      body, #root, .flex.h-screen {
        background-color: #141414 !important;
      }
      ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #E50914 !important;
      }
      * {
        scrollbar-color: #E50914 #1C1C1C !important;
      }
      /* matte charcoal, piercing red glows, red trim */
      aside, .cyber-card, .faction-[#0A0A0A], .faction-themed-panel {
        background-color: #1A1A1A !important;
        border-color: rgba(229, 9, 20, 0.35) !important;
      }
      .faction-box-glow, button:focus, .card-glow {
        box-shadow: 0 0 25px rgba(229, 9, 20, 0.5) !important;
      }
      h1, h2, h3, .title-text {
        text-shadow: 0 0 8px rgba(229, 9, 20, 0.6) !important;
      }
    `;
  } else if (name.includes('uzumaki')) {
    primary = '#FF6600';
    primaryGlow = 'rgba(255, 102, 0, 0.5)';
    bg = '#120A05';
    panelBg = '#1F1109';
    border = '#FF6600';
    extraStyles = `
      body, #root, .flex.h-screen {
        background-color: #120A05 !important;
      }
      ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #FF6600 !important;
      }
      * {
        scrollbar-color: #FF6600 #1F1109 !important;
      }
      /* neon orange highlights & scroll-like elegant borders */
      aside, .cyber-card, .faction-themed-panel {
        background-color: #1c1008 !important;
        border: 1px solid #FF6600 !important;
        border-radius: 8px !important;
      }
      .faction-box-glow, button:focus, .card-glow {
        box-shadow: 0 0 18px rgba(255, 102, 0, 0.45) !important;
      }
    `;
  } else if (name.includes('japanese')) {
    primary = '#ff5e7e';
    primaryGlow = 'rgba(255, 94, 126, 0.5)';
    bg = '#1c080e';
    panelBg = '#260b13';
    border = '#ff5e7e';
    extraStyles = `
      body, #root, .flex.h-screen {
        background-color: #1c080e !important;
      }
      ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #ff5e7e !important;
      }
      * {
        scrollbar-color: #ff5e7e #260b13 !important;
      }
      /* Sakura and scroll-themed backgrounds */
      aside, .cyber-card, .faction-themed-panel {
        background-color: #260b13 !important;
        border-color: #ff5e7e !important;
      }
      .faction-box-glow, button:focus, .card-glow {
        box-shadow: 0 0 18px rgba(255, 94, 126, 0.45) !important;
      }
    `;
  } else if (name.includes('uchiha')) {
    primary = '#ff003c';
    primaryGlow = 'rgba(255, 0, 60, 0.6)';
    bg = '#000000';
    panelBg = '#0c0103';
    border = '#ff003c';
    extraStyles = `
      body, #root, .flex.h-screen {
        background-color: #000000 !important;
      }
      ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #ff003c !important;
      }
      * {
        scrollbar-color: #ff003c #0c0103 !important;
      }
      /* absolute black panels, sharingan pulsing */
      aside, .cyber-card, .faction-themed-panel {
        background-color: #050001 !important;
        border-color: rgba(255, 0, 60, 0.3) !important;
        box-shadow: 0 0 12px rgba(255, 0, 60, 0.15) !important;
      }
      @keyframes sharingan-pulse {
        0%, 100% { box-shadow: 0 0 8px rgba(255, 0, 60, 0.15); border-color: rgba(255,0,60,0.3); }
        50% { box-shadow: 0 0 22px rgba(255, 0, 60, 0.55); border-color: rgba(255,0,60,0.7); }
      }
      aside, .cyber-card, .faction-themed-panel {
        animation: sharingan-pulse 4s infinite ease-in-out !important;
      }
    `;
  } else if (name.includes('ackerman')) {
    primary = '#4a90e2';
    primaryGlow = 'rgba(74, 144, 226, 0.45)';
    bg = '#1e222b';
    panelBg = '#252a36';
    border = '#4a90e2';
    extraStyles = `
      body, #root, .flex.h-screen {
        background-color: #1e222b !important;
      }
      ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #4a90e2 !important;
      }
      * {
        scrollbar-color: #4a90e2 #252a36 !important;
      }
      /* tactical slate gray, steel-blue lines */
      aside, .cyber-card, .faction-themed-panel {
        background-color: #252a36 !important;
        border: 1px solid #3b485d !important;
      }
    `;
  } else if (name.includes('saiyan')) {
    primary = '#ffd700';
    primaryGlow = 'rgba(255, 215, 0, 0.5)';
    bg = '#090e1f';
    panelBg = '#121b3a';
    border = '#00bfff';
    extraStyles = `
      body, #root, .flex.h-screen {
        background-color: #090e1f !important;
      }
      ::-webkit-scrollbar-thumb, .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #ffd700 !important;
      }
      * {
        scrollbar-color: #ffd700 #121b3a !important;
      }
      /* dark cosmic navy backdrop, aura gold titles, electric blue accents */
      aside, .cyber-card, .faction-themed-panel {
        background-color: #0e1630 !important;
        border: 1.5px solid #00bfff !important;
        box-shadow: 0 0 15px rgba(0, 191, 255, 0.15) !important;
      }
      h1, h2, h3, .title-text {
        text-shadow: 0 0 12px rgba(255, 215, 0, 0.6) !important;
      }
    `;
  }

  return `
    :root {
      --faction-primary: ${primary};
      --faction-primary-glow: ${primaryGlow};
      --faction-bg: ${bg};
      --faction-panel-bg: ${panelBg};
      --faction-border: ${border};
    }
    
    body, #root, .flex.h-screen {
      background-color: var(--faction-bg) !important;
    }
    
    /* Input and form controls dynamic focusing accent */
    input:focus, textarea:focus, select:focus {
      border-color: var(--faction-primary) !important;
      box-shadow: 0 0 10px var(--faction-primary-glow) !important;
    }

    button:focus {
      outline: none !important;
      border-color: var(--faction-primary) !important;
    }
    
    .text-faction-primary {
      color: var(--faction-primary) !important;
    }
    
    .bg-faction-primary {
      background-color: var(--faction-primary) !important;
    }
    
    .border-faction-primary {
      border-color: var(--faction-primary) !important;
    }
    
    .shadow-faction-glow {
      box-shadow: 0 0 12px var(--faction-primary-glow) !important;
    }

    ${extraStyles}
  `;
};
import AnimeDatabase from './pages/Database';
import Recruitment from './pages/Recruitment';
import Admin from './pages/Admin';
import AnimeDetails from './pages/AnimeDetails';
import AuthPage from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import News from './pages/News';
import Profile from './pages/Profile';
import NewsDetail from './pages/NewsDetail';
import LegalPage from './pages/Legal';
import HouseCards from './pages/HouseCards';
import SolarFlareOverlay from './components/SolarFlareOverlay';

export interface NewsContextType {
  activeArticle: any | null;
  setActiveArticle: (article: any | null) => void;
  breakingNews: any;
  setBreakingNews: (news: any) => void;
}

export const NewsContext = createContext<NewsContextType | undefined>(undefined);

export function useNews() {
  const context = useContext(NewsContext);
  if (!context) {
    return {
      activeArticle: null,
      setActiveArticle: () => {},
      breakingNews: { id: 1, text: "VANGUARD OPS: ARCHIVES SYSTEM EXPANSION INITIALIZED" },
      setBreakingNews: () => {}
    };
  }
  return context;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [extendedNavOpen, setExtendedNavOpen] = useState(() => {
    return localStorage.getItem('vanguard_extended_nav_open') === 'true';
  });
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('vanguard_guest_session') === 'true');
  const isActualAdmin = firebaseUser && firebaseUser.email === 'anshsureshsingh07@gmail.com';
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [headerLocalBlob, setHeaderLocalBlob] = useState<string>('');
  const [currentUserFaction, setCurrentUserFaction] = useState<any>(() => {
    const cachedName = localStorage.getItem('active_faction_name');
    return cachedName ? { faction_name: cachedName, faction_rank: 'Legionnaire', faction_xp: 100 } : null;
  });
  const [isStarkSummer, setIsStarkSummer] = useState(() => localStorage.getItem('stark_summer_active') === 'true');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const location = useLocation();

  // Void Descent Cinematic Entry states
  const [descentState, setDescentState] = useState<'flash' | 'descending' | 'settled'>('flash');
  const [flashOpacity, setFlashOpacity] = useState(1);
  const [dustParticles, setDustParticles] = useState<any[]>([]);

  useEffect(() => {
    if (!loadingAuth) {
      // Allocate randomized dust vectors
      const generated = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: 2.5 + Math.random() * 3.5,
        size: Math.random() > 0.6 ? '1.5px' : '1px',
        opacity: 0.15 + Math.random() * 0.45,
        delay: Math.random() * 1.5,
      }));
      setDustParticles(generated);

      // Flash hold 100ms, then quick fade out
      const flashTimer = setTimeout(() => {
        setFlashOpacity(0);
      }, 100);

      const startDescentTimer = setTimeout(() => {
        setDescentState('descending');
      }, 250);

      const finishDescentTimer = setTimeout(() => {
        setDescentState('settled');
        playDigitalSound('ping');
      }, 2400);

      return () => {
        clearTimeout(flashTimer);
        clearTimeout(startDescentTimer);
        clearTimeout(finishDescentTimer);
      };
    }
  }, [loadingAuth]);

  // Play digital whir on page transition
  useEffect(() => {
    playDigitalSound('whir');
  }, [location.pathname]);

  // Mainframe security overlay status and inactivity standby states
  const [securityGlitch, setSecurityGlitch] = useState(false);
  const [isInactive, setIsInactive] = useState(false);
  const [securityPingCount, setSecurityPingCount] = useState(0);

  // Periodic security glitch trigger
  useEffect(() => {
    const triggerGlitch = () => {
      setSecurityGlitch(true);
      setTimeout(() => {
        setSecurityGlitch(false);
      }, 550); // Glitch lasts 550ms
    };

    const interval = setInterval(() => {
      // 35% chance to glitch every 8 seconds
      if (Math.random() < 0.35) {
        triggerGlitch();
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Idle Standby Controller (Dims screen upon 40 seconds of absolute zero activity)
  useEffect(() => {
    let idleTimer: any;
    const resetIdleTimer = () => {
      setIsInactive(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsInactive(true);
      }, 40000); 
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keydown', resetIdleTimer);
    window.addEventListener('scroll', resetIdleTimer, { passive: true });
    window.addEventListener('click', resetIdleTimer);

    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keydown', resetIdleTimer);
      window.removeEventListener('scroll', resetIdleTimer);
      window.removeEventListener('click', resetIdleTimer);
    };
  }, []);

  // News global states
  const [activeArticle, setActiveArticle] = useState<any | null>(null);
  const [breakingNews, setBreakingNews] = useState<any>({
    id: 1,
    text: "VANGUARD OPS: ARCHIVES SYSTEM EXPANSION INITIALIZED"
  });

  // Automatically fetch breaking news globally
  useEffect(() => {
    let isMounted = true;
    const fetchBreaking = async () => {
      try {
        const { data: bnData } = await supabase
          .from('breaking_news')
          .select('*')
          .eq('id', 1)
          .maybeSingle();
        if (bnData && isMounted) {
          setBreakingNews(bnData);
        } else if (!bnData && isMounted) {
          const defaultBN = { id: 1, text: "Vanguard Ops: Archives System Expansion Initialized" };
          const { data: insertedBN } = await supabase.from('breaking_news').insert([defaultBN]).select().single();
          if (insertedBN && isMounted) {
            setBreakingNews(insertedBN);
          }
        }
      } catch (err) {
        console.warn('Unable to query breaking_news globally:', err);
      }
    };
    fetchBreaking();
    return () => {
      isMounted = false;
    };
  }, []);

  const clearActiveArticle = () => {
    setActiveArticle(null);
  };

  // Clear active article context when navigating away from news details
  useEffect(() => {
    // Automatically check if we are on an explicit article view route
    // If not, instantly flush the context back to the active breaking news or main fallback text
    if (!location.pathname.includes('/news/')) {
      clearActiveArticle(); 
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleSummerChange = (e: any) => {
      setIsStarkSummer(e.detail);
    };
    window.addEventListener('stark-summer-change', handleSummerChange);
    return () => {
      window.removeEventListener('stark-summer-change', handleSummerChange);
    };
  }, []);

  // Handswipe Gesture System specifically for Mobile Users to Open / Close Navigation Sidebar
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    const swipeThreshold = 50; // minimum distance in px to register a swipe
    const edgeThreshold = 60;  // must start swipe from the extreme left edge of screen to open the sidebar

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return; // only track single-finger gestures
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Ensure gesture was primarily horizontal (horizontal displacement 1.5x greater than vertical)
      if (Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (Math.abs(diffX) > swipeThreshold) {
          if (diffX > 0) {
            // Swiped right: open menu if swipe started near the left edge of the screen
            if (!isSidebarOpen && touchStartX <= edgeThreshold) {
              setIsSidebarOpen(true);
            }
          } else {
            // Swiped left: close menu if sidebar is currently open
            if (isSidebarOpen) {
              setIsSidebarOpen(false);
            }
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSidebarOpen]);

  // Dynamic Release Tracker States
  const [isReleaseTrackerDrawerOpen, setIsReleaseTrackerDrawerOpen] = useState(false);
  const [trackerReleases, setTrackerReleases] = useState<any[]>([]);
  const [editingTrackerId, setEditingTrackerId] = useState<string | null>(null);
  const [trackerForm, setTrackerForm] = useState({ title: '', release_date: '', episode: 1, platform: 'OUT NOW' });
  const [isAddingTracker, setIsAddingTracker] = useState(false);

  const fetchTrackerReleases = async () => {
    try {
      const { data } = await supabase
        .from('release_tracker')
        .select('*')
        .order('release_date', { ascending: true });
      if (data) {
        setTrackerReleases(data);
      }
    } catch (err) {
      console.warn('Failed to fetch release_tracker rows:', err);
    }
  };

  const fetchLocalUserFaction = async (userId: string) => {
    const activeUserId = userId || firebaseUser?.uid || auth.currentUser?.uid;
    if (!activeUserId) {
      setCurrentUserFaction(null);
      return;
    }

    try {
      const { data } = await supabase
        .from('user_factions')
        .select('*')
        .eq('user_id', activeUserId)
        .maybeSingle();
      if (data) {
        setCurrentUserFaction(data);
      } else {
        setCurrentUserFaction(null);
      }
    } catch (err) {
      console.warn('Failed to fetch personal faction in App.tsx:', err);
    }
  };

  useEffect(() => {
    fetchTrackerReleases();
  }, [isReleaseTrackerDrawerOpen]);

  const handleSaveTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerForm.title || !trackerForm.release_date) return;

    try {
      const payload = {
        title: trackerForm.title,
        release_date: new Date(trackerForm.release_date).toISOString(),
        episode: Number(trackerForm.episode) || 1,
        platform: trackerForm.platform || 'OUT NOW'
      };

      if (editingTrackerId) {
        const { error } = await supabase
          .from('release_tracker')
          .update(payload)
          .eq('id', editingTrackerId);
        if (!error) {
          setEditingTrackerId(null);
          setTrackerForm({ title: '', release_date: '', episode: 1, platform: 'OUT NOW' });
          fetchTrackerReleases();
        }
      } else {
        const { error } = await supabase
          .from('release_tracker')
          .insert([payload]);
        if (!error) {
          setIsAddingTracker(false);
          setTrackerForm({ title: '', release_date: '', episode: 1, platform: 'OUT NOW' });
          fetchTrackerReleases();
        }
      }
    } catch (err) {
      console.error('Error modifying release_tracker:', err);
    }
  };

  const handleDeleteTracker = async (id: string) => {
    try {
      const { error } = await supabase.from('release_tracker').delete().eq('id', id);
      if (!error) {
        fetchTrackerReleases();
      }
    } catch (err) {
      console.error('Error deleting release_tracker:', err);
    }
  };

  useEffect(() => {
    const handleGuestSync = () => {
      setIsGuest(localStorage.getItem('vanguard_guest_session') === 'true');
    };
    window.addEventListener('guest-login-sync', handleGuestSync);
    return () => {
      window.removeEventListener('guest-login-sync', handleGuestSync);
    };
  }, []);

  useEffect(() => {
    // Firebase auth listener
    const unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoadingAuth(false);
      if (user?.uid) {
        // Hydrate from localStorage immediately to prevent flicker
        const cached = localStorage.getItem('cached_avatar_url_' + user.uid) || localStorage.getItem('cached_avatar_url_' + user.uid);
        if (cached) {
          setDbUser((prev: any) => {
            if (prev) {
              return { ...prev, avatar_url: cached, profile_photo_url: cached };
            }
            return { 
              id: user.uid, 
              email: user.email, 
              username: user.email?.split('@')[0] || '', 
              avatar_url: cached, 
              profile_photo_url: cached 
            };
          });
        }
        fetchProfileById(user.uid);
        registerPushNotifications(user.uid).catch((err) => {
          console.warn('Error self-registering push notifications:', err);
        });
      } else if (user?.email) {
        fetchProfileByEmail(user.email);
      } else {
        setDbUser(null);
      }
    });

    // Supabase session listener for RLS / Supabase features
    supabase.auth.getSession().then((res) => {
      setSupabaseSession(res?.data?.session || null);
    }).catch((err) => {
      console.warn('Failed to load initial Supabase session:', err);
      setSupabaseSession(null);
    });

    const listener = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session || null);
    });
    const subscription = listener?.data?.subscription || (listener as any)?.subscription;

    return () => {
      unsubscribeFirebase();
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    const handleProfileUpdate = (e: any) => {
      fetchLocalUserFaction(firebaseUser?.uid || '');
      if (e?.detail?.blobUrl) {
        setHeaderLocalBlob(e.detail.blobUrl);
      }
      if (firebaseUser?.uid) {
        fetchProfileById(firebaseUser.uid);
      } else if (firebaseUser?.email) {
        fetchProfileByEmail(firebaseUser.email);
      }
    };

    window.addEventListener('profiles-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profiles-updated', handleProfileUpdate);
    };
  }, [firebaseUser]);

  const fetchProfileById = async (userId: string) => {
    fetchLocalUserFaction(userId);
    let session = null;
    try {
      const res = await supabase.auth.getSession();
      session = res?.data?.session || null;
    } catch (e) {
      console.warn('Failed to get session in fetchProfileById:', e);
    }

    // Query user_profiles database table first to pull avatar_public_url for persistence
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
      console.warn('user_profiles retrieval by ID in App bypassed/failed:', upErr);
    }

    const cachedAvatar = userProfilesAvatar || localStorage.getItem('cached_avatar_url_' + userId);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    const adminEmails = ['anshsureshsingh07@gmail.com', 'animeintofficial@gmail.com'];
    const sessionEmail = session?.user?.email || firebaseUser?.email;

    if (data) {
      const enriched = await syncAndEnrichProfile(data, userId);
      if (cachedAvatar) {
        enriched.avatar_url = cachedAvatar;
        enriched.profile_photo_url = cachedAvatar;
        localStorage.setItem('cached_avatar_url_' + userId, cachedAvatar);
      }
      setDbUser(enriched);
      if (data.email && adminEmails.includes(data.email.toLowerCase()) && data.role !== 'admin') {
        console.log('App Startup: Auto-repairing admin profile role by ID...');
        const { error: updErr } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
        if (!updErr) {
          const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
          if (freshProfile) {
            const enrichedFresh = await syncAndEnrichProfile(freshProfile, userId);
            if (cachedAvatar) {
              enrichedFresh.avatar_url = cachedAvatar;
              enrichedFresh.profile_photo_url = cachedAvatar;
            }
            setDbUser(enrichedFresh);
          }
        }
      }
    } else if (error && error.code === 'PGRST116') {
      console.log('App Startup: Profile missing, auto-inserting...');
      const fallbackEmail = sessionEmail || 'agent@animeint.com';
      const isSetAdmin = adminEmails.includes(fallbackEmail.toLowerCase());
      const { error: insErr } = await supabase.from('profiles').insert([{ 
        id: userId, 
        username: fallbackEmail.split('@')[0], 
        email: fallbackEmail, 
        role: isSetAdmin ? 'admin' : 'member' 
      }]);
      if (!insErr) {
        const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (freshProfile) {
          const enrichedFresh = await syncAndEnrichProfile(freshProfile, userId);
          if (cachedAvatar) {
            enrichedFresh.avatar_url = cachedAvatar;
            enrichedFresh.profile_photo_url = cachedAvatar;
          }
          setDbUser(enrichedFresh);
        }
      } else {
        const enrichedFresh = await syncAndEnrichProfile({ id: userId, username: fallbackEmail.split('@')[0], email: fallbackEmail, role: isSetAdmin ? 'admin' : 'member' }, userId);
        if (cachedAvatar) {
          enrichedFresh.avatar_url = cachedAvatar;
          enrichedFresh.profile_photo_url = cachedAvatar;
        }
        setDbUser(enrichedFresh);
      }
    } else if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile by ID:', error);
    }
  };

  const fetchProfileByEmail = async (email: string) => {
    let session = null;
    try {
      const res = await supabase.auth.getSession();
      session = res?.data?.session || null;
    } catch (e) {
      console.warn('Failed to get session in fetchProfileByEmail:', e);
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    const adminEmails = ['anshsureshsingh07@gmail.com', 'animeintofficial@gmail.com'];

    if (data) {
      fetchLocalUserFaction(data.id);

      // Query user_profiles database table first to pull avatar_public_url for persistence
      let userProfilesAvatar: string | null = null;
      try {
        const { data: upData } = await supabase
          .from('user_profiles')
          .select('avatar_public_url')
          .eq('user_id', data.id)
          .maybeSingle();
        if (upData?.avatar_public_url) {
          userProfilesAvatar = upData.avatar_public_url;
        }
      } catch (upErr) {
        console.warn('user_profiles retrieval by Email in App bypassed/failed:', upErr);
      }

      const cachedAvatar = userProfilesAvatar || localStorage.getItem('cached_avatar_url_' + data.id);

      const enriched = await syncAndEnrichProfile(data, data.id);
      if (cachedAvatar) {
        enriched.avatar_url = cachedAvatar;
        enriched.profile_photo_url = cachedAvatar;
        localStorage.setItem('cached_avatar_url_' + data.id, cachedAvatar);
      }
      setDbUser(enriched);
      if (adminEmails.includes(email.toLowerCase()) && data.role !== 'admin') {
        console.log('App Startup: Auto-repairing admin profile role by Email...');
        const { error: updErr } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.id);
        if (!updErr) {
          const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', data.id).single();
          if (freshProfile) {
            const enrichedFresh = await syncAndEnrichProfile(freshProfile, data.id);
            if (cachedAvatar) {
              enrichedFresh.avatar_url = cachedAvatar;
              enrichedFresh.profile_photo_url = cachedAvatar;
            }
            setDbUser(enrichedFresh);
          }
        }
      }
    } else if (error && error.code === 'PGRST116' && session?.user) {
      console.log('App Startup: Profile missing by Email register, auto-inserting...');
      const isSetAdmin = adminEmails.includes(email.toLowerCase());
      const { error: insErr } = await supabase.from('profiles').insert([{ 
        id: session.user.id, 
        username: email.split('@')[0], 
        email: email, 
        role: isSetAdmin ? 'admin' : 'member' 
      }]);
      if (!insErr) {
        const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (freshProfile) {
          const enrichedFresh = await syncAndEnrichProfile(freshProfile, session.user.id);
          const cachedAvatar = localStorage.getItem('cached_avatar_url_' + session.user.id);
          if (cachedAvatar) {
            enrichedFresh.avatar_url = cachedAvatar;
            enrichedFresh.profile_photo_url = cachedAvatar;
          }
          setDbUser(enrichedFresh);
        }
      } else {
        const enrichedFresh = await syncAndEnrichProfile({ id: session.user.id, username: email.split('@')[0], email: email, role: isSetAdmin ? 'admin' : 'member' }, session.user.id);
        const cachedAvatar = localStorage.getItem('cached_avatar_url_' + session.user.id);
        if (cachedAvatar) {
          enrichedFresh.avatar_url = cachedAvatar;
          enrichedFresh.profile_photo_url = cachedAvatar;
        }
        setDbUser(enrichedFresh);
      }
    } else if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = async () => {
    localStorage.removeItem('vanguard_guest_session');
    setIsGuest(false);
    await signOut(auth);
    await supabase.auth.signOut();
    setDbUser(null);
    setCurrentUserFaction(null);
  };

  const user = firebaseUser ? {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    username: dbUser?.username || firebaseUser.email?.split('@')[0],
    imageUrl: dbUser?.avatar_url || dbUser?.avatar || (firebaseUser ? localStorage.getItem('cached_avatar_url_' + firebaseUser.uid) : null) || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`
  } : (isGuest ? {
    id: 'guest_node_99',
    email: 'guest@nexus.secure',
    username: 'GUEST_NODE_99',
    imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=guest_node_99`
  } : null);

  const ext = user ? getStoredProfileExt(user.id) : { xp: 0, level: 1, is_premium: false };
  let currentDbUser = dbUser 
    ? { 
        ...dbUser, 
        xp: dbUser.xp ?? ext.xp, 
        level: dbUser.level ?? ext.level, 
        is_premium: !!dbUser.is_premium, 
        tier: dbUser.is_premium ? 'premium' : 'none' 
      }
    : (user ? { 
        id: user.id,
        username: user.username,
        email: user.email,
        role: isGuest ? 'Guest' : 'member', 
        xp: ext.xp, 
        level: ext.level, 
        is_premium: false, 
        tier: 'none' 
      } : null);

  if (firebaseUser?.email === 'anshsureshsingh07@gmail.com') {
    if (currentDbUser) {
      currentDbUser = { ...currentDbUser, role: 'admin', is_premium: true, tier: 'premium' };
    } else {
      currentDbUser = { role: 'admin', xp: ext.xp, level: ext.level, is_premium: true, tier: 'premium' };
    }
  }

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPaymentTier, setSelectedPaymentTier] = useState<'plus' | 'god' | 'monarch' | null>(null);
  const [utr, setUtr] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentTxStatus, setPaymentTxStatus] = useState<'idle' | 'submitted' | 'error'>('idle');
  const [paymentTxError, setPaymentTxError] = useState<string | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as string.'));
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const [paymentSettings, setPaymentSettings] = useState({
    upi_id: '6351197285@fam',
    qr_url: '/src/assets/images/admin_payment_qr_1779518254385.png'
  });

  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('*')
          .eq('id', 'global_config')
          .maybeSingle();
        if (data) {
          setPaymentSettings({
            upi_id: data.upi_id || '6351197285@fam',
            qr_url: data.qr_url || '/src/assets/images/admin_payment_qr_1779518254385.png'
          });
        }
      } catch (err) {
        console.warn('Silent loading error on dynamic upi settings:', err);
      }
    };
    fetchPaymentSettings();
  }, [isUpgradeModalOpen]);

  useEffect(() => {
    const handleOpenModal = () => {
      setIsUpgradeModalOpen(true);
      setSelectedPaymentTier(null);
      setUtr('');
      setIsCopied(false);
      setIsVerifying(false);
      setPaymentTxStatus('idle');
      setPaymentTxError(null);
      setScreenshotFile(null);
      setIsUploadingScreenshot(false);
    };
    window.addEventListener('open-upgrade-modal', handleOpenModal);
    return () => window.removeEventListener('open-upgrade-modal', handleOpenModal);
  }, []);

  const handleCloseModal = () => {
    setIsUpgradeModalOpen(false);
    setSelectedPaymentTier(null);
    setUtr('');
    setIsCopied(false);
    setIsVerifying(false);
    setPaymentTxStatus('idle');
    setPaymentTxError(null);
    setScreenshotFile(null);
    setIsUploadingScreenshot(false);
  };

  const handleUpgradeCurrent = async (tier: 'none' | 'plus' | 'god' | 'monarch') => {
    if (user?.id) {
      const updated = await upgradeToPremium(user.id, tier);
      if (updated) {
        setDbUser(updated);
      }
    }
  };

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const navSections = [
    {
      title: 'Operations',
      items: [
        { name: 'Home Feed', path: '/', icon: HomeIcon },
        { name: 'Squad Ops', path: '/squad-ops', icon: Target },
        { name: 'Faction War', path: '/faction-war', icon: Swords },
        { name: 'Marketplace', path: '/marketplace', icon: Coins },
        { name: 'Data Relay', path: '/data-relay', icon: Radio },
        { name: 'Elite Leaderboard', path: '/leaderboard', icon: Trophy },
        { name: '🏦 HOUSE TREASURY', path: '/house-treasury', icon: Landmark },
        { name: 'Recruitment', path: '/recruit', icon: RecruitIcon }
      ]
    },
    {
      title: 'Data',
      items: [
        { name: 'Database', path: '/database', icon: DatabaseIcon },
        { name: 'Neural News', path: '/news', icon: FileText },
        { name: 'Archives', path: '/archives', icon: Library },
        { name: 'Neural Maps', path: '/neural-maps', icon: Compass },
        { name: 'Skill Tree', path: '/skill-tree', icon: Award },
        { name: 'Event Horizon', path: '/event-horizon', icon: Calendar }
      ]
    },
    {
      title: 'Mainframe Cores',
      items: [
        { name: 'Core Processing Unit', path: '/core-processing-unit', icon: Cpu },
        { name: 'Sector Tactical Maps', path: '/sector-tactical-maps', icon: Compass },
        { name: 'Archives & Intel Hub', path: '/archives-intel', icon: Archive },
        { name: 'Nexus Treasury & Ledger', path: '/nexus-treasury', icon: Landmark },
        { name: 'Vanguard Command Center', path: '/vanguard-command', icon: ShieldAlert }
      ]
    },
    {
      title: 'Settings',
      items: [
        { name: 'Profile Node', path: '/profile', icon: User },
        { name: 'Terminal Logs', path: '/terminal-logs', icon: Terminal },
        { name: 'Node Settings', path: '/node-settings', icon: Settings2 }
      ]
    }
  ];

  const isAdmin = (currentDbUser && (currentDbUser.role === 'admin' || currentDbUser.role === 'news_writer' || currentDbUser.role === 'moderator')) || 
                  (firebaseUser?.email === 'anshsureshsingh07@gmail.com' || firebaseUser?.email === 'animeintofficial@gmail.com');

  const isAuthRoute = location.pathname === '/auth' || location.pathname === '/auth/reset-password';

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] animate-pulse">
          Decrypting session...
        </div>
      </div>
    );
  }

  if (!firebaseUser && !isGuest && !isAuthRoute) {
    return <AuthPage />;
  }

  if (isAuthRoute && (firebaseUser || isGuest) && location.pathname !== '/auth/reset-password') {
    return <Navigate to="/" replace />;
  }

  const hasSolarState = !!(currentUserFaction?.faction_name?.trim().toLowerCase().includes('stark') && isStarkSummer);

  const headerProfileId = firebaseUser?.uid || currentDbUser?.id || '';
  const headerAvatarPublicUrl = currentDbUser?.avatar_url || currentDbUser?.profile_photo_url || currentDbUser?.avatar || '';
  const headerCachedUrl = headerProfileId ? (localStorage.getItem('cached_avatar_url_' + headerProfileId) || '') : '';
  const headerDefaultPlaceholder = `https://api.dicebear.com/7.x/avataaars/svg?seed=${headerProfileId || 'default'}`;
  const headerAvatarSrc = headerAvatarPublicUrl || headerCachedUrl || headerLocalBlob || headerDefaultPlaceholder;
  const headerAvatarKey = headerAvatarPublicUrl || headerCachedUrl || headerLocalBlob;

  const displayHeadline = activeArticle?.title ? activeArticle.title.toUpperCase() : breakingNews?.text ? breakingNews.text.toUpperCase() : "VANGUARD OPS: ARCHIVES SYSTEM EXPANSION INITIALIZED";

  return (
    <NewsContext.Provider value={{ activeArticle, setActiveArticle, breakingNews, setBreakingNews }}>
      <motion.div 
        animate={descentState !== 'flash' ? {
          perspective: '2000px'
        } : {
          perspective: '500px'
        }}
        transition={{
          perspective: {
            type: "spring",
            stiffness: 80,
            damping: 15,
            mass: 1.1
          }
        }}
        style={{ transformStyle: 'preserve-3d' }}
        className="bg-[#030105] text-gray-200 min-h-screen w-full relative overflow-hidden flex flex-col justify-start"
      >
        <CommandPalette />

        {/* White overexposed flash / Void blackout fade overlay */}
        {flashOpacity > 0 && (
          <div 
            className="fixed inset-0 bg-white z-[999999] pointer-events-none transition-opacity duration-300 ease-out"
            style={{ opacity: flashOpacity }}
          />
        )}

        {/* Atmospheric Floating Dust Overlay during descent */}
        {descentState !== 'settled' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-[99998] bg-[#030105]">
            {dustParticles.map(p => (
              <motion.div
                key={p.id}
                className="absolute bg-white rounded-full"
                style={{
                  left: p.left,
                  top: p.top,
                  width: p.size,
                  height: p.size,
                  opacity: p.opacity,
                }}
                animate={{
                  y: ['100vh', '-20vh'],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: p.delay
                }}
              />
            ))}
          </div>
        )}

        {/* Main application body with translated Z-axis */}
        <motion.div
          initial={{
            z: -1000,
            opacity: 0,
            filter: 'blur(20px)'
          }}
          animate={descentState !== 'flash' ? {
            z: 0,
            opacity: 1,
            filter: 'blur(0px)'
          } : {
            z: -1000,
            opacity: 0,
            filter: 'blur(20px)'
          }}
          transition={{
            z: {
              type: "spring",
              stiffness: 80,
              damping: 15,
              mass: 1.15,
              restDelta: 0.001
            },
            filter: {
              duration: 1.7,
              ease: "easeOut"
            },
            opacity: {
              duration: 0.8,
              ease: "easeOut"
            }
          }}
          style={{ transformStyle: 'preserve-3d' }}
          className={`flex-1 flex min-h-screen w-full overflow-y-auto bg-background pb-12 bg-[var(--faction-bg)] text-gray-200 transition-all duration-700 ease-in-out ${hasSolarState ? 'animate-solar-radiation' : ''}`}
        >
      <style dangerouslySetInnerHTML={{ __html: getFactionStyleCSS(currentUserFaction?.faction_name, isStarkSummer) }} />
      <SolarFlareOverlay active={hasSolarState} />

      {/* Eco Standby Inactivity Dimmer overlay */}
      <AnimatePresence>
        {isInactive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#030105]/98 backdrop-blur-[16px] z-[9999] flex flex-col items-center justify-center pointer-events-auto cursor-pointer"
            onClick={() => setIsInactive(false)}
          >
            {/* Tech grid mesh overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(168,85,247,0.015),rgba(0,0,0,0.1),rgba(168,85,247,0.015))] bg-[size:100%_4px,3px_100%] opacity-40 pointer-events-none" />
            
            <div className="flex flex-col items-center animate-pulse duration-1000 max-w-xs text-center px-6">
              <div className="w-16 h-16 rounded-full border border-red-500/30 flex items-center justify-center mb-6">
                <ShieldAlert size={28} className="text-[#E50914] animate-bounce" />
              </div>
              <h2 className="text-lg font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-[#A855F7] to-[#00BFFF] uppercase tracking-[0.4em]">
                STANDBY MODE
              </h2>
              <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-3 leading-relaxed">
                Terminal synced to deep-sleep protocol.<br />
                <span className="text-white font-bold animate-pulse mt-2 inline-block">MOVE POINTER TO RE-AUTHENTICATE</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mainframe Security Widget HUD */}
      <motion.div 
        drag
        dragConstraints={{ left: -500, right: 0, top: -500, bottom: 0 }}
        style={{ 
          filter: securityGlitch ? 'skewX(-15deg) saturate(2.5) hue-rotate(75deg) blur(0.4px)' : 'none',
          touchAction: 'none'
        }}
        className="fixed bottom-14 right-6 z-40 w-64 bg-[#08040d]/95 backdrop-blur-md border border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.25)] p-4 rounded-2xl flex flex-col gap-3 select-none transition-all duration-300 pointer-events-auto cursor-grab active:cursor-grabbing"
      >
        {/* Engineering micro-labels */}
        <div className="absolute top-1.5 right-3 text-[6px] font-mono text-zinc-500 select-none pointer-events-none uppercase">
          SECURE_NODE_HUD_V2
        </div>

        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
          <ShieldAlert size={14} className="text-[#E50914]" />
          <div className="flex-1">
            <h4 className="text-[9px] font-mono font-black text-[#F2F2F5] uppercase tracking-widest leading-none">MAINFRAME CONTROL</h4>
            <span className="text-[7px] font-mono text-zinc-500 uppercase tracking-widest leading-none mt-1 block">SYS_SECURITY_INTEGRITY</span>
          </div>
          <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-green-500 text-[8px] font-mono">
            <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" /> ONLINE
          </div>
        </div>

        {/* Telemetry data streams */}
        <div className="flex flex-col gap-1.5 font-mono text-[8px] text-[#A8A8B2] border-b border-white/5 pb-2">
          <div className="flex justify-between">
            <span>SYSTEM_STATUS:</span>
            <span className="text-white font-black uppercase">CORE_ACTIVE_99</span>
          </div>
          <div className="flex justify-between">
            <span>CONNECTION:</span>
            <span className="text-[#00BFFF] font-black uppercase">NEX-SECURE-SSH</span>
          </div>
          <div className="flex justify-between">
            <span>AUTH_LEVEL:</span>
            <span className="text-[#A855F7] font-black uppercase">VANGUARD_LEVEL_9</span>
          </div>
          <div className="flex justify-between">
            <span>PIN_PULSES:</span>
            <span className="text-amber-400 font-bold">{securityPingCount} SEC_OKs</span>
          </div>
        </div>

        {/* Depress button for tactile feedback */}
        <button 
          type="button"
          onClick={() => {
            setSecurityPingCount(prev => prev + 1);
            if (navigator?.vibrate) {
              navigator.vibrate(15);
            }
          }}
          className="w-full relative py-2 px-3 rounded-lg border border-red-500/40 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-[8px] font-mono font-black uppercase tracking-widest transition-all duration-150 active:translate-y-0.5 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)] hover:shadow-[0_0_12px_rgba(229,9,20,0.5)] shadow-[0_1px_3px_rgba(0,0,0,0.4)]"
        >
          Ping Security Firewall
        </button>
      </motion.div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[var(--faction-panel-bg)] border-r border-[var(--faction-border)] flex flex-col shrink-0 
        transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--faction-primary)] to-[var(--faction-primary-glow)] rounded-sm rotate-45 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">
              Anime <span className="text-[var(--faction-primary)]">Int.</span>
            </h1>
          </div>
          <button 
            className="lg:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 mt-4 overflow-y-auto font-mono scrollbar-thin flex flex-col gap-5">
          {/* Core Links */}
          <div className="space-y-1">
            <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-extrabold mb-1.5 px-2 select-none">
              Core Systems
            </div>
            <div className="flex flex-col gap-0.5">
              {[
                { name: 'Home Feed', path: '/', icon: HomeIcon },
                { name: 'Sector Tactical Maps', path: '/sector-tactical-maps', icon: Compass },
                { name: 'Nexus Treasury & Ledger', path: '/nexus-treasury', icon: Landmark },
                { name: 'Vanguard Command Center', path: '/vanguard-command', icon: ShieldAlert },
                { name: 'Node Settings', path: '/node-settings', icon: Settings2 }
              ].map((item) => (
                <Link 
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-1.5 text-xs font-bold rounded-lg transition-all hover-pulse ${
                    location.pathname === item.path 
                      ? 'bg-black/40 border border-crimson text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]' 
                      : 'text-gray-400 hover:text-white border border-transparent hover:border-crimson/50'
                  }`}
                >
                  <item.icon size={15} className={location.pathname === item.path ? 'text-crimson' : 'text-gray-500'} />
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Extended Modes Toggle */}
          <div>
            <button
              type="button"
              onClick={() => {
                const nextState = !extendedNavOpen;
                setExtendedNavOpen(nextState);
                localStorage.setItem('vanguard_extended_nav_open', nextState.toString());
                playDigitalSound('click');
              }}
              className="w-full text-left flex items-center justify-between px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 hover:text-white border border-white/5 bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer"
            >
              <span>[EXTENDED_MODES]</span>
              <ChevronDown 
                size={14} 
                className={`transform transition-transform duration-300 ${extendedNavOpen ? 'rotate-180' : 'rotate-0'}`} 
              />
            </button>

            <AnimatePresence initial={false}>
              {extendedNavOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 flex flex-col gap-5">
                    {navSections.map((section) => {
                      const filteredItems = section.items.filter(
                        (item) => !['/', '/sector-tactical-maps', '/nexus-treasury', '/vanguard-command', '/node-settings'].includes(item.path)
                      );
                      if (filteredItems.length === 0) return null;
                      return (
                        <div key={section.title} className="space-y-1">
                          <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-extrabold mb-1.5 px-2 select-none">
                            {section.title}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {filteredItems.map((item) => (
                              <Link 
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-1.5 text-xs font-bold rounded-lg transition-all hover-pulse ${
                                  location.pathname === item.path 
                                    ? 'bg-black/40 border border-crimson text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]' 
                                    : 'text-gray-400 hover:text-white border border-transparent hover:border-crimson/50'
                                }`}
                              >
                                <item.icon size={15} className={location.pathname === item.path ? 'text-crimson' : 'text-gray-500'} />
                                {item.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    
                    {isAdmin && (
                      <div className="space-y-1 pt-1">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-zinc-500 font-extrabold mb-1.5 px-2 select-none">Management</div>
                        <Link 
                          to="/admin"
                          className={`flex items-center gap-3 px-3 py-1.5 text-xs font-bold rounded-lg transition-all hover-pulse ${
                            location.pathname === '/admin' 
                              ? 'bg-black/40 border border-crimson text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]' 
                              : 'text-gray-400 hover:text-white border border-transparent hover:border-crimson/50'
                          }`}
                        >
                          <AdminIcon size={15} className="text-gray-500" />
                          Admin Panel
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        <div className="p-4 border-t border-[var(--faction-border)] space-y-3">
          <div className="bg-black/40 border border-[var(--faction-border)] p-3 rounded-xl flex items-center gap-3 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
            <div className="w-8 h-8 rounded-full bg-[var(--faction-primary-glow,rgba(220,38,38,0.1))] border border-[var(--faction-primary,rgba(220,38,38,0.5))] flex items-center justify-center text-[var(--faction-primary,#E50914)] shrink-0 font-extrabold font-mono text-xs">
              ★
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-[var(--faction-primary,#E50914)] font-black uppercase tracking-widest">
                  CORES SYNCED
                </span>
                <span className="text-[8px] bg-white/10 text-gray-300 px-1 font-bold rounded">LVL {currentDbUser?.level || 1}</span>
              </div>
              <p className="text-xs font-mono font-black text-white uppercase truncate">
                {currentDbUser?.username || firebaseUser?.email?.split('@')[0] || 'AGENT'}
              </p>
            </div>
          </div>

          <div className="bg-[#111] rounded-lg p-4 border border-[var(--faction-border)]">
            <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-black">Recruitment Active</p>
            <p className="text-xs font-bold text-white leading-tight mb-3 italic">Looking for Editors & Writers</p>
            <Link 
              to="/recruit"
              className="block w-full py-2 bg-[var(--faction-primary)] text-white text-[10px] font-black uppercase tracking-widest rounded text-center transition-all hover:opacity-90 shadow-[0_0_10px_var(--faction-primary-glow)]"
            >
              Apply Now
            </Link>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
          >
            <LogOut size={16} />
            Initialize Logoff
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-[var(--faction-border)] flex items-center justify-between px-4 lg:px-8 bg-[var(--faction-bg)] shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            {isGuest && (
              <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1 rounded-full font-mono font-black uppercase tracking-widest select-none animate-pulse shrink-0">
                [STATUS: GUEST]
              </span>
            )}
            
            <div className="relative w-64 xl:w-96 hidden md:block">
              <input 
                type="text" 
                placeholder="Search archives..." 
                className="w-full bg-[#111] border border-[#222] rounded-full py-2 px-10 text-xs focus:outline-none focus:border-[var(--faction-primary)] transition-all font-mono"
              />
              <Search className="absolute left-4 top-2.5 text-gray-500" size={14} />
            </div>
          </div>

          <div className="flex items-center gap-6 ml-auto">
            {currentUserFaction?.faction_name?.trim().toLowerCase().includes('stark') && (
              <button 
                onClick={() => {
                  const nextVal = !isStarkSummer;
                  setIsStarkSummer(nextVal);
                  localStorage.setItem('stark_summer_active', String(nextVal));
                  window.dispatchEvent(new CustomEvent('stark-summer-change', { detail: nextVal }));
                }}
                className={`p-1.5 px-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 flex items-center gap-1.5 border ${
                  isStarkSummer 
                    ? 'bg-amber-500/20 text-yellow-500 border-amber-500/40 hover:bg-amber-500 hover:text-black hover:border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse' 
                    : 'bg-cyan-500/10 text-cyan-200 border-cyan-500/30 hover:border-cyan-400'
                }`}
                title="Toggle Summer/Winter mode for House Stark"
              >
                {isStarkSummer ? '☀️ SUMMER IS HERE' : '❄️ WINTER ACTIVE'}
              </button>
            )}
            <button className="p-2 text-gray-500 hover:text-white transition-colors relative">
               <Bell size={20} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--faction-primary)] rounded-full border-2 border-[var(--faction-bg)]"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-[var(--faction-border)]">
                <div className="text-right hidden sm:block">
                   <div className="text-xs font-bold text-white uppercase italic flex items-center justify-end gap-1.5">
                     {user?.username || 'Vanguard Member'}
                     {currentDbUser?.is_premium && (
                       <span className="text-[8px] bg-yellow-500 text-black px-1 py-0.5 rounded-sm font-black flex items-center gap-0.5" title="Otaku Pass Premium">
                         <Crown size={8} className="fill-black" /> ELITE
                       </span>
                     )}
                   </div>
                   <div className="text-[10px] text-[var(--faction-primary)] font-mono font-black uppercase tracking-widest flex items-center justify-end gap-1">
                     {currentDbUser?.role ? currentDbUser.role.replace('_', ' ') : 'AGENT'}{currentUserFaction && ` • ${getFactionEmoji(currentUserFaction.faction_name)} ${currentUserFaction.faction_name.toUpperCase()} ${currentUserFaction.faction_rank.toUpperCase()}`}
                     {currentDbUser?.is_premium && (
                       <span className="text-yellow-500 font-bold ml-1">• LVL {currentDbUser?.level || 1}</span>
                     )}
                   </div>
                </div>
                <div className={`w-10 h-10 rounded shadow-[0_0_15px_rgba(255,255,255,0.05)] border overflow-hidden group relative cursor-pointer transition-all duration-300 ${
                   currentDbUser?.is_premium 
                     ? 'border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.45)] hover:scale-105' 
                     : 'border-[var(--faction-border)]'
                }`}>
                  <img 
                    src={headerAvatarSrc} 
                    key={headerAvatarKey || 'avatar-header'}
                    alt="Avatar" 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <UserIcon size={12} className="text-white" />
                  </div>
                </div>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative z-10">
          {/* Headline Frame Component */}
          <div className="bg-[#050508]/90 border-b border-[var(--faction-border)] py-2 px-6 lg:px-8 flex items-center gap-4 overflow-hidden select-none shrink-0 z-10 sticky top-0 backdrop-blur-md">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-600/10 border border-red-500/30 rounded text-red-500 text-[9px] font-black uppercase tracking-widest shrink-0 animate-pulse">
              <span className="inline-block w-1 h-1 rounded-full bg-red-600"></span>
              NEURAL STREAM
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="animate-marquee-slower whitespace-nowrap text-[10px] font-mono font-bold tracking-[0.2em] text-gray-300">
                {activeArticle?.title ? activeArticle.title.toUpperCase() : breakingNews?.text ? breakingNews.text.toUpperCase() : "VANGUARD OPS: ARCHIVES SYSTEM EXPANSION INITIALIZED"} • {activeArticle?.title ? activeArticle.title.toUpperCase() : breakingNews?.text ? breakingNews.text.toUpperCase() : "VANGUARD OPS: ARCHIVES SYSTEM EXPANSION INITIALIZED"} • {activeArticle?.title ? activeArticle.title.toUpperCase() : breakingNews?.text ? breakingNews.text.toUpperCase() : "VANGUARD OPS: ARCHIVES SYSTEM EXPANSION INITIALIZED"}
              </div>
            </div>
          </div>
          {children}
        </main>

        {/* Bottom Ticker */}
        <footer 
          className={`h-10 bg-[var(--faction-panel-bg)] border-t border-[var(--faction-border)] flex items-center px-6 shrink-0 select-none ${
            isActualAdmin ? "cursor-pointer hover:bg-black/80 group" : ""
          }`}
          onClick={isActualAdmin ? () => {
            fetchTrackerReleases();
            setIsReleaseTrackerDrawerOpen(true);
          } : undefined}
          title={isActualAdmin ? "Click to Open Release Tracker Controller" : "Release Tracker"}
        >
          <div className="text-[10px] font-black uppercase text-[var(--faction-primary)] tracking-tighter mr-6 shrink-0 flex items-center gap-2">
            <Flame size={12} fill="currentColor" className={isActualAdmin ? "group-hover:animate-bounce" : ""} /> Release Tracker 
            {isActualAdmin && (
              <span className="text-[8px] font-mono text-gray-500 lowercase px-1 bg-white/5 rounded border border-white/10 group-hover:text-white group-hover:bg-[var(--faction-primary-glow)] hover:border-[var(--faction-primary)] transition-all">[Edit]</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden flex gap-8 text-[10px] font-mono text-gray-500 whitespace-nowrap">
            <motion.div 
               animate={{ x: [0, -1000] }} 
               transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
               className="flex gap-12"
            >
               {trackerReleases && trackerReleases.length > 0 ? (
                 trackerReleases.map((item) => (
                   <span key={item.id} className="hover:text-white transition-colors">
                     [{new Date(item.release_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}] {item.title?.toUpperCase()} - EP {item.episode || 1} {item.platform?.toUpperCase() || 'OUT NOW'}
                   </span>
                 ))
               ) : (
                 <>
                   <span>[14:00] ONE PIECE - EP 1106 OUT NOW</span>
                   <span>[16:30] SLIME S3 - EP 07 NEXT IN 2H 15M</span>
                   <span>[21:00] MASHLE S2 FINALE - STREAMING SOON</span>
                   <span>[00:00] NEW MANGA UPDATE - JUJUTSU KAISEN CH 260</span>
                 </>
               )}
               <span className="text-[var(--faction-primary)] font-bold animate-pulse">[ACTIVE] 12,402 NODES ONLINE</span>
            </motion.div>
          </div>
          <div className="ml-4 flex gap-4 items-center shrink-0">
            {descentState === 'settled' && (
              <div className="hidden md:flex items-center gap-3 text-[9px] font-mono font-black text-emerald-500 tracking-wider animate-fade-in">
                <span className="bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">[MAIN_SYSTEMS: ONLINE]</span>
                <span className="bg-cyan-500/5 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-bold">[NEURAL_SYNC: COMPLETE]</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 border-l border-[var(--faction-border)] pl-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">System Optimal</span>
            </div>
          </div>
        </footer>

        {/* Dynamic Slide-out Drawer Panel for managing trackerReleases */}
        {isReleaseTrackerDrawerOpen && (
          <>
            {/* Overlay background */}
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
              onClick={() => {
                setIsReleaseTrackerDrawerOpen(false);
                setIsAddingTracker(false);
                setEditingTrackerId(null);
              }}
            />
            <aside className="fixed inset-y-0 right-0 z-50 w-96 bg-[#0c0c0c] border-l border-white/10 shadow-2xl flex flex-col font-mono animate-slide-in text-gray-300">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-[var(--faction-primary)] animate-pulse" />
                  <span className="text-[11px] font-black uppercase text-white tracking-widest">Tracker Control Node</span>
                </div>
                <button 
                  onClick={() => {
                    setIsReleaseTrackerDrawerOpen(false);
                    setIsAddingTracker(false);
                    setEditingTrackerId(null);
                  }}
                  className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors"
                  title="Disconnect Control Panel"
                >
                  <X size={16} />
                </button>
              </div>

              {/* List and Form content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {isAddingTracker || editingTrackerId ? (
                  <form onSubmit={handleSaveTracker} className="p-4 bg-black border border-white/5 rounded-lg space-y-4 shadow-inner" style={{ borderColor: 'var(--faction-border)' }}>
                    <div className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'var(--faction-primary)' }}>
                      {editingTrackerId ? 'Modify Event Stream' : 'Initialize Event Stream'}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-gray-500 uppercase font-black">Event Title</label>
                      <input 
                        required
                        value={trackerForm.title}
                        onChange={(e) => setTrackerForm({ ...trackerForm, title: e.target.value })}
                        placeholder="e.g. ONE PIECE"
                        className="w-full bg-[#111] border border-white/10 rounded p-2 text-xs focus:border-[var(--faction-primary)] outline-none text-white font-mono transition-colors"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-gray-500 uppercase font-black tracking-wider block">Release Date / Time</label>
                      <input 
                        type="datetime-local"
                        required
                        value={trackerForm.release_date}
                        onChange={(e) => setTrackerForm({ ...trackerForm, release_date: e.target.value })}
                        className="w-full bg-[#111] border border-white/10 rounded p-2 text-xs focus:border-[var(--faction-primary)] outline-none text-white font-mono transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] text-gray-500 uppercase font-black">Episode #</label>
                        <input 
                          type="number"
                          min="1"
                          value={trackerForm.episode}
                          onChange={(e) => setTrackerForm({ ...trackerForm, episode: Number(e.target.value) || 1 })}
                          className="w-full bg-[#111] border border-white/10 rounded p-2 text-xs focus:border-[var(--faction-primary)] outline-none text-white font-mono transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] text-gray-500 uppercase font-black">Status/Phase</label>
                        <input 
                          value={trackerForm.platform}
                          onChange={(e) => setTrackerForm({ ...trackerForm, platform: e.target.value })}
                          placeholder="e.g. NEXT IN 2H"
                          className="w-full bg-[#111] border border-white/10 rounded p-2 text-xs focus:border-[var(--faction-primary)] outline-none text-white font-mono transition-colors"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsAddingTracker(false);
                          setEditingTrackerId(null);
                          setTrackerForm({ title: '', release_date: '', episode: 1, platform: 'OUT NOW' });
                        }}
                        className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest rounded transition-colors text-gray-400 font-mono text-[9px]"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 py-1.5 text-white text-[9px] font-black uppercase tracking-widest rounded transition-all shadow-faction-glow bg-faction-primary hover:opacity-90"
                      >
                        Sync Stream
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTracker(true);
                      setTrackerForm({ title: '', release_date: '', episode: 1, platform: 'OUT NOW' });
                    }}
                    className="w-full py-2 bg-[var(--faction-primary-glow)] border hover:text-white transition-all text-[9.5px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 shadow-faction-glow hover:bg-faction-primary"
                    style={{ borderColor: 'var(--faction-border)', color: 'var(--faction-primary)' }}
                  >
                    <Flame size={12} fill="currentColor text-[10px]" /> Initialize New Release
                  </button>
                )}

                {/* Items List */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Indexed Release Cycles</div>
                  {trackerReleases.length === 0 ? (
                    <div className="text-center p-10 border border-dashed border-white/5 rounded-lg text-gray-600 text-[10px] uppercase">
                      Zero indices active.
                    </div>
                  ) : (
                    trackerReleases.map((item) => (
                      <div key={item.id} className="p-3 bg-black border border-white/5 rounded-lg group transition-all flex flex-col gap-2 relative overflow-hidden hover:border-faction-primary">
                        <div className="flex items-start justify-between">
                          <div className="max-w-[70%]">
                            <div className="text-xs font-bold text-white group-hover:text-faction-primary transition-colors uppercase truncate">{item.title}</div>
                            <div className="text-[8px] text-gray-500 font-mono mt-0.5 uppercase">
                              EPISODE {item.episode || 1} • {item.platform || 'OUT NOW'}
                            </div>
                          </div>
                          <span className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase self-start leading-none tracking-widest bg-[var(--faction-primary-glow)]" style={{ color: 'var(--faction-primary)' }}>
                            {new Date(item.release_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                        </div>
                        
                        {/* Action Tools */}
                        <div className="flex justify-end gap-1.5 border-t border-white/5 pt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              const dateObj = new Date(item.release_date);
                              const tzOffset = dateObj.getTimezoneOffset() * 60000;
                              const localISODate = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
                              
                              setEditingTrackerId(item.id);
                              setTrackerForm({
                                title: item.title,
                                release_date: localISODate,
                                episode: item.episode || 1,
                                platform: item.platform || 'OUT NOW'
                              });
                            }}
                            className="px-2 py-0.5 hover:bg-white/5 rounded text-[8px] uppercase tracking-widest transition-colors font-black"
                            style={{ color: 'var(--faction-primary)' }}
                          >
                            Modify
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTracker(item.id)}
                            className="px-2 py-0.5 hover:bg-neutral-800 rounded text-[8px] uppercase tracking-widest transition-all font-black text-gray-600 hover:text-faction-primary"
                          >
                            Purge
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </>
        )}
        {/* Otaku Pass Premium Subscription Modal disabled */}
        <AnimatePresence>
          {false && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              {/* Dark Backing Blur */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseModal}
                className="absolute inset-0 bg-black/85 backdrop-blur-md"
              />

              {/* Modal Container */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                className="relative w-full max-w-xl bg-[#09090B] border-2 border-yellow-500/30 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(234,179,8,0.2)] flex flex-col z-10 p-6 sm:p-8"
              >
                {/* Background decorative gold elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                {/* Close Button */}
                <button 
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-colors z-20"
                >
                  <X size={18} />
                </button>

                {/* Crown Logo Section */}
                <div className="flex flex-col items-center text-center mt-2 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] mb-2 animate-pulse">
                    <Crown size={24} className="text-black fill-black" />
                  </div>
                  <h2 className="text-xl font-black uppercase text-white tracking-tight italic">
                    OTAKU PASS <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">LEVELS</span>
                  </h2>
                  <p className="text-[9px] font-mono font-bold text-yellow-500 uppercase tracking-widest mt-0.5">Authorize specialized vanguard enhancements</p>
                </div>

                {selectedPaymentTier ? (
                  <div className="space-y-4">
                    {/* Go Back Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <button 
                        onClick={() => {
                          setSelectedPaymentTier(null);
                          setUtr('');
                        }}
                        className="flex items-center gap-1.5 hover:text-white text-gray-400 text-[10px] font-mono uppercase tracking-wider transition-colors"
                      >
                        <ArrowLeft size={12} /> Back to Tiers
                      </button>
                      <div className="text-[9px] font-mono font-bold text-yellow-500 uppercase tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                        {selectedPaymentTier.toUpperCase()} PASS
                      </div>
                    </div>

                    {/* Price Header */}
                    <div className="text-center py-2.5 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold font-mono">Amount Payable</p>
                      <p className="text-2xl font-black text-yellow-400 mt-0.5">
                        {selectedPaymentTier === 'plus' ? '₹20' : selectedPaymentTier === 'god' ? '₹49' : '₹149'}
                      </p>
                      <p className="text-[8px] font-mono text-gray-500 uppercase tracking-wider mt-0.5">Synchronized via BHIM UPI Node</p>
                                {/* QR Code Segment */}
                    <div className="flex flex-col items-center justify-center p-4 bg-black/60 rounded-2xl border border-yellow-500/20 relative overflow-hidden group shadow-[0_0_30px_rgba(234,179,8,0.08)] animate-neon-glow">
                      {/* Ambient scanning light */}
                      <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 via-transparent to-transparent pointer-events-none" />

                      {/* scan terminal container */}
                      <div className="w-56 h-56 bg-[#040406] border border-yellow-500/30 rounded-xl relative overflow-hidden flex flex-col items-center justify-between p-3">
                        {/* Custom Animated Scanning Laser Line */}
                        <div className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-yellow-500 to-transparent shadow-[0_0_10px_#eab308] animate-radar-scan pointer-events-none z-10" />

                        {/* Four corner brackets mirroring modern cyber UI grids */}
                        <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t-2 border-l-2 border-yellow-500/60" />
                        <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t-2 border-r-2 border-yellow-500/60" />
                        <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b-2 border-l-2 border-yellow-500/60" />
                        <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b-2 border-r-2 border-yellow-500/60" />

                        {/* Target Grid lines */}
                        <div className="absolute top-1/2 left-3 w-1.5 h-[1px] bg-yellow-500/20" />
                        <div className="absolute top-1/2 right-3 w-1.5 h-[1px] bg-yellow-500/20" />
                        <div className="absolute left-1/2 top-3 w-[1px] h-1.5 bg-yellow-500/20" />
                        <div className="absolute left-1/2 bottom-3 w-[1px] h-1.5 bg-yellow-500/20" />

                        {/* Glowing Scan Status */}
                        <div className="bg-yellow-500/10 border border-yellow-500/40 text-[8px] font-mono text-yellow-500 font-extrabold tracking-widest px-2 py-0.5 rounded shadow-[0_0_8px_rgba(234,179,8,0.2)] z-10 select-none">
                          VALIDATION TERMINAL: {selectedPaymentTier?.toUpperCase()}
                        </div>

                        {/* Image Container with the exact generated QR code */}
                        <div className="w-32 h-32 bg-white p-1 rounded-lg border border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.15)] flex items-center justify-center relative overflow-hidden z-10">
                          <img 
                            src={paymentSettings.qr_url} 
                            alt="Merchant Payment QR Code" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* Scanner Speed status */}
                        <div className="flex items-center justify-center gap-1 text-gray-400 font-mono text-[7px] tracking-wider uppercase z-10">
                          <span className="w-1 h-1 rounded-full bg-yellow-500 inline-block animate-ping" />
                          {paymentSettings.upi_id} • ACTIVE
                        </div>

                        {/* Background code stream telemetry label */}
                        <div className="absolute bottom-1 right-2.5 text-gray-700/60 font-mono text-[5px] tracking-tight text-right uppercase select-none pointer-events-none">
                          REF: SYS_NODE_{selectedPaymentTier?.slice(0, 3).toUpperCase()}_GEN07<br/>
                          LEDGER: VERIFIED
                        </div>
                      </div>
                      
                      <p className="text-[8px] font-mono text-gray-400 uppercase tracking-widest mt-2 text-center">Scan utilizing any preferred mobile UPI application</p>
                    </div>           </div>

                    {/* Voted Copier Address */}
                    <div className="space-y-1">
                      <label className="text-[8px] font-mono text-gray-400 uppercase tracking-widest font-black block">Merchant UPI Address</label>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-black rounded-lg border border-white/5 p-2 px-3 font-mono text-xs text-yellow-400 flex items-center justify-between">
                          <span>{paymentSettings.upi_id}</span>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(paymentSettings.upi_id);
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                          className={`px-3 rounded-lg border font-mono text-[9px] uppercase tracking-widest font-black transition-all flex items-center gap-1.5 ${
                            isCopied 
                              ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                              : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                          }`}
                        >
                          {isCopied ? <Check size={10} /> : <Copy size={10} />}
                          {isCopied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    {/* Submit Verification Gateway inputs */}
                    {paymentTxStatus === 'submitted' ? (
                      <div className="p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center space-y-4 font-mono">
                        <div className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-500 mx-auto animate-pulse">
                          <Check size={24} className="text-yellow-500 font-bold" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-wider text-yellow-500">Transaction Submitted</p>
                        <p className="text-[10px] text-gray-200 font-bold uppercase tracking-widest leading-relaxed">
                          Your proof of payment has been successfully recorded to the network ledger. Our terminal operator nodes will manually review your transaction and screenshot within 12-24 hours. Premium Monarch Pass features will unlock automatically upon verification.
                        </p>
                        <button 
                          onClick={handleCloseModal}
                          className="mt-2 px-5 py-2 bg-white/5 hover:bg-white/10 text-white rounded text-[9px] uppercase tracking-widest transition-colors font-bold border border-white/5 font-mono"
                        >
                          Close Terminal
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 pt-1">
                        {paymentTxError && (
                          <div className="p-2 border border-red-500/30 bg-red-500/10 text-red-500 rounded text-[9px] uppercase tracking-wider font-mono">
                            {paymentTxError}
                          </div>
                        )}
                        <div className="space-y-1">
                          <label className="text-[8px] font-mono text-gray-400 uppercase tracking-widest font-black block">
                            Submit Transaction ID / UTR
                          </label>
                          <input 
                            type="text" 
                            value={utr} 
                            onChange={(e) => setUtr(e.target.value.slice(0, 16))}
                            placeholder="e.g., 345678912345" 
                            className="w-full bg-black rounded-lg border border-white/5 p-2 px-3 font-mono text-xs text-white focus:border-yellow-500/50 focus:outline-none transition-colors"
                          />
                        </div>

                        {/* File upload input */}
                        <div className="space-y-1">
                          <label className="text-[8px] font-mono text-gray-400 uppercase tracking-widest font-black block">
                            Upload Payment Screenshot / Receipt Proof
                          </label>
                          <div className="flex items-center gap-2">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setScreenshotFile(e.target.files[0]);
                                }
                              }} 
                              className="hidden"
                              id="payment-screenshot-input"
                            />
                            <label 
                              htmlFor="payment-screenshot-input"
                              className="w-full bg-black rounded-lg border border-white/5 p-2 px-3 font-mono text-xs text-gray-300 hover:border-yellow-400/50 cursor-pointer flex items-center justify-between transition-all"
                            >
                              <span className="truncate text-xs text-gray-200">
                                {screenshotFile ? screenshotFile.name : 'Select Receipt image proof'}
                              </span>
                              <Upload size={14} className="text-yellow-500 ml-1 shrink-0" />
                            </label>
                          </div>
                        </div>

                        <button 
                          disabled={!utr.trim() || isVerifying || isUploadingScreenshot}
                          onClick={async () => {
                            if (!user?.id) return;
                            if (!screenshotFile) {
                              setPaymentTxError('Payment proof screenshot/receipt upload is required for server node clearance.');
                              return;
                            }
                            setIsVerifying(true);
                            setPaymentTxError(null);
                            try {
                              let finalScreenshotUrl = '';
                              setIsUploadingScreenshot(true);

                              // 1. Fetch Auth Token
                              let token = null;
                              const { data: { session: currentSession } } = await supabase.auth.getSession();
                              if (currentSession?.access_token) {
                                token = currentSession.access_token;
                              } else if (auth.currentUser) {
                                token = await auth.currentUser.getIdToken();
                              }

                              const headers: Record<string, string> = {
                                'Content-Type': 'application/json'
                              };
                              if (token) {
                                headers['Authorization'] = `Bearer ${token}`;
                              }

                              // 2. Encode to base64
                              const fileExt = screenshotFile.name.split('.').pop() || 'png';
                              const fileName = `payments/${Date.now()}_receipt.${fileExt}`;
                              const base64Data = await fileToBase64(screenshotFile);

                              // 3. Post to upload API
                              const uploadRes = await fetch('/api/upload', {
                                method: 'POST',
                                headers,
                                body: JSON.stringify({
                                  bucket: 'news',
                                  fileName,
                                  fileData: base64Data,
                                  contentType: screenshotFile.type
                                })
                              });

                              if (!uploadRes.ok) {
                                const errBody = await uploadRes.json();
                                throw new Error(errBody.error || 'Server error uploading payment proof receipt.');
                              }

                              const uploadData = await uploadRes.json();
                              if (!uploadData.publicUrl) {
                                throw new Error('Proxy failed to deliver storage publicUrl link.');
                              }
                              finalScreenshotUrl = uploadData.publicUrl;

                              // 4. Save payment transaction to Supabase
                              const { error } = await supabase
                                .from('payment_transactions')
                                .insert([
                                  {
                                    user_id: user.id,
                                    user_email: user.email || 'unknown@user.com',
                                    username: user.username || 'Agent Node',
                                    transaction_id: utr.trim(),
                                    status: 'pending',
                                    tier: selectedPaymentTier || 'premium',
                                    screenshot_url: finalScreenshotUrl
                                  }
                                ]);
                              if (error) throw error;
                              setPaymentTxStatus('submitted');
                            } catch (err: any) {
                              console.error('Error submitting transaction status:', err);
                              setPaymentTxError(err.message || 'Transmission of files/receipts failed.');
                            } finally {
                              setIsVerifying(false);
                              setIsUploadingScreenshot(false);
                            }
                          }}
                          className="w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:from-yellow-500 hover:to-amber-600 hover:to-yellow-600 disabled:from-white/5 disabled:to-white/5 disabled:text-gray-500 text-black py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all disabled:shadow-none shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                        >
                          {isVerifying ? (isUploadingScreenshot ? 'uploading screenshot proof...' : 'verifying secure payload...') : 'Verify Payment Request'}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* 3-Tier Selector Cards */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {/* Plus Pass */}
                      <div 
                        onClick={() => setSelectedPaymentTier('plus')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-center ${
                          currentDbUser?.is_premium && currentDbUser?.premium_tier === 'plus'
                            ? 'bg-yellow-500/10 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                            : 'bg-white/5 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div>
                          <span className="text-[8px] font-mono text-gray-400 uppercase tracking-widest font-black">Tier 1</span>
                          <h3 className="text-xs font-black text-white uppercase mt-1 leading-none">PLUS PASS</h3>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-black text-yellow-500">₹20</p>
                          <span className="text-[7px] font-mono text-gray-400 block mt-0.5 uppercase">1.25x XP</span>
                        </div>
                      </div>

                      {/* God Pass */}
                      <div 
                        onClick={() => setSelectedPaymentTier('god')}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-center ${
                          currentDbUser?.is_premium && currentDbUser?.premium_tier === 'god'
                            ? 'bg-yellow-500/10 border-yellow-500/80 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                            : 'bg-white/5 border-white/5 hover:border-yellow-500/20'
                        }`}
                      >
                        <div>
                          <span className="text-[8px] font-mono text-amber-500 uppercase tracking-widest font-black">Tier 2</span>
                          <h3 className="text-xs font-black text-white uppercase mt-1 leading-none">GOD PASS</h3>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-black text-yellow-500">₹49</p>
                          <span className="text-[7px] font-mono text-amber-500 block mt-0.5 uppercase">1.5X XP + Elite</span>
                        </div>
                      </div>

                      {/* Monarch Pass */}
                      <div 
                        onClick={() => setSelectedPaymentTier('monarch')}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between text-center relative overflow-hidden ${
                          currentDbUser?.is_premium && currentDbUser?.premium_tier === 'monarch'
                            ? 'bg-yellow-500/15 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
                            : 'bg-yellow-500/5 border-yellow-500/40 hover:border-yellow-500/60'
                        }`}
                      >
                        <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[6px] font-black px-1.5 py-0.5 uppercase tracking-widest rounded-bl scale-90 origin-top-right">Best</div>
                        <div>
                          <span className="text-[8px] font-mono text-yellow-500 uppercase tracking-widest font-black">Tier 3</span>
                          <h3 className="text-xs font-black text-white uppercase mt-1 leading-none">MONARCH</h3>
                        </div>
                        <div className="mt-3">
                          <p className="text-xs font-black text-yellow-400">₹149</p>
                          <span className="text-[7px] font-mono text-yellow-400 block mt-0.5 uppercase">2X XP + Crown</span>
                        </div>
                      </div>
                    </div>

                    {/* Sub features overview based on selection */}
                    <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-3 mb-6 max-h-[220px] overflow-y-auto">
                      <h4 className="text-[9px] font-mono text-yellow-500 uppercase tracking-widest font-black">Enrolled Tier Privileges:</h4>
                      
                      {/* Plus Pass Features */}
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-xs">✓</div>
                        <div className="text-[10px] text-gray-300">
                          <span className="text-white font-bold font-mono">PLUS:</span> Baseline Ad-reduction (25% fewer interruptions) & 1.25X Connection XP multi-pliers.
                        </div>
                      </div>

                      {/* God Pass Features */}
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs">✓</div>
                        <div className="text-[10px] text-gray-300">
                          <span className="text-amber-500 font-bold font-mono">GOD:</span> Advanced Ad-Block node, 1.5X XP connection scale, and premium <span className="text-amber-400 font-bold">Elite Accent Tag</span>.
                        </div>
                      </div>

                      {/* Monarch Pass Features */}
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-xs">★</div>
                        <div className="text-[10px] text-gray-300">
                          <span className="text-yellow-400 font-bold font-mono">MONARCH:</span> 100% Ad-Free, VIP Fast-Lane Sync, 2X XP Multi-pliers, <span className="text-yellow-500 font-black">Golden Neon Leaderboard Glow</span>, and <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500 font-extrabold uppercase">Crown Elite Badge</span>.
                        </div>
                      </div>
                    </div>

                    {/* Switch Actions for Tiers */}
                    <div className="space-y-2">
                      {currentDbUser?.is_premium && (
                        <div className="text-center p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-[9px] font-black text-yellow-500 uppercase tracking-widest leading-none mb-2">
                          Current tier: {currentDbUser?.premium_tier?.toUpperCase() || 'MONARCH'}
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => setSelectedPaymentTier('plus')}
                          className="bg-white/5 hover:bg-white/10 text-white py-2 rounded text-[9px] font-black uppercase tracking-wider transition-colors"
                        >
                          Buy Plus (₹20)
                        </button>
                        <button 
                          onClick={() => setSelectedPaymentTier('god')}
                          className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-600/30 py-2 rounded text-[9px] font-black uppercase tracking-wider transition-colors"
                        >
                          Buy God (₹49)
                        </button>
                        <button 
                          onClick={() => setSelectedPaymentTier('monarch')}
                          className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-black py-2 rounded text-[9px] font-black uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse"
                        >
                          Buy Monarch (₹149)
                        </button>
                      </div>
                      <p className="text-[8px] font-mono text-center text-gray-500 uppercase tracking-widest mt-2">Instantaneous connection. Sync multiple badges globally on purchase.</p>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        </div>
        </motion.div>
      </motion.div>
    </NewsContext.Provider>
  );
}

export default function App() {
  return (
    <ThemeEngineProvider>
      <Router>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/database" element={<AnimeDatabase />} />
            <Route path="/news" element={<News />} />
            <Route path="/news/:id" element={<NewsDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/house-treasury" element={<HouseCards />} />
            <Route path="/anime/:id" element={<AnimeDetails />} />
            <Route path="/recruit" element={<Recruitment />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="/archives" element={<Archives />} />
            <Route path="/neural-maps" element={<NeuralMaps />} />
            <Route path="/faction-war" element={<FactionWar />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/skill-tree" element={<SkillTree />} />
            <Route path="/event-horizon" element={<EventHorizon />} />
            <Route path="/data-relay" element={<DataRelay />} />
            <Route path="/squad-ops" element={<SquadOps />} />
            <Route path="/terminal-logs" element={<TerminalLogs />} />
            <Route path="/node-settings" element={<NodeSettings />} />
            
            {/* God-Level Mainframe Routes */}
            <Route path="/core-processing-unit" element={<CoreProcessingUnit />} />
            <Route path="/sector-tactical-maps" element={<SectorTacticalMaps />} />
            <Route path="/archives-intel" element={<ArchivesIntelHub />} />
            <Route path="/nexus-treasury" element={<NexusTreasury />} />
            <Route path="/vanguard-command" element={<VanguardCommand />} />
          </Routes>
        </AppLayout>
      </Router>
    </ThemeEngineProvider>
  );
}
