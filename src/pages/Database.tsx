import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Play, Star, Calendar, Grid, List as ListIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { searchFallback, FALLBACK_TOP } from '../lib/jikanFallback';

export default function AnimeDatabase() {
  const [animeList, setAnimeList] = useState<any[]>([]);
  const [localAnime, setLocalAnime] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('bypopularity');

  const fetchLocalAnime = async () => {
    const { supabase } = await import('../lib/supabase');
    const { data } = await supabase.from('anime').select('*').order('created_at', { ascending: false });
    if (data) setLocalAnime(data);
  };

  useEffect(() => {
    fetchLocalAnime();
  }, []);

  const fetchAnime = async (query = '', p = 1, signal?: AbortSignal, retries = 2): Promise<void> => {
    setLoading(true);
    
    // Primarily use Jikan for the catalog as it's a massive external dataset
    const url = query 
      ? `https://api.jikan.moe/v4/anime?q=${query}&page=${p}&limit=24`
      : `https://api.jikan.moe/v4/top/anime?filter=${filter}&page=${p}&limit=24`;
    try {
      const res = await fetch(url, { signal });
      
      if (!res.ok) {
        if (res.status === 429 && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchAnime(query, p, signal, retries - 1);
        }
        throw new Error(`Jikan status: ${res.status}`);
      }

      const data = await res.json();
      
      if (signal?.aborted) return;

      if (data.data) {
        if (p === 1) {
          setAnimeList(data.data || []);
        } else {
          setAnimeList(prev => {
            const newItems = data.data || [];
            const existingIds = new Set(prev.map(a => a.mal_id));
            const filteredNewItems = newItems.filter((a: any) => !existingIds.has(a.mal_id));
            return [...prev, ...filteredNewItems];
          });
        }
        setHasMore(data.pagination?.has_next_page);
      }
    } catch (innerErr: any) {
      if (innerErr.name !== 'AbortError') {
        console.warn('Jikan fetch error, loading offline database fallback:', innerErr);
        if (p === 1) {
          const fallbackData = query ? searchFallback(query) : FALLBACK_TOP;
          setAnimeList(fallbackData);
          setHasMore(false);
        }
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchAnime(searchQuery, page, controller.signal);
    return () => controller.abort();
  }, [page]);

  useEffect(() => {
    if (page === 1) {
      const controller = new AbortController();
      fetchAnime(searchQuery, 1, controller.signal);
      return () => controller.abort();
    } else {
      setPage(1);
    }
  }, [searchQuery, filter]);

  return (
    <div className="p-8">
      <header className="mb-8 border-b border-[#1F1F1F] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Archives</h1>
          <p className="text-xs text-gray-500 font-mono mt-1 uppercase tracking-widest">Global Intelligence Database [LOADED]</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Search database..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] border border-[#1F1F1F] rounded-lg py-2 px-10 text-xs focus:outline-none focus:border-[#FF0000] font-mono"
            />
            <Search className="absolute left-3 top-2.5 text-gray-600" size={14} />
          </div>
          
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-[#111] border border-[#1F1F1F] text-xs font-mono text-gray-400 p-2 rounded-lg outline-none uppercase"
          >
            <option value="bypopularity">Popularity</option>
            <option value="airing">Airing Now</option>
            <option value="upcoming">Upcoming</option>
            <option value="favorite">Top Rated</option>
          </select>
        </div>
      </header>

      {/* Spring Archives Spotlight (April & May Ingest) */}
      {!searchQuery && page === 1 && (
        <section className="mb-12 bg-gradient-to-r from-red-950/20 via-[#0a0a0a] to-[#050505] border border-red-900/10 p-6 md:p-8 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-sm font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Calendar size={13} className="text-red-500 animate-pulse" /> 🌸 SPRING ARCHIVES: APRIL/MAY SEASONAL ARRIVALS
              </h2>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Newly verified high-priority tactical story records</p>
            </div>
            <span className="text-[8px] font-mono text-red-600 uppercase tracking-widest bg-red-600/10 px-2.5 py-0.5 rounded border border-red-500/20">Status: Fully Indexed</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {[
              { id: "52588", title: "Kaiju No. 8", release: "April 13th", score: "8.38", desc: "Aired Spring", image: "https://cdn.myanimelist.net/images/anime/1066/141873.jpg" },
              { id: "55701", title: "Demon Slayer: Hashira", release: "May 12th", score: "8.45", desc: "Training Arc", image: "https://cdn.myanimelist.net/images/anime/1199/142340.jpg" },
              { id: "54390", title: "Wind Breaker", release: "April 5th", score: "8.12", desc: "CloverWorks", image: "https://cdn.myanimelist.net/images/anime/1660/141444.jpg" },
              { id: "52616", title: "Konosuba Season 3", release: "April 10th", score: "8.48", desc: "Comedy Fantasy", image: "https://cdn.myanimelist.net/images/anime/1655/141427.jpg" },
              { id: "55252", title: "My Hero Acad. 7", release: "May 4th", score: "8.21", desc: "Bones Studio", image: "https://cdn.myanimelist.net/images/anime/1908/142491.jpg" }
            ].map((spr) => (
              <motion.div 
                key={spr.id}
                whileHover={{ y: -4 }}
                className="bg-black/60 border border-white/5 hover:border-red-600/30 rounded-xl overflow-hidden p-2.5 transition-all duration-300 group cursor-pointer"
              >
                <Link to={`/anime/${spr.id}`}>
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden mb-2.5">
                    <img 
                      src={spr.image} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      alt={spr.title} 
                      onError={(e) => {
                        // fallback image
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=300";
                      }}
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-sm shadow-md px-1.5 py-0.5 rounded text-[7px] font-black text-red-500 uppercase tracking-tighter">
                      {spr.release}
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 bg-[#FF0000] shadow-md px-1.5 py-0.5 rounded text-[7px] font-black text-white flex items-center gap-1">
                      <Star size={7} fill="currentColor" /> {spr.score}
                    </div>
                  </div>
                  <h3 className="text-[11px] font-black text-gray-200 group-hover:text-white truncate font-mono uppercase tracking-tight leading-none mb-1">
                    {spr.title}
                  </h3>
                  <p className="text-[8px] text-gray-600 font-mono truncate uppercase">{spr.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Main Database Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {page === 1 && localAnime.length > 0 && !searchQuery && localAnime.map((anime, idx) => (
           <motion.div
            key={`local-${anime.id}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group cursor-pointer"
          >
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-red-600/20 mb-3 bg-black">
              <img src={anime.image || undefined} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-2 left-2 bg-red-600 text-[8px] font-black text-white px-2 py-1 rounded uppercase tracking-widest shadow-xl">Nexus Node</div>
              <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[8px] font-black text-white flex items-center gap-1 uppercase">
                <Star size={8} className="text-red-600" fill="currentColor" /> {anime.rating || 'N/A'}
              </div>
            </div>
            <h3 className="text-xs font-bold text-red-500 group-hover:text-white transition-colors truncate italic uppercase tracking-tighter">{anime.title}</h3>
            <p className="text-[9px] text-gray-600 font-mono mt-1 uppercase truncate">Verified Local Intelligence</p>
          </motion.div>
        ))}

        {animeList.map((anime, idx) => (
          <motion.div
            key={`${anime.mal_id}-${idx}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (idx % 24) * 0.02 }}
            className="group cursor-pointer"
          >
            <Link to={`/anime/${anime.mal_id}`}>
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-[#1F1F1F] mb-3">
                <img 
                  src={anime.images.jpg.image_url || undefined} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  alt={anime.title} 
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                   <Play className="text-[#FF0000] mb-2" size={24} fill="currentColor" />
                   <span className="text-[10px] font-black uppercase text-white tracking-widest font-mono">Access Data</span>
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                   <div className="bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-black text-[#FF0000] flex items-center gap-1 uppercase tracking-tighter">
                      <Star size={8} fill="currentColor" /> {anime.score || 'N/A'}
                   </div>
                </div>
              </div>
              <h3 className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors truncate">{anime.title}</h3>
              <p className="text-[9px] text-gray-600 font-mono mt-1 uppercase truncate">{anime.studios?.[0]?.name || 'Unknown Studio'}</p>
            </Link>
          </motion.div>
        ))}

        {loading && [1,2,3,4,5,6].map(i => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] bg-[#111] rounded-lg mb-3"></div>
            <div className="h-3 w-3/4 bg-[#111] rounded mb-1"></div>
            <div className="h-2 w-1/2 bg-[#111] rounded"></div>
          </div>
        ))}
      </div>

      {hasMore && !loading && (
        <div className="mt-16 text-center">
           <button 
            onClick={() => setPage(p => p + 1)}
            className="px-12 py-3 border border-[#1F1F1F] hover:bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] font-mono text-gray-500 hover:text-white transition-all rounded-full"
           >
             Load more intelligence
           </button>
        </div>
      )}
    </div>
  );
}
