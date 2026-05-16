import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Flame, TrendingUp, Calendar, Play, ChevronRight, MessageSquare, Heart } from 'lucide-react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from 'react-router-dom';

export default function Home() {
  // Temporary fix for browser sync issues
  const news: any[] = []; // useQuery(api.news.list, { limit: 6 });
  const [featuredAnime, setFeaturedAnime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Fetch Trending Anime from Jikan API
    fetch('https://api.jikan.moe/v4/top/anime?limit=10&filter=airing')
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setFeaturedAnime(data.data || []);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          console.error('Fetch error:', err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="p-8 grid grid-cols-12 gap-8">
      {/* Left Column: News & Feed */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
        <div className="relative h-80 w-full rounded-xl overflow-hidden group border border-[#1F1F1F]">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1541562232579-512a21360020?auto=format&fit=crop&q=80&w=2670" 
            alt="Featured" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 brightness-75"
          />
          <div className="absolute top-6 left-6 z-20 flex gap-2">
            <span className="bg-[#FF0000] text-white text-[10px] font-black px-2 py-1 uppercase rounded">Breaking</span>
            <span className="bg-black/60 text-white text-[10px] font-black px-2 py-1 uppercase rounded backdrop-blur-md">Featured</span>
          </div>
          <div className="absolute bottom-8 left-8 right-8 z-20">
            <h2 className="text-3xl font-black text-white leading-tight uppercase italic drop-shadow-lg">
              Anime Spring 2026 <br/>Production Cycles Accelerated
            </h2>
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-300 font-medium">
              <span>Studio Mappa</span>
              <span className="text-[#FF0000]">•</span>
              <span>Archives Q1</span>
              <span className="text-[#FF0000]">•</span>
              <span>Action, Cyberpunk</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 mb-2 border-b border-[#1F1F1F] pb-2">
           <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
             <TrendingUp size={14} className="text-[#FF0000]" /> Intelligence <span className="text-[#FF0000]">Feed</span>
           </h2>
           <Link to="/news" className="text-[10px] font-mono text-gray-600 uppercase hover:text-[#FF0000] flex items-center gap-1 transition-colors">
              View All <ChevronRight size={12} />
           </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news && news.length > 0 ? (
            news.map((item, idx) => (
              <motion.div 
                key={item._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#111] p-4 rounded-xl border border-[#1F1F1F] hover:border-[#333] transition-all group"
              >
                <div className="h-32 w-full bg-[#1A1A1A] rounded-lg overflow-hidden mb-3 relative">
                  <img src={item.image || undefined} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  <div className="absolute top-2 left-2">
                    <span className="bg-black/80 text-[8px] font-bold text-[#FF0000] px-1.5 py-0.5 rounded uppercase tracking-tighter shadow-xl">
                      {item.category}
                    </span>
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white mt-1 group-hover:text-[#FF0000] transition-colors line-clamp-1">{item.title}</h3>
                <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 font-mono leading-relaxed">
                  {item.description}
                </p>
                <div className="mt-4 pt-3 border-t border-[#1F1F1F] flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-[#555]">
                   <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(item._creationTime).toLocaleDateString()}</span>
                   <div className="flex items-center gap-1">
                      <img src={item.authorId ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.authorId}` : undefined} className="w-4 h-4 rounded-full" />
                      <span className="text-gray-400">{item.authorName}</span>
                   </div>
                </div>
              </motion.div>
            ))
          ) : !news ? (
             [1,2,3,4].map(i => (
              <div key={i} className="bg-[#111] p-4 rounded-xl border border-[#1F1F1F] animate-pulse">
                <div className="h-32 w-full bg-[#1A1A1A] rounded-lg mb-3"></div>
                <div className="h-4 w-3/4 bg-[#1A1A1A] rounded mb-2"></div>
                <div className="h-3 w-full bg-[#1A1A1A] rounded mb-1"></div>
                <div className="h-3 w-5/6 bg-[#1A1A1A] rounded"></div>
              </div>
             ))
          ) : (
            <div className="col-span-full p-12 text-center text-gray-500 font-mono text-xs uppercase tracking-widest">
              No news detected in system archives
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Trending & Stats */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <section className="bg-[#111] rounded-xl border border-[#1F1F1F] p-5">
          <h3 className="text-xs font-black uppercase tracking-widest text-white mb-6 border-b border-[#1F1F1F] pb-3 flex justify-between items-center">
            <span className="flex items-center gap-2"><Flame size={14} className="text-[#FF0000]" /> Trending Now</span>
            <Link to="/database" className="text-[10px] text-[#FF0000] hover:underline">Full Database</Link>
          </h3>
          <div className="space-y-5">
            {featuredAnime.slice(0, 6).map((anime, idx) => (
              <motion.div 
                key={`${anime.mal_id}-${idx}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-3 group cursor-pointer"
              >
                <span className="text-xl font-black text-[#FF0000]/20 group-hover:text-[#FF0000] transition-colors italic w-6">0{idx + 1}</span>
                <img src={anime.images.jpg.image_url || undefined} className="w-10 h-14 bg-[#1A1A1A] rounded object-cover border border-[#222]" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white group-hover:text-[#FF0000] transition-colors truncate">{anime.title}</div>
                  <div className="text-[10px] text-gray-500 uppercase font-mono truncate">{anime.studios?.[0]?.name || 'Studio'} • {anime.type}</div>
                </div>
                <div className="ml-auto text-[10px] text-green-500 font-bold font-mono">+{Math.floor(Math.random() * 20)}%</div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="bg-[#111] rounded-xl border border-[#1F1F1F] p-5">
           <h3 className="text-xs font-black uppercase tracking-widest text-[#FF0000] mb-4 flex items-center gap-2">
             <MessageSquare size={14} /> Community Poll
           </h3>
           <div className="space-y-4">
              <p className="text-xs text-gray-400 font-medium">Most anticipated Spring 2026 sequel?</p>
              <div className="space-y-3">
                 <div className="relative h-10 w-full bg-[#050505] border border-[#1F1F1F] rounded flex items-center px-3 group cursor-pointer overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-[#FF0000]/10 w-[65%] group-hover:bg-[#FF0000]/20 transition-all"></div>
                    <span className="relative z-10 text-[10px] font-bold text-white italic uppercase tracking-tighter">Cyber-Node: Origins</span>
                    <span className="relative z-10 ml-auto text-[10px] font-mono text-[#FF0000] font-black">65%</span>
                 </div>
                 <div className="relative h-10 w-full bg-[#050505] border border-[#1F1F1F] rounded flex items-center px-3 group cursor-pointer overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-[#FF0000]/10 w-[35%] group-hover:bg-[#FF0000]/20 transition-all"></div>
                    <span className="relative z-10 text-[10px] font-bold text-white italic uppercase tracking-tighter">Mecha Soul 2</span>
                    <span className="relative z-10 ml-auto text-[10px] font-mono text-[#FF0000] font-black">35%</span>
                 </div>
              </div>
           </div>
        </section>

        <div className="p-6 bg-gradient-to-br from-[#1A0000] to-[#050505] border border-[#FF0000]/20 rounded-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-2 opacity-5">
              <Flame size={80} />
           </div>
           <p className="text-[9px] text-[#FF0000] font-black uppercase tracking-[0.3em] mb-3">Vanguard Ops</p>
           <h4 className="text-sm font-bold text-white mb-4 leading-tight">Join the news writing team to gain early access to archives.</h4>
           <Link to="/recruit" className="inline-block px-4 py-2 bg-[#FF0000] text-white text-[10px] font-black uppercase tracking-widest rounded hover:bg-[#CC0000] transition-colors">Apply Node</Link>
        </div>
      </div>
    </div>
  );
}
