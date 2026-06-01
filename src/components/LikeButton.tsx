import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useThemeEngine } from '../context/ThemeEngineContext';
import { playDigitalSound } from '../lib/sounds';

interface LikeButtonProps {
  articleId: string | number;
}

export default function LikeButton({ articleId }: LikeButtonProps) {
  const [likesCount, setLikesCount] = useState<number>(0);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { incrementEngagement } = useThemeEngine();

  // Convert the ID to a string to align with the SQL schema
  const strArticleId = String(articleId);

  useEffect(() => {
    // Monitor auth state changes to fetch user ID
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.email || user.uid : null);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchLikesData = async () => {
      try {
        // Query database to get total count
        const { data: countData, error: countErr } = await supabase
          .from('article_likes')
          .select('user_id')
          .eq('article_id', strArticleId);

        if (countErr) throw countErr;

        if (isMounted && countData) {
          setLikesCount(countData.length);
          
          if (userId) {
            const userHasLiked = countData.some(row => row.user_id === userId);
            setIsLiked(userHasLiked);
          } else {
            setIsLiked(false);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch likes data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLikesData();

    // Subscribe to realtime likes updates
    const channel = supabase
      .channel(`likes_channel_${strArticleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'article_likes',
          filter: `article_id=eq.${strArticleId}`
        },
        () => {
          fetchLikesData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [strArticleId, userId]);

  const handleLikeToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    playDigitalSound('click');
    incrementEngagement(1);

    if (!userId) {
      // Use local storage fallback identifier for non-logged-in users, or standard anonymous ID to ensure high-fidelity experience
      const localAnonId = localStorage.getItem('vanguard_anon_user_id') || `anon_${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('vanguard_anon_user_id', localAnonId);
      triggerLikeWithUserId(localAnonId);
      return;
    }

    triggerLikeWithUserId(userId);
  };

  const triggerLikeWithUserId = async (activeUserId: string) => {
    // Save backup state for failure reversal (Optimistic Rollback)
    const backupIsLiked = isLiked;
    const backupLikesCount = likesCount;

    // Optimistically toggle matching UI elements immediately
    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);
    setLikesCount(prev => nextIsLiked ? prev + 1 : Math.max(0, prev - 1));

    try {
      if (nextIsLiked) {
        // Insert Like
        const { error } = await supabase
          .from('article_likes')
          .insert([{ article_id: strArticleId, user_id: activeUserId }]);

        if (error) throw error;
      } else {
        // Delete Like by matching both criteria explicitly to avoid syntax inconsistencies
        const { error } = await supabase
          .from('article_likes')
          .delete()
          .eq('article_id', strArticleId)
          .eq('user_id', activeUserId);

        if (error) throw error;
      }
    } catch (err) {
      console.warn('Optimistic like toggle failed, rolling back:', err);
      // Revert states
      setIsLiked(backupIsLiked);
      setLikesCount(backupLikesCount);
    }
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.9 }}
      onClick={handleLikeToggle}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[9.5px] font-mono tracking-wider font-semibold transition-all duration-300 ${
        isLiked 
          ? 'bg-[#E50914]/10 text-[#E50914] border-[#E50914] shadow-[0_0_10px_rgba(229,9,20,0.2)]' 
          : 'bg-black/40 text-zinc-500 border-zinc-800 hover:text-white hover:border-zinc-700'
      }`}
    >
      <Heart 
        size={11} 
        className={`transition-transform duration-300 ${isLiked ? 'fill-[#E50914] scale-110' : ''}`} 
      />
      <span>{likesCount} LIKES</span>
    </motion.button>
  );
}
