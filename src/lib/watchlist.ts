export interface WatchlistItem {
  animeId: string;
  title: string;
  imageUrl: string;
  addedAt: string;
  watchedEpisodes: number[];
  episodeNotes: { [episodeNumber: number]: string };
}

const LOCAL_STORAGE_KEY = 'nexus_anime_watchlist_v1';

export function getWatchlist(): WatchlistItem[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to parse watchlist data', e);
    return [];
  }
}

export function saveWatchlist(list: WatchlistItem[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    // Trigger custom window event to sync across multiple modules instantly
    window.dispatchEvent(new Event('nexus-watchlist-updated'));
  } catch (e) {
    console.error('Failed to save watchlist data', e);
  }
}

export function addToWatchlist(animeId: string, title: string, imageUrl: string): void {
  const list = getWatchlist();
  if (list.some(item => item.animeId === animeId)) return;

  list.push({
    animeId,
    title,
    imageUrl,
    addedAt: new Date().toISOString(),
    watchedEpisodes: [],
    episodeNotes: {}
  });
  saveWatchlist(list);
}

export function removeFromWatchlist(animeId: string): void {
  const list = getWatchlist();
  const filtered = list.filter(item => item.animeId !== animeId);
  saveWatchlist(filtered);
}

export function isInWatchlist(animeId: string): boolean {
  return getWatchlist().some(item => item.animeId === animeId);
}

export function toggleEpisodeWatched(animeId: string, episodeNumber: number): boolean {
  const list = getWatchlist();
  const index = list.findIndex(item => item.animeId === animeId);
  if (index === -1) return false;

  const item = list[index];
  const epIndex = item.watchedEpisodes.indexOf(episodeNumber);
  let isNewWatched = false;

  if (epIndex > -1) {
    item.watchedEpisodes.splice(epIndex, 1);
  } else {
    item.watchedEpisodes.push(episodeNumber);
    isNewWatched = true;
  }

  list[index] = item;
  saveWatchlist(list);
  return isNewWatched;
}

export function isEpisodeWatched(animeId: string, episodeNumber: number): boolean {
  const item = getWatchlist().find(item => item.animeId === animeId);
  return item ? item.watchedEpisodes.includes(episodeNumber) : false;
}

export function saveEpisodeNote(animeId: string, episodeNumber: number, note: string): void {
  const list = getWatchlist();
  const index = list.findIndex(item => item.animeId === animeId);
  if (index === -1) return;

  const item = list[index];
  if (!item.episodeNotes) {
    item.episodeNotes = {};
  }
  item.episodeNotes[episodeNumber] = note;
  list[index] = item;
  saveWatchlist(list);
}

export function getEpisodeNote(animeId: string, episodeNumber: number): string {
  const item = getWatchlist().find(item => item.animeId === animeId);
  return item && item.episodeNotes ? item.episodeNotes[episodeNumber] || '' : '';
}
