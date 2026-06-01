import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CyberMascotProps {
  state: 'default' | 'email' | 'password';
  index: number;
}

// Configuration details for custom chibi characters
const getMascotProfile = (idx: number) => {
  switch (idx) {
    case 0:
      return {
        label: 'NODE_ALPHA',
        sub: 'RED.SYS.01',
        defaultColor: '#E50914', // Theme Crimson
        glowColor: '#FF3333',
        tagColor: 'text-red-500',
        accentText: 'A-NODE // SEC',
        displayName: 'ALPHA',
        image: '/src/assets/images/mascot_alpha_1780116190399.png',
        desc: 'Frontline protection core. Equipped with asymmetric horn sweep antenna and intense red visor decals for high-threat monitoring.',
        threatLevel: 'MAXIMUM // CORE_SHIELD'
      };
    case 2:
      return {
        label: 'NODE_GAMMA',
        sub: 'AMB.SYS.03',
        defaultColor: '#F59E0B', // Warm Amber
        glowColor: '#FBBF24',
        tagColor: 'text-amber-500',
        accentText: 'G-NODE // COM',
        displayName: 'GAMMA',
        image: '/src/assets/images/mascot_gamma_1780116231032.png',
        desc: 'Advanced telemetry query core. Features directional antenna ears & diagnostic hazard styling with inquisitorial behavior.',
        threatLevel: 'INTELLIGENT // AUDIT'
      };
    case 1:
    default:
      return {
        label: 'NODE_BETA',
        sub: 'CYN.SYS.02',
        defaultColor: '#06B6D4', // Cool Cyan
        glowColor: '#22D3EE',
        tagColor: 'text-cyan-500',
        accentText: 'B-NODE // OPT',
        displayName: 'BETA',
        image: '/src/assets/images/mascot_beta_1780116211127.png',
        desc: 'Tactical lead grid coordinator. Handles secondary dual-concentric target matrices and active squad logic synchronization.',
        threatLevel: 'STANDARD // COORDINATOR'
      };
  }
};

