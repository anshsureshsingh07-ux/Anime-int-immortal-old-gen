import { useState, useEffect } from 'react';
import { Send, User, Clock, MessageSquare, AlertTriangle, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface Comment {
  id: string;
  article_id: string;
  user_name: string;
  user_email: string;
  comment_text: string;
  created_at: string;
}

interface CommentSectionProps {
  articleId: string | number;
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [senderName, setSenderName] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const strArticleId = String(articleId);

  useEffect(() => {
    // Monitor auth to auto-assign names and emails
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserEmail(user.email);
        const derivedName = user.displayName || user.email?.split('@')[0] || 'VANGUARD_OPERATIVE';
        setSenderName(derivedName.toUpperCase());
      } else {
        setUserEmail(null);
        setSenderName('');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('article_comments')
        .select('*')
        .eq('article_id', strArticleId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err: any) {
      console.warn('Failed to load article comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();

    // Setup real-time postgres changes listener to load newly inserted comments instantly!
    const channel = supabase
      .channel(`comments_channel_${strArticleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'article_comments',
          filter: `article_id=eq.${strArticleId}`
        },
        (payload) => {
          const newComment = payload.new as Comment;
          setComments((prev) => {
            if (prev.some((c) => c.id === newComment.id)) return prev;
            return [...prev, newComment];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [strArticleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);

    const text = commentText.trim();
    const name = senderName.trim() || 'ANONYMOUS_OPERATIVE';

    if (!text) {
      setErrorText('COMMENT PAYLOAD EMPTY. TRANSMISSION TERMINATED.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        article_id: strArticleId,
        user_name: name.toUpperCase(),
        user_email: userEmail || 'anonymous_packet@nexus.net',
        comment_text: text,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('article_comments')
        .insert([payload]);

      if (error) throw error;

      setCommentText('');
      fetchComments(); // Reload to align client index state
    } catch (err: any) {
      console.error('Failed to post comment packet:', err);
      setErrorText(err?.message || 'CRITICAL TRANSMISSION FATAL TIMEOUT // ACCESS DENIED');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#050505] border border-[#1F1F1F] rounded-lg mt-4 p-4 font-mono select-text text-left relative overflow-hidden">
      {/* Decorative Matrix Grid Segment */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(#e50914_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none" />

      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/5">
        <MessageSquare size={13} className="text-[#E50914] animate-pulse" />
        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
          NEURAL DISCUSSIONS // {comments.length} CHANNELS INSTALLED
        </h4>
      </div>

      {loading ? (
        <div className="py-6 text-center text-[10px] uppercase text-zinc-600 tracking-wider">
          POLLING FEED CORRIDORS...
        </div>
      ) : (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {comments.length === 0 ? (
            <div className="py-4 text-[#E50914]/40 text-center text-[9px] uppercase tracking-widest bg-black/40 border border-[#E50914]/5 rounded">
              No secure network transmissions logged yet on this node.
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {comments.map((comment) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-black border-l-2 border-[#E50914] p-3 rounded-r border-y border-r border-[#1F1F1F] transition-colors hover:border-zinc-800"
                >
                  <div className="flex justify-between items-center text-[8.5px] text-zinc-500 mb-1">
                    <span className="font-bold text-zinc-300 uppercase tracking-widest">
                      ◆ {comment.user_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={9} />
                      {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-mono tracking-wide break-words whitespace-pre-line select-text">
                    {comment.comment_text}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Adding Comment Form */}
      <form onSubmit={handleSubmit} className="mt-4 pt-3 border-t border-white/5 space-y-3">
        {errorText && (
          <div className="bg-red-950/20 border border-red-900/40 p-2 rounded text-red-400 text-[8.5px] flex items-center gap-1.5 uppercase tracking-wider">
            <AlertTriangle size={11} className="shrink-0 text-[#E50914]" />
            <span>{errorText}</span>
          </div>
        )}

        <div className="flex gap-2">
          {!userEmail && (
            <input
              type="text"
              placeholder="OPERATIVE ALIAS"
              required
              maxLength={20}
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-1/3 bg-black border border-zinc-800 rounded p-1.5 text-[10px] text-white focus:outline-none focus:border-[#E50914] transition-colors uppercase placeholder-zinc-700"
            />
          )}
          <input
            type="text"
            required
            placeholder={userEmail ? `REPLY AS ${senderName}...` : "REPLY TO CHRONO STREAM..."}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 bg-black border border-zinc-800 rounded p-1.5 text-[10px] text-white focus:outline-none focus:border-[#E50914] transition-colors placeholder-zinc-700"
          />
          <button
            type="submit"
            disabled={submitting}
            className="px-3 bg-gradient-to-r from-red-600 to-[#E50914] text-white rounded hover:brightness-110 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-md"
          >
            <Send size={11} />
          </button>
        </div>
        {userEmail ? (
          <p className="text-[7.5px] text-zinc-600 uppercase tracking-widest select-none">
            Logged In via Terminal Authentication Core: {userEmail}
          </p>
        ) : (
          <p className="text-[7.5px] text-zinc-600 uppercase tracking-widest select-none">
            Anonymous operant detected. Consider logging in for static credential identity.
          </p>
        )}
      </form>
    </div>
  );
}
