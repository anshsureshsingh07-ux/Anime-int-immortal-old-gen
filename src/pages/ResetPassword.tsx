import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, ChevronLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage('Password updated successfully! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative font-mono">
      {/* Background accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF0000]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#800000]/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl z-10"
      >
        <div className="mb-6 text-center">
          <Link 
            to="/auth" 
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 hover:text-[#FF0000] tracking-widest transition-colors mb-4"
          >
            <ChevronLeft size={12} /> Abort Override
          </Link>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
              OVERRIDE <span className="text-[#FF0000]">CREDENTIALS</span>
            </h1>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-1">Re-keying core node access</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-stretch justify-center">
          {/* Left-Aligned Terminal Warning Side-Panel */}
          <div className="w-full md:w-72 border border-white/5 border-l-2 border-l-red-500 bg-red-950/20 p-5 rounded-r-sm flex flex-col justify-between relative overflow-hidden shrink-0 font-mono text-xs uppercase tracking-wider text-neutral-400">
            {/* Cyber Grid element decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
            
            <div className="space-y-4 z-10">
              <div className="flex items-center gap-2 text-red-500 font-black text-[10px] tracking-widest">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                SECURE TRANSCEIVER
              </div>
              <p className="leading-relaxed text-neutral-300">
                [ SYSTEM NOTICE: IF YOU DO NOT RECEIVE THE ACTIVATION SECURITY KEY, PLEASE CHECK YOUR SPAM FOLDER. ]
              </p>
            </div>
            
            <div className="mt-8 pt-4 border-t border-white/5 text-[9px] text-zinc-600 space-y-1 z-10">
              <div>HOST: DARK_NEXUS</div>
              <div>COORDINATES: ENCRYPT_PASS_NODE</div>
              <div>ANTIGRAV SEC_KEY: READY</div>
            </div>
          </div>

          {/* Main Card */}
          <div className="flex-1 max-w-md bg-[#0A0A0A] border border-[#1F1F1F] p-8 rounded-sm shadow-2xl relative overflow-hidden">
            {/* Laser Corner Notch */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FF0000]/30 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white/5 pointer-events-none" />

            <form onSubmit={handleReset} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-sm flex items-start gap-3 text-red-500 text-[10px] tracking-tight leading-normal">
                  <ShieldAlert className="shrink-0 mt-0.5" size={14} />
                  <div>
                    <span className="font-black uppercase block mb-0.5">OVERRIDE FAULT:</span>
                    {error}
                  </div>
                </div>
              )}

              {message && (
                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-sm flex items-start gap-3 text-green-500 text-[10px] tracking-tight leading-normal">
                  <CheckCircle2 className="shrink-0 mt-0.5" size={14} />
                  <div>
                    <span className="font-black uppercase block mb-0.5">AUTHORIZATION SUCCESSFUL:</span>
                    {message}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.22em] text-[#8e9299]">New Mainframe Key</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-3.5 text-zinc-600 transition-colors group-focus-within:text-[#FF0000]" size={15} />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-black/50 border border-white/10 rounded-sm py-3 pl-11 pr-12 text-xs focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] text-white transition-all duration-200 placeholder-zinc-800"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-zinc-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-[0.22em] text-[#8e9299]">Confirm Coordinates</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-zinc-600" size={15} />
                  <input 
                    type="password"
                    required
                    placeholder="••••••••••••"
                    className="w-full bg-black/50 border border-white/10 rounded-sm py-3 pl-11 pr-4 text-xs focus:outline-none focus:border-[#FF0000] focus:ring-1 focus:ring-[#FF0000] text-white transition-all duration-200 placeholder-zinc-800"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-black uppercase tracking-[0.2em] py-3.5 rounded-full text-[10px] flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(220,38,38,0.35)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? 'RE-KEYING IN PROGRESS...' : 'COMMIT OVERRIDE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
