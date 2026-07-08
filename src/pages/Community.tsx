import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, ArrowBigUp, ArrowBigDown, Share2, Search, Plus, 
  CornerDownRight, Bookmark, TrendingUp, Clock, Sparkles, Code, 
  AlertTriangle, ChevronLeft, User, Copy, CheckCircle, MessageCircle, Send,
  Sliders, RefreshCw, Star, Info, Wifi, Radio, Shield, Zap, Hand, Volume2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { playDigitalSound } from '../lib/sounds';

// Thread interface and structures matching a clean Reddit-style forum schema
interface Thread {
  id: string;
  title: string;
  content: string;
  category: string;
  upvotes: number;
  downvotes: number;
  author_id: string;
  author_name: string;
  author_avatar: string;
  created_at: string;
  comments_count: number;
  
  // local toggle state
  user_vote?: 'up' | 'down' | null;
}

interface Comment {
  id: string;
  thread_id: string;
  parent_id: string | null;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  created_at: string;
  replies?: Comment[];
}

// Initial mock threads fallback matching what an anime community would discuss
const INITIAL_THEME_THREADS: Thread[] = [
  {
    id: "3e236ad4-1bba-4e92-a7f4-ffc5cf32b68d",
    title: "Project Zero Theory: Is the Vanguard Command Core actually harnessing Mako Grid energy?",
    content: "After decrypting some of the Terminal Logs in Sector Tactical Maps, I noticed anomalous code fragments referencing Project Zero. It seems that the power flow correlates directly with the House Treasury. Could this mean that the faction war is an orchestrated simulation to fuel neural matrices? Let me hear your thoughts on the lore!",
    category: "Theory",
    upvotes: 42,
    downvotes: 2,
    author_id: "system-oracle-id",
    author_name: "Shinra_Hacker_99",
    author_avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(), // 3h ago
    comments_count: 5,
    user_vote: null
  },
  {
    id: "4f7389a1-cb9e-436d-98e3-0dffa260e0ef",
    title: "V1.0.8 Neural Balance Update: Sector-9 Buff review for Faction Command positions",
    content: "The latest balancing patch seems to heavily benefit Cybernetic alignment trees. With tactical shields holding 15% longer and news writer credentials now having override authority over breaking feeds, squad tactical leaders are eating good. Do you think mecha builds are now S-Tier?",
    category: "Discussion",
    upvotes: 29,
    downvotes: 4,
    author_id: "adm-core-id",
    author_name: "Neon_Samurai_101",
    author_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(), // 8h ago
    comments_count: 2,
    user_vote: null
  },
  {
    id: "9cb7127e-8c34-4b53-a159-d830b80957dc",
    title: "[Fan-Art] High-Res wallpaper render of the Nexus Treasury central storage core",
    content: "Spent all night modeling and rendering the central crystal vault from the Nexus Treasury page. Added some subtle red laser grids and crimson fog alerts to match our mainframe terminal vibe. Feel free to use it for your layouts or profile backgrounds!",
    category: "Art & Media",
    upvotes: 87,
    downvotes: 1,
    author_id: "cyber-artist-id",
    author_name: "Yuki_Render_Art",
    author_avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(), // 1d ago
    comments_count: 7,
    user_vote: null
  },
  {
    id: "cc3b06a2-6eb4-44df-be9e-f0b093de584e",
    title: "When you try to convert V-COIN but you haven't authorized your tactical signature key...",
    content: "We've all faced it. You load up Nexus Treasury, click Convert Balance, lock in 500 V-COIN, and bam... 'Key transmission validation error'. Just standard security compliance blocking my fast tracks to elite status! Standard rookie operating errors.",
    category: "Meme Section",
    upvotes: 121,
    downvotes: 9,
    author_id: "funny-guy-id",
    author_name: "Meme_Shinobi",
    author_avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2d ago
    comments_count: 12,
    user_vote: 'up'
  }
];

const INITIAL_MOCK_COMMENTS: Comment[] = [
  {
    id: "comm-1",
    thread_id: "3e236ad4-1bba-4e92-a7f4-ffc5cf32b68d",
    parent_id: null,
    content: "Awesome read! I actually decrypted a matching sequence in the database page too. The 'xp_multiplier' field in profiles has an optional boolean check connected to Vanguard command center triggers. It fits perfectly into this theory.",
    author_id: "user-beta-id",
    author_name: "Vanguard_Scout",
    author_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: "comm-2",
    thread_id: "3e236ad4-1bba-4e92-a7f4-ffc5cf32b68d",
    parent_id: "comm-1",
    content: "Exactly! Also, look at the house treasurer balances from yesterday... there was a sudden debit of 14,000 CR that coincided with the Faction War tactical shift in Alpha Sector 9.",
    author_id: "user-lore-id",
    author_name: "Lore_Master_Zero",
    author_avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150",
    created_at: new Date(Date.now() - 3600000 * 1.5).toISOString()
  },
  {
    id: "comm-3",
    thread_id: "3e236ad4-1bba-4e92-a7f4-ffc5cf32b68d",
    parent_id: null,
    content: "This is too deep for me, I'm just here to trade items on the Marketplace and convert carbon credits, haha.",
    author_id: "user-trader-id",
    author_name: "Market_Hustler",
    author_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    created_at: new Date(Date.now() - 3600000 * 1).toISOString()
  },
  {
    id: "comm-4",
    thread_id: "3e236ad4-1bba-4e92-a7f4-ffc5cf32b68d",
    parent_id: "comm-3",
    content: "Same honestly. Speaking of marketplace, the tax on crystal upgrades is getting real hefty.",
    author_id: "user-coiner-id",
    author_name: "V_Coin_Whale",
    author_avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=150",
    created_at: new Date(Date.now() - 3600000 * 0.5).toISOString()
  },
  {
    id: "comm-5",
    thread_id: "3e236ad4-1bba-4e92-a7f4-ffc5cf32b68d",
    parent_id: "comm-4",
    content: "We should pool our squad funds together next cycle to bypass the tariff blocks.",
    author_id: "user-beta-id",
    author_name: "Vanguard_Scout",
    author_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    created_at: new Date(Date.now() - 3600000 * 0.2).toISOString()
  }
];

