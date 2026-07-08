import { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, FileText, CheckCircle, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  return (
    <div className="min-h-screen bg-[#050505] text-gray-300 p-6 md:p-12 relative">
      {/* Background accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#FF0000]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#800000]/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8">
          <Link 
            to="/auth" 
            className="inline-flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white uppercase tracking-widest transition-colors mb-6"
          >
            <ChevronLeft size={12} /> Back to Portal
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="text-[#FF0000]" size={28} />
            <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">
              NEXUS <span className="text-[#FF0000]">LEGAL COMPLIANCE</span>
            </h1>
          </div>
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest pl-1">
            Official System Directives & Security Disclosures
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-[#1F1F1F] mb-8">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'privacy' 
                ? 'border-[#FF0000] text-white bg-white/[0.02]' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Lock size={12} /> Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-6 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'terms' 
                ? 'border-[#FF0000] text-white bg-white/[0.02]' 
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <FileText size={12} /> Terms & Conditions
          </button>
        </div>

        {/* content box */}
        <div className="bg-[#0A0A0A] border border-[#1F1F1F] p-8 rounded-sm relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#FF0000]/20 pointer-events-none" />

          {activeTab === 'privacy' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-xs leading-relaxed"
            >
              <div className="text-center pb-4 border-b border-white/5">
                <span className="inline-block py-1 px-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[9px] uppercase tracking-widest rounded-full mb-2">
                  🔥 Anime Int Official Privacy Policy
                </span>
                <p className="text-gray-400 font-mono text-xs">
                  We respect your privacy more than anime fans respect spoiler warnings.
                </p>
                
                <div className="flex flex-wrap justify-center gap-2 mt-3 font-mono text-[9px] uppercase text-red-500">
                  <span className="bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded-full">🍪 We collect cookies, not Devil Fruits</span>
                  <span className="bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded-full">🔒 Your data isn&apos;t our villain arc</span>
                  <span className="bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded-full">📺 We track trends, not your situationship</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">📜 Introduction</h3>
                    <p className="text-gray-400">Welcome to Anime Int. We provide anime news, leaks, updates, and reviews. This document explains privacy indices.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">Congratulations. You are one of the 3 people on the internet who actually opened a Privacy Policy.</p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">👀 Information We Collect</h3>
                    <p className="text-gray-400">Email address, device logs, browser details, and anonymous usage telemetry statistics.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">We do NOT collect your mom&apos;s credit card, secret anime folder, or waifu rankings.</p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">🔥 Why We Collect It</h3>
                    <p className="text-gray-400">To maintain security syncs, identify server bugs, and analyze popular ongoing categories.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">We know which anime is trending. We do NOT know why you watch 14 seasons in one weekend.</p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">🍪 Cookies</h3>
                    <p className="text-gray-400">We cookie active browser states to lock in dark theme parameters and index active nodes.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">Sadly these are browser cookies. We cannot eat them. If they were edible, we&apos;d run a bakery.</p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">🛡️ Security</h3>
                    <p className="text-gray-400">We utilize environment lock keys and secure role protocols to protect email logs.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">Our database security isn&apos;t Gojo&apos;s Infinity, but we&apos;re trying our best.</p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">⚡ Your Rights</h3>
                    <p className="text-gray-400">Request your registered logs dump, request corrections, or purge/erase your node entirely.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">You&apos;re the main character of your data. We&apos;re just an NPC explaining the rules.</p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">🤝 Third-Party Services</h3>
                    <p className="text-gray-400">Some components map standard Firebase Analytics with secure, isolated keys.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">If another platform does something weird, that is their filler arc, not ours.</p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">📩 Contact Us</h3>
                    <p className="text-gray-400">Found typos during procrastination? Contact support anytime to align parameters.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">We reply faster than anime protagonists realize they are overpowered.</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 text-xs leading-relaxed"
            >
              <div className="text-center pb-4 border-b border-white/5">
                <span className="inline-block py-1 px-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[9px] uppercase tracking-widest rounded-full mb-2">
                  📜 Anime Int Official Terms of Service
                </span>
                <p className="text-gray-400 font-mono text-xs">
                  By using Anime Int, you agree to these terms. Don&apos;t worry, this isn&apos;t an isekai contract.
                </p>
                
                <div className="flex flex-wrap justify-center gap-2 mt-3 font-mono text-[9px] uppercase text-red-500">
                  <span className="bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded-full">⚔️ No Villain Arcs</span>
                  <span className="bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded-full">🚫 No Spoiler Warfare</span>
                  <span className="bg-red-500/5 border border-red-500/10 px-2 py-0.5 rounded-full">🍜 Touch Grass Occasionally</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">🎌 Welcome, Otaku</h3>
                    <p className="text-gray-400">By accessing this application, you agree to cooperate respectfully and not ignite chaos layers.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">If you&apos;re looking for an ancient cursed contract that steals your soul, wrong website.</p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">👤 User Behavior</h3>
                    <p className="text-gray-400">Be respectful. Don&apos;t harass, spam, or abuse. Maintain positive constructive guidelines.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">Legally speaking, you are NOT Naruto, Gojo, Luffy, Goku, Eren, or Sung Jinwoo.</p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">🚫 Things You Must Not Do</h3>
                    <p className="text-gray-400">No hacking, cracking server indices, injecting bots, or stealing assets layout files.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">Any attempt to become the final boss will result in immediate defeat.</p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">📺 Anime Opinions</h3>
                    <p className="text-gray-400">Differences in faction opinion or ongoing lists are fully anticipated and respected.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">Note: Calling someone a clown because of their fav anime is not constructive critique.</p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">⚠️ Spoilers</h3>
                    <p className="text-gray-400">Always tag leaks or manga panels appropriately. Keep community feeds safe from spoilers.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">Posting spoilers without warning triggers instant containment & is a villain origin story.</p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-white uppercase tracking-wider mb-1 text-xs text-red-500">🔨 Account Termination</h3>
                    <p className="text-gray-400">We reserve absolute rights to suspend any registered coordinate node if rules are repeatedly breached.</p>
                  </div>
                  <p className="text-zinc-500 font-mono text-[9.5px] mt-2 pt-2 border-t border-[#1F1F1F] italic">If you unlock the &quot;Most Annoying User&quot; badge, your account will disappear faster than minor side-characters in ep 1.</p>
                </div>
              </div>

              {/* Achievement Box */}
              <div className="mt-4 p-4 border border-red-500/30 bg-red-950/10 rounded flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <div>
                  <span className="font-mono text-[9px] text-zinc-500 block">ACHIEVEMENT REGISTER_CONFIRMED</span>
                  <span className="font-mono text-red-500 font-black text-[10px] uppercase block tracking-wider">📜 &quot;Actually Read The Terms&quot; +500 Respect</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
