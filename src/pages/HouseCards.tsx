import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Landmark, 
  ShieldCheck, 
  AlertTriangle, 
  Coins, 
  Sparkles, 
  Zap, 
  Activity, 
  Cpu, 
  ArrowRight,
  TrendingUp,
  Award,
  Clock,
  ExternalLink,
  Lock,
  Unlock,
  CheckCircle2,
  LineChart
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { supabase } from '../lib/supabase';

interface HouseDetail {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  feeType: 'premium' | 'standard';
  feeText: string;
  feeAmount: number;
  maintenanceLabel: string;
  accentClass: string;
  glowClass: string;
  borderClass: string;
  bgGradient: string;
  glowRgb: string;
  description: string;
  estFunding: string;
  forceStrength: string;
  securityIntegrity: string;
  historyLogs: string[];
}

const HOUSES_DATA: HouseDetail[] = [
  {
    id: 'saiyans',
    name: 'House Saiyans',
    tagline: 'Surpass your limits!',
    emoji: '⚡',
    feeType: 'premium',
    feeText: '[⚡ ZENKAI POWER TAX: 100,000 XP / CYCLE]',
    feeAmount: 100000,
    maintenanceLabel: 'ZENKAI POWER TAX',
    accentClass: 'text-yellow-400',
    glowClass: 'shadow-[0_0_25px_rgba(250,204,21,0.25)] hover:shadow-[0_0_40px_rgba(250,204,21,0.5)]',
    borderClass: 'border-yellow-400/50 hover:border-yellow-400',
    bgGradient: 'from-[#081024] via-[#030612] to-[#0c183a]',
    glowRgb: '250, 204, 21',
    description: 'Vanguard battle-infrastructure. Funding supports Zenkai-boost operations, gravity chamber power nodes, and planetary secure defense systems.',
    estFunding: '42.5M XP',
    forceStrength: 'SSJ•9,000+',
    securityIntegrity: '99.99%',
    historyLogs: [
      'Gravity reactor level 4 stabilizer active',
      'Power nodes upgraded to Ultra Instinct telemetry',
      'Training cycle 42 synchronized with central mainframe'
    ]
  },
  {
    id: 'targaryen',
    name: 'House Targaryen',
    tagline: 'Fire and Blood.',
    emoji: '🔥',
    feeType: 'premium',
    feeText: '[🔥 PREMIUM MAINTENANCE FEE: 50,000 XP / CYCLE]',
    feeAmount: 50000,
    maintenanceLabel: 'PREMIUM MAINTENANCE FEE',
    accentClass: 'text-red-500',
    glowClass: 'shadow-[0_0_25px_rgba(239,68,68,0.25)] hover:shadow-[0_0_40px_rgba(239,68,68,0.5)]',
    borderClass: 'border-red-600/50 hover:border-red-500',
    bgGradient: 'from-[#1a0505] via-[#090202] to-[#120404]',
    glowRgb: '239, 68, 68',
    description: 'Dragonflame reactor grid. Resources power deep volcanic thermal loops, scale armor fabrication nodes, and aerial airspace dominance patrols.',
    estFunding: '28.1M XP',
    forceStrength: 'DRG•3A+',
    securityIntegrity: '99.85%',
    historyLogs: [
      'Thermal cell injection 3 complete',
      'Airspace sweep indicates zero unidentified drones',
      'Volcanic mainframe coolant flow rate optimized'
    ]
  },
  {
    id: 'stark',
    name: 'House Stark',
    tagline: 'Winter is Coming.',
    emoji: '❄️',
    feeType: 'premium',
    feeText: '[❄️ NORTHERN SECURE FEE: 35,000 XP / CYCLE]',
    feeAmount: 35000,
    maintenanceLabel: 'NORTHERN SECURE FEE',
    accentClass: 'text-sky-400',
    glowClass: 'shadow-[0_0_25px_rgba(56,189,248,0.25)] hover:shadow-[0_0_40px_rgba(56,189,248,0.5)]',
    borderClass: 'border-sky-500/50 hover:border-sky-400',
    bgGradient: 'from-[#0b172a] via-[#040812] to-[#112240]',
    glowRgb: '56, 189, 248',
    description: 'Sub-zero perimeter walls. Funding guarantees ice-breaker node continuous sync, thermal sanctuary heaters, and structural fortress resilience.',
    estFunding: '19.4M XP',
    forceStrength: 'WTZ•12B',
    securityIntegrity: '99.95%',
    historyLogs: [
      'Perimeter thermal field integrity normal',
      'Ice-wall backup server nodes fully synchronized',
      'Winter-cycle automation scripts loaded successfully'
    ]
  },
  {
    id: 'uchiha',
    name: 'House Uchiha',
    tagline: 'Behold the Sharingan.',
    emoji: '👁️',
    feeType: 'standard',
    feeText: '[👁️ NOMINAL FEE: 5,000 XP / CYCLE]',
    feeAmount: 5000,
    maintenanceLabel: 'SHARINGAN SYNC FEE',
    accentClass: 'text-[#ff003c]',
    glowClass: 'shadow-[0_0_25px_rgba(255,0,60,0.2)] hover:shadow-[0_0_40px_rgba(255,0,60,0.45)]',
    borderClass: 'border-[#ff003c]/50 hover:border-[#ff003c]',
    bgGradient: 'from-[#120104] via-[#050001] to-[#1f0107]',
    glowRgb: '255, 0, 60',
    description: 'Ocular analytics mainframe. Tracks visual genjutsu firewalls, Susanoo chassis development, and local security protocol decoders.',
    estFunding: '8.2M XP',
    forceStrength: 'SHG•MS3',
    securityIntegrity: '99.90%',
    historyLogs: [
      'Amaterasu firewall protocols updated',
      'Ocular bandwidth scanning active in sector 4',
      'Decoders verify 0 intrusion reports'
    ]
  },
  {
    id: 'ackerman',
    name: 'House Ackerman',
    tagline: 'Perfect tactical precision.',
    emoji: '⚔️',
    feeType: 'standard',
    feeText: '[⚔️ NOMINAL FEE: 5,000 XP / CYCLE]',
    feeAmount: 5000,
    maintenanceLabel: 'AWAKENED HEIRLOOM FEE',
    accentClass: 'text-slate-300',
    glowClass: 'shadow-[0_0_25px_rgba(148,163,184,0.15)] hover:shadow-[0_0_40px_rgba(148,163,184,0.35)]',
    borderClass: 'border-slate-500/50 hover:border-slate-400',
    bgGradient: 'from-[#151922] via-[#090b0e] to-[#1d2330]',
    glowRgb: '148, 163, 184',
    description: 'Manual blade-forge and combat calibration telemetry. Oversees physical reflex matrix sync, structural layout training grounds, and secure armory chambers.',
    estFunding: '5.1M XP',
    forceStrength: 'ACK•CPT',
    securityIntegrity: '99.98%',
    historyLogs: [
      'Garrison armory stores verified',
      'Reflex matrix calibration sequence approved',
      'Scouting reports indicate clear forest zones'
    ]
  },
  {
    id: 'uzumaki',
    name: 'House Uzumaki',
    tagline: 'Believe it!',
    emoji: '🌀',
    feeType: 'standard',
    feeText: '[🌀 NOMINAL FEE: 5,000 XP / CYCLE]',
    feeAmount: 5000,
    maintenanceLabel: 'NOMINAL MAINTENANCE FEE',
    accentClass: 'text-orange-500',
    glowClass: 'shadow-[0_0_25px_rgba(249,115,22,0.18)] hover:shadow-[0_0_40px_rgba(249,115,22,0.38)]',
    borderClass: 'border-orange-500/50 hover:border-orange-400',
    bgGradient: 'from-[#1a0d05] via-[#090401] to-[#251206]',
    glowRgb: '249, 115, 22',
    description: 'Chakra-containment reserves. Powers massive shadow-clone telemetry distribution, sealing jutsu firewalls, and local village stability matrices.',
    estFunding: '12.4M XP',
    forceStrength: 'KRG•HKG',
    securityIntegrity: '99.70%',
    historyLogs: [
      'Seal formula reinforced on storage array',
      'Sage mode sensors broadcasting normal telemetry',
      'Ramen shop logistics active'
    ]
  },
  {
    id: 'japanese',
    name: 'Japanese House',
    tagline: 'Honor and Sakura Scroll.',
    emoji: '🌸',
    feeType: 'premium',
    feeText: '[🌸 SHOGUNATE CITADEL FEE: 45,000 XP / CYCLE]',
    feeAmount: 45000,
    maintenanceLabel: 'SHOGUNATE CITADEL FEE',
    accentClass: 'text-[#ff5e7e]',
    glowClass: 'shadow-[0_0_25px_rgba(255,94,126,0.25)] hover:shadow-[0_0_40px_rgba(255,94,126,0.5)]',
    borderClass: 'border-[#ff5e7e]/40 hover:border-[#ff5e7e]',
    bgGradient: 'from-[#1c080e] via-[#0c0306] to-[#120509]',
    glowRgb: '255, 94, 126',
    description: 'Sakura-laden tactical shogunate database. Powers scroll cipher matrices, historical bushido memory banks, and localized defense protocols.',
    estFunding: '9.4M XP',
    forceStrength: 'SAM•SHG',
    securityIntegrity: '99.92%',
    historyLogs: [
      'Sakura firewall nodes initialized',
      'Scroll cipher verification completed successfully',
      'Katana calibration systems operating within bounds'
    ]
  },
  {
    id: 'lannister',
    name: 'House Lannister',
    tagline: 'Hear Me Roar.',
    emoji: '🦁',
    feeType: 'premium',
    feeText: '[🦁 GOLD GOLD GOLDEN TAX: 60,000 XP / CYCLE]',
    feeAmount: 60000,
    maintenanceLabel: 'GOLD GOLD GOLDEN TAX',
    accentClass: 'text-amber-500',
    glowClass: 'shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]',
    borderClass: 'border-amber-600/50 hover:border-amber-500',
    bgGradient: 'from-[#190404] via-[#070101] to-[#210505]',
    glowRgb: '245, 158, 11',
    description: 'Gold-reserve database. Administers standard investment ledgers, debt validation queries, and deep silver mine structural automation.',
    estFunding: '35.0M XP',
    forceStrength: 'GLD•999',
    securityIntegrity: '99.99%',
    historyLogs: [
      'All pending guild debts recorded and settled',
      'Gold vault thermal cameras operating correctly',
      'Casterly Rock defenses synchronized'
    ]
  },
  {
    id: 'akatsuki',
    name: 'Akatsuki Outpost',
    tagline: 'Dawn of a new world.',
    emoji: '☁️',
    feeType: 'premium',
    feeText: '[☁️ ROGUE S-RANK BOUNTY: 80,000 XP / CYCLE]',
    feeAmount: 80000,
    maintenanceLabel: 'ROGUE LEVY TAX',
    accentClass: 'text-red-500',
    glowClass: 'shadow-[0_0_25px_rgba(220,38,38,0.25)] hover:shadow-[0_0_40px_rgba(220,38,38,0.5)]',
    borderClass: 'border-red-600/50 hover:border-red-500',
    bgGradient: 'from-[#110101] via-[#020000] to-[#1a0202]',
    glowRgb: '220, 38, 38',
    description: 'Underground database exchange. Distributes secret intelligence reports, cloak fabrication nodes, and ring encryption hashes.',
    estFunding: '14.8M XP',
    forceStrength: 'S-RANK•X',
    securityIntegrity: '97.40%',
    historyLogs: [
      'Hidden Rain communication channel open',
      'Ring signals broadcasting on secure sub-frequencies',
      'Vanguard tracking coordinates falsified'
    ]
  }
];

