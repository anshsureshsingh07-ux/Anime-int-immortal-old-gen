import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Play, Star, Heart, Share2, 
  ChevronLeft, Info, Calendar, 
  TrendingUp, Flame
} from 'lucide-react';

export default function AnimeDetails() {
  const { id } = useParams();
  const [anime, setAnime] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWithRetry = async (retries = 3) => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.jikan.moe/v4/anime/${id}/full`);
        if (!res.ok) {
          if (res.status === 429 && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(retries - 1);
          }
          throw new Error(`Jikan error: ${res.status}`);
        }
        const data = await res.json();
        setAnime(data.data);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWithRetry();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-[#FF0000] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!anime) return <div className="p-10 text-center uppercase font-black text-[#555]">Node Not Found</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Banner */}
      <div className="h-64 relative overflow-hidden shrink-0">
        <img 
          src={anime.images.jpg.large_image_url || undefined} 
          className="w-full h-full object-cover blur-2xl brightness-50 opacity-30" 
          alt="Banner Blur"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] to-transparent"></div>
        <div className="absolute inset-0 flex items-center px-12 gap-8">
           <img src={anime.images.jpg.large_image_url || undefined} className="w-40 h-56 object-cover rounded-lg border-2 border-[#1F1F1F] shadow-2xl z-20" alt={anime.title} />
           <div className="z-20">
              <div className="flex items-center gap-3 mb-2">
                 <span className="bg-[#FF0000] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">{anime.status}</span>
                 <span className="text-gray-500 font-mono text-[10px] uppercase tracking-widest">{anime.season} {anime.year}</span>
              </div>
              <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-2 leading-none">{anime.title}</h1>
              <p className="text-sm text-gray-400 font-medium italic opacity-70">{anime.title_japanese}</p>
              
              <Link to="/database" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors mt-6">
                <ChevronLeft size={14} /> Back to Archives
              </Link>
           </div>
        </div>
      </div>

      {/* Details Area */}
      <div className="p-12 grid grid-cols-12 gap-12 max-w-7xl mx-auto w-full">
         {/* Main Column */}
         <div className="col-span-12 lg:col-span-8 space-y-12">
            <section>
               <h3 className="text-xs font-black uppercase tracking-widest text-[#FF0000] mb-4 border-b border-[#1F1F1F] pb-2 flex items-center gap-2">
                  <Info size={14} /> Synopsis
               </h3>
               <p className="text-sm text-gray-400 leading-relaxed font-mono">
                  {anime.synopsis}
               </p>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-[#111] border border-[#1F1F1F] p-4 rounded">
                  <div className="text-[10px] font-mono text-gray-600 uppercase mb-1">SCORE</div>
                  <div className="text-xl font-black text-white">{anime.score} <span className="text-[10px] font-normal text-gray-600">/ 10</span></div>
               </div>
               <div className="bg-[#111] border border-[#1F1F1F] p-4 rounded">
                  <div className="text-[10px] font-mono text-gray-600 uppercase mb-1">RANK</div>
                  <div className="text-xl font-black text-white">#{anime.rank}</div>
               </div>
               <div className="bg-[#111] border border-[#1F1F1F] p-4 rounded">
                  <div className="text-[10px] font-mono text-gray-600 uppercase mb-1">POPULARITY</div>
                  <div className="text-xl font-black text-white">#{anime.popularity}</div>
               </div>
               <div className="bg-[#111] border border-[#1F1F1F] p-4 rounded">
                  <div className="text-[10px] font-mono text-gray-600 uppercase mb-1">EPISODES</div>
                  <div className="text-xl font-black text-white">{anime.episodes || '??'}</div>
               </div>
            </section>

            <section>
               <h3 className="text-xs font-black uppercase tracking-widest text-[#FF0000] mb-6 border-b border-[#1F1F1F] pb-2 flex items-center gap-2">
                  <Flame size={14} /> Data Specs
               </h3>
               <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                     <div>
                        <h4 className="text-[9px] font-black text-white uppercase tracking-widest mb-1">Studios</h4>
                        <div className="flex flex-wrap gap-2">
                           {anime.studios?.map((s: any) => (
                             <span key={s.name} className="text-[10px] text-gray-500 font-mono italic underline cursor-pointer hover:text-[#FF0000]">{s.name}</span>
                           ))}
                        </div>
                     </div>
                     <div>
                        <h4 className="text-[9px] font-black text-white uppercase tracking-widest mb-1">Source</h4>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">{anime.source}</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <div>
                        <h4 className="text-[9px] font-black text-white uppercase tracking-widest mb-1">Rating</h4>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">{anime.rating}</p>
                     </div>
                     <div>
                        <h4 className="text-[9px] font-black text-white uppercase tracking-widest mb-1">Duration</h4>
                        <p className="text-[10px] text-gray-500 font-mono uppercase">{anime.duration}</p>
                     </div>
                  </div>
                  <div>
                     <h4 className="text-[9px] font-black text-white uppercase tracking-widest mb-1">Genres</h4>
                     <div className="flex flex-wrap gap-2 mt-2">
                        {anime.genres?.map((g: any) => (
                          <span key={g.name} className="bg-[#1A1A1A] border border-[#1F1F1F] px-2 py-1 rounded text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                             {g.name}
                          </span>
                        ))}
                     </div>
                  </div>
               </div>
            </section>
         </div>

         {/* Sidebar Column */}
         <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-[#111] border border-[#1F1F1F] p-6 rounded shadow-xl">
               <h4 className="text-[11px] font-black text-[#FF0000] uppercase tracking-widest mb-6 flex items-center gap-2">
                  <TrendingUp size={14} /> Relations
               </h4>
               <div className="space-y-4">
                  {anime.relations?.slice(0, 3).map((rel: any, idx: number) => (
                    <div key={idx} className="group cursor-pointer">
                       <p className="text-[8px] text-[#555] font-mono uppercase mb-0.5">{rel.relation}</p>
                       <p className="text-xs font-bold text-gray-300 group-hover:text-white transition-colors underline decoration-[#1F1F1F] group-hover:decoration-[#FF0000]">
                          {rel.entry[0].name}
                       </p>
                    </div>
                  ))}
               </div>
            </div>

             <div className="p-6 bg-gradient-to-br from-[#1A0000] to-[#050505] border border-[#FF0000]/20 rounded relative overflow-hidden">
                <p className="text-[9px] text-[#FF0000] font-black uppercase tracking-[0.2em] mb-4">Transmission</p>
                <h4 className="text-sm font-bold text-white mb-6">Found intelligence leaks? Access the database archives.</h4>
                <Link to="/database" className="block text-center py-2 bg-[#FF0000] text-white text-[10px] font-black uppercase tracking-widest rounded hover:bg-[#CC0000] transition-colors">Go to Archives</Link>
             </div>
         </div>
      </div>
    </div>
  );
}
