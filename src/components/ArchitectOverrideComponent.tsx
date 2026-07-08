import { useState } from 'react';
import { Database, ShieldAlert, Key } from 'lucide-react';

interface ArchitectOverrideProps {
  bypassSecret: string;
  setBypassSecret: (val: string) => void;
  architectSignature: string;
  setArchitectSignature: (val: string) => void;
  handleBypassSubmit: () => void;
  loadingAction: boolean;
  email: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function ArchitectOverrideComponent({
  bypassSecret,
  setBypassSecret,
  architectSignature,
  setArchitectSignature,
  handleBypassSubmit,
  loadingAction,
  email,
  onSuccess,
  onError,
}: ArchitectOverrideProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleServerSideSync = async () => {
    const signature = architectSignature.trim();
    if (!signature) {
      onError("Provide an Architect Signature for server-side verification sync.");
      setSyncMessage("[SYNC_ERR: INPUT_EMPTY]");
      return;
    }
    setSyncing(true);
    setSyncMessage("[SYNCING WITH MAINFRAME RECTIFIER...]");
    onError('');

    try {
      const response = await fetch("/api/sync-architect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ signature })
      });

      if (response.ok) {
        const data = await response.json();
        // Force-Persist override to sessionStorage
        sessionStorage.setItem("architect_key", "ANSH_SINGH");
        sessionStorage.setItem("mfa-authorized-email", email.trim().toLowerCase() || "anshsureshsingh07@gmail.com");
        sessionStorage.setItem("neural_stream_alert", "[ACCESS_GRANTED: SYSTEM_ARCHITECT_ANSH_SINGH_AUTHORIZED_OVERRIDE_ACTIVE]");

        // Broadcast to trigger App.tsx update
        window.dispatchEvent(new Event('storage'));
        setSyncMessage("[SYNC_SUCCESS: LEVEL-10 AUTHENTICATED]");
        onSuccess();
      } else {
        const status = response.status;
        const statusText = response.statusText || "";
        let errPay: any = {};
        try {
          errPay = await response.json();
        } catch (_) {}
        
        console.error(`[Server-Side Sync Rejected] Status: ${status} ${statusText}`, errPay);
        const errMsg = errPay.error || "Mismatched signature credentials.";
        onError(`${errMsg} (HTTP_STATUS: ${status})`);
        setSyncMessage(`[SYNC_FAILED: STATUS_${status}]`);
      }
    } catch (err: any) {
      console.error("[CORS / Handshake Exception] Server connection broken:", err);
      onError(`[SYS_ERR: CORS_OR_NETWORK_DISRUPTION] / Status: Failed to fetch (possible CORS block or destination unreachable). Detail: ${err.message || err}`);
      setSyncMessage("[SYNC_FAILED: NETWORK_DISRUPTION]");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-amber-950/20 border border-amber-500/25 rounded-xl p-4 text-[10px] font-mono uppercase space-y-3.5 animate-fade-in shadow-[0_0_15px_rgba(245,158,11,0.05)]">
      <div>
        <span className="text-[8px] font-bold text-amber-500 flex items-center gap-1">
          <Database size={10} className="text-amber-500 animate-pulse" />
          ▲ [EMERGENCY HARDWARE BYPASS PROTOCOL]
        </span>
        <p className="text-[9px] text-zinc-400 lowercase leading-relaxed mt-1">
          Provide either the secondary admin_secret_key declared inside the .env file, or present your master architect credential sequence to bypass standard hardware checks.
        </p>
      </div>

      <div className="space-y-3.5 border-t border-white/5 pt-3">
        {/* Input for ADMIN_SECRET_KEY bypass */}
        <div className="space-y-1">
          <label className="text-[8px] text-zinc-500 uppercase tracking-wider block">
            Emergency ADMIN_SECRET_KEY bypass
          </label>
          <input
            type="password"
            value={bypassSecret}
            onChange={(e) => setBypassSecret(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-xs font-mono text-white outline-0 focus:border-amber-500/50"
            placeholder="ADMIN_SECRET_KEY"
          />
        </div>

        {/* Input for Architect Signature override */}
        <div className="space-y-1">
          <label className="text-[8px] text-zinc-550 uppercase tracking-wider block">
            Secondary Architect Signature Override (e.g. ANSH SINGH)
          </label>
          <input
            type="text"
            value={architectSignature}
            onChange={(e) => setArchitectSignature(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-xs font-mono text-white outline-0 focus:border-amber-500/50 uppercase"
            placeholder="e.g. ANSH SINGH"
          />
        </div>

        {/* Interactive feedback status for Server-side Sync */}
        {syncMessage && (
          <div className="text-[8px] font-bold text-amber-500 animate-pulse flex items-center gap-1 bg-amber-950/20 p-2 rounded border border-amber-500/15">
            <Key size={10} />
            <span>SYNC_STATUS: {syncMessage}</span>
          </div>
        )}

        {/* Buttons for Sync and standard bypass */}
        <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
          <button
            type="button"
            onClick={handleServerSideSync}
            disabled={syncing || loadingAction}
            className="w-full border border-amber-500/30 hover:border-amber-500/70 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 py-2 rounded text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            title="Authenticate signature status directly with node backend"
          >
            Server-Side Sync
          </button>
          
          <button
            type="button"
            onClick={handleBypassSubmit}
            disabled={syncing || loadingAction}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black py-2 rounded text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_10px_rgba(245,158,11,0.2)] disabled:opacity-50"
          >
            {loadingAction ? "Authorizing..." : "Bypass secure gate"}
          </button>
        </div>
      </div>
    </div>
  );
}
