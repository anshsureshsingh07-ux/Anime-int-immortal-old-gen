import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sliders, Settings2, SlidersHorizontal, Check, ShieldAlert, Sparkles, User, Palette, Cpu, Volume2, VolumeX, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useThemeEngine } from '../context/ThemeEngineContext';
import { playDigitalSound } from '../lib/sounds';
import { auth } from '../lib/firebase';

const THEME_PRESETS = [
  { id: 'akatsuki', name: 'Akatsuki Crimson', primary: '#E50914', glow: 'rgba(229,9,20,0.4)', description: 'Dark canvas with high-contrast emissive red accents.' },
  { id: 'stark', name: 'Stark Polar', primary: '#00BFFF', glow: 'rgba(0,191,255,0.4)', description: 'Freezing tundra theme with cool deep cyan aesthetics.' },
  { id: 'britannian', name: 'Britannia Royal', primary: '#A855F7', glow: 'rgba(168,85,247,0.4)', description: 'Purple imperial layouts mapping majestic power coordinates.' },
  { id: 'lannister', name: 'Lannister Gold', primary: '#FF9900', glow: 'rgba(255,153,0,0.4)', description: 'Gold treasury theme outlining rich bedrock of wealth.' }
];

export default function NodeSettings() {
  const [activePreset, setActivePreset] = useState('akatsuki');
  const [ecoMode, setEcoMode] = useState(true);
  const [tactileAlerts, setTactileAlerts] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [publicSharing, setPublicSharing] = useState(() => {
    try {
      return localStorage.getItem('vanguard_public_sharing') !== 'false';
    } catch {
      return true;
    }
  });

  const {
    engagementScore,
    setEngagementScore,
    themeMode,
    soundAlertsEnabled,
    setSoundAlertsEnabled,
    addToast
  } = useThemeEngine();

  // Synchronize preset with current user faction or custom client-side theme
  useEffect(() => {
    const cachedTheme = localStorage.getItem('vanguard_custom_preset_theme') || 'akatsuki';
    setActivePreset(cachedTheme);
    
    const savedEco = localStorage.getItem('vanguard_eco_mode') !== 'false';
    const savedTactile = localStorage.getItem('vanguard_tactile_alerts') !== 'false';
    setEcoMode(savedEco);
    setTactileAlerts(savedTactile);
  }, []);

  const handleApplySettings = () => {
    playDigitalSound('ping');
    localStorage.setItem('vanguard_custom_preset_theme', activePreset);
    localStorage.setItem('vanguard_eco_mode', String(ecoMode));
    localStorage.setItem('vanguard_tactile_alerts', String(tactileAlerts));
    
    // Dispatch custom event to notify App.tsx immediately
    window.dispatchEvent(new CustomEvent('vanguard-settings-update', {
      detail: { preset: activePreset, ecoMode, tactileAlerts }
    }));

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 2000);
  };

  const [auditLogs] = useState(() => {
    const mockLogs = [
      { timestamp: '2026-05-31 06:12:44', ip: '185.112.44.89', device: 'Neural-Link v1.1 Chrome/macOS' },
      { timestamp: '2026-05-31 02:40:01', ip: '109.84.188.112', device: 'Quantum Relay Terminal' },
      { timestamp: '2026-05-30 19:15:33', ip: '223.44.11.230', device: 'Safari iOS 19.4' },
      { timestamp: '2026-05-30 12:04:19', ip: '185.112.44.89', device: 'Neural-Link v1.1 Chrome/macOS' },
      { timestamp: '2026-05-29 23:59:00', ip: '185.112.44.89', device: 'Neural-Link v1.1 Chrome/macOS' }
    ];
    try {
      const stored = localStorage.getItem('vanguard_session_audit_logs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...mockLogs].slice(0, 5);
        }
      }
    } catch (e) {
      console.error('Failed to parse persistent audit logs:', e);
    }
    return mockLogs;
  });

  const handleTogglePublicSharing = () => {
    playDigitalSound('click');
    const newVal = !publicSharing;
    setPublicSharing(newVal);
    localStorage.setItem('vanguard_public_sharing', String(newVal));
    addToast(
      newVal ? 'Public Standings sync enabled.' : 'Public Standings sync disabled.',
      newVal ? 'SUCCESS' : 'WARNING',
      'PRIVACY_CTRL'
    );
  };

  const handleExportHistory = () => {
    playDigitalSound('ping');
    const userEmail = auth.currentUser?.email || 'unauthenticated_node';
    const payload = {
      export_timestamp: new Date().toISOString(),
      node_identity: userEmail,
      hardware_parameters: {
        preset_theme: activePreset,
        eco_standby: ecoMode,
        tactile_vibe: tactileAlerts,
        engagement_score: engagementScore,
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
    addToast('Neural History Exported successfully ✔', 'SUCCESS', 'DATA_MGMT');
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-gray-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3">
            <Sliders size={28} className="text-crimson shrink-0" />
            Node <span className="text-crimson">Settings</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Dedicated profile customization themes and terminal hardware configurations
          </p>
        </div>
        
        {/* Save confirmation */}
        {savedSuccess && (
          <div className="px-3.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-[10px] font-mono font-black uppercase tracking-widest animate-pulse">
            Terminal synced successfully ✔
          </div>
        )}
      </div>

      {/* Main Grid: Theme Selection / Toggles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Theme Preset Swatches */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="plexiglass p-6 rounded-3xl border border-white/5">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/5 pb-3 mb-5 flex items-center gap-2 select-none">
              <Palette size={14} className="text-crimson" /> Visual Identity Preset Themes
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {THEME_PRESETS.map((preset) => {
                const isSelected = activePreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setActivePreset(preset.id)}
                    className={`p-4 rounded-2xl border transition-all duration-350 cursor-pointer flex flex-col gap-2.5 relative items-start select-none ${
                      isSelected
                        ? 'bg-black/80 shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                        : 'bg-black/30 hover:bg-black/50 border-white/5 hover:border-white/10'
                    }`}
                    style={{ borderColor: isSelected ? preset.primary : '' }}
                  >
                    {/* Tick overlay */}
                    {isSelected && (
                      <div className="absolute top-3.5 right-3.5 w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: preset.primary }}>
                        <Check size={11} />
                      </div>
                    )}

                    <div className="flex items-center gap-2.5">
                      <div className="w-5.5 h-5.5 rounded-full border border-white/20" style={{ backgroundColor: preset.primary }} />
                      <h4 className="text-xs font-extrabold uppercase text-white tracking-wide">
                        {preset.name}
                      </h4>
                    </div>

                    <p className="text-[10px] text-zinc-400 leading-relaxed font-sans mt-1">
                      {preset.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Data Sovereignty & Audit Ledger */}
          <div className="bg-[#050508]/80 border border-white/5 p-6 rounded-3xl flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#F2F2F5] flex items-center gap-2 select-none">
                  <ShieldAlert size={14} className="text-rose-500" /> Data Sovereignty & Audit Ledger
                </h3>
                <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block mt-1">
                  Manage cryptological identifiers, export logs, and control telemetry index visibility.
                </span>
              </div>

              <button
                type="button"
                onClick={handleExportHistory}
                className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-[9px] font-mono font-black uppercase tracking-widest transition-all flex items-center gap-2"
              >
                <Download size={12} className="text-zinc-400" /> Export Neural History
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Privacy Toggles */}
              <div className="flex flex-col gap-4">
                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-500">// Privacy Parameters</span>
                
                <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-black/40 border border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-sans font-black text-white uppercase tracking-wider">Public Standings Feed</span>
                    <p className="text-[8px] font-sans text-zinc-400 uppercase leading-normal">
                      Toggle public ledger indexings for my faction standing ranks.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTogglePublicSharing}
                    className={`w-11 h-6 rounded-full p-[2px] transition-colors shrink-0 ${
                      publicSharing ? 'bg-crimson' : 'bg-zinc-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      publicSharing ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-850 font-mono text-[8.5px] leading-relaxed text-zinc-500 uppercase select-none">
                  VANGUARD COMPLIANCE: ALL DATA PACKS REMAIN LOCALIZED OR REGISTERED VIA APPROVED HIGH-SECURITY Decent-Bridges. WE NEVER EXPOSE YOUR IDENTIFIER TOKEN BOUNDS TO UNSANCTIONED REGIONS.
                </div>
              </div>

              {/* Audit Log Table */}
              <div className="flex flex-col gap-4">
                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-500">// Recent Activity Log (Last 5 Sessions)</span>
                
                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/40">
                  <table className="w-full text-left font-mono text-[8px] border-collapse">
                    <thead>
                      <tr className="bg-white/5 text-zinc-400 border-b border-white/5 text-[7px] uppercase tracking-wider font-extrabold">
                        <th className="p-2.5">TIMESTAMP (UTC)</th>
                        <th className="p-2.5">IP ADDRESS</th>
                        <th className="p-2.5">AUTHENTICATION DEVICE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {auditLogs.map((log, listIdx) => (
                        <tr key={listIdx} className="hover:bg-white/5 transition-colors">
                          <td className="p-2.5 font-bold text-zinc-200">{log.timestamp}</td>
                          <td className="p-2.5 text-rose-400 font-bold">{log.ip}</td>
                          <td className="p-2.5 text-zinc-400">{log.device}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Toggle Settings Parameters & Neural Persona Controls */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#09060c] border border-white/5 p-6 rounded-3xl flex flex-col gap-5">
            <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-[#F2F2F5] pb-2 border-b border-white/5 flex items-center gap-1.5">
              <SlidersHorizontal size={12} className="text-crimson" /> Terminal Parameters
            </h3>

            {/* Eco Standby mode toggle */}
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] font-sans font-black text-white uppercase tracking-wider block">Eco Standby Mode</span>
                <span className="text-[8px] font-mono text-zinc-500 uppercase">Dims screen upon 40s idle</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playDigitalSound('click');
                  setEcoMode(!ecoMode);
                }}
                className={`w-11 h-6 rounded-full p-[2px] transition-colors ${
                  ecoMode ? 'bg-crimson' : 'bg-zinc-800'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  ecoMode ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Spatial Audio Sound Alerts Toggle */}
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] font-sans font-black text-white uppercase tracking-wider block flex items-center gap-1">
                  SFX Sound Waves {soundAlertsEnabled ? <Volume2 size={10} className="text-crimson animate-pulse" /> : <VolumeX size={10} className="text-zinc-500" />}
                </span>
                <span className="text-[8px] font-mono text-zinc-500 uppercase">Web Audio synth feedback alerts</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = !soundAlertsEnabled;
                  setSoundAlertsEnabled(val);
                  if (val) setTimeout(() => playDigitalSound('ping'), 50);
                }}
                className={`w-11 h-6 rounded-full p-[2px] transition-colors ${
                  soundAlertsEnabled ? 'bg-crimson' : 'bg-zinc-800'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  soundAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Tactile vibration/alert feedback toggle */}
            <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
              <div>
                <span className="text-[10px] font-sans font-black text-white uppercase tracking-wider block">Tactile Feedbacks</span>
                <span className="text-[8px] font-mono text-zinc-500 uppercase">Enables subtle alert vibration pings</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playDigitalSound('click');
                  setTactileAlerts(!tactileAlerts);
                }}
                className={`w-11 h-6 rounded-full p-[2px] transition-colors ${
                  tactileAlerts ? 'bg-crimson' : 'bg-zinc-800'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  tactileAlerts ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Solid Save Apply Button */}
            <button
              type="button"
              onClick={handleApplySettings}
              className="w-full py-3.5 px-4 rounded-xl bg-crimson hover:bg-crimson/90 border border-crimson text-white text-[10px] font-mono font-black uppercase tracking-widest transition-all mt-3 hover:shadow-[0_0_15px_rgba(229,9,20,0.45)] shadow-[0_0_10px_rgba(229,9,20,0.3)] text-center block"
            >
              Apply Config Parameters
            </button>
          </div>

          {/* Neural Persona Calibration Status Dashboard */}
          <div className="bg-black/60 border border-white/5 p-6 rounded-3xl flex flex-col gap-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-amber-400 pb-2 border-b border-white/5 flex items-center gap-1.5 select-none">
              <Cpu size={12} className="text-amber-400" /> NEURAL PERSONA MODULE
            </h3>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold">CALIBRATED STATUS</span>
              <span className={`text-[9px] font-mono font-black px-2.5 py-0.5 rounded uppercase tracking-wider ${
                themeMode === 'vanguard'
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700/20'
              }`}>
                {themeMode === 'vanguard' ? '⚡ VANGUARD OVERDRIVE' : '💤 LOW-POWER IDLE'}
              </span>
            </div>

            {/* Progress Slider block */}
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-500 uppercase">ENGAGEMENT INDEX</span>
                <span className="text-white font-extrabold">{engagementScore} XP</span>
              </div>
              
              {/* Horizontal slider for immediate engagement testing! */}
              <input 
                type="range" 
                min="0" 
                max="25" 
                value={engagementScore} 
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setEngagementScore(val);
                  playDigitalSound('click');
                }}
                className="w-full accent-crimson cursor-pointer h-1 rounded bg-zinc-800"
              />
              
              <div className="flex items-center justify-between mt-1 text-[7.5px] font-mono text-zinc-500 uppercase leading-relaxed">
                <span>💤 IDLE state (&lt;10 XP)</span>
                <span>⚡ OVERDRIVE state (&ge;10 XP)</span>
              </div>
            </div>

            {/* Quick tuning controls */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setEngagementScore(5);
                  playDigitalSound('click');
                }}
                className="py-1 px-2 border border-white/5 hover:border-white/15 rounded bg-white/5 hover:bg-white/10 font-mono text-[8px] uppercase font-bold text-center tracking-wider transition-all"
              >
                Set Inactive (5 XP)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEngagementScore(15);
                  playDigitalSound('click');
                }}
                className="py-1 px-2 border border-red-500/10 hover:border-red-500/20 rounded bg-red-500/5 hover:bg-red-500/10 font-mono text-[8px] uppercase font-bold text-center tracking-wider text-red-400 transition-all"
              >
                Boost Active (15 XP)
              </button>
            </div>

            <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-850 font-mono text-[8.5px] leading-relaxed text-zinc-500 uppercase select-none">
              {themeMode === 'vanguard'
                ? 'VANGUARD PARAMETERS ENGAGED: ACCELERATED ANIMATION FRAMES, DENSE COMPONENT VISUAL BOUNDARIES, EMISSIVE CYAN AND INTENSE RED ILLUMINATION GLOW EFFECTS ENABLED.'
                : 'LOW-POWER ENERGY STATE: DISABLING EXPENSIVE LAYOUT RENDER STYLES, MONOCHROME DESATURATED GRAPHICS PALETTE INDICES ENGAGED TO SAVE SYSTEM RESOURCES.'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
