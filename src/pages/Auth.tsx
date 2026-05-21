import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Link, useNavigate } from 'react-router-dom';

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

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
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (user && user.email) {
        await syncGoogleUserWithSupabase(user.email);
        setMessage('Successfully authenticated with Google!');
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
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

        // Send actual verification code dispatch
        if (userCredential.user) {
          try {
            await sendEmailVerification(userCredential.user);
          } catch (verErr) {
            console.error('Email verification trigger failed:', verErr);
          }
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

        // Redirect to new verification workflow
        navigate(`/auth/verify?email=${encodeURIComponent(email)}`);
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
      } else if (mode === 'forgot') {
        try {
          await sendPasswordResetEmail(auth, email);
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

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 bg-gradient-to-br from-[#FF0000] to-[#800000] rounded-sm rotate-45 items-center justify-center mb-6 mx-auto">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Nexus <span className="text-[#FF0000]">Secure</span>
          </h1>
          <p className="text-gray-500 text-xs font-mono mt-2 uppercase tracking-widest">
            {mode === 'signin' && 'Access the Mainframe'}
            {mode === 'signup' && 'Register New Node'}
            {mode === 'forgot' && 'Reset Secure Link'}
          </p>
        </div>

        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-8 rounded-sm shadow-2xl relative">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FF0000]/20 pointer-events-none"></div>
          
          <AnimatePresence mode="wait">
            <motion.form 
              key={mode}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              onSubmit={handleAuth} 
              className="space-y-5"
            >
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded flex items-center gap-3 text-red-500 text-xs font-mono">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              {message && (
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded flex items-center gap-3 text-green-500 text-xs font-mono">
                  <CheckCircle2 size={14} className="shrink-0" />
                  {message}
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Username</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-600" size={16} />
                    <input 
                      type="text"
                      required
                      placeholder="vanguard_01"
                      className="w-full bg-[#111] border border-[#222] rounded py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000]/50 transition-all font-mono"
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
                    className="w-full bg-[#111] border border-[#222] rounded py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000]/50 transition-all font-mono"
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
                        className="text-[9px] font-bold text-[#FF0000] uppercase tracking-tighter hover:underline"
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
                      className="w-full bg-[#111] border border-[#222] rounded py-2.5 pl-10 pr-12 text-sm focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000]/50 transition-all font-mono"
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
                      STORAGE CONSENT ALERT: By activating this node, you explicitly authorize and understand that we secure, log, and store your email credentials (Gmail indices) and specified keys / passwords in our mainframe systems.
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

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1F1F1F]"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-mono">
                  <span className="bg-[#0A0A0A] px-4 text-gray-600">Alternative Verification</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white text-black font-black uppercase tracking-widest py-3 rounded text-[10px] flex items-center justify-center gap-2 hover:bg-gray-100 transition-all disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.22-.63-.35-1.3-.35-1.98z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                Sign In with Google
              </button>
            </motion.form>
          </AnimatePresence>

          <div className="mt-8 pt-6 border-t border-[#1F1F1F] text-center">
            {mode === 'signin' ? (
              <p className="text-xs text-gray-500 font-medium">
                New to the network?{' '}
                <button 
                  onClick={() => toggleMode('signup')}
                  className="text-[#FF0000] font-black uppercase italic tracking-tighter"
                >
                  Create Identity
                </button>
              </p>
            ) : (
              <p className="text-xs text-gray-500 font-medium">
                Already registered?{' '}
                <button 
                  onClick={() => toggleMode('signin')}
                  className="text-[#FF0000] font-black uppercase italic tracking-tighter"
                >
                  Return to Portal
                </button>
              </p>
            )}
          </div>
        </div>

        {mode === 'forgot' && (
          <button 
            onClick={() => toggleMode('signin')}
            className="mt-6 flex items-center justify-center gap-2 text-gray-500 hover:text-white transition-colors w-full text-[10px] font-black uppercase tracking-widest"
          >
            <ChevronLeft size={14} /> Back to Sign In
          </button>
        )}
      </motion.div>
    </div>
  );
}
