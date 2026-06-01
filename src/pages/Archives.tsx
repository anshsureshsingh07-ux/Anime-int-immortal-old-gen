import { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Library, FileText, Calendar, Filter, Award, Sparkles, FolderOpen } from 'lucide-react';

const ARCHIVE_DATA = [
  { id: 1, title: 'Neon Genesis Evangelion', year: 1995, episodes: 26, rating: '9.0', category: 'Mecha / Psychological', description: 'A futuristic anime series about a teenage boy who is recruited by his father to pilot a giant bio-machine called an Evangelion to fight alien organisms called Angels.', entriesCount: 124, status: 'Archived SEC-A' },
  { id: 2, title: 'Code Geass: Lelouch of the Rebellion', year: 2006, episodes: 50, rating: '8.9', category: 'Sci-Fi / Political Thriller', description: 'Lelouch Lamperouge, an exiled prince, gains the power of absolute obedience and leads a rebellion against the all-powerful Holy Britannian Empire.', entriesCount: 231, status: 'Archived SEC-👑' },
  { id: 3, title: 'Attack on Titan', year: 2013, episodes: 87, rating: '9.1', category: 'Action / Dark Fantasy', description: 'Humans live inside cities surrounded by enormous walls due to the Titans, gigantic humanoid beings who devour humans seemingly without reason.', entriesCount: 452, status: 'Archived SEC-C' },
  { id: 4, title: 'Fullmetal Alchemist: Brotherhood', year: 2009, episodes: 64, rating: '9.2', category: 'Adventure / Fantasy', description: 'Two brothers search for the Philosopher\'s Stone after an attempt to revive their deceased mother goes horribly wrong.', entriesCount: 310, status: 'Archived SEC-B' },
  { id: 5, title: 'Steins;Gate', year: 2011, episodes: 24, rating: '9.1', category: 'Sci-Fi / Thriller', description: 'A self-proclaimed mad scientist invents a device that can send text messages to the past, altering the flow of time and triggering terrifying consequences.', entriesCount: 198, status: 'Archived SEC-⚡' },
  { id: 6, title: 'Cyberpunk: Edgerunners', year: 2022, episodes: 10, rating: '8.6', category: 'Sci-Fi / Cyberpunk', description: 'A street kid trying to survive in a technology and body modification-obsessed city of the future. Having everything to lose, he chooses to stay alive by becoming an edgerunner.', entriesCount: 154, status: 'Archived SEC-N' }
];

