import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, HelpCircle, Activity, Key, Globe } from 'lucide-react';
import { verifySignature } from '../lib/signature';

interface SignatureVerifiedBlockProps {
  content: string;
  showSignatureBadgeInline?: boolean;
}

export default function SignatureVerifiedBlock({ content, showSignatureBadgeInline = true }: SignatureVerifiedBlockProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  if (!content) return null;

  // Check if content itself includes the signature tag
  const signatureDetails = verifySignature(content);

  // If there's a signature, we can clean up the displayed paragraph content so that the raw [SIGNATURE...] string 
  // is removed from the standard paragraph body, and instead represented beautifully as a dedicated stylized section.
  let textToDisplay = content;
  let signatureLine = '';

  if (signatureDetails.isValid) {
    const splitIndex = content.indexOf('\n\n[SIGNATURE_VALIDATED:');
    if (splitIndex !== -1) {
      textToDisplay = content.substring(0, splitIndex);
      signatureLine = content.substring(splitIndex).trim();
    } else {
      // Look for any simple pattern
      const match = content.match(/\[SIGNATURE_VALIDATED:[^\]]+\]/i);
      if (match) {
        textToDisplay = content.replace(match[0], '').trim();
        signatureLine = match[0];
      }
    }
  }

  return (
    <div className="relative group/sig flex flex-col gap-2 w-full">
      {/* Body Content */}
      <div className="relative leading-relaxed">
        {textToDisplay}

        {/* Small Identity Verification checkmark badge next to the text block if signature is valid */}
        {signatureDetails.isValid && showSignatureBadgeInline && (
          <span className="inline-flex items-center ml-2 select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-black uppercase cursor-help tracking-wider shadow-[0_0_12px_rgba(16,185,129,0.15)] hover:bg-emerald-500/20 transition-all duration-200"
            >
              <ShieldCheck size={11} className="text-emerald-400 animate-pulse" />
              <span>[VERIFIED: AUTHENTICATED_ARCHITECT]</span>
            </motion.div>
          </span>
        )}
      </div>

      {/* Stylized custom Signature block with glowing lore, displayed at the bottom of the verified text block */}
      {signatureDetails.isValid && signatureLine && (
        <div 
          className="mt-4 p-4 rounded-xl bg-zinc-950/90 border border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02),0_0_20px_rgba(16,185,129,0.03)] hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {/* Neon circuit decorative background effect */}
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 font-mono text-[10px]">
            <div className="space-y-1">
              <span className="text-[8px] text-emerald-500/60 font-black tracking-widest uppercase block">
                ▲ CENTRAL COMMAND DIGITAL SEAL
              </span>
              <p className="font-bold text-emerald-400 tracking-wider font-mono text-xs select-all break-all glow-seal">
                {signatureLine}
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="px-2 py-0.5 bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-[8px] rounded uppercase font-black">
                STABLE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cyber-tooltip reveal over signature details on hover */}
      <AnimatePresence>
        {showTooltip && signatureDetails.isValid && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 left-2 bottom-full mb-2 max-w-sm w-80 p-4 bg-zinc-950 border border-emerald-500/40 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.15)] text-gray-300 font-mono text-[10px] space-y-3 pointer-events-none"
            style={{
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 0 30px rgba(16,185,129,0.1)'
            }}
          >
            {/* Tooltip Header */}
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Key size={12} className="text-emerald-400" />
              <span className="font-black uppercase tracking-wider text-white">DIGITAL SIGNATURE SECURE PROTOCOL</span>
            </div>

            {/* Tooltip Metadata Table */}
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase">ARCHITECT:</span>
                <span className="text-emerald-400 font-bold">{signatureDetails.architectName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase">ARCHITECT ID:</span>
                <span className="text-white">{signatureDetails.architectId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase">VALIDATION HASH:</span>
                <span className="text-slate-300 font-bold selection:bg-emerald-500">{signatureDetails.hash}</span>
              </div>
              <div className="flex flex-col pt-1 border-t border-white/5 mt-2 gap-1">
                <div className="text-gray-500 uppercase">TIMESTAMP SECURE RECORD:</div>
                <div className="text-emerald-300 bg-emerald-950/20 p-1.5 border border-emerald-500/10 rounded tracking-tight text-[8.5px]">
                  {signatureDetails.timestamp}
                </div>
              </div>
              <div className="flex justify-between items-center pt-1 mt-1 font-bold">
                <span className="text-gray-500 uppercase">STATUS:</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Activity size={10} className="animate-pulse" />
                  {signatureDetails.status}
                </span>
              </div>
            </div>

            {/* Glowing bottom edge line */}
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
