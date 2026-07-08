import { useState, useEffect } from 'react';
import { 
  Shield, UserCheck, Trash2, Plus, 
  FileText, Users, BarChart, Settings,
  AlertCircle, CheckCircle2, XCircle, Upload, Clock, CreditCard,
  Search
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { upgradeToPremium } from '../lib/profileSync';
import { useNews } from '../App';
import { BannerCropper } from '../components/BannerCropper';
import { RecruitmentReview, checkAccess } from '../components/RecruitmentReview';
import { generateSignature } from '../lib/signature';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const getFactionEmoji = (name?: string) => {
  if (!name) return '🔰';
  const n = name.trim().toLowerCase();
  if (n.includes('akatsuki')) return '☁️';
  if (n.includes('stark')) return '🛡️';
  if (n.includes('britannian') || n.includes('empire') || n.includes('holy')) return '👑';
  if (n.includes('lannister')) return '🦁';
  return '🔰';
};

export default function Admin() {
  const { setActiveArticle, setBreakingNews } = useNews();
  const [session, setSession] = useState<any>(null);
  const [dbUser, setDbUser] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [anime, setAnime] = useState<any[]>([]);
  const [releases, setReleases] = useState<any[]>([]);
  const [polls, setPolls] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantedRole, setGrantedRole] = useState<string | null>(null);
  const [checkingAccessState, setCheckingAccessState] = useState(true);

  // User Directory search and filter states
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'premium' | 'elite'>('all');
  const [userFactions, setUserFactions] = useState<Record<string, any>>({});

  const checkAndEnsureAdminProfile = async (user: any) => {
    if (!user || !user.email) return;
    
    const adminEmails = ["anshsureshsingh07@gmail.com", "animeintofficial@gmail.com"];
    if (adminEmails.includes(user.email.toLowerCase())) {
      console.log("[Admin Auto-Repair] Checking profile status for admin user:", user.email);
      const { data: profile, error: selectErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (selectErr) {
        console.error("[Admin Auto-Repair] Error fetching profile during auto-repair check:", selectErr.message);
      }

      if (!profile || profile.role !== 'admin') {
        console.log("[Admin Auto-Repair] Restructuring/establishing admin profile row for:", user.email);
        const { data, error: upsertErr } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            username: profile?.username || user.user_metadata?.username || user.email.split('@')[0],
            email: user.email,
            role: 'admin'
          }, { onConflict: 'id' })
          .select();

        if (upsertErr) {
          console.error("[Admin Auto-Repair] Failed to automatically establish admin profile:", upsertErr.message);
        } else {
          console.log("[Admin Auto-Repair] Admin profile successfully active:", data);
          fetchProfile(user.id);
          fetchUsers();
        }
      }
    }
  };

  useEffect(() => {
    const unsubscribeFirebase = onAuthStateChanged(auth, async (user) => {
      if (user) {
        fetchProfile(user.uid);
        if (user.email) {
          const role = await checkAccess(user.email);
          setGrantedRole(role);
        }
      }
      setCheckingAccessState(false);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        checkAndEnsureAdminProfile(session.user);
        if (session.user.email) {
          const role = await checkAccess(session.user.email);
          setGrantedRole(role);
        }
      }
    });

    fetchNews();
    fetchApplications();
    fetchUsers();
    fetchAnime();
    fetchReleases();
    fetchPolls();
    fetchReports();
    cleanupOldNews();

    return () => unsubscribeFirebase();
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => {
      const currentAuthedId = session?.user?.id || auth.currentUser?.uid;
      if (currentAuthedId) {
        fetchProfile(currentAuthedId);
      }
      fetchUsers();
    };

    window.addEventListener('profiles-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profiles-updated', handleProfileUpdate);
    };
  }, [session]);

  const fetchAnime = async () => {
    const { data } = await supabase.from('anime').select('*').order('created_at', { ascending: false });
    if (data) setAnime(data);
  };

  const fetchReleases = async () => {
    const { data } = await supabase.from('release_tracker').select('*').order('release_date', { ascending: true });
    if (data) setReleases(data);
  };

  const fetchPolls = async () => {
    const { data } = await supabase.from('polls').select('*, poll_options(*)').order('created_at', { ascending: false });
    if (data) setPolls(data);
  };

  const cleanupOldNews = async () => {
    const ventiEightHoursAgo = new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('news')
      .delete()
      .lt('created_at', ventiEightHoursAgo);
    
    if (!error) fetchNews();
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setDbUser(data);
  };

  const fetchNews = async () => {
    const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
    if (data) setNews(data);
  };

  const fetchApplications = async () => {
    const { data } = await supabase.from('applications').select('*').order('created_at', { ascending: false });
    if (data) setApplications(data);
  };

  const fetchUsers = async () => {
    const { data: userData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (userData) setUsers(userData);

    const { data: txData } = await supabase.from('payment_transactions').select('*').order('created_at', { ascending: false });
    if (txData) setAllTransactions(txData);

    try {
      const { data: factions } = await supabase.from('user_factions').select('*');
      if (factions) {
        const mapped: Record<string, any> = {};
        factions.forEach(f => {
          mapped[f.user_id] = f;
        });
        setUserFactions(mapped);
      }
    } catch (err) {
      console.warn('Failed to fetch factions for Admin space:', err);
    }
  };

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase.from('reports').select('*').order('created_at', { ascending: false });
      if (!error && data) setReports(data);
    } catch (err) {
      console.warn('Failed to fetch reports for Admin mainframe:', err);
    }
  };

  const deleteNews = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transmission?')) return;
    const { error } = await supabase.from('news').delete().eq('id', id);
    if (!error) fetchNews();
  };

  const deleteAnime = async (id: string) => {
    if (!confirm('Delete this anime from database?')) return;
    const { error } = await supabase.from('anime').delete().eq('id', id);
    if (!error) fetchAnime();
  };

  const deleteRelease = async (id: string) => {
    const { error } = await supabase.from('release_tracker').delete().eq('id', id);
    if (!error) fetchReleases();
  };

  const togglePoll = async (id: string, active: boolean) => {
    const { error } = await supabase.from('polls').update({ is_active: !active }).eq('id', id);
    if (!error) fetchPolls();
  };

  const updateAppStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('applications').update({ status }).eq('id', id);
    if (!error) fetchApplications();
  };

  const updateUserRole = async (id: string, role: string) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (!error) {
      fetchUsers();
      const currentAuthedId = session?.user?.id || auth.currentUser?.uid;
      if (id === currentAuthedId) {
        if (dbUser) {
          setDbUser({ ...dbUser, role });
        }
      }
      window.dispatchEvent(new Event('profiles-updated'));
    } else {
      console.error('Error updating user role:', error);
    }
  };

  // Forms
  const [animeForm, setAnimeForm] = useState({ title: '', description: '', image: '', rating: 0, status: 'Completed', episodes: 1 });
  const [releaseForm, setReleaseForm] = useState({ title: '', release_date: '', episode: 1, platform: 'Nexus' });
  const [pollForm, setPollForm] = useState({ question: '', options: '' });

  // Informational Seeder states
  const [scraperProviderId, setScraperProviderId] = useState('');
  const [scraperAnimeTitle, setScraperAnimeTitle] = useState('');
  const [scraperLoading, setScraperLoading] = useState(false);
  const [scraperLogs, setScraperLogs] = useState<string[]>([]);
  const [scraperSuccess, setScraperSuccess] = useState(false);
  const [scraperError, setScraperError] = useState<string | null>(null);

  const runAnimeScraper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scraperProviderId.trim()) return;

    setScraperLoading(true);
    setScraperError(null);
    setScraperSuccess(false);
    setScraperLogs([]);

    try {
      let token = null;
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.access_token) {
        token = currentSession.access_token;
      } else if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (tokenErr) {
          console.warn("Failed retrieving Firebase ID Token:", tokenErr);
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Zero-Trust-Token': sessionStorage.getItem("x-zero-trust-token") || ""
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/scrape-anime', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          providerId: scraperProviderId.trim(),
          animeTitle: scraperAnimeTitle.trim() || undefined
        })
      });

      if (!res.ok) {
        let errText = 'Informational seeder failed';
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errData = await res.json();
            errText = errData.error || errText;
          } else {
            const rawText = await res.text();
            if (rawText.length < 150) {
              errText = rawText || `Server returned status: ${res.status}`;
            } else {
              errText = `Node reported an error (Status ${res.status})`;
            }
          }
        } catch {
          errText = `Transmission error with status code ${res.status}`;
        }
        throw new Error(errText);
      }

      const data = await res.json();
      setScraperSuccess(true);
      setScraperLogs(data.log || ['Import executed.']);
      fetchAnime();
    } catch (err: any) {
      console.error(err);
      setScraperError(err.message || 'Transmission connection lost');
    } finally {
      setScraperLoading(false);
    }
  };

  const addAnime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!animeForm.title.trim()) return;

    // Generate a valid slug from the Title parameter
    const slug = animeForm.title.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || "anime-series";

    try {
      let token = null;
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.access_token) {
        token = currentSession.access_token;
      } else if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (tokenErr) {
          console.warn("Failed retrieving Firebase ID Token:", tokenErr);
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Zero-Trust-Token': sessionStorage.getItem("x-zero-trust-token") || ""
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Synchronize creation in "anime_series" using full-stack scrape-anime controller 
      // which also generates 12 informational episode summaries correctly.
      const res = await fetch('/api/scrape-anime', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          providerId: slug,
          animeTitle: animeForm.title.trim(),
          image_url: animeForm.image.trim()
        })
      });

      let seriesId: string | null = null;
      if (res.ok) {
        const resData = await res.json();
        seriesId = resData.seriesId || null;
      } else {
        console.warn("Full-stack anime_series creation returned non-200, attempting direct table fallback");
        // Fallback: direct insert to anime_series
        const { data: fallbackSeries, error: fallbackErr } = await supabase
          .from('anime_series')
          .insert([{
            title: animeForm.title.trim(),
            thumbnail_url: animeForm.image.trim()
          }])
          .select('id')
          .maybeSingle();

        if (fallbackErr) {
          console.error("Direct fallback insert inside anime_series failed:", fallbackErr);
        } else if (fallbackSeries) {
          seriesId = fallbackSeries.id;
        }
      }

      // Save into 'anime' table with the mapped series_id
      const payload: any = {
        title: animeForm.title,
        description: animeForm.description || "Custom manual entry decrypted inside localized archive records.",
        image: animeForm.image,
        rating: animeForm.rating,
        status: animeForm.status,
        episodes: animeForm.episodes
      };

      if (seriesId) {
        payload.series_id = seriesId;
      }

      const { error: insertErr } = await supabase.from('anime').insert([payload]);

      if (!insertErr) {
        setAnimeForm({ title: '', description: '', image: '', rating: 0, status: 'Completed', episodes: 1 });
        fetchAnime();
      } else {
        console.error("Error inserting custom anime record:", insertErr);
      }
    } catch (err) {
      console.error("Manual Entry Ingestion Exception:", err);
    }
  };

  const addRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('release_tracker').insert([releaseForm]);
    if (!error) {
      setReleaseForm({ title: '', release_date: '', episode: 1, platform: 'Nexus' });
      fetchReleases();
    }
  };

  const addPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const options = pollForm.options.split(',').map(o => o.trim()).filter(o => o);
    
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .insert([{ question: pollForm.question }])
      .select()
      .single();

    if (poll && !pollError) {
      const optionInserts = options.map(text => ({ poll_id: poll.id, text }));
      const { error: optError } = await supabase.from('poll_options').insert(optionInserts);
      
      if (!optError) {
        setPollForm({ question: '', options: '' });
        fetchPolls();
      }
    }
  };

  // Mock user for local development if session missing
  const user = session?.user ? {
    id: session.user.id,
    email: session.user.email,
    username: dbUser?.username || session.user.email?.split('@')[0],
  } : {
    id: 'mock-user-id',
    username: 'Admin User',
    email: 'admin@nexus.com'
  };

  const currentDbUser = dbUser || { role: 'admin' };

  const isAdmin = (currentDbUser && (currentDbUser.role === 'admin' || currentDbUser.role === 'news_writer' || currentDbUser.role === 'moderator')) || 
                  (session?.user?.email === 'anshsureshsingh07@gmail.com' || session?.user?.email === 'animeintofficial@gmail.com');

  const isOwner = (session?.user?.email === 'anshsureshsingh07@gmail.com' || session?.user?.email === 'animeintofficial@gmail.com' || (currentDbUser && currentDbUser.role === 'admin'));

  const canPostNews = isOwner || currentDbUser?.role === 'news_writer' || grantedRole?.toLowerCase() === 'news writer';

  const hasAdminPanelAccess = isAdmin || !!grantedRole;

  const allowedTabs = [
    { id: 'news', name: 'News Manager', icon: FileText, show: canPostNews },
    { id: 'anime', name: 'Anime Database', icon: BarChart, show: isOwner },
    { id: 'releases', name: 'Release Tracker', icon: Clock, show: isOwner },
    { id: 'polls', name: 'Community Polls', icon: BarChart, show: isOwner },
    { id: 'apps', name: 'Recruitment Review', icon: UserCheck, show: isOwner },
    { id: 'users', name: 'User Directory', icon: Users, show: isOwner },
    { id: 'payments', name: 'Premium Ledger', icon: CreditCard, show: isOwner },
    { id: 'settings', name: 'System Config', icon: Settings, show: isOwner },
  ].filter(t => t.show);

  const [activeTab, setActiveTab] = useState('news');

  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.some(t => t.id === activeTab)) {
      setActiveTab(allowedTabs[0].id);
    }
  }, [canPostNews, isOwner, activeTab]);

  // News Form
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [newsForm, setNewsForm] = useState({
    title: '',
    description: '',
    category: 'Trending',
    image: '',
    youtubeVideoUrl: '',
    additionalImages: '',
    is_pinned: false,
  });

  // App Payment Config States
  const [paymentUpiId, setPaymentUpiId] = useState('6351197285@fam');
  const [paymentQrUrl, setPaymentQrUrl] = useState('');
  const [paymentQrFile, setPaymentQrFile] = useState<File | null>(null);
  const [paymentConfigLoading, setPaymentConfigLoading] = useState(false);
  const [paymentConfigSuccess, setPaymentConfigSuccess] = useState(false);
  const [paymentConfigError, setPaymentConfigError] = useState<string | null>(null);

  // Premium Verification states & handlers
  const [pendingTx, setPendingTx] = useState<any[]>([]);
  const [pendingTxLoading, setPendingTxLoading] = useState(false);
  const [pendingTxError, setPendingTxError] = useState<string | null>(null);
  const [pendingTxSuccessMsg, setPendingTxSuccessMsg] = useState<string | null>(null);
  const [selectedScreenshotUrl, setSelectedScreenshotUrl] = useState<string | null>(null);

  const fetchPendingTx = async () => {
    setPendingTxLoading(true);
    setPendingTxError(null);
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPendingTx(data || []);
    } catch (err: any) {
      console.error('Failed to fetch pending transactions:', err);
      setPendingTxError(err.message || 'Error fetching pending transactions.');
    } finally {
      setPendingTxLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPendingTx();
    }
  }, [activeTab]);

  const handleApproveTx = async (id: string, userId: string, tier: string) => {
    try {
      setPendingTxSuccessMsg(null);
      setPendingTxError(null);
      const { error } = await supabase
        .from('payment_transactions')
        .update({ status: 'verified' })
        .eq('id', id);
      if (error) throw error;

      // Safe local profiles sync update
      try {
        const validatedTier = (tier === 'plus' || tier === 'god' || tier === 'monarch') ? tier : 'monarch';
        await upgradeToPremium(userId, validatedTier);
      } catch (profileErr) {
        console.warn('Profiles update sync notice:', profileErr);
      }

      setPendingTxSuccessMsg('Transaction successfully verified!');
      await fetchPendingTx();
    } catch (err: any) {
      console.error('Approval failed:', err);
      setPendingTxError(err.message || 'Approval transmission failed.');
    }
  };

  const handleRejectTx = async (id: string) => {
    try {
      setPendingTxSuccessMsg(null);
      setPendingTxError(null);
      const { error } = await supabase
        .from('payment_transactions')
        .update({ status: 'rejected' })
        .eq('id', id);
      if (error) throw error;

      setPendingTxSuccessMsg('Transaction successfully rejected.');
      await fetchPendingTx();
    } catch (err: any) {
      console.error('Rejection failed:', err);
      setPendingTxError(err.message || 'Rejection transmission failed.');
    }
  };

  useEffect(() => {
    if (activeTab === 'settings') {
      const fetchPaymentConfigSettings = async () => {
        try {
          const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', 'global_config')
            .maybeSingle();
          if (data) {
            setPaymentUpiId(data.upi_id || '6351197285@fam');
            setPaymentQrUrl(data.qr_url || '');
          }
        } catch (err: any) {
          console.error('Failed to load payment config table settings:', err);
        }
      };
      fetchPaymentConfigSettings();
    }
  }, [activeTab]);

  const handlePaymentConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentUpiId) {
      setPaymentConfigError('Please provide a valid UPI ID');
      return;
    }

    setPaymentConfigLoading(true);
    setPaymentConfigError(null);
    setPaymentConfigSuccess(false);

    try {
      let finalQrUrl = paymentQrUrl;

      if (paymentQrFile) {
        let token = null;
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession?.access_token) {
          token = currentSession.access_token;
        } else if (auth.currentUser) {
          try {
            token = await auth.currentUser.getIdToken();
          } catch (tokenErr) {
            console.warn("Failed retrieving Firebase ID Token in payment configuration upload:", tokenErr);
          }
        }

        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const fileExt = paymentQrFile.name.split('.').pop() || 'png';
        const fileName = `qr_payment_${Date.now()}.${fileExt}`;
        const base64Data = await fileToBase64(paymentQrFile);

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            bucket: 'news',
            fileName,
            fileData: base64Data,
            contentType: paymentQrFile.type
          })
        });

        if (!response.ok) {
          const resError = await response.json();
          throw new Error(resError.error || 'Server upload failed');
        }

        const resData = await response.json();
        if (resData.publicUrl) {
          finalQrUrl = resData.publicUrl;
        } else {
          throw new Error('Upload response missing publicUrl');
        }
      }

      // Upsert global_config inside app_settings table
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: 'global_config',
          upi_id: paymentUpiId,
          qr_url: finalQrUrl
        }, { onConflict: 'id' });

      if (error) {
        throw error;
      }

      setPaymentQrUrl(finalQrUrl);
      setPaymentQrFile(null);
      setPaymentConfigSuccess(true);
    } catch (err: any) {
      console.error('Failed to submit App Payment Configuration:', err);
      setPaymentConfigError(err.message || 'Error occurred while saving app settings');
    } finally {
      setPaymentConfigLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropperSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedUpload = async (croppedBlob: Blob) => {
    setUploading(true);
    setFormError(null);
    try {
      const fileName = `cropped_${Date.now()}.jpg`;

      // 1. Retrieve Auth Token for authorized proxy API requests
      let token = null;
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.access_token) {
        token = currentSession.access_token;
      } else if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (tokenErr) {
          console.warn("Failed retrieving Firebase ID Token:", tokenErr);
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Prepare cropped file for proxy conversion
      const croppedFile = new File([croppedBlob], fileName, { type: 'image/jpeg' });
      const base64Data = await fileToBase64(croppedFile);

      let publicUrl = '';

      // 2. Perform server-side proxy upload first (immune to browser-side CORS / sandbox blocks)
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            bucket: 'news',
            fileName,
            fileData: base64Data,
            contentType: 'image/jpeg'
          })
        });

        if (response.ok) {
          const resJson = await response.json();
          publicUrl = resJson.publicUrl;
        } else {
          console.warn('Backend proxy upload returned non-OK status, falling back to direct storage path');
        }
      } catch (proxyErr) {
        console.warn('Backend proxy upload failed, attempting direct Supabase Storage upload:', proxyErr);
      }

      // 3. Fallback direct client upload if backend proxy upload failed
      if (!publicUrl) {
        let bucketName = 'news';
        const filePath = `headlines/${fileName}`;
        let { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, croppedBlob, {
            contentType: 'image/jpeg'
          });

        if (uploadError) {
          console.warn(`Direct upload to '${bucketName}' bucket failed, trying 'breaking-images' fallback...`, uploadError);
          bucketName = 'breaking-images';
          const fallbackUpload = await supabase.storage
            .from(bucketName)
            .upload(filePath, croppedBlob, {
              contentType: 'image/jpeg'
            });
          uploadError = fallbackUpload.error;
        }

        if (uploadError) {
          throw uploadError;
        }

        // Get the official Public URL from client storage
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        publicUrl = publicUrlData.publicUrl;
      }

      if (!publicUrl) {
        throw new Error("Unable to resolve permanent public URL.");
      }

      // Save this PERMANENT URL to the form state
      setImageUrl(publicUrl);
      setNewsForm(prev => ({ ...prev, image: publicUrl }));
      setImageFile(croppedFile);
    } catch (err: any) {
      console.warn("Direct Supabase Storage upload failed, applying secure local fallback preview:", err);
      const fallbackUrl = URL.createObjectURL(croppedBlob);
      setImageUrl(fallbackUrl);
      setNewsForm(prev => ({ ...prev, image: fallbackUrl }));
      const croppedFile = new File([croppedBlob], `${Date.now()}.jpg`, { type: 'image/jpeg' });
      setImageFile(croppedFile);
    } finally {
      setUploading(false);
      setCropperSrc(null);
    }
  };

  const handleDirectUpload = async (file: File) => {
    handleFileSelect(file);
  };

  const postNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      setFormError('Authentication required. Session not found.');
      return;
    }
    
    setLoading(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      let token = null;
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession?.access_token) {
        token = currentSession.access_token;
      } else if (auth.currentUser) {
        try {
          token = await auth.currentUser.getIdToken();
        } catch (tokenErr) {
          console.warn("Failed retrieving Firebase ID Token in news creation:", tokenErr);
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Zero-Trust-Token': sessionStorage.getItem("x-zero-trust-token") || ""
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let finalImageUrl = imageUrl || newsForm.image;
      const isTemporaryBlob = finalImageUrl && String(finalImageUrl).startsWith('blob:');

      if ((!finalImageUrl || isTemporaryBlob) && imageFile) {
        setUploading(true);
        try {
          const fileExt = imageFile.name.split('.').pop() || 'png';
          const fileName = `news_${Date.now()}.${fileExt}`;
          const base64Data = await fileToBase64(imageFile);

          const response = await fetch('/api/upload', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              bucket: 'news',
              fileName,
              fileData: base64Data,
              contentType: imageFile.type
            })
          });

          if (response.ok) {
            const { publicUrl } = await response.json();
            finalImageUrl = publicUrl;
          }
        } catch (err) {
          console.warn('Server fallback upload failed:', err);
        } finally {
          setUploading(false);
        }
      }

      const parsedAdditionalImages = newsForm.additionalImages
        .split('\n')
        .map(u => u.trim())
        .filter(u => u.length > 0);

      const computedReleaseDate = isScheduled && scheduledFor 
        ? new Date(scheduledFor).toISOString() 
        : new Date().toISOString();

      const meta = {
        additionalImages: parsedAdditionalImages,
        youtubeVideoUrl: newsForm.youtubeVideoUrl.trim(),
        isScheduled,
        scheduledFor
      };
      
      const metaString = `\n\n<!--NEXUS_META:${JSON.stringify(meta)}-->`;

      // Generate secure digital seal signature for Ansh Singh Architect
      const signedDesc = generateSignature(newsForm.description);

      const insertPayload: any = {
        title: newsForm.title,
        description: signedDesc + metaString,
        category: newsForm.category,
        image: finalImageUrl,
        image_url: finalImageUrl, // explicitly support both image and image_url keys as requested!
        is_pinned: newsForm.is_pinned || false,
        author_id: session.user.id,
        author_name: dbUser?.username || session.user.email?.split('@')[0] || 'Vanguard Agent',
        created_at: computedReleaseDate
      };

      const payloadData = {
        ...insertPayload,
        additional_images: parsedAdditionalImages,
        youtube_video_url: newsForm.youtubeVideoUrl.trim()
      };

      let dbError = null;
      try {
        const response = await fetch('/api/news/create', {
          method: 'POST',
          headers,
          body: JSON.stringify({ payload: payloadData })
        });
        
        if (!response.ok) {
          const resError = await response.json();
          throw new Error(resError.error || 'Server news posting failed');
        }
      } catch (err: any) {
        console.warn('Backend news create route failed or pending, trying fallback guest/direct client-side insert...', err);
        // Fallback to client-side insert:
        try {
          const { error } = await supabase.from('news').insert([payloadData]);
          dbError = error;
        } catch (innerErr: any) {
          dbError = innerErr;
        }

        if (dbError && (dbError.code === '42703' || dbError.message?.includes('column') || dbError.message?.includes('schema cache'))) {
          console.warn('Altered Supabase column missing on news table, retrying insert with serialized tag fallback (stripping image_url and external links)...');
          const cleanInsertPayload = {
            title: insertPayload.title,
            description: insertPayload.description,
            category: insertPayload.category,
            image: insertPayload.image,
            is_pinned: insertPayload.is_pinned || false,
            author_id: insertPayload.author_id,
            author_name: insertPayload.author_name,
            created_at: insertPayload.created_at
          };
          const { error: fallbackError } = await supabase.from('news').insert([cleanInsertPayload]);
          dbError = fallbackError;
        }

        if (dbError) throw dbError;
      }

      // Immediate Global State Push to reflect instantly on the UI/Marquee
      const instantPayload = {
        title: newsForm.title,
        description: signedDesc,
        content: signedDesc,
        category: newsForm.category,
        image: finalImageUrl,
        image_url: finalImageUrl,
        author_name: dbUser?.username || session.user.email?.split('@')[0] || 'Vanguard Agent',
        created_at: payloadData.created_at
      };

      if (newsForm.category?.toUpperCase() === 'BREAKING') {
        setBreakingNews({ id: 1, text: newsForm.title, title: newsForm.title });
      }
      // Only push to globally active view if it is not a scheduled future release
      if (!isScheduled) {
        setActiveArticle(instantPayload);
      }

      setNewsForm({ 
        title: '', 
        description: '', 
        category: 'Trending', 
        image: '', 
        youtubeVideoUrl: '', 
        additionalImages: '',
        is_pinned: false
      });
      setImageFile(null);
      setImageUrl('');
      setIsScheduled(false);
      setScheduledFor('');
      setFormSuccess(true);
      fetchNews();
      setTimeout(() => setFormSuccess(false), 3000);
    } catch (err: any) {
      console.error('Post news error:', err);
      setFormError(err.message || 'Failed to transmit news to network.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppStatus = async (appId: string, status: string, userId: string, role: string) => {
    try {
      await updateAppStatus(appId, status);
      if (status === 'approved') {
        const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
        if (error) console.error('Role promotion failed:', error);
        fetchUsers();
      }
    } catch (err) {
      console.error('Update status error:', err);
    }
  };

  if (loading && session && !dbUser) return <div className="p-20 text-center font-mono">Synchronizing with mainframe...</div>;
  
  const zeroTrustToken = sessionStorage.getItem("x-zero-trust-token");
  const isMfaVerified = !!zeroTrustToken;

  // Implement Dev Environment or Architect User absolute bypass
  const isBypassAllowed = process.env.NODE_ENV === 'development' || 
                           (session?.user?.email?.toUpperCase() === 'ANSHSURESHSINGH07@GMAIL.COM') ||
                           (session?.user?.email?.toUpperCase().startsWith('ANSHSURESHSINGH07'));

  if (!isBypassAllowed && (!isMfaVerified || !hasAdminPanelAccess)) return (
    <div className="max-w-xl mx-auto px-6 py-40 text-center font-mono animate-fade-in">
      <h1 className="text-4xl font-extrabold text-zinc-800 tracking-tight mb-2">404</h1>
      <p className="text-sm text-zinc-500 uppercase tracking-widest leading-relaxed mb-6">
        [HTTP_STATUS: 404_NOT_FOUND] // Security Shield active. Connection closed.
      </p>
      <p className="text-xs text-zinc-600 uppercase max-w-sm mx-auto leading-relaxed mb-8">
        This route does not exist on this directory server. Please access via secure gate.
      </p>
      <a 
        href="/alpha-sector-9-override"
        className="text-[10px] bg-red-600 hover:bg-red-750 px-4 py-2 text-white font-bold tracking-widest uppercase rounded-lg transition-all"
      >
        Authenticate Portal
      </a>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row gap-12">
      <aside className="w-full md:w-64 space-y-2">
        <h2 className="text-xs font-black tracking-widest uppercase text-red-600 mb-10 pl-2">Admin <span className="text-white">Mainframe</span></h2>
        {[
          { id: 'news', name: 'News Manager', icon: FileText, show: canPostNews },
          { id: 'anime', name: 'Anime Database', icon: BarChart, show: isOwner },
          { id: 'releases', name: 'Release Tracker', icon: Clock, show: isOwner },
          { id: 'polls', name: 'Community Polls', icon: BarChart, show: isOwner },
          { id: 'reports', name: 'Reports Control', icon: AlertCircle, show: isOwner },
          { id: 'apps', name: 'Recruitment Review', icon: UserCheck, show: isOwner },
          { id: 'users', name: 'User Directory', icon: Users, show: isOwner },
          { id: 'payments', name: 'Premium Ledger', icon: CreditCard, show: isOwner },
          { id: 'settings', name: 'System Config', icon: Settings, show: isOwner },
        ].filter(item => item.show).map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              activeTab === item.id ? 'bg-red-600 text-white' : 'text-gray-500 hover:bg-white/5 hover:text-white'
            }`}
          >
            <item.icon size={16} /> {item.name}
          </button>
        ))}
      </aside>

      <main className="flex-1 space-y-12">
         {activeTab === 'news' && (
           <div className="space-y-12">
              <section className="cyber-card p-8 bg-black/40 border-dashed border-white/20">
                 <h3 className="text-xl font-black italic tracking-tighter uppercase mb-8 flex items-center gap-2">
                    <Plus className="text-red-600" /> Transmit <span className="text-red-500">News</span>
                 </h3>
                 <form onSubmit={postNews} className="space-y-6">
                    {formError && (
                      <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-center gap-3 text-red-500 text-xs font-mono mb-6">
                        <XCircle size={16} />
                        DETECTION ERROR: {formError}
                      </div>
                    )}
                    {formSuccess && (
                      <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex items-center gap-3 text-green-500 text-xs font-mono mb-6">
                        <CheckCircle2 size={16} />
                        TRANSMISSION SUCCESSFUL: News data synchronized.
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500">Article Title</label>
                          <input 
                             required
                             value={newsForm.title}
                             onChange={e => setNewsForm({...newsForm, title: e.target.value})}
                             className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500">Category</label>
                          <select 
                             value={newsForm.category}
                             onChange={e => setNewsForm({...newsForm, category: e.target.value})}
                             className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none"
                          >
                             <option>Trending</option>
                             <option>Anime</option>
                             <option>Manga</option>
                             <option>Recruitment</option>
                             <option>BREAKING</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500">📸 UPLOAD TELEMETRY VISUAL (HERO BANNER)</label>
                          <div className="space-y-4">
                            {cropperSrc ? (
                              <div className="w-full">
                                <BannerCropper
                                  imageSrc={cropperSrc}
                                  onCropComplete={handleCroppedUpload}
                                  onCancel={() => setCropperSrc(null)}
                                />
                              </div>
                            ) : (
                              <div 
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  setIsDragOver(true);
                                }}
                                onDragLeave={() => setIsDragOver(false)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  setIsDragOver(false);
                                  const file = e.dataTransfer.files?.[0];
                                  if (file) {
                                    handleFileSelect(file);
                                  }
                                }}
                                className={`w-full bg-[#0a0a0a]/85 backdrop-blur-md rounded-lg p-6 flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-all duration-300 relative ${isDragOver ? 'border-red-500 bg-red-950/15 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-white/10 hover:border-red-650/40'}`}
                              >
                                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-4">
                                  <Upload className={uploading ? "animate-bounce text-red-500" : "text-gray-400"} size={24} />
                                  <span className="text-[10px] font-mono uppercase text-gray-500 mt-2 text-center font-bold">
                                    {imageFile ? imageFile.name : uploading ? "Synchronizing Telemetry Core..." : "DRAG & DROP TELEMETRY FILE OR CLICK TO BROWSE"}
                                  </span>
                                  <input 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileSelect(file);
                                      }
                                    }}
                                  />
                                </label>
                              </div>
                            )}
                            {/* 200px Micro-Thumbnail Feedback Frame */}
                            {(imageUrl || imageFile) && (
                              <div className="w-[200px] h-[200px] bg-black border-2 border-red-500/40 rounded-lg overflow-hidden relative group shadow-[0_0_15px_rgba(239,68,68,0.3)] mt-2">
                                <img 
                                  src={imageUrl || (imageFile ? URL.createObjectURL(imageFile) : '')} 
                                  className="w-full h-full object-cover" 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-black/85 py-1.5 px-3 border-t border-red-500/25 text-center font-mono text-[8px] uppercase tracking-wider text-red-500 font-bold">
                                  CONFIRMED TARGET
                                </div>
                                <button 
                                  type="button"
                                  onClick={() => {
                                    setImageFile(null);
                                    setImageUrl('');
                                    setNewsForm(prev => ({ ...prev, image: '' }));
                                  }}
                                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 size={20} className="text-red-500" />
                                </button>
                              </div>
                            )}
                          </div>
                       </div>
                       
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500">OR Remote Asset URL</label>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-gray-500">YouTube Video Link</label>
                           <input 
                               value={newsForm.youtubeVideoUrl}
                               onChange={e => setNewsForm({...newsForm, youtubeVideoUrl: e.target.value})}
                               className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none"
                               placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                           />
                        </div>

                        <div className="space-y-2 col-span-1 md:col-span-2">
                           <label className="text-[10px] font-black uppercase text-gray-500">Additional Gallery Photos (One URL per line)</label>
                           <textarea 
                               value={newsForm.additionalImages}
                               onChange={e => setNewsForm({...newsForm, additionalImages: e.target.value})}
                               rows={3}
                               className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none resize-none"
                               placeholder="https://images.unsplash.com/photo-1&#10;https://images.unsplash.com/photo-2"
                           />
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-gray-500">Remote Asset URL</label>
                          <input 
                              value={newsForm.image}
                              onChange={e => setNewsForm({...newsForm, image: e.target.value})}
                              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none"
                              placeholder="https://..."
                          />
                       </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-6 pt-2 pb-4 col-span-1 md:col-span-2">
                           <div className="flex items-center gap-2">
                              <input 
                                 type="checkbox"
                                 id="is_pinned"
                                 checked={newsForm.is_pinned}
                                 onChange={e => setNewsForm({...newsForm, is_pinned: e.target.checked})}
                                 className="w-4 h-4 accent-red-600 rounded bg-[#0a0a0a] border-white/10 cursor-pointer"
                              />
                              <label htmlFor="is_pinned" className="text-[10px] font-black uppercase text-gray-400 cursor-pointer select-none tracking-widest hover:text-white transition-colors">
                                [PIN TRANSMISSION] Elevate this article on feed top
                              </label>
                           </div>

                           <div className="flex items-center gap-2">
                              <input 
                                 type="checkbox"
                                 id="is_scheduled"
                                 checked={isScheduled}
                                 onChange={e => {
                                   setIsScheduled(e.target.checked);
                                   if (e.target.checked && !scheduledFor) {
                                     const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
                                     const offset = oneHourFromNow.getTimezoneOffset() * 60000;
                                     const localISOTime = new Date(oneHourFromNow.getTime() - offset).toISOString().slice(0, 16);
                                     setScheduledFor(localISOTime);
                                   }
                                 }}
                                 className="w-4 h-4 accent-red-600 rounded bg-[#0a0a0a] border-white/10 cursor-pointer"
                              />
                              <label htmlFor="is_scheduled" className="text-[10px] font-black uppercase text-gray-400 cursor-pointer select-none tracking-widest hover:text-white transition-colors">
                                [SCHEDULE TRANSMISSION] Delay launch to neural stream
                              </label>
                           </div>
                        </div>

                        {isScheduled && (
                          <div className="mb-4 space-y-2 bg-red-950/15 border border-red-500/30 p-4 rounded-xl max-w-md animate-fade-in">
                            <label className="text-[9px] font-black uppercase text-red-400 block tracking-widest">
                              ▲ SPECIFY CHRONOLOGICAL SYNC TIME
                            </label>
                            <div className="flex items-center gap-3">
                              <input 
                                 type="datetime-local" 
                                 required={isScheduled}
                                 value={scheduledFor}
                                 onChange={e => setScheduledFor(e.target.value)}
                                 className="bg-black border border-white/15 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-red-600 outline-none w-full"
                              />
                              <span className="text-[8px] font-mono whitespace-nowrap text-gray-500 uppercase">
                                STATUS: DELAYED RELEASE
                              </span>
                            </div>
                            <p className="text-[8px] font-mono text-gray-500 lowercase leading-relaxed mt-1">
                              This item will remain locked from general public view and will automatically become available to all nodes on the news feeds precisely at the designated time.
                            </p>
                          </div>
                        )}
                       <label className="text-[10px] font-black uppercase text-gray-500">Content Matrix</label>
                       <textarea 
                          required
                          value={newsForm.description}
                          onChange={e => setNewsForm({...newsForm, description: e.target.value})}
                          rows={5}
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none resize-none"
                       />
                    </div>
                    <button className="bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all text-white">
                       [PUBLISH STREAM] Broadcast to Network
                    </button>
                 </form>
              </section>

              <section>
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 italic">Incoming Transmissions <span className="text-red-600">(28H TTL)</span></h3>
                    <button 
                      onClick={cleanupOldNews}
                      className="text-[8px] font-mono uppercase bg-red-600/10 text-red-500 px-3 py-1 rounded border border-red-500/20 flex items-center gap-1 hover:bg-red-600 hover:text-white transition-all"
                    >
                      <Clock size={10} /> Purge Expired
                    </button>
                 </div>
                 <div className="space-y-4">
                    {news ? (
                      news.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 cyber-card hover:bg-white/[0.02] transition-all group">
                          <div className="flex gap-4 items-center">
                              <div className="w-16 h-12 overflow-hidden rounded border border-white/10 relative">
                                <img src={item.image || undefined} className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-500" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold uppercase text-white group-hover:text-red-500 transition-colors flex flex-wrap items-center gap-2">
                                  {item.title}
                                  {new Date(item.created_at) > new Date() && (
                                    <span className="text-[7.5px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 uppercase tracking-wider font-extrabold animate-pulse">
                                      [SCHEDULED RELEASE: {new Date(item.created_at).toLocaleString()}]
                                    </span>
                                  )}
                                </h4>
                                <span className="text-[8px] font-mono text-gray-600 uppercase italic">{item.category} • {item.author_name}</span>
                              </div>
                          </div>
                          <button onClick={() => deleteNews(item.id)} className="p-2 text-gray-700 hover:text-red-500 transition-all transform hover:scale-110">
                              <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center text-gray-600 font-mono text-xs italic">Syncing with news node...</div>
                    )}
                 </div>
              </section>
           </div>
         )}

         {activeTab === 'anime' && (
            <div className="space-y-12">
               <section className="cyber-card p-8 bg-black/40 border border-red-600/20 border-dashed">
                  <h3 className="text-xl font-black italic tracking-tighter uppercase mb-2 flex items-center gap-2 text-red-500">
                     ✨ AUTOMATED COMPLIANCE-SAFE SEEDER NODE
                  </h3>
                  <p className="text-xs text-gray-400 mb-6 font-mono uppercase tracking-wider leading-relaxed">
                     Input an anime slug identifier below. Our high-reliability informational engine will seed exactly 12 safe, text-only episodic summaries & titles into the database archives. Completely compliant with Play Store and App Store policies.
                  </p>
                  
                  <form onSubmit={runAnimeScraper} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Anime slug / ID</label>
                        <input 
                          required 
                          value={scraperProviderId} 
                          onChange={e => setScraperProviderId(e.target.value)} 
                          placeholder="e.g. solo-leveling, attack-on-titan, demon-slayer" 
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none placeholder-gray-800 text-white animate-pulse" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Custom Title Override (Optional)</label>
                        <input 
                          value={scraperAnimeTitle} 
                          onChange={e => setScraperAnimeTitle(e.target.value)} 
                          placeholder="e.g. Solo Leveling (Overrides default slug-based title)" 
                          className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none placeholder-gray-800 text-white" 
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={scraperLoading || !scraperProviderId.trim()}
                      className="bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {scraperLoading ? 'STABILIZING MAIN DATABASE CHANNELS...' : 'INITIATE INFORMATIONAL DATA SEED'}
                    </button>
                  </form>

                  {scraperSuccess && (
                    <div className="mt-6 p-4 bg-green-950/20 border border-green-500/20 rounded font-mono text-xs text-green-400">
                      <p className="font-bold uppercase tracking-wider mb-2">✓ Compliance Check Passed. Meta-data Ingest Complete.</p>
                      <div className="max-h-40 overflow-y-auto space-y-1 mt-2 text-gray-400 border-t border-green-500/20 pt-2 text-[10px]">
                        {scraperLogs.map((log, i) => (
                          <div key={i} className="border-l border-green-500/30 pl-2 font-mono">{log}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {scraperError && (
                    <div className="mt-6 p-4 bg-red-950/20 border border-red-500/20 rounded font-mono text-xs text-red-500 uppercase tracking-wide">
                      ⚡ SEED SIGNAL FAILED: {scraperError}
                    </div>
                  )}
                </section>

                <section className="cyber-card p-8 bg-black/40 border-dashed border-white/20">
                   <h3 className="text-xl font-black italic tracking-tighter uppercase mb-2 flex items-center gap-2">
                      <Plus className="text-red-600" /> New <span className="text-red-500">Manual Entry</span>
                   </h3>
                   <p className="text-xs text-gray-500 mb-6 font-mono uppercase tracking-wider">
                     Manually populate the core Series schema parameters below.
                   </p>
                   <form onSubmit={addAnime} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Title</label>
                        <input required value={animeForm.title} onChange={e => setAnimeForm({...animeForm, title: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Image URL</label>
                        <input required value={animeForm.image} onChange={e => setAnimeForm({...animeForm, image: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Rating (0-10)</label>
                        <input type="number" step="0.1" value={animeForm.rating} onChange={e => setAnimeForm({...animeForm, rating: parseFloat(e.target.value)})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500">Status</label>
                        <select value={animeForm.status} onChange={e => setAnimeForm({...animeForm, status: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none">
                          <option>Airing</option>
                          <option>Completed</option>
                          <option>Upcoming</option>
                        </select>
                      </div>
                    </div>
                    <button className="bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all text-white">
                       Sync with Database
                    </button>
                  </form>
               </section>

               <section>
                 <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 mb-6 italic">Database Nodes</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {anime.map(item => (
                      <div key={item.id} className="flex items-center justify-between p-4 cyber-card">
                        <div className="flex gap-4 items-center">
                          <img src={item.image || undefined} className="w-10 h-14 object-cover rounded border border-white/10" />
                          <div>
                            <h4 className="text-xs font-bold uppercase">{item.title}</h4>
                            <span className="text-[8px] font-mono text-gray-600 uppercase">{item.status} • {item.rating}★</span>
                          </div>
                        </div>
                        <button onClick={() => deleteAnime(item.id)} className="p-2 text-gray-700 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                 </div>
               </section>
            </div>
          )}

          {activeTab === 'releases' && (
            <div className="space-y-12">
              <section className="cyber-card p-8 bg-black/40 border-dashed border-white/20">
                <h3 className="text-xl font-black italic tracking-tighter uppercase mb-8 flex items-center gap-2">
                  <Plus className="text-red-600" /> New <span className="text-red-500">Release Event</span>
                </h3>
                <form onSubmit={addRelease} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500">Anime Title</label>
                      <input required value={releaseForm.title} onChange={e => setReleaseForm({...releaseForm, title: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-gray-500">Release Date/Time</label>
                      <input type="datetime-local" required value={releaseForm.release_date} onChange={e => setReleaseForm({...releaseForm, release_date: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none text-white" />
                    </div>
                  </div>
                  <button className="bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all text-white">
                    Initialize Tracker
                  </button>
                </form>
              </section>

              <section>
                <div className="space-y-4">
                  {releases.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 cyber-card border-white/5">
                      <div className="flex gap-6 items-center">
                        <Clock size={16} className="text-red-600" />
                        <div>
                          <h4 className="text-xs font-bold uppercase">{item.title}</h4>
                          <span className="text-[8px] font-mono text-gray-600 uppercase italic">ETA: {new Date(item.release_date).toLocaleString()}</span>
                        </div>
                      </div>
                      <button onClick={() => deleteRelease(item.id)} className="p-2 text-gray-700 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {activeTab === 'polls' && (
            <div className="space-y-12">
              <section className="cyber-card p-8 bg-black/40 border-dashed border-white/20">
                <h3 className="text-xl font-black italic tracking-tighter uppercase mb-8 flex items-center gap-2">
                  <Plus className="text-red-600" /> New <span className="text-red-500">Direct Poll</span>
                </h3>
                <form onSubmit={addPoll} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Question</label>
                    <input required value={pollForm.question} onChange={e => setPollForm({...pollForm, question: e.target.value})} className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-gray-500">Options (Comma separated)</label>
                    <input required value={pollForm.options} onChange={e => setPollForm({...pollForm, options: e.target.value})} placeholder="Option 1, Option 2, Option 3" className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-sm font-mono focus:border-red-600 outline-none" />
                  </div>
                  <button className="bg-red-600 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all text-white">
                    Initiate Consensus
                  </button>
                </form>
              </section>

              <section>
                <div className="space-y-4">
                  {polls.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 cyber-card">
                      <div>
                        <h4 className="text-xs font-bold uppercase">{item.question}</h4>
                        <span className="text-[8px] font-mono text-gray-600 uppercase">Status: {item.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => togglePoll(item.id, item.is_active)} className="text-[8px] font-mono uppercase bg-white/5 px-2 py-1 rounded">
                          {item.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

         {activeTab === 'apps' && (
           <div className="space-y-8 animate-fade-in">
             <RecruitmentReview onApprovalComplete={fetchApplications} />
           </div>
         )}

         {activeTab === 'users' && (
            <div className="space-y-8 animate-fade-in font-sans">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                     <h3 className="text-xl font-black uppercase tracking-widest text-white font-mono">
                        User Management Directory
                     </h3>
                     <p className="text-xs text-gray-400 font-mono uppercase mt-1">
                        Consolidated directory database matching user clearance records with real-time premium ledger assets.
                     </p>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] uppercase font-mono px-3 py-1 bg-white/5 border border-white/10 rounded-full text-gray-400">
                        Total Nodes: <span className="text-white font-black">{users.length}</span>
                     </span>
                     <span className="text-[10px] uppercase font-mono px-3 py-1 bg-red-600/10 border border-red-600/30 rounded-full text-red-500">
                        Filtered: <span className="text-white font-black">{users.filter(u => {
                            const username = (u.username || '').toLowerCase();
                            const email = (u.email || '').toLowerCase();
                            const matchesSearch = username.includes(userSearchTerm.toLowerCase()) || email.includes(userSearchTerm.toLowerCase());
                            if (!matchesSearch) return false;
                            if (userTypeFilter === 'all') return true;
                            if (userTypeFilter === 'premium') return !!u.is_premium || u.premium_tier === 'plus' || u.premium_tier === 'god' || u.premium_tier === 'monarch';
                            if (userTypeFilter === 'elite') return u.role === 'admin' || u.role === 'moderator';
                            return true;
                        }).length}</span>
                     </span>
                  </div>
               </div>

               {/* Search & Filtering Control Center */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center bg-zinc-950/80 p-4 rounded-xl border border-white/5 font-mono">
                  {/* Text Search input */}
                  <div className="relative lg:col-span-1">
                     <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                     <input 
                        type="text"
                        placeholder="SEARCH BY USERNAME OR EMAIL..."
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-red-600 rounded-lg py-2 pl-9 pr-4 text-xs font-mono uppercase tracking-wide text-white transition-all outline-none"
                     />
                  </div>

                  {/* Filter Tabs / Quick Toggle buttons */}
                  <div className="lg:col-span-2 flex flex-wrap gap-2 justify-start lg:justify-end">
                     <button
                        onClick={() => setUserTypeFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                           userTypeFilter === 'all' 
                           ? 'bg-white/15 text-white border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.05)]' 
                           : 'bg-black/40 text-gray-500 border-white/5 hover:text-white hover:border-white/10'
                        }`}
                     >
                        ALL OPERATORS
                     </button>
                     <button
                        onClick={() => setUserTypeFilter('premium')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                           userTypeFilter === 'premium' 
                           ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.15)]' 
                           : 'bg-black/40 text-gray-500 border-white/5 hover:text-yellow-500/50 hover:border-yellow-500/20'
                        }`}
                     >
                        <span>★</span> PREMIUM NODES
                     </button>
                     <button
                        onClick={() => setUserTypeFilter('elite')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                           userTypeFilter === 'elite' 
                           ? 'bg-red-600/20 text-red-500 border-red-600/40 shadow-[0_0_15px_rgba(220,38,38,0.15)]' 
                           : 'bg-black/40 text-gray-500 border-white/5 hover:text-red-500/50 hover:border-red-600/20'
                        }`}
                     >
                        <span>⚡</span> ELITE ADMINS
                     </button>
                  </div>
               </div>

               {/* Table Display */}
               <div className="cyber-card bg-black/60 border border-white/5 overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left font-mono text-[10px] uppercase">
                        <thead>
                           <tr className="border-b border-white/10 bg-zinc-950/40 text-gray-500">
                              <th className="py-3 px-4 font-black tracking-wider">User Profile & Metadata</th>
                              <th className="py-3 px-4 font-black tracking-wider">Email Address</th>
                              <th className="py-3 px-4 font-black tracking-wider text-center">Active clearance Tier</th>
                              <th className="py-3 px-4 font-black tracking-wider text-center">Admin Node Role</th>
                              <th className="py-3 px-4 font-black tracking-wider">Last Transaction Link</th>
                              <th className="py-3 px-4 font-black tracking-wider text-right">Registered On</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {users.filter(u => {
                              const username = (u.username || '').toLowerCase();
                              const email = (u.email || '').toLowerCase();
                              const matchesSearch = username.includes(userSearchTerm.toLowerCase()) || email.includes(userSearchTerm.toLowerCase());
                              if (!matchesSearch) return false;
                              if (userTypeFilter === 'all') return true;
                              if (userTypeFilter === 'premium') return !!u.is_premium || u.premium_tier === 'plus' || u.premium_tier === 'god' || u.premium_tier === 'monarch';
                              if (userTypeFilter === 'elite') return u.role === 'admin' || u.role === 'moderator';
                              return true;
                           }).length === 0 ? (
                              <tr>
                                 <td colSpan={6} className="py-12 text-center text-gray-600 font-mono text-xs italic">
                                    No database entries matching selected filters found
                                 </td>
                              </tr>
                           ) : (
                              users.filter(u => {
                                 const username = (u.username || '').toLowerCase();
                                 const email = (u.email || '').toLowerCase();
                                 const matchesSearch = username.includes(userSearchTerm.toLowerCase()) || email.includes(userSearchTerm.toLowerCase());
                                 if (!matchesSearch) return false;
                                 if (userTypeFilter === 'all') return true;
                                 if (userTypeFilter === 'premium') return !!u.is_premium || u.premium_tier === 'plus' || u.premium_tier === 'god' || u.premium_tier === 'monarch';
                                 if (userTypeFilter === 'elite') return u.role === 'admin' || u.role === 'moderator';
                                 return true;
                              }).map(u => {
                                 // Look up latest transaction
                                 const lastTx = allTransactions.find(tx => tx.user_id === u.id);
                                 
                                 // Determine styling for Active Tier
                                 let tierStyle = "bg-white/5 text-gray-400 border-white/5";
                                 let tierLabel = "FREE";
                                 const isPremium = !!u.is_premium || u.premium_tier === 'plus' || u.premium_tier === 'god' || u.premium_tier === 'monarch';
                                 
                                 if (u.role === 'admin') {
                                    tierStyle = "bg-red-600/10 text-red-500 border-red-600/30 font-black animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.1)]";
                                    tierLabel = "ELITE ADMIN";
                                 } else if (isPremium) {
                                    const pTier = u.premium_tier?.toUpperCase() || 'PREMIUM';
                                    tierStyle = "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 text-yellow-500 border-yellow-500/30 font-black shadow-[0_0_12px_rgba(245,158,11,0.08)]";
                                    tierLabel = `PREMIUM (${pTier})`;
                                 } else if (u.role === 'moderator') {
                                    tierStyle = "bg-purple-600/10 text-purple-400 border-purple-600/30";
                                    tierLabel = "MODERATOR";
                                 }
                                 
                                 return (
                                    <tr key={u.id} className="text-gray-300 hover:bg-white/[0.02] transition-colors">
                                       <td className="py-4 px-4 max-w-sm">
                                          <div className="flex items-start gap-3">
                                             <div className="relative group shrink-0">
                                                <img 
                                                   src={u.avatar_url || u.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`} 
                                                   className="w-10 h-10 rounded border border-white/10 bg-black/40 object-cover" 
                                                   referrerPolicy="no-referrer"
                                                   alt="Avatar"
                                                />
                                                <div className="opacity-0 group-hover:opacity-100 absolute inset-0 bg-black/60 rounded flex items-center justify-center transition-all">
                                                   <span className="text-[6px] text-white font-mono">ID PREV</span>
                                                </div>
                                             </div>
                                             
                                             <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                   <span className="font-black text-white tracking-tighter italic text-xs block truncate max-w-[300px]">
                                                      {u.username || 'ANON_NODE'} [{tierLabel}]
                                                   </span>
                                                   {userFactions[u.id] && (
                                                      <span className="text-[10px] text-gray-400 font-bold font-mono flex items-center gap-1">
                                                         • {getFactionEmoji(userFactions[u.id].faction_name)} {userFactions[u.id].faction_name.toUpperCase()} {userFactions[u.id].faction_rank.toUpperCase()}
                                                      </span>
                                                   )}
                                                   <span className="px-1.5 py-0.2 bg-white/5 border border-white/5 text-[7px] text-gray-500 font-mono rounded">
                                                      LVL {u.level || 1}
                                                   </span>
                                                </div>
                                                <div className="text-[8px] text-gray-500 font-mono select-all block font-bold cursor-help" title={u.id}>
                                                   ID: {u.id.substring(0, 8)}...{u.id.substring(u.id.length - 8)}
                                                </div>
                                                {/* Bio preview */}
                                                <div className="text-[9px] text-gray-400 lowercase max-w-[200px] truncate italic font-sans mt-0.5" title={u.bio || 'No status written'}>
                                                   "{u.bio || 'no intelligence bio record.'}"
                                                </div>
                                             </div>
                                          </div>
                                       </td>
                                       
                                       <td className="py-4 px-4 font-mono text-gray-400 lowercase text-[9px] select-all">
                                          {u.email || (
                                             <span className="text-gray-600 uppercase tracking-widest italic text-[8px]">
                                                NO_EMAIL_RECORDED
                                             </span>
                                          )}
                                       </td>
                                       
                                       <td className="py-4 px-4 text-center">
                                          <span className={`inline-block px-2.5 py-1 text-[8px] font-mono rounded-full border uppercase tracking-wider ${tierStyle}`}>
                                             {tierLabel}
                                          </span>
                                       </td>

                                       <td className="py-4 px-4 text-center">
                                          <select 
                                             className="bg-black border border-white/10 hover:border-white/20 p-1 px-2 rounded-lg text-[8px] text-white font-mono uppercase tracking-wide focus:border-red-600 outline-none w-28 text-center cursor-pointer transition-all"
                                             value={u.role || 'member'}
                                             onChange={(e) => updateUserRole(u.id, e.target.value)}
                                          >
                                             <option value="member">MEMBER</option>
                                             <option value="news_writer">WRITER</option>
                                             <option value="moderator">MODERATOR</option>
                                             <option value="admin">ADMIN</option>
                                          </select>
                                       </td>

                                       <td className="py-4 px-4">
                                          {lastTx ? (
                                             <div className="space-y-1 font-mono text-[9px]">
                                                <div className="flex items-center gap-1.5">
                                                   <span className="text-gray-400 uppercase tracking-wide">UTR:</span>
                                                   <span className="font-bold text-white select-all">{lastTx.transaction_id}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                   <span className="text-gray-500">STATUS:</span>
                                                   <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                                      lastTx.status === 'verified' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                                                      lastTx.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                      'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                                   }`}>
                                                      {lastTx.status}
                                                   </span>
                                                   {lastTx.screenshot_url && (
                                                      <button 
                                                         onClick={() => setSelectedScreenshotUrl(lastTx.screenshot_url)}
                                                         className="text-yellow-500 hover:text-white transition-colors underline text-[7px] font-black uppercase ml-auto"
                                                      >
                                                         VIEW RECEIPT
                                                      </button>
                                                   )}
                                                </div>
                                             </div>
                                          ) : (
                                             <span className="text-gray-600 font-mono text-[9px] uppercase tracking-widest italic block">
                                                NO_LEDGER_DATA
                                             </span>
                                          )}
                                       </td>

                                       <td className="py-4 px-4 text-right font-mono text-gray-500 text-[9px]">
                                          {new Date(u.created_at).toLocaleDateString(undefined, { 
                                             year: 'numeric', 
                                             month: 'short', 
                                             day: 'numeric' 
                                          })}
                                       </td>
                                    </tr>
                                 );
                              })
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'payments' && (
             <div className="space-y-8 animate-fade-in font-sans">
                <div className="flex items-center justify-between">
                   <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 font-mono mb-1">Premium Ledger Node</h3>
                      <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Verify subscriber payments and authenticate membership clearances</p>
                   </div>
                   <button 
                     onClick={fetchPendingTx}
                     disabled={pendingTxLoading}
                     className="px-3 py-1 bg-white/5 border border-white/10 text-[9px] font-mono rounded hover:bg-white/10 uppercase tracking-widest transition-all"
                   >
                     {pendingTxLoading ? 'RELOADING...' : 'FORCE REFRESH'}
                   </button>
                </div>

                {pendingTxError && (
                  <div className="p-4 bg-red-950/40 border border-red-900/40 rounded-xl flex items-center gap-3 text-red-400 text-xs font-mono uppercase tracking-wider">
                    <AlertCircle size={16} className="shrink-0 animate-bounce" />
                    <span>{pendingTxError}</span>
                  </div>
                )}

                {pendingTxSuccessMsg && (
                  <div className="p-4 bg-green-950/40 border border-green-900/40 rounded-xl flex items-center gap-3 text-green-400 text-xs font-mono uppercase tracking-wider">
                     <CheckCircle2 size={16} className="shrink-0" />
                     <span>{pendingTxSuccessMsg}</span>
                  </div>
                )}

                <div className="cyber-card p-6 bg-black/40 border border-white/5 overflow-x-auto">
                   {pendingTxLoading ? (
                     <div className="p-12 text-center text-xs font-mono text-gray-500 uppercase tracking-widest animate-pulse">
                       Querying secure transaction registers...
                     </div>
                   ) : pendingTx.length === 0 ? (
                     <div className="p-12 text-center text-xs font-mono text-gray-500 uppercase tracking-widest">
                       No pending subscription receipts await authorization.
                     </div>
                   ) : (
                     <table className="w-full text-left border-collapse font-sans">
                        <thead>
                           <tr className="border-b border-white/10 text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                              <th className="py-3 px-4 font-black">User Details</th>
                              <th className="py-3 px-4 font-black">UTR / Transaction ID</th>
                              <th className="py-3 px-4 font-black">Receipt Proof</th>
                              <th className="py-3 px-4 font-black">Designated Tier</th>
                              <th className="py-3 px-4 font-black">Timestamp</th>
                              <th className="py-3 px-4 font-black text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs text-white">
                           {pendingTx.map((tx) => (
                              <tr key={tx.id} className="hover:bg-white/[0.01] transition-all">
                                 <td className="py-4 px-4">
                                    <div className="font-bold">{tx.username || 'Vanguard Agent'}</div>
                                    <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-0.5">{tx.user_email || tx.user_id}</div>
                                    <div className="text-[8px] text-gray-600 font-mono mt-0.5 uppercase tracking-wider">ID: {tx.user_id}</div>
                                 </td>
                                 <td className="py-4 px-4 font-mono text-yellow-500 font-black tracking-wider uppercase">
                                    {tx.transaction_id || tx.utr}
                                 </td>
                                 <td className="py-4 px-4">
                                    {tx.screenshot_url ? (
                                       <div 
                                         onClick={() => setSelectedScreenshotUrl(tx.screenshot_url)}
                                         className="w-16 h-12 rounded border border-white/10 bg-black/50 overflow-hidden cursor-pointer hover:border-yellow-500/50 hover:scale-105 transition-all flex items-center justify-center relative group"
                                       >
                                         <img 
                                           src={tx.screenshot_url} 
                                           alt="Receipt Proof" 
                                           className="w-full h-full object-cover" 
                                           referrerPolicy="no-referrer"
                                         />
                                         <div className="absolute inset-x-0 bottom-0 bg-black/85 py-0.5 text-center text-[7px] font-mono font-black uppercase text-yellow-500 tracking-wider">
                                           PREVIEW
                                         </div>
                                       </div>
                                    ) : (
                                       <span className="text-gray-600 font-mono text-[9px] uppercase tracking-widest">No receipt image</span>
                                    )}
                                 </td>
                                 <td className="py-4 px-4">
                                    <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[9px] font-mono rounded border border-yellow-500/20 uppercase tracking-wider font-extrabold">
                                       {tx.tier?.toUpperCase() || 'MONARCH'}
                                    </span>
                                 </td>
                                 <td className="py-4 px-4 font-mono text-gray-500 text-[10px] uppercase">
                                    {new Date(tx.created_at).toLocaleString('en-US', { timeZoneName: 'short' })}
                                 </td>
                                 <td className="py-4 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                       <button 
                                         onClick={() => handleApproveTx(tx.id, tx.user_id, tx.tier || 'monarch')}
                                         className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white font-mono text-[9px] font-black uppercase tracking-wider rounded transition-all"
                                       >
                                         APPROVE PAYMENT
                                       </button>
                                       <button 
                                         onClick={() => handleRejectTx(tx.id)}
                                         className="px-3 py-1.5 bg-red-600/20 border border-red-500/20 hover:bg-red-600 text-white font-mono text-[9px] font-black uppercase tracking-wider rounded transition-all"
                                       >
                                         REJECT
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   )}
                </div>
             </div>
          )}
          {activeTab === 'settings' && (
             <div className="space-y-8 animate-fade-in font-sans">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-6 font-mono">System Configuration</h3>
                
                <section className="cyber-card p-8 bg-black/40 border border-white/5 border-dashed">
                   <div className="flex items-center gap-3 mb-6">
                     <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center text-red-500">
                       <Settings size={16} />
                     </div>
                     <div>
                       <h4 className="text-sm font-bold text-white uppercase tracking-wider italic">App Payment Configuration</h4>
                       <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-0.5">Define UPI ID address and synchronize visual scan gateway QR</p>
                     </div>
                   </div>

                   <form onSubmit={handlePaymentConfigSubmit} className="space-y-6">
                      {paymentConfigError && (
                        <div className="p-4 bg-red-950/40 border border-red-900/40 rounded-xl flex items-center gap-3 text-red-400 text-xs font-mono uppercase tracking-wider">
                          <AlertCircle size={16} className="shrink-0 animate-bounce" />
                          <span>{paymentConfigError}</span>
                        </div>
                      )}

                      {paymentConfigSuccess && (
                        <div className="p-4 bg-green-950/40 border border-green-900/40 rounded-xl flex items-center gap-3 text-green-400 text-xs font-mono uppercase tracking-wider">
                          <CheckCircle2 size={16} className="shrink-0" />
                          <span>System configuration synced correctly across nodes!</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* UPI ID Input */}
                         <div className="space-y-2">
                            <label className="text-[8px] font-mono font-black text-gray-400 uppercase tracking-widest block">Official Merchant UPI ID</label>
                            <input 
                              type="text" 
                              className="w-full bg-black border border-white/10 rounded-lg p-3 text-xs text-white uppercase focus:border-red-600 focus:outline-none transition-all font-mono"
                              placeholder="6351197285@fam"
                              value={paymentUpiId}
                              onChange={(e) => setPaymentUpiId(e.target.value)}
                              required
                            />
                            <p className="text-[8px] font-mono text-gray-600 uppercase tracking-wider">This UPI address will be utilized for user-facing copies and verification links.</p>
                         </div>

                         {/* QR Code File Input */}
                         <div className="space-y-2">
                            <label className="text-[8px] font-mono font-black text-gray-400 uppercase tracking-widest block">Custom Payment QR Code Image</label>
                            <div className="flex items-center gap-4">
                               <div className="flex-1">
                                 <input 
                                   type="file" 
                                   accept="image/*"
                                   id="payment-qr-file"
                                   onChange={(e) => {
                                     if (e.target.files && e.target.files[0]) {
                                       setPaymentQrFile(e.target.files[0]);
                                     }
                                   }}
                                   className="hidden"
                                 />
                                 <label 
                                   htmlFor="payment-qr-file"
                                   className="flex items-center justify-center gap-2 cursor-pointer w-full bg-white/5 border border-dashed border-white/10 hover:border-red-600/40 hover:bg-white/10 rounded-lg p-3 text-xs font-mono text-yellow-500 uppercase transition-all select-none"
                                 >
                                   <Upload size={14} />
                                   <span>{paymentQrFile ? paymentQrFile.name : 'Choose Image File'}</span>
                                 </label>
                               </div>

                               {/* Preview Box */}
                               {(paymentQrFile || paymentQrUrl) && (
                                 <div className="w-14 h-14 bg-white p-0.5 rounded border border-white/20 shrink-0 flex items-center justify-center relative overflow-hidden group">
                                   <img 
                                     src={paymentQrFile ? URL.createObjectURL(paymentQrFile) : paymentQrUrl} 
                                     alt="QR Preview" 
                                     className="w-full h-full object-contain"
                                   />
                                 </div>
                               )}
                            </div>
                            <p className="text-[8px] font-mono text-gray-600 uppercase tracking-wider">Upload JPEG or PNG files. Will fallback to previous storage paths if left vacant.</p>
                         </div>
                      </div>

                      <div className="pt-4 border-t border-white/5 flex justify-end">
                         <button 
                           type="submit" 
                           disabled={paymentConfigLoading}
                           className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-800 text-white font-mono text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-2"
                         >
                           {paymentConfigLoading ? 'SYNCING...' : 'SAVE CONFIGURATION'}
                         </button>
                      </div>
                   </form>
                </section>
             </div>
          )}

          {activeTab === 'reports' && (
             <div className="space-y-8 animate-fade-in font-sans">
                <div>
                   <h3 className="text-xl font-black uppercase tracking-widest text-red-500 font-mono flex items-center gap-2">
                      <Shield className="text-red-500 shrink-0" size={24} /> Neural Report Monitor & Resolution Core
                   </h3>
                   <p className="text-xs text-gray-400 font-mono uppercase mt-1">
                      Consolidated user misconduct flags, logs, and server-authoritative account termination controls.
                   </p>
                </div>

                {/* Controls / Filter row */}
                <div className="p-4 bg-zinc-950/80 rounded-xl border border-white/5 font-mono flex items-center justify-between gap-4">
                   <span className="text-[10px] uppercase font-mono tracking-wider text-gray-400">
                      Active Inbound Incident Flags: <span className="text-white font-black">{reports.length}</span>
                   </span>
                   <button 
                      onClick={fetchReports}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg border border-white/5 transition-all uppercase text-[9px] font-mono font-bold tracking-wider"
                   >
                      Sync Report Ledger
                   </button>
                </div>

                {/* Reports Listing Grid */}
                {reports.length === 0 ? (
                   <div className="p-16 border border-dashed border-white/5 rounded-3xl bg-black/10 text-center font-mono text-[10px] uppercase tracking-widest text-[#71717A]">
                      [All clear. Zero neural misconduct incidents detected in the mainframe.]
                   </div>
                ) : (
                   <div className="space-y-4">
                      {reports.map((report) => {
                         const reporter = users.find(u => u.id === report.reporter_id);
                         const reportedUser = users.find(u => u.id === report.reported_user_id);
                         
                         return (
                            <div 
                               key={report.id} 
                               id={`report-node-${report.id}`}
                               className={`p-6 rounded-2xl border ${
                                  report.status === 'banned' 
                                     ? 'bg-red-950/5 border-red-900/10' 
                                     : report.status === 'resolved'
                                     ? 'bg-zinc-950/50 border-white/5'
                                     : 'bg-zinc-900/20 border-red-500/30'
                               } flex flex-col md:flex-row md:items-start justify-between gap-6 transition-all`}
                            >
                               <div className="space-y-3 flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                     <span className="px-2 py-0.5 text-[8px] font-mono font-black uppercase rounded bg-red-650/15 text-red-500 border border-red-500/10">
                                        Incident ID: #{report.id.slice(0, 6)}
                                     </span>
                                     <span className={`px-2 py-0.5 text-[8px] font-mono font-black uppercase rounded ${
                                        report.status === 'banned' 
                                           ? 'bg-red-600 text-white' 
                                           : report.status === 'resolved'
                                           ? 'bg-zinc-800 text-zinc-400'
                                           : 'bg-[#E50914]/20 text-[#E50914]'
                                     }`}>
                                        {report.status?.toUpperCase() || 'PENDING'}
                                     </span>
                                     <span className="text-[8px] font-mono text-gray-600 uppercase">
                                        Filed: {report.created_at ? new Date(report.created_at).toLocaleString() : ''}
                                     </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-sans">
                                     <div>
                                        <span className="text-[8px] font-mono font-black text-gray-500 block uppercase tracking-widest">Reporter Operator</span>
                                        <span className="text-xs uppercase font-mono text-white tracking-wider font-bold">
                                           {reporter?.username || 'Unknown User'} ({reporter?.email || 'N/A'})
                                        </span>
                                     </div>
                                     <div>
                                        <span className="text-[8px] font-mono font-black text-red-500 block uppercase tracking-widest">Target Misconduct Entity</span>
                                        <span className="text-xs uppercase font-mono text-red-400 tracking-wider font-black flex items-center gap-1.5">
                                           <span>{reportedUser?.username || 'Unknown User'} ({reportedUser?.email || 'N/A'})</span>
                                           {reportedUser?.account_status === 'banned' && (
                                              <span className="px-1.5 py-0.2 text-[7px] bg-red-600 text-white rounded font-bold uppercase">BANNED</span>
                                           )}
                                        </span>
                                     </div>
                                  </div>

                                  <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-1">
                                     <span className="text-[8px] font-mono font-black text-gray-500 uppercase block tracking-widest">Violation category: {report.reason}</span>
                                     <p className="text-xs text-gray-300 font-sans leading-relaxed">{report.details || 'No extended context provided.'}</p>
                                  </div>
                               </div>

                               {/* Action Buttons */}
                               <div className="flex select-none gap-2 shrink-0 md:self-center font-mono">
                                  {report.status === 'pending' && reportedUser?.account_status !== 'banned' ? (
                                     <>
                                        <button
                                           onClick={async () => {
                                              if (!confirm(`Are you sure you want to ban user ${reportedUser?.username || 'Target'}?`)) return;
                                              try {
                                                 const { error: banErr } = await supabase
                                                    .from('profiles')
                                                    .update({ account_status: 'banned' })
                                                    .eq('id', report.reported_user_id);
                                                 if (banErr) throw banErr;

                                                 const { error: reportErr } = await supabase
                                                    .from('reports')
                                                    .update({ status: 'banned' })
                                                    .eq('id', report.id);
                                                 if (reportErr) throw reportErr;

                                                 alert('User account was restricted and report archived successfully.');
                                                 fetchReports();
                                                 fetchUsers();
                                              } catch (err: any) {
                                                 alert(`Banning operations aborted: ${err.message}`);
                                              }
                                           }}
                                           className="px-4 py-2 bg-[#E50914] text-white hover:bg-red-750 text-[10px] font-black uppercase rounded-lg transition-all border border-red-500/20 shadow-lg font-mono font-black"
                                        >
                                           Ban User
                                        </button>
                                        <button
                                           onClick={async () => {
                                              try {
                                                 const { error: reportErr } = await supabase
                                                    .from('reports')
                                                    .update({ status: 'resolved' })
                                                    .eq('id', report.id);
                                                 if (reportErr) throw reportErr;

                                                 alert('Report archived as resolved.');
                                                 fetchReports();
                                              } catch (err: any) {
                                                 alert(`Update failed: ${err.message}`);
                                              }
                                           }}
                                           className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-750 text-[10px] font-black uppercase transition-all"
                                        >
                                           Dismiss
                                        </button>
                                     </>
                                  ) : (
                                     <div className="text-[9px] text-gray-500 uppercase tracking-widest italic flex items-center gap-1.5 font-bold">
                                        [Incident Resolved]
                                        {reportedUser?.account_status === 'banned' && (
                                           <button
                                              onClick={async () => {
                                                 if (!confirm(`Restore and unban user ${reportedUser?.username || 'Target'}?`)) return;
                                                 try {
                                                    const { error: unbanErr } = await supabase
                                                       .from('profiles')
                                                       .update({ account_status: 'active' })
                                                       .eq('id', report.reported_user_id);
                                                    if (unbanErr) throw unbanErr;

                                                    const { error: reportErr } = await supabase
                                                       .from('reports')
                                                       .update({ status: 'pending' })
                                                       .eq('id', report.id);
                                                    if (reportErr) throw reportErr;

                                                    alert('User credentials restored successfully.');
                                                    fetchReports();
                                                    fetchUsers();
                                                 } catch (err: any) {
                                                    alert(`Error unbanning: ${err.message}`);
                                                 }
                                              }}
                                              className="px-2 py-1 bg-green-950 text-green-400 hover:text-white border border-green-900 rounded uppercase font-mono text-[8px]"
                                           >
                                              Unban
                                           </button>
                                        )}
                                     </div>
                                  )}
                               </div>
                            </div>
                         );
                      })}
                   </div>
                )}
             </div>
          )}
      </main>

      {/* Lightbox Receipt Preview Modal Overlay */}
      {selectedScreenshotUrl && (
         <div 
           className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 backdrop-blur-md transition-all duration-300 animate-fade-in"
           onClick={() => setSelectedScreenshotUrl(null)}
         >
            <div className="absolute top-4 right-4 z-50">
               <button 
                 onClick={() => setSelectedScreenshotUrl(null)}
                 className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all font-mono text-xs uppercase tracking-widest font-black flex items-center gap-2"
               >
                  <span>Close</span>
                  <span className="text-[14px]">✕</span>
               </button>
            </div>
            <div 
              className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-black"
              onClick={(e) => e.stopPropagation()}
            >
               <img 
                 src={selectedScreenshotUrl} 
                 alt="High Res Receipt Proof" 
                 className="max-w-full max-h-[80vh] object-contain mx-auto" 
                 referrerPolicy="no-referrer"
               />
               <div className="p-3 bg-black/80 border-t border-white/5 text-center font-mono text-[10px] text-gray-400 uppercase tracking-widest">
                  Subscriber Receipt Ledger Preview Node • Click outside to escape
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