function renderLoreParticles(houseId: string) {
  switch (houseId) {
    case 'saiyans':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Goku & Vegeta intense spiky-hair and aura backdrops (very faint opacity) */}
          <svg viewBox="0 0 120 120" className="absolute bottom-0 inset-x-0 mx-auto w-40 h-40 opacity-[0.08] text-yellow-400 select-none">
            {/* Goku silhouette */}
            <path d="M20,120 L25,100 L20,95 L30,96 L35,85 L40,90 L45,78 L50,85 L53,68 L56,82 L60,70 L65,82 L68,68 L71,85 L76,78 L81,90 L86,85 L91,96 L101,95 L96,100 L101,120 Z" fill="currentColor" />
            {/* Vegeta silhouette */}
            <path d="M15,120 L20,105 L26,88 L23,80 L35,82 L38,62 L43,65 L46,45 L50,55 L54,32 L58,50 L64,28 L68,48 L72,32 L76,55 L80,45 L85,65 L88,62 L91,82 L103,80 L100,88 L106,105 L111,120 Z" fill="currentColor" className="translate-x-4 scale-x-[-1] origin-center opacity-70" />
            {/* Auric flame back border */}
            <path d="M5,120 Q30,30 60,30 Q90,30 115,120" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" fill="none" className="animate-pulse" />
          </svg>
          {/* Intense pulsing golden lightning sparks surrounding */}
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-yellow-300 animate-[sparkUp_2.5s_infinite_linear] opacity-0 text-[14px]"
              style={{
                left: `${10 + i * 20}%`,
                animationDelay: `${i * 0.4}s`,
              }}
            >
              ⚡
            </span>
          ))}
          {/* Glowing particle dots */}
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i + 10}
              className="absolute bg-yellow-400 rounded-full animate-ping opacity-[0.10]"
              style={{
                width: '6px',
                height: '6px',
                left: `${20 + i * 22}%`,
                top: `${30 + i * 15}%`,
                animationDuration: `${1.5 + i * 0.5}s`,
              }}
            />
          ))}
        </div>
      );

    case 'targaryen':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Iron Throne glowing phantom outline */}
          <svg viewBox="0 0 100 100" className="absolute bottom-1 right-2 w-28 h-28 opacity-[0.07] text-orange-600 select-none">
            {/* Spikes / Swords */}
            <path d="M10,95 L12,40 L18,95 L24,30 L30,95 L36,20 L42,95 L48,15 L54,95 L60,20 L66,95 L72,30 L78,95 L84,40 L86,95 Z" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M15,95 L85,95 L80,62 L20,62 Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
            {/* Dragon wing outline background */}
            <path d="M5,50 Q10,10 40,30 Q70,10 95,50 C80,60 50,55 5,50 Z" stroke="currentColor" strokeWidth="0.8" fill="none" className="animate-pulse" />
          </svg>
          
          {/* Flying dragon wing silhouettes */}
          <span className="absolute text-red-500/10 animate-[driftWind_10s_infinite_linear] text-lg" style={{ top: '25%' }}>
            🐉
          </span>

          {/* Blazing embers rising upward */}
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-orange-500 rounded-full animate-[riseEmber_3s_infinite_linear] opacity-0 text-[8px]"
              style={{
                backgroundColor: i % 2 === 0 ? '#ef4444' : '#f97316',
                boxShadow: '0 0 8px rgba(249,115,22,0.6)',
                width: `${Math.random() * 4 + 4}px`,
                height: `${Math.random() * 4 + 4}px`,
                left: `${15 + i * 18}%`,
                animationDelay: `${i * 0.5}s`,
              }}
            />
          ))}
        </div>
      );

    case 'stark':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Silver direwolf house sigil */}
          <svg viewBox="0 0 100 100" className="absolute bottom-3 left-4 w-28 h-28 opacity-[0.08] text-slate-400 select-none">
            {/* Elegant direwolf profile outline */}
            <path d="M10,65 L28,52 L45,30 L52,40 L68,48 L88,52 L70,62 L60,82 L48,68 L22,65 M68,48 Q82,38 72,28 Q62,18 45,30" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            {/* Glowing snowflake in eye region */}
            <circle cx="48" cy="42" r="1.5" fill="currentColor" className="animate-ping" />
          </svg>

          {/* Falling crystalline snowflakes & direwolf drifting elements */}
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-sky-200 animate-[fallSnow_4.5s_infinite_linear] opacity-0 text-[11px] font-mono"
              style={{
                left: `${10 + i * 15}%`,
                animationDelay: `${i * 0.6}s`,
              }}
            >
              {i % 3 === 0 ? '❄️' : i % 3 === 1 ? '🐺' : '•'}
            </span>
          ))}
        </div>
      );

    case 'uchiha':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Madara's armored Susanoo skeletal ribs / shield outline */}
          <svg viewBox="0 0 120 120" className="absolute bottom-1 left-2 w-36 h-36 opacity-[0.08] text-[#c084fc] select-none">
            {/* Rib cages / spectral construct */}
            <path d="M15,110 Q25,25 60,15 Q95,25 105,110" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M30,110 Q35,45 60,38 Q85,45 90,110" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="3 2" />
            <path d="M42,110 Q45,60 60,55 Q75,60 78,110" stroke="currentColor" strokeWidth="1.2" fill="none" />
            {/* Glowing eye nodes */}
            <circle cx="50" cy="48" r="2.5" fill="#ef4444" className="animate-pulse" />
            <circle cx="70" cy="48" r="2.5" fill="#ef4444" className="animate-pulse" />
          </svg>

          {/* Itachi's phantom crow silhouettes drifting */}
          <span className="absolute text-slate-800/10 animate-[driftWind_9s_infinite_linear] text-xl" style={{ top: '15%' }}>
            🐦
          </span>
          <span className="absolute text-slate-800/12 animate-[driftWind_7s_infinite_linear] text-base" style={{ top: '40%', animationDelay: '3s' }}>
            🐦
          </span>

          {/* Slowly spinning crimson Sharingan tomoe circles */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-1/4 right-1/4 w-20 h-20 opacity-[0.09]"
              style={{
                transform: `rotate(${i * 120}deg)`,
                animation: 'spinTomoe 8s infinite linear',
                animationDelay: `${i * 1.5}s`,
              }}
            >
              <svg viewBox="0 0 100 100" className="w-full h-full text-red-600">
                <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1.5" fill="none" />
                {/* 3 Tomoes aligned geometrically */}
                <circle cx="50" cy="22" r="3.5" fill="currentColor" />
                <path d="M50,22 Q54,22 55,26 Q55,29 50,27" fill="currentColor" />
                
                <circle cx="26" cy="64" r="3.5" fill="currentColor" />
                <path d="M26,64 Q28,60 32,61 Q34,62 31,66" fill="currentColor" />

                <circle cx="74" cy="64" r="3.5" fill="currentColor" />
                <path d="M74,64 Q72,60 68,61 Q66,62 69,66" fill="currentColor" />
              </svg>
            </div>
          ))}
        </div>
      );

    case 'ackerman':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Dark towering silhouette of Titans evaporating into steam clouds */}
          <svg viewBox="0 0 120 120" className="absolute bottom-0 right-0 w-36 h-36 opacity-[0.08] text-slate-700 select-none">
            {/* Gargantuan head and shoulders silhouette */}
            <path d="M20,120 L35,85 C38,70 50,70 50,55 C50,42 45,35 60,35 C75,35 70,42 70,55 C70,70 82,70 85,85 L100,120 Z" fill="currentColor" />
            <path d="M25,85 L35,65 Q45,62 48,50" stroke="#94a3b8" strokeWidth="0.8" fill="none" strokeDasharray="2 2" className="animate-pulse" />
            <path d="M95,85 L85,65 Q75,62 72,50" stroke="#94a3b8" strokeWidth="0.8" fill="none" strokeDasharray="2 2" className="animate-pulse" />
          </svg>

          {/* Titan Steam Clouds */}
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i + 15}
              className="absolute text-slate-400 animate-[riseCloud_4.5s_infinite_linear] opacity-0 text-[13px]"
              style={{
                left: `${45 + i * 12}%`,
                animationDelay: `${i * 1.1}s`,
              }}
            >
              💨
            </span>
          ))}

          {/* Sharp silver blade slashes */}
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="absolute bg-gradient-to-r from-transparent via-slate-100 to-transparent animate-[driftSlash_3.5s_infinite_ease-out] opacity-0"
              style={{
                width: `${Math.random() * 30 + 20}px`,
                height: '1.5px',
                top: `${20 + i * 18}%`,
                left: `${10 + i * 18}%`,
                animationDelay: `${i * 0.7}s`,
              }}
            />
          ))}
          {/* Blade crossed indicator */}
          <span className="absolute right-4 top-4 text-slate-500/10 text-2xl rotate-12">
            ⚔️
          </span>
        </div>
      );

    case 'uzumaki':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Nine-Tails (Kurama) silhouette outlines with tails waving in the backdrop */}
          <svg viewBox="0 0 120 120" className="absolute bottom-0 left-0 w-44 h-44 opacity-[0.09] text-orange-600 select-none">
            {/* Wavy active tail structures with unique delay offsets */}
            <path d="M60,120 Q30,80 15,50 Q5,25 20,10" stroke="currentColor" strokeWidth="1.5" fill="none" className="animate-[swayTail_5s_infinite_ease-in-out_alternate]" style={{ transformOrigin: '60px 120px' }} />
            <path d="M60,120 Q40,75 25,40 Q15,15 35,5" stroke="currentColor" strokeWidth="1.5" fill="none" className="animate-[swayTail_5.5s_infinite_ease-in-out_alternate]" style={{ transformOrigin: '60px 120px' }} />
            <path d="M60,120 Q50,70 42,30 Q35,5 55,0" stroke="currentColor" strokeWidth="1.5" fill="none" className="animate-[swayTail_6s_infinite_ease-in-out_alternate]" style={{ transformOrigin: '60px 120px' }} />
            <path d="M60,120 Q60,65 60,25 Q60,0 75,2" stroke="currentColor" strokeWidth="1.5" fill="none" className="animate-[swayTail_6.5s_infinite_ease-in-out_alternate]" style={{ transformOrigin: '60px 120px' }} />
            <path d="M60,120 Q70,70 78,30 Q85,5 98,12" stroke="currentColor" strokeWidth="1.5" fill="none" className="animate-[swayTail_6s_infinite_ease-in-out_alternate]" style={{ transformOrigin: '60px 120px' }} />
            <path d="M60,120 Q80,75 95,40 Q105,15 110,25" stroke="currentColor" strokeWidth="1.2" fill="none" className="animate-[swayTail_5.5s_infinite_ease-in-out_alternate]" style={{ transformOrigin: '60px 120px' }} />
            <path d="M60,120 Q90,80 105,50 Q115,25 118,35" stroke="currentColor" strokeWidth="1.2" fill="none" className="animate-[swayTail_5s_infinite_ease-in-out_alternate]" style={{ transformOrigin: '60px 120px' }} />
            {/* Center Fox face outline */}
            <path d="M45,95 L52,85 L60,80 L68,85 L75,95 L65,105 L55,105 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="55" cy="90" r="1" fill="currentColor" />
            <circle cx="65" cy="90" r="1" fill="currentColor" />
          </svg>

          {/* Deep neon-orange swirling chakra vortex particles */}
          {Array.from({ length: 4 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-orange-400 font-mono animate-[driftWind_6.5s_infinite_linear] opacity-0 text-[14px]"
              style={{
                top: `${20 + i * 20}%`,
                animationDelay: `${i * 1.2}s`,
                filter: 'drop-shadow(0 0 4px #fdba74)',
              }}
            >
              🌀
            </span>
          ))}
          {/* Spiraling golden sparkles */}
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i + 20}
              className="absolute text-yellow-500 animate-[riseEmber_4s_infinite_linear] opacity-0 text-[10px]"
              style={{
                left: `${15 + i * 25}%`,
                animationDelay: `${i * 1.5}s`,
              }}
            >
              ✨
            </span>
          ))}
        </div>
      );

    case 'japanese':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Traditional Temple Gate (Torii) Background silhouette */}
          <svg viewBox="0 0 100 100" className="absolute bottom-2 inset-x-0 mx-auto w-24 h-24 opacity-[0.07] text-[#ff5e7e] select-none">
            {/* Torii Gate Structure */}
            <path d="M10,25 L90,25 M15,32 L85,32 M25,32 L25,95 M75,32 L75,95 M18,20 C18,20 25,27 35,27 L65,27 C75,27 82,20 82,20" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M40,32 L40,55 L60,55 L60,32" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>

          {/* Traditional glowing Kanji scroll symbols */}
          {['桜', '誉', '武', '侍'].map((char, index) => (
            <span
              key={index}
              className="absolute text-pink-400/90 font-serif animate-[driftWind_7.5s_infinite_linear] opacity-0 text-xs font-black shadow-pink-500"
              style={{
                top: `${15 + index * 20}%`,
                animationDelay: `${index * 1.5}s`,
                filter: 'drop-shadow(0 0 6px rgba(255, 94, 126, 0.5))',
              }}
            >
              {char}
            </span>
          ))}

          {/* Elegant falling cherry blossom (sakura) petals */}
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="absolute bg-pink-300 rounded-full animate-[floatSakura_4.5s_infinite_linear] opacity-0"
              style={{
                width: `${Math.random() * 5 + 4}px`,
                height: `${Math.random() * 3 + 3}px`,
                left: `${10 + i * 18}%`,
                animationDelay: `${i * 0.7}s`,
                borderRadius: '100% 25% 100% 25%',
                boxShadow: '0 0 6px rgb(244,143,177)',
              }}
            />
          ))}
        </div>
      );

    case 'lannister':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Casterly Rock fortress silhouette / gold stack background icon */}
          <svg viewBox="0 0 100 100" className="absolute bottom-2 right-4 w-28 h-28 opacity-[0.07] text-amber-500 select-none">
            {/* Rock / Castle spikes */}
            <path d="M10,95 L30,55 L40,65 L60,35 L75,70 L90,95 Z" fill="currentColor" />
            <path d="M40,65 L40,45 L45,45 L45,65" stroke="black" strokeWidth="1" fill="none" />
            <path d="M60,35 L60,15 L66,15 L66,35" stroke="black" strokeWidth="1" fill="none" />
          </svg>

          {/* Floating gold lion sigils (🦁) and royal cups of wine (🍷) tumbling down */}
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-yellow-500 animate-[driftCoin_4.5s_infinite_linear] opacity-0 font-bold"
              style={{
                fontSize: i % 2 === 0 ? '13px' : '10px',
                left: `${10 + i * 18}%`,
                animationDelay: `${i * 0.8}s`,
                filter: 'drop-shadow(0 0 3px rgba(245,158,11,0.4))',
              }}
            >
              {i % 3 === 0 ? '🦁' : i % 3 === 1 ? '🍷' : '🪙'}
            </span>
          ))}
        </div>
      );

    case 'akatsuki':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* Elegant Pain's Rinnegan background overlay concentric circles */}
          <svg viewBox="0 0 100 100" className="absolute w-28 h-28 top-[15%] left-[10%] opacity-[0.06] text-purple-400 select-none animate-pulse">
            <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <circle cx="50" cy="50" r="35" stroke="currentColor" strokeWidth="0.8" fill="none" />
            <circle cx="50" cy="50" r="25" stroke="currentColor" strokeWidth="0.8" fill="none" strokeDasharray="3 2" />
            <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="1" fill="none" />
            <circle cx="50" cy="50" r="5" fill="currentColor" />
          </svg>

          {/* Faint ghostly glowing outline of Obito's Sharingan mask */}
          <svg viewBox="0 0 100 100" className="absolute w-24 h-24 bottom-[10%] right-[10%] opacity-[0.05] text-orange-500 select-none animate-[spin_18s_infinite_linear]">
            {/* Obito's spiral pattern mask */}
            <path d="M 50 10 A 40 40 0 1 0 90 50 C 70 50, 50 70, 50 50 C 50 30, 30 50, 50 50" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="2 1" />
            <circle cx="68" cy="42" r="2.5" fill="#ef4444" /> {/* Eye glowing red */}
          </svg>

          {/* Floating ominous dark red clouds drifting upwards */}
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-red-600/35 animate-[riseCloud_5.5s_infinite_linear] opacity-0 text-[18px]"
              style={{
                left: `${15 + i * 16}%`,
                animationDelay: `${i * 1.0}s`,
                filter: 'drop-shadow(0 0 5px rgba(220,38,38,0.4))',
              }}
            >
              ☁️
            </span>
          ))}
        </div>
      );

    default:
      return null;
  }
}

