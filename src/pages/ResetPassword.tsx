import { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF0000]/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
            Secure <span className="text-[#FF0000]">Override</span>
          </h1>
          <p className="text-gray-500 text-xs font-mono mt-2 uppercase tracking-widest">Update your access key</p>
        </div>

        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-8 rounded-sm shadow-2xl">
          <form onSubmit={handleReset} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded flex items-center gap-3 text-red-500 text-xs font-mono">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded flex items-center gap-3 text-green-500 text-xs font-mono">
                <CheckCircle2 size={14} />
                {message}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">New Access Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-600" size={16} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#111] border border-[#222] rounded py-2.5 pl-10 pr-12 text-sm focus:outline-none focus:border-[#FF0000] font-mono"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-600 hover:text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Confirm Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-600" size={16} />
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#111] border border-[#222] rounded py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF0000] font-mono"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-black uppercase tracking-widest py-3 rounded text-xs flex items-center justify-center gap-2 hover:bg-[#FF0000] hover:text-white transition-all disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Authorize Change'}
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
