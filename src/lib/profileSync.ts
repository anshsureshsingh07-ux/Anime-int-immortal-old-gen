import { supabase } from './supabase';

export interface EnhancedProfile {
  id: string;
  username: string;
  email: string | null;
  avatar_url: string | null;
  profile_photo_url: string | null;
  role: string;
  xp: number;
  level: number;
  is_premium: boolean;
  premium_tier?: 'none' | 'plus' | 'god' | 'monarch';
  tier?: 'premium' | 'none';
  created_at: string;
  is_verified?: boolean;
}

const LOCAL_PROFILE_KEY_PREFIX = 'nexus_user_profile_ext_';

// Calculate level based on XP milestone (100 XP per level)
export function calculateLevel(xp: number, email?: string | null): number {
  if (email === 'anshsureshsingh07@gmail.com') return 9999;
  return Math.max(1, Math.floor(xp / 100) + 1);
}

// Safely merge Supabase database response with Local Storage fallback
export function getStoredProfileExt(userId: string): { xp: number; level: number; is_premium: boolean; premium_tier: 'none' | 'plus' | 'god' | 'monarch' } {
  try {
    const dataStr = localStorage.getItem(`${LOCAL_PROFILE_KEY_PREFIX}${userId}`);
    if (dataStr) {
      const parsed = JSON.parse(dataStr);
      return {
        xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
        level: typeof parsed.level === 'number' ? parsed.level : 1,
        is_premium: !!parsed.is_premium,
        premium_tier: parsed.premium_tier || 'none'
      };
    }
  } catch (err) {
    console.error('Failed to read local profile extension:', err);
  }
  return { xp: 0, level: 1, is_premium: false, premium_tier: 'none' };
}

