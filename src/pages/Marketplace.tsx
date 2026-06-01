import { useState } from 'react';
import { motion } from 'motion/react';
import { ShoppingBag, Coins, Filter, Award, Sparkles, Plus, Check, ArrowRight } from 'lucide-react';

const MARKET_ITEMS = [
  { id: 1, name: 'Nichirin Crimson Blade', price: 150, category: 'Weapons', rarity: 'Legendary', power: '+120 Attack', description: 'A solar-active metal katana designed specifically for slicing demon constructs in cyberspace.', count: 4, emoji: '⚔️' },
  { id: 2, name: 'Behenit Red Crimson Stone', price: 400, category: 'Amulets', rarity: 'Ascendant', power: '+500 Faction Influence', description: 'A mysterious stone talisman with eyes and mouth arranged layout. Belongs strictly to higher dimensional modules.', count: 1, emoji: '🩸' },
  { id: 3, name: 'Omni-Directional Mobility Gear', price: 95, category: 'Wares', rarity: 'Rare', power: '+85 Agility', description: 'Sophisticated dual gas-powered wire systems designed for fast scaling of skyscraper terminals.', count: 12, emoji: '⚙️' },
  { id: 4, name: 'Amaterasu Black Fire Core', price: 250, category: 'Cores', rarity: 'Legendary', power: '+300 Burn Matrix', description: 'Unquenchable black fire engine that incinerates digital components forever.', count: 2, emoji: '🔥' },
  { id: 5, name: 'Gunjou Blue Dragon Seal', price: 80, category: 'Amulets', rarity: 'Common', power: '+35 Fortitude', description: 'Small sapphire crest which buffers cyber interference. Standard issue for newly recruited nodes.', count: 43, emoji: '🐉' },
  { id: 6, name: 'Hokuto Divine Fist Tape', price: 110, category: 'Weapons', rarity: 'Rare', power: '+95 Close Combat', description: 'Reinforced hand dressings designed to channel raw kinetic terminal shockwaves.', count: 8, emoji: '🥊' }
];

export default function Marketplace() {
  const [balance, setBalance] = useState(1200); // Virtual Otaku Coin Balance
  const [cartCount, setCartCount] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState<number[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const categories = ['All', 'Weapons', 'Amulets', 'Wares', 'Cores'];

  const handlePurchase = (id: number, price: number) => {
    if (localStorage.getItem('vanguard_guest_session') === 'true') {
      alert('WRITE ACTIONS RESERVED FOR AUTHENTICATED CHANNELS. GUEST_NODE ACCESS IS READ-ONLY.');
      return;
    }
    if (balance >= price) {
      setBalance(prev => prev - price);
      setPurchasedItems(prev => [...prev, id]);
      setCartCount(prev => prev + 1);
    } else {
      alert('INSUFFICIENT VIRTUAL BALANCE. Complete bounties or write news articles to farm coins!');
    }
  };

  const filteredItems = MARKET_ITEMS.filter(item => {
    return categoryFilter === 'All' || item.category === categoryFilter;
  });

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-gray-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3">
            <ShoppingBag size={28} className="text-crimson shrink-0" />
            Otaku <span className="text-crimson">Marketplace</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Trade virtual treasury assets and premium faction weaponry
          </p>
        </div>
        
        {/* Dynamic Balance Display */}
        <div className="flex items-center gap-4 bg-[#0d0910] border border-crimson/25 px-4 py-2 rounded-2xl">
          <div className="flex items-center gap-2 font-mono">
            <Coins size={14} className="text-yellow-400 animate-pulse" />
            <span className="text-xs text-zinc-400 uppercase mr-1">VIRTUAL BAL:</span>
            <span className="text-sm font-black text-white">{balance} OC</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <span className="text-[9px] font-mono text-crimson font-black uppercase tracking-widest bg-crimson/10 px-2 py-0.5 rounded">
            {cartCount} PURCHASED
          </span>
        </div>
      </div>

      {/* Categories & Items Grid */}
      <div className="flex flex-col gap-6">
        
        {/* Category Filters bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition-all shrink-0 ${
                categoryFilter === cat
                  ? 'bg-crimson border border-crimson text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]'
                  : 'bg-black/40 border border-white/5 text-gray-400 hover:text-white hover:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map(item => {
            const hasPurchased = purchasedItems.includes(item.id);
            const isLegendary = item.rarity === 'Legendary' || item.rarity === 'Ascendant';

            return (
              <div 
                key={item.id}
                className={`neural-glass rounded-3xl p-5 border relative overflow-hidden flex flex-col justify-between hover-pulse transition-all duration-300 ${
                  isLegendary 
                    ? 'border-crimson/30 bg-gradient-to-br from-[#0e0205] to-[#04010a]' 
                    : 'border-white/5 bg-black/40'
                }`}
              >
                {/* Floating Tags */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                    isLegendary 
                      ? 'border-crimson/40 text-crimson bg-crimson/10' 
                      : 'border-white/10 text-zinc-400 bg-black/60'
                  }`}>
                    {item.rarity}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase">
                    MINTED S#{item.count}
                  </span>
                </div>

                {/* Main Asset Visual representation */}
                <div className="flex items-center gap-4 bg-black/40 border border-white/5 rounded-2xl p-4 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-3xl shadow-inner select-none shrink-0">
                    {item.emoji}
                  </div>
                  <div>
                    <h3 className="text-sm font-sans font-black text-white uppercase tracking-tight leading-tight">
                      {item.name}
                    </h3>
                    <span className="text-[9px] font-mono text-zinc-400 font-bold block mt-1">
                      {item.power}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-sans mb-5">
                  {item.description}
                </p>

                {/* Purchase Area */}
                <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
                  <div className="font-mono">
                    <span className="text-[7px] text-zinc-500 block uppercase font-bold">COST PRICE</span>
                    <span className="text-sm font-black text-yellow-500">{item.price} OC</span>
                  </div>

                  {hasPurchased ? (
                    <div className="flex items-center gap-1 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-[9px] font-mono font-black uppercase tracking-widest">
                      <Check size={11} /> Owned
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePurchase(item.id, item.price)}
                      disabled={balance < item.price}
                      className={`px-4 py-2 rounded-xl text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                        balance < item.price
                          ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                          : 'bg-crimson hover:bg-crimson/80 text-white border border-crimson hover:shadow-[0_0_12px_rgba(229,9,20,0.4)]'
                      }`}
                    >
                      <Plus size={10} /> Buy Item
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
