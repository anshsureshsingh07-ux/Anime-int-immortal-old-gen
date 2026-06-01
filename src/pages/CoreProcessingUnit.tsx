import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Cpu, Zap, Activity, Sliders, CheckCircle2, Shield, RefreshCw } from 'lucide-react';
import { playDigitalSound } from '../lib/sounds';

export default function CoreProcessingUnit() {
  const [graphicsFidelity, setGraphicsFidelity] = useState(() => {
    return Number(localStorage.getItem('vanguard_cpu_graphics_fidelity') || '85');
  });
  const [networkLatency, setNetworkLatency] = useState(() => {
    return Number(localStorage.getItem('vanguard_cpu_network_latency') || '24');
  });
  const [neuralSensitivity, setNeuralSensitivity] = useState(() => {
    return Number(localStorage.getItem('vanguard_cpu_neural_sensitivity') || '72');
  });

  const [coreTemp, setCoreTemp] = useState(42.5);
  const [coreDutyCycle, setCoreDutyCycle] = useState(12.4);
  const [isSyncing, setIsSyncing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Auto-oscillate statistics for realism
  useEffect(() => {
    const timer = setInterval(() => {
      setCoreTemp(prev => {
        const base = 35 + (graphicsFidelity * 0.3) - (networkLatency * 0.1);
        const noise = (Math.random() - 0.5) * 1.5;
        return Number((base + noise).toFixed(1));
      });
      setCoreDutyCycle(prev => {
        const base = (graphicsFidelity * 0.4) + (neuralSensitivity * 0.3);
        const noise = (Math.random() - 0.5) * 2;
        return Number(Math.max(2, Math.min(99, base + noise)).toFixed(1));
      });
    }, 2000);
    return () => clearInterval(timer);
  }, [graphicsFidelity, networkLatency, neuralSensitivity]);

  const handleSaveConfig = () => {
    playDigitalSound('ping');
    setIsSyncing(true);
    localStorage.setItem('vanguard_cpu_graphics_fidelity', String(graphicsFidelity));
    localStorage.setItem('vanguard_cpu_network_latency', String(networkLatency));
    localStorage.setItem('vanguard_cpu_neural_sensitivity', String(neuralSensitivity));

    setTimeout(() => {
      setIsSyncing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }, 1200);
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-zinc-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
            <span className="text-[9px] font-mono tracking-widest text-crimson uppercase font-black">SYSTEM DEEP INTEGRATION</span>
          </div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3 chromatic-aberration">
            <Cpu size={28} className="text-crimson shrink-0" />
            Core <span className="text-crimson">Processing Unit</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Calibrate neural hardware logic grids, response telemetry, and system processing rates
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 select-none font-black text-xs">
          <Activity size={12} className="text-crimson animate-pulse" />
          CLOCK: 6.84 GHZ
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left column: Controls */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="neural-glass p-6 rounded-3xl flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-crimson/5 rounded-full blur-3xl pointer-events-none" />
            
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-white border-b border-white/5 pb-3 flex items-center gap-2 select-none">
              <Sliders size={14} className="text-crimson" /> NEURAL CALIBRATION MATRICES
            </h3>

            {/* Slider 1: Graphics Fidelity */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-mono leading-none">
                <span className="text-zinc-400 font-extrabold uppercase">GRAPHICS FIDELITY PROJECTION</span>
                <span className="text-crimson font-black tracking-wider text-xs">{graphicsFidelity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={graphicsFidelity}
                onChange={(e) => {
                  setGraphicsFidelity(Number(e.target.value));
                  playDigitalSound('click');
                }}
                className="w-full h-1 bg-zinc-800 rounded outline-none appearance-none cursor-pointer accent-crimson focus:outline-none"
              />
              <div className="flex justify-between text-[7.5px] font-mono text-zinc-500 uppercase">
                <span>[Low Power desaturated]</span>
                <span>[Sub-Atomic UHD RayTraced]</span>
              </div>
            </div>

            {/* Slider 2: Network Latency */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-mono leading-none">
                <span className="text-zinc-400 font-extrabold uppercase">NETWORK LATENCY PROTOCOL</span>
                <span className="text-[#00BFFF] font-black tracking-wider text-xs">{networkLatency} ms</span>
              </div>
              <input
                type="range"
                min="2"
                max="150"
                value={networkLatency}
                onChange={(e) => {
                  setNetworkLatency(Number(e.target.value));
                  playDigitalSound('click');
                }}
                className="w-full h-1 bg-zinc-800 rounded outline-none appearance-none cursor-pointer accent-crimson focus:outline-none"
              />
              <div className="flex justify-between text-[7.5px] font-mono text-zinc-500 uppercase">
                <span>[Sub-Space 2ms quantum SSH]</span>
                <span>[Standard 150ms buffer relay]</span>
              </div>
            </div>

            {/* Slider 3: Neural-Persona Sensitivity */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-mono leading-none">
                <span className="text-zinc-400 font-extrabold uppercase">NEURAL-PERSONA SENSITIVITY INDEX</span>
                <span className="text-yellow-400 font-black tracking-wider text-xs">{neuralSensitivity} X-PTS</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                value={neuralSensitivity}
                onChange={(e) => {
                  setNeuralSensitivity(Number(e.target.value));
                  playDigitalSound('click');
                }}
                className="w-full h-1 bg-zinc-800 rounded outline-none appearance-none cursor-pointer accent-crimson focus:outline-none"
              />
              <div className="flex justify-between text-[7.5px] font-mono text-zinc-500 uppercase">
                <span>[Dormant stoic logic]</span>
                <span>[Hyper-Empathic synthetic consciousness]</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={isSyncing}
                className="w-full sm:flex-1 py-3 px-4 bg-crimson font-mono font-black uppercase text-xs tracking-widest text-white rounded-xl hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,9,20,0.3)] border border-crimson/50 cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="animate-spin text-white" size={12} />
                    Syncing matrix registers...
                  </>
                ) : (
                  <>
                    <Zap size={12} />
                    Synchronize Core Parameters
                  </>
                )}
              </button>

              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wide flex items-center gap-1">
                <Shield size={12} className="text-green-500" /> Secure SHA256 Sync enabled
              </div>
            </div>

            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono rounded-xl flex items-center gap-2"
              >
                <CheckCircle2 size={12} className="text-green-400 animate-bounce" />
                MATRICES RESOLVED SUCCESSFULLY. APPLIED VANGUARD_CFG CODES TO LOCAL STORAGE.
              </motion.div>
            )}
          </div>
        </div>

        {/* Right column: Deep telemetry */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="neural-glass p-6 rounded-3xl flex flex-col gap-5 justify-between">
            <div>
              <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-2.5 flex items-center justify-between">
                <span>CORES HARMONY SPECTRUM</span>
                <span className="text-emerald-400">OPTIMAL</span>
              </h3>

              {/* Grid indicators */}
              <div className="grid grid-cols-2 gap-4 mt-4 select-none">
                <div className="bg-black/60 border border-white/5 p-3 rounded-2xl font-mono">
                  <span className="text-[8px] text-zinc-500 uppercase leading-none block">CORE_TEMPERATURE</span>
                  <span className="text-base font-black text-white block mt-1">{coreTemp}°C</span>
                  <div className="w-full bg-zinc-900 h-1 rounded mt-2 overflow-hidden">
                    <div 
                      className="bg-red-500 h-full transition-all duration-1000" 
                      style={{ width: `${Math.min(100, (coreTemp / 90) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-black/60 border border-white/5 p-3 rounded-2xl font-mono">
                  <span className="text-[8px] text-zinc-500 uppercase leading-none block">GRID_DUTY_CYCLE</span>
                  <span className="text-base font-black text-[#00BFFF] block mt-1">{coreDutyCycle}%</span>
                  <div className="w-full bg-zinc-900 h-1 rounded mt-2 overflow-hidden">
                    <div 
                      className="bg-[#00BFFF] h-full transition-all duration-1000" 
                      style={{ width: `${coreDutyCycle}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Animated visualizer mesh block */}
              <div className="bg-black border border-white/5 p-4 rounded-xl mt-4 font-mono select-none overflow-hidden relative min-h-[140px] flex items-center justify-center">
                <div className="absolute inset-0 bg-carbon opacity-30" />
                <svg viewBox="0 0 100 100" className="w-[120px] h-[120px] relative z-10 select-none pointer-events-none">
                  {/* Outer hex system */}
                  <polygon 
                    points="50,10 85,27 85,73 50,90 15,73 15,27" 
                    fill="none" 
                    stroke="#E50914" 
                    strokeWidth="0.5" 
                    className="animate-pulse" 
                  />
                  <polygon 
                    points="50,18 78,32 78,68 50,82 22,68 22,32" 
                    fill="none" 
                    stroke="rgba(0,191,255,0.4)" 
                    strokeWidth="0.4" 
                    style={{ transformOrigin: '50% 50%', transform: `rotate(${(graphicsFidelity - 50) * 0.5}deg)`, transition: 'transform 1s ease-out' }}
                  />
                  {/* Central Core sphere with waves */}
                  <circle cx="50" cy="50" r={6 + neuralSensitivity * 0.08} fill="rgba(229,9,20,0.12)" stroke="#E50914" strokeWidth="0.8" className="animate-ping" style={{ animationDuration: '3s' }} />
                  <circle cx="50" cy="50" r="1.5" fill="#E50914" />
                </svg>

                {/* Micro tech logging overlay indicators */}
                <div className="absolute bottom-1.5 left-3 text-[6px] text-zinc-600 tracking-wider">
                  MODEL: NXP_SHG_CORE42
                </div>
                <div className="absolute bottom-1.5 right-3 text-[6px] text-emerald-400 font-bold">
                  SENS_INTEGRITY: 100% SECURE
                </div>
              </div>
            </div>

            <p className="text-[8.5px] font-mono leading-relaxed text-zinc-500 uppercase tracking-tight select-none pt-2.5 border-t border-white/5">
              THE CALIBRATION FACTOR MUTATES THERMAL RESISTANCE PARAMETERS DIRECTLY OUTSIDE CHASSIS CORRIDORS. LIMIT OVER-CLOCK RATES IN HIGH AMBIENT TEMPERATURE ENVIRONMENTS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
