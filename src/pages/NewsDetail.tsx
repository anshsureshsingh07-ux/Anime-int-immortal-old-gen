import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Share2, Clock, ShieldCheck, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNews } from '../App';

export default function NewsDetail() {
  const { id } = useParams();
  const { setActiveArticle } = useNews();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const navigate = useNavigate();

  // Helper to extract clean youtube embed URL or ID
  const getYoutubeEmbedId = (url: string) => {
    if (!url) return null;
    if (url.includes('youtube.com/embed/')) {
      const parts = url.split('youtube.com/embed/');
      if (parts[1]) {
        return parts[1].split('?')[0].split('"')[0];
      }
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  let additionalImages: string[] = [];
  let youtubeVideoUrl = '';
  let cleanDescription = '';

  if (article) {
    cleanDescription = article.description || '';
    
    // 1. Direct columns check
    if (article.additional_images && Array.isArray(article.additional_images)) {
      additionalImages = article.additional_images;
    } else if (article.additionalImages && Array.isArray(article.additionalImages)) {
      additionalImages = article.additionalImages;
    }

    if (article.youtube_video_url) {
      youtubeVideoUrl = article.youtube_video_url;
    } else if (article.youtubeVideoUrl) {
      youtubeVideoUrl = article.youtubeVideoUrl;
    }

    // 2. Metadata string comment fallback check
    if (article.description) {
      const match = article.description.match(/<!--NEXUS_META:(.*?)-->/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          if (parsed.additionalImages && additionalImages.length === 0) {
            additionalImages = parsed.additionalImages;
          }
          if (parsed.youtubeVideoUrl && !youtubeVideoUrl) {
            youtubeVideoUrl = parsed.youtubeVideoUrl;
          }
        } catch (e) {
          console.error("Meta parse error", e);
        }
        cleanDescription = article.description.replace(/<!--NEXUS_META:(.*?)-->/, '').trim();
      }
    }
  }

  const embedId = getYoutubeEmbedId(youtubeVideoUrl);

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
    setActiveArticle(data);
    setActiveImgIndex(0);
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
          className="relative w-full mb-20 group"
        >
          <img 
            src={article.image_url || article.image || "/assets/vanguard-fallback.jpg"} 
            referrerPolicy="no-referrer"
            alt={article.title}
            className="w-full h-auto max-h-[450px] object-cover rounded-lg border border-white/10 shadow-2xl"
          />
          {/* Subtle bottom shadow gradient overlay to give the text below deep contrast */}
          <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none rounded-b-lg" />
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
             <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/95 drop-shadow-md">Neural Broadcast Stream Active</span>
          </div>
        </motion.div>

        {/* Article Body */}
        <article className="prose prose-invert max-w-none">
          <div className="space-y-8 text-lg md:text-xl text-gray-300 font-medium leading-relaxed tracking-tight">
            {cleanDescription?.split('\n').map((paragraph: string, i: number) => (
              <p key={i} className={i === 0 ? "text-white first-letter:text-5xl first-letter:font-black first-letter:text-red-600 first-letter:mr-3 first-letter:float-left" : ""}>
                {paragraph}
              </p>
            ))}
          </div>
        </article>

        {embedId && (
          <div className="mt-16 mb-20 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#FF0000] flex items-center gap-2 italic">
              <span className="w-1.5 h-3 bg-red-600 inline-block"></span>
              RECONNAISSANCE VIDEO FEED
            </h3>
            <div className="relative aspect-video bg-zinc-950 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${embedId}?modestbranding=1&rel=0&showinfo=0`}
                title="Vanguard Stream Unit"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {additionalImages.length > 0 && (
          <div className="mt-16 mb-20 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-[#FF0000] flex items-center gap-2 italic">
              <span className="w-1.5 h-3 bg-red-600 inline-block"></span>
              ADDITIONAL SECTOR PHOTOGRAPHY ({additionalImages.length + 1} IMAGES)
            </h3>
            
            {/* Primary Slide Display inside a glassmorphism backplate card */}
            <div 
              style={{
                background: 'rgba(10, 10, 16, 0.8)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
              className="relative rounded-3xl p-6 flex flex-col items-center justify-center group shadow-2xl overflow-hidden min-h-[350px] md:min-h-[450px]"
            >
              {/* Centered Image Container */}
              <div className="relative w-full max-w-2xl aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-black/60">
                <img 
                  src={activeImgIndex === 0 ? (article.image_url || article.image || "/assets/vanguard-fallback.jpg") : additionalImages[activeImgIndex - 1]} 
                  referrerPolicy="no-referrer"
                  alt={`Slide ${activeImgIndex}`} 
                  className="w-full h-full object-cover transition-all duration-500 hover:scale-102"
                />
                
                {/* Floating Neon Interactive Circles to Navigate */}
                <button 
                  onClick={() => setActiveImgIndex((prev) => (prev === 0 ? additionalImages.length : prev - 1))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/85 border border-red-500/45 flex items-center justify-center text-red-500 hover:text-white hover:border-red-500 hover:bg-red-600/25 active:scale-95 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.35)] hover:shadow-[0_0_25px_rgba(239,68,68,0.7)] focus:outline-none z-20 font-black text-xl"
                  title="Previous Slide"
                >
                  ‹
                </button>
                <button 
                  onClick={() => setActiveImgIndex((prev) => (prev === additionalImages.length ? 0 : prev + 1))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/85 border border-red-500/45 flex items-center justify-center text-red-500 hover:text-white hover:border-red-500 hover:bg-red-600/25 active:scale-95 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.35)] hover:shadow-[0_0_25px_rgba(239,68,68,0.7)] focus:outline-none z-20 font-black text-xl"
                  title="Next Slide"
                >
                  ›
                </button>
                
                {/* Index counter badge */}
                <div className="absolute top-4 right-4 bg-black/90 px-3.5 py-1.5 rounded-full border border-red-500/30 font-mono text-[9px] text-gray-400 tracking-wider">
                  <span className="text-red-500 font-extrabold">{activeImgIndex + 1}</span> <span className="opacity-40">/</span> {additionalImages.length + 1}
                </div>
              </div>
            </div>

            {/* Thumbnail Strip with Clean aspect-video layout & High visibility outline active indicators */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4 pb-2">
              {/* Slide 0 is the original main image */}
              <button 
                onClick={() => setActiveImgIndex(0)}
                className={`relative aspect-video h-16 w-auto rounded-xl overflow-hidden border shrink-0 transition-transform duration-300 hover:scale-105 ${
                  activeImgIndex === 0 
                    ? 'border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] scale-105 z-10' 
                    : 'border-white/10 hover:border-white/40'
                }`}
              >
                <img src={article.image_url || article.image || "/assets/vanguard-fallback.jpg"} referrerPolicy="no-referrer" className="w-full h-full object-cover" alt="Main thumb" />
                <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[7px] font-mono py-0.5 tracking-wider text-center border-t border-white/5 uppercase">MAIN IMAGE</div>
              </button>
              
              {additionalImages.map((img, idx) => {
                const isActive = activeImgIndex === idx + 1;
                return (
                  <button 
                    key={idx}
                    onClick={() => setActiveImgIndex(idx + 1)}
                    className={`relative aspect-video h-16 w-auto rounded-xl overflow-hidden border shrink-0 transition-transform duration-300 hover:scale-105 ${
                      isActive 
                        ? 'border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] scale-105 z-10' 
                        : 'border-white/10 hover:border-white/40'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`Thumb ${idx + 1}`} />
                    <div className="absolute bottom-0 inset-x-0 bg-black/75 text-[7px] font-mono py-0.5 tracking-wider text-center border-t border-white/5 uppercase">PHOTO {idx + 1}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
