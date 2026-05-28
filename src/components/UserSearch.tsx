import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Search, UserPlus, Users, MessageSquareCode, Check, Loader2 } from 'lucide-react';
import { VerifiedBadge } from './VerifiedBadge';

interface Profile {
  id: string;
  username: string;
  email?: string;
  avatar_url?: string;
  profile_photo_url?: string;
  role?: string;
  is_verified?: boolean;
}

interface UserSearchProps {
  currentUserId: string;
  onStartDirectChat: (targetUser: Profile) => void;
  onStartGroupChat: (selectedUsers: Profile[], groupTitle: string) => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({
  currentUserId,
  onStartDirectChat,
  onStartGroupChat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([]);
  const [groupName, setGroupName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Search profiles matching username from database
  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', `%${searchTerm}%`)
          .neq('id', currentUserId)
          .limit(10);

        if (error) throw error;
        setResults(data || []);
      } catch (err: any) {
        console.error('Search match error:', err);
        setErrorMessage('Failed to search mainframe records.');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentUserId]);

  const handleToggleSelectUser = (user: Profile) => {
    if (selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };

  const handleCreateGroup = () => {
    if (selectedUsers.length === 0) {
      setErrorMessage('Select at least one operator.');
      return;
    }
    const finalGroupName = groupName.trim() || `Sector Group ${Date.now().toString().slice(-4)}`;
    onStartGroupChat(selectedUsers, finalGroupName);
    
    // Reset state
    setSelectedUsers([]);
    setGroupName('');
    setSearchTerm('');
    setIsGroupMode(false);
  };

  return (
    <div id="user-search-component" className="space-y-4">
      {/* Header switches */}
      <div className="flex items-center justify-between bg-black/40 p-1 border border-white/5 rounded-lg">
        <button
          type="button"
          onClick={() => {
            setIsGroupMode(false);
            setSelectedUsers([]);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all ${
            !isGroupMode ? 'bg-[#E50914] text-white font-extrabold shadow-[0_0_10px_rgba(229,9,20,0.3)]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <MessageSquareCode size={12} /> Direct COMMS
        </button>
        <button
          type="button"
          onClick={() => setIsGroupMode(true)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-md transition-all ${
            isGroupMode ? 'bg-[#E50914] text-white font-extrabold shadow-[0_0_10px_rgba(229,9,20,0.3)]' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Users size={12} /> Group Sector
        </button>
      </div>

      {/* Input query field */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
          <Search size={14} className="animate-pulse" />
        </span>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={isGroupMode ? "Query profile directory..." : "Establish neural link..."}
          className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-xs font-mono text-white outline-none focus:border-[#E50914]/80 transition-all focus:shadow-[0_0_15px_rgba(229,9,20,0.1)]"
        />
        {loading && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Loader2 size={12} className="animate-spin text-red-500" />
          </span>
        )}
      </div>

      {errorMessage && (
        <div className="p-2.5 text-[10px] font-mono bg-red-500/10 border border-red-500/20 rounded-md text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Group Info panel if enabled */}
      {isGroupMode && (
        <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 space-y-3">
          <label htmlFor="group-name-input" className="text-[9px] font-black uppercase text-gray-500 tracking-wider">
            Sector Identifier (Group Name)
          </label>
          <input
            id="group-name-input"
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="ALPHA SECTOR COMMS / TEAM-GFL"
            className="w-full bg-[#0d0d0f] border border-white/10 rounded-lg p-2 text-xs font-mono text-white outline-none focus:border-[#E50914]/60"
          />

          {selectedUsers.length > 0 && (
            <div>
              <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider block mb-1.5">
                Staged Operators ({selectedUsers.length})
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {selectedUsers.map(user => (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => handleToggleSelectUser(user)}
                    className="flex items-center gap-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 rounded px-2 py-0.5 text-[9px] font-mono text-red-300 transition-colors"
                  >
                    <span>{user.username}</span>
                    <span className="text-red-500 hover:text-white font-bold">&times;</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleCreateGroup}
            disabled={selectedUsers.length === 0}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-green-600 hover:text-white transition-all disabled:opacity-40"
          >
            <UserPlus size={12} /> Construct Group Sector
          </button>
        </div>
      )}

      {/* Search Result lists */}
      {results.length > 0 && (
        <div ref={dropdownRef} className="border border-white/10 bg-black/90 rounded-xl divide-y divide-white/5 overflow-hidden shadow-2xl">
          {results.map((user) => {
            const isSelected = selectedUsers.some(u => u.id === user.id);
            return (
              <div
                key={user.id}
                onClick={() => {
                  if (isGroupMode) {
                    handleToggleSelectUser(user);
                  } else {
                    onStartDirectChat(user);
                    setSearchTerm('');
                  }
                }}
                className="flex items-center justify-between p-3.5 hover:bg-white/5 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-white/10 bg-gradient-to-tr from-gray-900 to-black overflow-hidden flex items-center justify-center text-xs font-mono text-gray-300">
                    {user.avatar_url || user.profile_photo_url ? (
                      <img
                        src={user.avatar_url || user.profile_photo_url}
                        alt={user.username}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      user.username.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-white">
                      <span>{user.username}</span>
                      <VerifiedBadge isVerified={user.is_verified} size={8} />
                    </div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase">{user.role || 'Operator'}</span>
                  </div>
                </div>

                {isGroupMode && (
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    isSelected ? 'bg-green-600 border-green-500 text-white' : 'border-white/20'
                  }`}>
                    {isSelected && <Check size={10} strokeWidth={3} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {searchTerm.trim() && !loading && results.length === 0 && (
        <div className="p-4 text-center font-mono text-[10px] text-gray-500 uppercase">
          No operators found under that handle.
        </div>
      )}
    </div>
  );
};
