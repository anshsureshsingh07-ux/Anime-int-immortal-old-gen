import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Flame, TrendingUp, Calendar, Play, ChevronRight, MessageSquare, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [news, setNews] = useState<any[]>([]);
  const [featuredAnime, setFeaturedAnime] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [activePoll, setActivePoll] = useState<any>(null);
  const [pollVotes, setPollVotes] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      // News
      const twentyEightHoursAgo = new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString();
      const { data: newsData } = await supabase
        .from('news')
        .select('*')
        .gte('created_at', twentyEightHoursAgo)
        .order('created_at', { ascending: false })
        .limit(6);
      
      // Releases
      const { data: releaseData } = await supabase
        .from('release_tracker')
        .select('*')
        .gte('release_date', new Date().toISOString())
        .order('release_date', { ascending: true })
        .limit(10);

      // Poll
      const { data: pollData } = await supabase
        .from('polls')
        .select('*, poll_options(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (isMounted) {
        if (newsData) setNews(newsData);
        if (releaseData) setReleases(releaseData);
        if (pollData) {
          setActivePoll(pollData);
          fetchPollVotes(pollData.id);
        }
      }
    };

    fetchData();

    // Fetch Jikan with retry logic
    const fetchJikan = async (retries = 3) => {
      try {
        const res = await fetch('https://api.jikan.moe/v4/top/anime?limit=10&filter=airing');
        if (!res.ok) {
          if (res.status === 429 && retries > 0) {
            // Rate limited, wait and retry
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchJikan(retries - 1);
          }
          throw new Error(`Jikan error: ${res.status}`);
        }
        const data = await res.json();
        if (isMounted) {
          setFeaturedAnime(data.data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error('Jikan fetch failed:', err);
        if (isMounted) setLoading(false);
      }
    };

    fetchJikan();

    return () => { isMounted = false; };
  }, []);

  const fetchPollVotes = async (pollId: string) => {
    const { data: votes } = await supabase.from('poll_votes').select('*').eq('poll_id', pollId);
    if (votes) setPollVotes(votes);

    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const myVote = votes?.find(v => v.user_id === session.user.id);
      if (myVote) setUserVote(myVote.option_id);
    }
  };

  const handleVote = async (optionId: string) => {
    if (userVote !== null || !activePoll) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return alert('Please login to vote.');

    const { error } = await supabase.from('poll_votes').insert([
      { poll_id: activePoll.id, user_id: session.user.id, option_id: optionId }
    ]);

    if (!error) {
      setUserVote(optionId as any);
      fetchPollVotes(activePoll.id);
    }
  };

  const getVotePercent = (optionId: string) => {
    if (pollVotes.length === 0) return 0;
    const count = pollVotes.filter(v => v.option_id === optionId).length;
    return Math.round((count / pollVotes.length) * 100);
  };

  return (
    <div className="p-0">
      {/* Top Release Tracker (Marquee) */}
      {releases.length > 0 && (
        <div className="bg-red-600/10 border-b border-red-600/20 py-2 overflow-hidden whitespace-nowrap">
          <div className="flex animate-marquee-slower">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="flex items-center gap-10 px-10">
                {releases.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em]">
                    <span className="text-red-500 font-mono">0{item.episode || 1} •</span>
                    <span className="text-white">{item.title}</span>
                    <span className="text-gray-500 font-mono italic">[{new Date(item.release_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}]</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

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
              <h2 className="text-3xl font-black text-white leading-tight uppercase italic drop-shadow-lg leading-snug">
                Vanguard Ops: Archives <br/>System Expansion Initialized
              </h2>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-300 font-medium">
                <span>Network Node 01</span>
                <span className="text-[#FF0000]">•</span>
                <span>Active Stream</span>
                <span className="text-[#FF0000]">•</span>
                <span>Neural Broadcaster</span>
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
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-[#111] p-4 rounded-xl border border-[#1F1F1F] hover:border-[#333] transition-all group relative"
                >
                  <Link to={`/news/${item.id}`} className="absolute inset-0 z-10" aria-label={`View ${item.title}`} />
                  <div className="h-40 w-full bg-[#1A1A1A] rounded-lg overflow-hidden mb-3 relative">
                    <img src={item.image || undefined} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-2 left-2">
                      <span className="bg-red-600 text-[8px] font-black text-white px-2 py-1 rounded uppercase tracking-widest shadow-2xl">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 group-hover:text-[#FF0000] transition-colors line-clamp-1">{item.title}</h3>
                  <p className="text-[11px] text-gray-500 mt-2 line-clamp-2 font-mono leading-relaxed">
                    {item.description}
                  </p>
                  <div className="mt-4 pt-3 border-t border-[#1F1F1F] flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-[#555]">
                     <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                     <div className="flex items-center gap-1">
                        <img src={item.author_id ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.author_id}` : undefined} className="w-4 h-4 rounded-full" />
                        <span className="text-gray-400">{item.author_name}</span>
                     </div>
                  </div>
                </motion.div>
              ))
            ) : loading ? (
               [1,2,3,4].map(i => (
                <div key={i} className="bg-[#111] p-4 rounded-xl border border-[#1F1F1F] animate-pulse">
                  <div className="h-32 w-full bg-[#1A1A1A] rounded-lg mb-3"></div>
                  <div className="h-4 w-3/4 bg-[#1A1A1A] rounded mb-2"></div>
                  <div className="h-3 w-full bg-[#1A1A1A] rounded mb-1"></div>
                  <div className="h-3 w-5/6 bg-[#1A1A1A] rounded"></div>
                </div>
               ))
            ) : (
              <div className="col-span-full p-20 text-center text-gray-700 font-mono text-[10px] uppercase tracking-[0.3em] border border-dashed border-white/5 rounded-3xl">
                Nexus channel silent. no broadscasts detected.
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
             {activePoll ? (
               <div className="space-y-4">
                  <p className="text-xs text-gray-400 font-medium">{activePoll.question}</p>
                  <div className="space-y-3">
                     {activePoll.poll_options.map((option: any) => {
                       const percent = getVotePercent(option.id);
                       const isMyVote = userVote === option.id;
                       return (
                        <button 
                          key={option.id}
                          disabled={userVote !== null}
                          onClick={() => handleVote(option.id)}
                          className={`relative h-11 w-full bg-[#050505] border rounded flex items-center px-4 group overflow-hidden transition-all text-left ${
                            isMyVote ? 'border-red-600' : 'border-[#1F1F1F] hover:border-gray-500'
                          }`}
                        >
                           <div 
                             className="absolute inset-y-0 left-0 bg-red-600/10 transition-all duration-1000" 
                             style={{ width: `${percent}%` }}
                           />
                           <span className={`relative z-10 text-[11px] font-black italic uppercase tracking-tighter transition-colors ${
                             isMyVote ? 'text-red-500' : 'text-white'
                           }`}>
                             {option.text}
                           </span>
                           {userVote !== null && (
                             <span className="relative z-10 ml-auto text-[10px] font-mono text-[#FF0000] font-black">{percent}%</span>
                           )}
                        </button>
                       );
                     })}
                  </div>
                  {userVote !== null && (
                    <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest text-center mt-4"> Consensus Data Recorded </p>
                  )}
               </div>
             ) : (
               <div className="p-10 text-center border border-dashed border-white/5 rounded-xl">
                 <p className="text-[10px] text-gray-600 font-mono uppercase">Analyzing Consensus...</p>
               </div>
             )}
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
    </div>
  );
}
