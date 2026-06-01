import { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal as TerminalIcon, History, Cpu, ShieldCheck, Activity } from 'lucide-react';

const CHANGELOGS = [
  { version: 'v3.2.14', date: '2026-05-31', author: 'VANGUARD SEC-OP ADMIN', type: 'SECURITY_PATCH', changes: ['Integrated neural coprocessor automated standby state (dims screen upon 40s idle).', 'Enabled floating tactical interactive Mainframe Control Widget overlay.', 'Updated index ticker tape visual performance matrix.'] },
  { version: 'v3.2.0', date: '2026-05-25', author: 'SYSTEM OVERSEER', type: 'MAJOR_EXPANSION', changes: ['Bootstrapped modular Faction Alignment configuration routers.', 'Synchronized Supabase real-time databases with Jikan fallback structures.', 'Upgraded UI system styling indices to support premium hologram tactile buttons.'] },
  { version: 'v3.1.25', date: '2026-05-18', author: 'VANGUARD RECRUIT DEPT', type: 'BUG_FIX', changes: ['Repaired recruitment application profile image stream formats.', 'Optimized Jikan rate limit fallbacks with detailed static local series schemes.'] }
];

export default function TerminalLogs() {
  const [activeLog, setActiveLog] = useState(CHANGELOGS[0]);

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-gray-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3">
            <TerminalIcon size={28} className="text-crimson shrink-0" />
            Terminal <span className="text-crimson">Logs</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Historical changelogs, system update telemetry, and secure node configurations
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 select-none animate-pulse">
          <Activity size={12} className="text-crimson animate-pulse" />
          SYS_LOG: LINKED_OK
        </div>
      </div>

      {/* Main Grid: Select Versions (Left), View detailed raw terminal (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch h-[480px]">
        
        {/* Left column: List of Releases */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="plexiglass p-5 rounded-2xl flex flex-col gap-3.5 h-full">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/5 pb-2.5 flex items-center gap-1.5 select-none">
              <History size={12} className="text-crimson" /> Deploy history
            </h3>

            <div className="flex flex-col gap-2 overflow-y-auto">
              {CHANGELOGS.map(log => (
                <button
                  key={log.version}
                  type="button"
                  onClick={() => setActiveLog(log)}
                  className={`w-full text-left p-3.5 rounded-xl border font-mono transition-all duration-200 ${
                    activeLog.version === log.version
                      ? 'bg-crimson/15 border-crimson text-white shadow-[0_0_12px_rgba(229,9,20,0.2)]'
                      : 'bg-black/40 border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-black">{log.version}</span>
                    <span className="text-[8px] bg-white/10 text-zinc-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest leading-none">
                      {log.type}
                    </span>
                  </div>
                  <span className="text-[8px] text-zinc-500 block uppercase tracking-wider font-bold">RELEASE DATE: {log.date}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right column: Retro Terminal view */}
        <div className="lg:col-span-8 flex flex-col bg-[#050407] border border-crimson/25 rounded-3xl overflow-hidden font-mono text-[11px] p-6 text-zinc-300 relative shadow-[0_0_25px_rgba(0,0,0,0.8)]">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(168,85,247,0.015),rgba(0,0,0,0.1),rgba(168,85,247,0.015))] bg-[size:100%_4px,3px_100%] opacity-30 pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 select-none text-zinc-500">
            <span className="text-[8px] font-black uppercase tracking-[0.22em] flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 bg-crimson rounded-full animate-ping" /> CORE SECURITY TERMINAL SHELL
            </span>
            <span className="text-[7.5px] uppercase tracking-widest leading-none">SYS_COPROCESSOR_ONLINE_v2.1</span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2 select-text">
            <div>
              <span className="text-crimson font-black uppercase tracking-wider">&gt; CAT CHANGELOG.LOG</span>
              <p className="text-zinc-550 italic mt-0.5">// Output stream synced on {activeLog.date}</p>
            </div>

            <div className="space-y-2 border-l border-crimson/20 pl-4 py-1">
              <div className="text-zinc-400">
                <span className="text-white font-black uppercase block font-sans text-sm mb-1">VERSION PROFILE {activeLog.version}</span>
                <span className="text-zinc-600 block">Decompiler Engineer: {activeLog.author}</span>
                <span className="text-zinc-650 block">Audit Security Protocol: Verified SEC_OK ✔</span>
              </div>

              <div className="space-y-1.5 pt-3">
                <span className="text-crimson font-black uppercase tracking-wider block">CHANGES SYNCED:</span>
                {activeLog.changes.map((change, i) => (
                  <p key={i} className="text-gray-200 leading-relaxed font-sans text-xs flex items-start gap-2">
                    <span className="text-crimson font-black mt-0.5 select-none font-mono text-[10px]">-</span>
                    {change}
                  </p>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 text-zinc-550 select-none">
              <span className="animate-pulse">_ TERMINAL INPUT IDLE... READY FOR NEXT PACKET MULTIPLE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
