import { useState, useEffect } from 'react';
import { 
  Shield, UserCheck, Trash2, Plus, 
  FileText, Users, BarChart, Settings,
  AlertCircle, CheckCircle2, XCircle, Upload, Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const [session, setSession] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [anime, setAnime] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
    });

    fetchNews();
    fetchApplications();
    fetchUsers();
    fetchAnime();
    fetchReleases();
    fetchPolls();
    cleanupOldNews();
  }, []);

  const fetchAnime = async () => {
    const { data } = await supabase.from('anime').select('*').order('created_at', { ascending: false });
    if (data) setAnime(data);
  };

  const fetchReleases = async () => {
    const { data } = await supabase.from('release_tracker').select('*').order('release_date', { ascending: true });
    if (data) setReleases(data);
  };

  const fetchPolls = async () => {
    const { data } = await supabase.from('polls').select('*, poll_options(*)').order('created_at', { ascending: false });
    if (data) setPolls(data);
  };

  const cleanupOldNews = async () => {
    const ventiEightHoursAgo = new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('news')
      .delete()
      .lt('created_at', ventiEightHoursAgo);
    
    if (!error) fetchNews();
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setDbUser(data);
  };

  const fetchNews = async () => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    if (data) setNews(data);
  };

  const fetchApplications = async () => {
    const { data } = await supabase.from('applications').select('*').order('created_at', { ascending: false });
    if (data) setApplications(data);
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  const deleteNews = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transmission?')) return;
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (!error) fetchNews();
  };

  const deleteAnime = async (id: string) => {
    if (!confirm('Delete this anime from database?')) return;
    const { error } = await supabase.from('anime').delete().eq('id', id);
    if (!error) fetchAnime();
  };

  const deleteRelease = async (id: string) => {
    const { error } = await supabase.from('release_tracker').delete().eq('id', id);
    if (!error) fetchReleases();
  };

  const togglePoll = async (id: string, active: boolean) => {
    const { error } = await supabase.from('polls').update({ is_active: !active }).eq('id', id);
    if (!error) fetchPolls();
  };

  const updateAppStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('applications').update({ status }).eq('id', id);
    if (!error) fetchApplications();
  };

  const updateUserRole = async (id: string, role: string) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (!error) fetchUsers();
  };

  // Forms
  const [animeForm, setAnimeForm] = useState({ title: '', description: '', image: '', rating: 0, status: 'Completed', episodes: 1 });
  const [releaseForm, setReleaseForm] = useState({ title: '', release_date: '', episode: 1, platform: 'Nexus' });
  const [pollForm, setPollForm] = useState({ question: '', options: '' });

  const addAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('anime').insert([animeForm]);
    if (!error) {
      setAnimeForm({ title: '', description: '', image: '', rating: 0, status: 'Completed', episodes: 1 });
      fetchAnime();
    }
  };

  const addRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('release_tracker').insert([releaseForm]);
    if (!error) {
      setReleaseForm({ title: '', release_date: '', episode: 1, platform: 'Nexus' });
      fetchReleases();
    }
  };

  const addPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const options = pollForm.options.split(',').map(o => o.trim()).filter(o => o);
    
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert([{ question: pollForm.question }])
      .select()
      .single();

    if (poll && !pollError) {
      const optionInserts = options.map(text => ({ poll_id: poll.id, text }));
      const { error: optError } = await supabase.from('poll_options').insert(optionInserts);
      
      if (!optError) {
        setPollForm({ question: '', options: '' });
        fetchPolls();
      }
    }
  };

  // Mock user for local development if session missing
  const user = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    username: dbUser?.username || session.user.email?.split('@')[0],
  } : {
    id: 'mock-user-id',
    username: 'Admin User',
    email: 'admin@nexus.com'
  };

  const currentDbUser = dbUser || { role: 'admin' };

  const [activeTab, setActiveTab] = useState('news');

  // News Form
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    description: '',
    category: 'Trending',
    image: '',
  });

  const isAdmin = (currentDbUser && (currentDbUser.role === 'admin' || currentDbUser.role === 'news_writer' || currentDbUser.role === 'moderator')) || 
                  (session?.user?.email === 'anshsureshsingh07@gmail.com' || session?.user?.email === 'animeintofficial@gmail.com');

  const postNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      setFormError('Authentication required. Session not found.');
      return;
    }
    
    setLoading(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      let imageUrl = newsForm.image;

      if (imageFile) {
        setUploading(true);
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('news')
          .upload(filePath, imageFile);

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('news')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('news').insert([
        {
          ...newsForm,
          image: imageUrl,
          author_id: session.user.id,
          author_name: dbUser?.username || session.user.email?.split('@')[0] || 'Vanguard Agent',
          created_at: new Date().toISOString()
        }
      ]);
      if (error) throw error;
      setNewsForm({ title: '', description: '', category: 'Trending', image: '' });
      setImageFile(null);
      setFormSuccess(true);
      fetchNews();
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (err: any) {
      console.error('Post news error:', err);
      setFormError(err.message || 'Failed to transmit news to network.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppStatus = async (appId: string, status: string, userId: string, role: string) => {
    try {
      await updateAppStatus(appId, status);
      if (status === 'approved') {
        const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
        if (error) console.error('Role promotion failed:', error);
        fetchUsers();
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  if (loading && session && !dbUser) return <div className="p-20 text-center font-mono">Synchronizing with mainframe...</div>;
  
  if (!isAdmin) return (
    <div className="max-w-2xl mx-auto px-8 py-40 text-center">
       <AlertCircle size={64} className="mx-auto text-red-600 mb-8" />
       <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 italic">Access <span className="text-red-500">Denied</span></h1>
       <p className="text-gray-500 font-mono text-sm uppercase tracking-widest">Neural clearance level insufficient. Sector restricted.</p>
       <div className="mt-12 h-1 bg-white/5 rounded-full overflow-hidden">
         <div className="w-[15%] h-full bg-red-600 animate-pulse"></div>
       </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-12">
      <aside className="w-full md:w-64 space-y-2">
        <h2 className="text-xs font-black tracking-widest uppercase text-red-600 mb-10 pl-2">Admin <span className="text-white">Mainframe</span></h2>
        {[
          { id: 'news', name: 'News Manager', icon: FileText },
          { id: 'anime', name: 'Anime Database', icon: BarChart },
          { id: 'releases', name: 'Release Tracker', icon: Clock },
          { id: 'polls', name: 'Community Polls', icon: BarChart },
          { id: 'apps', name: 'Applications', icon: UserCheck },
          { id: 'users', name: 'User Sector', icon: Users },
          { id: 'settings', name: 'System Config', icon: Settings },
        ].map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === item.id ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={16} /> {item.name}
          </button>
        ))}
      </aside>

      <main className="flex-1 space-y-12">
         {activeTab === 'news' && (
           <div className="space-y-12">
              <section className="cyber-card p-8 bg-black/40 border-dashed border-white/20">
                 <h3 className="text-xl font-black italic tracking-tighter uppercase mb-8 flex items-center gap-2">
                    <Plus className="text-red-600" /> Transmit <span className="text-red-500">News</span>
                 </h3>
                 <form onSubmit={postNews} className="space-y-6">
                    {formError && (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-center gap-3 text-red-500 text-xs font-mono mb-6">
                        <XCircle size={16} />
                        DETECTION ERROR: {formError}
                      </div>
                    )}
                    {formSuccess && (
                      <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex items-center gap-3 text-green-500 text-xs font-mono mb-6">
                        <CheckCircle2 size={16} />
                        TRANSMISSION SUCCESSFUL: News data synchronized.
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500">Article Title</label>
                          <input 
                             required
                             value={newsForm.title}
                             onChange={e => setNewsForm({...newsForm, title: e.target.value})}
                             className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500">Category</label>
                          <select 
                             value={newsForm.category}
                             onChange={e => setNewsForm({...newsForm, category: e.target.value})}
                             className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none"
                          >
                             <option>Trending</option>
                             <option>Anime</option>
                             <option>Manga</option>
                             <option>Recruitment</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500">Image Asset Upload</label>
                          <div className="flex gap-4">
                            <label className="flex-1 cursor-pointer">
                              <div className="w-full bg-[#0a0a0a] border border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-red-600/50 transition-all">
                                <Upload className={uploading ? "animate-bounce text-red-600" : "text-gray-600"} size={24} />
                                <span className="text-[10px] font-mono uppercase text-gray-500">
                                  {imageFile ? imageFile.name : uploading ? "Uploading to Cloud..." : "Select File (PNG/JPG)"}
                                </span>
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                />
                              </div>
                            </label>
                            {imageFile && (
                              <div className="w-24 h-24 bg-black rounded-lg border border-white/10 overflow-hidden relative group">
                                <img src={URL.createObjectURL(imageFile)} className="w-full h-full object-cover" />
                                <button 
                                  type="button"
                                  onClick={() => setImageFile(null)}
                                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={16} className="text-red-500" />
                                </button>
                              </div>
                            )}
                          </div>
                       </div>
                       
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500">OR Remote Asset URL</label>
                          <input 
                              value={newsForm.image}
                              onChange={e => setNewsForm({...newsForm, image: e.target.value})}
                              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none"
                              placeholder="https://..."
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-500">Content Matrix</label>
                       <textarea 
                          required
                          value={newsForm.description}
                          onChange={e => setNewsForm({...newsForm, description: e.target.value})}
                          rows={5}
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none resize-none"
                       />
                    </div>
                    <button className="bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all text-white">
                       Broadcast to Network
                    </button>
                 </form>
              </section>

              <section>
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 italic">Incoming Transmissions <span className="text-red-600">(28H TTL)</span></h3>
                    <button 
                      onClick={cleanupOldNews}
                      className="text-[8px] font-mono uppercase bg-red-600/10 text-red-500 px-3 py-1 rounded border border-red-500/20 flex items-center gap-1 hover:bg-red-600 hover:text-white transition-all"
                    >
                      <Clock size={10} /> Purge Expired
                    </button>
                 </div>
                 <div className="space-y-4">
                    {news ? (
                      news.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 cyber-card hover:bg-white/[0.02] transition-all group">
                          <div className="flex gap-4 items-center">
                              <div className="w-16 h-12 overflow-hidden rounded border border-white/10 relative">
                                <img src={item.image} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold uppercase text-white group-hover:text-red-500 transition-colors">{item.title}</h4>
                                <span className="text-[8px] font-mono text-gray-600 uppercase italic">{item.category} • {item.author_name}</span>
                              </div>
                          </div>
                          <button onClick={() => deleteNews(item.id)} className="p-2 text-gray-700 hover:text-red-500 transition-all transform hover:scale-110">
                              <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-gray-600 font-mono text-xs italic">Syncing with news node...</div>
                    )}
                 </div>
              </section>
           </div>
         )}

         {activeTab === 'anime' && (
            <div className="space-y-12">
               <section className="cyber-card p-8 bg-black/40 border-dashed border-white/20">
                  <h3 className="text-xl font-black italic tracking-tighter uppercase mb-8 flex items-center gap-2">
                     <Plus className="text-red-600" /> New <span className="text-red-500">Database Entry</span>
                  </h3>
                  <form onSubmit={addAnime} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Title</label>
                        <input required value={animeForm.title} onChange={e => setAnimeForm({...animeForm, title: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Image URL</label>
                        <input required value={animeForm.image} onChange={e => setAnimeForm({...animeForm, image: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Rating (0-10)</label>
                        <input type="number" step="0.1" value={animeForm.rating} onChange={e => setAnimeForm({...animeForm, rating: parseFloat(e.target.value)})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Status</label>
                        <select value={animeForm.status} onChange={e => setAnimeForm({...animeForm, status: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none">
                          <option>Airing</option>
                          <option>Completed</option>
                          <option>Upcoming</option>
                        </select>
                      </div>
                    </div>
                    <button className="bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all text-white">
                       Sync with Database
                    </button>
                  </form>
               </section>

               <section>
                 <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6 italic">Database Nodes</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {anime.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 cyber-card">
                        <div className="flex gap-4 items-center">
                          <img src={item.image} className="w-10 h-14 object-cover rounded border border-white/10" />
                          <div>
                            <h4 className="text-xs font-bold uppercase">{item.title}</h4>
                            <span className="text-[8px] font-mono text-gray-600 uppercase">{item.status} • {item.rating}★</span>
                          </div>
                        </div>
                        <button onClick={() => deleteAnime(item.id)} className="p-2 text-gray-700 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                 </div>
               </section>
            </div>
          )}

          {activeTab === 'releases' && (
            <div className="space-y-12">
              <section className="cyber-card p-8 bg-black/40 border-dashed border-white/20">
                <h3 className="text-xl font-black italic tracking-tighter uppercase mb-8 flex items-center gap-2">
                  <Plus className="text-red-600" /> New <span className="text-red-500">Release Event</span>
                </h3>
                <form onSubmit={addRelease} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500">Anime Title</label>
                      <input required value={releaseForm.title} onChange={e => setReleaseForm({...releaseForm, title: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500">Release Date/Time</label>
                      <input type="datetime-local" required value={releaseForm.release_date} onChange={e => setReleaseForm({...releaseForm, release_date: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none text-white" />
                    </div>
                  </div>
                  <button className="bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all text-white">
                    Initialize Tracker
                  </button>
                </form>
              </section>

              <section>
                <div className="space-y-4">
                  {releases.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 cyber-card border-white/5">
                      <div className="flex gap-6 items-center">
                        <Clock size={16} className="text-red-600" />
                        <div>
                          <h4 className="text-xs font-bold uppercase">{item.title}</h4>
                          <span className="text-[8px] font-mono text-gray-600 uppercase italic">ETA: {new Date(item.release_date).toLocaleString()}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteRelease(item.id)} className="p-2 text-gray-700 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'polls' && (
            <div className="space-y-12">
              <section className="cyber-card p-8 bg-black/40 border-dashed border-white/20">
                <h3 className="text-xl font-black italic tracking-tighter uppercase mb-8 flex items-center gap-2">
                  <Plus className="text-red-600" /> New <span className="text-red-500">Direct Poll</span>
                </h3>
                <form onSubmit={addPoll} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Question</label>
                    <input required value={pollForm.question} onChange={e => setPollForm({...pollForm, question: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Options (Comma separated)</label>
                    <input required value={pollForm.options} onChange={e => setPollForm({...pollForm, options: e.target.value})} placeholder="Option 1, Option 2, Option 3" className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none" />
                  </div>
                  <button className="bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all text-white">
                    Initiate Consensus
                  </button>
                </form>
              </section>

              <section>
                <div className="space-y-4">
                  {polls.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 cyber-card">
                      <div>
                        <h4 className="text-xs font-bold uppercase">{item.question}</h4>
                        <span className="text-[8px] font-mono text-gray-600 uppercase">Status: {item.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => togglePoll(item.id, item.is_active)} className="text-[8px] font-mono uppercase bg-white/5 px-2 py-1 rounded">
                          {item.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

         {activeTab === 'apps' && (
           <div className="space-y-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Pending Vanguard Applications</h3>
              {applications && applications.length > 0 ? (
                applications.map(app => (
                  <div key={app.id} className="cyber-card p-6 border-white/10">
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-4">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${app.user_id}`} className="w-12 h-12 rounded-full border border-white/10" />
                          <div>
                             <h4 className="text-sm font-black uppercase tracking-tighter italic">{app.name}</h4>
                             <span className="text-[10px] font-mono text-gray-500 uppercase">{app.user_email}</span>
                          </div>
                       </div>
                       <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                         app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                         app.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                         'bg-red-500/10 text-red-500'
                       }`}>
                         {app.status}
                       </div>
                    </div>

                    <div className="grid grid-cols-4 gap-6 mb-8 text-[10px] uppercase font-mono">
                       <div><span className="text-gray-600">Role</span><br/><span className="text-red-500">{app.role}</span></div>
                       <div><span className="text-gray-600">Discord</span><br/><span className="text-white">{app.discord}</span></div>
                       <div><span className="text-gray-600">Age</span><br/><span className="text-white">{app.age}</span></div>
                       <div><span className="text-gray-600">Availability</span><br/><span className="text-white">{app.availability}</span></div>
                    </div>

                    <div className="space-y-4 mb-8">
                       <div>
                          <h5 className="text-[8px] font-black uppercase text-gray-600 mb-1">Skill Matrix</h5>
                          <p className="text-xs text-gray-400 italic">"{app.skills}"</p>
                       </div>
                       <div>
                          <h5 className="text-[8px] font-black uppercase text-gray-600 mb-1">Bio/Experience</h5>
                          <p className="text-xs text-gray-400 italic">"{app.experience}"</p>
                       </div>
                    </div>

                    {app.status === 'pending' && (
                      <div className="flex gap-4 pt-6 border-t border-white/5">
                        <button 
                          onClick={() => handleAppStatus(app.id, 'approved', app.user_id, app.role)}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 text-green-500 border border-green-600/30 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-[0_0_15px_rgba(22,163,74,0.2)]"
                        >
                          <CheckCircle2 size={14} /> Approve Node
                        </button>
                        <button 
                          onClick={() => handleAppStatus(app.id, 'rejected', app.user_id, app.role)}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-600/20 text-red-500 border border-red-600/30 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                        >
                          <XCircle size={14} /> Sever Link
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : !applications ? (
                <div className="p-12 text-center text-gray-600 font-mono text-xs italic">Awaiting neural applications...</div>
              ) : (
                <div className="p-12 text-center border-dashed border-white/5 border rounded-3xl opacity-20">
                   <Users className="mx-auto mb-4" />
                   <span className="font-mono text-xs uppercase tracking-widest">No applicants detected</span>
                </div>
              )}
           </div>
         )}

         {activeTab === 'users' && (
           <div className="space-y-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Node Directory (User Access)</h3>
              <div className="cyber-card p-6 bg-black/40 border-white/5 overflow-x-auto">
                 <table className="w-full text-left font-mono text-[10px] uppercase">
                    <thead>
                       <tr className="border-b border-white/10 text-gray-600">
                          <th className="py-2">User Node</th>
                          <th className="py-2">Rank/Role</th>
                          <th className="py-2">Clearance</th>
                          <th className="py-2">Action</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {users.map(u => (
                          <tr key={u.id} className="text-gray-300">
                             <td className="py-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 bg-red-600/20 rounded border border-red-600/30 flex items-center justify-center text-red-500">
                                      {u.role?.[0]?.toUpperCase() || 'M'}
                                   </div>
                                   <div>
                                      <div className="font-bold text-white tracking-tighter italic">{u.username || 'ANON_NODE'}</div>
                                      <div className="text-[8px] text-gray-600">{u.email || u.id.substring(0, 16)}...</div>
                                   </div>
                                </div>
                             </td>
                             <td className="py-4">
                                <span className={u.role === 'admin' ? 'text-red-500' : 'text-gray-500'}>
                                   {u.role || 'member'}
                                </span>
                             </td>
                             <td className="py-4">
                                <div className="flex gap-1">
                                   {[1, 2, 3, 4, 5].map(i => (
                                      <div key={i} className={`w-2 h-1 rounded-full ${i <= (u.role === 'admin' ? 5 : u.role === 'moderator' ? 4 : 1) ? 'bg-red-600' : 'bg-gray-800'}`} />
                                   ))}
                                </div>
                             </td>
                             <td className="py-4">
                                <select 
                                   className="bg-black border border-white/10 p-1 rounded text-[8px] text-white"
                                   value={u.role || 'member'}
                                   onChange={(e) => updateUserRole(u.id, e.target.value)}
                                >
                                   <option value="member">MEMBER</option>
                                   <option value="news_writer">WRITER</option>
                                   <option value="moderator">MODERATOR</option>
                                   <option value="admin">ADMIN</option>
                                </select>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
         )}
      </main>
    </div>
  );
}
