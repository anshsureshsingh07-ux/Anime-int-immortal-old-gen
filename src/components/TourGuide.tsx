import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronRight, ChevronLeft, X, Sparkles, Navigation, Monitor, Eye, Play } from 'lucide-react';
import { playDigitalSound } from '../lib/sounds';

interface Step {
  title: string;
  text: string;
  selector: string;
  fallbackText?: string;
}

interface TourGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_STEPS: Step[] = [
  {
    title: "1. COGNITIVE MAINFRAME",
    text: "Welcome to the Mainframe. Here you can see your live Faction status and active Neural Stream.",
    selector: "#neural-stream-marquee",
    fallbackText: "Your active Neural stream ticker updates with live transmissions."
  },
  {
    title: "2. COMBAT LOG NAVIGATION",
    text: "Use the Sidebar to navigate between your Tactical Maps, Archives, and Vanguard Command Center.",
    selector: "#app-sidebar-aside",
    fallbackText: "The system sidebar housing all strategic operations."
  },
  {
    title: "3. TACTICAL RECOMMENDER",
    text: "The For You section is your personal AI recommender. It tunes itself to your taste.",
    selector: "#sidebar-for-you-link",
    fallbackText: "Access tactical recommendation feeds calibrated to your biometrics."
  },
  {
    title: "4. SYSTEM SUBSYSTEM CORES",
    text: "Click the [EXTENDED_MODES] button to view secondary menus and settings.",
    selector: "#sidebar-extended-modes-btn",
    fallbackText: "Toggle expansion modules to reveal classified secondary logs."
  }
];

