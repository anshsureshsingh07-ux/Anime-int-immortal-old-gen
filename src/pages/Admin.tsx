import { useState } from 'react';
import { 
  Shield, UserCheck, Trash2, Plus, 
  FileText, Users, BarChart, Settings,
  AlertCircle, CheckCircle2, XCircle
} from 'lucide-react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";

export default function Admin() {
  const user = { 
    id: 'mock-user-id', 
    username: 'Admin User', 
    firstName: 'Admin', 
    emailAddresses: [{ emailAddress: 'admin@nexus.com' }] 
  };
  const dbUser: any = { role: 'admin' }; 
  
  const news: any[] = []; 
  const applications: any[] = []; 
  
  const createNews = useMutation(api?.news?.create as any || "news:create");
  const deleteNews = useMutation(api?.news?.remove as any || "news:remove");
  const updateAppStatus = useMutation(api?.applications?.updateStatus as any || "applications:updateStatus");

  const [activeTab, setActiveTab] = useState('news');

  // News Form
  const [newsForm, setNewsForm] = useState({
    title: '',
    description: '',
    category: 'Trending',
    image: '',
  });

  const isAdmin = dbUser && (dbUser.role === 'admin' || dbUser.role === 'news_writer' || dbUser.role === 'moderator');

  const postNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dbUser) return;
    try {
      await createNews({
        ...newsForm,
        authorId: user.id,
        authorName: user.username || user.firstName || 'Staff',
      });
      setNewsForm({ title: '', description: '', category: 'Trending', image: '' });
      alert('News published successfully!');
    } catch (err) {
      console.error('Post news error:', err);
    }
  };

  const handleAppStatus = async (appId: any, status: string) => {
    try {
      await updateAppStatus({ id: appId, status });
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  if (!dbUser && user) return <div className="p-20 text-center font-mono">Synchronizing with mainframe...</div>;
  if (!user) return <div className="p-20 text-center font-mono italic">Access Denied. Identity Not Detected.</div>;
  
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
          { id: 'apps', name: 'Applications', icon: UserCheck },
          { id: 'users', name: 'User Sector', icon: Users },
          { id: 'analytics', name: 'Neural Metrics', icon: BarChart },
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
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-gray-500">Hero Image URL</label>
                       <input 
                          value={newsForm.image}
                          onChange={e => setNewsForm({...newsForm, image: e.target.value})}
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none"
                          placeholder="https://..."
                       />
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
                    <button className="bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all">
                       Broadcast to Network
                    </button>
                 </form>
              </section>

              <section>
                 <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Recent Transmissions</h3>
                 <div className="space-y-4">
                    {news ? (
                      news.map(item => (
                        <div key={item._id} className="flex items-center justify-between p-4 cyber-card">
                          <div className="flex gap-4 items-center">
                              <img src={item.image} className="w-12 h-12 object-cover rounded" />
                              <div>
                                <h4 className="text-xs font-bold uppercase">{item.title}</h4>
                                <span className="text-[8px] font-mono text-gray-600 uppercase italic">{item.category} • {item.authorName}</span>
                              </div>
                          </div>
                          <button onClick={() => deleteNews({ id: item._id })} className="p-2 text-gray-700 hover:text-red-500 transition-colors">
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

         {activeTab === 'apps' && (
           <div className="space-y-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6">Pending Vanguard Applications</h3>
              {applications && applications.length > 0 ? (
                applications.map(app => (
                  <div key={app._id} className="cyber-card p-6 border-white/10">
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-4">
                          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${app.userId}`} className="w-12 h-12 rounded-full border border-white/10" />
                          <div>
                             <h4 className="text-sm font-black uppercase tracking-tighter italic">{app.name}</h4>
                             <span className="text-[10px] font-mono text-gray-500 uppercase">{app.userEmail}</span>
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
                          onClick={() => handleAppStatus(app._id, 'approved')}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600/20 text-green-500 border border-green-600/30 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all shadow-[0_0_15px_rgba(22,163,74,0.2)]"
                        >
                          <CheckCircle2 size={14} /> Approve Node
                        </button>
                        <button 
                          onClick={() => handleAppStatus(app._id, 'rejected')}
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
      </main>
    </div>
  );
}
