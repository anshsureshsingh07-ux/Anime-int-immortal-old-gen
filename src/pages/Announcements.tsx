import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, User, ArrowLeft, Search, Filter, BellRing, Hourglass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { playDigitalSound } from '../lib/sounds';

export default function Announcements() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Trending', 'Anime', 'Manga', 'Recruitment', 'BREAKING'];

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      // Fetching FULL list of news from the public.news table (no 28H buffer threshold)
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setNews(data);
      }
    } catch (err) {
      console.warn("Failed fetching full announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredNews = news.filter(item => {
    // Hide future scheduled items from the standard feed until released
    if (new Date(item.created_at) > new Date()) {
      return false;
    }
    const matchesSearch = 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="announcements-container" className="max-w-7xl mx-auto px-6 md:px-10 py-12 min-h-screen text-white">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
        <div className="space-y-4">
          <Link id="back-to-nexus-btn" to="/" onClick={() => playDigitalSound('click')} className="text-[10px] font-mono text-gray-500 uppercase hover:text-red-500 flex items-center gap-2 transition-all">
            <ArrowLeft size={12} /> Back to Nexus
          </Link>
          <h1 id="announcements-title" className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.8] text-white">
            MAINFRAME <span className="text-red-500">ANNOUNCEMENTS</span>
          </h1>
          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-ping" />
            <span className="text-zinc-400">Total Persistent Broadcast Ledger ({news.length} Records)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-500 transition-colors" size={16} />
            <input 
              id="announcement-search"
              type="text" 
              placeholder="Filter Ledger..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 text-xs font-mono focus:border-red-600 outline-none transition-all placeholder:text-gray-700 text-white"
            />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div id="category-filter-bar" className="flex items-center gap-3 overflow-x-auto pb-4 mb-12 no-scrollbar border-b border-white/5">
        <Filter size={14} className="text-red-600 min-w-4" />
        {categories.map(cat => (
          <button
            id={`filter-btn-${cat}`}
            key={cat}
            onClick={() => {
              playDigitalSound('click');
              setActiveCategory(cat);
            }}
            className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeCategory === cat 
                ? 'bg-red-600 border-red-600 text-white' 
                : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/30'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div id="loading-state" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white/5 aspect-video md:aspect-[4/5] rounded-[2rem] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredNews.length > 0 ? (
        <div id="announcements-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredNews.map((item, idx) => (
            <motion.div 
              id={`announcement-card-${item.id}`}
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group flex flex-col h-full bg-[#0d0d0d]/40 border border-white/5 hover:border-red-600/30 rounded-[2rem] overflow-hidden p-6 hover-pulse transition-all duration-300 relative"
            >
              <Link to={`/news/${item.id}`} onClick={() => playDigitalSound('click')} className="flex flex-col h-full justify-between">
                <div>
                  <div className="relative aspect-video rounded-3xl overflow-hidden mb-6 bg-black border border-white/5">
                    <img 
                      src={item.image_url || item.image || "/assets/vanguard-fallback.jpg"} 
                      referrerPolicy="no-referrer"
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60" />
                    
                    <div className="absolute top-4 left-4">
                      <span className="bg-red-600 text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-red-500 transition-colors leading-tight italic uppercase tracking-tighter mb-4">
                    {item.title}
                  </h3>
                  
                  <p className="text-xs text-gray-400 font-sans line-clamp-3 leading-relaxed mb-6">
                    {item.description ? item.description.replace(/<!--NEXUS_META:(.*?)-->/, '').replace(/\[VERIFIED_DIGITAL_SEAL_SIGNATURE:[^\]]+\]/, '').trim() : "No detailed transmission content provided."}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center overflow-hidden">
                      {item.author_id ? (
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author_id}`} alt="Author Avatar" className="w-full h-full" />
                      ) : (
                        <User size={12} className="text-red-500" />
                      )}
                    </div>
                    <span className="text-[9px] uppercase font-bold text-gray-500 tracking-widest truncate max-w-28">{item.author_name || 'Vanguard'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 text-[9px] font-mono whitespace-nowrap">
                    <Calendar size={10} /> {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' })}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div id="empty-state" className="flex flex-col items-center justify-center p-20 neural-glass border border-white/5 rounded-3xl text-center space-y-4">
          <Hourglass className="text-red-600 size-12 animate-spin-slow" />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">No Announcements Logged</h2>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Search query returned zero matching nodes in ledger index.</p>
        </div>
      )}
    </div>
  );
}
