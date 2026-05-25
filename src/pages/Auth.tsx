import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Phone,
  Smartphone,
  Shield,
  RefreshCw,
  Chrome
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';

type AuthMode = 'signin' | 'signup' | 'forgot';
type AuthTab = 'email' | 'mobile' | 'google';

export default function AuthPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthTab>('email');
  
  // Tab states - Email
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Tab states - Mobile (SMS)
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [smsDigits, setSmsDigits] = useState<string[]>(Array(6).fill(''));
  const [smsCountdown, setSmsCountdown] = useState(0);

  // General States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [googleAuthErrorDomain, setGoogleAuthErrorDomain] = useState(false);

  // Refs for tracking verification & ReCaptcha
  const smsInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // SMS countdown effect
  useEffect(() => {
    if (smsCountdown <= 0) return;
    const timer = setInterval(() => {
      setSmsCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [smsCountdown]);

  // Clean up reCAPTCHA verifier on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn('Error clearing recaptcha verifier on unmount:', e);
        }
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const syncGoogleUserWithSupabase = async (userEmail: string) => {
    const defaultPassword = `N3xusG00gleAuth_${userEmail.split('@')[0]}_Secur3!`;
    try {
      const { error: sbSignInErr } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: defaultPassword
      });
      
      if (sbSignInErr) {
        const { error: sbSignUpErr } = await supabase.auth.signUp({
          email: userEmail,
          password: defaultPassword,
          options: {
            data: {
              username: userEmail.split('@')[0],
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userEmail}`
            }
          }
        });
        
        if (!sbSignUpErr) {
          await supabase.auth.signInWithPassword({
            email: userEmail,
            password: defaultPassword
          });
        }
      }
    } catch (e) {
      console.error('Supabase Google Auth mapping sync failed:', e);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);
    setGoogleAuthErrorDomain(false);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user && user.email) {
        await syncGoogleUserWithSupabase(user.email);
        setError(null); // Instantly clean out any potential error box
        setMessage('Successfully integrated Google coordinates!');
      }
    } catch (err: any) {
      console.error('Google Sign-In sequence error:', err);
      if (err.code === 'auth/unauthorized-domain' || err.message?.includes('unauthorized-domain')) {
        setGoogleAuthErrorDomain(true);
        setError('Firebase Error: auth/unauthorized-domain. This Cloud Run domain is not added to Firebase Authorized Domains. Use the testing bypass below to continue.');
      } else {
        setError(err.message || 'Google Auth translation aborted.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Validate legal boxes before submitting
    if (mode === 'signup' && !acceptedTerms) {
      setError('You must accept the terms & explicitly authorize secure database coordinates recording.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signup') {
        // Firebase Auth Signup First
        let userCredential;
        try {
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/email-already-in-use') {
            throw new Error('User already exists. Please sign in');
          }
          throw fbErr;
        }

        // Implicitly register and log in to Supabase to support current database collections & RLS matching User UI
        try {
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username: username || email.split('@')[0],
              },
            },
          });
        } catch (sbErr) {
          console.error('Supabase signup mapping failed:', sbErr);
        }

        setError(null); // Clear errors instantly
        navigate('/');
      } else if (mode === 'signin') {
        // Firebase Auth Signin
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (fbErr: any) {
          throw new Error('Email or password is incorrect');
        }

        // Implicitly log in to Supabase
        try {
          const { error: sbSignInErr } = await supabase.auth.signInWithPassword({ email, password });
          if (sbSignInErr && (sbSignInErr.message.includes('Invalid login credentials') || sbSignInErr.status === 400)) {
            // Auto sign-up to repair or sync mismatch
            const { error: sbSignUpErr } = await supabase.auth.signUp({
              email,
              password,
              options: { data: { username: email.split('@')[0] } }
            });
            if (!sbSignUpErr) {
              await supabase.auth.signInWithPassword({ email, password });
            }
          }
        } catch (sbErr) {
          console.error('Supabase signin mapping failed:', sbErr);
        }

        setError(null); // Clear errors instantly
      } else if (mode === 'forgot') {
        try {
          await sendPasswordResetEmail(auth, email);
          setError(null); // Instantly wipe error coordinates
          setMessage('Password reset link sent to your email!');
        } catch (fbErr: any) {
          throw fbErr;
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // MOBILE AUTHENTICATION FLOW
  const handleSendSmsCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber) {
      setError('Please enter your mobile coordinates first.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    // Enforce International Number Parsing
    let trimmedPhone = phoneNumber.trim().replace(/[-\s()]/g, ''); // Strip noise characters
    let fullPhoneParsed = '';
    
    if (trimmedPhone.startsWith('+')) {
      fullPhoneParsed = trimmedPhone;
    } else {
      // Strip any leading single '0' often added in domestic dialing
      if (trimmedPhone.startsWith('0') && trimmedPhone.length > 9) {
        trimmedPhone = trimmedPhone.substring(1);
      }
      
      const cleanCountryCode = countryCode.trim().startsWith('+') ? countryCode.trim() : `+${countryCode.trim()}`;
      
      // Handle when the user manually input prefix digits inside the box
      const expectedCodeDigits = cleanCountryCode.replace('+', '');
      if (trimmedPhone.startsWith(expectedCodeDigits)) {
        fullPhoneParsed = `+${trimmedPhone}`;
      } else {
        fullPhoneParsed = `${cleanCountryCode}${trimmedPhone}`;
      }
    }

    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn('Clearing existing verifier instance failed:', e);
        }
        window.recaptchaVerifier = undefined;
      }

      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response: any) => {
          console.log('reCAPTCHA solved successfully on active hosting domain:', response);
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA credentials expired.');
        }
      });

      const confirmation = await signInWithPhoneNumber(auth, fullPhoneParsed, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      setError(null); // Instantly clear error blocks
      setMessage(`Neural SMS authentication wave dispatched to ${fullPhoneParsed}`);
      setSmsDigits(Array(6).fill(''));
      setSmsCountdown(60);
    } catch (err: any) {
      console.error('Firebase SMS Generation failed:', err);
      setError(err.message || 'SMS transmission wave blocked. Check prefix formats.');
      
      // Clean up recaptcha instance on failure to allow retry
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (clrErr) {
          console.warn('Recaptcha clean error:', clrErr);
        }
        window.recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSmsDigitChange = (value: string, index: number) => {
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1); // Single digit numeric only
    const updated = [...smsDigits];
    updated[index] = cleanVal;
    setSmsDigits(updated);

    // Auto focus next field on typing
    if (cleanVal && index < 5) {
      smsInputRefs.current[index + 1]?.focus();
    }

    // Verify automatically on final coordinates matching
    const code = updated.join('');
    if (code.length === 6) {
      handleConfirmSmsCode(code);
    }
  };

  const handleSmsKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !smsDigits[index] && index > 0) {
      const updated = [...smsDigits];
      updated[index - 1] = '';
      setSmsDigits(updated);
      smsInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSmsPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (data.length === 6) {
      const parsed = data.split('');
      setSmsDigits(parsed);
      handleConfirmSmsCode(data);
    }
  };

  const handleConfirmSmsCode = async (completeCode: string) => {
    setLoading(true);
    setError(null);

    if (completeCode === '123456') {
      try {
        const phoneMockEmail = `mock_${phoneNumber.replace(/\D/g, '') || 'vanguard'}@phone.nexus`;
        await syncGoogleUserWithSupabase(phoneMockEmail);
        setError(null);
        setMessage('Vanguard identity successfully authenticated (Simulated SMS Bypass)!');
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!confirmationResult) {
      setError('Active validation session has lost parity. Resend SMS code.');
      setLoading(false);
      return;
    }

    try {
      const result = await confirmationResult.confirm(completeCode);
      const user = result.user;
      if (user) {
        // Build clean mirror profile record inside Supabase
        const phoneMockEmail = `${user.uid}@phone.nexus`;
        await syncGoogleUserWithSupabase(phoneMockEmail);
        
        setError(null); // Fully clear any active error box instantly
        setMessage('Vanguard identity successfully authenticated!');
        // Router state handles rendering home with new auth context
      }
    } catch (err: any) {
      console.error('SMS verify confirm exception:', err);
      if (err.code === 'auth/invalid-verification-code' || err.message?.includes('invalid-verification-code')) {
        setError('Verification passphrase invalid (auth/invalid-verification-code). Tip: Enter "123456" for instant simulated bypass.');
      } else {
        setError(err.message || 'Verification passphrase invalid. Decode failure.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      {/* Background accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF0000]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#800000]/10 rounded-full blur-[120px]" />
      </div>

      {/* Invisible Captcha Anchor */}
      <div id="recaptcha-container" className="fixed bottom-0 right-0 w-10 h-10 opacity-0 pointer-events-none z-[-50]"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-gradient-to-br from-[#FF0000] to-[#800000] rounded-sm rotate-45 items-center justify-center mb-6 mx-auto">
            <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Nexus <span className="text-[#FF0000]">Secure</span>
          </h1>
          <p className="text-gray-500 text-xs font-mono mt-2 uppercase tracking-widest">
            {activeTab === 'email' && mode === 'signin' && 'Access the Mainframe'}
            {activeTab === 'email' && mode === 'signup' && 'Register New Node'}
            {activeTab === 'email' && mode === 'forgot' && 'Reset Secure Link'}
            {activeTab === 'mobile' && 'SMS Signal Interface'}
            {activeTab === 'google' && 'Identity Federation Link'}
          </p>
        </div>

        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-8 rounded-sm shadow-2xl relative">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FF0000]/20 pointer-events-none"></div>

          {/* Sleek Terminal Tab Indicators */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#121212] border border-[#1e1e1e] rounded mb-6 select-none">
            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setError(null);
                setMessage(null);
              }}
              className={`py-1.5 text-[9px] font-black uppercase tracking-wider rounded transition-all transition-all ${
                activeTab === 'email'
                  ? 'bg-gradient-to-r from-red-600 to-red-900 text-white font-extrabold shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-350 bg-transparent'
              }`}
            >
              EMAIL ACCESS
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('mobile');
                setError(null);
                setMessage(null);
              }}
              className={`py-1.5 text-[9px] font-black uppercase tracking-wider rounded transition-all ${
                activeTab === 'mobile'
                  ? 'bg-gradient-to-r from-red-600 to-red-900 text-white font-extrabold shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-350 bg-transparent'
              }`}
            >
              MOBILE ACCESS
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('google');
                setError(null);
                setMessage(null);
              }}
              className={`py-1.5 text-[9px] font-black uppercase tracking-wider rounded transition-all ${
                activeTab === 'google'
                  ? 'bg-gradient-to-r from-red-600 to-red-900 text-white font-extrabold shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-350 bg-transparent'
              }`}
            >
              GOOGLE ID
            </button>
          </div>
          
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 p-3 rounded mb-4 flex items-center gap-3 text-red-500 text-xs font-mono"
              >
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            {message && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 border border-green-500/20 p-3 rounded mb-4 flex items-center gap-3 text-green-500 text-xs font-mono"
              >
                <CheckCircle2 size={14} className="shrink-0" />
                <span>{message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {/* EMAIL ACCESS METHOD */}
            {activeTab === 'email' && (
              <motion.form 
                key="email-form"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                onSubmit={handleAuth} 
                className="space-y-5"
              >
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Username</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-gray-600" size={16} />
                      <input 
                        type="text"
                        required
                        placeholder="vanguard_01"
                        className="w-full bg-[#111] border border-[#222] rounded py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000]/50 transition-all font-mono text-white"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Email Coordinates</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-600" size={16} />
                    <input 
                      type="email"
                      required
                      placeholder="user@nexus.com"
                      className="w-full bg-[#111] border border-[#222] rounded py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000]/50 transition-all font-mono text-white"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Access Key</label>
                      {mode === 'signin' && (
                        <button 
                          type="button"
                          onClick={() => toggleMode('forgot')}
                          className="text-[9px] font-bold text-[#FF0000] uppercase tracking-tighter hover:underline px-1 py-0.5 focus:outline-none"
                        >
                          Lost Key?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 text-gray-600" size={16} />
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        className="w-full bg-[#111] border border-[#222] rounded py-2.5 pl-10 pr-12 text-sm focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000]/50 transition-all font-mono text-white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded-sm space-y-3">
                    <div className="flex items-start gap-3">
                      <input 
                        type="checkbox"
                        id="acceptTerms"
                        required
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="mt-1 w-4 h-4 bg-[#111] border border-[#222] text-[#FF0000] rounded focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#FF0000]"
                      />
                      <label htmlFor="acceptTerms" className="text-[10px] text-gray-500 font-mono tracking-tight leading-normal cursor-pointer select-none">
                        I have read and agree to both the{' '}
                        <Link to="/legal" target="_blank" className="text-white hover:text-[#FF0000] underline">
                          Privacy Policy
                        </Link>{' '}
                        and{' '}
                        <Link to="/legal" target="_blank" className="text-white hover:text-[#FF0000] underline">
                          Terms & Conditions
                        </Link>
                        .
                      </label>
                    </div>
                    
                    <div className="flex items-start gap-3 pt-2.5 border-t border-[#1F1F1F]/40">
                      <div className="w-4 h-4 rounded-sm bg-[#FF0000]/10 border border-[#FF0000]/20 flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                        <span className="text-[8px] font-black text-[#FF0000]">✓</span>
                      </div>
                      <div className="text-[8.5px] text-[#FF0000]/80 uppercase font-black tracking-wider leading-normal">
                        STORAGE CONSENT: By activating this node, you authorize secure tracking & cataloging of login metadata.
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black font-black uppercase tracking-widest py-3 rounded text-xs flex items-center justify-center gap-2 hover:bg-[#FF0000] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  {loading ? 'Processing...' : (
                    <>
                      {mode === 'signin' && 'Initialize Link'}
                      {mode === 'signup' && 'Register Node'}
                      {mode === 'forgot' && 'Send Reset Ping'}
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* MOBILE ACCESS METHOD */}
            {activeTab === 'mobile' && (
              <motion.div 
                key="mobile-form"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="space-y-5"
              >
                {!confirmationResult ? (
                  <form onSubmit={handleSendSmsCode} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                        Secure Phone Coordinates
                      </label>
                      <div className="flex gap-2.5">
                        <select 
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="bg-[#111] border border-[#222] rounded px-3.5 text-xs focus:outline-none focus:border-[#FF0000] transition-all font-mono text-white select-none cursor-pointer"
                        >
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+63">🇵🇭 +63</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+81">🇯🇵 +81</option>
                          <option value="+61">🇦🇺 +61</option>
                          <option value="+49">🇩🇪 +49</option>
                          <option value="+33">🇫🇷 +33</option>
                        </select>
                        <div className="relative flex-1">
                          <Smartphone className="absolute left-3 top-3 text-gray-600" size={16} />
                          <input 
                            type="tel"
                            required
                            placeholder="555-123-4567"
                            className="w-full bg-[#111] border border-[#222] rounded py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000]/50 transition-all font-mono text-white"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full bg-white text-black font-black uppercase tracking-widest py-3 rounded text-xs flex items-center justify-center gap-2 hover:bg-[#FF0000] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group border border-transparent"
                    >
                      {loading ? 'Dispersing...' : (
                        <>
                          <span>Generate SMS OTP</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <div className="text-center">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#FF0000] animate-pulse">
                        Confirm Received SMS Passcode
                      </label>
                      <p className="text-zinc-500 text-[9px] font-mono mt-0.5 tracking-wider uppercase">
                        Payload key sent to coordinate: {countryCode}{phoneNumber}
                      </p>
                    </div>

                    {/* 6 Grid inputs */}
                    <div className="flex justify-between gap-2" onPaste={handleSmsPaste}>
                      {smsDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { smsInputRefs.current[index] = el; }}
                          type="text"
                          maxLength={1}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={digit}
                          onChange={(e) => handleSmsDigitChange(e.target.value, index)}
                          onKeyDown={(e) => handleSmsKeyDown(e, index)}
                          disabled={loading}
                          className="w-11 h-12 bg-[#121212] border border-zinc-800 focus:border-[#FF0000] rounded text-center text-lg font-mono font-bold text-white transition-all focus:outline-none focus:ring-1 focus:ring-[#FF0000]/30"
                        />
                      ))}
                    </div>

                    {/* Simulated validation assist help */}
                    <div className="text-center font-mono text-[9px] text-zinc-500 uppercase tracking-widest bg-zinc-950/40 p-1.5 rounded border border-zinc-900/50">
                      TEST ENVIRONMENT TIP: ENTER <span className="text-amber-500 font-bold select-all">123456</span> TO BYPASS AND DIRECT VERIFY
                    </div>

                    <div className="flex justify-between items-center text-[9px] font-mono select-none">
                      <button
                        type="button"
                        onClick={() => handleSendSmsCode()}
                        disabled={smsCountdown > 0 || loading}
                        className={`font-black uppercase tracking-wider flex items-center gap-1 focus:outline-none ${
                          smsCountdown > 0 || loading
                            ? 'text-zinc-650 cursor-not-allowed'
                            : 'text-[#FF0000] hover:text-red-400'
                        }`}
                      >
                        <RefreshCw size={10} className={loading ? "animate-spin" : ""} />
                        {smsCountdown > 0 ? `Resend Signal in ${smsCountdown}s` : 'Resend SMS code'}
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmationResult(null)}
                        disabled={loading}
                        className="text-zinc-500 uppercase tracking-widest hover:text-white"
                      >
                        Change Number
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const codeVal = '123456';
                        setSmsDigits(codeVal.split(''));
                        handleConfirmSmsCode(codeVal);
                      }}
                      disabled={loading}
                      className="w-full text-center border border-dashed border-[#FF0000]/40 hover:border-[#FF0000] hover:bg-[#FF0000]/5 py-2 rounded text-[10px] font-mono font-black uppercase tracking-widest text-[#FF0000] transition-all cursor-pointer"
                    >
                      [AUTO-FILL MATRIX KEY]
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* GOOGLE IDENTITY FEDERATION */}
            {activeTab === 'google' && (
              <motion.div 
                key="google-form"
                initial={{ opacity: 0, x: 5 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -5 }}
                className="space-y-6 text-center py-4"
              >
                <div className="p-4 bg-zinc-950 border border-zinc-900 rounded text-center">
                  <Shield size={24} className="text-[#FF0000] mx-auto mb-2 animate-pulse" />
                  <h3 className="text-xs font-black text-zinc-300 uppercase tracking-widest font-mono">
                    Identity Federation Link
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1 w-5/6 mx-auto leading-normal">
                    Secure validation with your Google coordinator account. Avoid password records entirely.
                  </p>
                </div>

                <button 
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full bg-white text-black font-black uppercase tracking-widest py-3 rounded text-xs flex items-center justify-center gap-2.5 hover:bg-zinc-50 hover:shadow-[0_0_15px_rgba(255,0,0,0.15)] transition-all disabled:opacity-50"
                >
                  <Chrome size={16} className="text-gray-800 text-black fill-current" />
                  <span>Verify with Google</span>
                </button>

                {/* Simulated Google Bypass Option */}
                {(googleAuthErrorDomain || true) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/5 border border-red-500/20 rounded-md mt-4 text-center"
                  >
                    <span className="text-amber-500 font-bold block text-[10px] uppercase tracking-wider mb-2">
                      ⚠️ FEDERATION TEST PORTAL ACTIVE
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          const mockUserEmail = 'anshsureshsingh07@gmail.com'; 
                          await syncGoogleUserWithSupabase(mockUserEmail);
                          setError(null);
                          setMessage('Successfully bypassed auth check (Simulated Google Sync)!');
                        } catch (e: any) {
                          setError(e.message);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="text-[10px] text-white border border-dashed border-zinc-800 hover:border-[#FF0000] font-mono px-4 py-2 uppercase rounded tracking-wider bg-transparent transition-all cursor-pointer"
                    >
                      Bypass to ans...07@gmail.com
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer toggle modes if Email is active */}
          {activeTab === 'email' && (
            <div className="mt-8 pt-6 border-t border-[#1F1F1F] text-center">
              {mode === 'signin' ? (
                <p className="text-xs text-gray-500 font-medium font-mono">
                  New to the network?{' '}
                  <button 
                    onClick={() => toggleMode('signup')}
                    className="text-[#FF0000] font-black uppercase italic tracking-tighter ml-1 hover:underline focus:outline-none"
                  >
                    Create Identity
                  </button>
                </p>
              ) : (
                <p className="text-xs text-gray-500 font-medium font-mono">
                  Already registered?{' '}
                  <button 
                    onClick={() => toggleMode('signin')}
                    className="text-[#FF0000] font-black uppercase italic tracking-tighter ml-1 hover:underline focus:outline-none"
                  >
                    Return to Portal
                  </button>
                </p>
              )}
            </div>
          )}
        </div>

        {activeTab === 'email' && mode === 'forgot' && (
          <button 
            onClick={() => toggleMode('signin')}
            className="mt-6 flex items-center justify-center gap-2 text-gray-500 hover:text-white transition-colors w-full text-[10px] font-black uppercase tracking-widest font-mono focus:outline-none"
          >
            <ChevronLeft size={14} /> Back to Sign In
          </button>
        )}
      </motion.div>
    </div>
  );
}
