import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import { Sparkles, Megaphone } from 'lucide-react';

// Import Swiper CSS
import 'swiper/css';
import 'swiper/css/effect-fade';

export default function AnnouncementsBanner() {
  return (
    <div className="w-full bg-black border-l-4 border-[#E50914] h-8 flex items-center px-4 md:px-6 shadow-[0_2px_15px_rgba(229,9,20,0.15)] relative overflow-hidden shrink-0 select-none border-b border-zinc-900/50">
      {/* Crimson glowing neon backing light shadow constraint */}
      <div className="absolute top-0 bottom-0 left-0 w-[1px] bg-[#E50914] shadow-[0_0_20px_#E50914,0_0_40px_rgba(229,9,20,0.6)] z-10" />

      <div className="flex items-center gap-3 w-full h-full relative z-20">
        {/* Banner Tag Info Badge with pulse effect */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-950/45 border border-red-500/25 rounded text-[#E50914] text-[8px] font-black uppercase tracking-[0.2em] shrink-0 font-mono">
          <Megaphone size={10} className="animate-pulse text-[#E50914]" />
          <span>ALERT</span>
        </div>

        {/* Vertical Fading announcement content slide */}
        <div className="flex-1 h-8 min-w-0">
          <Swiper
            direction="vertical"
            effect="fade"
            fadeEffect={{ crossFade: true }}
            modules={[Autoplay, EffectFade]}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            loop={true}
            className="h-8 w-full pointer-events-none"
            style={{ height: '32px' }}
          >
            <SwiperSlide className="h-8 flex items-center bg-black">
              <div className="text-[10px] sm:text-xs font-mono font-black tracking-[0.16em] text-white uppercase truncate pr-4 flex items-center gap-2">
                <span className="text-[#E50914]">📢 IMPORTANT NOTICE FROM ANIME INT</span>
              </div>
            </SwiperSlide>
          </Swiper>
        </div>

        {/* Terminal Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-zinc-600 font-mono text-[8px] uppercase tracking-widest shrink-0 select-none">
          <Sparkles size={9} className="text-[#E50914]/65" />
          <span>NEURAL STREAM 01</span>
        </div>
      </div>
    </div>
  );
}
