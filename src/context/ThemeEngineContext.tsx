import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { playDigitalSound } from '../lib/sounds';
import { CheckCircle2, AlertTriangle, AlertOctagon, X } from 'lucide-react';

export type UserThemeMode = 'normal' | 'vanguard' | 'low-power';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'SUCCESS' | 'WARNING' | 'CRITICAL_ERROR';
  origin: string;
  timestamp: string;
}

interface ThemeEngineContextProps {
  engagementScore: number;
  incrementEngagement: (amount?: number) => void;
  resetEngagement: () => void;
  setEngagementScore: (score: number) => void;
  themeMode: UserThemeMode;
  setThemeModeOverride: (mode: UserThemeMode | null) => void;
  notification: string | null;
  setNotification: (notif: string | null) => void;
  triggerNotification: (msg: string) => void;
  soundAlertsEnabled: boolean;
  setSoundAlertsEnabled: (enabled: boolean) => void;
  toasts: ToastMessage[];
  addToast: (message: string, type?: ToastMessage['type'], origin?: string) => void;
  removeToast: (id: string) => void;
}

const ThemeEngineContext = createContext<ThemeEngineContextProps | undefined>(undefined);

// Individual Toast component supporting hover-pause and visually styled progress bar
function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [progress, setProgress] = useState(100);
  const duration = 4000;
  const tick = 50;

  useEffect(() => {
    if (isHovered) return;

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev - (tick / duration) * 100;
        if (next <= 0) {
          clearInterval(timer);
          return 0;
        }
        return next;
      });
    }, tick);

    return () => clearInterval(timer);
  }, [isHovered]);

  useEffect(() => {
    if (progress <= 0) {
      onRemove();
    }
  }, [progress, onRemove]);

  // Style evaluation
  let borderClass = 'border-emerald-500/40 text-emerald-400 bg-zinc-950/85';
  let progressBg = 'bg-emerald-500';
  let Icon = CheckCircle2;

  if (toast.type === 'WARNING') {
    borderClass = 'border-amber-500/40 text-amber-400 bg-zinc-950/85';
    progressBg = 'bg-amber-500';
    Icon = AlertTriangle;
  } else if (toast.type === 'CRITICAL_ERROR') {
    borderClass = 'border-rose-500/40 text-rose-400 bg-zinc-950/85';
    progressBg = 'bg-rose-500';
    Icon = AlertOctagon;
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`pointer-events-auto w-full border ${borderClass} p-3.5 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.65)] [box-shadow:0_0_20px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.05)] flex flex-col gap-2 relative overflow-hidden backdrop-blur-md transition-all duration-300 transform hover:scale-[1.015]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2.5 items-start">
          <Icon size={14} className="shrink-0 mt-0.5" />
          <div className="flex flex-col">
            <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
              [{toast.origin}: {toast.timestamp}]
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold mt-1.5 leading-normal text-white">
              {toast.message}
            </span>
          </div>
        </div>

        <button
          onClick={onRemove}
          className="text-zinc-500 hover:text-white transition-colors"
        >
          <X size={12} />
        </button>
      </div>

      {/* Embedded visual progress tracker */}
      <div className="w-full bg-zinc-800/40 h-[1.5px] rounded-full overflow-hidden mt-1">
        <div
          className={`h-full ${progressBg} transition-all duration-50`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export function ThemeEngineProvider({ children }: { children: React.ReactNode }) {
  const [engagementScore, setEngagementScoreState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('vanguard_engagement_score');
      return saved ? Number(saved) : 4;
    } catch {
      return 4;
    }
  });

  const [themeMode, setThemeMode] = useState<UserThemeMode>('normal');
  const [modeOverride, setModeOverride] = useState<UserThemeMode | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [isIdleLowPower, setIsIdleLowPower] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const [soundAlertsEnabled, setSoundAlertsEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vanguard_audio_enabled');
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  const setSoundAlertsEnabled = (enabled: boolean) => {
    setSoundAlertsEnabledState(enabled);
    try {
      localStorage.setItem('vanguard_audio_enabled', String(enabled));
    } catch {}
  };

  const setEngagementScore = (score: number) => {
    setEngagementScoreState(score);
    try {
      localStorage.setItem('vanguard_engagement_score', String(score));
    } catch (e) {}
  };

  const incrementEngagement = (amount = 1) => {
    setEngagementScoreState(prev => {
      const next = prev + amount;
      try {
        localStorage.setItem('vanguard_engagement_score', String(next));
      } catch (e) {}
      return next;
    });
  };

  const resetEngagement = () => {
    setEngagementScore(0);
  };

  // Add toast alert to state
  const addToast = (message: string, type: ToastMessage['type'] = 'SUCCESS', origin = 'SYS_LOG') => {
    const timestamp = new Date().toLocaleTimeString([], { hour12: false });
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, origin, timestamp }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Live idle tracker
  useEffect(() => {
    let idleTimer: any;
    const resetIdleTimer = () => {
      if (isIdleLowPower) {
        setIsIdleLowPower(false);
      }
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdleLowPower(true);
      }, 40000); // 40s idle causes Low-Power Mode
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
  }, [isIdleLowPower]);

  // Determine active theme modes
  useEffect(() => {
    let calculatedMode: UserThemeMode = 'normal';

    if (modeOverride) {
      calculatedMode = modeOverride;
    } else if (isIdleLowPower) {
      calculatedMode = 'low-power';
    } else if (engagementScore >= 10) {
      calculatedMode = 'vanguard';
    }

    if (calculatedMode !== themeMode) {
      const oldMode = themeMode;
      setThemeMode(calculatedMode);

      if (calculatedMode === 'vanguard') {
        triggerNotification('[SYS_UPDATE: PERSONALITY_MATRIX_RECALIBRATED]');
        playDigitalSound('ping');
      } else if (calculatedMode === 'low-power') {
        triggerNotification('[SYS_UPDATE: LOW_POWER_STANDBY_ENGAGED]');
        playDigitalSound('click');
      } else if (oldMode !== 'normal') {
        triggerNotification('[SYS_UPDATE: CORES_STABILIZED]');
        playDigitalSound('whir');
      }
    }
  }, [engagementScore, isIdleLowPower, modeOverride, themeMode]);

  // Helper trigger notification and toasts
  const triggerNotification = (msg: string) => {
    setNotification(msg);
    
    // Evaluate appropriate severity levels and origins for toasts
    let type: ToastMessage['type'] = 'SUCCESS';
    let origin = 'SYS_LOG';

    if (msg.includes('CRITICAL') || msg.includes('FAIL') || msg.includes('ERROR')) {
      type = 'CRITICAL_ERROR';
      origin = 'SYS_ALARM';
    } else if (msg.includes('LOW_POWER') || msg.includes('STANDBY') || msg.includes('ALERT')) {
      type = 'WARNING';
      origin = 'POWER_NODE';
    } else if (msg.includes('RECALIBRATED') || msg.includes('STABILIZED')) {
      type = 'SUCCESS';
      origin = 'SYS_SYNC';
    }

    // Add toast automatically
    addToast(msg.replace(/[\[\]]/g, ''), type, origin);

    setTimeout(() => {
      setNotification(prev => prev === msg ? null : prev);
    }, 1500);
  };

  // Inject styles based on active theme
  useEffect(() => {
    let styleEl = document.getElementById('theme-override-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'theme-override-styles';
      document.head.appendChild(styleEl);
    }

    if (themeMode === 'vanguard') {
      styleEl.innerHTML = `
        :root {
          --faction-primary: #FF0000 !important;
          --faction-primary-glow: rgba(255, 0, 0, 0.8) !important;
          animation-duration: 0.15s !important;
          transition-duration: 0.15s !important;
        }
        .flex.flex-col, .grid {
          gap: 0.95rem !important;
        }
        .plexiglass, .aluminum-frame {
          padding: 1.15rem !important;
          border-color: rgba(255, 0, 0, 0.5) !important;
          box-shadow: 0 0 25px rgba(255, 0, 0, 0.3) !important;
        }
        .animate-pulse {
          animation-duration: 0.8s !important;
        }
        .chromatic-text {
          text-shadow: -1px -1px 0 #00ffff, 1px 1px 0 #ff00ff, 0 0 12px rgba(255, 0, 0, 0.6) !important;
        }
      `;
    } else if (themeMode === 'low-power') {
      styleEl.innerHTML = `
        :root {
          --faction-primary: #555555 !important;
          --faction-primary-glow: rgba(85, 85, 85, 0.2) !important;
          --faction-bg: #050505 !important;
          --faction-panel-bg: #090909 !important;
          --faction-border: #151515 !important;
        }
        img, .Sparkline, svg, .sparkline {
          filter: grayscale(1) contrast(0.8) !important;
          opacity: 0.45 !important;
        }
        aside, .plexiglass, .aluminum-frame, main, .bg-carbon {
          filter: grayscale(1) !important;
          background-color: #070707 !important;
          border-color: #121212 !important;
          box-shadow: none !important;
          animation: none !important;
          transition: none !important;
        }
        * {
          animation: none !important;
          transition: none !important;
        }
      `;
    } else {
      styleEl.innerHTML = '';
    }
  }, [themeMode]);

  return (
    <ThemeEngineContext.Provider value={{
      engagementScore,
      incrementEngagement,
      resetEngagement,
      setEngagementScore,
      themeMode,
      setThemeModeOverride: setModeOverride,
      notification,
      setNotification,
      triggerNotification,
      soundAlertsEnabled,
      setSoundAlertsEnabled,
      toasts,
      addToast,
      removeToast
    }}>
      {children}

      {/* Floating System Calibrated Toast alerts */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[99999] pointer-events-none font-mono text-[9px] bg-black border border-red-500/60 text-[#FF3333] px-3.5 py-2 rounded-xl shadow-[0_0_20px_rgba(255,0,0,0.4)] animate-bounce select-none tracking-widest uppercase">
          {notification}
        </div>
      )}

      {/* Multi-stack dynamic toast notification list (Top Right Corner) */}
      <div className="fixed top-24 right-6 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ThemeEngineContext.Provider>
  );
}

export function useThemeEngine() {
  const context = useContext(ThemeEngineContext);
  if (!context) {
    throw new Error('useThemeEngine must be used within ThemeEngineProvider');
  }
  return context;
}
