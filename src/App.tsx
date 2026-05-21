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
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, registerPushNotifications } from './lib/firebase';

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
import LegalPage from './pages/Legal';
import EmailVerificationPage from './pages/EmailVerification';

function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const isActualAdmin = firebaseUser && firebaseUser.email === 'anshsureshsingh07@gmail.com';
  const [supabaseSession, setSupabaseSession] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const location = useLocation();

  // Dynamic Release Tracker States
  const [isReleaseTrackerDrawerOpen, setIsReleaseTrackerDrawerOpen] = useState(false);
  const [trackerReleases, setTrackerReleases] = useState<any[]>([]);
  const [editingTrackerId, setEditingTrackerId] = useState<string | null>(null);
  const [trackerForm, setTrackerForm] = useState({ title: '', release_date: '', episode: 1, platform: 'OUT NOW' });
  const [isAddingTracker, setIsAddingTracker] = useState(false);

  const fetchTrackerReleases = async () => {
    try {
      const { data } = await supabase
        .from('release_tracker')
        .select('*')
        .order('release_date', { ascending: true });
      if (data) {
        setTrackerReleases(data);
      }
    } catch (err) {
      console.warn('Failed to fetch release_tracker rows:', err);
    }
  };

  useEffect(() => {
    fetchTrackerReleases();
  }, [isReleaseTrackerDrawerOpen]);

  const handleSaveTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackerForm.title || !trackerForm.release_date) return;

    try {
      const payload = {
        title: trackerForm.title,
        release_date: new Date(trackerForm.release_date).toISOString(),
        episode: Number(trackerForm.episode) || 1,
        platform: trackerForm.platform || 'OUT NOW'
      };

      if (editingTrackerId) {
        const { error } = await supabase
          .from('release_tracker')
          .update(payload)
          .eq('id', editingTrackerId);
        if (!error) {
          setEditingTrackerId(null);
          setTrackerForm({ title: '', release_date: '', episode: 1, platform: 'OUT NOW' });
          fetchTrackerReleases();
        }
      } else {
        const { error } = await supabase
          .from('release_tracker')
          .insert([payload]);
        if (!error) {
          setIsAddingTracker(false);
          setTrackerForm({ title: '', release_date: '', episode: 1, platform: 'OUT NOW' });
          fetchTrackerReleases();
        }
      }
    } catch (err) {
      console.error('Error modifying release_tracker:', err);
    }
  };

  const handleDeleteTracker = async (id: string) => {
    try {
      const { error } = await supabase.from('release_tracker').delete().eq('id', id);
      if (!error) {
        fetchTrackerReleases();
      }
    } catch (err) {
      console.error('Error deleting release_tracker:', err);
    }
  };

  useEffect(() => {
    // Firebase auth listener
    const unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setLoadingAuth(false);
      if (user?.uid) {
        fetchProfileById(user.uid);
        registerPushNotifications(user.uid).catch((err) => {
          console.warn('Error self-registering push notifications:', err);
        });
      } else if (user?.email) {
        fetchProfileByEmail(user.email);
      } else {
        setDbUser(null);
      }
    });

    // Supabase session listener for RLS / Supabase features
    supabase.auth.getSession().then((res) => {
      setSupabaseSession(res?.data?.session || null);
    }).catch((err) => {
      console.warn('Failed to load initial Supabase session:', err);
      setSupabaseSession(null);
    });

    const listener = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseSession(session || null);
    });
    const subscription = listener?.data?.subscription || (listener as any)?.subscription;

    return () => {
      unsubscribeFirebase();
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => {
      if (firebaseUser?.uid) {
        fetchProfileById(firebaseUser.uid);
      } else if (firebaseUser?.email) {
        fetchProfileByEmail(firebaseUser.email);
      }
    };

    window.addEventListener('profiles-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profiles-updated', handleProfileUpdate);
    };
  }, [firebaseUser]);

  const fetchProfileById = async (userId: string) => {
    let session = null;
    try {
      const res = await supabase.auth.getSession();
      session = res?.data?.session || null;
    } catch (e) {
      console.warn('Failed to get session in fetchProfileById:', e);
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    const adminEmails = ['anshsureshsingh07@gmail.com', 'animeintofficial@gmail.com'];
    const sessionEmail = session?.user?.email || firebaseUser?.email;

    if (data) {
      setDbUser(data);
      if (data.email && adminEmails.includes(data.email.toLowerCase()) && data.role !== 'admin') {
        console.log('App Startup: Auto-repairing admin profile role by ID...');
        const { error: updErr } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', userId);
        if (!updErr) {
          const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
          if (freshProfile) setDbUser(freshProfile);
        }
      }
    } else if (error && error.code === 'PGRST116' && sessionEmail && adminEmails.includes(sessionEmail.toLowerCase())) {
      console.log('App Startup: Admin profile missing entirely, auto-inserting...');
      const { error: insErr } = await supabase.from('profiles').insert([{ 
        id: userId, 
        username: sessionEmail.split('@')[0], 
        email: sessionEmail, 
        role: 'admin' 
      }]);
      if (!insErr) {
        const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (freshProfile) setDbUser(freshProfile);
      }
    } else if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile by ID:', error);
    }
  };

  const fetchProfileByEmail = async (email: string) => {
    let session = null;
    try {
      const res = await supabase.auth.getSession();
      session = res?.data?.session || null;
    } catch (e) {
      console.warn('Failed to get session in fetchProfileByEmail:', e);
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    
    const adminEmails = ['anshsureshsingh07@gmail.com', 'animeintofficial@gmail.com'];

    if (data) {
      setDbUser(data);
      if (adminEmails.includes(email.toLowerCase()) && data.role !== 'admin') {
        console.log('App Startup: Auto-repairing admin profile role by Email...');
        const { error: updErr } = await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.id);
        if (!updErr) {
          const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', data.id).single();
          if (freshProfile) setDbUser(freshProfile);
        }
      }
    } else if (error && error.code === 'PGRST116' && adminEmails.includes(email.toLowerCase()) && session?.user) {
      console.log('App Startup: Admin profile missing entirely by Email register, auto-inserting...');
      const { error: insErr } = await supabase.from('profiles').insert([{ 
        id: session.user.id, 
        username: email.split('@')[0], 
        email: email, 
        role: 'admin' 
      }]);
      if (!insErr) {
        const { data: freshProfile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (freshProfile) setDbUser(freshProfile);
      }
    } else if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    await supabase.auth.signOut();
  };

  const user = firebaseUser ? {
    id: firebaseUser.uid,
    email: firebaseUser.email,
    username: dbUser?.username || firebaseUser.email?.split('@')[0],
    imageUrl: dbUser?.avatar_url || dbUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`
  } : null;

  let currentDbUser = dbUser || (user ? { role: 'member' } : null);
  if (firebaseUser?.email === 'anshsureshsingh07@gmail.com') {
    if (currentDbUser) {
      currentDbUser = { ...currentDbUser, role: 'admin' };
    } else {
      currentDbUser = { role: 'admin' };
    }
  }

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
                  (firebaseUser?.email === 'anshsureshsingh07@gmail.com' || firebaseUser?.email === 'animeintofficial@gmail.com');

  const isAuthRoute = location.pathname === '/auth' || location.pathname === '/auth/reset-password';

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] animate-pulse">
          Decrypting session...
        </div>
      </div>
    );
  }

  if (!firebaseUser && !isAuthRoute) {
    return <AuthPage />;
  }

  if (isAuthRoute && firebaseUser && location.pathname !== '/auth/reset-password') {
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
                  <img src={user?.imageUrl || undefined} alt="Avatar" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
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
        <footer 
          className={`h-10 bg-[#0A0A0A] border-t border-[#1F1F1F] flex items-center px-6 shrink-0 select-none ${
            isActualAdmin ? "cursor-pointer hover:bg-black/80 group" : ""
          }`}
          onClick={isActualAdmin ? () => {
            fetchTrackerReleases();
            setIsReleaseTrackerDrawerOpen(true);
          } : undefined}
          title={isActualAdmin ? "Click to Open Release Tracker Controller" : "Release Tracker"}
        >
          <div className="text-[10px] font-black uppercase text-[#FF0000] tracking-tighter mr-6 shrink-0 flex items-center gap-2">
            <Flame size={12} fill="currentColor" className={isActualAdmin ? "group-hover:animate-bounce" : ""} /> Release Tracker 
            {isActualAdmin && (
              <span className="text-[8px] font-mono text-gray-500 lowercase px-1 bg-white/5 rounded border border-white/10 group-hover:text-white group-hover:bg-red-600/20 group-hover:border-red-600/30 transition-all">[Edit]</span>
            )}
          </div>
          <div className="flex-1 overflow-hidden flex gap-8 text-[10px] font-mono text-gray-500 whitespace-nowrap">
            <motion.div 
               animate={{ x: [0, -1000] }} 
               transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
               className="flex gap-12"
            >
               {trackerReleases && trackerReleases.length > 0 ? (
                 trackerReleases.map((item) => (
                   <span key={item.id} className="hover:text-white transition-colors">
                     [{new Date(item.release_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}] {item.title?.toUpperCase()} - EP {item.episode || 1} {item.platform?.toUpperCase() || 'OUT NOW'}
                   </span>
                 ))
               ) : (
                 <>
                   <span>[14:00] ONE PIECE - EP 1106 OUT NOW</span>
                   <span>[16:30] SLIME S3 - EP 07 NEXT IN 2H 15M</span>
                   <span>[21:00] MASHLE S2 FINALE - STREAMING SOON</span>
                   <span>[00:00] NEW MANGA UPDATE - JUJUTSU KAISEN CH 260</span>
                 </>
               )}
               <span className="text-red-500 font-bold">[ACTIVE] 12,402 NODES ONLINE</span>
            </motion.div>
          </div>
          <div className="ml-4 flex gap-4 items-center shrink-0">
            <div className="flex items-center gap-1.5 border-l border-[#1F1F1F] pl-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">System Optimal</span>
            </div>
          </div>
        </footer>

        {/* Dynamic Slide-out Drawer Panel for managing trackerReleases */}
        {isReleaseTrackerDrawerOpen && (
          <>
            {/* Overlay background */}
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
              onClick={() => {
                setIsReleaseTrackerDrawerOpen(false);
                setIsAddingTracker(false);
                setEditingTrackerId(null);
              }}
            />
            <aside className="fixed inset-y-0 right-0 z-50 w-96 bg-[#0c0c0c] border-l border-white/10 shadow-2xl flex flex-col font-mono animate-slide-in text-gray-300">
              <div className="p-5 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-2">
                  <Flame size={16} className="text-[#FF0000] animate-pulse" />
                  <span className="text-[11px] font-black uppercase text-white tracking-widest">Tracker Control Node</span>
                </div>
                <button 
                  onClick={() => {
                    setIsReleaseTrackerDrawerOpen(false);
                    setIsAddingTracker(false);
                    setEditingTrackerId(null);
                  }}
                  className="p-1.5 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors"
                  title="Disconnect Control Panel"
                >
                  <X size={16} />
                </button>
              </div>

              {/* List and Form content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                {isAddingTracker || editingTrackerId ? (
                  <form onSubmit={handleSaveTracker} className="p-4 bg-black border border-white/5 rounded-lg space-y-4 shadow-inner">
                    <div className="text-[9px] font-black uppercase text-red-500 tracking-wider">
                      {editingTrackerId ? 'Modify Event Stream' : 'Initialize Event Stream'}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-gray-500 uppercase font-black">Event Title</label>
                      <input 
                        required
                        value={trackerForm.title}
                        onChange={(e) => setTrackerForm({ ...trackerForm, title: e.target.value })}
                        placeholder="e.g. ONE PIECE"
                        className="w-full bg-[#111] border border-white/10 rounded p-2 text-xs focus:border-red-600 outline-none text-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] text-gray-500 uppercase font-black tracking-wider block">Release Date / Time</label>
                      <input 
                        type="datetime-local"
                        required
                        value={trackerForm.release_date}
                        onChange={(e) => setTrackerForm({ ...trackerForm, release_date: e.target.value })}
                        className="w-full bg-[#111] border border-white/10 rounded p-2 text-xs focus:border-red-600 outline-none text-white font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] text-gray-500 uppercase font-black">Episode #</label>
                        <input 
                          type="number"
                          min="1"
                          value={trackerForm.episode}
                          onChange={(e) => setTrackerForm({ ...trackerForm, episode: Number(e.target.value) || 1 })}
                          className="w-full bg-[#111] border border-white/10 rounded p-2 text-xs focus:border-red-600 outline-none text-white font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] text-gray-500 uppercase font-black">Status/Phase</label>
                        <input 
                          value={trackerForm.platform}
                          onChange={(e) => setTrackerForm({ ...trackerForm, platform: e.target.value })}
                          placeholder="e.g. NEXT IN 2H"
                          className="w-full bg-[#111] border border-white/10 rounded p-2 text-xs focus:border-red-600 outline-none text-white font-mono"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsAddingTracker(false);
                          setEditingTrackerId(null);
                          setTrackerForm({ title: '', release_date: '', episode: 1, platform: 'OUT NOW' });
                        }}
                        className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest rounded transition-colors text-gray-400 font-mono text-[9px]"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 py-1.5 bg-[#FF0000] hover:bg-[#CC0000] text-white text-[9px] font-black uppercase tracking-widest rounded transition-all shadow-[0_0_15px_rgba(255,0,0,0.3)]"
                      >
                        Sync Stream
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTracker(true);
                      setTrackerForm({ title: '', release_date: '', episode: 1, platform: 'OUT NOW' });
                    }}
                    className="w-full py-2 bg-red-650/10 text-red-500 hover:text-white border border-red-600/20 hover:bg-red-600 transition-all text-[9.5px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-1.5 hover:shadow-[0_0_15px_rgba(255,0,0,0.2)]"
                  >
                    <Flame size={12} fill="currentColor text-[10px]" /> Initialize New Release
                  </button>
                )}

                {/* Items List */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Indexed Release Cycles</div>
                  {trackerReleases.length === 0 ? (
                    <div className="text-center p-10 border border-dashed border-white/5 rounded-lg text-gray-600 text-[10px] uppercase">
                      Zero indices active.
                    </div>
                  ) : (
                    trackerReleases.map((item) => (
                      <div key={item.id} className="p-3 bg-black border border-white/5 hover:border-red-600/20 rounded-lg group transition-all flex flex-col gap-2 relative overflow-hidden">
                        <div className="flex items-start justify-between">
                          <div className="max-w-[70%]">
                            <div className="text-xs font-bold text-white group-hover:text-red-500 transition-colors uppercase truncate">{item.title}</div>
                            <div className="text-[8px] text-gray-500 font-mono mt-0.5 uppercase">
                              EPISODE {item.episode || 1} • {item.platform || 'OUT NOW'}
                            </div>
                          </div>
                          <span className="text-[8px] bg-red-600/10 text-red-500 font-black px-1.5 py-0.5 rounded uppercase self-start leading-none tracking-widest">
                            {new Date(item.release_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </span>
                        </div>
                        
                        {/* Action Tools */}
                        <div className="flex justify-end gap-1.5 border-t border-white/5 pt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => {
                              const dateObj = new Date(item.release_date);
                              const tzOffset = dateObj.getTimezoneOffset() * 60000;
                              const localISODate = new Date(dateObj.getTime() - tzOffset).toISOString().slice(0, 16);
                              
                              setEditingTrackerId(item.id);
                              setTrackerForm({
                                title: item.title,
                                release_date: localISODate,
                                episode: item.episode || 1,
                                platform: item.platform || 'OUT NOW'
                              });
                            }}
                            className="px-2 py-0.5 hover:bg-white/5 rounded text-[8px] uppercase tracking-widest text-[#FF0000] hover:text-red-450 transition-colors font-black"
                          >
                            Modify
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTracker(item.id)}
                            className="px-2 py-0.5 hover:bg-red-600/10 rounded text-[8px] uppercase tracking-widest text-gray-600 hover:text-[#FF0000] transition-all font-black"
                          >
                            Purge
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </>
        )}
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
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/auth/verify" element={<EmailVerificationPage />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}
