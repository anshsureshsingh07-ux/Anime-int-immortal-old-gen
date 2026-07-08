import { useState, useEffect } from 'react';
import { ShieldCheck, Key, Fingerprint, RefreshCw, AlertTriangle, Cpu, Globe, Server, UserCheck, ShieldAlert, Laptop } from 'lucide-react';
import { motion } from 'motion/react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { ArchitectOverrideComponent } from '../components/ArchitectOverrideComponent';

export default function ZeroTrustPortal() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [useYubikey, setUseYubikey] = useState(true);
  const [yubikeyWaiting, setYubikeyWaiting] = useState(false);
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [loadingSys, setLoadingSys] = useState(true);
  const [registeringIp, setRegisteringIp] = useState(false);
  const [serverHandshakeStatus, setServerHandshakeStatus] = useState<'checking' | 'connected' | 'connected-warn' | 'error'>('checking');
  
  // States for verification feedback
  const [authStage, setAuthStage] = useState<'credentials' | 'mfa' | 'success'>('credentials');
  const [errorText, setErrorText] = useState('');
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    const runDiagnostic = async () => {
      try {
        const response = await fetch("/api/security/diagnostic");
        if (response.ok) {
          const data = await response.json();
          if (data.adminSecretKeyPresent === false) {
            console.error("[ERR: ENV_VAR_MISSING_ON_SERVER] Secondary gatekeeper ADMIN_SECRET_KEY environment variable is not defined on the node host server!");
            setServerHandshakeStatus('connected-warn');
          } else {
            setServerHandshakeStatus('connected');
          }
        } else {
          setServerHandshakeStatus('error');
        }
      } catch (err) {
        console.error("Diagnostic handshake fetch failed:", err);
        setServerHandshakeStatus('error');
      }
    };
    runDiagnostic();
  }, []);

  // Dev emergency override States
  const [bypassSecret, setBypassSecret] = useState('');
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [architectSignature, setArchitectSignature] = useState('');
  const [isArchitectVerified, setIsArchitectVerified] = useState(
    sessionStorage.getItem('architect_key') === 'ANSH_SINGH'
  );

  useEffect(() => {
    const checkArchitect = () => {
      setIsArchitectVerified(sessionStorage.getItem('architect_key') === 'ANSH_SINGH');
    };
    checkArchitect();
    window.addEventListener('storage', checkArchitect);
    // Poll to keep reactive for sub-frame containers
    const interval = setInterval(checkArchitect, 1000);
    return () => {
      window.removeEventListener('storage', checkArchitect);
      clearInterval(interval);
    };
  }, []);

  // Monitor loadingAction state to implement 5s Auth-State Timeout/Cleanup
  useEffect(() => {
    let timerID: any;
    if (loadingAction) {
      timerID = setTimeout(() => {
        setLoadingAction(false);
        setErrorText("[SYS_ERR: AUTH_TIMEOUT_RETRY_REQUIRED] (The secure gateway has exceeded the 5000ms authentication limit. Process reset.)");
        console.warn("[SYS_ERR: AUTH_TIMEOUT_RETRY_REQUIRED] Handshake timeout threshold cleared.");
      }, 5000);
    }
    return () => {
      if (timerID) clearTimeout(timerID);
    };
  }, [loadingAction]);

  useEffect(() => {
    // Sync current logged in email and auto-advance to MFA challenge stage if already authed with Firebase
    const unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
      if (user?.email) {
        setEmail(user.email);
        sessionStorage.setItem("user-admin-email", user.email);
        
        // Auto-advance since credentials stage is solved via Firebase session
        const adminEmails = ["anshsureshsingh07@gmail.com", "animeintofficial@gmail.com", "admin@nexus.com", "anshsureshsingh@gmail.com"];
        const normalizedEmail = user.email.trim().toLowerCase();
        if (adminEmails.includes(normalizedEmail) || normalizedEmail.includes("admin")) {
          setAuthStage('mfa');
        }
      }
    });

    fetchSystemInfo();
    return () => unsubscribeFirebase();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const res = await fetch("/api/security/info");
      if (res.ok) {
        const data = await res.json();
        setSysInfo(data);
      }
    } catch (err) {
      console.error("Failed to query system telemetry:", err);
    } finally {
      setLoadingSys(false);
    }
  };

  const handleRegisterCurrentIP = async () => {
    setRegisteringIp(true);
    try {
      const res = await fetch("/api/security/register-ip", { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        await fetchSystemInfo();
        console.log("Successfully registered IP tunnel endpoint:", data.registeredIp);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRegisteringIp(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!email.trim() || !password.trim()) {
      setErrorText("Provide valid mainframe clearance credentials.");
      return;
    }

    const adminEmails = ["anshsureshsingh07@gmail.com", "animeintofficial@gmail.com", "admin@nexus.com", "anshsureshsingh@gmail.com"];
    const normalizedEmail = email.trim().toLowerCase();
    
    // Quick role check
    const hasClearance = adminEmails.includes(normalizedEmail) || normalizedEmail.includes("admin");
    if (!hasClearance) {
      setErrorText("[RBAC_ALERT] Your account does not have operator clearance.");
      return;
    }

    // Go to secondary MFA challenge
    setAuthStage('mfa');
  };

  const triggerYubikeySimulation = () => {
    setYubikeyWaiting(true);
    setErrorText('');
    
    // Simulates a hardware key WebAuthn signature response after 1.8 seconds
    setTimeout(() => {
      setMfaCode("yubikey-sec-" + Math.random().toString(36).substring(3, 15).toUpperCase());
      setYubikeyWaiting(false);
    }, 1800);
  };

  const handleForceReset = () => {
    setLoadingAction(false);
    setYubikeyWaiting(false);
    setErrorText('');
    setMfaCode('');
    setAuthStage('credentials');
    setBypassSecret('');
    setArchitectSignature('');
    setOverrideOpen(false);
    console.warn("[Force-Reset] Mainframe operators initiated system authentication flow cleanup.");
  };

  const handleBypassSubmit = async () => {
    const ARCHITECT_KEY = 'ANSH_SINGH';
    const normalizedSignature = architectSignature.trim().toUpperCase().replace(/\s+/g, '_');
    const isArchitectBypass = normalizedSignature === ARCHITECT_KEY;

    if (isArchitectBypass) {
      setLoadingAction(true);
      setErrorText('');
      setTimeout(() => {
        // Persistent Identity in sessionStorage under 'architect_key' to 'ANSH_SINGH'
        sessionStorage.setItem("architect_key", ARCHITECT_KEY);
        sessionStorage.setItem("mfa-authorized-email", email.trim().toLowerCase() || "anshsureshsingh07@gmail.com");
        
        // System Logging unique alert to sessionStorage/localStorage for the App.tsx Neural Stream
        sessionStorage.setItem("neural_stream_alert", "[ACCESS_GRANTED: SYSTEM_ARCHITECT_ANSH_SINGH_AUTHORIZED_OVERRIDE_ACTIVE]");
        
        // Dispatch custom storage event for instant state synchronization
        window.dispatchEvent(new Event('storage'));

        setAuthStage('success');
        setLoadingAction(false);
        console.warn("[ACCESS_GRANTED: SYSTEM_ARCHITECT_ANSH_SINGH_AUTHORIZED_OVERRIDE_ACTIVE] Level-10 authority bypass confirmed.");
      }, 700);
      return;
    }

    if (!bypassSecret.trim()) {
      setErrorText("Provide a valid ADMIN_SECRET_KEY or matching Architect Signature override sequence.");
      return;
    }
    setLoadingAction(true);
    setErrorText('');

    try {
      const res = await fetch("/api/security/verify-mfa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          bypassKey: bypassSecret.trim(),
          architectSignature: architectSignature.trim(),
          simulatedIp: sysInfo?.clientIp || "127.0.0.1"
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Save token to session and set storage
        sessionStorage.setItem("x-zero-trust-token", data.token);
        sessionStorage.setItem("mfa-authorized-email", email.trim().toLowerCase());
        if (data.isArchitect) {
          sessionStorage.setItem("architect_key", ARCHITECT_KEY);
          sessionStorage.setItem("neural_stream_alert", "[ACCESS_GRANTED: SYSTEM_ARCHITECT_ANSH_SINGH_AUTHORIZED_OVERRIDE_ACTIVE]");
          window.dispatchEvent(new Event('storage'));
        }
        setAuthStage('success');
      } else {
        const status = res.status;
        const statusText = res.statusText || "";
        let errPayload: any = {};
        try {
          errPayload = await res.json();
        } catch (_) {}

        console.error(`[MFA Bypass Failure] Emergency signal override rejected by server. Status: ${status} ${statusText}. Response body:`, errPayload);
        const errorMsg = errPayload.error || `[BYPASS_FAILED] Secondary ADMIN_SECRET_KEY bypass was refused.`;
        setErrorText(`${errorMsg} (HTTP_STATUS: ${status})`);
      }
    } catch (err: any) {
      console.error("[MFA Bypass Exception] Server-edge bypass pipeline failed:", err);
      setErrorText(`[SYS_ERR: CORS_OR_NETWORK_DISRUPTION] / Status: Failed to fetch (possible CORS/Blocked IP). Detail: ${err.message || err}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');
    setLoadingAction(true);

    if (!mfaCode.trim() && useYubikey) {
      setErrorText("Trigger or insert your WebAuthn security hardware key first.");
      setLoadingAction(false);
      return;
    }

    const codeToSend = useYubikey ? mfaCode : mfaCode.trim();

    try {
      const res = await fetch("/api/security/verify-mfa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: codeToSend || "999999", // standard simulation fallback if code exists
          simulatedIp: sysInfo?.clientIp || "127.0.0.1"
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Save token to session and set storage
        sessionStorage.setItem("x-zero-trust-token", data.token);
        sessionStorage.setItem("mfa-authorized-email", email.trim().toLowerCase());
        setAuthStage('success');
      } else {
        const status = res.status;
        const statusText = res.statusText || "";
        let errPayload: any = {};
        try {
          errPayload = await res.json();
        } catch (_) {}

        console.error(`[MFA Verification Failure] Server status: ${status} ${statusText}. Response body:`, errPayload);
        const errorMsg = errPayload.error || `[SYS_ERR: SEVERE_GATE_REJECTION / HTTP_${status} ${statusText}]`;
        setErrorText(`${errorMsg} (HTTP_STATUS: ${status})`);
      }
    } catch (err: any) {
      console.error("[MFA Verification Exception] Network request failed:", err);
      setErrorText(`[SYS_ERR: CORS_OR_NETWORK_DISRUPTION] / Status: Failed to fetch (possible CORS/Blocked IP or local proxy disruption). Detail: ${err.message || err}`);
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 font-mono">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-red-950/20 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4 relative">
          <ShieldCheck className="text-red-500 animate-pulse" size={32} />
          <div className="absolute inset-0 rounded-full border border-red-500/10 animate-ping" />
        </div>
        <h1 className="text-xl font-black uppercase text-white tracking-[0.2em]">
          IDENTITY_GATEKEEPER Portal
        </h1>
        <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1.5 leading-relaxed">
          [WAF SHIELD] Clerk & Auth0 Multi-Factor WebAuthn Verification // Sector Alpha Sector 9 Override
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-10">
        
        {/* Left Column: Diagnostics and active security parameters */}
        <div className="border border-white/5 bg-[#0b0b0d] rounded-xl p-5 space-y-5">
          <div>
            <span className="text-[8px] font-black tracking-widest uppercase text-red-500 block mb-2">// ENVIRONMENT SHIELDING</span>
            <div className="text-[10px] text-zinc-400 space-y-1.5 uppercase">
              <div className="flex flex-col border-b border-white/5 pb-2 mb-2 gap-0.5">
                <span className="text-[7.5px] text-zinc-500 font-extrabold uppercase tracking-widest">SYSTEM_STATUS:</span>
                <span className={`text-[9px] font-black uppercase tracking-wider ${isArchitectVerified ? "text-amber-400 animate-pulse font-extrabold" : "text-emerald-500"}`}>
                  {isArchitectVerified ? "SYSTEM_STATUS: ARCHITECT_CORE_CONTROL_ANSH_SINGH" : "SYSTEM_STATUS: CORE_ACTIVE"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>API Secrets</span>
                <span className="text-emerald-500">[ENCRYPTED]</span>
              </div>
              <div className="flex justify-between">
                <span>Database</span>
                <span className="text-emerald-500">[STANDBY]</span>
              </div>
              <div className="flex justify-between">
                <span>Edge Logic</span>
                <span className="text-emerald-400">[ENFORCED]</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <span className="text-[8px] font-black tracking-widest uppercase text-red-500 block mb-2">// ADMin TUNNEL</span>
            {loadingSys ? (
              <span className="text-[9px] text-zinc-500 animate-pulse">[PING DIAGNOSTICS...]</span>
            ) : (
              <div className="space-y-3">
                <div className="text-[10px] text-zinc-400 uppercase space-y-1">
                  <div>Active Remote IP: {sysInfo?.clientIp || "Scanning..."}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${sysInfo?.whitelisted ? "bg-emerald-500" : "bg-red-500 animate-ping"}`} />
                    <span className="font-extrabold text-[9px]">
                      {sysInfo?.whitelisted ? "[IP TUNNEL: WHITELISTED]" : "[IP TUNNEL: CLOSED]"}
                    </span>
                  </div>
                </div>

                {!sysInfo?.whitelisted && (
                  <button
                    disabled={registeringIp}
                    onClick={handleRegisterCurrentIP}
                    className="w-full font-mono text-[9px] font-bold text-center text-red-500 hover:text-white border border-red-500/20 hover:bg-red-950/40 p-2 rounded-lg transition-all uppercase tracking-wider"
                  >
                    {registeringIp ? "Registering Node..." : "Lock-on/Whitelist My active IP"}
                  </button>
                )}

                {/* Handshake Status indicator */}
                <div className="border-t border-white/5 pt-3 mt-2 flex flex-col gap-1 text-[8px] tracking-wider uppercase font-extrabold select-none">
                  <span className="text-zinc-500 text-[7px] font-black uppercase">SERVER HANDSHAKE PROTOCOL:</span>
                  {serverHandshakeStatus === 'checking' && (
                    <span className="text-amber-500 animate-pulse">[SERVER_HANDSHAKE: SYNCING...]</span>
                  )}
                  {serverHandshakeStatus === 'connected' && (
                    <span className="text-emerald-500 uppercase flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-ping" />
                      [SERVER_HANDSHAKE: CONNECTED]
                    </span>
                  )}
                  {serverHandshakeStatus === 'connected-warn' && (
                    <span className="text-amber-400 animate-pulse" title="ADMIN_SECRET_KEY is missing on server environment">
                      [SERVER_HANDSHAKE: CONNECTED - ADMIN_KEY_MISSING]
                    </span>
                  )}
                  {serverHandshakeStatus === 'error' && (
                    <span className="text-red-500 font-extrabold animate-pulse">
                      [SERVER_HANDSHAKE: ERROR / CORS_DISRUPTED]
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right Column: The interactive authentication card */}
        <div className="border border-white/10 bg-zinc-950/80 rounded-xl p-6 md:col-span-2 shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-red-600 animate-pulse" />
          
          {errorText && (
            <div className="space-y-3 mb-5">
              <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-3 flex gap-2.5 items-start text-red-400 text-[10px] uppercase leading-relaxed font-mono">
                <ShieldAlert className="shrink-0 mt-0.5 animate-bounce" size={14} />
                <div className="flex-1">
                  <span>{errorText}</span>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleForceReset}
                    className="text-[8px] bg-red-900/30 hover:bg-red-600/30 text-red-400 hover:text-white px-2 py-1 rounded transition-all font-mono font-bold uppercase border border-red-500/20 cursor-pointer"
                  >
                    [Force Reset]
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverrideOpen(prev => !prev)}
                    className="text-[8px] bg-amber-900/10 hover:bg-amber-600/30 text-amber-500 hover:text-white px-2 py-1 rounded transition-all font-mono font-semibold uppercase border border-amber-500/20 cursor-pointer"
                  >
                    {overrideOpen ? "[Hide Override]" : "[Override Gate]"}
                  </button>
                </div>
              </div>

              {overrideOpen && (
                <ArchitectOverrideComponent
                  bypassSecret={bypassSecret}
                  setBypassSecret={setBypassSecret}
                  architectSignature={architectSignature}
                  setArchitectSignature={setArchitectSignature}
                  handleBypassSubmit={handleBypassSubmit}
                  loadingAction={loadingAction}
                  email={email}
                  onSuccess={() => {
                    setAuthStage('success');
                    setErrorText('');
                  }}
                  onError={(msg) => {
                    setErrorText(msg);
                  }}
                />
              )}
            </div>
          )}

          {authStage === 'credentials' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2.5 mb-4">
                <Laptop size={14} className="text-zinc-500" />
                <span className="text-[10px] font-black uppercase text-zinc-300">MAIN CREDENTIAL VERIFICATION</span>
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 block mb-1">Clearance Username (Email)</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/50 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white outline-0 focus:border-red-500/50 transition-all uppercase"
                  placeholder="e.g. ANSHSURESHSINGH07@GMAIL.COM"
                />
              </div>

              <div>
                <label className="text-[9px] uppercase tracking-widest text-zinc-500 block mb-1">Operator Main Access Token (Password)</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/50 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white outline-0 focus:border-red-500/50 transition-all"
                  placeholder="••••••••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 font-bold uppercase text-xs tracking-widest text-white py-2.5 rounded-lg transition-all mt-6 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:scale-[1.01]"
              >
                REQUEST TELEMETRY CHALLENGE
              </button>
            </form>
          )}

          {authStage === 'mfa' && (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
                <div className="flex items-center gap-2">
                  <Fingerprint size={14} className="text-red-500" />
                  <span className="text-[10px] font-black uppercase text-zinc-300">HARDWARE SECTOR CHALLENGE</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setUseYubikey(true); setErrorText(''); }}
                    className={`text-[8px] px-2 py-0.5 rounded border uppercase font-bold tracking-widest transition-all ${useYubikey ? "bg-red-950/30 border-red-500/30 text-red-500" : "border-white/5 text-zinc-500"}`}
                  >
                    YubiKey
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUseYubikey(false); setErrorText(''); }}
                    className={`text-[8px] px-2 py-0.5 rounded border uppercase font-bold tracking-widest transition-all ${!useYubikey ? "bg-red-950/30 border-red-500/30 text-red-500" : "border-white/5 text-zinc-500"}`}
                  >
                    TOTP Google
                  </button>
                </div>
              </div>

              {useYubikey ? (
                <div className="space-y-4">
                  <p className="text-[9px] text-zinc-500 uppercase leading-relaxed">
                    Insert your physical hardware security key (YubiKey / Bio-Auth Key) and click trigger below to complete the secure WebAuthn challenge.
                  </p>

                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-center min-h-[110px]">
                    {yubikeyWaiting ? (
                      <>
                        <RefreshCw className="animate-spin text-red-500" size={24} />
                        <span className="text-[8px] text-zinc-400 animate-pulse tracking-widest uppercase">WAITING FOR HARDWARE KEY HANDSHAKE...</span>
                      </>
                    ) : mfaCode ? (
                      <>
                        <ShieldCheck className="text-emerald-500 animate-bounce" size={24} />
                        <span className="text-[8px] text-emerald-400 font-bold uppercase tracking-widest">[YUBIKEY PHYSICAL INPUT CAPTURED]</span>
                        <span className="text-[8px] font-mono text-zinc-500 truncate max-w-full">{mfaCode}</span>
                      </>
                    ) : (
                      <>
                        <Key className="text-zinc-600 animate-pulse" size={24} />
                        <span className="text-[8px] text-zinc-500 uppercase tracking-widest">YubiKey Security Key idle</span>
                      </>
                    )}
                  </div>

                  {!mfaCode && (
                    <button
                      type="button"
                      onClick={triggerYubikeySimulation}
                      disabled={yubikeyWaiting}
                      className="w-full text-[9px] border border-red-500/30 hover:bg-red-950/20 py-2 rounded-lg font-bold uppercase tracking-wider text-red-400 transition-all active:scale-[0.99]"
                    >
                      Trigger YubiKey Simulation Signature
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-[9px] uppercase tracking-widest text-zinc-500 block mb-1">Authenticator App Passcode</label>
                  <input
                    type="text"
                    required
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    className="w-full bg-black/50 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-center tracking-[0.4em] text-white outline-0 focus:border-red-500/50 transition-all"
                    placeholder="123456"
                    maxLength={6}
                  />
                  <p className="text-[8px] text-zinc-500 uppercase tracking-wider mt-1.5">Provide standard Google/Auth0 OTP (e.g. 123456 or 999999)</p>
                </div>
              )}

              <div className="flex flex-col gap-2 mt-6 pt-3 border-t border-white/5">
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setAuthStage('credentials')}
                    className="px-4 text-[9px] border border-white/5 hover:bg-white/5 text-zinc-500 hover:text-white uppercase tracking-widest rounded-lg transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-xs font-bold uppercase tracking-widest text-white py-2.5 rounded-lg transition-all"
                  >
                    {loadingAction ? "AUTHENTICATING SECURE EDGE..." : "VERIFY MULTI-FACTOR TOKEN"}
                  </button>
                </div>
                {loadingAction && (
                  <div className="text-center pt-1.5">
                    <button
                      type="button"
                      onClick={handleForceReset}
                      className="text-[8px] text-zinc-500 hover:text-red-500 underline uppercase tracking-widest font-mono cursor-pointer"
                    >
                      Force terminate & reset authentication stream
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}

          {authStage === 'success' && (
            <div className="text-center py-6 space-y-4">
              <ShieldCheck className="mx-auto text-emerald-500 animate-bounce" size={48} />
              <div className="uppercase">
                <h4 className="text-sm font-black text-white tracking-widest">[ZERO-TRUST SIGNATURE EXCHANGED]</h4>
                <p className="text-[9px] text-zinc-500 tracking-wider mt-1.5 leading-relaxed">
                  Your identity has been cataloged onto edge session memory. Role-based clearances are fully unlocked.
                </p>
              </div>

              <div className="flex gap-4 max-w-sm mx-auto pt-6 justify-center">
                <a
                  href="/admin"
                  className="font-mono text-[10px] font-extrabold text-white bg-rose-600 hover:bg-rose-700 px-5 py-2.5 rounded-lg uppercase tracking-widest transition-all text-center flex-1"
                >
                  Admin Console
                </a>
                <a
                  href="/code"
                  className="font-mono text-[10px] font-extrabold text-rose-500 hover:text-white border border-rose-500/20 hover:bg-rose-950/20 px-5 py-2.5 rounded-lg uppercase tracking-widest transition-all text-center flex-1"
                >
                  Code Console
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
