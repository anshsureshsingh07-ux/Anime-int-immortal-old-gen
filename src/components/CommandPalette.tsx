import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useThemeEngine } from '../context/ThemeEngineContext';
import { playDigitalSound } from '../lib/sounds';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  Search,
  Sparkles,
  Cpu,
  Layers,
  Home,
  Newspaper,
  Crown,
  BookOpen,
  Shield,
  Coins,
  Users,
  Settings,
  LogOut,
  Volume2,
  VolumeX,
  Download,
  Layout,
  User,
  Skull,
  Terminal,
  Activity,
  Calendar,
  Sword,
  Wrench,
  Globe,
  BellRing
} from 'lucide-react';

interface Command {
  id: string;
  title: string;
  subtitle: string;
  shortcut?: string;
  category: 'NAVIGATION' | 'SYSTEM ACTIONS' | 'FACTION NODES';
  action: () => void;
  icon: React.ComponentType<any>;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const {
    themeMode,
    setThemeModeOverride,
    engagementScore,
    setEngagementScore,
    soundAlertsEnabled,
    setSoundAlertsEnabled,
    addToast
  } = useThemeEngine();

  // Listen for Cmd+K / Ctrl+K triggers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(prev => {
          const next = !prev;
          if (next) {
            playDigitalSound('ping');
          } else {
            playDigitalSound('click');
          }
          return next;
        });
        setSearch('');
        setSelectedIndex(0);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        playDigitalSound('click');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Handle focus retention
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 80);
    }
  }, [isOpen]);

  // Construct our massive registry of 20+ pages & quick actions
  const commands: Command[] = [
    // 1. Navigation items
    {
      id: 'nav-home',
      title: 'Go to Operational Home',
      subtitle: 'Main news telemetry feed & chronological broadcasts',
      shortcut: 'G H',
      category: 'NAVIGATION',
      icon: Home,
      action: () => navigate('/')
    },
    {
      id: 'nav-profile',
      title: 'Go to User Profile Hub',
      subtitle: 'View faction ranks, personal XP, active badges',
      shortcut: 'G P',
      category: 'NAVIGATION',
      icon: User,
      action: () => navigate('/profile')
    },
    {
      id: 'nav-database',
      title: 'Go to Anime Database Catalog',
      subtitle: 'Full series directory index with rate-limited Jikan backups',
      shortcut: 'G D',
      category: 'NAVIGATION',
      icon: BookOpen,
      action: () => navigate('/database')
    },
    {
      id: 'nav-news',
      title: 'Go to News Wire Center',
      subtitle: 'Consolidated announcements and chronologies',
      shortcut: 'G N',
      category: 'NAVIGATION',
      icon: Newspaper,
      action: () => navigate('/news')
    },
    {
      id: 'nav-leaderboard',
      title: 'Go to Faction Leaderboards',
      subtitle: 'Global standing of community house legions',
      shortcut: 'G L',
      category: 'NAVIGATION',
      icon: Crown,
      action: () => navigate('/leaderboard')
    },
    {
      id: 'nav-treasury',
      title: 'Go to House Treasury',
      subtitle: 'Manage tax balances, investments and land deeds',
      shortcut: 'G T',
      category: 'NAVIGATION',
      icon: Coins,
      action: () => navigate('/house-treasury')
    },
    {
      id: 'nav-recruit',
      title: 'Go to Vanguard Recruitment Support',
      subtitle: 'Enlist on factions, review pending application nodes',
      shortcut: 'G R',
      category: 'NAVIGATION',
      icon: Shield,
      action: () => navigate('/recruit')
    },
    {
      id: 'nav-archives',
      title: 'Go to Secure Archives Vault',
      subtitle: 'Play Store aligned chronicles & legal series checks',
      shortcut: 'G A',
      category: 'NAVIGATION',
      icon: Layers,
      action: () => navigate('/archives')
    },
    {
      id: 'nav-faction-war',
      title: 'Go to Active Faction War Rooms',
      subtitle: 'Evaluate war coordinates, multipliers & article likes',
      shortcut: 'G W',
      category: 'NAVIGATION',
      icon: Sword,
      action: () => navigate('/faction-war')
    },
    {
      id: 'nav-marketplace',
      title: 'Go to Core Marketplace',
      subtitle: 'Weapons, amulets, and legendary physical gears',
      shortcut: 'G M',
      category: 'NAVIGATION',
      icon: Activity,
      action: () => navigate('/marketplace')
    },
    {
      id: 'nav-skills',
      title: 'Go to Personal Skill Tree',
      subtitle: 'Map out combat techniques and sync multipliers',
      shortcut: 'G S',
      category: 'NAVIGATION',
      icon: Skull,
      action: () => navigate('/skill-tree')
    },
    {
      id: 'nav-schedule',
      title: 'Go to Event Horizon (Schedules)',
      subtitle: 'Real-time countdown indicators for coming episodes',
      shortcut: 'G E',
      category: 'NAVIGATION',
      icon: Calendar,
      action: () => navigate('/event-horizon')
    },
    {
      id: 'nav-squads',
      title: 'Go to Squad Operations (Room Hub)',
      subtitle: 'Coordinated watch parties, slots & room streams',
      shortcut: 'G O',
      category: 'NAVIGATION',
      icon: Users,
      action: () => navigate('/squad-ops')
    },
    {
      id: 'nav-logs',
      title: 'Go to Command Terminal Logs',
      subtitle: 'Read system-wide version change parameters',
      shortcut: 'G V',
      category: 'NAVIGATION',
      icon: Terminal,
      action: () => navigate('/terminal-logs')
    },
    {
      id: 'nav-settings',
      title: 'Go to Node Settings Console',
      subtitle: 'Personalize theme engines & privacy export datasets',
      shortcut: 'G C',
      category: 'NAVIGATION',
      icon: Settings,
      action: () => navigate('/node-settings')
    },
    {
      id: 'nav-cpu',
      title: 'Go to CPU Core Processing Unit',
      subtitle: 'Server metrics graphs and load balancing displays',
      shortcut: 'M C',
      category: 'NAVIGATION',
      icon: Cpu,
      action: () => navigate('/core-processing-unit')
    },
    {
      id: 'nav-sector-tactical',
      title: 'Go to Sector Tactical Mapping',
      subtitle: 'Fringe system relays and secure radar coordinates',
      shortcut: 'M S',
      category: 'NAVIGATION',
      icon: Globe,
      action: () => navigate('/sector-tactical-maps')
    },
    {
      id: 'nav-intel',
      title: 'Go to Archives Intel Hub',
      subtitle: 'Highly synchronized intelligence telemetry matrices',
      shortcut: 'M I',
      category: 'NAVIGATION',
      icon: Wrench,
      action: () => navigate('/archives-intel')
    },
    {
      id: 'nav-nexus',
      title: 'Go to Nexus Treasury Hub',
      subtitle: 'Distributed accounting ledgers & transactional logs',
      shortcut: 'M N',
      category: 'NAVIGATION',
      icon: Activity,
      action: () => navigate('/nexus-treasury')
    },
    {
      id: 'nav-vanguard-ctrl',
      title: 'Go to Vanguard Command Console',
      subtitle: 'Main root administrative command parameters',
      shortcut: 'M V',
      category: 'NAVIGATION',
      icon: Shield,
      action: () => navigate('/vanguard-command')
    },

    // 2. Quick Actions
    {
      id: 'act-vanguard-on',
      title: 'Set Personality: VANGUARD OVERDRIVE',
      subtitle: 'Forces maximum responsiveness and crimson visual overlays',
      category: 'SYSTEM ACTIONS',
      icon: Sparkles,
      action: () => {
        setThemeModeOverride('vanguard');
        setEngagementScore(15);
        addToast('Vanguard Personality Calibration Locked', 'SUCCESS', 'SYS_SYNC');
      }
    },
    {
      id: 'act-lowpower-on',
      title: 'Set Personality: LOW-POWER IDLE',
      subtitle: 'Dims screens & desaturates color grids (energy preservation)',
      category: 'SYSTEM ACTIONS',
      icon: Cpu,
      action: () => {
        setThemeModeOverride('low-power');
        addToast('Low-Power Standby Override Engaged', 'WARNING', 'POWER_NODE');
      }
    },
    {
      id: 'act-normal-on',
      title: 'Restore Personality Matrix: NORMAL',
      subtitle: 'Resets engagement states to standard parameters',
      category: 'SYSTEM ACTIONS',
      icon: Layout,
      action: () => {
        setThemeModeOverride('normal');
        setEngagementScore(4);
        addToast('Optimal Calibration State Restored', 'SUCCESS', 'SYS_SYNC');
      }
    },
    {
      id: 'act-sfx-on',
      title: 'Enable Audio SFX Synth',
      subtitle: 'Activates synthetic feedback tones on mouse click & tick events',
      category: 'SYSTEM ACTIONS',
      icon: Volume2,
      action: () => {
        setSoundAlertsEnabled(true);
        addToast('Synthesizer Oscillators Activated', 'SUCCESS', 'AUD_CORE');
      }
    },
    {
      id: 'act-sfx-off',
      title: 'Disable Audio SFX Synth',
      subtitle: 'Silences all digital alerts instantly',
      category: 'SYSTEM ACTIONS',
      icon: VolumeX,
      action: () => {
        setSoundAlertsEnabled(false);
        addToast('Synthesizer Output Terminated', 'WARNING', 'AUD_CORE');
      }
    },
    {
      id: 'act-test-warn',
      title: 'Broadcast Warning Simulation',
      subtitle: 'Triggers a dummy telemetry warning toast to review status',
      category: 'SYSTEM ACTIONS',
      icon: BellRing,
      action: () => {
        addToast('Simulated telemetry coordinate bounds exceeded.', 'WARNING', 'TELEMETRY');
      }
    },
    {
      id: 'act-test-err',
      title: 'Broadcast Critical Alarm Simulation',
      subtitle: 'Triggers a mock high-severity incident notification',
      category: 'SYSTEM ACTIONS',
      icon: Skull,
      action: () => {
        addToast('External quantum bypass detected on core port [3000].', 'CRITICAL_ERROR', 'FIREWALL');
      }
    },
    {
      id: 'act-export',
      title: 'Trigger Private Node History Export',
      subtitle: 'Packages active trades, likes & metadata into client JSON',
      category: 'SYSTEM ACTIONS',
      icon: Download,
      action: () => {
        // Construct simple audit payload
        const userEmail = auth.currentUser?.email || 'unauthenticated_node';
        const payload = {
          export_timestamp: new Date().toISOString(),
          node_identity: userEmail,
          hardware_parameters: {
            preset_theme: localStorage.getItem('vanguard_custom_preset_theme') || 'akatsuki',
            engagement_points: engagementScore,
            sound_waves_active: soundAlertsEnabled
          },
          simulated_neural_history: [
            { event: 'terminal_session_stabilized', code: 'SYS_SYNC_01', latency_ms: 12 },
            { event: 'faction_battle_power_rebalanced', code: 'WAR_POW_R', xp_gain: 250 },
            { event: 'security_keychain_decrypted', code: 'SEC_DEC_K', device: 'Neural-Link v1.1' }
          ]
        };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
        const dlAnchor = document.createElement('a');
        dlAnchor.setAttribute("href", dataStr);
        dlAnchor.setAttribute("download", `neural_export_${userEmail.replace('@','_')}.json`);
        document.body.appendChild(dlAnchor);
        dlAnchor.click();
        dlAnchor.remove();
        addToast('Acoustic History Exported successfully ✔', 'SUCCESS', 'DATA_MGMT');
      }
    },
    {
      id: 'act-logout',
      title: 'Disconnect Node Connection (Log Out)',
      subtitle: 'Safely de-authorizes current active credentials',
      category: 'SYSTEM ACTIONS',
      icon: LogOut,
      action: async () => {
        try {
          await signOut(auth);
          addToast('Cred sync terminated. Node inactive.', 'WARNING', 'AUTH_DEPT');
          navigate('/auth');
        } catch (err) {
          addToast('Auth termination failed.', 'CRITICAL_ERROR', 'AUTH_DEPT');
        }
      }
    }
  ];

  // Filtering list based on search Input
  const filteredCommands = commands.filter(cmd =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    cmd.subtitle.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Keyboard navigation through filtered items
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      playDigitalSound('click');
      scrollToSelected();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      playDigitalSound('click');
      scrollToSelected();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex]);
      }
    }
  };

  const scrollToSelected = () => {
    setTimeout(() => {
      const parent = scrollContainerRef.current;
      if (!parent) return;
      const selectedEl = parent.querySelector('[data-selected="true"]') as HTMLElement;
      if (!selectedEl) return;

      const parentHeight = parent.offsetHeight;
      const selectedTop = selectedEl.offsetTop;
      const selectedHeight = selectedEl.offsetHeight;

      if (selectedTop + selectedHeight > parent.scrollTop + parentHeight) {
        parent.scrollTop = selectedTop + selectedHeight - parentHeight;
      } else if (selectedTop < parent.scrollTop) {
        parent.scrollTop = selectedTop;
      }
    }, 10);
  };

  const executeCommand = (cmd: Command) => {
    playDigitalSound('ping');
    cmd.action();
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setIsOpen(false);
              playDigitalSound('click');
            }}
            className="fixed inset-0 bg-black/75 backdrop-blur-[12px] z-[99990] cursor-pointer"
          />

          {/* Modal Content container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 z-[99991] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.1 }}
              onKeyDown={handleKeyDown}
              className="pointer-events-auto w-full max-w-2xl bg-zinc-950/90 border border-white/10 rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.85)] [box-shadow:0_0_30px_rgba(0,0,0,0.8),_inset_0_1px_1.5px_rgba(255,255,255,0.06)] overflow-hidden flex flex-col relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

              {/* Input Header */}
              <div className="flex items-center gap-3.5 px-4.5 py-4 border-b border-white/5 relative z-10 shrink-0">
                <Search size={18} className="text-zinc-500 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="SEARCH CHANNELS, OPERATIONAL ROUTES, OR QUICK SYSTEM MODULES..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedIndex(0);
                  }}
                  className="w-full bg-transparent border-none text-white placeholder-zinc-600 focus:outline-none focus:ring-0 text-xs font-mono tracking-wider font-extrabold uppercase"
                />
                
                {/* Visual HUD Badge indicating Cmd+K context */}
                <div className="hidden sm:flex items-center gap-1 bg-white/5 px-2 py-1 rounded border border-white/10 font-mono text-[8px] text-zinc-400 select-none uppercase font-black shrink-0">
                  <span>ESC To Exit</span>
                </div>
              </div>

              {/* Quick Suggestion List */}
              <div
                ref={scrollContainerRef}
                className="max-h-[380px] overflow-y-auto p-2.5 custom-scrollbar flex flex-col gap-1 relative z-10"
              >
                {filteredCommands.length > 0 ? (
                  // Group by categories
                  ['NAVIGATION', 'SYSTEM ACTIONS', 'FACTION NODES'].map((cat) => {
                    const catCommands = filteredCommands.filter(c => c.category === cat);
                    if (catCommands.length === 0) return null;

                    return (
                      <div key={cat} className="flex flex-col gap-1 mt-1 pb-1">
                        <span className="text-[7.5px] font-mono text-zinc-500 tracking-[0.3em] font-black uppercase px-2.5 py-1 select-none">
                          // {cat} telemetries
                        </span>

                        {catCommands.map((cmd) => {
                          // Find overall index to determine selection state
                          const overallIndex = filteredCommands.findIndex(c => c.id === cmd.id);
                          const isSelected = overallIndex === selectedIndex;

                          const CmdIcon = cmd.icon;

                          return (
                            <div
                              key={cmd.id}
                              onClick={() => executeCommand(cmd)}
                              onPointerDown={() => setSelectedIndex(overallIndex)}
                              data-selected={isSelected}
                              className={`flex items-center justify-between gap-4 p-3 rounded-xl border transition-all cursor-pointer select-none ${
                                isSelected
                                  ? 'bg-red-500/10 border-red-500/25 shadow-[0_0_15px_rgba(239,68,68,0.06)]'
                                  : 'bg-transparent border-transparent hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg border ${
                                  isSelected 
                                    ? 'bg-red-500/15 border-red-500/20 text-red-500' 
                                    : 'bg-zinc-900 border-white/5 text-zinc-400'
                                }`}>
                                  <CmdIcon size={14} />
                                </div>

                                <div className="flex flex-col">
                                  <span className={`text-[10px] font-mono uppercase tracking-wider font-extrabold ${
                                    isSelected ? 'text-white' : 'text-zinc-300'
                                  }`}>
                                    {cmd.title}
                                  </span>
                                  <span className="text-[8px] font-sans font-medium text-zinc-500 uppercase tracking-wide mt-0.5">
                                    {cmd.subtitle}
                                  </span>
                                </div>
                              </div>

                              {/* Shortcut Tag overlay */}
                              {cmd.shortcut && (
                                <span className={`font-mono text-[8px] tracking-widest px-2 py-0.5 rounded border ${
                                  isSelected
                                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                    : 'bg-zinc-900 border-white/5 text-zinc-500'
                                }`}>
                                  {cmd.shortcut}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-zinc-650 flex flex-col items-center justify-center gap-2">
                    <Skull size={24} className="opacity-40 animate-pulse text-zinc-600" />
                    <span className="font-mono text-[9px] uppercase tracking-widest font-black text-zinc-500">
                      NO CONCURRENT CHANNELS MATCHING REQUEST
                    </span>
                  </div>
                )}
              </div>

              {/* Monospaced Footer / Legend status bar */}
              <div className="bg-[#030105]/95 px-4.5 py-3 border-t border-white/5 flex items-center justify-between font-mono text-[8.5px] text-zinc-500 select-none shrink-0 relative z-10 uppercase font-black">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-1 h-1 rounded-full bg-zinc-600 animate-ping"></span>
                    CORE INGRESS: PORT 3000
                  </span>
                  <span>|</span>
                  <span>SYSTEM CALIBRATION: ACTIVE</span>
                </div>

                <div className="hidden sm:flex items-center gap-4">
                  <span>↑↓ Nav</span>
                  <span>↵ Exec</span>
                  <span>Esc Close</span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
