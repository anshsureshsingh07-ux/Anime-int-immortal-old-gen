import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Mail, Shield, AlertCircle, RefreshCw, LogOut, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink 
} from 'firebase/auth';
import { auth } from '../lib/firebase';

interface OTPChallengeProps {
   email: string;
   onVerified: () => void;
   onCancel: () => void;
}

export default function OTPChallenge({ email, onVerified, onCancel }: OTPChallengeProps) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [devCode, setDevCode] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Automatically trigger the initial OTP dispatch on mount
  useEffect(() => {
    sendOTPCode();
  }, []);

  // Monitor for native Firebase Sign-In with Email Link redirect
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const storedEmail = window.localStorage.getItem('emailForSignIn') || email;
      if (storedEmail) {
        setLoading(true);
        setError(null);
        signInWithEmailLink(auth, storedEmail, window.location.href)
          .then(() => {
            setError(null); // Clear out previous errors instantly
            setSuccess(true);
            window.localStorage.removeItem('emailForSignIn');
            setTimeout(() => {
              onVerified();
            }, 1000);
          })
          .catch((err: any) => {
            console.error('[FIREBASE LINK VERIFICATION ERROR]:', err);
            setError(err.message || 'Verification token transmission failed');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [email, onVerified]);

  // Countdown timer for resend threshold
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const sendOTPCode = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Dispatch through standard DB integration for tracking
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      // 2. Dispatch native Firebase sign-in link safely
      const actionCodeSettings = {
        url: window.location.href, // Re-route right back here for token extraction
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
      
      // Cache coordinates for instant validation on return
      window.localStorage.setItem('emailForSignIn', email.trim());

      setError(null); // Instantly clear error container on success
      setCountdown(60);

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.dev_code) {
          setDevCode(data.dev_code);
          console.log(
            `%c[OTP SECURITY DISPATCH] Registered coordinates: ${email} | Mockup passcode fallback logged: ${data.dev_code}`,
            'color: #F59E0B; font-weight: bold; font-size: 13px; background: #111; padding: 6px; border: 1px solid #F59E0B; border-radius: 4px;'
          );
        }
      }
    } catch (err: any) {
      console.error('[OTP TRANSMISSION ERROR]:', err);
      setError(err.message || 'Verification token transmission failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (value: string, index: number) => {
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1); // Only allow single numeric digits
    const updatedDigits = [...digits];
    updatedDigits[index] = cleanVal;
    setDigits(updatedDigits);

    // Auto focus next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto trigger submission if all digits are filled
    const completeCode = updatedDigits.join('');
    if (completeCode.length === 6) {
      handleVerify(completeCode);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Focus previous box on backspace if empty
      const updatedDigits = [...digits];
      updatedDigits[index - 1] = '';
      setDigits(updatedDigits);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const parsed = pastedData.split('');
      setDigits(parsed);
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (codeToVerify: string) => {
    setLoading(true);
    setError(null);

    try {
      // Validate OTP code using the Supabase client setting node
      const { data, error: dbError } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', `otp_${email.trim().toLowerCase()}`)
        .maybeSingle();

      if (dbError) {
        throw new Error('Security node query failed. Please verify connection.');
      }

      if (!data) {
        throw new Error('No active verification session found. Send a fresh code.');
      }

      const { upi_id: correctCode, qr_url: expiresAtStr } = data;
      const expiresAt = Number(expiresAtStr);

      if (Date.now() > expiresAt) {
        throw new Error('Passcode transaction has expired. Please request a new code.');
      }

      if (codeToVerify !== correctCode) {
        throw new Error('Decryption passphrase invalid. Access denied.');
      }

      // Success! Clear setting node in db so it is single-use
      await supabase
        .from('app_settings')
        .delete()
        .eq('id', `otp_${email.trim().toLowerCase()}`);

      setError(null); // Clear previous errors instantly
      setSuccess(true);
      setTimeout(() => {
        onVerified();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Decryption verify failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setDigits(Array(6).fill(''));
    sendOTPCode();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050505] flex items-center justify-center p-4">
      {/* Visual background atmospheric elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-amber-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-zinc-900/40 rounded-full blur-[150px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-[#0D0D0D] border border-zinc-900 p-8 rounded shadow-2xl relative"
      >
        {/* Glowing safety line */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full items-center justify-center mb-4">
            <Shield size={22} className={loading && !success ? "animate-pulse" : ""} />
          </div>
          <h2 className="text-xl font-black uppercase tracking-widest text-white italic">
            NODE IDENTITY CHALLENGE
          </h2>
          <p className="text-zinc-500 text-[10px] font-mono tracking-wider mt-1.5 uppercase">
            RE-AUTHENTICATIVE CREDENTIAL MATCH PROTOCOL
          </p>
        </div>

        {/* Current target email index */}
        <div className="mb-6 p-4 bg-zinc-950 border border-zinc-900 rounded flex items-center gap-3">
          <Mail className="text-amber-500 shrink-0" size={16} />
          <div className="min-w-0 flex-1">
            <span className="block text-[9px] uppercase font-mono tracking-widest text-zinc-500">Registered Coordinator</span>
            <span className="block text-xs text-zinc-300 font-mono font-bold truncate">{email}</span>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 bg-red-500/10 border border-red-500/20 p-3 rounded flex items-center gap-2.5 text-red-500 text-xs font-mono"
          >
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded flex items-center gap-2.5 text-emerald-500 text-xs font-mono"
          >
            <CheckCircle2 size={14} className="shrink-0 animate-bounce" />
            <span>Identity verified successfully. Synchronizing faction nodes...</span>
          </motion.div>
        )}

        {/* 6 Digit Square passcodes */}
        <div className="space-y-4">
          <div className="text-center">
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Enter 6-Digit Passphrase Coordinates
            </label>
          </div>
          <div className="flex justify-between gap-2.5" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                maxLength={1}
                inputMode="numeric"
                pattern="[0-9]*"
                value={digit}
                onChange={(e) => handleDigitChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                disabled={loading || success}
                className={`w-12 h-14 bg-[#121212] border rounded text-center text-xl font-mono font-bold text-white transition-all focus:outline-none ${
                  success 
                    ? 'border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.3)] text-emerald-400'
                    : digit
                      ? 'border-amber-500/50 text-amber-400'
                      : 'border-zinc-850 hover:border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono select-none">
          {/* countdown / resend option */}
          <button
            onClick={handleResend}
            disabled={countdown > 0 || loading || success}
            className={`text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5 py-1.5 focus:outline-none transition-all ${
              countdown > 0 || loading || success
                ? 'text-zinc-600 cursor-not-allowed'
                : 'text-amber-500 hover:text-amber-400 cursor-pointer'
            }`}
          >
            <RefreshCw size={12} className={loading && countdown === 0 ? "animate-spin" : ""} />
            {countdown > 0 ? `RESEND DECRYPTION LEVEL IN ${countdown}S` : 'RESEND CODE PIN'}
          </button>

          {/* cancel sign out option */}
          <button
            onClick={onCancel}
            disabled={loading || success}
            className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 py-1.5 focus:outline-none"
          >
            <LogOut size={12} />
            ABORT SECURE LOGIN
          </button>
        </div>

        {/* Developer access assist box */}
        {devCode && !success && (
          <div className="mt-8 p-3.5 bg-zinc-950/90 border border-zinc-900 rounded select-text text-center text-[10px] font-mono leading-normal shadow-inner">
            <span className="text-amber-500/80 font-black uppercase tracking-widest block mb-1">
              🛠️ TESTING MATRIX HARNESS
            </span>
            <span className="text-zinc-500 block">
              Simulating mail delivery server: Use passcode below to authorize.
            </span>
            <div className="mt-2.5">
              <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 font-extrabold text-sm px-4 py-1.5 rounded tracking-[0.2em] inline-block font-mono">
                {devCode}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
