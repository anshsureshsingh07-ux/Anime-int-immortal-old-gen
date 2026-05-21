import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ShieldAlert, CheckCircle, RefreshCw, ChevronRight, HelpCircle } from 'lucide-react';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const emailParam = searchParams.get('email') || '';
  
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    // Check user auth state to see if they completed email verification
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          setIsVerified(true);
          setScanning(false);
        }
      }
    });

    // Simulated status poller
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (user) {
        await user.reload();
        if (user.emailVerified) {
          setIsVerified(true);
          setScanning(false);
          clearInterval(interval);
        }
      }
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleResendPing = async () => {
    setResending(true);
    setError(null);
    setMessage(null);
    try {
      const user = auth.currentUser;
      if (user) {
        await sendEmailVerification(user);
        setMessage('A fresh verification link has been dispatched to your email coordinates.');
      } else {
        setError('No active authentication found. Please sign in first so we can transmit the verification key.');
      }
    } catch (err: any) {
      setError(err.message || 'Trouble transmitting verification email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 text-gray-300 font-mono relative">
      {/* Background accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF0000]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#800000]/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl z-10"
      >
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 bg-gradient-to-br from-[#FF0000] to-[#800000] rounded-sm rotate-45 items-center justify-center mb-6 mx-auto animate-pulse">
            <Mail className="rotate-[-45deg] text-white" size={20} />
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">
            IDENTITY <span className="text-[#FF0000]">VERIFICATION</span>
          </h1>
          <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-1">
            Activating Node Coordinates
          </p>
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
              <div>COORDINATES: SECURE_VANGUARD</div>
              <div>ANTIGRAV ACC: ONLINE</div>
            </div>
          </div>

          {/* Main Card */}
          <div className="flex-1 max-w-md bg-[#0A0A0A] border border-[#1F1F1F] p-8 rounded-sm shadow-2xl relative overflow-hidden">
            {/* Decorative Corner */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FF0000]/20 pointer-events-none"></div>

            {isVerified ? (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 scale-up">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  COORDINATES VALIDATED
                </h3>
                <p className="text-xs text-gray-400">
                  Your secure mainframe link is actively verified. Node operational capability has been authorized.
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-white text-black font-black uppercase tracking-widest py-3 rounded text-[10px] flex items-center justify-center gap-2 hover:bg-[#FF0000] hover:text-white transition-all"
                >
                  Access Mainframe <ChevronRight size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border border-[#1F1F1F] bg-white/[0.01] p-4 rounded-sm space-y-3 relative overflow-hidden">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="text-[#FF0000] shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <div className="text-[10px] font-black uppercase text-white tracking-wider">
                        Pending Action: Verify inbox
                      </div>
                      <p className="text-[11px] text-gray-400 leading-normal">
                        We've transmitted a specialized authentication code to:
                      </p>
                      <div className="text-[11px] text-red-500 font-bold break-all">
                        {emailParam || auth.currentUser?.email || "your email coordinates"}
                      </div>
                    </div>
                  </div>

                  {scanning && (
                    <div className="border-t border-[#1F1F1F] pt-3 flex items-center gap-2 text-[9px] text-gray-500 uppercase tracking-widest">
                      <RefreshCw className="animate-spin text-[#FF0000]" size={10} />
                      Broadcasting verification scan...
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3 rounded text-red-500 text-[10px] leading-normal">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="bg-green-500/10 border border-green-500/20 p-3 rounded text-green-500 text-[10px] leading-normal">
                    {message}
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleResendPing}
                    disabled={resending}
                    className="w-full bg-[#111] border border-[#222] hover:border-[#FF0000] text-gray-300 font-bold uppercase tracking-widest py-3 rounded text-[10px] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={resending ? 'animate-spin' : ''} />
                    {resending ? 'Transmitting Key...' : 'Resend Verification Ping'}
                  </button>

                  <div className="text-center pt-2">
                    <Link
                      to="/auth"
                      className="text-[10px] text-gray-500 hover:text-white uppercase font-bold tracking-widest underline decoration-dotted"
                    >
                      Back to Authentication Portal
                    </Link>
                  </div>
                </div>

                <div className="border-t border-[#1F1F1F] pt-4 text-center">
                  <div className="text-[9px] text-gray-600 uppercase flex items-center justify-center gap-1">
                    <HelpCircle size={10} /> Didn't receive coordinates? Check your SPAM box.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