export function CyberMascot({ state, index }: CyberMascotProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [pupilX, setPupilX] = useState(0);
  const [pupilY, setPupilY] = useState(0);
  const [angle, setAngle] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  
  // Natural wandering idle offset to make them look like they are checking things out
  const [ambientOffset, setAmbientOffset] = useState({ x: 0, y: 0 });

  // Refactored to support individual reaction states and staggered updates
  const [localReaction, setLocalReaction] = useState<'default' | 'email' | 'password'>(state);
  
  // Independent Idle Personality Micro-Animations
  const [microAnim, setMicroAnim] = useState<'none' | 'tilt-left' | 'tilt-right' | 'glance' | 'wink'>('none');
  
  // Randomized Focus target for gaze during typing mode
  const [gazeFocus, setGazeFocus] = useState<'cursor' | 'neighbor-left' | 'neighbor-right' | 'center'>('cursor');

  // A. Staggered Reaction Timer - Each mascot reacts after a randomized delay (0 - 300ms)
  useEffect(() => {
    const minStagger = index * 40; // baseline spacing
    const randomStagger = Math.random() * 260; // stochastic variance
    const delay = minStagger + randomStagger;

    const handler = setTimeout(() => {
      setLocalReaction(state);
    }, delay);

    return () => clearTimeout(handler);
  }, [state, index]);

  // B. Staggered Focus Swapping Timer - Randomly pivot gaze while typing to avoid rigid cursor staring
  useEffect(() => {
    if (localReaction !== 'email') {
      setGazeFocus('cursor');
      return;
    }

    let isMounted = true;
    let focusTimer: NodeJS.Timeout;

    const swapFocus = () => {
      if (!isMounted) return;

      // Distribution: 50% cursor focus, 50% split among center and neighbors
      const distribution: Array<'cursor' | 'neighbor-left' | 'neighbor-right' | 'center'> = [
        'cursor', 'cursor', 'neighbor-left', 'neighbor-right', 'center'
      ];
      const selectedGaze = distribution[Math.floor(Math.random() * distribution.length)];
      setGazeFocus(selectedGaze);

      // Pivot to new attention vector every 1200ms - 2800ms
      const nextDelay = 1200 + Math.random() * 1600;
      focusTimer = setTimeout(swapFocus, nextDelay);
    };

    focusTimer = setTimeout(swapFocus, 1000);

    return () => {
      isMounted = false;
      clearTimeout(focusTimer);
    };
  }, [localReaction]);

  // C. Natural Idle Personality Loops - Random micro-actions every 5-10s
  useEffect(() => {
    let isMounted = true;
    let animTimer: NodeJS.Timeout;

    const triggerMicroAction = () => {
      if (!isMounted) return;

      // Only fire idle animations when not actively processing inputs/gaze
      if (localReaction === 'default') {
        const actions: Array<'tilt-left' | 'tilt-right' | 'glance' | 'wink'> = [
          'tilt-left', 'tilt-right', 'glance', 'wink'
        ];
        const chosen = actions[Math.floor(Math.random() * actions.length)];
        setMicroAnim(chosen);

        // Reset the micro action after a brief human-like feedback duration (1s - 1.8s)
        setTimeout(() => {
          if (isMounted) setMicroAnim('none');
        }, 1000 + Math.random() * 800);
      }

      // Schedule subsequent idle event between 5,000ms & 10,000ms
      const nextInterval = 5000 + Math.random() * 5000;
      animTimer = setTimeout(triggerMicroAction, nextInterval);
    };

    const initialDelay = 3000 + Math.random() * 5000;
    animTimer = setTimeout(triggerMicroAction, initialDelay);

    return () => {
      isMounted = false;
      clearTimeout(animTimer);
    };
  }, [localReaction]);

  // 1. Independent blinks at randomized intervals based on character personalities
  useEffect(() => {
    let isMounted = true;
    let timerId: NodeJS.Timeout;

    const triggerBlink = () => {
      if (!isMounted) return;
      
      setIsBlinking(true);
      
      // Let pupil shut for 160ms
      setTimeout(() => {
        if (isMounted) setIsBlinking(false);
      }, 160);

      // Unique timing configurations per character
      const minInterval = index === 0 ? 1800 : index === 1 ? 3200 : 4500;
      const maxInterval = index === 0 ? 3500 : index === 1 ? 6500 : 9000;
      const nextDelay = minInterval + Math.random() * (maxInterval - minInterval);
      
      timerId = setTimeout(triggerBlink, nextDelay);
    };

    // First scheduled blink
    const initialDelay = 1500 + Math.random() * 3000;
    timerId = setTimeout(triggerBlink, initialDelay);

    return () => {
      isMounted = false;
      clearTimeout(timerId);
    };
  }, [index]);

  // 2. Slow ambient wander effect for when the cursor is static or tracking is idle
  useEffect(() => {
    const driftInterval = setInterval(() => {
      if (localReaction === 'password') return;
      
      // Left character jitters/wanders more often, Gamma (Right) slowly drifts
      const maxDrift = index === 0 ? 2.5 : index === 2 ? 1.5 : 2.0;
      const randomDriftX = (Math.random() - 0.5) * maxDrift;
      const randomDriftY = (Math.random() - 0.5) * (maxDrift * 0.7);
      
      setAmbientOffset({ x: randomDriftX, y: randomDriftY });
    }, 1800 + Math.random() * 2200);

    return () => clearInterval(driftInterval);
  }, [localReaction, index]);

  // 3. Cursor Tracking with Distributed Logic Perspective offsets
  useEffect(() => {
    if (localReaction === 'password') return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!svgRef.current) return;
      
      const rect = svgRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      let dx = e.clientX - centerX;
      let dy = e.clientY - centerY;
      
      // Perspective and stance offsets (looks at slightly different target vectors)
      if (index === 0) {
        dx -= 30; // Eyes slightly biased leftwards
        dy -= 5;
      } else if (index === 2) {
        dx += 30; // Eyes slightly biased rightwards
        dy += 10;
      } else {
        dy -= 8;
      }

      // Sluggish eye responsiveness variations
      const dampingFactor = index === 0 ? 28 : index === 1 ? 36 : 48;
      
      const rad = Math.atan2(dy, dx);
      let deg = rad * (180 / Math.PI);
      
      // Fine-tuned angle offset per chibi
      if (index === 0) deg -= 6;
      if (index === 2) deg += 8;
      
      setAngle(deg);
      
      // Limit eye travel based on character boundary sizes
      const boundLimit = index === 2 ? 4.8 : index === 0 ? 6.5 : 5.8;
      const distanceVec = Math.min(Math.hypot(dx, dy) / dampingFactor, boundLimit);
      
      setPupilX(Math.cos(rad) * distanceVec);
      setPupilY(Math.sin(rad) * distanceVec);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [localReaction, index]);

  const profile = getMascotProfile(index);
  const isHappy = localReaction === 'email';
  const isShy = localReaction === 'password';

  // State-integrated active pupil target positioning
  let activePupilX = pupilX + ambientOffset.x;
  let activePupilY = pupilY + ambientOffset.y;
  let activeAngle = angle;

  if (isShy) {
    // Shy look away from keyboard / focus
    activePupilX = -7.5;
    activePupilY = 4.2;
    activeAngle = -22;
  } else if (isHappy) {
    // Typing tracking is active. Render custom eye target overrides based on attention swaps
    if (gazeFocus === 'center') {
      activePupilX = ambientOffset.x / 2;
      activePupilY = ambientOffset.y / 2;
      activeAngle = 0;
    } else if (gazeFocus === 'neighbor-left') {
      activePupilX = -5.5;
      activePupilY = 0.5;
      activeAngle = -170;
    } else if (gazeFocus === 'neighbor-right') {
      activePupilX = 5.5;
      activePupilY = 0.5;
      activeAngle = 10;
    }
  } else if (localReaction === 'default') {
    // Idle state check. Apply gaze glances
    if (microAnim === 'glance') {
      if (index === 0) {
        // Alpha glances right at Beta/Gamma
        activePupilX = 5.5;
        activePupilY = 0.5;
        activeAngle = 10;
      } else if (index === 2) {
        // Gamma glances left at Alpha/Beta
        activePupilX = -5.5;
        activePupilY = 0.5;
        activeAngle = -170;
      } else {
        // Beta glances either left or right randomly based on layout
        activePupilX = index % 2 === 0 ? -5.5 : 5.5;
        activePupilY = 0.5;
        activeAngle = index % 2 === 0 ? -170 : 10;
      }
    }
  }

  // Determine active visual signals
  const accentColor = isHappy ? '#10B981' : isShy ? '#8B5CF6' : profile.defaultColor;
  const glowBorderColor = isHappy ? '#10B981' : isShy ? '#8B5CF6' : profile.glowColor;

  const springTransition = {
    type: 'spring',
    stiffness: 260,
    damping: 20
  } as const;

  // Adjust eyeballs based on blinks or states
  // Wink closes left eyeball while right stays fully tracking/open
  const leftEyeballScaleY = (isBlinking || microAnim === 'wink') ? 0.05 : isHappy ? 1.22 : isShy ? 0.22 : 1.0;
  const rightEyeballScaleY = isBlinking ? 0.05 : isHappy ? 1.22 : isShy ? 0.22 : 1.0;
  
  const eyeballScaleX = isBlinking ? 1.1 : isHappy ? 1.15 : 1.0;

  return (
    <div className="flex flex-col items-center justify-center p-1.5 select-none pointer-events-none">
      {/* Mini Diagnostic Label per Chibi */}
      <div className="text-[7.5px] font-mono text-zinc-500 tracking-wider mb-1 uppercase font-bold">
        {profile.displayName} // {isHappy ? 'HPY' : isShy ? 'SHY' : 'IDL'}
      </div>

      <div className="relative w-28 h-28 border border-zinc-900 bg-black/60 rounded p-1.5 flex items-center justify-center shadow-[inset_0_0_15px_rgba(0,0,0,0.8),0_2px_8px_rgba(0,0,0,0.4)] transition-all duration-300">
        {/* Subtle backing grids */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(229,9,20,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(229,9,20,0.01)_1px,transparent_1px)] bg-[size:6px_6px] rounded" />
        <div className={`absolute top-1.5 left-1.5 text-[6px] font-mono ${profile.tagColor} opacity-70`}>{profile.label}</div>
        <div className={`absolute bottom-1.5 right-1.5 text-[6px] font-mono ${profile.tagColor} opacity-70`}>{profile.sub}</div>

        <svg
          ref={svgRef}
          viewBox="0 0 160 160"
          className="w-full h-full relative z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Concentric Backing Radar Line */}
          <circle
            cx="80"
            cy="80"
            r="45"
            fill="none"
            stroke={accentColor}
            strokeWidth="0.4"
            opacity="0.15"
            strokeDasharray="2 4"
          />

          {/* ==================== ANTENNAS (DISTRIBUTED INDIVIDUAL SHAPES) ==================== */}
          {index === 0 && ( /* Left - Angled Left Horn Sweep */
            <>
              <path
                d="M 64,45 L 44,22"
                stroke="#1E1E1E"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <motion.circle
                cx="44"
                cy="22"
                r="4"
                animate={{
                  fill: accentColor,
                  scale: isHappy ? [1, 1.25, 1] : 1,
                  filter: `drop-shadow(0 0 4px ${glowBorderColor})`
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            </>
          )}

          {index === 1 && ( /* Center - Classic Straight Single */
            <>
              <path
                d="M 80,45 L 80,18"
                stroke="#1E1E1E"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <motion.circle
                cx="80"
                cy="18"
                r="4.5"
                animate={{
                  fill: accentColor,
                  scale: isHappy ? [1, 1.3, 1] : 1,
                  filter: `drop-shadow(0 0 5px ${glowBorderColor})`
                }}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
            </>
          )}

          {index === 2 && ( /* Right - Cute Angled Right Horn Sweep */
            <>
              <path
                d="M 96,45 L 116,22"
                stroke="#1E1E1E"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <motion.circle
                cx="116"
                cy="22"
                r="4"
                animate={{
                  fill: accentColor,
                  scale: isHappy ? [1, 1.25, 1] : 1,
                  filter: `drop-shadow(0 0 4px ${glowBorderColor})`
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </>
          )}

          {/* ==================== DETAILED HEAD & FACIAL ASSEMBLY WITH TILT ROTATIONS ==================== */}
          <motion.g
            animate={{
              rotate: microAnim === 'tilt-left' ? -4 : microAnim === 'tilt-right' ? 4 : 0,
              y: microAnim === 'tilt-left' || microAnim === 'tilt-right' ? 2.5 : 0
            }}
            style={{ originX: '80px', originY: '80px' }}
            transition={springTransition}
          >
            {/* Outer Helmet Shield */}
            <rect
              x="36"
              y="44"
              width="88"
              height="76"
              rx="20"
              fill="#050505"
              stroke="#121212"
              strokeWidth="3.5"
            />

            {/* Main Faceplate Frame with custom dynamic border colors */}
            <motion.rect
              x="38"
              y="46"
              width="84"
              height="72"
              rx="18"
              fill="#080808"
              stroke={accentColor}
              strokeWidth="2.2"
              animate={{
                borderColor: accentColor,
              }}
              transition={springTransition}
            />

            {/* Individual Faceplate Circuit Detail Decals */}
            {index === 0 && (
              <path d="M 44,52 L 44,70 M 44,52 L 52,52" stroke="#161616" strokeWidth="1.2" fill="none" />
            )}
            {index === 1 && (
              <circle cx="80" cy="52" r="2.5" fill="none" stroke="#161616" strokeWidth="1" />
            )}
            {index === 2 && (
              <path d="M 116,52 L 116,70 M 116,52 L 108,52" stroke="#161616" strokeWidth="1.2" fill="none" />
            )}

            {/* Connected Side Ears Core indicator rings */}
            <rect x="29" y="65" width="8" height="32" rx="2.5" fill="#101010" stroke="#181818" strokeWidth="1" />
            <rect x="123" y="65" width="8" height="32" rx="2.5" fill="#101010" stroke="#181818" strokeWidth="1" />
            
            <motion.line
              x1="33" y1="72" x2="33" y2="90"
              stroke={accentColor}
              strokeWidth="1.2"
              strokeLinecap="round"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: index * 0.3 }}
            />
            <motion.line
              x1="127" y1="72" x2="127" y2="90"
              stroke={accentColor}
              strokeWidth="1.2"
              strokeLinecap="round"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: index * 0.3 }}
            />

            {/* Blush circles indicating embarrassment under shy mode */}
            <motion.circle
              cx="50"
              cy="92"
              r="6"
              fill="#EF4444"
              initial={{ opacity: 0 }}
              animate={{ opacity: isShy ? 0.55 : 0 }}
              style={{ filter: 'blur(2.5px)' }}
              transition={{ duration: 0.3 }}
            />
            <motion.circle
              cx="110"
              cy="92"
              r="6"
              fill="#EF4444"
              initial={{ opacity: 0 }}
              animate={{ opacity: isShy ? 0.55 : 0 }}
              style={{ filter: 'blur(2.5px)' }}
              transition={{ duration: 0.3 }}
            />

            {/* ==================== LEFT EYE GROUP ==================== */}
            <g transform="translate(56, 76)">
              {/* Dark Cyber Eye Cavity */}
              <motion.ellipse
                cx="0"
                cy="0"
                rx="12"
                ry="12"
                fill="#030303"
                stroke="#141414"
                strokeWidth="0.8"
                animate={{
                  scaleY: leftEyeballScaleY,
                  scaleX: eyeballScaleX
                }}
                transition={springTransition}
              />

              {/* Pivotable/Traceable Pupil Core */}
              <motion.g
                animate={{
                  x: activePupilX,
                  y: activePupilY,
                  rotate: activeAngle,
                  opacity: (isBlinking || microAnim === 'wink') ? 0 : 1
                }}
                transition={isBlinking ? { duration: 0.05 } : springTransition}
              >
                {/* Outer Pupil glowing light vector */}
                <circle
                  cx="0"
                  cy="0"
                  r="4.5"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="0.8"
                />
                <motion.circle
                  cx="0"
                  cy="0"
                  r="2.5"
                  fill={accentColor}
                  animate={{
                    scale: isHappy ? 1.25 : isShy ? 0.7 : 1,
                    filter: `drop-shadow(0 0 3px ${glowBorderColor})`
                  }}
                  transition={{ duration: 0.2 }}
                />
                <circle cx="-1.5" cy="-1.5" r="0.8" fill="#FFFFFF" opacity="0.8" />
              </motion.g>

              {/* Happy Curved overlay vector */}
              {isHappy && (
                <motion.path
                  d="M -11,-1 Q 0,-10 11,-1"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}
              
              {/* Shy Squint overlay line */}
              {isShy && (
                <line x1="-11" y1="-2" x2="11" y2="-2" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" />
              )}
            </g>

            {/* ==================== RIGHT EYE GROUP ==================== */}
            <g transform="translate(104, 76)">
              {/* Dark Cyber Eye Cavity */}
              <motion.ellipse
                cx="0"
                cy="0"
                rx="12"
                ry="12"
                fill="#030303"
                stroke="#141414"
                strokeWidth="0.8"
                animate={{
                  scaleY: rightEyeballScaleY,
                  scaleX: eyeballScaleX
                }}
                transition={springTransition}
              />

              {/* Pivotable/Traceable Pupil Core */}
              <motion.g
                animate={{
                  x: activePupilX,
                  y: activePupilY,
                  rotate: activeAngle,
                  opacity: isBlinking ? 0 : 1
                }}
                transition={isBlinking ? { duration: 0.05 } : springTransition}
              >
                <circle
                  cx="0"
                  cy="0"
                  r="4.5"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="0.8"
                />
                <motion.circle
                  cx="0"
                  cy="0"
                  r="2.5"
                  fill={accentColor}
                  animate={{
                    scale: isHappy ? 1.25 : isShy ? 0.7 : 1,
                    filter: `drop-shadow(0 0 3px ${glowBorderColor})`
                  }}
                  transition={{ duration: 0.2 }}
                />
                <circle cx="-1.5" cy="-1.5" r="0.8" fill="#FFFFFF" opacity="0.8" />
              </motion.g>

              {/* Happy Curved overlay vector */}
              {isHappy && (
                <motion.path
                  d="M -11,-1 Q 0,-10 11,-1"
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                />
              )}

              {/* Shy Squint overlay line */}
              {isShy && (
                <line x1="-11" y1="-2" x2="11" y2="-2" stroke={accentColor} strokeWidth="1.8" strokeLinecap="round" />
              )}
            </g>

            {/* ==================== MOUTH & AUDIO MATRIX ==================== */}
            <motion.g transform="translate(80, 96)">
              <motion.path
                fill="none"
                stroke={accentColor}
                strokeWidth="2.2"
                strokeLinecap="round"
                animate={{
                  d: isHappy 
                    ? 'M -9,-1 Q 0,7 9,-1'          // Happy smiling arc
                    : isShy 
                    ? 'M -7,0 Q -3.5,-1.8 0,0 Q 3.5,1.8 7,0'  // Squiggly line
                    : 'M -7,0 L 7,0',               // Static machine segment
                }}
                transition={springTransition}
              />
            </motion.g>

            {/* Lower ventilation grill slots */}
            <line x1="74" y1="106" x2="86" y2="106" stroke="#161616" strokeWidth="1" strokeDasharray="1.5 1.5" />
          </motion.g>
        </svg>
      </div>
    </div>
  );
}

// 4. Mascot Squad Component: aligns three chibis with subtle visual rhythm scaling
export default function MascotSquad({ state }: { state: 'default' | 'email' | 'password' }) {
  const isHappy = state === 'email';
  const isShy = state === 'password';
  
  // Choose between 'interactive' (SVG code + Tracking) or '3d_sync' (High-fidelity 3D anime render cards)
  const [renderMode, setRenderMode] = useState<'interactive' | 'holo3d'>('interactive');
  
  const [selectedProfileIndex, setSelectedProfileIndex] = useState<number | null>(null);

  const selectedProfile = selectedProfileIndex !== null ? getMascotProfile(selectedProfileIndex) : null;

  return (
    <div className="flex flex-col items-center justify-center py-2 select-none w-full max-w-lg mx-auto">
      {/* Unified Status indicator above layout */}
      <div className="text-[8px] font-mono font-bold tracking-[0.25em] uppercase text-zinc-500 mb-3.5 flex flex-wrap items-center justify-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${isHappy ? 'bg-emerald-500 animate-ping' : isShy ? 'bg-purple-500 animate-pulse' : 'bg-red-600'} transition-colors duration-300`} />
        NXS_COGNITIVE_ARRAY // {state === 'email' ? 'LINK_ESTABLISHED' : state === 'password' ? 'DATA_SHIELD_UP' : 'SQUAD_IDLE_WANDER'}
      </div>

      {/* Cyber Selection Tabs: Switches between Live Diagnostics (SVGs) and 3D Holographic Rendering Visuals */}
      <div className="flex bg-black/80 border border-zinc-900 rounded p-1 mb-4 text-[9px] font-mono gap-1 tracking-wider">
        <button
          type="button"
          onClick={() => {
            setRenderMode('interactive');
            setSelectedProfileIndex(null);
          }}
          className={`px-3 py-1 rounded transition-all font-black uppercase text-[8px] ${
            renderMode === 'interactive' 
              ? 'bg-zinc-900 text-white border border-zinc-800 shadow-[0_0_8px_rgba(255,255,255,0.1)]' 
              : 'text-zinc-500 hover:text-zinc-355'
          }`}
        >
          [⚡︎ DIAGNOSTICS_LIVE ]
        </button>
        <button
          type="button"
          onClick={() => {
            setRenderMode('holo3d');
            setSelectedProfileIndex(1); // Default to BETA (middle)
          }}
          className={`px-3 py-1 rounded transition-all font-black uppercase text-[8px] ${
            renderMode === 'holo3d' 
              ? 'bg-red-950/40 text-[var(--faction-primary,#FF0000)] border border-red-900/60 shadow-[0_0_10px_rgba(255,0,0,0.15)]' 
              : 'text-zinc-500 hover:text-zinc-355'
          }`}
        >
          [☢ 3D NEURAL_SYNC ]
        </button>
      </div>

      <AnimatePresence mode="wait">
        {renderMode === 'interactive' ? (
          /* Live Interactive Diagnostic SVGs */
          <motion.div
            key="diagnostics"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="flex flex-row items-center justify-center gap-1.5 sm:gap-3 w-full"
          >
            {/* Left Mascot - Cyber ALPHA (Scaled down slightly, Red Focus) */}
            <div 
              onClick={() => { setSelectedProfileIndex(0); setRenderMode('holo3d'); }}
              className="transform scale-95 transition-all duration-300 origin-center opacity-90 hover:opacity-100 hover:scale-100 cursor-pointer pointer-events-auto"
              title="Click to view 3D Holo Dossier for ALPHA"
            >
              <CyberMascot state={state} index={0} />
            </div>

            {/* Center Mascot - Cyber BETA (Scaled up as Lead, Cyan Focus) */}
            <div 
              onClick={() => { setSelectedProfileIndex(1); setRenderMode('holo3d'); }}
              className="transform scale-105 z-10 transition-all duration-300 origin-center shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:scale-110 cursor-pointer pointer-events-auto"
              title="Click to view 3D Holo Dossier for BETA"
            >
              <CyberMascot state={state} index={1} />
            </div>

            {/* Right Mascot - Cyber GAMMA (Scaled down slightly, Amber Focus) */}
            <div 
              onClick={() => { setSelectedProfileIndex(2); setRenderMode('holo3d'); }}
              className="transform scale-95 transition-all duration-300 origin-center opacity-90 hover:opacity-100 hover:scale-100 cursor-pointer pointer-events-auto"
              title="Click to view 3D Holo Dossier for GAMMA"
            >
              <CyberMascot state={state} index={2} />
            </div>
          </motion.div>
        ) : (
          /* High-Fidelity 3D Anime Hologram Displays */
          <motion.div
            key="holo3d"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="w-full flex flex-col items-center gap-3 select-none"
          >
            {/* Horizontal Mini Buttons to switch profiles */}
            <div className="flex gap-2 mb-1 justify-center z-20 pointer-events-auto">
              {[0, 1, 2].map((idx) => {
                const prof = getMascotProfile(idx);
                const isSel = idx === selectedProfileIndex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedProfileIndex(idx)}
                    className={`px-2 py-1 border text-[7.5px] font-mono rounded select-none transition-all uppercase font-bold ${
                      isSel 
                        ? 'border-red-500/80 text-white bg-red-950/20 shadow-[0_0_6px_rgba(239,68,68,0.25)]' 
                        : 'border-zinc-900 text-zinc-500 bg-zinc-950 hover:text-zinc-350'
                    }`}
                  >
                    {prof.displayName}
                  </button>
                );
              })}
            </div>

            {selectedProfile && (
              <motion.div 
                key={selectedProfileIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm border border-zinc-900 bg-black/90 p-4 rounded-sm flex flex-col sm:flex-row items-center gap-4 relative overflow-hidden"
              >
                {/* Visual scan light highlight line */}
                <div 
                  className="absolute left-0 w-full h-[1.5px] opacity-80 animate-radar-scan pointer-events-none" 
                  style={{ backgroundColor: selectedProfile.defaultColor, boxShadow: `0 0 8px ${selectedProfile.glowColor}` }} 
                />
                
                {/* 3D Render Image Container */}
                <div className="relative w-24 h-24 flex-shrink-0 bg-zinc-950 border border-zinc-805 rounded overflow-hidden flex items-center justify-center p-0.5 shadow-[inset_0_0_12px_rgba(0,0,0,0.9)]">
                  <img
                    src={selectedProfile.image}
                    alt={`${selectedProfile.displayName} 3D Neural Render`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-sm border border-zinc-900"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                  
                  {/* Digital active telemetry watermarks */}
                  <div className="absolute bottom-1 left-1 text-[5px] font-mono text-zinc-500 bg-black/80 px-1 py-0.5 rounded uppercase font-bold tracking-widest border border-zinc-900">
                    {selectedProfile.displayName}_3D
                  </div>
                </div>

                {/* Tactical Specifications */}
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-1.5 mb-1.5">
                    <span className={`text-[9px] font-mono font-black uppercase tracking-wider ${selectedProfile.tagColor}`}>
                      {selectedProfile.label}
                    </span>
                    <span className="text-[6.5px] font-mono text-zinc-600 bg-zinc-950 px-1 rounded uppercase border border-zinc-900">
                      SYS_SEC_V3
                    </span>
                  </div>
                  
                  <p className="text-[9.5px] text-zinc-400 font-mono leading-relaxed mb-2 uppercase">
                    {selectedProfile.desc}
                  </p>

                  <div className="flex items-center justify-between text-[7px] font-mono text-zinc-500 bg-zinc-950/70 p-1 rounded border border-zinc-900/60">
                    <span className="uppercase">COG_THREAT</span>
                    <span className={`font-bold ${selectedProfile.tagColor}`}>{selectedProfile.threatLevel}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
