import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, User, Zap, Activity, Cpu } from 'lucide-react';
import { playDigitalSound } from '../lib/sounds';
import { generateInternalLink } from '../utils/urlFormatter';

interface Article {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  image?: string;
  created_at: string;
  author_name: string;
  author_id?: string;
}

interface RelatedNewsModuleProps {
  currentArticle: Article | null;
}

export default function RelatedNewsModule({ currentArticle }: RelatedNewsModuleProps) {
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper function to extract keywords
  const extractKeywords = (title?: string, category?: string, description?: string): string[] => {
    const merged = `${title || ''} ${category || ''} ${description || ''}`.toLowerCase();
    
    // Strip HTML/Signature comments if any
    const cleaned = merged.replace(/<!--.*?-->/g, '');
    
    // Clean and split words
    const words = cleaned.replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    
    // Core technical / semantic anime terms we want to preserve while removing boilerplate words
    const stopwords = new Set([
      'the', 'this', 'that', 'with', 'from', 'your', 'about', 'their', 'there',
      'what', 'when', 'where', 'which', 'who', 'whom', 'whose', 'why', 'how',
      'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
      'have', 'has', 'had', 'does', 'been', 'being', 'they', 'them', 'their',
      'and', 'but', 'for', 'nor', 'yet', 'some', 'any', 'none', 'each',
      'few', 'more', 'most', 'such', 'other', 'another', 'many', 'much', 'were',
      'is', 'are', 'was', 'were', 'tbe', 'and'
    ]);

    return Array.from(new Set(
      words.filter(w => w.length >= 3 && !stopwords.has(w))
    ));
  };

  useEffect(() => {
    if (!currentArticle) return;

    const fetchRelatedArticles = async () => {
      try {
        setLoading(true);
        // Fetch last 100 recent articles
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        if (!data) return;

        // Current article keywords
        const currentKeywords = extractKeywords(
          currentArticle.title,
          currentArticle.category,
          currentArticle.description
        );

        // Filter and compute matches
        const matches = data
          .filter((item: Article) => {
            // Exclude current article itself
            if (item.id === currentArticle.id) return false;
            // Exclude future scheduled articles
            if (new Date(item.created_at) > new Date()) return false;
            return true;
          })
          .map((item: Article) => {
            const itemKeywords = extractKeywords(item.title, item.category, item.description);
            // Calculate intersection
            const common = itemKeywords.filter(keyword => currentKeywords.includes(keyword));
            
            // Percentage dynamic matching score
            // Ensure any matches have at least 2 overlaps as requested,
            // then compute custom fancy prob weight around ~75% to ~98%.
            let probScore = 0;
            if (common.length >= 2) {
              probScore = Math.min(98, 70 + common.length * 6 + Math.floor(Math.random() * 4));
            }

            return {
              ...item,
              commonKeywordsCount: common.length,
              probability: probScore,
            };
          })
          .filter(item => item.commonKeywordsCount >= 2) // At least two keywords overlap
          .sort((a, b) => b.probability - a.probability || b.commonKeywordsCount - a.commonKeywordsCount)
          .slice(0, 3); // Maximum 3 items

        setRelated(matches);
      } catch (err) {
        console.error('Error computing related neural patterns:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRelatedArticles();
  }, [currentArticle]);

  if (loading) {
    return (
      <div className="mt-16 border border-cyan-500/10 bg-zinc-950/40 rounded-3xl p-8 text-center" id="related-news-loading">
        <div className="w-8 h-8 rounded-full border-2 border-t-cyan-400 border-r-transparent border-b-transparent border-l-transparent animate-spin mx-auto mb-4" />
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">
          ANALYZING CORRELATED TRANSMISSIONS...
        </span>
      </div>
    );
  }

  return (
    <div className="mt-20 space-y-8" id="related-news-section">
      {/* HUD Header */}
      <div className="flex items-center justify-between border-b border-[#00ffff]/10 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 bg-[#00ffff] rounded-full animate-ping shrink-0" />
          <div>
            <h3 className="text-xs font-black font-mono tracking-[0.25em] text-[#00ffff] uppercase">
              CORRELATED NEURAL PATTERNS
            </h3>
            <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-wider block mt-1">
              SECURE_NODE_HUD_V2 // PATTERN_RECOGNITION_CORE
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-[#00ffff]/5 border border-[#00ffff]/15 px-2.5 py-1 rounded text-[#00ffff]/80 text-[8px] font-mono whitespace-nowrap">
          <Activity size={10} className="animate-pulse" /> SCAN ACTIVE
        </div>
      </div>

      {related.length > 0 ? (
        /* Grid container */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="related-news-grid">
          {related.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              className="relative group rounded-2xl bg-zinc-950/60 border border-white/5 hover:border-[#00ffff]/30 overflow-hidden transition-all duration-300 backdrop-blur-md flex flex-col justify-between"
              whileHover={{
                y: -4,
                boxShadow: '0 0 25px rgba(0, 255, 255, 0.15)',
              }}
            >
              {/* Image & Header Overlay link */}
              <a 
                href={generateInternalLink(item.id)}
                onClick={() => playDigitalSound('click')}
                className="block flex-1"
              >
                {/* Media frame */}
                <div className="relative aspect-video w-full overflow-hidden border-b border-white/5 bg-black">
                  <img
                    src={item.image_url || item.image || "/assets/vanguard-fallback.jpg"}
                    referrerPolicy="no-referrer"
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  
                  {/* Category Pill Tag */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-[#00ffff]/10 border border-[#00ffff]/30 text-[#00ffff] text-[8px] font-bold font-mono px-2 py-0.5 rounded uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>

                  {/* Micro grid glow pulse effect (only active on group-hover) */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.05)_0%,transparent_70%)] pointer-events-none" />
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-3">
                  <h4 className="text-xs font-bold text-white group-hover:text-[#00ffff] transition-colors leading-snug line-clamp-2 uppercase font-mono tracking-tight">
                    {item.title}
                  </h4>
                  
                  <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed">
                    {item.description?.replace(/<!--.*?-->/g, '')}
                  </p>
                </div>
              </a>

              {/* Bottom Telemetry Card Info */}
              <div className="px-4 pb-4 pt-1 border-t border-white/5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 uppercase">
                  <span className="flex items-center gap-1.5">
                    <User size={10} className="text-[#00ffff]/60" /> {item.author_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={10} /> {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                  </span>
                </div>

                {/* Interactive Dynamic Probability display */}
                <div className="bg-[#00ffff]/5 border border-[#00ffff]/15 rounded-lg py-1.5 px-2.5 flex items-center justify-between">
                  <span className="text-[8px] font-mono font-black text-[#00ffff]/80 uppercase tracking-widest flex items-center gap-1">
                    <Cpu size={9} className="animate-spin-slow text-[#00ffff]" /> PROBABILISTIC LINK
                  </span>
                  <span className="text-[9px] font-black font-mono text-[#00ffff] drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">
                    Probability Match: {item.probability}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Fallback placeholder */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="border border-dashed border-zinc-800 bg-zinc-950/40 rounded-3xl py-12 px-6 flex flex-col items-center justify-center text-center space-y-3"
          id="related-news-fallback"
        >
          <div className="w-10 h-10 rounded-full border border-zinc-800 flex items-center justify-center text-zinc-600">
            <Zap size={18} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
              COHERENCE METRICS STABLE
            </span>
            <h5 className="text-xs font-black uppercase text-zinc-500 italic mt-1 bg-gradient-to-r from-zinc-500 to-zinc-400 bg-clip-text text-transparent">
              No correlated neural patterns detected
            </h5>
          </div>
        </motion.div>
      )}
    </div>
  );
}
