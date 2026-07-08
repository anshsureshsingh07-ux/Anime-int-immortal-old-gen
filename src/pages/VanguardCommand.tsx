import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Server, Activity, Terminal, RefreshCw, ZapOff, Play } from 'lucide-react';
import { playDigitalSound } from '../lib/sounds';
import ReconComponent from '../components/ReconComponent';

interface CommandLog {
  id: string;
  time: string;
  level: 'INFO' | 'WARN' | 'CRIT';
  message: string;
}

const INITIAL_LOGS: CommandLog[] = [
  { id: 'l1', time: '05:25:01', level: 'INFO', message: 'Vanguard main handshake established with secure peer 103.22.42' },
  { id: 'l2', time: '05:24:12', level: 'INFO', message: 'Rain fog perimeter grid report normal. Sensor packets buffered.' },
  { id: 'l3', time: '05:20:44', level: 'WARN', message: 'Low activity user state detected. Switching to ecological CPU throttling.' },
  { id: 'l4', time: '05:18:11', level: 'CRIT', message: 'Intrusion alert: Unregistered probe pinged Britannian core 9. Blocked.' }
];

export default function VanguardCommand() {
  const [health, setHealth] = useState(99.42);
  const [nodes, setNodes] = useState(124801);
  const [threatLevel, setThreatLevel] = useState(1.15);
  
  const [adminLogs, setAdminLogs] = useState<CommandLog[]>(INITIAL_LOGS);
  const [isFlushing, setIsFlushing] = useState(false);
  const [actionLabel, setActionLabel] = useState<string | null>(null);

  // Oscillate stats slightly to look alive
  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(prev => {
        const delta = (Math.random() - 0.5) * 0.15;
        return Number(Math.max(92, Math.min(100, prev + delta)).toFixed(2));
      });
      setNodes(prev => {
        const delta = Math.floor((Math.random() - 0.4) * 8);
        return prev + delta;
      });
      setThreatLevel(prev => {
        const delta = (Math.random() - 0.5) * 0.08;
        return Number(Math.max(0.01, Math.min(10, prev + delta)).toFixed(2));
      });

      // Append live logs occasionally
      if (Math.random() > 0.6) {
        const triggers = [
          'Dossier database sweep complete',
          'Sector boundary calibration synced',
          'V-COIN ledger transaction audited',
          'Akatsuki rainfall monitoring ping normal',
          'Knightmare fuel cells registered normal status'
        ];
        const newLog: CommandLog = {
          id: `log-${Date.now()}`,
          time: new Date().toLocaleTimeString([], { hour12: false }),
          level: Math.random() > 0.85 ? 'WARN' : 'INFO',
          message: triggers[Math.floor(Math.random() * triggers.length)]
        };
        setAdminLogs(prev => [newLog, ...prev.slice(0, 7)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleFirewallReboot = () => {
    playDigitalSound('whir');
    setIsFlushing(true);
    setActionLabel('REBOOTING RADAR FIREWALL INTEGRITY SYSTEMS...');

    setTimeout(() => {
      setIsFlushing(false);
      setActionLabel(null);
      playDigitalSound('ping');
      const logMsg: CommandLog = {
        id: `log-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour12: false }),
        level: 'INFO',
        message: 'ADMIN SYSTEM: FIRWALL RESTORED AND FLUSH SESSIONS COMPLETED.'
      };
      setAdminLogs(prev => [logMsg, ...prev]);
    }, 1500);
  };

  const handleClearConns = () => {
    playDigitalSound('click');
    setNodes(124300); // Purge mock 501 stale connections
    const logMsg: CommandLog = {
      id: `log-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour12: false }),
      level: 'WARN',
      message: 'PURGED 501 INACTIVE IDLE CORE SESSIONS FROM BACKEND HANDLER.'
    };
    setAdminLogs(prev => [logMsg, ...prev]);
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-zinc-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
            <span className="text-[9px] font-mono tracking-widest text-[#E50914] uppercase font-black">ADMINISTRATIVE OVERVIEW</span>
          </div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3 chromatic-aberration">
            <ShieldAlert size={28} className="text-crimson shrink-0" />
            Vanguard <span className="text-crimson">Command Center</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Global network telemetry, master node registrations, and proactive threat response matrix triggers
          </p>
        </div>
      </div>

      {/* Main Administrative monospaced oversized telemetry metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-all">
        {/* Global System Health */}
        <div className="neural-glass p-6 rounded-3xl relative overflow-hidden border-[0.5px] border-white/10 flex flex-col justify-between min-h-[145px]">
          <div className="absolute top-3 right-4 text-[7px] font-mono text-zinc-500 tracking-widest uppercase">
            SEC_HEALTH_RATIO
          </div>
          <span className="text-[10px] font-mono text-zinc-500 font-extrabold uppercase">GLOBAL SYSTEM HEALTH</span>
          <span className="text-4xl sm:text-5xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500 tracking-tight mt-3 block select-all">
            {health}%
          </span>
          <span className="text-[8px] font-mono text-emerald-400/80 uppercase block mt-2 select-none">
            [● CALYPSO PROTOCOL SYNCHRONIZED NORMAL]
          </span>
        </div>

        {/* Total Nodes Connected */}
        <div className="neural-glass p-6 rounded-3xl relative overflow-hidden border-[0.5px] border-white/10 flex flex-col justify-between min-h-[145px]">
          <div className="absolute top-3 right-4 text-[7px] font-mono text-zinc-500 tracking-widest uppercase">
            REG_NODE_PINGS
          </div>
          <span className="text-[10px] font-mono text-zinc-500 font-extrabold uppercase">TOTAL NODES CONNECTED</span>
          <span className="text-4xl sm:text-5xl font-black font-mono text-amber-500 tracking-tight mt-3 block select-all">
            {nodes.toLocaleString()}
          </span>
          <span className="text-[8px] font-mono text-zinc-500 uppercase block mt-2 select-none">
            ACTIVE CORRIDORS ROUTING PEER PORTS
          </span>
        </div>

        {/* Active Threat Levels */}
        <div className="neural-glass p-6 rounded-3xl relative overflow-hidden border-[0.5px] border-white/10 flex flex-col justify-between min-h-[145px]">
          <div className="absolute top-3 right-4 text-[7px] font-mono text-zinc-500 tracking-widest uppercase">
            THREAT_COEFFICIENT
          </div>
          <span className="text-[10px] font-mono text-zinc-500 font-extrabold uppercase">ACTIVE THREAT COEFFICIENT</span>
          <span className="text-4xl sm:text-5xl font-black font-mono text-[#E50914] tracking-tight mt-3 block select-all">
            {threatLevel}%
          </span>
          <span className="text-[8px] font-mono text-red-500/80 uppercase block mt-2 select-none">
            [SOLAR RADIATION RADAR SYNCED SAFE]
          </span>
        </div>
      </div>

      {/* Neural Reconnaissance Matrix */}
      <ReconComponent onLogTriggered={(log) => setAdminLogs(prev => [log, ...prev])} />

      {/* Control Action Tools & live logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Side: System Control Actions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="neural-glass p-6 rounded-3xl flex flex-col gap-4 justify-between h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-crimson/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/5 pb-2 ml-0 w-full">
                MAINFRAME TRIGGER PANELS
              </h3>

              <div className="flex flex-col gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={handleFirewallReboot}
                  disabled={isFlushing}
                  className="w-full py-3 bg-black/60 border border-white/5 hover:border-crimson rounded-xl font-mono text-[9px] uppercase tracking-widest font-black text-white hover:bg-crimson/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={isFlushing ? 'animate-spin' : ''} size={12} />
                  <span>Flush Radar Firewall</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearConns}
                  className="w-full py-3 bg-black/60 border border-white/5 hover:border-crimson rounded-xl font-mono text-[9px] uppercase tracking-widest font-black text-white hover:bg-crimson/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ZapOff size={12} />
                  <span>Purge Stale Connections [501]</span>
                </button>
              </div>

              {actionLabel && (
                <div className="p-3.5 bg-crimson/10 border border-crimson/30 text-crimson text-[9px] font-mono rounded-xl animate-pulse mt-2">
                  {actionLabel}
                </div>
              )}
            </div>

            <div className="text-[8px] font-mono text-zinc-500 leading-relaxed uppercase tracking-normal border-t border-white/5 pt-4 select-none">
              SECURE SECTOR NETWORKS DETECT EXTRATERRESTRIAL BURSTS FROM VANGUARD PERIMETER. DISPATCH SHIP PROBES IF LOGS REPORT ANOMALOUS BEACON DISCOVERY activity.
            </div>
          </div>
        </div>

        {/* Right Side: Real-time logs console stream */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="neural-glass p-6 rounded-3xl flex flex-col gap-4">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-white border-b border-white/5 pb-3 flex items-center gap-2 select-none justify-between">
              <span className="flex items-center gap-2"><Terminal size={14} className="text-crimson" /> MASTER DIAGNOSTIC LOG STREAM</span>
              <span className="text-[10px] font-semibold text-emerald-400">SYNC ACTIVE</span>
            </h3>

            {/* Logs stream wrapper formatting */}
            <div className="flex flex-col bg-black/70 border border-white/5 rounded-2xl p-4 font-mono text-[10px] gap-2.5 min-h-[220px] max-h-[300px] overflow-y-auto">
              {adminLogs.map(log => {
                let badgeColor = 'text-green-400 bg-green-500/10 border-green-500/20';
                if (log.level === 'WARN') badgeColor = 'text-amber-500 bg-amber-500/15 border-amber-500/20';
                if (log.level === 'CRIT') badgeColor = 'text-red-500 bg-red-500/15 border-red-500/20';

                return (
                  <div key={log.id} className="flex gap-3 items-start hover:bg-white/2 p-2 rounded-lg transition-all border border-transparent select-text">
                    <span className="text-zinc-600 font-bold">[{log.time}]</span>
                    <span className={`px-2 py-0.5 text-[8px] font-black border rounded scale-90 ${badgeColor}`}>
                      {log.level}
                    </span>
                    <span className="text-zinc-300 flex-1 leading-snug">{log.message}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
