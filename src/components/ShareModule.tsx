import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Copy, Check, X, Twitter, MessageSquare, ExternalLink, ShieldCheck } from 'lucide-react';
import { useThemeEngine } from '../context/ThemeEngineContext';
import { playDigitalSound } from '../lib/sounds';

interface ShareModuleProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  customUrl?: string;
}

export default function ShareModule({ isOpen, onClose, title = 'Vanguard Intel', customUrl }: ShareModuleProps) {
  const { addToast } = useThemeEngine();
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Auto-generate URL or fall back to current location
  useEffect(() => {
    if (isOpen) {
      const url = customUrl || window.location.href;
      setShareUrl(url);
    }
  }, [isOpen, customUrl]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      playDigitalSound('ping');
      
      // Trigger user requested toast
      addToast('Data Packet Encrypted & Shared', 'SUCCESS', 'VANGUARD_SEC');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
      addToast('Bypassed uplink error. Clipboard blocked.', 'WARNING', 'UPLINK_ERR');
    }
  };

  const handleTwitterShare = () => {
    playDigitalSound('click');
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`[Vanguard Nexus Log] ${title}`)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    
    // Trigger user requested toast
    addToast('Data Packet Encrypted & Shared', 'SUCCESS', 'VANGUARD_SEC');
  };

  const handleDiscordShare = async () => {
    try {
      playDigitalSound('click');
      // Formats an elite interactive Discord preview format and copy to clipboard
      const discordPayload = `⚔️ **[Vanguard Nexus Archive: ${title.toUpperCase()}]**\n📡 *Secure Terminal Transmission*\n🔗 ${shareUrl}`;
      await navigator.clipboard.writeText(discordPayload);
      
      // Trigger user requested toast
      addToast('Data Packet Encrypted & Shared', 'SUCCESS', 'VANGUARD_SEC');
      
      // Subtle Discord launch helper instruction
      setTimeout(() => {
        window.open('https://discord.com/channels/@me', '_blank', 'noopener,noreferrer');
      }, 500);
    } catch (err) {
      console.error('Discord payload copy failed:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop filter blur with cyber dimming */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm"
          id="share-module-backdrop"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative w-full max-w-lg bg-zinc-950/90 border border-cyan-500/35 rounded-2xl p-6 md:p-8 overflow-hidden backdrop-blur-md shadow-[0_0_30px_rgba(0,255,255,0.2)] text-white"
          id="share-module-modal"
          style={{
            boxShadow: '0 0 30px rgba(0, 255, 255, 0.15), inset 0 0 15px rgba(0, 255, 255, 0.05)'
          }}
        >
          {/* Cybernetic Grid/Line Overlay */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00ffff] to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#00ffff]/30 to-transparent" />
          
          {/* Neon Corner Accents */}
          <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00ffff]" />
          <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00ffff]" />
          <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00ffff]" />
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00ffff]" />

          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#00ffff]/10 border border-[#00ffff]/30 flex items-center justify-center text-[#00ffff] animate-pulse">
                <Share2 size={18} />
              </div>
              <div>
                <h2 className="text-sm font-black font-mono tracking-widest text-[#00ffff] uppercase">
                  NEURAL DATA SHARE
                </h2>
                <span className="text-[9px] font-mono text-gray-500 uppercase block mt-0.5">
                  SECURE_NODE_HUD_V2 // UPLINK GATEWAY
                </span>
              </div>
            </div>
            
            <button
              onClick={() => {
                playDigitalSound('click');
                onClose();
              }}
              className="w-8 h-8 rounded-full border border-white/5 bg-white/5 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer"
              id="share-close-btn"
            >
              <X size={14} />
            </button>
          </div>

          {/* Modal Body & Form */}
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black font-mono text-gray-400 uppercase tracking-widest block mb-2">
                ACTIVE CHRONICLE SOURCE
              </label>
              <div className="bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-xs text-gray-300 font-medium flex items-center justify-between gap-3">
                <span className="truncate">{title}</span>
                <span className="shrink-0 text-[9px] font-mono text-[#00ffff]/80 bg-[#00ffff]/10 px-2 py-0.5 rounded border border-[#00ffff]/15 flex items-center gap-1">
                  <ShieldCheck size={10} /> VERIFIED INTEL
                </span>
              </div>
            </div>

            {/* URL Display and Copy */}
            <div className="space-y-2">
              <label className="text-[10px] font-black font-mono text-gray-400 uppercase tracking-widest block">
                UPLINK SIGNATURE VECTOR
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="w-full bg-black/60 border border-[#00ffff]/20 focus:border-[#00ffff]/60 rounded-xl px-4 py-3 text-xs text-gray-400 outline-none font-mono tracking-tight cursor-default"
                  id="share-url-input"
                />
                
                <button
                  onClick={handleCopyLink}
                  className={`px-5 rounded-xl border font-mono text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer min-w-[120px] ${
                    copied
                    ? 'bg-emerald-600/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                    : 'bg-[#00ffff]/5 border-[#00ffff]/30 text-[#00ffff] hover:bg-[#00ffff]/15 hover:shadow-[0_0_15px_rgba(0,255,255,0.25)]'
                  }`}
                  id="share-copy-vector-btn"
                >
                  {copied ? (
                    <>
                      <Check size={14} className="stroke-[3]" /> COPIED
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> COPY LINK
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Social Channels Options */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-black font-mono text-gray-500 uppercase tracking-widest block text-center">
                CHANNELS OF EXTRAPOLATION
              </span>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Twitter / X */}
                <button
                  onClick={handleTwitterShare}
                  className="bg-black/40 border border-white/5 hover:border-cyan-500/45 hover:bg-cyan-500/5 py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group text-center"
                  id="share-twitter-btn"
                >
                  <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-cyan-500/10 flex items-center justify-center text-gray-400 group-hover:text-[#00ffff] transition-all">
                    <Twitter size={15} />
                  </div>
                  <span className="text-[9px] font-black font-mono uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                    Twitter / X
                  </span>
                </button>

                {/* Discord Payload */}
                <button
                  onClick={handleDiscordShare}
                  className="bg-black/40 border border-white/5 hover:border-cyan-500/45 hover:bg-cyan-500/5 py-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group text-center"
                  id="share-discord-btn"
                >
                  <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-cyan-500/10 flex items-center justify-center text-gray-400 group-hover:text-[#00ffff] transition-all">
                    <MessageSquare size={15} />
                  </div>
                  <span className="text-[9px] font-black font-mono uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
                    Discord Payload
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Footer Telemetry Banner */}
          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-gray-600 uppercase">
            <span>PACKET STATUS: ENCRYPTED // READY</span>
            <span>SECURE_NODE V2.14</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
