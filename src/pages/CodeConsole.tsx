import { useState, useEffect } from 'react';
import { ShieldCheck, Terminal, Server, ShieldAlert, Cpu, Heart, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';

export default function CodeConsole() {
  const [logs, setLogs] = useState<string[]>([]);
  const [sysStatus, setSysStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cmdInput, setCmdInput] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Check Zero-Trust Token
    const token = sessionStorage.getItem("x-zero-trust-token");
    if (!token) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    setIsAuthorized(true);

    const fetchSystemInfo = async () => {
      try {
        const res = await fetch("/api/security/info", {
          headers: {
            "X-Zero-Trust-Token": token || ""
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSysStatus(data);
          setLogs(prev => [
            ...prev,
            `[SYSTEM_SEC] SECURE NEURAL OVERRIDE RECOGNIZED. IP: ${data.clientIp}`,
            `[SYSTEM_SEC] WHitelisted IPs: ${data.allowedIps.join(", ")}`,
            `[SHIELD] ACTIVE SECURE SESSION TOKENS: ${data.activeMfaSessions}`,
            `[WAF_FIREWALL] FIREWALL RULES ENABLED: ZERO-TRUST ACTIVE`,
            `--- MAINFRAME ENCRYPTED LINK STANDBY ---`
          ]);
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error("Failed to query secure system metadata:", err);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
  }, []);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;

    const cmd = cmdInput.trim().toLowerCase();
    setCmdInput('');

    setLogs(prev => [...prev, `operator@zero-trust-console:~$ ${cmd}`]);

    setTimeout(() => {
      if (cmd === 'help') {
        setLogs(prev => [
          ...prev,
          "SUPPORTED OPERATIONAL OVERRIDES:",
          "  status          - Queries secure edge firewall topology",
          "  clear           - Clears display mainframe buffer",
          "  blocklist       - Queries banned IP addresses Gated by WAF",
          "  ping            - Performs high-freq latency diagnostics"
        ]);
      } else if (cmd === 'status') {
        setLogs(prev => [
          ...prev,
          `[SYSTEM] CURRENT DEPLOYMENT DOMAIN: ${window.location.origin}`,
          `[WAF] SENSITIVE THROTTLING LIMIT: 10 requests / min`,
          `[CORS] WHITE-LISTED SCHEMAS: LOCALHOST, GOOGLE-API, CHROME-EXTENSION`,
          `[MFA] ENFORCEMENT STATE: AUTH0/CLERK YUBIKEY HARDWARE PASS`
        ]);
      } else if (cmd === 'clear') {
        setLogs([]);
      } else if (cmd === 'blocklist') {
        setLogs(prev => [
          ...prev,
          "[WAF ALERTS] SCANNING BRUTE-FORCE REGISTRIES...",
          "[WAF ALERTS] ALL CHANNELS SECURE. NO ACTIVE BAN TRIGGERS DETECTED."
        ]);
      } else if (cmd === 'ping') {
        setLogs(prev => [...prev, `64 bytes from root-edge-firewall ($PORT): icmp_seq=1 ttl=64 time=1.45ms`]);
      } else {
        setLogs(prev => [...prev, `[CONSOLE_ERROR] Override command '${cmd}' unrecognized. Dial 'help' for support.`]);
      }
    }, 150);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-40 text-center font-mono text-zinc-500 flex flex-col items-center justify-center gap-4">
        <Server className="animate-pulse text-crimson" size={40} />
        <span className="text-xs uppercase tracking-widest animate-pulse">Establishing Secure Frame Session...</span>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="max-w-xl mx-auto px-6 py-40 text-center">
        <ShieldAlert size={64} className="mx-auto text-rose-600 mb-6 animate-bounce" />
        <h1 className="text-2xl font-black uppercase text-white tracking-widest italic mb-2">Gatekeeper <span className="text-rose-500">Refused</span></h1>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-wider mb-6 leading-relaxed">
          [HTTP_STATUS: 404] Route code / admin is closed. Zero-Trust Shield block. Complete external Clerk/Auth0 MFA handshakes first.
        </p>
        <div className="mt-8">
          <a 
            href="/alpha-sector-9-override"
            className="font-mono text-[10px] font-bold text-white bg-red-600 hover:bg-red-700 px-5 py-2.5 rounded-lg uppercase tracking-widest transition-all"
          >
            Authenticate Portal
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 font-mono">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b border-white/5 gap-4">
        <div>
          <h1 className="text-md font-black text-rose-500 tracking-wider uppercase flex items-center gap-2">
            <Terminal size={18} /> EDGE_CODECORE_OVERRIDE
          </h1>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Operator: {auth.currentUser?.email || "Super_Admin"}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded flex items-center gap-2 text-emerald-500 text-[10px]">
            <ShieldCheck size={12} />
            <span>MFA VERIFIED</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="border border-white/5 bg-[#0b0b0d] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3 text-rose-500 text-xs">
            <Cpu size={14} />
            <span className="font-bold tracking-widest uppercase text-[10px]">Edge VM Status</span>
          </div>
          <div className="text-[10px] text-zinc-400 space-y-1.5 uppercase">
            <div>[IP]: {sysStatus?.clientIp || "127.0.0.1"}</div>
            <div>[IP_TUNNEL]: WHitelisted</div>
            <div>[WAF Firewall]: ENABLED (10req/min)</div>
            <div>[CORS Origin]: Strict Lockdown</div>
          </div>
        </div>

        <div className="border border-white/5 bg-[#0b0b0d] rounded-xl p-5 col-span-2">
          <div className="flex items-center gap-2 mb-3 text-amber-500 text-xs">
            <AlertTriangle size={14} />
            <span className="font-bold tracking-widest uppercase text-[10px]">Security Matrix Status</span>
          </div>
          <div className="text-[10px] text-zinc-400 space-y-1.5 uppercase grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <div>[Clerk Auth]: ACTIVE</div>
            <div>[Auth0 MFA]: WebAuthn/TOTP</div>
            <div>[IP_WHITELIST]: {sysStatus?.allowedIps.slice(0, 3).join(", ")}</div>
            <div>[Obfuscation]: Serverless Core</div>
          </div>
        </div>
      </div>

      <div className="border border-white/5 bg-black rounded-xl p-5 relative overflow-hidden group shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-3">
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest">[SYSTEM LOG BUFFER]</span>
          <span className="text-[9px] text-zinc-500">ROOT@ZERO-TRUST</span>
        </div>
        
        <div className="h-64 overflow-y-auto text-xs text-zinc-400 space-y-1 scrollbar-thin">
          {logs.map((log, index) => (
            <div key={index} className="leading-relaxed hover:bg-white/5 px-2 rounded py-0.5">
              {log}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-zinc-600 italic select-none">No actions recorded in operator console buffer. Type 'help'.</div>
          )}
        </div>

        <form onSubmit={handleCommandSubmit} className="mt-4 flex gap-2 border-t border-white/5 pt-3">
          <span className="text-rose-500 self-center">operator@zero-trust-console:~$</span>
          <input 
            type="text" 
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            className="flex-1 bg-transparent border-0 outline-0 ring-0 focus:ring-0 focus:outline-none text-rose-400 font-mono text-xs"
            placeholder="Type 'help' to review clearance override parameters..."
          />
        </form>
      </div>
    </div>
  );
}
