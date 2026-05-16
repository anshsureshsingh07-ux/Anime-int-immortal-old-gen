import { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useLocation 
} from 'react-router-dom';
import { 
  Home as HomeIcon, 
  Database as DatabaseIcon, 
  UserPlus as RecruitIcon, 
  ShieldCheck as AdminIcon,
  Search,
  User as UserIcon,
  LogOut,
  Bell,
  Menu,
  X,
  Flame
} from 'lucide-react';
import { motion } from 'motion/react';
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { SignInButton, UserButton, useUser } from "@clerk/clerk-react";
import { api } from "../convex/_generated/api";
import { Show } from './components/ClerkCompat';

// Pages
import Home from './pages/Home';
import AnimeDatabase from './pages/Database';
import Recruitment from './pages/Recruitment';
import Admin from './pages/Admin';
import AnimeDetails from './pages/AnimeDetails';

function AppLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = true;
  const user = { 
    id: 'mock-user-id',
    username: 'Admin User', 
    firstName: 'Admin', 
    lastName: 'User',
    emailAddresses: [{ emailAddress: 'admin@nexus.com' }],
    imageUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&h=80&fit=crop' 
  };
  const dbUser = { role: 'admin' };
  const location = useLocation();

  useEffect(() => {
    // Auth mocked - no need to store user
  }, []);

  const navItems = [
    { name: 'Home Feed', path: '/', icon: HomeIcon },
    { name: 'Database', path: '/database', icon: DatabaseIcon },
    { name: 'Recruitment', path: '/recruit', icon: RecruitIcon },
  ];

  const isAdmin = dbUser && (dbUser.role === 'admin' || dbUser.role === 'news_writer' || dbUser.role === 'moderator');

  return (
    <div className="flex h-screen w-full bg-[#050505] text-gray-200 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0A0A0A] border-r border-[#1F1F1F] flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-[#FF0000] to-[#800000] rounded-sm rotate-45 flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">
            Anime <span className="text-[#FF0000]">Int.</span>
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3 px-2">Navigation</div>
          {navItems.map((item) => (
            <Link 
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                location.pathname === item.path 
                  ? 'bg-[#1A1A1A] border-l-2 border-[#FF0000] text-white' 
                  : 'text-gray-400 hover:bg-[#111] hover:text-white'
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
          
          {isAdmin && (
            <>
              <div className="pt-8 text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3 px-2">Management</div>
              <Link 
                to="/admin"
                className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all ${
                  location.pathname === '/admin' 
                    ? 'bg-[#1A1A1A] border-l-2 border-[#FF0000] text-white' 
                    : 'text-gray-400 hover:bg-[#111] hover:text-white'
                }`}
              >
                <AdminIcon size={18} />
                Admin Panel
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-[#1F1F1F]">
          <div className="bg-[#111] rounded-lg p-4 border border-[#1F1F1F]">
            <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-black">Recruitment Active</p>
            <p className="text-xs font-bold text-white leading-tight mb-3 italic">Looking for Thumbnail & Video Editors</p>
            <Link 
              to="/recruit"
              className="block w-full py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white text-[10px] font-black uppercase tracking-widest rounded text-center transition-colors"
            >
              Apply Now
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-[#1F1F1F] flex items-center justify-between px-8 bg-[#050505] shrink-0">
          <div className="relative w-96 hidden md:block">
            <input 
              type="text" 
              placeholder="Search archives (Anime, Studios, Genre...)" 
              className="w-full bg-[#111] border border-[#222] rounded-full py-2 px-10 text-xs focus:outline-none focus:border-[#FF0000] transition-colors font-mono"
            />
            <Search className="absolute left-4 top-2.5 text-gray-500" size={14} />
          </div>

          <div className="flex items-center gap-6 ml-auto">
            <button className="p-2 text-gray-500 hover:text-white transition-colors relative">
               <Bell size={20} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF0000] rounded-full border-2 border-[#050505]"></span>
            </button>
                        <div className="flex items-center gap-3 pl-4 border-l border-[#1F1F1F]">
                <div className="text-right hidden sm:block">
                   <div className="text-xs font-bold text-white uppercase italic">{user?.username || user?.firstName || 'Vanguard Member'}</div>
                   <div className="text-[10px] text-[#FF0000] font-mono font-black uppercase tracking-widest">
                     {dbUser?.role ? dbUser.role.replace('_', ' ') : 'AGENT'}
                   </div>
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#FF0000]/50">
                  <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
             </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar relative">
          {children}
        </main>

        {/* Bottom Ticker */}
        <footer className="h-10 bg-[#0A0A0A] border-t border-[#1F1F1F] flex items-center px-6 shrink-0">
          <div className="text-[10px] font-black uppercase text-[#FF0000] tracking-tighter mr-6 shrink-0 flex items-center gap-2">
            <Flame size={12} fill="currentColor" /> Release Tracker
          </div>
          <div className="flex-1 overflow-hidden flex gap-8 text-[10px] font-mono text-gray-500 whitespace-nowrap">
            <motion.div 
               animate={{ x: [0, -1000] }} 
               transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
               className="flex gap-12"
            >
               <span>[14:00] ONE PIECE - EP 1106 OUT NOW</span>
               <span>[16:30] SLIME S3 - EP 07 NEXT IN 2H 15M</span>
               <span>[21:00] MASHLE S2 FINALE - STREAMING SOON</span>
               <span>[00:00] NEW MANGA UPDATE - JUJUTSU KAISEN CH 260</span>
               <span>[ACTIVE] 12,402 NODES ONLINE</span>
            </motion.div>
          </div>
          <div className="ml-4 flex gap-4 items-center shrink-0">
            <div className="flex items-center gap-1.5 border-l border-[#1F1F1F] pl-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">System Optimal</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/database" element={<AnimeDatabase />} />
          <Route path="/anime/:id" element={<AnimeDetails />} />
          <Route path="/recruit" element={<Recruitment />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
