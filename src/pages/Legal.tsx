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
              className="space-y-6 font-mono text-xs leading-relaxed"
            >
              <h2 className="text-base font-black text-white uppercase tracking-wider border-b border-[#1F1F1F] pb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#FF0000] rounded-full" />
                Directive 01-A: Identity File & Privacy Protection
              </h2>

              <p>
                This document defines how information coordinates are indexed, processed, and safeguarded within the Nexus network. By registering a security node identity, you acknowledge compliance with these directives.
              </p>

              <div className="space-y-4">
                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded-sm">
                  <div className="text-[10px] font-black uppercase text-[#FF0000] tracking-widest mb-1.5 flex items-center gap-2">
                    <CheckCircle size={10} /> 1. Storage of Credentials (CRITICAL DISCLOSURE)
                  </div>
                  <p className="text-gray-400">
                    To maintain decentralized database state syncing and multi-auth architecture, the Nexus system securely catalogs and stores security coordinates. Specifically, your Gmail identity (email coordinates) and access passwords are actively held within our database structures in compliant form. Access credentials are used exclusively to process your system actions and state.
                  </p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded-sm">
                  <div className="text-[10px] font-black uppercase text-[#FF0000] tracking-widest mb-1.5 flex items-center gap-2">
                    <CheckCircle size={10} /> 2. Information Collected
                  </div>
                  <p className="text-gray-400">
                    We collect your username, email address, password hashes, action telemetry logs, vote history index, and customizable profile nodes (such as avatars). These are utilized dynamically across index modules to rank active nodes and show public profiles on community trackers.
                  </p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded-sm">
                  <div className="text-[10px] font-black uppercase text-[#FF0000] tracking-widest mb-1.5 flex items-center gap-2">
                    <CheckCircle size={10} /> 3. Data Retention System
                  </div>
                  <p className="text-gray-400">
                    Records remain active within the datastore for the lifetime of your registered identity. You may purge or change customizable variables at any time via the Profile Identity portal.
                  </p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded-sm">
                  <div className="text-[10px] font-black uppercase text-[#FF0000] tracking-widest mb-1.5 flex items-center gap-2">
                    <CheckCircle size={10} /> 4. Encryption & Safeguards
                  </div>
                  <p className="text-gray-400">
                    All authentication records are processed using security integrations under strict rules. Role-based Access Controls (RBAC) ensure normal agents only operate on local feeds, keeping administrative database alterations isolated strictly to authentic admin nodes.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 font-mono text-xs leading-relaxed"
            >
              <h2 className="text-base font-black text-white uppercase tracking-wider border-b border-[#1F1F1F] pb-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#FF0000] rounded-full" />
                Directive 02-B: Node Usage Terms of Agreement
              </h2>

              <p>
                Welcome to Nexus. Operational access to our core systems, community polls, research databases, and administrative trackers is granted subject to total convergence with these terms.
              </p>

              <div className="space-y-4">
                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded-sm">
                  <div className="text-[10px] font-black uppercase text-[#FF0000] tracking-widest mb-1.5 flex items-center gap-2">
                    <CheckCircle size={10} /> 1. Registration Terms
                  </div>
                  <p className="text-gray-400">
                    All nodes are self-registered. When initiating register operations, you are holding absolute custody of your verification coordinates. Do not share your primary mainframe access key with third parties.
                  </p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded-sm">
                  <div className="text-[10px] font-black uppercase text-[#FF0000] tracking-widest mb-1.5 flex items-center gap-2">
                    <CheckCircle size={10} /> 2. Database & Passwords Disclosure
                  </div>
                  <p className="text-gray-400">
                    By confirming signup, you explicitly agree that your registration coordinates—including your email coordinates (Gmail) and specified database passwords—are being fully logged, stored, and compiled for your operational logs. This data is critical for system authentication and mapping.
                  </p>
                </div>

                <div className="bg-white/[0.01] border border-[#1F1F1F] p-4 rounded-sm">
                  <div className="text-[10px] font-black uppercase text-[#FF0000] tracking-widest mb-1.5 flex items-center gap-2">
                    <CheckCircle size={10} /> 3. Network Polls and Database Alterations
                  </div>
                  <p className="text-gray-400">
                    Participating in research surveys (community polls) is fully logged. Multi-voting is denied by coordinate checks. System alterations (modifying release indicators, configuring banner targets) are strictly isolated from standard accounts and restricted to the system root. Mismatching is subject to automatic containment.
                  </p>
                </div>

                <div className="bg-[#FF0000]/5 border border-[#FF0000]/20 p-4 rounded-sm">
                  <div className="text-[10px] font-black uppercase text-[#FF0000] tracking-widest mb-1.5">
                    ⚠️ 4. Disclaimer of Warranty
                  </div>
                  <p className="text-gray-400">
                    The Nexus network is served on an "AS-IS" layout. We reserve absolute rights to terminate database allocations, reset roles, coordinate server parameters, and toggle index listings to secure the ecosystem architecture.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
