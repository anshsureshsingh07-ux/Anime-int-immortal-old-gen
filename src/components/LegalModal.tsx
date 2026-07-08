import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Shield, Lock, FileText, CheckCircle2, Award, 
  HelpCircle, Eye, RefreshCw, Star, Info, Compass
} from 'lucide-react';
import { playDigitalSound } from '../lib/sounds';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSection?: 'terms' | 'privacy';
}

export default function LegalModal({ isOpen, onClose, defaultSection = 'terms' }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(defaultSection);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 40;
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
      playDigitalSound('ping');
    }
  };

  const handleTabChange = (tab: 'terms' | 'privacy') => {
    playDigitalSound('click');
    setActiveTab(tab);
    setHasScrolledToBottom(false);
  };

  const handleClose = () => {
    playDigitalSound('click');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4" id="legal-modal-root">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-md"
          id="legal-backdrop"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-[#070707] border border-red-500/20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.15)] flex flex-col font-sans"
          id="legal-container"
        >
          {/* Cyber accents / glowing overlays */}
          <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-red-900/40 to-transparent" />
          
          <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-red-500/45 pointer-events-none" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-red-500/45 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-red-500/45 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-red-500/45 pointer-events-none" />

          {/* Header */}
          <div className="p-5 md:p-6 border-b border-white/5 bg-zinc-950/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                <Shield className="size-5" />
              </div>
              <div>
                <h2 className="text-sm font-black font-mono tracking-widest text-white uppercase flex items-center gap-2">
                  ANIME INT LEGAL COMPLIANCE <span className="text-red-500 text-[10px] bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded-sm">V2.06</span>
                </h2>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
                  Official System Directives & Humor Disclosures
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="lg:absolute lg:top-5 lg:right-5 w-8 h-8 rounded-full border border-white/5 bg-white/5 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer mr-2 lg:mr-0 align-self-start lg:align-self-auto"
              id="legal-close-btn"
            >
              <X size={14} />
            </button>
          </div>

          {/* Navigation Tab Selector */}
          <div className="flex bg-zinc-950 shadow-inner border-b border-white/5 shrink-0" id="legal-tab-triggers">
            <button
              onClick={() => handleTabChange('privacy')}
              className={`flex-1 py-3 px-4 text-[10px] md:text-xs font-mono font-black uppercase tracking-widest border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'privacy'
                  ? 'border-red-500 text-white bg-white/[0.01]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Lock size={12} className={activeTab === 'privacy' ? 'text-red-500' : ''} />
              Privacy Policy
            </button>
            <button
              onClick={() => handleTabChange('terms')}
              className={`flex-1 py-3 px-4 text-[10px] md:text-xs font-mono font-black uppercase tracking-widest border-b-2 transition-all flex items-center justify-center gap-2 ${
                activeTab === 'terms'
                  ? 'border-red-500 text-white bg-white/[0.01]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <FileText size={12} className={activeTab === 'terms' ? 'text-red-500' : ''} />
              Terms & Conditions
            </button>
          </div>

          {/* Modal Content - Scrollable Form */}
          <div 
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-gradient-to-b from-zinc-950/20 via-black to-zinc-950/20"
            style={{
              scrollBehavior: 'smooth'
            }}
          >
            {activeTab === 'terms' ? (
              <motion.div
                key="terms-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 text-sm text-zinc-300"
              >
                {/* Hero section */}
                <div className="text-center pb-6 border-b border-white/5">
                  <span className="inline-block py-1.5 px-3 bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[9px] uppercase tracking-widest rounded-full mb-3">
                    📜 Anime Int Official Terms & Conditions
                  </span>
                  <h3 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tight">
                    Terms & Conditions
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-xl mx-auto mt-2 font-medium">
                    By using Anime Int, you agree to these terms. Don&apos;t worry, this isn&apos;t a hidden isekai contract.
                  </p>
                  
                  {/* Floating Tags */}
                  <div className="flex flex-wrap justify-center gap-2 mt-4 text-[10px] font-mono uppercase font-black text-xs">
                    <span className="bg-red-500/5 border border-red-500/10 px-2.5 py-1 rounded-full text-red-500">
                      ⚔️ No Villain Arcs
                    </span>
                    <span className="bg-red-500/5 border border-red-500/10 px-2.5 py-1 rounded-full text-red-500">
                      🚫 No Spoiler Warfare
                    </span>
                    <span className="bg-red-500/5 border border-red-500/10 px-2.5 py-1 rounded-full text-red-500">
                      🍜 Touch Grass Occasionally
                    </span>
                  </div>
                </div>

                {/* Content Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        🎌 Welcome, Otaku
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        By accessing Anime Int, you agree to follow these terms, behave respectfully, and not cause chaos.
                      </p>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      If you&apos;re looking for an ancient cursed contract that steals your soul, wrong website.
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        👤 User Behavior
                      </h4>
                      <ul className="text-xs text-zinc-400 list-disc pl-4 space-y-1">
                        <li>Be respectful.</li>
                        <li>Don&apos;t harass others.</li>
                        <li>Don&apos;t spam or abuse the platform.</li>
                        <li>Don&apos;t pretend to be an anime character.</li>
                      </ul>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      Legally speaking, you are not Naruto, Gojo, Luffy, Goku, Eren, or Sung Jinwoo.
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        🚫 Things You Must Not Do
                      </h4>
                      <ul className="text-xs text-zinc-400 list-disc pl-4 space-y-1">
                        <li>Hack or exploit the website.</li>
                        <li>Upload malware or keyloggers.</li>
                        <li>Steal or copy-paste core layouts.</li>
                        <li>Attempt world domination.</li>
                        <li>Summon ancient demons in comment blocks.</li>
                      </ul>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      Any attempt to become the final boss will result in immediate defeat.
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        📺 Anime Opinions
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Users may have completely different opinions regarding anime releases, factions, rankings, and sub vs dub formats.
                      </p>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg space-y-1">
                      <div>Calling someone a clown because they like a different anime is not constructive criticism.</div>
                      <div className="text-red-400/80 mt-1">Note: The staff cannot solve Gojo vs Sukuna, Goku vs Saitama, or Sub vs Dub.</div>
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        ⚠️ Spoilers
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Be highly considerate when discussing manga, leaks, or novel details from unreleased seasons.
                      </p>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      Posting spoilers without warning triggers instant containment & is considered a villain origin story.
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        📢 Content Ownership
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Anime Int owns its original layout code and archives. Anime references, images, and tracks belong to creators.
                      </p>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      Copy-pasting our entire website structure is called theft, not inspirational protocol.
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        🔨 Account Termination
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        We reserve absolute rights to suspend or terminate keys of nodes that persistently mock safety rules.
                      </p>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      If you unlock the &quot;Most Annoying User&quot; achievement, your node will disappear faster than minor side-characters in episode one.
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        🔄 Updates to Terms
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Dynamic parameter upgrades happen automatically. Review this compliance window periodically.
                      </p>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      Character development happens. System developments happen too.
                    </div>
                  </div>

                </div>

                {/* Final Boss / Achievement box */}
                <div className="border border-red-500/30 bg-red-950/10 rounded-2xl p-6 text-center space-y-4">
                  <div className="inline-flex w-12 h-12 bg-red-500/20 rounded-full border border-red-500/40 items-center justify-center text-red-500 mb-1">
                    <Award className="size-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-mono font-black uppercase text-red-400 tracking-widest">
                      🏁 FINAL BOSS CLASS PROTOCOL
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-lg mx-auto">
                      By continuing to operate Anime Int nodes, you acknowledge complete absolute synchronization with these terms.
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-950 rounded-xl max-w-md mx-auto border border-red-900/30 text-left">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase pb-2 border-b border-white/5 mb-2 tracking-widest text-center">
                      ACTUAL REAL-TIME COGNITION TELEMETRY
                    </p>
                    <div className="text-zinc-500 font-mono text-[9px] uppercase space-y-1 mb-2">
                      <div>Congratulations. You reached the end of the legal terms index structure.</div>
                      <div className="text-red-400 font-bold">That is literally rarer than finding an anime fan who reads them.</div>
                    </div>

                    <div className="p-3 bg-[#0d0d0d] border border-red-500/30 rounded-lg flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                        <Star size={16} className="animate-spin-slow" />
                      </div>
                      <div>
                        <span className="text-[9px] font-bold font-mono text-red-400 block uppercase tracking-widest">ACHIEVEMENT UNLOCKED</span>
                        <span className="text-red-500 font-mono text-[10px] uppercase font-bold block mt-0.5">📜 &quot;Actually Read The Terms&quot; +500 Respect</span>
                      </div>
                    </div>
                  </div>
                </div>

              </motion.div>
            ) : (
              <motion.div
                key="privacy-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 text-sm text-zinc-300"
              >
                {/* Hero section */}
                <div className="text-center pb-6 border-b border-white/5">
                  <span className="inline-block py-1.5 px-3 bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[9px] uppercase tracking-widest rounded-full mb-3">
                    🔥 Anime Int Official Privacy Policy
                  </span>
                  <h3 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tight">
                    Privacy Policy
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-xl mx-auto mt-2 font-medium">
                    We respect your privacy more than anime fans respect spoiler warnings.
                  </p>
                  
                  {/* Floating Tags */}
                  <div className="flex flex-wrap justify-center gap-2 mt-4 text-[10px] font-mono uppercase font-black">
                    <span className="bg-red-500/5 border border-red-500/10 px-2.5 py-1 rounded-full text-red-500">
                      🍪 We collect cookies, not Devil Fruits
                    </span>
                    <span className="bg-red-500/5 border border-red-500/10 px-2.5 py-1 rounded-full text-red-500">
                      🔒 Your data isn&apos;t our villain arc
                    </span>
                    <span className="bg-red-500/5 border border-red-500/10 px-2.5 py-1 rounded-full text-red-500">
                      📺 We track trends, not your situationship
                    </span>
                  </div>
                </div>

                {/* Content Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        📜 Introduction
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Welcome to Anime Int. We provide anime news, leaks, updates, and releases. This disclosure clarifies how node telemetry is captured.
                      </p>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      Congratulations. You are officially one of the 3 people on the internet who actually opened a Privacy Policy.
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        👀 Information We Collect
                      </h4>
                      <ul className="text-xs text-zinc-400 list-disc pl-4 space-y-1">
                        <li>Email coordinates (if you authenticate)</li>
                        <li>Basic device parameters & browser logs</li>
                        <li>Network telemetry / link logs</li>
                        <li>Anonymous usage statistics</li>
                      </ul>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      We do NOT collect your mom&apos;s credit card, your secret anime folder, or your waifu rankings.
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        🔥 Why We Collect It
                      </h4>
                      <ul className="text-xs text-zinc-400 list-disc pl-4 space-y-1">
                        <li>Fulfill live synchronization routines</li>
                        <li>Deploy patch updates and resolve bugs</li>
                        <li>Filter trending releases & categories</li>
                        <li>Protect databases against rogue hacker entities</li>
                      </ul>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      We know which anime is trending. We do NOT know why you watched 14 seasons in one single weekend.
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        🍪 Cookies
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        We configure standard browser cookies to preserve dark interface mode layouts and secure active session indexes.
                      </p>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      Sadly these are browser cookies. We cannot eat them. If they were edible, we&apos;d run a bakery.
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        🛡️ Security Protocols
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Identity keys are protected using secure environment systems. Administrative sectors require unique passcodes.
                      </p>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      Our database security isn&apos;t Gojo&apos;s Infinity, but we are absolutely trying our best.
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        ⚡ Your Rights
                      </h4>
                      <ul className="text-xs text-zinc-400 list-disc pl-4 space-y-1">
                        <li>Access your security nodes profile dump.</li>
                        <li>Request coordinate log corrections.</li>
                        <li>Request full coordinate block erasure.</li>
                      </ul>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      You&apos;re the main character of your data. We&apos;re just an NPC explaining the rules.
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        🤝 Third-Party Services
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Our nodes deploy reliable metrics APIs like Google Analytics and Firebase systems with strict access conditions.
                      </p>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      If another integration database acts weird, that is their filler arc, not ours.
                    </div>
                  </div>

                  <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-5 hover:border-red-500/20 transition-all flex flex-col justify-between">
                    <div>
                      <h4 className="text-red-400 font-bold font-mono text-xs uppercase tracking-wider flex items-center gap-2 mb-2">
                        <CheckCircle2 size={13} className="text-red-500" />
                        📩 Operational Contact
                      </h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Questions, concerns, or discovered bugs? Reach out anytime using the terminal logs or contact fields.
                      </p>
                    </div>
                    <div className="mt-4 p-3 border-l-3 border-red-500 bg-red-500/5 text-zinc-400 font-mono text-[9px] uppercase leading-normal tracking-wide rounded-r-lg">
                      We reply faster than anime protagonists realize they are insanely overpowered.
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Banner */}
          <div className="p-5 border-t border-white/5 bg-zinc-950 font-mono text-[9px] uppercase text-zinc-600 flex flex-col md:flex-row md:items-center justify-between gap-2 shrink-0">
            <div>
              Anime Int © 2026 // Powered by Anime, Memes & Unlimited Copium.
            </div>
            <div>
              {hasScrolledToBottom ? (
                <span className="text-red-500 font-black animate-pulse flex items-center gap-1.5">
                  <Star size={10} /> DIRECTIVES END POINT COMPRESSED
                </span>
              ) : (
                <span className="text-zinc-600 animate-pulse">
                  Scroll to bottom to register confirmation
                </span>
              )}
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
