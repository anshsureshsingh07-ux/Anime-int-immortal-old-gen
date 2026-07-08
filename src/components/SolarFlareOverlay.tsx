import React from 'react';

interface SolarFlareOverlayProps {
  active: boolean;
}

export default function SolarFlareOverlay({ active }: SolarFlareOverlayProps) {
  const isMobile = typeof window !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent);

  if (!active || isMobile) return null;

  return (
    <>
      {/* Keyframe pulse animation and global hardware-acceleration styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes solar-radiation {
          0%, 100% {
            transform: scale(1);
            filter: brightness(1) saturate(1);
          }
          50% {
            transform: scale(1.01);
            filter: brightness(1.05) saturate(1.1);
          }
        }
        .animate-solar-radiation {
          animation: solar-radiation 12s ease-in-out infinite;
          transform-origin: center top;
        }
      ` }} />

      <div id="solar-flare-overlay" className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none transition-all duration-700 ease-in-out mix-blend-screen">
        {/* Blinding, golden-amber anamorphic lens flare effect across the upper layout axis */}
        <div 
          className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-r from-transparent via-amber-500/25 to-transparent blur-3xl"
          style={{ transform: 'translateY(-25%)' }}
        />

        {/* Central thermal primary sun source */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-gradient-to-b from-amber-400/15 via-orange-500/5 to-transparent rounded-full blur-3xl animate-pulse duration-10000" />

        {/* Dynamic solar radiation dust particles/ambient backdrops */}
        <div className="absolute inset-x-0 top-0 bottom-0 bg-radial-gradient from-amber-500/2 via-transparent to-transparent blur-3xl pointer-events-none" />

        {/* Secondary subtle lens reflection loops */}
        <div className="absolute top-1/4 left-1/3 w-[120px] h-[120px] rounded-full bg-amber-500/5 blur-xl animate-pulse" style={{ animationDuration: '6s' }} />
        <div className="absolute top-1/3 right-1/3 w-[80px] h-[80px] rounded-full bg-orange-400/5 blur-lg animate-pulse" style={{ animationDuration: '8s' }} />
      </div>
    </>
  );
}
