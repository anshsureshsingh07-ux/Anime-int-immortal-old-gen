import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, User, ArrowLeft, Clock, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function News() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Trending', 'Anime', 'Manga', 'Recruitment'];

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    const twentyEightHoursAgo = new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('news')
      .select('*')
      .gte('created_at', twentyEightHoursAgo)
      .order('created_at', { ascending: false });
    
    if (data) setNews(data);
    setLoading(false);
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-16">
        <div className="space-y-4">
          <Link to="/" className="text-[10px] font-mono text-gray-500 uppercase hover:text-red-500 flex items-center gap-2 transition-all">
            <ArrowLeft size={12} /> Back to Nexus
          </Link>
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-[0.8]">
            Neural <span className="text-red-500">Broadcaster</span>
          </h1>
          <div className="text-xs font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            Live stream archives (28H Buffer)
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-red-500 transition-colors" size={16} />
              <input 
                type="text" 
                placeholder="Search Transmission..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 text-xs font-mono focus:border-red-600 outline-none transition-all placeholder:text-gray-700"
              />
           </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-12 no-scrollbar border-b border-white/5">
         <Filter size={14} className="text-red-600 min-w-4" />
         {categories.map(cat => (
           <button
             key={cat}
             onClick={() => setActiveCategory(cat)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white/5 aspect-video md:aspect-[4/5] rounded-[2rem] border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredNews.map((item, idx) => (
            <motion.div 
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group"
            >
              <Link to={`/news/${item.id}`}>
                <div className="relative aspect-video rounded-[2rem] overflow-hidden border border-white/5 bg-[#0a0a0a] group-hover:border-red-600/50 transition-all duration-500 shadow-2xl">
                  <img 
                    src={item.image} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                  
                  <div className="absolute top-6 left-6">
                    <span className="bg-red-600 text-white text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-[0_4px_10px_rgba(0,0,0,0.5)]">
                      {item.category}
                    </span>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-xl font-bold text-white group-hover:text-red-500 transition-colors leading-tight italic uppercase tracking-tighter line-clamp-2">
                       {item.title}
                    </h3>
                  </div>
                </div>
              </Link>
              
              <div className="mt-6 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-600/10 border border-red-600/20 flex items-center justify-center">
                    {item.author_id ? (
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author_id}`} className="w-full h-full rounded-full" />
                    ) : (
                      <User size={14} className="text-red-500" />
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-black text-gray-500 tracking-widest">{item.author_name}</span>
                </div>
                <div className="flex items-center gap-4 text-gray-600 text-[10px] font-mono">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-40 bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
          <Search size={48} className="mx-auto text-gray-800 mb-6" />
          <h3 className="text-xl font-black uppercase text-gray-600 tracking-widest italic mb-2">No Transmissions Found</h3>
          <p className="text-gray-500 font-mono text-[10px] uppercase tracking-[0.2em]">Try adjusting your search filters if available.</p>
          <button 
            onClick={() => { setSearchQuery(''); setActiveCategory('All'); }}
            className="mt-8 text-red-500 text-[10px] font-black uppercase tracking-widest hover:underline"
          >
            Clear All Node Links
          </button>
        </div>
      )}

      {/* Mobile Footer Spacing */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