export default function TourGuide({ isOpen, onClose }: TourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [isElementVisible, setIsElementVisible] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Sound triggering helper
  const triggerSound = (type: 'click' | 'ping') => {
    try {
      playDigitalSound(type);
    } catch (e) {
      console.warn("Sound playback offline in this tactical cycle.", e);
    }
  };

  // Close tour session and preserve completion state
  const handleFinish = () => {
    triggerSound('click');
    localStorage.setItem('nexus_mainframe_tour_completed', 'true');
    onClose();
  };

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      triggerSound('click');
      setCurrentStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      triggerSound('click');
      setCurrentStep(prev => prev - 1);
    }
  };

  // Synchronize target bounding rect whenever step or layout transitions
  useEffect(() => {
    if (!isOpen) return;

    const step = TOUR_STEPS[currentStep];

    // Special behavior for Step 3: if targeting #sidebar-for-you-link and it's hidden under uncollapsed menu, trigger collapse open
    if (currentStep === 2) {
      const forYou = document.querySelector(step.selector);
      if (!forYou) {
        const extBtn = document.getElementById('sidebar-extended-modes-btn') as HTMLButtonElement | null;
        if (extBtn) {
          extBtn.click();
        }
      }
    }

    const updateBoundingBox = () => {
      const el = document.querySelector(step.selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setHighlightRect(rect);
        setIsElementVisible(rect.width > 0 && rect.height > 0);
      } else {
        setHighlightRect(null);
        setIsElementVisible(false);
      }
    };

    // Delay slightly to give collapsibles time to animate their height
    const timer = setTimeout(updateBoundingBox, 300);

    // Dynamic resize tracking
    if (window.ResizeObserver) {
      resizeObserverRef.current = new ResizeObserver(() => {
        updateBoundingBox();
      });
      const el = document.querySelector(step.selector);
      if (el) {
        resizeObserverRef.current.observe(el);
      }
    }

    window.addEventListener('resize', updateBoundingBox);
    window.addEventListener('scroll', updateBoundingBox, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateBoundingBox);
      window.removeEventListener('scroll', updateBoundingBox, true);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [currentStep, isOpen]);

  // Restart step counter when tour starts
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      triggerSound('ping');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStepData = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[10000] overflow-hidden pointer-events-none">
      
      {/* 1. Backdrop layer: focuses attention on the spotlight elements */}
      {isElementVisible && highlightRect ? (
        <>
          {/* Spotlight hollow cutout background mask */}
          <div 
            className="fixed border border-[var(--faction-primary,#E50914)] rounded-xl transition-all duration-300"
            style={{
              top: highlightRect.top - 6,
              left: highlightRect.left - 6,
              width: highlightRect.width + 12,
              height: highlightRect.height + 12,
              boxShadow: '0 0 0 9999px rgba(3, 1, 6, 0.78), 0 0 15px 4px var(--faction-primary-glow, rgba(229, 9, 20, 0.6))',
              pointerEvents: 'none',
              zIndex: 10001,
            }}
          />
        </>
      ) : (
        /* Fallback Backdrop if element is offscreen / hidden (e.g., mobile viewport sidebars) */
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
          style={{ zIndex: 10001 }}
        />
      )}

      {/* 2. Floating Dialog Panel container and HUD Controls details */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-4 md:p-6"
        style={{ zIndex: 10002 }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          transition={{ type: "spring", damping: 20 }}
          className="w-full max-w-sm bg-[#08040d]/98 border border-[var(--faction-primary,#E50914)]/50 rounded-2xl p-5 md:p-6 shadow-[0_0_40px_var(--faction-primary-glow,rgba(229,9,20,0.3))] text-zinc-100 flex flex-col relative pointer-events-auto overflow-hidden text-zinc-300"
        >
          {/* Holographic matrix background design details */}
          <div className="absolute top-1.5 right-3 text-[6px] font-mono text-zinc-600 select-none pointer-events-none uppercase">
            HOLOGRAPHIC_TOUR_INTERFACE
          </div>
          
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--faction-primary,#E50914)] to-transparent opacity-60" />

          {/* Icon Header status */}
          <div className="flex items-center gap-3 border-b border-white/5 pb-3 mb-4 select-none">
            <div className="p-1 px-2.5 bg-[var(--faction-primary-glow,rgba(229,9,20,0.15))] rounded-lg text-[var(--faction-primary,#E50914)] border border-red-500/10">
              <Monitor size={14} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] tracking-[0.25em] text-[var(--faction-primary,#E50914)] font-mono uppercase bg-red-950/20 px-1.5 py-0.5 border border-red-500/10 rounded">
                OPS_GUIDE
              </span>
              <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-widest mt-0.5">TACTICAL PROTOCOL</h4>
            </div>
            <button 
              onClick={handleFinish}
              className="ml-auto text-zinc-500 hover:text-white transition-colors cursor-pointer"
              title="Close System Walkthrough"
            >
              <X size={16} />
            </button>
          </div>

          {/* Stepper info details */}
          <div id="tour-card-body" className="flex-1 mb-5">
            <h3 className="font-mono text-white text-xs font-black tracking-widest mb-1.5 uppercase text-[var(--faction-primary,#E50914)]">
              {currentStepData.title}
            </h3>
            <p className="text-xs text-zinc-400 font-sans leading-relaxed">
              {currentStepData.text}
            </p>
            
            {/* If element is hidden on mobile layout */}
            {!isElementVisible && (
              <span className="mt-3 block text-[9px] font-mono bg-yellow-950/20 border border-yellow-500/20 text-yellow-500 px-2.5 py-1 rounded select-none opacity-80">
                [SYSTEM WARNING]: Node element is currently collapsed or minimized on this interface. Use desktop layouts for exact visual pointers.
              </span>
            )}
          </div>

          {/* Progress node bars */}
          <div className="flex items-center gap-1.5 mb-4 select-none">
            {TOUR_STEPS.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1 rounded-full flex-1 transition-all duration-300 ${
                  idx === currentStep 
                    ? 'bg-[var(--faction-primary,#E50914)] shadow-[0_0_8px_var(--faction-primary,#E50914)]' 
                    : idx < currentStep 
                      ? 'bg-[var(--faction-primary,#E50914)]/40' 
                      : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>

          {/* Controller actions bar */}
          <div className="flex items-center justify-between font-mono text-[10px] select-none">
            <button
              onClick={handleFinish}
              className="text-zinc-500 hover:text-white uppercase transition-colors tracking-widest font-black"
            >
              [SKIP TOUR]
            </button>

            <div className="flex items-center gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-2.5 py-1.5 rounded bg-zinc-900 border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white flex items-center gap-1 transition-all uppercase tracking-wider"
                >
                  <ChevronLeft size={12} /> Back
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="px-4 py-1.5 rounded bg-[var(--faction-primary,#E50914)] text-white font-extrabold flex items-center gap-1 hover:bg-opacity-95 shadow-[0_0_12px_var(--faction-primary-glow,rgba(229,9,20,0.3))] transition-all uppercase tracking-wider hover:scale-105 active:scale-95 cursor-pointer border border-red-500"
              >
                {currentStep === TOUR_STEPS.length - 1 ? 'FINISH' : 'NEXT'} <ChevronRight size={12} />
              </button>
            </div>
          </div>

        </motion.div>
      </div>

    </div>
  );
}
