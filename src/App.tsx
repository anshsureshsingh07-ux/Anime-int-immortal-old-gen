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
  Flame,
  User,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from './lib/supabase';
import { Navigate } from 'react-router-dom';

// Pages
import Home from './pages/Home';
import AnimeDatabase from './pages/Database';
import Recruitment from './pages/Recruitment';
import Admin from './pages/Admin';
import AnimeDetails from './pages/AnimeDetails';
import AuthPage from './pages/Auth';
import ResetPassword from './pages/ResetPassword';
import News from './pages/News';
import Profile from './pages/Profile';
import NewsDetail from './pages/NewsDetail';

function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setDbUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setDbUser(data);
    } else if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const user = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    username: dbUser?.username || session.user.email?.split('@')[0],
    imageUrl: dbUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.id}`
  } : null;

  const currentDbUser = dbUser || (user ? { role: 'member' } : null);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: 'Home Feed', path: '/', icon: HomeIcon },
    { name: 'Database', path: '/database', icon: DatabaseIcon },
    { name: 'Neural News', path: '/news', icon: FileText },
    { name: 'Recruitment', path: '/recruit', icon: RecruitIcon },
    { name: 'Profile Node', path: '/profile', icon: User },
  ];

  const isAdmin = (currentDbUser && (currentDbUser.role === 'admin' || currentDbUser.role === 'news_writer' || currentDbUser.role === 'moderator')) || 
                  (session?.user?.email === 'anshsureshsingh07@gmail.com' || session?.user?.email === 'animeintofficial@gmail.com');

  const isAuthRoute = location.pathname === '/auth' || location.pathname === '/auth/reset-password';

  if (!session && !isAuthRoute) {
    return <AuthPage />;
  }

  if (isAuthRoute && session && location.pathname !== '/auth/reset-password') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-[#050505] text-gray-200 overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#0A0A0A] border-r border-[#1F1F1F] flex flex-col shrink-0 
        transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#FF0000] to-[#800000] rounded-sm rotate-45 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">
              Anime <span className="text-[#FF0000]">Int.</span>
            </h1>
          </div>
          <button 
            className="lg:hidden p-2 text-gray-400 hover:text-white"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
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

        <div className="p-4 border-t border-[#1F1F1F] space-y-3">
          <div className="bg-[#111] rounded-lg p-4 border border-[#1F1F1F]">
            <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-widest font-black">Recruitment Active</p>
            <p className="text-xs font-bold text-white leading-tight mb-3 italic">Looking for Editors & Writers</p>
            <Link 
              to="/recruit"
              className="block w-full py-2 bg-[#FF0000] hover:bg-[#CC0000] text-white text-[10px] font-black uppercase tracking-widest rounded text-center transition-colors"
            >
              Apply Now
            </Link>
          </div>
          
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
          >
            <LogOut size={16} />
            Initialize Logoff
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 border-b border-[#1F1F1F] flex items-center justify-between px-4 lg:px-8 bg-[#050505] shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            
            <div className="relative w-64 xl:w-96 hidden md:block">
              <input 
                type="text" 
                placeholder="Search archives..." 
                className="w-full bg-[#111] border border-[#222] rounded-full py-2 px-10 text-xs focus:outline-none focus:border-[#FF0000] transition-colors font-mono"
              />
              <Search className="absolute left-4 top-2.5 text-gray-500" size={14} />
            </div>
          </div>

          <div className="flex items-center gap-6 ml-auto">
            <button className="p-2 text-gray-500 hover:text-white transition-colors relative">
               <Bell size={20} />
               <span className="absolute top-2 right-2 w-2 h-2 bg-[#FF0000] rounded-full border-2 border-[#050505]"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-[#1F1F1F]">
                <div className="text-right hidden sm:block">
                   <div className="text-xs font-bold text-white uppercase italic">{user?.username || 'Vanguard Member'}</div>
                   <div className="text-[10px] text-[#FF0000] font-mono font-black uppercase tracking-widest">
                     {currentDbUser?.role ? currentDbUser.role.replace('_', ' ') : 'AGENT'}
                   </div>
                </div>
                <div className="w-10 h-10 rounded shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-[#1F1F1F] overflow-hidden group relative cursor-pointer">
                  <img src={user?.imageUrl} alt="Avatar" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <UserIcon size={12} className="text-white" />
                  </div>
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
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/database" element={<AnimeDatabase />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/anime/:id" element={<AnimeDetails />} />
          <Route path="/recruit" element={<Recruitment />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