export default function HouseCards() {
  const [activeFactionName, setActiveFactionName] = useState<string>('Unaligned Legion');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedHouse, setSelectedHouse] = useState<HouseDetail>(HOUSES_DATA[0]);
  const [focusedHouseId, setFocusedHouseId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [hoveredCardState, setHoveredCardState] = useState<{ id: string | null; rotateX: number; rotateY: number; sheenX: number; sheenY: number }>({
    id: null,
    rotateX: 0,
    rotateY: 0,
    sheenX: 50,
    sheenY: 50
  });

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>, houseId: string) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    // Sharp dramatic perspective rotation calculations (-18 to +18 deg ranges)
    const rotateY = ((x / w) - 0.5) * 36;
    const rotateX = (0.5 - (y / h)) * 36;

    // Tracking reflective sheen light coordinates
    const sheenX = (x / w) * 100;
    const sheenY = (y / h) * 100;

    setHoveredCardState({
      id: houseId,
      rotateX,
      rotateY,
      sheenX,
      sheenY
    });
  };

  const handleCardMouseLeave = () => {
    setHoveredCardId(null);
    setHoveredCardState({
      id: null,
      rotateX: 0,
      rotateY: 0,
      sheenX: 50,
      sheenY: 50
    });
  };

  const [syncingAllieance, setSyncingAlliance] = useState<boolean>(false);
  const [successAnimation, setSuccessAnimation] = useState<boolean>(false);

  useEffect(() => {
    // Read local storage initial active faction
    const cachedName = localStorage.getItem('active_faction_name');
    if (cachedName) {
      setActiveFactionName(cachedName);
      
      // Auto-select corresponding house if available
      const matched = HOUSES_DATA.find(h => h.name.toLowerCase() === cachedName.toLowerCase());
      if (matched) {
        setSelectedHouse(matched);
      }
    }

    // Subscribe to auth state
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setCurrentUser(firebaseUser);
      if (firebaseUser) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', firebaseUser.uid)
            .maybeSingle();
            
          if (profile && profile.active_faction) {
            setActiveFactionName(profile.active_faction);
            const matched = HOUSES_DATA.find(h => h.name.toLowerCase() === profile.active_faction.toLowerCase());
            if (matched) {
              setSelectedHouse(matched);
            }
          }
        } catch (err) {
          console.warn('Silent loading error on profile active faction:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCardClickAndActivate = async (house: HouseDetail) => {
    setSelectedHouse(house);
    setFocusedHouseId(focusedHouseId === house.id ? null : house.id);

    // 1. Instant global visual transformation
    const houseId = house.id;
    const themeVal = houseId.toLowerCase().replace(/\s+/g, '-');
    document.documentElement.setAttribute('data-theme', themeVal);
    localStorage.setItem('active_house_theme', houseId);

    // 2. Update localStorage faction name
    localStorage.setItem('active_faction_name', house.name);
    setActiveFactionName(house.name);

    // 3. Dispatch events to let all global components sync instantly
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('profiles-updated'));
    window.dispatchEvent(new CustomEvent('faction-sync-update', { detail: { name: house.name } }));

    // 4. Update databases instantly
    const authId = currentUser?.uid || auth.currentUser?.uid;
    if (authId) {
      try {
        await supabase
          .from('profiles')
          .update({ active_faction: house.name })
          .eq('id', authId);
      } catch (err) {
        console.warn('profiles sync bypassed:', err);
      }

      try {
        await supabase
          .from('user_profiles')
          .upsert({
            user_id: authId,
            active_faction: house.name,
            faction_name: house.name
          }, { onConflict: 'user_id' });
      } catch (upErr) {
        console.warn('user_profiles custom theme sync warning:', upErr);
      }

      try {
        await supabase
          .from('user_factions')
          .upsert({
            user_id: authId,
            faction_name: house.name,
            faction_rank: 'Warlock',
            faction_xp: 9999
          }, { onConflict: 'user_id' });
      } catch (fErr) {
        console.warn('user_factions sync bypassed:', fErr);
      }
    }
  };

  const handleSyncAlliance = async (house: HouseDetail) => {
    setSyncingAlliance(true);
    try {
      // 1. Update localStorage
      localStorage.setItem('active_faction_name', house.name);
      
      // 2. Update Supabase if authenticated
      if (currentUser) {
        await supabase
          .from('profiles')
          .update({ active_faction: house.name })
          .eq('id', currentUser.uid);
      }
      
      // 3. Dispatch global event to let Navigation sidebar reload automatically
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('faction-sync-update', { detail: { name: house.name } }));
      
      // Trigger success animations
      setActiveFactionName(house.name);
      setSuccessAnimation(true);
      setTimeout(() => {
        setSuccessAnimation(false);
      }, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingAlliance(false);
    }
  };

  const isMatched = selectedHouse.name.toLowerCase() === activeFactionName.toLowerCase();

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-background pb-12 bg-[#050505] p-6 lg:p-12 text-gray-200 relative">
      {/* Ambient glass background particles and grids */}
      <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-all duration-1000 ${focusedHouseId ? 'blur-3xl opacity-20 scale-95' : 'opacity-40 scale-100'}`}>
        <div className="absolute top-[10%] left-[5%] w-[350px] h-[350px] bg-red-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[40%] right-[10%] w-[450px] h-[450px] bg-yellow-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-[130px]" />
        {/* Intense high-tech grid layer */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      {/* Perspective Container style for custom 3D rotations */}
      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-\\[1000px\\] {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .card-3d {
          transform-style: preserve-3d;
          transition: all 500ms ease-out !important;
        }
        /* Fallbacks to make sure literal classes trigger active tilts and glowing shadows */
        .hover\\:-rotate-y-12:hover {
          transform: rotateY(-12deg) rotateX(6deg) scale(1.05) translateZ(10px) !important;
        }
        .hover\\:shadow-\\[0_0_30px_rgba\\(var\\(--theme-glow\\)\\,0\\.5\\)\\]:hover {
          box-shadow: 0 0 30px rgba(var(--theme-glow), 0.5) !important;
        }

        /* 2D Lore-Specific Falling/Floating Animations */
        @keyframes riseEmber {
          0% { transform: translateY(180px) scale(0.5); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-30px) scale(1.1) translateX(15px); opacity: 0; }
        }
        @keyframes fallSnow {
          0% { transform: translateY(-20px) translateX(-10px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.6; }
          100% { transform: translateY(220px) translateX(25px) rotate(360deg); opacity: 0; }
        }
        @keyframes sparkUp {
          0% { transform: translateY(180px) scale(0.3) rotate(0deg); opacity: 0; }
          15% { opacity: 0.95; }
          85% { opacity: 0.70; }
          100% { transform: translateY(-20px) scale(1.3) rotate(45deg); opacity: 0; }
        }
        @keyframes spinTomoe {
          0% { transform: translate(0, 0) rotate(0deg) scale(0.8); opacity: 0.1; }
          50% { transform: translate(15px, -15px) rotate(180deg) scale(1.1); opacity: 0.6; }
          100% { transform: translate(0, 0) rotate(360deg) scale(0.8); opacity: 0.1; }
        }
        @keyframes floatSakura {
          0% { transform: translateY(-20px) translateX(-25px) rotate(0deg); opacity: 0; }
          20% { opacity: 0.8; }
          80% { opacity: 0.6; }
          100% { transform: translateY(220px) translateX(35px) rotate(180deg); opacity: 0; }
        }
        @keyframes driftCoin {
          0% { transform: translate(0, 180px) rotateY(0deg) scale(0.8); opacity: 0; }
          15% { opacity: 0.9; }
          85% { opacity: 0.7; }
          100% { transform: translate(20px, -20px) rotateY(360deg) scale(1.25); opacity: 0; }
        }
        @keyframes riseCloud {
          0% { transform: translateY(180px) scale(0.8) translateX(-10px); opacity: 0; }
          10% { opacity: 0.6; }
          85% { opacity: 0.4; }
          100% { transform: translateY(-30px) scale(1.6) translateX(20px); opacity: 0; }
        }
        @keyframes driftSlash {
          0% { transform: scaleX(0) translateX(-15px) rotate(-15deg); opacity: 0; }
          10% { opacity: 0.6; }
          50% { transform: scaleX(1) translateX(10px) rotate(-15deg); opacity: 0.85; }
          90% { opacity: 0.4; }
          100% { transform: scaleX(0) translateX(30px) rotate(-15deg); opacity: 0; }
        }
        @keyframes driftWind {
          0% { transform: translateX(-40px) translateY(0) scaleX(0.5); opacity: 0; }
          30% { opacity: 0.6; }
          70% { opacity: 0.6; }
          100% { transform: translateX(240px) translateY(-10px) scaleX(1.3); opacity: 0; }
        }
        @keyframes swayTail {
          0% { transform: rotate(-4deg); }
          100% { transform: rotate(4deg); }
        }
        @keyframes shimmerSweep {
          0% { transform: translateX(-150%) rotate(25deg); }
          100% { transform: translateX(150%) rotate(25deg); }
        }
      `}} />

      {/* Breadcrumb and Top Stats */}
      <div className={`max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all duration-500 ${focusedHouseId ? 'blur-[3px] opacity-25 scale-[0.98] pointer-events-none' : ''}`}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-red-500 uppercase font-black">HOUSE CORES ACTIVE LINK</span>
          </div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
            🏦 House <span className="text-red-500">Treasury</span>
          </h1>
          <p className="text-xs text-gray-400 font-sans mt-1 max-w-xl">
            A secure terminal vault tracking maintenance cycle records, funding targets, and real-time alliance verification protocols.
          </p>
        </div>

        {/* Current Alignment Panel Node */}
        <div className="bg-[#0A0A0F] border border-white/5 rounded-2xl p-4 flex items-center gap-4 shrink-0 min-w-[280px]">
          <div className="w-10 h-10 rounded bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-lg">
            🏰
          </div>
          <div>
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-black">CURRENT ALIGNMENT</span>
            <span className="text-sm font-black text-white block uppercase tracking-wide">
              {activeFactionName}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold">NODE CONNECTED</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* Left/Middle: 3D-Style Card Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <div className={`flex items-center gap-2 transition-all duration-500 ${focusedHouseId ? 'blur-[2px] opacity-35' : ''}`}>
              <span className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] font-black">
                ⚡ TACTICAL INTERACTIVE CARDS
              </span>
              <span className="text-[9px] text-gray-500 font-mono hidden sm:inline">
                • Click to Focus & Inspect 3D
              </span>
            </div>
            {focusedHouseId && (
              <button 
                onClick={() => setFocusedHouseId(null)}
                className="text-[10px] font-mono text-red-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full transition-all hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse"
              >
                <span>⊙</span> CLEAR SYSTEM FOCUS
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 perspective-container perspective-[1000px] transform-style-3d">
            {HOUSES_DATA.map((house) => {
              const isThisHovered = hoveredCardState.id === house.id;
              const matchesUser = house.name.toLowerCase() === activeFactionName.toLowerCase();
              const isSelectedFocus = focusedHouseId === house.id;
              const isAnyFocused = focusedHouseId !== null;
              const isBlurred = isAnyFocused && !isSelectedFocus;

              // 1. Perspective calculate: sharpness of rotateX and rotateY
              const transformStyle = isThisHovered
                ? `perspective(1000px) rotateX(${hoveredCardState.rotateX}deg) rotateY(${hoveredCardState.rotateY}deg) scale(1.05) translateZ(15px)`
                : isSelectedFocus
                ? `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1.05) translateZ(10px)`
                : `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1) translateZ(0deg)`;

              const shadowGlow = isThisHovered
                ? `0 15px 40px rgba(${house.glowRgb}, 0.55), 0 0 ${house.glowRgb}, 0.3)`
                : isSelectedFocus
                ? `0 20px 50px rgba(${house.glowRgb}, 0.6)`
                : '';

              return (
                <div 
                  key={house.id}
                  onClick={() => {
                    handleCardClickAndActivate(house);
                  }}
                  onPointerMove={(e) => handleCardMouseMove(e, house.id)}
                  onPointerLeave={handleCardMouseLeave}
                  className={`
                    relative rounded-[1.8rem] border p-6 bg-gradient-to-br ${house.bgGradient}
                    backdrop-blur-md bg-opacity-75 border-white/10 shadow-[0_12px_35px_rgba(0,0,0,0.5)]
                    ${house.borderClass} ${house.glowClass}
                    card-3d cursor-pointer min-h-[230px] flex flex-col justify-between overflow-hidden
                    ${isSelectedFocus ? 'z-30 border-[var(--faction-primary,#E50914)] ring-2 ring-[var(--faction-primary,#E50914)]/30' : ''}
                    ${isBlurred ? 'blur-md opacity-20 scale-90 saturate-50 select-none pointer-events-none' : ''}
                    ${isThisHovered && !isBlurred ? 'z-10 border-[var(--faction-primary,#E50914)]' : ''}
                    ${matchesUser ? 'ring-2 ring-red-500/40 border-red-500/60' : ''}
                  `}
                  style={{
                    transform: transformStyle,
                    boxShadow: shadowGlow,
                    // Snappy 0.12s tracking during mouse hover, elegant 0.5s cubic-bezier transition on mouse leave
                    transition: isThisHovered 
                      ? 'transform 0.12s ease-out, box-shadow 0.12s ease-out, border-color 0.3s ease' 
                      : 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.5s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.5s ease',
                    transformStyle: 'preserve-3d',
                    '--theme-glow': house.glowRgb
                  } as React.CSSProperties}
                  id={`house-card-${house.id}`}
                >
                  {/* Decorative corner indicators */}
                  <div className="absolute top-3 left-3 text-[7px] font-mono text-white/20 pointer-events-none select-none">[+]</div>
                  <div className="absolute top-3 right-3 text-[7px] font-mono text-white/20 pointer-events-none select-none">[+]</div>
                  {/* Decorative circuit grid lines overlay inside card */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-30" />
 
                  {/* Lore-specific moving elements ambient layer with slight parallax floating (translateZ 10px) */}
                  <div 
                    className="absolute inset-0 pointer-events-none overflow-hidden z-0"
                    style={{ transform: 'translateZ(10px)', transformStyle: 'preserve-3d' }}
                  >
                    {renderLoreParticles(house.id)}
                  </div>
 
                  {/* Dynamic Glossy Holographic Trading Card Sheen Reflections */}
                  {isThisHovered && (
                    <div 
                      className="absolute inset-0 pointer-events-none z-20 mix-blend-color-dodge rounded-[1.8rem]"
                      style={{
                        background: `radial-gradient(circle at ${hoveredCardState.sheenX}% ${hoveredCardState.sheenY}%, rgba(255, 255, 255, 0.28) 0%, rgba(${house.glowRgb}, 0.18) 35%, rgba(0, 0, 0, 0) 70%), linear-gradient(135deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0) 70%)`
                      }}
                    />
                  )}
 
                  {/* Continuous Shimmering Skeleton Sweep Overlay - floats at translateZ 15px */}
                  <div 
                    className="absolute inset-0 pointer-events-none overflow-hidden rounded-[1.8rem] z-15"
                    style={{ transform: 'translateZ(15px)', transformStyle: 'preserve-3d' }}
                  >
                    <div 
                      className="absolute -inset-y-20 -inset-x-20 pointer-events-none"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15) 50%, transparent)',
                        animation: 'shimmerSweep 3s infinite linear',
                      }}
                    />
                  </div>
 
                  {/* Top Header of Card - Floats high at translateZ 35px */}
                  <div className="relative z-10" style={{ transform: 'translateZ(35px)', transformStyle: 'preserve-3d' }}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2" style={{ transformStyle: 'preserve-3d' }}>
                        {/* Emoji icon floats even higher at translateZ 45px */}
                        <div 
                          className="shrink-0 transition-transform duration-500 ease-out"
                          style={{ transform: 'translateZ(45px)', transformStyle: 'preserve-3d' }}
                        >
                          <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] block">{house.emoji}</span>
                        </div>
                        <div style={{ transformStyle: 'preserve-3d' }}>
                          <h3 
                            className="text-base font-black text-white tracking-tight uppercase italic leading-none"
                            style={{ transform: 'translateZ(30px)' }}
                          >
                            {house.name}
                          </h3>
                          <span 
                            className="text-[8px] font-mono text-gray-400 uppercase tracking-widest block mt-0.5"
                            style={{ transform: 'translateZ(20px)' }}
                          >
                            {house.tagline}
                          </span>
                        </div>
                      </div>
 
                      {matchesUser && (
                        <span 
                          className="text-[8.5px] font-mono font-black text-red-500 bg-red-500/15 border border-red-500/35 px-2.5 py-1 rounded tracking-widest uppercase animate-pulse select-none"
                          style={{ transform: 'translateZ(40px)' }}
                        >
                          [ ⚡ ACTIVE ALLIANCE NODE ]
                        </span>
                      )}
                    </div>

                    <div className="mt-4" style={{ transform: 'translateZ(25px)' }}>
                      {house.feeType === 'premium' ? (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md py-1.5 px-2 text-[9px] font-mono text-yellow-400 font-extrabold uppercase inline-block shadow-[0_0_12px_rgba(234,179,8,0.08)]">
                          ⚡ PREM RATE SYNCED
                        </div>
                      ) : (
                        <div className="bg-white/5 border border-white/10 rounded-md py-1.5 px-2 text-[9px] font-mono text-gray-400 uppercase inline-block">
                          ★ CORE LINK OK
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle / Bottom Cost Block inside Card - Floats at translateZ 22px */}
                  <div 
                    className="relative z-10 mt-6 border-t border-white/5 pt-4" 
                    style={{ transform: 'translateZ(22px)', transformStyle: 'preserve-3d' }}
                  >
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block font-bold">
                      Maintenance Fee Rate
                    </div>
                    {/* Glowing direct payment requirement labels matching prompt exactly */}
                    <div className={`text-[11px] font-mono font-black tracking-tight mt-1 truncate ${house.feeType === 'premium' ? 'text-yellow-400 shadow-sm' : 'text-slate-200'}`}>
                      {house.feeText}
                    </div>
                  </div>

                  {/* Glass Card Shadow Overlay Accent */}
                  <div className="absolute right-[-20%] bottom-[-20%] w-[50%] h-[50%] bg-white/5 rounded-full blur-[80px] pointer-events-none" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Selected Card Controls & Alignment Checking Terminal */}
        <div className="space-y-6">
          <div className="border-b border-white/5 pb-3">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.2em] font-black">
              📊 TARGET HOUSE TELEMETRY
            </span>
          </div>

          <div className="bg-[#0f0f19]/75 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 space-y-6 relative overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.5)]">
            {/* Sci-fi corner telemetry crosshair brackets */}
            <div className="absolute top-4 left-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ + ]</div>
            <div className="absolute top-4 right-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ + ]</div>
            <div className="absolute bottom-4 left-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ * ]</div>
            <div className="absolute bottom-4 right-4 text-[9px] font-mono text-zinc-600 pointer-events-none select-none">[ * ]</div>
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-600/5 rounded-full blur-[40px] pointer-events-none" />
            
            {/* Lore-specific 2D moving elements ambient layer */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
              {renderLoreParticles(selectedHouse.id)}
            </div>
            
            {/* House Identity Header */}
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shadow-inner">
                {selectedHouse.emoji}
              </div>
              <div>
                <h2 className="text-xl font-black uppercase text-white tracking-widest italic leading-none">
                  {selectedHouse.name}
                </h2>
                <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-1 block">
                  {selectedHouse.tagline}
                </span>
              </div>
            </div>

            {/* Treasury XP Maintenance Rates */}
            <div className="relative z-10 space-y-3 bg-black/40 border border-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-gray-500 uppercase">TELEMETRY CLASS</span>
                <span className={`text-[9px] font-mono font-black px-2 py-0.5 rounded ${selectedHouse.feeType === 'premium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-white/10 text-white'}`}>
                  {selectedHouse.feeType.toUpperCase()} RESOURCE
                </span>
              </div>

              <div className="border-t border-white/5 my-2 pt-2">
                <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block mb-1">
                  REQUIRED CYCLE FEE RATE:
                </span>
                <div className={`p-2.5 rounded bg-black/60 font-mono text-[10px] font-bold border ${selectedHouse.feeType === 'premium' ? 'border-yellow-500/30 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-white/10 text-gray-300'}`}>
                  {selectedHouse.feeText}
                </div>
              </div>
            </div>

            {/* Access Alignment Verification Node - MATCHES DIRECTIVES */}
            <div className="relative z-10 border border-white/5 rounded-xl bg-black/60 p-4 space-y-3">
              <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest block font-black">
                NEXUS SEGMENT CLEARANCE STATUS:
              </span>
              
              {isMatched ? (
                <div className="space-y-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-3 flex items-start gap-3">
                    <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider leading-none">
                        ACCESS AUTHORIZED • LINK ONLINE
                      </p>
                      <p className="text-[9px] text-gray-400 font-sans mt-1 leading-normal">
                        Your align-profile is fully synchronized with {selectedHouse.name}. Direct treasury reallocation access keys granted.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white/5 p-2 rounded border border-white/5">
                      <span className="text-[8px] font-mono text-gray-500 uppercase block">AUTOPAY STATUS</span>
                      <span className="text-[10px] font-mono font-black text-emerald-400 uppercase">ENABLED</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded border border-white/5">
                      <span className="text-[8px] font-mono text-gray-500 uppercase block">SYNC RATIO</span>
                      <span className="text-[10px] font-mono font-black text-white">100% SECURE</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-red-500/10 border border-red-500/20 rounded p-3 flex items-start gap-3">
                    <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
                    <div>
                      <p className="text-[10px] font-mono font-black text-red-400 uppercase tracking-wider leading-none">
                        UNAUTHORIZED CLAN ALIGNMENT
                      </p>
                      <p className="text-[9px] text-gray-400 font-sans mt-1 leading-normal">
                        Your device is currently aligned to <span className="text-white uppercase font-black">{activeFactionName}</span>. Connect through the central sync button below to access this treasury core.
                      </p>
                    </div>
                  </div>

                  {/* Alignment Action Trigger Node */}
                  <button
                    onClick={() => handleSyncAlliance(selectedHouse)}
                    disabled={syncingAllieance}
                    className="w-full bg-gradient-to-r from-red-600 via-red-500 to-red-900 hover:scale-[1.03] active:scale-[0.98] text-white font-mono font-black uppercase text-[10.5px] tracking-[0.16em] py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ease-out shadow-[0_0_15px_rgba(239,68,68,0.25)] hover:shadow-[0_0_30px_rgba(239,68,68,0.55)] border border-red-500/25 disabled:opacity-50 overflow-hidden relative group"
                  >
                    <div className="absolute inset-0 pointer-events-none z-0" style={{ transform: 'skewX(-25deg) translateX(-150%)', opacity: 0.25, background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4) 50%, transparent)', animation: 'shimmerSweep 2.2s infinite linear' }} />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {syncingAllieance ? (
                        <span className="animate-pulse">STABILIZING CORE LINK...</span>
                      ) : (
                        <>
                          <Zap size={11} className="fill-white animate-pulse" />
                          SYNC CORES TO {selectedHouse.name.toUpperCase()}
                        </>
                      )}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Extra Faction Detailed Telemetry Stats */}
            <div className="relative z-10 space-y-3 pt-2">
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-black">
                ⚔️ HOUSE STATS LEDGER
              </span>

              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#111116] p-2.5 rounded border border-white/5">
                  <span className="text-[7px] font-mono text-gray-500 block uppercase">EST FUNDING</span>
                  <span className="text-[10px] font-bold text-white block mt-0.5">{selectedHouse.estFunding}</span>
                </div>
                <div className="bg-[#111116] p-2.5 rounded border border-white/5">
                  <span className="text-[7px] font-mono text-gray-500 block uppercase">FORCE SPEED</span>
                  <span className="text-[10px] font-bold text-white block mt-0.5">{selectedHouse.forceStrength}</span>
                </div>
                <div className="bg-[#111116] p-2.5 rounded border border-white/5">
                  <span className="text-[7px] font-mono text-gray-500 block uppercase">INTEGRITY</span>
                  <span className="text-[10px] font-bold text-white block mt-0.5">{selectedHouse.securityIntegrity}</span>
                </div>
              </div>
            </div>

            {/* Ledger Activity Logs */}
            <div className="relative z-10 space-y-2 border-t border-white/5 pt-4">
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block font-black">
                📟 HISTORIC TREASURY LOG CODES
              </span>
              <div className="space-y-1.5">
                {selectedHouse.historyLogs.map((log, index) => (
                  <div key={index} className="flex items-center gap-2 text-[8px] font-mono text-gray-400">
                    <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                    <span className="truncate">{log.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>

      </div>

      {/* Synchronized Faction Floating Success Notification */}
      <AnimatePresence>
        {successAnimation && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-[9999] bg-[#0A0A0F] border-2 border-emerald-500/40 p-5 rounded-2xl shadow-[0_0_35px_rgba(16,185,129,0.3)] max-w-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">ALLIANCE CORES ALIGNED</h4>
                <p className="text-[10px] text-gray-400 mt-1">
                  Active database segment synced to <span className="text-white font-bold">{activeFactionName}</span> successfully. Access keys authorized.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
