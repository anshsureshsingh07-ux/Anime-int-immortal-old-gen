import React from 'react';
import { Palette, ChevronDown } from 'lucide-react';

interface ThemeManagerProps {
  currentTheme: string;
  onThemeChange: (newTheme: string) => void;
  isLoading?: boolean;
}

export const ThemeManager: React.FC<ThemeManagerProps> = ({
  currentTheme,
  onThemeChange,
  isLoading = false,
}) => {
  const themes = ['Blue', 'Purple', 'Dark'] as const;

  return (
    <div id="theme-manager-control" className="relative inline-flex items-center gap-2 bg-black/50 border border-white/10 px-2.5 py-1.5 rounded-xl">
      <span className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 uppercase tracking-wider">
        <Palette size={12} className="text-[#E50914]" /> Encryption Key:
      </span>
      <div className="flex gap-1.5">
        {themes.map((color) => {
          const isActive = currentTheme === color;
          return (
            <button
              key={color}
              type="button"
              disabled={isLoading}
              onClick={() => onThemeChange(color)}
              className={`px-2.5 py-0.5 text-[9px] font-mono rounded uppercase tracking-widest transition-all ${
                isActive
                  ? 'bg-[#E50914] text-white font-extrabold shadow-[0_0_10px_rgba(229,9,20,0.4)]'
                  : 'text-gray-500 hover:text-white bg-white/5 hover:bg-white/10'
              } disabled:opacity-50`}
            >
              {color}
            </button>
          );
        })}
      </div>
    </div>
  );
};