export default function Community() {
  // Navigation & UI States
  const [activeView, setActiveView] = useState<'feed' | 'detail'>('feed');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'hot' | 'new' | 'top'>('hot');

  // Core Data Lists
  const [threads, setThreads] = useState<Thread[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  // New Thread Input States
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Discussion');

  // User Authentication details
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  
  // ==========================================
  // REAL-TIME COMM-LINK STATE (WEBSOCKETS)
  // ==========================================
  const [commsTab, setCommsTab] = useState<'forum' | 'mainframe'>('forum');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [onlineOperators, setOnlineOperators] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedOp, setSelectedOp] = useState<any | null>(null);
  const [pingAlert, setPingAlert] = useState<any | null>(null);
  const [myConnectionId, setMyConnectionId] = useState<string>('');
  const myConnectionIdRef = useRef<string>('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Determine active profile coordinates to publish under presence list
    if (!profile) return;

    let socket: WebSocket | null = null;
    let reconnectTimeout: any;

    const connectWebSocket = () => {
      setWsStatus('connecting');
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        console.log("[WS Client] Connecting to Comms Mainframe on shared port:", wsUrl);
        
        socket = new WebSocket(wsUrl);

        socket.onopen = () => {
          console.log("[WS Client] Linked successfully to the Comms Mainframe.");
          setWsStatus('connected');
          setWs(socket);

          const cachedFaction = localStorage.getItem('active_faction_name') || 'akatsuki';
          socket?.send(JSON.stringify({
            type: "join",
            data: {
              username: profile?.username || "Guest Operator",
              avatarUrl: profile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
              faction: cachedFaction,
              role: profile?.role || "MEMBER"
            }
          }));
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            const { type, data } = payload;

            switch (type) {
              case "welcome":
                setMyConnectionId(data.id);
                myConnectionIdRef.current = data.id;
                console.log("[WS Handshake Completed] Connection registered ID:", data.id);
                break;

              case "presence_update":
                setOnlineOperators(data.onlineOperators || []);
                break;

              case "chat_receive":
                setChatMessages(prev => {
                  if (prev.some(m => m.id === data.id)) return prev;
                  return [...prev, data].slice(-100);
                });
                break;

              case "ping_received":
                if (!data.targetId || data.targetId === myConnectionIdRef.current) {
                  playDigitalSound('whir');
                  setTimeout(() => playDigitalSound('ping'), 120);
                  setPingAlert(data);
                  setTimeout(() => setPingAlert(null), 6000);
                }
                break;

              case "system_broadcast":
                const sysMsg = {
                  id: `sys_${Math.random()}`,
                  content: data.message,
                  isSystem: true,
                  createdAt: new Date().toISOString()
                };
                setChatMessages(prev => [...prev, sysMsg].slice(-100));
                
                // Do not spam alerts sounds unless active in mainframe to prevent annoyance
                playDigitalSound('ping');
                break;

              default:
                break;
            }
          } catch (err: any) {
            console.error("[WS Handler Error] Message dispatch anomaly:", err.message);
          }
        };

        socket.onclose = () => {
          console.warn("[WS Client Link Lost] Retrying synchronization in 4s...");
          setWsStatus('disconnected');
          setWs(null);
          reconnectTimeout = setTimeout(connectWebSocket, 4000);
        };

        socket.onerror = (err) => {
          console.error("[WS Client Transmit Anomaly] Server socket exception:", err);
          socket?.close();
        };

      } catch (e: any) {
        console.error("[WS Client Connection Error] Link exception:", e.message);
        setWsStatus('disconnected');
        reconnectTimeout = setTimeout(connectWebSocket, 5000);
      }
    };

    connectWebSocket();

    return () => {
      if (socket) {
        socket.close();
      }
      clearTimeout(reconnectTimeout);
    };
  }, [profile]);

  // Autoscroll hooks for chat
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, commsTab]);

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !ws || ws.readyState !== WebSocket.OPEN) return;

    playDigitalSound('click');
    ws.send(JSON.stringify({
      type: "chat_message",
      data: {
        content: chatInput.trim()
      }
    }));
    setChatInput('');
  };

  const transmitHolographicPing = (targetId: string, targetName: string, pingType: 'wave' | 'tactile' | 'alert') => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    playDigitalSound('ping');
    ws.send(JSON.stringify({
      type: "holographic_ping",
      data: {
        targetId,
        targetName,
        pingType
      }
    }));

    setFeedback({
      success: true,
      message: `Holographic ${pingType.toUpperCase()} signal relayed to Operator "${targetName}"`
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Connection diagnostics & indicators
  const [isUsingSupabase, setIsUsingSupabase] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  // Categories list matching standard anime themes
  const categories = ['All', 'Theory', 'Discussion', 'Art & Media', 'Meme Section'];

  // SQL code to setup tables in case users need it in Supabase editor
  const sqlSchema = `-- Community Threads and Comment system schema
-- Execute this query inside your Supabase SQL Editor to provision tables:

CREATE TABLE IF NOT EXISTS public.community_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    category TEXT DEFAULT 'Discussion',
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    comments_count INTEGER DEFAULT 0,
    user_vote TEXT DEFAULT NULL -- helper local view tracker
);

CREATE TABLE IF NOT EXISTS public.community_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES public.community_threads(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security) and append Policies
ALTER TABLE public.community_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read community_threads" ON public.community_threads FOR SELECT USING (true);
CREATE POLICY "Allow auth insert community_threads" ON public.community_threads FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Allow auth manage community_threads" ON public.community_threads FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Allow public read community_comments" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "Allow auth insert community_comments" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
`;

  // 1. SYNC AUTHENTICATION STATE
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', firebaseUser.uid)
            .single();
          if (dbProfile) {
            setProfile(dbProfile);
          } else {
            // fallback profile matching typical guest users
            setProfile({
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Operator",
              avatar_url: firebaseUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
              role: "member"
            });
          }
        } catch {
          // fallback profile
          setProfile({
            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "Operator",
            avatar_url: firebaseUser.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
            role: "member"
          });
        }
      } else {
        // Mock Guest user authentication
        setUser({ uid: "guest-user-session", email: "guest@animeint.com" });
        setProfile({
          username: "Guest_Operator_" + Math.floor(Math.random() * 900 + 100),
          avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
          role: "member"
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. FETCH THREADS AND VOTE DATA (SUPABASE WITH RESILIENT LOCAL FALLBACK)
  const syncForumData = async () => {
    setIsSyncing(true);
    try {
      // Test fetching from Supabase
      const { data: remoteThreads, error: threadsErr } = await supabase
        .from('community_threads')
        .select('*')
        .order('created_at', { ascending: false });

      if (threadsErr || !remoteThreads) {
        throw new Error(threadsErr?.message || "Table not provisioned in Supabase");
      }

      // If successful, save remote threads state
      setThreads(remoteThreads);
      setIsUsingSupabase(true);
    } catch (err: any) {
      console.warn("[Community Matrix Relay] Falling back to Local Session datastore emulator:", err.message);
      setIsUsingSupabase(false);
      
      // Load from localStorage or seed initial data
      const stored = localStorage.getItem('nexus_community_threads');
      if (stored) {
        try {
          setThreads(JSON.parse(stored));
        } catch {
          setThreads(INITIAL_THEME_THREADS);
          localStorage.setItem('nexus_community_threads', JSON.stringify(INITIAL_THEME_THREADS));
        }
      } else {
        setThreads(INITIAL_THEME_THREADS);
        localStorage.setItem('nexus_community_threads', JSON.stringify(INITIAL_THEME_THREADS));
      }
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncForumData();
  }, []);

  // 3. FETCH COMMENTS (RESILIENT BINDINGS)
  const fetchCommentsForThread = async (threadId: string) => {
    try {
      if (isUsingSupabase) {
        const { data: remoteComments, error: commsErr } = await supabase
          .from('community_comments')
          .select('*')
          .eq('thread_id', threadId)
          .order('created_at', { ascending: true });

        if (commsErr || !remoteComments) throw new Error(commsErr?.message);
        setComments(remoteComments);
      } else {
        // local emulator retrieve
        const storedComms = localStorage.getItem(`nexus_comments_${threadId}`);
        if (storedComms) {
          setComments(JSON.parse(storedComms));
        } else {
          // seed fallback list
          const relevant = INITIAL_MOCK_COMMENTS.filter(c => c.thread_id === threadId);
          setComments(relevant);
          localStorage.setItem(`nexus_comments_${threadId}`, JSON.stringify(relevant));
        }
      }
    } catch (e) {
      console.error("[Relay] Failed reading comments from Supabase, loading fallback", e);
      const relevant = INITIAL_MOCK_COMMENTS.filter(c => c.thread_id === threadId);
      setComments(relevant);
    }
  };

  // Synchronize on thread clicks
  const handleSelectThread = (thread: Thread) => {
    playDigitalSound('click');
    setSelectedThread(thread);
    setActiveView('detail');
    setCommentInput('');
    setReplyInputs({});
    setActiveReplyId(null);
    fetchCommentsForThread(thread.id);
  };

  const handleBackToFeed = () => {
    playDigitalSound('click');
    setActiveView('feed');
    setSelectedThread(null);
    syncForumData();
  };

  // 4. SUBMIT NEW THREAD
  const handleCreateThreadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    playDigitalSound('ping');
    setIsSyncing(true);

    const payload: Thread = {
      id: crypto.randomUUID(),
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      upvotes: 1,
      downvotes: 0,
      author_id: user?.uid || "guest-user",
      author_name: profile?.username || "Operator",
      author_avatar: profile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
      created_at: new Date().toISOString(),
      comments_count: 0,
      user_vote: 'up' // Upvote own thread
    };

    try {
      if (isUsingSupabase) {
        const { error: insertErr } = await supabase
          .from('community_threads')
          .insert([payload]);
        if (insertErr) throw insertErr;
        setFeedback({ success: true, message: `Successfully published thread in Supabase: ${newCategory}` });
      } else {
        // write locally
        const currentThreads = [payload, ...threads];
        setThreads(currentThreads);
        localStorage.setItem('nexus_community_threads', JSON.stringify(currentThreads));
        setFeedback({ success: true, message: "[EMULATOR] Thread posted and cached successfully in localStorage." });
      }

      setNewTitle('');
      setNewContent('');
      setIsCreatingThread(false);
      // Auto refresh list without page refresh
      syncForumData();
    } catch (err: any) {
      // grace fail back
      const currentThreads = [payload, ...threads];
      setThreads(currentThreads);
      localStorage.setItem('nexus_community_threads', JSON.stringify(currentThreads));
      setFeedback({ success: true, message: `DB warning (relayed locally): ${err.message}` });
      setIsCreatingThread(false);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // 5. UPVOTE / DOWNVOTE REALTIME TOGGLES
  const handleVoteThread = async (thread: Thread, voteType: 'up' | 'down', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playDigitalSound('click');

    const updatedThreads = threads.map(t => {
      if (t.id === thread.id) {
        let upAdd = 0;
        let downAdd = 0;
        let nextVote: 'up' | 'down' | null = voteType;

        if (t.user_vote === voteType) {
          // Undo same vote
          nextVote = null;
          if (voteType === 'up') upAdd = -1;
          else downAdd = -1;
        } else {
          // Switch or create vote
          if (voteType === 'up') {
            upAdd = 1;
            if (t.user_vote === 'down') downAdd = -1;
          } else {
            downAdd = 1;
            if (t.user_vote === 'up') upAdd = -1;
          }
        }

        const newUp = Math.max(0, t.upvotes + upAdd);
        const newDown = Math.max(0, t.downvotes + downAdd);

        return {
          ...t,
          upvotes: newUp,
          downvotes: newDown,
          user_vote: nextVote
        };
      }
      return t;
    });

    setThreads(updatedThreads);
    if (!isUsingSupabase) {
      localStorage.setItem('nexus_community_threads', JSON.stringify(updatedThreads));
    }

    // Update state of selected Thread if inside Detail View
    if (selectedThread && selectedThread.id === thread.id) {
      const match = updatedThreads.find(t => t.id === thread.id);
      if (match) setSelectedThread(match);
    }

    // Propagate backend update to Supabase
    try {
      if (isUsingSupabase) {
        const item = updatedThreads.find(t => t.id === thread.id);
        if (item) {
          const { error: updErr } = await supabase
            .from('community_threads')
            .update({
              upvotes: item.upvotes,
              downvotes: item.downvotes,
              user_vote: item.user_vote
            })
            .eq('id', thread.id);
          if (updErr) throw updErr;
        }
      }
    } catch (dbErr: any) {
      console.warn("Could not save vote in database, saved to local cache:", dbErr.message);
    }
  };

  // 6. SUBMIT COMMENT & NESTED REPLY
  const handleAddComment = async (parentId: string | null = null) => {
    const textValue = parentId ? replyInputs[parentId] : commentInput;
    if (!textValue || !textValue.trim() || !selectedThread) return;

    playDigitalSound('ping');
    setIsSyncing(true);

    const newComment: Comment = {
      id: crypto.randomUUID(),
      thread_id: selectedThread.id,
      parent_id: parentId,
      content: textValue.trim(),
      author_id: user?.uid || "guest-id",
      author_name: profile?.username || "Anonymous Operator",
      author_avatar: profile?.avatar_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      created_at: new Date().toISOString()
    };

    // Optimistically push comment or nested comment reply locally
    const nextCommsList = [...comments, newComment];
    setComments(nextCommsList);

    // Update corresponding Thread Comments count
    const updatedThreads = threads.map(t => {
      if (t.id === selectedThread.id) {
        return { ...t, comments_count: (t.comments_count || 0) + 1 };
      }
      return t;
    });
    setThreads(updatedThreads);
    if (selectedThread) {
      setSelectedThread({ ...selectedThread, comments_count: selectedThread.comments_count + 1 });
    }

    try {
      if (isUsingSupabase) {
        // Update thread comments_count in database + insert comment
        await supabase
          .from('community_threads')
          .update({ comments_count: selectedThread.comments_count + 1 })
          .eq('id', selectedThread.id);

        const { error: commInsertErr } = await supabase
          .from('community_comments')
          .insert([newComment]);
        if (commInsertErr) throw commInsertErr;
      } else {
        localStorage.setItem(`nexus_comments_${selectedThread.id}`, JSON.stringify(nextCommsList));
        localStorage.setItem('nexus_community_threads', JSON.stringify(updatedThreads));
      }

      // Reset fields
      if (parentId) {
        setReplyInputs(prev => ({ ...prev, [parentId]: '' }));
        setActiveReplyId(null);
      } else {
        setCommentInput('');
      }

      // Sync and reload comments
      fetchCommentsForThread(selectedThread.id);
    } catch (err: any) {
      // Local fallback
      localStorage.setItem(`nexus_comments_${selectedThread.id}`, JSON.stringify(nextCommsList));
      localStorage.setItem('nexus_community_threads', JSON.stringify(updatedThreads));
      setReplyInputs(prev => ({ ...prev, [parentId || '']: '' }));
      setActiveReplyId(null);
      setCommentInput('');
    } finally {
      setIsSyncing(false);
    }
  };

  // Build recursive threaded comments structure matching Reddit-style indents
  const buildTree = (commsList: Comment[]): Comment[] => {
    const map: Record<string, Comment & { replies: Comment[] }> = {};
    const rootNodes: Comment[] = [];

    // Initialize map
    commsList.forEach(c => {
      map[c.id] = { ...c, replies: [] };
    });

    commsList.forEach(c => {
      const mapped = map[c.id];
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies.push(mapped);
      } else {
        rootNodes.push(mapped);
      }
    });

    return rootNodes;
  };

  const threadedCommentsTree = buildTree(comments);

  // Recursive formatter rendering component for Nested hierarchical comments
  const CommentNode = ({ node, depth = 0 }: { node: Comment; depth: number }) => {
    const isReplying = activeReplyId === node.id;
    const dateStr = new Date(node.created_at).toLocaleDateString() + ' ' + new Date(node.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
      <div 
        className="mt-3 relative"
        style={{ paddingLeft: depth > 0 ? '24px' : '0px' }}
      >
        {/* Visual Line Thread bracket indicators */}
        {depth > 0 && (
          <div className="absolute left-2.5 top-0 bottom-4 w-[1px] bg-red-500/10 hover:bg-red-500/20 transition-all" />
        )}

        <div className="bg-zinc-950/40 border border-white/5 rounded-2xl p-4 hover:border-red-500/10 transition-colors relative duration-300">
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.03] pb-2 mb-2 select-none">
            <div className="flex items-center gap-2">
              <img 
                src={node.author_avatar} 
                alt={node.author_name} 
                className="w-5 h-5 rounded-full object-cover border border-red-500/30"
                referrerPolicy="no-referrer"
              />
              <span className="text-xs font-bold text-white font-mono hover:text-red-400 cursor-pointer">{node.author_name}</span>
              {node.author_id === selectedThread?.author_id && (
                <span className="text-[7.5px] font-extrabold uppercase bg-red-500/20 text-red-400 border border-red-500/30 px-1 py-0.5 rounded ml-1 leading-none tracking-wider">
                  OP
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
              <Clock size={11} />
              <span>{dateStr}</span>
            </div>
          </div>

          <p className="text-xs text-zinc-300 font-sans leading-relaxed break-words whitespace-pre-line pl-1 mb-2.5">
            {node.content}
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                playDigitalSound('click');
                setActiveReplyId(isReplying ? null : node.id);
                setReplyInputs(prev => ({ ...prev, [node.id]: '' }));
              }}
              className="text-[9px] font-mono font-black uppercase text-zinc-500 hover:text-red-400 transition-colors inline-flex items-center gap-1 leading-none"
            >
              <CornerDownRight size={12} className="text-red-500/60" />
              Reply
            </button>
          </div>

          {/* Inline reply composer */}
          <AnimatePresence>
            {isReplying && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-3"
              >
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder={`Reply to ${node.author_name}...`}
                    value={replyInputs[node.id] || ''}
                    onChange={(e) => setReplyInputs(prev => ({ ...prev, [node.id]: e.target.value }))}
                    className="flex-1 bg-zinc-950 border border-white/5 rounded-xl p-2.5 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-red-500/30 font-sans resize-none"
                  />
                  <div className="flex flex-col justify-end gap-1.5 shrink-0">
                    <button
                      onClick={() => handleAddComment(node.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 font-mono text-[9px] font-black uppercase tracking-wider text-white rounded-xl inline-flex items-center gap-1 leading-none transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                    >
                      <Send size={10} />
                      Send
                    </button>
                    <button
                      onClick={() => {
                        playDigitalSound('click');
                        setActiveReplyId(null);
                      }}
                      className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[9px] font-mono font-black uppercase rounded-xl leading-none"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Recursive rendering of nested children replies */}
        {node.replies && node.replies.length > 0 && (
          <div className="space-y-2 mt-1">
            {node.replies.map(reply => (
              <CommentNode key={reply.id} node={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // 7. FILTER & SORT LOGIC FOR THE FEED
  const filteredThreads = threads
    .filter(t => {
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'new') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'top') {
        const votesA = a.upvotes - a.downvotes;
        const votesB = b.upvotes - b.downvotes;
        return votesB - votesA;
      }
      // Hot logic (Popular + comments weight)
      const scoreA = a.upvotes - a.downvotes + (a.comments_count || 0) * 2;
      const scoreB = b.upvotes - b.downvotes + (b.comments_count || 0) * 2;
      return scoreB - scoreA;
    });

  // Share link copy popup helper
  const handleShareThread = (thread: Thread, e: React.MouseEvent) => {
    e.stopPropagation();
    playDigitalSound('ping');
    navigator.clipboard.writeText(`${window.location.origin}/community?id=${thread.id}`);
    setFeedback({ success: true, message: "Share link copied back to clip buffer!" });
    setTimeout(() => setFeedback(null), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-zinc-200 min-h-screen">
      
      {/* 1. COMMUNITY DIRECTORY HEADER BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-black border border-white/5 p-6 rounded-3xl flex flex-col md:flex-row justify-between md:items-center gap-6 shadow-[0_0_50px_rgba(239,68,68,0.02)] select-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/[0.02] rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col gap-1.5 z-10 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${isUsingSupabase ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span className={`text-[10px] font-mono tracking-widest uppercase font-black ${isUsingSupabase ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isUsingSupabase ? 'DATABASE SECURE: SUPABASE CONNECTED' : 'DATABASE RELAY: LOCAL SESSION CACHE'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2 bg-gradient-to-r from-white via-zinc-100 to-red-400 bg-clip-text text-transparent">
            Nexus Community <span className="text-red-500 font-serif lowercase italic">&</span> Threads
          </h1>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            OPERATOR DISCUSSIONS // SYSTEM PROTOCOLS // THEORY BOARDS
          </p>
        </div>

        {/* Database Diagnostic Action Blocks */}
        <div className="flex items-center gap-3 z-10 font-mono text-xs shrink-0 select-text">
          <button
            onClick={() => {
              playDigitalSound('click');
              setShowSqlGuide(!showSqlGuide);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-90 w-fit rounded-xl border border-white/5 text-zinc-400 hover:text-white transition-all text-[10px] uppercase font-bold"
          >
            <Code size={13} className="text-red-500" />
            SQL Schema
          </button>
          
          <button
            onClick={() => {
              playDigitalSound('click');
              syncForumData();
            }}
            className={`p-2 bg-zinc-950 rounded-xl border border-white/5 text-zinc-400 hover:text-white transition-all ${
              isSyncing ? 'animate-spin' : ''
            }`}
            title="Force refresh index"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* SQL INITIALIZATION DIALOG */}
      <AnimatePresence>
        {showSqlGuide && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#09090b] border border-red-500/20 p-5 rounded-3xl flex flex-col gap-3 font-mono text-xs shadow-lg relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/[0.01] rounded-full blur-3xl" />
            <div className="flex items-center justify-between text-white border-b border-white/5 pb-2.5">
              <span className="flex items-center gap-1.5 font-bold text-red-400 text-[10px] tracking-wider uppercase">
                <AlertTriangle size={14} /> Setup Supabase Tables Instructions
              </span>
              <button 
                onClick={() => {
                  playDigitalSound('click');
                  navigator.clipboard.writeText(sqlSchema);
                  setFeedback({ success: true, message: "SQL queries compiled to clipboard!" });
                  setTimeout(() => setFeedback(null), 3500);
                }}
                className="text-[9.5px] uppercase font-black text-zinc-500 hover:text-white flex items-center gap-1 bg-zinc-950 px-2 py-1 rounded-lg border border-white/5 border-dashed"
              >
                <Copy size={11} /> Copy Query
              </button>
            </div>
            
            <p className="text-[10px] text-zinc-400 leading-relaxed pl-1 select-text">
              By default, if the <code className="text-red-400">community_threads</code> or <code className="text-red-400">community_comments</code> tables do not exist in your Supabase backend yet, our resilient forum emulator falls back to full local localStorage caching so you can use the community threads page instantly. To enable database persistence in Supabase, execute the SQL queries above in your <strong>Supabase Project → SQL Editor</strong>.
            </p>

            <pre className="bg-black/60 p-3.5 rounded-xl overflow-x-auto text-[10px] text-zinc-500 border border-white/5 h-[140px] max-h-[140px] select-text scrollbar-thin">
              {sqlSchema}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. REAL-TIME BANNER FEEDBACK POPUPS */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`fixed bottom-5 right-5 p-4 rounded-2xl border flex items-center gap-3 z-50 shadow-2xl font-mono text-xs ${
              feedback.success 
                ? 'bg-emerald-950/80 border-emerald-500/20 text-emerald-300' 
                : 'bg-rose-950/80 border-rose-500/20 text-rose-300'
            }`}
          >
            {feedback.success ? <CheckCircle size={15} /> : <AlertTriangle size={15} />}
            <span>{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2.5 HOLOGRAPHIC INCOMING REAL-TIME ALERTS */}
      <AnimatePresence>
        {pingAlert && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            className="bg-[#09090b]/95 border-2 border-red-500/60 p-4 rounded-3xl shadow-[0_0_40px_rgba(239,68,68,0.3)] flex flex-col gap-2 relative overflow-hidden font-mono z-50 text-xs"
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500 animate-pulse" />
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-red-500 font-extrabold text-[9px] tracking-wider uppercase animate-pulse">
                <Shield size={13} className="text-red-500" />
                TACTICAL MAIN INTERCEPT: {pingAlert.pingType.toUpperCase()}
              </span>
              <button 
                onClick={() => setPingAlert(null)}
                className="text-zinc-600 hover:text-white text-[8px] uppercase font-black"
              >
                Dismiss Override
              </button>
            </div>
            <div className="flex items-center gap-3 bg-black/60 p-3 rounded-2xl border border-white/5">
              <div className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 text-sm shrink-0">
                {pingAlert.pingType === 'wave' && '👋'}
                {pingAlert.pingType === 'tactile' && '⚡'}
                {pingAlert.pingType === 'alert' && '🚨'}
              </div>
              <div className="min-w-0">
                <p className="text-zinc-200 font-bold leading-snug text-[11px]">
                  Incoming sync pulse from <span className="text-red-400">@{pingAlert.fromName}</span> [Faction: <span className="uppercase text-red-400">{pingAlert.fromFaction}</span>]
                </p>
                <p className="text-[9px] text-zinc-500 mt-0.5 leading-normal">
                  {pingAlert.pingType === 'wave' && "transmitted a holographic wave gesture to synchronize active operational links."}
                  {pingAlert.pingType === 'tactile' && "transmitted an intensive tactile handshake sync signal inside your bracket."}
                  {pingAlert.pingType === 'alert' && "ISSUED AN URGENT MULTIPLAYER MAIN-BUS COMS CHANNELS SECURITY BREACH ALARM!"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVIGATION CHANNEL SUB-TABS SELECTOR */}
      <div className="flex items-center gap-3 border-b border-white/[0.04] pb-0 select-none font-mono">
        <button
          onClick={() => { playDigitalSound('click'); setCommsTab('forum'); }}
          className={`pb-3 text-[10px] font-black uppercase tracking-widest relative px-2.5 transition-all outline-none cursor-pointer ${
            commsTab === 'forum'
              ? 'text-white border-b-2 border-red-500'
              : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          📰 Intel Board Channels
        </button>
        <button
          onClick={() => { playDigitalSound('click'); setCommsTab('mainframe'); }}
          className={`pb-3 text-[10px] font-black uppercase tracking-widest relative px-2.5 transition-all outline-none cursor-pointer flex items-center gap-1.5 ${
            commsTab === 'mainframe'
              ? 'text-white border-b-2 border-red-500'
              : 'text-zinc-600 hover:text-zinc-400'
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
          📡 Comms Mainframe
          <span className="text-[7.5px] bg-red-400/10 border border-red-500/20 px-1 py-0.5 rounded text-red-400 uppercase tracking-wider font-black">
            {wsStatus === 'connected' ? `${onlineOperators.length} Active` : 'LIVE'}
          </span>
        </button>
      </div>

      {/* 3. MAIN SECTION CONTAINER */}
      {commsTab === 'forum' ? (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================= LEFT FORUM ELEMENT ======================= */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          
          <AnimatePresence mode="wait">
            
            {/* VIEW A: THE PRIMARY REDDIT-STYLISH THREAD FEED */}
            {activeView === 'feed' ? (
              <motion.div 
                key="feed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                
                {/* Search / Filter bar */}
                <div className="flex flex-col md:flex-row md:items-center gap-3.5 bg-zinc-950/40 p-4 rounded-3xl border border-white/5 gap-y-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search community posts, theorized code, keywords..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono placeholder:text-zinc-650"
                    />
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0" id="sort-controls">
                    <Sliders size={13} className="text-zinc-500 shrink-0 select-none hidden sm:block" />
                    {(['hot', 'new', 'top'] as const).map(sort => {
                      const isAct = sortBy === sort;
                      return (
                        <button
                          key={sort}
                          onClick={() => { playDigitalSound('click'); setSortBy(sort); }}
                          className={`text-[9px] font-mono tracking-widest uppercase py-1.5 px-3 rounded-lg border leading-none transition-all ${
                            isAct
                              ? 'bg-red-500/15 border-red-500/40 text-red-400 font-extrabold'
                              : 'bg-zinc-950 border-white/5 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          {sort}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Categories selector horizontal carousel */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 border-b border-white/[0.03] select-none" id="categories-carousel">
                  {categories.map(cat => {
                    const isAct = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => { playDigitalSound('click'); setSelectedCategory(cat); }}
                        className={`text-[9px] font-mono tracking-widest uppercase py-1.5 px-3.5 rounded-full border shrink-0 transition-all ${
                          isAct
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* THREAD MODULE LIST */}
                <div className="flex flex-col gap-3.5" id="thread-main-feed">
                  {filteredThreads.map((thread) => {
                    const totalVotes = thread.upvotes - thread.downvotes;
                    const dateFormatted = new Date(thread.created_at).toLocaleDateString() + ' ' + new Date(thread.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={thread.id}
                        onClick={() => handleSelectThread(thread)}
                        className="group bg-gradient-to-br from-zinc-950/70 to-zinc-900/10 hover:from-zinc-950 hover:to-zinc-900 border border-white/5 hover:border-red-500/20 rounded-3xl p-5 cursor-pointer transition-all duration-300 flex items-start gap-4 shadow-sm relative overflow-hidden"
                      >
                        {/* Glow accent */}
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-650/[0.01] group-hover:bg-red-650/[0.02] rounded-full blur-2xl transition-all" />

                        {/* Reddit-style Side Upvote panel container */}
                        <div 
                          className="flex flex-col items-center p-1 bg-zinc-950/60 rounded-xl border border-white/5 text-center gap-1 shrink-0 select-none z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleVoteThread(thread, 'up')}
                            className={`p-1 rounded hover:bg-zinc-900 transition-colors ${
                              thread.user_vote === 'up' ? 'text-red-500' : 'text-zinc-500'
                            }`}
                          >
                            <ArrowBigUp size={18} fill={thread.user_vote === 'up' ? 'currentColor' : 'none'} />
                          </button>
                          
                          <span className={`text-[10px] font-mono font-black ${
                            thread.user_vote === 'up' ? 'text-red-500' : thread.user_vote === 'down' ? 'text-blue-500' : 'text-zinc-400'
                          }`}>
                            {totalVotes}
                          </span>

                          <button
                            onClick={() => handleVoteThread(thread, 'down')}
                            className={`p-1 rounded hover:bg-zinc-900 transition-colors ${
                              thread.user_vote === 'down' ? 'text-blue-500' : 'text-zinc-500'
                            }`}
                          >
                            <ArrowBigDown size={18} fill={thread.user_vote === 'down' ? 'currentColor' : 'none'} />
                          </button>
                        </div>

                        {/* Thread Core metadata */}
                        <div className="flex-1 min-w-0 flex flex-col gap-2 relative">
                          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-white/[0.03] pb-1.5">
                            <div className="flex items-center gap-2">
                              <img 
                                src={thread.author_avatar} 
                                alt={thread.author_name} 
                                className="w-4.5 h-4.5 rounded-full object-cover border border-red-500/20"
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[10px] font-mono text-zinc-400 font-bold hover:text-red-400 transition-colors">
                                {thread.author_name}
                              </span>
                            </div>

                            <span className="text-[8px] font-mono font-black uppercase text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded leading-none">
                              {thread.category}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors font-sans leading-snug tracking-tight">
                            {thread.title}
                          </h3>

                          <p className="text-xs text-zinc-400 font-sans leading-relaxed line-clamp-3 break-words whitespace-pre-line px-0.5">
                            {thread.content}
                          </p>

                          <div className="flex items-center justify-between gap-2 border-t border-white/[0.03] pt-2 mt-1 select-none text-[9.5px] font-mono text-zinc-500">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex items-center gap-1 hover:text-white transition-colors">
                                <MessageCircle size={13} className="text-red-500/80" />
                                {thread.comments_count || 0} comments
                              </span>
                              
                              <button
                                onClick={(e) => handleShareThread(thread, e)}
                                className="inline-flex items-center gap-1 hover:text-white transition-colors"
                              >
                                <Share2 size={12} />
                                Share
                              </button>
                            </div>

                            <span className="text-[8.5px] tracking-wider text-zinc-600 block">
                              {dateFormatted}
                            </span>
                          </div>

                        </div>
                      </div>
                    );
                  })}

                  {filteredThreads.length === 0 && (
                    <div className="bg-zinc-950/20 border border-white/5 rounded-3xl p-10 text-center text-zinc-500 text-xs font-mono">
                      No matching discussion threads found in this sector. Feel free to initiate a session thread!
                    </div>
                  )}
                </div>

              </motion.div>
            ) : (
              
              // VIEW B: THREAD EXPANDED DETAIL VIEW (Reddit-style comments)
              selectedThread && (
                <motion.div 
                  key="detail"
                  initial={{ opacity: 0, x: -25 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 25 }}
                  className="flex flex-col gap-5"
                >
                  
                  {/* Exit Back Navigation */}
                  <button
                    onClick={handleBackToFeed}
                    className="flex items-center gap-1 px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white rounded-xl transition-all font-mono text-[10px] uppercase font-bold w-fit mb-1 shadow-sm"
                  >
                    <ChevronLeft size={14} className="text-red-500" />
                    Back to Terminal Feed
                  </button>

                  {/* ACTIVE DETAILED OP POST CELL */}
                  <div className="bg-gradient-to-br from-zinc-950 to-zinc-900/60 border border-red-500/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-650/[0.015] rounded-full blur-3xl" />

                    <div className="flex items-start gap-4">
                      {/* Voting side container */}
                      <div className="flex flex-col items-center p-1 bg-zinc-950/60 rounded-xl border border-white/5 text-center gap-1.5 shrink-0 select-none">
                        <button
                          onClick={() => handleVoteThread(selectedThread, 'up')}
                          className={`p-1 rounded hover:bg-zinc-900 transition-colors ${
                            selectedThread.user_vote === 'up' ? 'text-red-500' : 'text-zinc-500'
                          }`}
                        >
                          <ArrowBigUp size={20} fill={selectedThread.user_vote === 'up' ? 'currentColor' : 'none'} />
                        </button>
                        
                        <span className={`text-[11px] font-mono font-black ${
                          selectedThread.user_vote === 'up' ? 'text-red-500' : selectedThread.user_vote === 'down' ? 'text-blue-500' : 'text-zinc-300'
                        }`}>
                          {selectedThread.upvotes - selectedThread.downvotes}
                        </span>

                        <button
                          onClick={() => handleVoteThread(selectedThread, 'down')}
                          className={`p-1 rounded hover:bg-zinc-900 transition-colors ${
                            selectedThread.user_vote === 'down' ? 'text-blue-500' : 'text-zinc-500'
                          }`}
                        >
                          <ArrowBigDown size={20} fill={selectedThread.user_vote === 'down' ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {/* Detail core body */}
                      <div className="flex-1 min-w-0 flex flex-col gap-3 relative">
                        
                        {/* OP Header metadata */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                          <div className="flex items-center gap-2">
                            <img 
                              src={selectedThread.author_avatar} 
                              alt={selectedThread.author_name} 
                              className="w-5.5 h-5.5 rounded-full object-cover border border-red-500/30"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <span className="text-xs font-mono font-bold text-white block leading-none">
                                {selectedThread.author_name}
                              </span>
                              <span className="text-[7.5px] font-mono text-zinc-500 font-bold block mt-1 tracking-wider">
                                OP • {new Date(selectedThread.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          <span className="text-[8.5px] font-mono font-extrabold uppercase text-white bg-red-650/40 border border-red-500/30 px-2.5 py-1 rounded">
                            {selectedThread.category}
                          </span>
                        </div>

                        {/* Title & formatted multi-line content */}
                        <h2 className="text-base sm:text-lg font-black text-white hover:text-red-400 font-sans tracking-tight leading-snug break-words">
                          {selectedThread.title}
                        </h2>

                        <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed break-words whitespace-pre-line px-0.5">
                          {selectedThread.content}
                        </p>

                        <div className="flex items-center gap-4 border-t border-white/5 pt-3 mt-1.5 select-none text-[10px] font-mono text-zinc-500">
                          <span className="inline-flex items-center gap-1 hover:text-white transition-colors">
                            <MessageCircle size={14} className="text-red-500" />
                            {selectedThread.comments_count || 0} active replies
                          </span>

                          <button
                            onClick={(e) => handleShareThread(selectedThread, e)}
                            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
                          >
                            <Share2 size={13} />
                            Share Link
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>

                  {/* COMMENTS LOG INTERACTION BODY */}
                  <div className="bg-zinc-950/40 border border-white/5 rounded-3xl p-5 sm:p-6 flex flex-col gap-4">
                    
                    {/* Add broad reply composer */}
                    <div className="flex flex-col gap-2 font-mono">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500">
                        <span className="uppercase tracking-widest font-black flex items-center gap-1">
                          <MessageSquare size={12} className="text-red-500" /> Leave Comment Thread
                        </span>
                        <span>Logged in as: <strong className="text-red-400 font-black">{profile?.username || "Guest"}</strong></span>
                      </div>
                      
                      <div className="flex gap-2.5">
                        <textarea
                          rows={3}
                          placeholder="Type your discussion response, theory addition, or constructive feedback..."
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          className="flex-1 bg-zinc-950 border border-white/5 rounded-2xl p-3 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-red-500/30 font-sans"
                        />
                        <button
                          onClick={() => handleAddComment(null)}
                          className="px-4 bg-red-650 hover:bg-red-700 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] text-white text-[10px] font-mono font-black uppercase tracking-wider rounded-2xl flex flex-col items-center justify-center gap-1 transition-all shrink-0 min-w-[75px]"
                        >
                          <Send size={14} />
                          Send
                        </button>
                      </div>
                    </div>

                    {/* HIERARCHICAL REPLIES VIEW LIST */}
                    <div className="mt-2.5 border-t border-white/[0.03] pt-4 flex flex-col gap-4">
                      
                      {threadedCommentsTree.map(rootNode => (
                        <CommentNode key={rootNode.id} node={rootNode} depth={0} />
                      ))}

                      {comments.length === 0 && (
                        <p className="text-center text-zinc-600 text-xs py-10 font-mono">
                          No replies posted yet. Be the first to initiate conversational sequences!
                        </p>
                      )}
                    </div>

                  </div>

                </motion.div>
              )
            )}

          </AnimatePresence>

        </div>

        {/* ======================= RIGHT HAND PANEL sidebar ======================= */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          
          {/* PROFILE CARD NODE CORES */}
          <div className="bg-[#0b0b0d] border border-white/5 p-5 rounded-3xl flex flex-col gap-3 relative overflow-hidden select-none">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/[0.01] rounded-full blur-3xl pointer-events-none" />
            
            <h4 className="text-[9.5px] font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/[0.04] pb-2 flex items-center justify-between">
              <span>FORUM OPERATOR CARD</span>
              <span className="text-[7.5px] px-1 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-500 font-extrabold tracking-wider uppercase leading-none">
                ACTIVE CORES
              </span>
            </h4>

            <div className="flex items-center gap-3">
              <img 
                src={profile?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                alt={profile?.username || "Operator"}
                className="w-11 h-11 rounded-full object-cover border border-red-500/40"
                referrerPolicy="no-referrer"
              />
              <div className="min-w-0 font-mono text-xs">
                <span className="font-extrabold text-[#F2F2F5] hover:text-red-400 block truncate leading-tight">
                  {profile?.username || "Guest Operator"}
                </span>
                <span className="text-[8.5px] text-zinc-500 tracking-wider uppercase block mt-1">
                  ROLE: {profile?.role || "MEMBER"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 bg-black/40 border border-white/5 rounded-2xl p-2.5 text-center font-mono text-[9px] text-zinc-400">
              <div>
                <span className="text-zinc-600 block leading-none">LEVEL</span>
                <strong className="text-xs text-white block mt-1">{profile?.level || 1}</strong>
              </div>
              <div className="border-l border-white/5">
                <span className="text-zinc-600 block leading-none">TACTICAL XP</span>
                <strong className="text-xs text-red-400 block mt-1">{profile?.xp || 0}</strong>
              </div>
            </div>
          </div>

          {/* BLOCK: PUBLISH NEW DISCUSSION THREAD COMPOSER */}
          <div className="bg-[#0b0b0d] border border-white/5 p-5 rounded-3xl flex flex-col gap-3.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-650/[0.005] rounded-full blur-3xl pointer-events-none" />

            <h4 className="text-[9.5px] font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/[0.04] pb-2 flex items-center justify-between select-none">
              <span>PUBLISH NEW INTEL THREAD</span>
              <span className="text-[7.5px] bg-red-650/10 text-red-500 border border-red-500/20 px-1 py-0.5 rounded leading-none font-bold">
                ENCRYPTED
              </span>
            </h4>

            {isCreatingThread ? (
              <form onSubmit={handleCreateThreadSubmit} className="flex flex-col gap-3.5 font-mono text-xs">
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-[7.5px] text-zinc-500 uppercase tracking-widest">TITLE HEADLINE</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Theory on Episode 8 release schedule anomaly..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[7.5px] text-zinc-500 uppercase tracking-widest">DISCUSSION BOARD</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-red-500/40 transition-all font-mono"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c} className="bg-zinc-950 text-white font-mono">{c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[7.5px] text-zinc-500 uppercase tracking-widest">THREAD DETAILS / CONTENT BODY</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write details, logs, theories, or upload references..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-sans"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-1 select-none">
                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="py-2 bg-red-650 hover:bg-red-700 text-[#F2F2F5] text-[9px] tracking-wider uppercase font-black rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:opacity-50"
                  >
                    Publish Thread
                  </button>
                  <button
                    type="button"
                    onClick={() => { playDigitalSound('click'); setIsCreatingThread(false); }}
                    className="py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[9px] tracking-wider uppercase font-black rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                </div>

              </form>
            ) : (
              <div 
                onClick={() => { playDigitalSound('click'); setIsCreatingThread(true); }}
                className="border border-white/5 border-dashed rounded-2xl p-6 hover:border-red-500/35 hover:bg-white/[0.01] cursor-pointer transition-all flex flex-col items-center justify-center gap-2 select-none h-[120px]"
              >
                <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                  <Plus size={16} />
                </div>
                <span className="text-[9px] font-mono font-black uppercase text-zinc-400 tracking-wider">Initialize New Thread Sequence</span>
              </div>
            )}
          </div>

          {/* DISCUSSION POLICIES */}
          <div className="bg-zinc-950/20 border border-white/5 p-5 rounded-3xl flex flex-col gap-3 font-mono text-[9px] text-zinc-500 select-none">
            <h5 className="text-[9.5px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1">
              <Info size={11} className="text-red-500" /> SECURE COMMS RULES
            </h5>
            <ol className="list-decimal pl-3.5 space-y-1 text-zinc-500 leading-normal">
              <li>Keep anime discussion construct focused and respect general rules.</li>
              <li>No malicious or unauthorized console exploits are to be broadcast.</li>
              <li>Coordinate Faction War tactical sequences only inside private channels.</li>
              <li>Maintain healthy debates inside nested comments bracket flows.</li>
            </ol>
          </div>

        </div>

      </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start select-none font-mono">
          
          {/* LEFT COLUMN: LIVE CHAT TERMINAL CONSOLE */}
          <div className="lg:col-span-8 flex flex-col gap-4 bg-zinc-950/50 border border-white/5 rounded-3xl p-5 relative overflow-hidden backdrop-blur-md min-h-[620px] max-h-[750px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-650/[0.005] rounded-full blur-3xl pointer-events-none" />
            
            {/* Header Telemetry bar */}
            <div className="flex items-center justify-between border-b border-white/[0.04] pb-3.5 select-none">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-red-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black text-white tracking-widest">Neural Comm-Link Mainframe</span>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] bg-black/40 border border-white/5 px-2.5 py-1 rounded-full text-zinc-400">
                <span className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                <span>LINK: {wsStatus.toUpperCase()}</span>
              </div>
            </div>

            {/* Chat Frame Feed container */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin max-h-[480px] min-h-[380px] pl-1 py-1 select-text">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center gap-3.5 h-[340px]">
                  <div className="w-12 h-12 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500 animate-spin">
                    <Wifi size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">Dialing Comms Mainframe Link...</p>
                    <p className="text-[9.5px] text-zinc-500 mt-1 uppercase max-w-[280px]">No packets aggregated yet. Broadcast a neural link packet below to start live communication.</p>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  if (msg.isSystem) {
                    return (
                      <motion.div
                        key={msg.id || idx}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-950/80 border border-white/5 rounded-xl py-1.5 px-3 text-center text-zinc-500 text-[9.5px] tracking-wide inline-block mx-auto max-w-fit block border-dashed font-mono"
                      >
                        [MAIN-SYS-ALERT] {msg.content}
                      </motion.div>
                    );
                  }

                  const isOwn = msg.authorId === myConnectionId;
                  const factionName = msg.authorFaction || 'akatsuki';
                  
                  // Primary style dictionaries matching core factions
                  let factionTheme = "border-red-500/20 text-red-00 bg-red-950/20";
                  if (factionName === 'britannia') factionTheme = "border-purple-500/20 text-purple-400 bg-purple-950/20";
                  if (factionName === 'stark') factionTheme = "border-blue-500/20 text-blue-400 bg-blue-950/20";
                  if (factionName === 'lannister') factionTheme = "border-amber-500/20 text-amber-400 bg-amber-950/20";
                  if (factionName === 'emerald') factionTheme = "border-emerald-500/20 text-emerald-400 bg-emerald-950/20";

                  return (
                    <motion.div
                      key={msg.id || idx}
                      initial={{ opacity: 0, x: isOwn ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex gap-3 max-w-[85%] ${isOwn ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      <img
                        src={msg.authorAvatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                        alt={msg.authorName}
                        className="w-8 h-8 rounded-full border border-white/10 shrink-0 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-white hover:text-red-400 cursor-pointer transition-colors">
                            {msg.authorName}
                          </span>
                          <span className={`text-[7.5px] uppercase font-bold border px-1 py-0.5 rounded leading-none ${factionTheme}`}>
                            {factionName}
                          </span>
                          <span className="text-[8px] text-zinc-500">
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className={`p-3 rounded-2xl text-xs font-sans leading-relaxed break-all ${
                          isOwn 
                            ? 'bg-red-650/10 border border-red-500/25 text-red-100 rounded-tr-none' 
                            : 'bg-zinc-900/60 border border-white/5 text-zinc-300 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input packet compositor */}
            <form onSubmit={sendChatMessage} className="border-t border-white/[0.04] pt-3.5 flex gap-2 select-none">
              <input
                type="text"
                required
                disabled={wsStatus !== 'connected'}
                placeholder={wsStatus === 'connected' ? "Broadcast encrypted packet message directly to peers..." : "Uplink offline. Resynchronizing..."}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-zinc-950 border border-white/5 rounded-2xl py-3 px-4 text-xs text-white placeholder:text-zinc-650 focus:outline-none focus:ring-1 focus:ring-red-500/30 font-sans"
              />
              <button
                type="submit"
                disabled={wsStatus !== 'connected' || !chatInput.trim()}
                className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-2xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.25)] flex items-center justify-center shrink-0 disabled:opacity-40"
              >
                <Send size={15} />
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: PRESENT OPERATORS & LINK DRAWER */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            
            {/* ONLINE DIRECTORY LISTING */}
            <div className="bg-[#0b0b0d] border border-white/5 p-4 rounded-3xl flex flex-col gap-3 relative overflow-hidden select-none">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-650/[0.005] rounded-full blur-3xl pointer-events-none" />
              
              <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-white border-b border-white/[0.04] pb-2.5 flex items-center justify-between">
                <span>ONLINE LINK matrix</span>
                <span className="text-[7.5px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-400 font-extrabold tracking-wider uppercase leading-none">
                  {onlineOperators.length} Sync Nodes
                </span>
              </h4>

              <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin">
                {onlineOperators.length === 0 ? (
                  <p className="text-[9.5px] text-zinc-600 uppercase text-center p-4">Aggregating linkage cores...</p>
                ) : (
                  onlineOperators.map((op) => {
                    const isMe = op.id === myConnectionId;
                    const factionName = op.faction || 'akatsuki';
                    
                    let factionDotColor = "bg-red-500 shadow-red-500/50";
                    if (factionName === 'britannia') factionDotColor = "bg-purple-500 shadow-purple-500/50";
                    if (factionName === 'stark') factionDotColor = "bg-blue-500 shadow-blue-500/50";
                    if (factionName === 'lannister') factionDotColor = "bg-amber-500 shadow-amber-500/50";
                    if (factionName === 'emerald') factionDotColor = "bg-emerald-500 shadow-emerald-500/50";

                    return (
                      <div
                        key={op.id}
                        onClick={() => { playDigitalSound('click'); setSelectedOp(op); }}
                        className={`flex items-center justify-between p-2.5 bg-black/40 border rounded-2xl hover:border-red-500/25 cursor-pointer transition-all ${
                          selectedOp?.id === op.id ? 'border-red-500/40 bg-red-500/[0.02]' : 'border-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="relative">
                            <img
                              src={op.avatarUrl}
                              alt={op.username}
                              className="w-8 h-8 rounded-full border border-white/5 object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-black ${factionDotColor} shadow-sm animate-pulse`} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold text-zinc-200 block truncate leading-none">
                              {op.username} {isMe && <span className="text-[7.5px] text-zinc-600 block sm:inline font-mono uppercase">[Me]</span>}
                            </span>
                            <span className="text-[8px] text-zinc-500 uppercase tracking-wider block mt-1">
                              {factionName} // {op.role}
                            </span>
                          </div>
                        </div>
                        <span className="text-[8px] text-zinc-500 font-black">Link secured</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ACTION CENTER - SELECT OPERATOR CONTEXT */}
            <AnimatePresence mode="wait">
              {selectedOp ? (
                <motion.div
                  key={selectedOp.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-[#0b0b0d] border border-red-500/20 p-5 rounded-3xl flex flex-col gap-3.5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/[0.005] rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between border-b border-white/[0.04] pb-2 flex-wrap">
                    <span className="text-[9.5px] font-black uppercase text-red-400 tracking-wider">
                      OPERATOR TERMINAL TUNNEL
                    </span>
                    <button
                      type="button"
                      onClick={() => { playDigitalSound('click'); setSelectedOp(null); }}
                      className="text-[8px] text-zinc-500 hover:text-white font-black"
                    >
                      CLEAR TUNNEL
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={selectedOp.avatarUrl}
                      alt={selectedOp.username}
                      className="w-10 h-10 rounded-full border border-red-500/30 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <strong className="text-white text-xs block truncate leading-none font-sans">@{selectedOp.username}</strong>
                      <span className="text-[8.5px] text-zinc-500 uppercase block mt-1">
                        Faction Node ID: {selectedOp.id.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* DIRECT SIGNAL ACTIONS */}
                  <div className="flex flex-col gap-2 pt-1 select-none">
                    <label className="text-[7.5px] text-zinc-500 uppercase tracking-widest pl-0.5">SECURE TRANSACTION ACTION</label>
                    
                    <button
                      type="button"
                      onClick={() => transmitHolographicPing(selectedOp.id, selectedOp.username, 'wave')}
                      className="flex items-center gap-2 p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl text-[9px] font-black uppercase text-zinc-300 hover:text-white cursor-pointer transition-all hover:border-red-500/20 text-left"
                    >
                      <Hand size={12} className="text-red-500 shrink-0" />
                      Transmit Wave Handshake
                    </button>

                    <button
                      type="button"
                      onClick={() => transmitHolographicPing(selectedOp.id, selectedOp.username, 'tactile')}
                      className="flex items-center gap-2 p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-white/5 rounded-xl text-[9px] font-black uppercase text-zinc-300 hover:text-white cursor-pointer transition-all hover:border-red-500/20 text-left"
                    >
                      <Zap size={12} className="text-amber-500 shrink-0" />
                      Initiate Neural Tactile Nod
                    </button>

                    <button
                      type="button"
                      onClick={() => transmitHolographicPing(selectedOp.id, selectedOp.username, 'alert')}
                      className="flex items-center gap-2 p-2.5 bg-red-650/10 hover:bg-red-650/20 border border-red-500/20 rounded-xl text-[9px] font-black uppercase text-red-400 hover:text-red-300 cursor-pointer transition-all text-left"
                    >
                      <Shield size={12} className="text-red-500 animate-pulse shrink-0" />
                      Issue Threat Alert Overlay
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-zinc-950/20 border border-dashed border-white/5 p-6 rounded-3xl text-center flex flex-col items-center justify-center gap-2 select-none min-h-[140px]">
                  <div className="w-8 h-8 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-zinc-500">
                    <User size={13} />
                  </div>
                  <span className="text-[9px] font-mono font-black uppercase text-zinc-500 tracking-wider">Select present Operator to transmit signals</span>
                </div>
              )}
            </AnimatePresence>

          </div>

        </div>
      )}

    </div>
  );
}
