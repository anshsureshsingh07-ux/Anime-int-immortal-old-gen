import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, CheckCircle2, AlertCircle, Users, RefreshCw, ChevronRight, UserCheck } from 'lucide-react';

interface Application {
  id: string;
  name: string;
  user_id: string;
  user_email: string;
  role: string | null;
  discord: string;
  age: string | number;
  skills: string;
  experience: string;
  availability: string;
  created_at: string;
  is_approved?: boolean;
  granted_role?: string | null;
  status?: string;
}

interface RecruitmentReviewProps {
  onApprovalComplete?: () => void;
}

// Access Control helper to query is_approved status and return granted_role
export const checkAccess = async (email: string): Promise<string | null> => {
  if (!email) return null;
  try {
    const { data, error } = await supabase
      .from('applications')
      .select('granted_role')
      .eq('user_email', email)
      .eq('is_approved', true)
      .maybeSingle();

    if (error) {
      console.warn('[ACCESS_GATED] checkAccess db query warning:', error.message);
      return null;
    }
    return data?.granted_role || null;
  } catch (err: any) {
    console.warn('[ACCESS_GATED] checkAccess exception check:', err?.message);
    return null;
  }
};

const ROLES_POOL = [
  'News Writer',
  'UI/GFX Editor',
  'Enforcer',
  'Field Op'
];

