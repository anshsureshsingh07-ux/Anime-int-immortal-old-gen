import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Github, 
  AlertCircle,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthMode = 'signin' | 'signup' | 'forgot';

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            },
          },
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      } else if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
        setMessage('Password reset link sent to your email!');
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
                className="w-full bg-transparent border border-[#1F1F1F] text-gray-300 font-bold uppercase tracking-widest py-3 rounded text-[10px] flex items-center justify-center gap-2 hover:bg-white/5 transition-all"
              >
                <Github size={16} />
                Link with Github
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
