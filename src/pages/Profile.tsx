import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Shield, Save, Camera, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function Profile() {
  const [fbUser, setFbUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ username: '', avatar_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribeFirebase = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/auth');
        return;
      }
      setFbUser(user);
      fetchProfileById(user.uid);
    });

    return () => unsubscribeFirebase();
  }, []);

  useEffect(() => {
    const handleProfileUpdate = () => {
      if (fbUser?.uid) {
        fetchProfileById(fbUser.uid);
      }
    };

    window.addEventListener('profiles-updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profiles-updated', handleProfileUpdate);
    };
  }, [fbUser]);

  const fetchProfileById = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    let profileData = data;
    const currentEmail = auth.currentUser?.email || fbUser?.email;
    if (currentEmail === 'anshsureshsingh07@gmail.com') {
      if (profileData) {
        profileData = { ...profileData, role: 'admin' };
      } else {
        profileData = { id: userId, username: currentEmail.split('@')[0], role: 'admin', avatar_url: '' };
      }
    }
    if (profileData) {
      setProfile(profileData);
      setForm({ username: profileData.username || '', avatar_url: profileData.avatar_url || '' });
    }
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fbUser || !profile) return;

    setUploading(true);
    setMsg({ type: '', text: '' });

    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.id}/${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      setMsg({ type: 'error', text: 'Upload failed: ' + uploadError.message });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    setForm({ ...form, avatar_url: publicUrl });
    setUploading(false);
    setMsg({ type: 'success', text: 'Avatar uploaded to Nexus storage.' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMsg({ type: '', text: '' });

    const { error } = await supabase
      .from('profiles')
      .update({ username: form.username, avatar_url: form.avatar_url })
      .eq('id', profile.id);

    if (error) {
      setMsg({ type: 'error', text: 'Error syncing with neural network.' });
    } else {
      setMsg({ type: 'success', text: 'Neural identity updated successfully.' });
      fetchProfileById(fbUser?.uid || profile.id);
      window.dispatchEvent(new Event('profiles-updated'));
    }
    setSaving(false);
  };

  if (loading) return <div className="p-20 text-center font-mono uppercase tracking-[0.4em] opacity-40">Accessing Node...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20">
      <Link to="/" className="text-[10px] font-mono text-gray-500 uppercase hover:text-red-500 flex items-center gap-2 mb-10 transition-all">
        <ArrowLeft size={12} /> Return to Nexus
      </Link>

      <div className="space-y-12">
        <header className="flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-2 border-red-600/30 overflow-hidden bg-black/40 shadow-[0_0_30px_rgba(220,38,38,0.1)]">
              <img 
                src={form.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser?.uid}`} 
                className="w-full h-full object-cover" 
              />
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-red-600/50"
            >
              {uploading ? (
                <Loader2 size={24} className="text-red-500 animate-spin" />
              ) : (
                <>
                  <Camera size={24} className="text-red-500" />
                  <span className="text-[8px] font-black uppercase text-white mt-1">Upload</span>
                </>
              )}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Neural <span className="text-red-500">Identity</span></h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-2">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest px-3 py-1 bg-white/5 rounded-full border border-white/10">
                Sector: {profile?.role?.toUpperCase() || 'MEMBER'}
              </span>
              <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest px-3 py-1 bg-red-500/5 rounded-full border border-red-500/10">
                Node ID: {profile?.id?.slice(0, 8) || 'GENERIC'}
              </span>
            </div>
          </div>
        </header>

        <form onSubmit={handleSave} className="bg-black/60 backdrop-blur-xl border border-white/5 rounded-3xl p-8 md:p-12 space-y-10">
          {msg.text && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-xl text-xs font-mono uppercase border flex items-center gap-3 ${
                msg.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'
              }`}
            >
              <div className={`w-2 h-2 rounded-full animate-pulse ${msg.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`} />
              [{msg.type === 'error' ? 'ERR' : 'OK'}] {msg.text}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                <User size={12} className="text-red-600" /> Neural Handle
              </label>
              <input 
                required
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono focus:border-red-600 outline-none text-white transition-all focus:shadow-[0_0_20px_rgba(220,38,38,0.1)]"
                placeholder="UNIDENTIFIED_USER"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2 opacity-50">
                <Mail size={12} /> Access Email
              </label>
              <input 
                disabled
                value={fbUser?.email || ''}
                className="w-full bg-black/20 border border-white/5 rounded-xl p-4 text-sm font-mono opacity-30 cursor-not-allowed text-gray-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
              <Upload size={12} className="text-red-600" /> Avatar Image URL
            </label>
            <div className="relative">
              <input 
                value={form.avatar_url}
                onChange={e => setForm({...form, avatar_url: e.target.value})}
                placeholder="https://..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono focus:border-red-600 outline-none text-white transition-all"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-2 top-2 bottom-2 px-4 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase transition-colors"
              >
                Local File
              </button>
            </div>
          </div>

          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="flex gap-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`w-4 h-1 rounded-full ${i === 1 ? 'bg-red-600' : 'bg-gray-800'}`} />
                  ))}
               </div>
               <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">Neural Integrity Verified</span>
            </div>
            <button 
              type="submit"
              disabled={saving || uploading}
              className="w-full md:w-auto bg-red-600 text-white px-10 py-4 rounded-full font-black uppercase text-[11px] tracking-[0.2em] hover:bg-red-700 transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(220,38,38,0.4)] disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Syncing...' : 'Update Node'}
            </button>
          </div>
        </form>

        <section className="p-10 border border-white/5 rounded-[2.5rem] bg-gradient-to-br from-[#0a0a0a] to-[#050505] relative overflow-hidden">
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-600/5 rounded-full blur-[100px]" />
           <h3 className="text-xs font-black uppercase tracking-widest text-white mb-8 flex items-center gap-2">
             <Shield size={14} className="text-red-500" /> System Metrics
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-1">
                <span className="text-[8px] font-mono text-gray-600 uppercase">Last Sync</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase">
                  {fbUser?.metadata?.lastSignInTime ? new Date(fbUser.metadata.lastSignInTime).toLocaleString() : 'N/A'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-mono text-gray-600 uppercase">Authorization</span>
                <p className="text-[10px] font-bold text-white uppercase">{profile?.role?.toUpperCase() || 'MEMBER'}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[8px] font-mono text-gray-600 uppercase">Node Encryption</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase">RSA-4096 / SHA-256</p>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}