export function saveStoredProfileExt(userId: string, data: { xp: number; level: number; is_premium: boolean; premium_tier: 'none' | 'plus' | 'god' | 'monarch' }) {
  try {
    localStorage.setItem(`${LOCAL_PROFILE_KEY_PREFIX}${userId}`, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to write local profile extension:', err);
  }
}

// Global hook to enrich and sync user profiles gracefully
export async function syncAndEnrichProfile(rawDbProfile: any, userId: string): Promise<EnhancedProfile> {
  const localData = getStoredProfileExt(userId);
  
  // Use database values if present, otherwise merge/fallback to localData
  let xp = typeof rawDbProfile?.xp === 'number' ? rawDbProfile.xp : localData.xp;
  
  // SECURE CHECK: We only trust is_premium if it comes directly from database, unless it is a local offline fallback
  let is_premium = false;
  let premium_tier: 'none' | 'plus' | 'god' | 'monarch' = 'none';

  if (rawDbProfile) {
    is_premium = !!rawDbProfile.is_premium;
    premium_tier = rawDbProfile.premium_tier || (is_premium ? 'monarch' : 'none');
  } else {
    is_premium = localData.is_premium;
    premium_tier = localData.premium_tier;
  }

  const email = rawDbProfile?.email || null;
  
  // Dynamic Superuser overrides for local/session email matching
  if (email === 'anshsureshsingh07@gmail.com') {
    xp = 10000000;
    is_premium = true;
    premium_tier = 'monarch';
  }

  const level = calculateLevel(xp, email);
  const tier = is_premium ? 'premium' : 'none';

  // Sync back to local storage for persistent UI responsiveness
  saveStoredProfileExt(userId, { xp, level, is_premium, premium_tier });

  // Try updating the DB as a background or fire-and-forget sync
  try {
    await supabase
      .from('profiles')
      .update({
        xp,
        level,
        is_premium,
        premium_tier
      })
      .eq('id', userId);
  } catch (dbErr) {
    console.warn('Silent notice: Supabase columns sync fallback active:', dbErr);
  }

  return {
    id: userId,
    username: email === 'anshsureshsingh07@gmail.com' ? 'Ansh_Suresh_Singh' : (rawDbProfile?.username || rawDbProfile?.email?.split('@')[0] || 'Vanguard Agent'),
    email,
    avatar_url: rawDbProfile?.profile_photo_url || rawDbProfile?.avatar_url || null,
    profile_photo_url: rawDbProfile?.profile_photo_url || rawDbProfile?.avatar_url || null,
    role: rawDbProfile?.role || (email === 'anshsureshsingh07@gmail.com' ? 'admin' : 'member'),
    xp,
    level,
    is_premium,
    premium_tier,
    tier,
    created_at: rawDbProfile?.created_at || new Date().toISOString(),
    is_verified: rawDbProfile?.is_verified || email === 'anshsureshsingh07@gmail.com' || email === 'animeintofficial@gmail.com' || false
  };
}

// Award XP helper which handles appropriate Premium Boost multipliers
export async function awardXP(userId: string, amount: number): Promise<EnhancedProfile | null> {
  try {
    // Fetch profile first
    const { data: rawDbProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const current = getStoredProfileExt(userId);
    
    // Check is_premium & boost multipliers
    const email = rawDbProfile?.email || null;
    let premiumTier = rawDbProfile?.premium_tier || current.premium_tier || 'none';
    if (email === 'anshsureshsingh07@gmail.com') {
      premiumTier = 'monarch';
    }

    let multiplier = 1;
    if (premiumTier === 'plus') multiplier = 1.25;
    else if (premiumTier === 'god') multiplier = 1.5;
    else if (premiumTier === 'monarch') multiplier = 2;

    const finalAmount = Math.round(amount * multiplier);

    let currentXP = typeof rawDbProfile?.xp === 'number' ? rawDbProfile.xp : current.xp;
    if (email === 'anshsureshsingh07@gmail.com') {
      currentXP = 10000000;
    }

    const newXP = currentXP + finalAmount;
    const newLevel = calculateLevel(newXP, email);
    const isPremium = premiumTier !== 'none';

    // Write back
    saveStoredProfileExt(userId, { xp: newXP, level: newLevel, is_premium: isPremium, premium_tier: premiumTier });
    
    const enriched = await syncAndEnrichProfile(
      { ...rawDbProfile, xp: newXP, level: newLevel, is_premium: isPremium, premium_tier: premiumTier }, 
      userId
    );

    // Alert apps about profile update
    window.dispatchEvent(new Event('profiles-updated'));
    return enriched;
  } catch (err) {
    console.error('awardXP error:', err);
    return null;
  }
}

// Upgrade user to designated subscription tier (returns updated profile info)
export async function upgradeToPremium(userId: string, tier: 'none' | 'plus' | 'god' | 'monarch' = 'monarch'): Promise<EnhancedProfile | null> {
  try {
    const { data: rawDbProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const current = getStoredProfileExt(userId);

    const email = rawDbProfile?.email || null;
    let additionalXP = 500;
    if (tier === 'plus') additionalXP = 150;
    else if (tier === 'god') additionalXP = 300;
    else if (tier === 'monarch') additionalXP = 1000;

    let currentXP = typeof rawDbProfile?.xp === 'number' ? rawDbProfile.xp : current.xp;
    if (email === 'anshsureshsingh07@gmail.com') {
      currentXP = 10000000;
    }

    const newXP = currentXP + additionalXP;
    const newLevel = calculateLevel(newXP, email);
    const isPremium = tier !== 'none';

    saveStoredProfileExt(userId, { xp: newXP, level: newLevel, is_premium: isPremium, premium_tier: tier });

    const enriched = await syncAndEnrichProfile(
      { ...rawDbProfile, xp: newXP, level: newLevel, is_premium: isPremium, premium_tier: tier }, 
      userId
    );

    window.dispatchEvent(new Event('profiles-updated'));
    return enriched;
  } catch (err) {
    console.error('upgradeToPremium error:', err);
    return null;
  }
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  username: string;
  xp: number;
  level: number;
  is_premium: boolean;
  premium_tier?: 'none' | 'plus' | 'god' | 'monarch';
  role: string;
  avatar_url: string;
  country: string;
  is_verified?: boolean;
}

export async function fetchLeaderboard(currentUserId?: string, currentProfile?: EnhancedProfile | null): Promise<LeaderboardUser[]> {
  // Static high-performing community legends
  const staticAgents: Omit<LeaderboardUser, 'rank'>[] = [
    { id: 'l1', username: 'Shadow_Commander', xp: 5820, level: 59, is_premium: true, premium_tier: 'monarch', role: 'admin', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shadow', country: 'JP', is_verified: true },
    { id: 'l3', username: 'Asuka_Reroll', xp: 2120, level: 22, is_premium: false, premium_tier: 'none', role: 'moderator', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Asuka', country: 'DE', is_verified: true },
    { id: 'l4', username: 'Goku_Enthusiast', xp: 1980, level: 20, is_premium: true, premium_tier: 'plus', role: 'member', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Goku', country: 'US', is_verified: false },
    { id: 'l5', username: 'Neon_Seiyuu', xp: 1450, level: 15, is_premium: false, premium_tier: 'none', role: 'news_writer', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neon', country: 'FR', is_verified: false },
    { id: 'l6', username: 'Chibi_Slayer', xp: 1120, level: 12, is_premium: false, premium_tier: 'none', role: 'member', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chibi', country: 'IN', is_verified: false },
    { id: 'l7', username: 'Vanguard_Ranger', xp: 840, level: 9, is_premium: true, premium_tier: 'plus', role: 'member', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ranger', country: 'BR', is_verified: false },
  ];

  // Try retrieving list of real users from profile table if accessible and merge
  let mergedList = [...staticAgents];

  try {
    const { data: dbProfiles } = await supabase.from('profiles').select('*').limit(50);
    if (dbProfiles) {
      dbProfiles.forEach((p: any) => {
        // Skip current user if passed separately, we will append or update it
        if (p.id === currentUserId) return;
        
        // Skip user representations we override
        if (p.email === 'anshsureshsingh07@gmail.com' || p.email === 'animeintofficial@gmail.com') return;

        const extData = getStoredProfileExt(p.id);
        const xp = typeof p.xp === 'number' ? p.xp : extData.xp;
        const level = calculateLevel(xp, p.email);
        const isPremium = typeof p.is_premium === 'boolean' ? p.is_premium : extData.is_premium;
        const premiumTier = p.premium_tier || extData.premium_tier || (isPremium ? 'monarch' : 'none');

        mergedList.push({
          id: p.id,
          username: p.username || p.email?.split('@')[0] || 'Agent Node',
          xp,
          level,
          is_premium: isPremium,
          premium_tier: premiumTier,
          role: p.role || 'member',
          avatar_url: p.profile_photo_url || p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`,
          country: 'GLOBAL',
          is_verified: p.is_verified || false
        });
      });
    }
  } catch (err) {
    console.warn('Leaderboard SQL merge notice (falling back to cached assets):', err);
  }

  // Include current active user with latest data
  if (currentUserId && currentProfile) {
    // Remove if there's an existing copy
    mergedList = mergedList.filter(u => u.id !== currentUserId);
    mergedList.push({
      id: currentUserId,
      username: currentProfile.username || 'You',
      xp: currentProfile.xp,
      level: currentProfile.level,
      is_premium: currentProfile.is_premium,
      premium_tier: currentProfile.premium_tier,
      role: currentProfile.role,
      avatar_url: currentProfile.profile_photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUserId}`,
      country: 'LOCAL',
      is_verified: currentProfile.is_verified
    });
  } else {
    // Also include a hardcode representation for anshsureshsingh07 to jump to Rank #1 if not logged in or active
    mergedList = mergedList.filter(u => u.username !== 'Ansh_Suresh_Singh' && u.id !== 'l2');
    mergedList.push({
      id: 'anshsureshsingh07',
      username: 'Ansh_Suresh_Singh',
      xp: 10000000,
      level: 9999,
      is_premium: true,
      premium_tier: 'monarch',
      role: 'admin',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ansh',
      country: 'IN',
      is_verified: true
    });
  }

  // Double check that anshsureshsingh07 is correct level/xp in list
  mergedList = mergedList.map(u => {
    if (u.username === 'Ansh_Suresh_Singh' || u.id === 'anshsureshsingh07') {
      return {
        ...u,
        xp: 10000000,
        level: 9999,
        is_premium: true,
        premium_tier: 'monarch' as const,
        role: 'admin',
        is_verified: true
      };
    }
    return u;
  });

  // Sort by XP descending
  const sorted = mergedList.sort((a, b) => b.xp - a.xp);

  // Map indexes/ranks
  return sorted.map((user, idx) => ({
    ...user,
    rank: idx + 1
  }));
}
