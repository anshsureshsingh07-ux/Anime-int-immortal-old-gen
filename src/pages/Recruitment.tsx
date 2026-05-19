import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserPlus, MessageSquare, Shield, Send, Terminal, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Recruitment() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    discord: '',
    role: 'news_writer',
    skills: '',
    experience: '',
    availability: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<any>(null);
  const [existingApp, setExistingApp] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        checkExistingApplication(session.user.id);
      }
    });
  }, []);

  const checkExistingApplication = async (userId: string) => {
    const { data } = await supabase
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();
    
    if (data) setExistingApp(data);
  };

  const user = session?.user ? {
    id: session.user.id,
    email: session.user.email,
  } : {
    id: 'mock-user-id',
    email: 'admin@nexus.com'
  };

  const roles = [
    { id: 'news_writer', name: 'News Writer', desc: 'Cover breaking news and trending topics.', icon: Shield },
    { id: 'thumbnail_editor', name: 'UI/GFX Editor', desc: 'Create stunning visuals for the platform.', icon: UserPlus },
    { id: 'moderator', name: 'Enforcer (Mod)', desc: 'Maintain order in the digital sectors.', icon: Shield },
    { id: 'social_manager', name: 'Field Op (SMM)', desc: 'Expand our reach across social networks.', icon: Send },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to apply.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (existingApp) {
        throw new Error('You already have a pending application.');
      }

      const { error: submitError } = await supabase.from('applications').insert([
        {
          ...formData,
          user_id: user.id,
          user_email: user.email,
          status: 'pending'
        }
      ]);

      if (submitError) throw submitError;
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto p-12 text-center h-full flex flex-col justify-center">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#111] border border-[#1F1F1F] p-12 rounded-xl"
        >
          <div className="w-16 h-16 bg-[#FF0000] rounded flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(255,0,0,0.3)]">
            <Send className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-white">Transmission Sent</h2>
          <p className="text-gray-500 font-mono text-xs leading-relaxed">
            Your application has been logged in the central mainframe. Our field commanders will review your profile shortly.
          </p>
          <button 
            onClick={() => setSubmitted(false)}
            className="mt-8 px-6 py-3 bg-[#1F1F1F] text-white text-[10px] font-black uppercase tracking-widest rounded hover:bg-[#222] transition-colors"
          >
            Review Application
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8 grid grid-cols-12 gap-8 max-w-6xl mx-auto">
      <div className="col-span-12 lg:col-span-5">
        <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-6 leading-none text-white">
          Join the <span className="text-[#FF0000]">Vanguard</span>
        </h1>
        <p className="text-gray-500 text-sm mb-10 leading-relaxed">
          We are seeking agents of change. Artists, writers, and visionaries to help us define the next decade of anime culture.
        </p>

        <div className="space-y-4">
          {roles.map((role) => (
            <div 
              key={role.id} 
              className={`p-4 rounded border transition-all cursor-pointer ${
                formData.role === role.id 
                ? 'bg-[#1A0000] border-[#FF0000]' 
                : 'bg-[#111] border-[#1F1F1F] hover:border-[#333]'
              }`}
              onClick={() => setFormData({...formData, role: role.id})}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded ${formData.role === role.id ? 'bg-[#FF0000] text-white' : 'bg-[#1A1A1A] text-gray-500'}`}>
                  <role.icon size={18} />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-wide text-[11px] mb-1 text-white">{role.name}</h3>
                  <p className="text-[10px] text-gray-500 font-mono italic">{role.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-6 bg-[#111] border border-[#1F1F1F] rounded-lg">
          <h4 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest mb-4 text-[#FF0000]">
            <Terminal size={14} /> System Specs
          </h4>
          <ul className="text-[10px] text-[#555] font-mono space-y-2 uppercase tracking-wide">
            <li>• Active community participation</li>
            <li>• Discord internal system proficiency</li>
            <li>• Zero tolerance for network toxicity</li>
          </ul>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-7">
        <div className="bg-[#111] border border-[#1F1F1F] p-8 rounded-xl shadow-xl">
          <h2 className="text-lg font-black uppercase italic text-white mb-8 flex justify-between items-center">
             <span>Agent Profile</span>
             <span className="text-[10px] font-mono text-gray-600">REQ: {formData.role.toUpperCase()}</span>
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#555]">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#050505] border border-[#1F1F1F] rounded p-3 text-xs focus:border-[#FF0000] outline-none font-mono text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-[#555]">Age</label>
                <input 
                  required
                  type="number" 
                  value={formData.age}
                  onChange={(e) => setFormData({...formData, age: e.target.value})}
                  className="w-full bg-[#050505] border border-[#1F1F1F] rounded p-3 text-xs focus:border-[#FF0000] outline-none font-mono text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#555]">Communication Protocol (Discord/Telegram)</label>
              <input 
                required
                type="text" 
                value={formData.discord}
                onChange={(e) => setFormData({...formData, discord: e.target.value})}
                className="w-full bg-[#050505] border border-[#1F1F1F] rounded p-3 text-xs focus:border-[#FF0000] outline-none font-mono text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#555]">Skill Matrix</label>
              <textarea 
                required
                rows={2}
                value={formData.skills}
                onChange={(e) => setFormData({...formData, skills: e.target.value})}
                className="w-full bg-[#050505] border border-[#1F1F1F] rounded p-3 text-xs focus:border-[#FF0000] outline-none font-mono resize-none text-white appearance-none"
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#555]">Bio/Past Experience</label>
              <textarea 
                required
                rows={3}
                value={formData.experience}
                onChange={(e) => setFormData({...formData, experience: e.target.value})}
                className="w-full bg-[#050505] border border-[#1F1F1F] rounded p-3 text-xs focus:border-[#FF0000] outline-none font-mono resize-none text-white appearance-none"
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-[#555]">Availability Window</label>
              <input 
                required
                type="text" 
                value={formData.availability}
                onChange={(e) => setFormData({...formData, availability: e.target.value})}
                className="w-full bg-[#050505] border border-[#1F1F1F] rounded p-3 text-xs focus:border-[#FF0000] outline-none font-mono text-white"
              />
            </div>

            {error && (
              <div className="p-3 bg-[#1A0000] border border-[#FF0000]/20 text-[#FF0000] text-[10px] flex items-center gap-2 font-mono uppercase font-black">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FF0000] hover:bg-[#CC0000] disabled:bg-gray-800 text-white font-black uppercase tracking-[0.3em] py-4 rounded transition-all text-xs"
            >
              {isSubmitting ? 'Processing...' : 'Engage Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
