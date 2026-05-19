import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Share2, Clock, ShieldCheck, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function NewsDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      navigate('/news');
      return;
    }

    setArticle(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="space-y-6 text-center">
            <div className="w-16 h-16 border-t-2 border-red-600 rounded-full animate-spin mx-auto" />
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.4em] animate-pulse">Decrypting Transmission...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-red-600 selection:text-white">
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-24">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-16">
          <Link 
            to="/news" 
            className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all"
          >
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-red-600 transition-colors">
              <ArrowLeft size={14} className="group-hover:text-red-500" />
            </div>
            Back to Feed
          </Link>
          <div className="flex items-center gap-4">
             <button className="p-2 text-gray-500 hover:text-white transition-colors">
                <Share2 size={18} />
             </button>
          </div>
        </div>

        {/* Content Header */}
        <header className="space-y-8 mb-16">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 bg-red-600 text-[9px] font-black uppercase tracking-widest rounded shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              {article.category}
            </span>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Clock size={12} /> AIRING NOW
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-[0.9] drop-shadow-2xl">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-8 py-8 border-y border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-red-600/30 overflow-hidden bg-red-600/10 flex items-center justify-center">
                 {article.author_id ? (
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${article.author_id}`} className="w-full h-full object-cover" />
                 ) : (
                   <User size={18} className="text-red-500" />
                 )}
              </div>
              <div>
                <div className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                  {article.author_name} <ShieldCheck size={10} className="text-red-500" />
                </div>
                <div className="text-[9px] font-mono text-gray-500 uppercase">Archive Authorized</div>
              </div>
            </div>

            <div className="h-8 w-px bg-white/10 hidden md:block" />

            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-gray-500">
                  <Calendar size={18} />
               </div>
               <div>
                  <div className="text-[10px] font-black text-white uppercase tracking-widest">
                    {new Date(article.created_at).toLocaleDateString()}
                  </div>
                  <div className="text-[9px] font-mono text-gray-500 uppercase">
                    {new Date(article.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
               </div>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 mb-20 group shadow-2xl"
        >
          <img 
            src={article.image} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
          <div className="absolute bottom-8 left-8 flex items-center gap-2">
             <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">Neural Broadcast Stream Active</span>
          </div>
        </motion.div>

        {/* Article Body */}
        <article className="prose prose-invert max-w-none">
          <div className="space-y-8 text-lg md:text-xl text-gray-300 font-medium leading-relaxed tracking-tight">
            {article.description?.split('\n').map((paragraph: string, i: number) => (
              <p key={i} className={i === 0 ? "text-white first-letter:text-5xl first-letter:font-black first-letter:text-red-600 first-letter:mr-3 first-letter:float-left" : ""}>
                {paragraph}
              </p>
            ))}
          </div>
        </article>

        {/* Footer Meta */}
        <footer className="mt-24 pt-12 border-t border-white/5">
           <div className="flex flex-wrap gap-4">
              {['Vanguard', 'Nexus', 'Archives', article.category].map(tag => (
                <span key={tag} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-[10px] font-mono text-gray-500 uppercase border border-white/5 hover:border-red-600/30 transition-all cursor-default">
                  <Tag size={10} className="text-red-500" /> {tag}
                </span>
              ))}
           </div>
           
           <div className="mt-20 p-10 bg-gradient-to-br from-[#111] to-black border border-white/5 rounded-[2rem] text-center">
              <h4 className="text-sm font-black uppercase italic tracking-widest text-white mb-4">Transmission Conclusion</h4>
              <p className="text-xs text-gray-500 font-mono mb-8 max-w-md mx-auto">This data was extracted from the Vanguard archives. Any unauthorized replication will result in node severance.</p>
              <Link to="/news" className="inline-block px-8 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-red-700 transition-all shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                Back to Archives
              </Link>
           </div>
        </footer>
      </div>
    </div>
  );
}
