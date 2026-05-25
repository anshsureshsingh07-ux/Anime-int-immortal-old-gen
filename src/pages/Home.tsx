import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Flame, TrendingUp, Calendar, Play, ChevronRight, MessageSquare, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { FALLBACK_AIRING } from '../lib/jikanFallback';

export default function Home() {
  const [news, setNews] = useState<any[]>([]);
  const [featuredAnime, setFeaturedAnime] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [activePoll, setActivePoll] = useState<any>(null);
  const [pollVotes, setPollVotes] = useState<any[]>([]);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // New robust states for the dynamic features
  const [breakingNews, setBreakingNews] = useState<any>({
    id: 1,
    text: "Vanguard Ops: Archives System Expansion Initialized"
  });
  const [isEditingBreaking, setIsEditingBreaking] = useState(false);
  const [tempBreakingText, setTempBreakingText] = useState('');

  const [communityPoll, setCommunityPoll] = useState<any>({
    id: 1,
    question: "Should the Nexus terminal undergo full decentralization?",
    option_a: "EXECUTE DECENTRALIZATION",
    option_b: "MAINTAIN CENTRAL CORES",
    votes_a: 104,
    votes_b: 42
  });
  const [votedOption, setVotedOption] = useState<string | null>(null);
  const [showPollEdit, setShowPollEdit] = useState(false);
  const [pollEditForm, setPollEditForm] = useState({ question: '', option_a: '', option_b: '' });

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const isCurrentUserAdmin = currentUserEmail === 'anshsureshsingh07@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUserEmail(user ? user.email : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Load local stored vote for the community poll
    const savedVote = localStorage.getItem('voted_community_poll_1');
    if (savedVote) {
      setVotedOption(savedVote);
    }

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
        .select('id, airing_time:time_slot, title, status_text:status')
        .limit(15);

      // Polls (Legacy poll)
      const { data: pollData } = await supabase
        .from('polls')
        .select('*, poll_options(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Dynamic Feature 1: Get Breaking News (id: 1)
      try {
        const { data: bnData, error: bnErr } = await supabase
          .from('breaking_news')
          .select('*')
          .eq('id', 1)
          .single();

        if (bnData) {
          if (isMounted) setBreakingNews(bnData);
        } else if (bnErr && bnErr.code === 'PGRST116') {
          // Record doesn't exist, try initializing it
          const defaultBN = { id: 1, text: "Vanguard Ops: Archives System Expansion Initialized" };
          const { data: insertedBN } = await supabase.from('breaking_news').insert([defaultBN]).select().single();
          if (insertedBN && isMounted) setBreakingNews(insertedBN);
        }
      } catch (err) {
        console.warn('Unable to query breaking_news:', err);
      }

      // Dynamic Feature 3: Get Community Poll (id: 1)
      try {
        const { data: cpData, error: cpErr } = await supabase
          .from('community_poll')
          .select('*')
          .eq('id', 1)
          .single();

        if (cpData) {
          if (isMounted) setCommunityPoll(cpData);
        } else if (cpErr && cpErr.code === 'PGRST116') {
          // Record doesn't exist, initialize it
          const defaultPoll = {
            id: 1,
            question: "Should the Nexus terminal undergo full decentralization?",
            option_a: "EXECUTE DECENTRALIZATION",
            option_b: "MAINTAIN CENTRAL CORES",
            votes_a: 104,
            votes_b: 42
          };
          const { data: insertedCP } = await supabase.from('community_poll').insert([defaultPoll]).select().single();
          if (insertedCP && isMounted) setCommunityPoll(insertedCP);
        }
      } catch (err) {
        console.warn('Unable to query community_poll:', err);
      }
      
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
          setFeaturedAnime(data.data || FALLBACK_AIRING);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Jikan fetch failed, loaded high-fidelity offline backup:', err);
        if (isMounted) {
          setFeaturedAnime(FALLBACK_AIRING);
          setLoading(false);
        }
      }
    };

    fetchJikan();

    return () => { isMounted = false; };
  }, []);

  const handleSaveBreaking = async () => {
    const value = tempBreakingText.trim();
    if (!value) return;

    try {
      const payload = {
        id: 1,
        text: value,
        title: value,
        content: value
      };
      
      const { error } = await supabase.from('breaking_news').upsert([payload]);
      if (error) {
        // Fallback update in case of column schema mismatch or triggers
        await supabase.from('breaking_news').update({ text: value }).eq('id', 1);
      }
      setBreakingNews({ ...breakingNews, text: value });
      setIsEditingBreaking(false);
    } catch (err) {
      console.error('Error saving breaking_news:', err);
      // Fallback local state update
      setBreakingNews({ ...breakingNews, text: value });
      setIsEditingBreaking(false);
    }
  };

  const handleCommunityVote = async (option: 'A' | 'B') => {
    if (votedOption || !communityPoll) return;

    localStorage.setItem('voted_community_poll_1', option);
    setVotedOption(option);

    try {
      // Load latest values to prevent dirty writes or collisions
      const { data: latest } = await supabase.from('community_poll').select('*').eq('id', 1).single();
      const votesA = latest ? (latest.votes_a || 0) : (communityPoll.votes_a || 0);
      const votesB = latest ? (latest.votes_b || 0) : (communityPoll.votes_b || 0);

      const updatePayload = option === 'A' 
        ? { votes_a: votesA + 1 }
        : { votes_b: votesB + 1 };

      const { data } = await supabase
        .from('community_poll')
        .update(updatePayload)
        .eq('id', 1)
        .select()
        .single();

      if (data) {
        setCommunityPoll(data);
      } else {
        setCommunityPoll({
          ...communityPoll,
          votes_a: option === 'A' ? votesA + 1 : votesA,
          votes_b: option === 'B' ? votesB + 1 : votesB,
        });
      }
    } catch (err) {
      console.error('Error recording community vote:', err);
      // fallback in-memory
      setCommunityPoll({
        ...communityPoll,
        votes_a: option === 'A' ? (communityPoll.votes_a || 0) + 1 : (communityPoll.votes_a || 0),
        votes_b: option === 'B' ? (communityPoll.votes_b || 0) + 1 : (communityPoll.votes_b || 0),
      });
    }
  };

  const getCommunityPollPercentage = (option: 'A' | 'B') => {
    if (!communityPoll) return 50;
    const votesA = communityPoll.votes_a || 0;
    const votesB = communityPoll.votes_b || 0;
    const total = votesA + votesB;
    if (total === 0) return 50;
    return Math.round((option === 'A' ? votesA : votesB) / total * 100);
  };

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

  const formatAiringTime = (airingTime: any) => {
    if (!airingTime) return '00:00 UTC';
    const str = String(airingTime).trim();
    if (/^\d{1,2}:\d{2}(\s*[aApP][mM])?$/.test(str)) {
      return str;
    }
    try {
      const d = new Date(str);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {}
    return str;
  };

  return (
    <div className="p-0">
      {/* Top Release Tracker (Marquee) */}
      <div className="py-2 overflow-hidden whitespace-nowrap border-b" style={{ backgroundColor: 'var(--faction-primary-glow)', borderBottomColor: 'var(--faction-border)' }}>
        <div className="flex animate-marquee-slower">
          {Array(3).fill(null).map((_, i) => (
            <div key={i} className="flex items-center gap-10 px-10 shrink-0">
              {releases.length === 0 ? (
                Array(4).fill(null).map((_, idx) => (
                  <div key={`${i}-${idx}`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap shrink-0" style={{ color: 'var(--faction-primary)' }}>
                    SYS OPERATIONAL • BROADCAST FEED SLEEPING
                  </div>
                ))
              ) : (
                releases.map(item => (
                  <div key={`${i}-${item.id}`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap shrink-0">
                    <span className="font-mono" style={{ color: 'var(--faction-primary)' }}>{formatAiringTime(item.airing_time)} •</span>
                    <span className="text-white">{item.title}</span>
                    <span className="text-gray-500 font-mono italic">[{item.status_text || 'ACTIVE'}]</span>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

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
              <span className="text-white text-[10px] font-black px-2 py-1 uppercase rounded" style={{ backgroundColor: 'var(--faction-primary)' }}>Breaking</span>
              <span className="bg-black/60 text-white text-[10px] font-black px-2 py-1 uppercase rounded backdrop-blur-md">Featured</span>
            </div>
            <div className="absolute bottom-8 left-8 right-8 z-20">
              {isEditingBreaking ? (
                <div className="flex flex-col gap-2 bg-[#050505]/95 p-4 rounded-xl border backdrop-blur-md shadow-faction-glow" style={{ borderColor: 'var(--faction-primary)' }}>
                  <span className="text-[9px] font-mono uppercase tracking-widest font-black" style={{ color: 'var(--faction-primary)' }}>Syncing Node Terminal Ticker</span>
                  <textarea
                    value={tempBreakingText}
                    onChange={(e) => setTempBreakingText(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg p-2.5 text-xs font-mono text-white outline-none focus:border-faction-primary"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingBreaking(false)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase rounded text-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveBreaking}
                      className="px-3 py-1.5 text-[10px] font-black uppercase rounded text-white transition-all shadow-faction-glow bg-faction-primary hover:opacity-90"
                    >
                      Sync Banner
                    </button>
                  </div>
                </div>
              ) : (
                <div className="group/banner flex items-start justify-between gap-4">
                  <h2 className="text-3xl font-black text-white leading-tight uppercase italic drop-shadow-lg leading-snug">
                    {breakingNews?.text || breakingNews?.title || "Vanguard Ops: Archives System Expansion Initialized"}
                  </h2>
                  {isCurrentUserAdmin && (
                    <button
                      onClick={() => {
                        setTempBreakingText(breakingNews?.text || breakingNews?.title || "Vanguard Ops: Archives System Expansion Initialized");
                        setIsEditingBreaking(true);
                      }}
                      className="p-2 bg-black/60 text-white rounded-lg border border-white/10 transition-all flex items-center justify-center shrink-0 self-center shadow-lg hover:bg-faction-primary hover:border-faction-primary"
                      title="Edit Terminal Banner"
                    >
                      <span className="text-[9px] font-black uppercase tracking-widest mr-1.5 hidden md:inline">Edit Banner</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    </button>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-300 font-medium">
                <span>Network Node 01</span>
                <span className="text-faction-primary">•</span>
                <span>Active Stream</span>
                <span className="text-faction-primary">•</span>
                <span>Neural Broadcaster</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 mb-2 border-b border-[#1F1F1F] pb-2">
             <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
               <TrendingUp size={14} style={{ color: 'var(--faction-primary)' }} /> Intelligence <span style={{ color: 'var(--faction-primary)' }}>Feed</span>
             </h2>
             <Link to="/news" className="text-[10px] font-mono text-gray-600 uppercase flex items-center gap-1 transition-colors hover:text-faction-primary">
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
                       <span className="text-[8px] font-black text-white px-2 py-1 rounded uppercase tracking-widest shadow-2xl bg-faction-primary">
                         {item.category}
                       </span>
                     </div>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 group-hover:text-faction-primary transition-colors line-clamp-1">{item.title}</h3>
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
              <span className="flex items-center gap-2"><Flame size={14} style={{ color: 'var(--faction-primary)' }} /> Trending Now</span>
              <Link to="/database" className="text-[10px] hover:underline" style={{ color: 'var(--faction-primary)' }}>Full Database</Link>
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
                  <span className="text-xl font-black transition-colors italic w-6 group-hover:text-faction-primary" style={{ color: 'var(--faction-primary)', opacity: 0.35 }}>0{idx + 1}</span>
                  <img src={anime.images.jpg.image_url || undefined} className="w-10 h-14 bg-[#1A1A1A] rounded object-cover border border-[#222]" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white group-hover:text-faction-primary transition-colors truncate">{anime.title}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-mono truncate">{anime.studios?.[0]?.name || 'Studio'} • {anime.type}</div>
                  </div>
                  <div className="ml-auto text-[10px] text-green-500 font-bold font-mono">+{Math.floor(Math.random() * 20)}%</div>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="bg-[#111] rounded-xl border border-[#1F1F1F] p-5">
             <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center justify-between" style={{ color: 'var(--faction-primary)' }}>
               <span className="flex items-center gap-2"><MessageSquare size={14} /> Community Poll</span>
               {isCurrentUserAdmin && (
                 <button 
                   type="button"
                   onClick={() => {
                     setPollEditForm({
                       question: communityPoll?.question || '',
                       option_a: communityPoll?.option_a || '',
                       option_b: communityPoll?.option_b || ''
                     });
                     setShowPollEdit(!showPollEdit);
                   }}
                   className="p-1.5 hover:bg-white/5 rounded border border-transparent hover:border-white/10 text-gray-500 hover:text-[#FF0000] transition-all"
                   title="Edit Poll Settings"
                 >
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
                 </button>
               )}
             </h3>

             {isCurrentUserAdmin && showPollEdit ? (
                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const payload = {
                        id: 1,
                        question: pollEditForm.question,
                        option_a: pollEditForm.option_a,
                        option_b: pollEditForm.option_b,
                        votes_a: 0,
                        votes_b: 0
                      };
                      const { data } = await supabase.from('community_poll').upsert([payload]).select().single();
                      if (data) {
                        setCommunityPoll(data);
                      } else {
                        await supabase.from('community_poll').update({
                          question: pollEditForm.question,
                          option_a: pollEditForm.option_a,
                          option_b: pollEditForm.option_b,
                          votes_a: 0,
                          votes_b: 0
                        }).eq('id', 1);
                        setCommunityPoll({
                          ...communityPoll,
                          ...pollEditForm,
                          votes_a: 0,
                          votes_b: 0
                        });
                      }
                      localStorage.removeItem('voted_community_poll_1');
                      setVotedOption(null);
                      setShowPollEdit(false);
                    } catch (err) {
                      console.error('Error saving poll config:', err);
                      setCommunityPoll({
                        ...communityPoll,
                        ...pollEditForm,
                        votes_a: 0,
                        votes_b: 0
                      });
                      localStorage.removeItem('voted_community_poll_1');
                      setVotedOption(null);
                      setShowPollEdit(false);
                    }
                  }}
                  className="space-y-3 bg-black/40 p-3.5 rounded-lg border border-white/5 font-mono text-xs shadow-inner"
                >
                  <div className="text-[10px] uppercase font-black tracking-widest" style={{ color: 'var(--faction-primary)' }}>Configure Consensus Core</div>
                  <div>
                    <label className="text-[8px] text-gray-500 uppercase font-black tracking-wider block mb-1">Poll Question</label>
                    <input 
                      required
                      value={pollEditForm.question}
                      onChange={e => setPollEditForm({...pollEditForm, question: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-md p-2 focus:border-[var(--faction-primary)] outline-none text-white text-[11px] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-500 uppercase font-black tracking-wider block mb-1">Option A</label>
                    <input 
                      required
                      value={pollEditForm.option_a}
                      onChange={e => setPollEditForm({...pollEditForm, option_a: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-md p-2 focus:border-[var(--faction-primary)] outline-none text-white text-[11px] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] text-gray-500 uppercase font-black tracking-wider block mb-1">Option B</label>
                    <input 
                      required
                      value={pollEditForm.option_b}
                      onChange={e => setPollEditForm({...pollEditForm, option_b: e.target.value})}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-md p-2 focus:border-[var(--faction-primary)] outline-none text-white text-[11px] transition-colors"
                    />
                  </div>
                  <div className="flex gap-2 pt-1.5">
                    <button 
                      type="button" 
                      onClick={() => setShowPollEdit(false)}
                      className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-1.5 text-white text-[9px] font-black uppercase tracking-widest rounded transition-all shadow-faction-glow bg-faction-primary hover:opacity-85"
                    >
                      Sync Core
                    </button>
                  </div>
                </form>
             ) : communityPoll ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-400 font-medium leading-relaxed">{communityPoll.question}</p>
                  <div className="space-y-3">
                     {['A', 'B'].map((optKey) => {
                        const optText = optKey === 'A' ? communityPoll.option_a : communityPoll.option_b;
                        const percent = getCommunityPollPercentage(optKey as any);
                        const isMyVote = votedOption === optKey;
                        const votesCount = optKey === 'A' ? (communityPoll.votes_a || 0) : (communityPoll.votes_b || 0);
                        return (
                          <button 
                            key={optKey}
                            disabled={votedOption !== null}
                            onClick={() => handleCommunityVote(optKey as any)}
                            className={`relative h-12 w-full bg-[#050505] border rounded-lg flex items-center px-4 group overflow-hidden transition-all text-left ${
                              isMyVote ? 'border-faction-primary shadow-faction-glow' : 'border-[#1F1F1F] hover:border-gray-500'
                            }`}
                            style={isMyVote ? { borderColor: 'var(--faction-primary)' } : {}}
                          >
                             <div 
                               className="absolute inset-y-0 left-0 transition-all duration-1000" 
                               style={{ width: `${percent}%`, backgroundColor: 'var(--faction-primary-glow)' }}
                             />
                             <span className="relative z-10 text-[11px] font-black italic uppercase tracking-tighter transition-colors text-white" style={isMyVote ? { color: 'var(--faction-primary)' } : {}}>
                               {optText}
                             </span>
                             {votedOption !== null && (
                               <span className="relative z-10 ml-auto text-[10px] font-mono font-black animate-pulse" style={{ color: 'var(--faction-primary)' }}>
                                 {percent}% ({votesCount}v)
                               </span>
                             )}
                          </button>
                        );
                     })}
                  </div>
                  {votedOption !== null && (
                    <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest text-center mt-4"> Consensus Data Recorded </p>
                  )}
                </div>
             ) : (
                <div className="p-10 text-center border border-dashed border-white/5 rounded-xl">
                  <p className="text-[10px] text-gray-600 font-mono uppercase">Analyzing Consensus...</p>
                </div>
             )}
          </section>

          <div className="p-6 bg-[#111] border rounded-xl relative overflow-hidden" style={{ borderColor: 'var(--faction-border)' }}>
             <div className="absolute top-0 right-0 p-2 opacity-5" style={{ color: 'var(--faction-primary)' }}>
                <Flame size={80} />
             </div>
             <p className="text-[9px] font-black uppercase tracking-[0.3em] mb-3" style={{ color: 'var(--faction-primary)' }}>Vanguard Ops</p>
             <h4 className="text-sm font-bold text-white mb-4 leading-tight">Join the news writing team to gain early access to archives.</h4>
             <Link to="/recruit" className="inline-block px-4 py-2 text-white text-[10px] font-black uppercase tracking-widest rounded transition-all hover:opacity-90 shadow-faction-glow bg-faction-primary">Apply Node</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