export default function Archives() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const categories = ['All', 'Sci-Fi', 'Psychological', 'Fantasy', 'Action', 'Thriller'];

  const filteredData = ARCHIVE_DATA.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category.includes(categoryFilter);
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-gray-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3">
            <Library size={28} className="text-crimson shrink-0" />
            Vanguard <span className="text-crimson">Archives</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Deep-data repository of secure & finalized anime master nodes
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
          SEC_CORE: ACTIVE
        </div>
      </div>

      {/* Grid Layout of controls & data */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Filter and search sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="plexiglass p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/5 pb-2 flex items-center gap-2">
              <Filter size={12} className="text-crimson" /> Data Search Controller
            </h3>

            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Query nodes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-10 text-xs font-mono text-white focus:outline-none focus:border-crimson transition-all"
              />
              <Search className="absolute left-3.5 top-3.5 text-zinc-500" size={14} />
            </div>

            {/* Filter tags (Visual) */}
            <div className="flex flex-col gap-1.5 mt-2">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black">Segment Filters</span>
              <div className="flex flex-wrap gap-1.5">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider transition-all ${
                      categoryFilter === cat 
                        ? 'bg-crimson/25 border border-crimson text-white shadow-[0_0_10px_rgba(229,9,20,0.2)]'
                        : 'bg-black/40 border border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="bg-[#09060c] border border-white/5 p-5 rounded-2xl flex flex-col gap-3">
            <h4 className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-500">Node Synchronization</h4>
            <div className="flex justify-between items-center font-mono text-xs border-b border-white/5 pb-2">
              <span>Total Entries:</span>
              <span className="font-black text-white">{ARCHIVE_DATA.length} Completed</span>
            </div>
            <div className="flex justify-between items-center font-mono text-xs border-b border-white/5 pb-2">
              <span>Encrypted Packets:</span>
              <span className="font-black text-emerald-400">99.8% Perfect</span>
            </div>
            <div className="flex justify-between items-center font-mono text-xs pb-1">
              <span>Access Clearance:</span>
              <span className="font-black text-[#00BFFF]">Vanguard Alpha</span>
            </div>
          </div>
        </div>

        {/* Archives Feed */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredData.map(item => (
              <motion.div
                key={item.id}
                layoutId={`card-${item.id}`}
                onClick={() => setSelectedItem(item)}
                className="neural-glass p-5 rounded-2xl hover-pulse cursor-pointer border border-white/5 relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 h-10 w-10 bg-crimson/5 rounded-bl-full flex items-end justify-end p-2 transition-all duration-300 group-hover:bg-crimson/20" />
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[8px] font-mono font-black uppercase tracking-widest bg-black/60 border border-crimson/30 px-2 py-0.5 rounded text-crimson">
                    {item.status}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase">
                    {item.year}
                  </span>
                </div>
                <h3 className="text-sm font-sans font-black text-white uppercase tracking-tight mb-2 group-hover:text-crimson transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed font-sans mb-4">
                  {item.description}
                </p>
                <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-auto font-mono text-[9px] text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <FolderOpen size={10} className="text-crimson" /> {item.episodes} EPISODES
                  </span>
                  <span className="flex items-center gap-1.5 text-yellow-400">
                    <Award size={10} className="text-yellow-400" /> {item.rating} SCORE
                  </span>
                </div>
              </motion.div>
            ))}

            {filteredData.length === 0 && (
              <div className="col-span-2 text-center py-12 bg-black/20 border border-white/5 rounded-2xl">
                <p className="font-mono text-xs text-zinc-500 uppercase tracking-widest">No nodes match search query</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Modal Overlay */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="plexiglass max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-crimson/30 shadow-[0_0_50px_rgba(229,9,20,0.25)] relative"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <span className="text-[9px] font-mono font-black text-crimson tracking-widest uppercase">
                DETAILED LOG ENTRY // {selectedItem.status}
              </span>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="text-zinc-500 hover:text-white font-mono text-[9px] uppercase tracking-widest bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded"
              >
                Close (ESC)
              </button>
            </div>

            <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2 font-sans text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-crimson">
              {selectedItem.title}
            </h2>

            <div className="flex flex-wrap gap-2.5 mb-4">
              <span className="text-[9px] font-mono bg-black/60 px-2.5 py-1 rounded border border-white/5 text-zinc-400">
                RELEASE YEAR: {selectedItem.year}
              </span>
              <span className="text-[9px] font-mono bg-black/60 px-2.5 py-1 rounded border border-white/5 text-zinc-400">
                EPISODES: {selectedItem.episodes}
              </span>
              <span className="text-[9px] font-mono bg-black/60 px-2.5 py-1 rounded border border-white/5 text-yellow-400 font-black">
                SCORE: {selectedItem.rating}
              </span>
              <span className="text-[9px] font-mono bg-black/60 px-2.5 py-1 rounded border border-crimson/25 text-crimson font-black">
                {selectedItem.category}
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed font-sans mb-6 bg-black/40 p-4 rounded-xl border border-white/5">
              {selectedItem.description}
            </p>

            <div className="flex justify-between items-center bg-black/20 p-3 rounded-lg border border-white/5 font-mono text-[9px] text-zinc-500">
              <span>ENTRIES_SAMPLED // {selectedItem.entriesCount}</span>
              <span className="text-emerald-400 uppercase">SYNCHRONIZED_OK</span>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