export const RecruitmentReview: React.FC<RecruitmentReviewProps> = ({ onApprovalComplete }) => {
  const [list, setList] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPendingApplications = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch from 'pending_applications' view which filters is_approved is false
      const { data, error: fetchErr } = await supabase
        .from('pending_applications')
        .select('*');

      if (fetchErr) {
        console.warn('[RECRUITMENT] pending_applications view unavailable, falling back to direct applications table query:', fetchErr.message);
        
        // Dynamic fallback directly from 'applications' table where approved is false (or null)
        const { data: fbData, error: fbErr } = await supabase
          .from('applications')
          .select('*')
          .or('is_approved.eq.false,is_approved.is.null')
          .eq('status', 'pending');

        if (fbErr) throw fbErr;
        setList((fbData as Application[]) || []);
      } else {
        // filter client-side just in case the view returned approved ones, ensuring robust compliance
        const filtered = (data as Application[] || []).filter(app => !app.is_approved);
        setList(filtered);
      }
    } catch (err: any) {
      console.error('[RECRUITMENT] Failed synchronized connection:', err);
      setError(err.message || 'Mainframe interface error during recruitment sync.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApplications();
  }, []);

  const handleApprove = async (app: Application) => {
    const roleToGrant = selectedRoles[app.id] || 'News Writer';
    setSubmittingId(app.id);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Update applications table values
      const { error: appErr } = await supabase
        .from('applications')
        .update({
          is_approved: true,
          granted_role: roleToGrant,
          status: 'approved'
        })
        .eq('id', app.id);

      if (appErr) throw appErr;

      // 2. Synchronize user profile role to the normalized lowercase value
      const targetUserId = app.user_id;
      const normalizedRole = roleToGrant.toLowerCase().replace(/\s+/g, '_'); // e.g. "News Writer" -> "news_writer"
      
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ role: normalizedRole })
        .eq('id', targetUserId);

      if (profileErr) {
        console.warn('[RECRUITMENT_SYNC] Approved successfully but profile role update failed:', profileErr.message);
      }

      setSuccessMsg(`NODE LINK SEALED: Authorized ${app.name} as ${roleToGrant}`);
      
      // Update UI list state
      setList(prev => prev.filter(item => item.id !== app.id));
      
      // Fire custom profile sync dispatcher to update other views across pages
      window.dispatchEvent(new Event('profiles-updated'));
      if (onApprovalComplete) {
        onApprovalComplete();
      }

    } catch (err: any) {
      console.error('[RECRUITMENT_REJECT] Failed approve operation:', err);
      setError(err.message || 'Authorization broadcast rejected by database layer.');
    } finally {
      setSubmittingId(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const handleRoleChange = (appId: string, role: string) => {
    setSelectedRoles(prev => ({
      ...prev,
      [appId]: role
    }));
  };

  if (loading) {
    return (
      <div id="recruitment-review-loader" className="p-16 text-center border border-white/5 bg-[#08080a]/80 backdrop-blur-md rounded-2xl">
        <RefreshCw size={28} className="mx-auto text-red-600 animate-spin mb-4" />
        <span className="font-mono text-xs uppercase tracking-widest text-gray-500 font-bold">Decoding Applicant Dossiers...</span>
      </div>
    );
  }

  return (
    <div id="recruitment-review-container" className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Shield className="text-red-600 w-4 h-4" /> RECRUITMENT REVIEWS CORE
          </h3>
          <p className="text-[10px] font-mono text-gray-500 uppercase mt-0.5">Authoritative filter query of is_approved clearance bounds.</p>
        </div>
        <button
          type="button"
          onClick={fetchPendingApplications}
          className="p-2 border border-white/10 hover:border-red-600/50 bg-black/40 rounded-lg text-gray-400 hover:text-white transition-all"
          title="Reload system queue"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex items-center gap-3 text-red-500 text-xs font-mono">
          <AlertCircle size={16} />
          <span>BROADCAST ERROR: {error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg flex items-center gap-3 text-green-500 text-xs font-mono animate-pulse">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {list.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-white/5 rounded-2xl bg-black/20">
          <UserCheck className="mx-auto text-gray-600 mb-3 w-8 h-8 opacity-40" />
          <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">No candidates awaiting clearance in this sector</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(app => {
            const currentSelected = selectedRoles[app.id] || 'News Writer';
            return (
              <div key={app.id} className="bg-[#09090b]/90 border border-white/10 hover:border-red-600/35 rounded-xl p-6 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.4)]">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4 pb-4 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-red-500/30 bg-red-950/20 flex items-center justify-center font-bold text-red-500 text-sm">
                      {app.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-white">{app.name}</h4>
                      <div className="font-mono text-[9px] text-gray-500 flex items-center gap-2">
                        <span>{app.user_email}</span>
                        <ChevronRight className="w-2.5 h-2.5 opacity-50" />
                        <span className="text-red-500">discord: {app.discord}</span>
                      </div>
                    </div>
                  </div>
                  
                  <span className="text-[9px] font-mono border border-yellow-500/20 bg-yellow-500/5 px-2.5 py-1 rounded text-yellow-500 tracking-wider font-extrabold uppercase shrink-0">
                    CLEARANCE PENDING
                  </span>
                </div>

                {/* Info Matrix Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-[10px] font-mono border-b border-white/5 pb-4">
                  <div>
                    <span className="text-gray-500 block mb-0.5">APPLIED ROLE</span>
                    <span className="text-white uppercase font-bold">{app.role || 'Unspecified'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">AGE METRICS</span>
                    <span className="text-white font-bold">{app.age || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">AVAILABILITY</span>
                    <span className="text-white uppercase font-bold">{app.availability || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">TRANSMISSION DATE</span>
                    <span className="text-white font-bold">{app.created_at ? new Date(app.created_at).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                {/* Matrix inputs & Experience Details */}
                <div className="space-y-3 mb-6">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Applicant Skill Matrices</span>
                    <p className="text-xs text-gray-300 italic font-mono bg-black/35 p-3 rounded border border-white/5 leading-relaxed">
                      "{app.skills || 'Empty records received.'}"
                    </p>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">Logs & Direct Experience</span>
                    <p className="text-xs text-gray-300 italic font-mono bg-black/35 p-3 rounded border border-white/5 leading-relaxed">
                      "{app.experience || 'No experience payload attached.'}"
                    </p>
                  </div>
                </div>

                {/* Role Promotion decision & Submit row */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/5 bg-red-950/5 p-4 rounded-xl border border-red-500/10">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <label htmlFor={`role-select-${app.id}`} className="text-[9px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      [ASSIGN SYSTEM ROLE]:
                    </label>
                    <select
                      id={`role-select-${app.id}`}
                      value={currentSelected}
                      onChange={(e) => handleRoleChange(app.id, e.target.value)}
                      className="bg-black border border-white/10 rounded px-2.5 py-1.5 text-xs text-white uppercase tracking-wider font-mono outline-none focus:border-red-600 transition-colors cursor-pointer"
                    >
                      {ROLES_POOL.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    disabled={submittingId === app.id}
                    onClick={() => handleApprove(app)}
                    className="w-full sm:w-auto px-5 py-2 hover:shadow-[0_0_15px_rgba(239,68,68,0.35)] rounded-lg text-white bg-red-600 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-red-700 hover:scale-[1.02] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {submittingId === app.id ? (
                      <span className="animate-pulse">Broadcasting Role...</span>
                    ) : (
                      <>
                        <CheckCircle2 size={12} />
                        Clear & Approve Node
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
