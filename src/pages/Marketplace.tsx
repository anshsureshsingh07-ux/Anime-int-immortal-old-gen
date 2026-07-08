import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, 
  Coins, 
  Filter, 
  Award, 
  Sparkles, 
  Plus, 
  Check, 
  ArrowRight, 
  LineChart as ChartIcon, 
  Terminal as TerminalIcon, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Briefcase, 
  Zap, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  CornerDownRight 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { playDigitalSound } from '../lib/sounds';

// Recharts for Holographic Trading visualizations
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

// Define the existing Item Marketplace data (Vanguard Gear)
const MARKET_ITEMS = [
  { id: 1, name: 'Nichirin Crimson Blade', price: 150, category: 'Weapons', rarity: 'Legendary', power: '+120 Attack', description: 'A solar-active metal katana designed specifically for slicing demon constructs in cyberspace.', count: 4, emoji: '⚔️' },
  { id: 2, name: 'Behenit Red Crimson Stone', price: 400, category: 'Amulets', rarity: 'Ascendant', power: '+500 Faction Influence', description: 'A mysterious stone talisman with eyes and mouth arranged layout. Belongs strictly to higher dimensional modules.', count: 1, emoji: '🩸' },
  { id: 3, name: 'Omni-Directional Mobility Gear', price: 95, category: 'Wares', rarity: 'Rare', power: '+85 Agility', description: 'Sophisticated dual gas-powered wire systems designed for fast scaling of skyscraper terminals.', count: 12, emoji: '⚙️' },
  { id: 4, name: 'Amaterasu Black Fire Core', price: 250, category: 'Cores', rarity: 'Legendary', power: '+300 Burn Matrix', description: 'Unquenchable black fire engine that incinerates digital components forever.', count: 2, emoji: '🔥' },
  { id: 5, name: 'Gunjou Blue Dragon Seal', price: 80, category: 'Amulets', rarity: 'Common', power: '+35 Fortitude', description: 'Small sapphire crest which buffers cyber interference. Standard issue for newly recruited nodes.', count: 43, emoji: '🐉' },
  { id: 6, name: 'Hokuto Divine Fist Tape', price: 110, category: 'Weapons', rarity: 'Rare', power: '+95 Close Combat', description: 'Reinforced hand dressings designed to channel raw kinetic terminal shockwaves.', count: 8, emoji: '🥊' }
];

// Define AIF Asset structure
interface AIF_Asset {
  symbol: string;
  name: string;
  category: 'Studio Shares' | 'Genre Indices' | 'Character Equity';
  basePrice: number;
  currentPrice: number;
  changePercent: number;
  keywords: string[];
}

// Initial Metadata for AIF Assets
const AIF_ASSETS_METADATA: AIF_Asset[] = [
  { symbol: 'MAPPA', name: 'MAPPA Co. Shares', category: 'Studio Shares', basePrice: 150, currentPrice: 150, changePercent: 0, keywords: ['MAPPA', 'Chainsaw Man', 'Jujutsu', 'Jujutsu Kaisen', 'Attack on Titan', 'Jigokuraku'] },
  { symbol: 'UFO', name: 'Ufotable Studio', category: 'Studio Shares', basePrice: 220, currentPrice: 220, changePercent: 0, keywords: ['Ufotable', 'Demon Slayer', 'Kimetsu', 'Fate', 'Kara no Kyoukai'] },
  { symbol: 'WIT', name: 'WIT Studio Bonds', category: 'Studio Shares', basePrice: 110, currentPrice: 110, changePercent: 0, keywords: ['WIT', 'Spy x Family', 'Anya', 'Vinland', 'Vinland Saga', 'Bubble'] },
  { symbol: 'KAN', name: 'KyoAni Sanctuary', category: 'Studio Shares', basePrice: 180, currentPrice: 180, changePercent: 0, keywords: ['Kyoto Animation', 'KyoAni', 'Violet Evergarden', 'Clannad', 'K-On'] },
  { symbol: 'ISK', name: 'Isekai Index Node', category: 'Genre Indices', basePrice: 95, currentPrice: 95, changePercent: 0, keywords: ['Isekai', 'Re:Zero', 'Slime', 'Overlord', 'Mushoku', 'Fantasy', 'In Another World'] },
  { symbol: 'RMC', name: 'RomCom Index Node', category: 'Genre Indices', basePrice: 85, currentPrice: 85, changePercent: 0, keywords: ['RomCom', 'Romantic', 'Comedy', 'Love', 'Kaguya', 'Oregairu', 'Horimiya', 'My Dress-Up'] },
  { symbol: 'SHN', name: 'Shonen Catalyst Index', category: 'Genre Indices', basePrice: 130, currentPrice: 130, changePercent: 0, keywords: ['Shonen', 'Bleach', 'Naruto', 'One Piece', 'Action', 'Hero', 'Hunter x Hunter'] },
  { symbol: 'GJO', name: 'Gojo Satoru Bonds', category: 'Character Equity', basePrice: 300, currentPrice: 300, changePercent: 0, keywords: ['Gojo', 'Gojo Satoru', 'Limitless', 'Six Eyes', 'Jujutsu'] },
  { symbol: 'ERN', name: 'Eren Yeager Corp', category: 'Character Equity', basePrice: 160, currentPrice: 160, changePercent: 0, keywords: ['Eren', 'Yeager', 'Rumbling', 'Titan', 'Freedom', 'Survey Corps'] },
  { symbol: 'MKM', name: 'Makima Margin Token', category: 'Character Equity', basePrice: 240, currentPrice: 240, changePercent: 0, keywords: ['Makima', 'Chainsaw', 'Control Demon', 'Public Safety', 'Chainsaw Man'] },
];

export default function Marketplace() {
  // Tabs: 'shop' (Virtual Otaku Gear Shop) and 'aif' (AIF Trading Terminal Core)
  const [activeTab, setActiveTab] = useState<'aif' | 'shop'>('aif');

  // --- VIRTUAL OTAKU GEAR STATE ---
  const [gearBalance, setGearBalance] = useState(() => {
    const saved = localStorage.getItem('vanguard_otaku_balance');
    return saved ? parseInt(saved, 10) : 1200;
  });
  const [cartCount, setCartCount] = useState(0);
  const [purchasedItems, setPurchasedItems] = useState<number[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');

  // --- AIF FINANCE SYSTEM STATE ---
  const [aifCredits, setAifCredits] = useState<number>(() => {
    const saved = localStorage.getItem('aif_credits');
    return saved ? parseFloat(saved) : 5000;
  });
  
  // Portfolio keeps tracking of Sym -> { qty: number, avgCost: number }
  const [portfolio, setPortfolio] = useState<Record<string, { qty: number; avgCost: number }>>(() => {
    const saved = localStorage.getItem('aif_portfolio');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse AIF portfolio:", e);
      }
    }
    // Default starting inventory - 0 of everything
    const empty: Record<string, { qty: number; avgCost: number }> = {};
    AIF_ASSETS_METADATA.forEach(a => {
      empty[a.symbol] = { qty: 0, avgCost: 0 };
    });
    return empty;
  });

  const [aifAssets, setAifAssets] = useState<AIF_Asset[]>(() => {
    // Attempt load cached prices or default values
    const cached = localStorage.getItem('aif_assets_current_v2');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error("Failed parsing caching:", e);
      }
    }
    return AIF_ASSETS_METADATA;
  });

  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>('MAPPA');
  const [priceHistories, setPriceHistories] = useState<Record<string, { name: string; open: number; high: number; low: number; close: number; price: number }[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Command Prompt (CLI shell text based buy/sell)
  const [commandInput, setCommandInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>(() => {
    return [
      "============================================================",
      "   AIF FINANCE MAINFRAME MARKET INTEGRATION NODE INITIALIZED",
      "============================================================",
      `SESSION SECURE VERIFIED RECORD AT: ${new Date().toISOString()}`,
      "Type [BUY <Symbol> <Quantity>] or [SELL <Symbol> <Quantity>] to route",
      "Example: BUY MAPPA 15  or  SELL UFO 8",
      "Ready for neural packet operations...",
      "------------------------------------------------------------"
    ];
  });

  const [userName, setUserName] = useState('ANSH_SINGH_ARCHITECT');

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Sync balances & portfolios to localStorage
  useEffect(() => {
    localStorage.setItem('vanguard_otaku_balance', gearBalance.toString());
  }, [gearBalance]);

  useEffect(() => {
    localStorage.setItem('aif_credits', aifCredits.toFixed(2));
  }, [aifCredits]);

  useEffect(() => {
    localStorage.setItem('aif_portfolio', JSON.stringify(portfolio));
  }, [portfolio]);

  useEffect(() => {
    localStorage.setItem('aif_assets_current_v2', JSON.stringify(aifAssets));
  }, [aifAssets]);

  // Fetch logged in session email if any for terminal trace authenticity
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        const pfx = session.user.email.split('@')[0].toUpperCase();
        setUserName(pfx);
      }
    });
  }, []);

  // Pre-generate historical price charts on mount
  useEffect(() => {
    const freshHistories: typeof priceHistories = {};
    AIF_ASSETS_METADATA.forEach(asset => {
      const histories = [];
      let baseVal = asset.basePrice;
      
      // Let's create mock drift
      for (let i = 0; i < 20; i++) {
        // slight drift upward
        const changePercent = (Math.random() * 0.05 - 0.022); 
        const open = Math.round(baseVal * 10) / 10;
        baseVal = baseVal * (1 + changePercent);
        const close = Math.round(baseVal * 10) / 10;
        const high = Math.round(Math.max(open, close) * (1 + Math.random() * 0.015) * 10) / 10;
        const low = Math.round(Math.min(open, close) * (1 - Math.random() * 0.015) * 10) / 10;
        
        const timestamp = new Date(Date.now() - (20 - i) * 8000).toLocaleTimeString([], { hour12: false });
        histories.push({
          name: timestamp,
          time: timestamp,
          open,
          high,
          low,
          close,
          price: close
        });
      }
      freshHistories[asset.symbol] = histories;
    });
    setPriceHistories(freshHistories);
  }, []);

  // Neural Volatility Engine logic loop
  useEffect(() => {
    const runVolatilityEngine = async () => {
      // 1. Fetch live news to calculate Trend Volume Match multiplier
      let newsText = "";
      try {
        const { data: newsItems } = await supabase.from('news').select('title, description').limit(15);
        if (newsItems) {
          newsText = newsItems.map(item => `${item.title} ${item.description}`).join(' ').toUpperCase();
        }
      } catch (err) {
        console.warn("AIF Volatility news scan offline fallback:", err);
      }

      // 2. Fetch live squads from localStorage to calculate Squad Sync Match multiplier
      let squadsList: any[] = [];
      try {
        const savedSquads = localStorage.getItem('nexus_squads');
        squadsList = savedSquads ? JSON.parse(savedSquads) : [];
      } catch (err) {
        console.warn("AIF Volatility squad scan offline fallback:", err);
      }

      setAifAssets(prevAssets => {
        const updated = prevAssets.map(asset => {
          // Trend Volume Match calculations
          let newsMatchCount = 0;
          asset.keywords.forEach(kw => {
            const regex = new RegExp(kw.toUpperCase(), 'g');
            const matches = newsText.match(regex);
            if (matches) {
              newsMatchCount += matches.length;
            }
          });
          const trendMultiplier = newsMatchCount * 0.025; // 2.5% increase per headline match

          // Squad Sync Activity Match calculations
          let squadMatchCount = 0;
          squadsList.forEach(sq => {
            const sqText = `${sq.name} ${sq.anime} ${sq.goal}`.toUpperCase();
            asset.keywords.forEach(kw => {
              if (sqText.includes(kw.toUpperCase())) {
                squadMatchCount++;
              }
            });
          });
          const squadMultiplier = squadMatchCount * 0.045; // 4.5% raised per watch sector unit activity

          const totalImpactMultiplier = 1.0 + trendMultiplier + squadMultiplier;
          const adjustedTargetPrice = asset.basePrice * totalImpactMultiplier;

          // Introduce a randomized volatile walk (fluctuates each tick around target by -1.2% to +1.2%)
          const tickWalk = 1.0 + (Math.random() * 0.024 - 0.012);
          const rawPrice = adjustedTargetPrice * tickWalk;
          const currentPrice = Math.max(8.0, Math.round(rawPrice * 10) / 10);
          
          // Calculate overall change compared to the original base price
          const priceChangePercent = ((currentPrice - asset.basePrice) / asset.basePrice) * 100;

          // Append price to history
          setPriceHistories(prevHist => {
            const currentHistory = prevHist[asset.symbol] || [];
            const timestamp = new Date().toLocaleTimeString([], { hour12: false });
            
            const lastClose = currentHistory.length > 0 ? currentHistory[currentHistory.length - 1].close : asset.basePrice;
            const open = lastClose;
            const close = currentPrice;
            const high = Math.round(Math.max(open, close) * (1 + Math.random() * 0.012) * 10) / 10;
            const low = Math.round(Math.min(open, close) * (1 - Math.random() * 0.012) * 10) / 10;

            const newPoint = {
              name: timestamp,
              time: timestamp,
              open,
              high,
              low,
              close,
              price: close
            };

            const updatedHistory = [...currentHistory, newPoint];
            if (updatedHistory.length > 25) {
              updatedHistory.shift();
            }
            return {
              ...prevHist,
              [asset.symbol]: updatedHistory
            };
          });

          return {
            ...asset,
            currentPrice,
            changePercent: Math.round(priceChangePercent * 100) / 100
          };
        });

        return updated;
      });
    };

    // Run once on load
    runVolatilityEngine();

    // Loop interval ticks every 10 seconds (snappy live experience)
    const interval = setInterval(runVolatilityEngine, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auto scroll terminal logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  // Gear Shop functionality (Virtual Otaku Coins)
  const categories = ['All', 'Weapons', 'Amulets', 'Wares', 'Cores'];

  const handlePurchaseGear = (id: number, price: number) => {
    if (localStorage.getItem('vanguard_guest_session') === 'true') {
      alert('WRITE ACTIONS RESERVED FOR AUTHENTICATED CHANNELS. GUEST_NODE ACCESS IS READ-ONLY.');
      return;
    }
    if (gearBalance >= price) {
      setGearBalance(prev => prev - price);
      setPurchasedItems(prev => [...prev, id]);
      setCartCount(prev => prev + 1);
      playDigitalSound('ping');
    } else {
      alert('INSUFFICIENT VIRTUAL BALANCE. Complete bounties or write news articles to farm Otaku Coins!');
    }
  };

  const filteredItems = MARKET_ITEMS.filter(item => {
    return categoryFilter === 'All' || item.category === categoryFilter;
  });

  // --- AIF TRADE COMMAND EXECUTION ENGINE (CMD PARSER) ---
  const handleExecuteCommand = (overrideCmd?: string) => {
    const rawCmd = (overrideCmd || commandInput).trim();
    if (!rawCmd) return;

    setCommandInput('');
    setTerminalLogs(prev => [...prev, `AIF_SHELL_v1.0.4> ${rawCmd}`]);

    // Format cleaner regex matching: brackets optional [BUY <ASSET> <QTY>]
    const buySellRegex = /^(?:\[)?\s*(BUY|SELL)\s+(\w+)\s+(\d+)\s*(?:\])?$/i;
    const match = rawCmd.match(buySellRegex);

    if (rawCmd.toLowerCase() === 'help') {
      setTerminalLogs(prev => [
        ...prev,
        "--- AVAILABLE COMMAND PROTOCOLS ---",
        "BUY <SYMBOL> <QUANTITY>  : Purchase shares using current AIF balance",
        "SELL <SYMBOL> <QUANTITY> : Liqudate shares into instant credits",
        "CLEAR                    : Clear output pipeline",
        "INFO <SYMBOL>            : Review current asset specification"
      ]);
      playDigitalSound('click');
      return;
    }

    if (rawCmd.toLowerCase() === 'clear') {
      setTerminalLogs([
        "AIF FINANCE COMMANDS CLEAR DONE.",
        "AIF_SHELL_v1.0.4 ready..."
      ]);
      playDigitalSound('click');
      return;
    }

    // Match individual info symbols
    const infoRegex = /^INFO\s+(\w+)/i;
    const infoMatch = rawCmd.match(infoRegex);
    if (infoMatch) {
      const sym = infoMatch[1].toUpperCase();
      const asset = aifAssets.find(a => a.symbol === sym);
      if (!asset) {
        setTerminalLogs(prev => [...prev, `[ERROR]: SYMBOL '${sym}' NOT CATALOGED IN MAINFRAME.`]);
        playDigitalSound('click');
        return;
      }
      setTerminalLogs(prev => [
        ...prev,
        `--- SECURITY INTEL REPORT: ${asset.symbol} ---`,
        `NAME: ${asset.name}`,
        `CATEGORY: ${asset.category}`,
        `BASE PAR VALUE: ${asset.basePrice} CR`,
        `NICK LIVE PRICE: ${asset.currentPrice} CR`,
        `COMPUTED TREND SKEW: ${asset.changePercent > 0 ? '+' : ''}${asset.changePercent}%`
      ]);
      playDigitalSound('whir');
      return;
    }

    if (!match) {
      setTerminalLogs(prev => [
        ...prev,
        `[COMMAND ERROR]: SYNTAX UNRECOGNIZED. Type 'help' for command syntax specs.`
      ]);
      playDigitalSound('click');
      return;
    }

    const action = match[1].toUpperCase();
    const symbol = match[2].toUpperCase();
    const qty = parseInt(match[3], 10);

    if (qty <= 0) {
      setTerminalLogs(prev => [...prev, "[ERROR]: QUANTITY SPECIFICATION MUST BE GREATER THAN ZERO."]);
      playDigitalSound('click');
      return;
    }

    const asset = aifAssets.find(a => a.symbol === symbol);
    if (!asset) {
      setTerminalLogs(prev => [...prev, `[ERROR]: TRANSACTION REJECTED. ASSET TYPE '${symbol}' NOT COMPATIBLE.`]);
      playDigitalSound('click');
      return;
    }

    const costPrice = asset.currentPrice;
    const totalTransactionCost = costPrice * qty;

    if (action === 'BUY') {
      if (aifCredits < totalTransactionCost) {
        setTerminalLogs(prev => [
          ...prev,
          `[TRANSACTION BLOCKED]: INSUFFICIENT LIQUID BALANCE. Required: ${totalTransactionCost.toFixed(2)} Credits. Available: ${aifCredits.toFixed(2)} Credits.`
        ]);
        playDigitalSound('click');
        return;
      }

      // Execute buy
      setAifCredits(prev => prev - totalTransactionCost);
      setPortfolio(prev => {
        const holding = prev[symbol] || { qty: 0, avgCost: 0 };
        const newQty = holding.qty + qty;
        // recalculate average cost basis
        const newAvgCost = ((holding.qty * holding.avgCost) + (qty * costPrice)) / newQty;
        return {
          ...prev,
          [symbol]: { qty: newQty, avgCost: Math.round(newAvgCost * 100) / 100 }
        };
      });

      const logText = `[AIF_TRANSACTION_EXECUTED: ${userName}_PURCHASED_${qty}_SHARES_OF_${symbol}_AT_${costPrice.toFixed(1)}_CREDITS]`;
      
      setTerminalLogs(prev => [
        ...prev,
        `[SUCCESS]: TRANSACTED APPROVED.`,
        logText
      ]);

      // Global Network Log Broadcast
      broadcastLogToMainframe(logText);
      playDigitalSound('ping');
    } 
    else if (action === 'SELL') {
      const holding = portfolio[symbol] || { qty: 0, avgCost: 0 };
      if (holding.qty < qty) {
        setTerminalLogs(prev => [
          ...prev,
          `[TRANSACTION DENIED]: PORTFOLIO NODE HOLDINGS INSUFFICIENT. Requested: ${qty}, Held: ${holding.qty} shares.`
        ]);
        playDigitalSound('click');
        return;
      }

      // Execute sell
      setAifCredits(prev => prev + totalTransactionCost);
      setPortfolio(prev => {
        const holding = prev[symbol] || { qty: 0, avgCost: 0 };
        const newQty = holding.qty - qty;
        return {
          ...prev,
          [symbol]: { qty: newQty, avgCost: newQty === 0 ? 0 : holding.avgCost }
        };
      });

      const logText = `[AIF_TRANSACTION_EXECUTED: ${userName}_SOLD_${qty}_SHARES_OF_${symbol}_AT_${costPrice.toFixed(1)}_CREDITS]`;
      
      setTerminalLogs(prev => [
        ...prev,
        `[SUCCESS]: LIQUIDATION COMPLETED.`,
        logText
      ]);

      // Global Network Log Broadcast
      broadcastLogToMainframe(logText);
      playDigitalSound('ping');
    }
  };

  // Broadcasts event custom neural alert hook to Home.tsx and Central Log tracker
  const broadcastLogToMainframe = (logStr: string) => {
    try {
      const customEvent = new CustomEvent('neural-log', {
        detail: {
          text: logStr,
          source: 'AIF-TERMINAL',
          timestamp: new Date().toLocaleTimeString([], { hour12: false })
        }
      });
      window.dispatchEvent(customEvent);

      // Save to central localStorage transaction ledger
      const existing = localStorage.getItem('aif_ledger_transactions');
      const ledger = existing ? JSON.parse(existing) : [];
      ledger.push({
        id: Date.now().toString(),
        text: logStr,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('aif_ledger_transactions', JSON.stringify(ledger));
    } catch (e) {
      console.warn("Mainframe log dispatch blocked:", e);
    }
  };

  // Dynamic Portfolio Calculations
  const getPortfolioCalculations = () => {
    let initialCost = 0;
    let currentValue = 0;

    Object.entries(portfolio).forEach(([symbol, holding]) => {
      if (holding.qty > 0) {
        initialCost += holding.qty * holding.avgCost;
        const currentPrice = aifAssets.find(a => a.symbol === symbol)?.currentPrice || 0;
        currentValue += holding.qty * currentPrice;
      }
    });

    const netAmount = currentValue - initialCost;
    const profitLossPercent = initialCost > 0 ? (netAmount / initialCost) * 100 : 0;

    return {
      currentValue,
      initialCost,
      netAmount,
      profitLossPercent
    };
  };

  const calculatedPortfolio = getPortfolioCalculations();
  const selectedAsset = aifAssets.find(a => a.symbol === selectedAssetSymbol) || aifAssets[0];

  return (
    <div className="p-4 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-zinc-200">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3">
            <Coins size={28} className="text-cyan-400 shrink-0 select-none animate-pulse" />
            AI Intelligence <span className="text-cyan-400 font-mono italic">Finance [AIF]</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            EXCHANGE STUDIO EQUITIES, GENRE INDEX FUNDS & CYBER CHARACTER SECURITIES IN REAL TIME
          </p>
        </div>

        {/* Tab Switcher: AIF vs standard store */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 border border-zinc-800 rounded-xl select-none">
          <button
            type="button"
            onClick={() => { setActiveTab('aif'); playDigitalSound('whir'); }}
            className={`px-3.5 py-1.5 font-mono text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'aif'
                ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'text-zinc-500 border border-transparent hover:text-zinc-300'
            }`}
          >
            <ChartIcon size={11} /> Trading Mainframe
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('shop'); playDigitalSound('whir'); }}
            className={`px-3.5 py-1.5 font-mono text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'shop'
                ? 'bg-crimson/15 border border-crimson/35 text-crimson shadow-[0_0_15px_rgba(229,9,20,0.15)]'
                : 'text-zinc-500 border border-transparent hover:text-zinc-300'
            }`}
          >
            <ShoppingBag size={11} /> Sec-Op Gear Shop
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TAB 1: AIF TRADING MAIN TERMINAL */}
        {activeTab === 'aif' && (
          <motion.div
            key="aif-terminal"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
          >
            
            {/* LEFT 4-COLUMNS: ASSET TICKER BAR LIST */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="plexiglass p-5 border border-zinc-800 rounded-3xl bg-zinc-950/60 overflow-hidden relative">
                
                <div className="absolute right-0 top-0 w-32 h-32 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />
                
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                  <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#F2F2F5] flex items-center gap-2">
                    <Zap size={12} className="text-cyan-400 animate-pulse" /> Live Assets List
                  </h3>
                  
                  {/* Category select filter inline */}
                  <select 
                    value={selectedCategory} 
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="p-1 font-mono text-[8px] bg-zinc-950 border border-zinc-800 rounded uppercase tracking-wider text-cyan-400"
                  >
                    <option value="All">All Categories</option>
                    <option value="Studio Shares">Studios</option>
                    <option value="Genre Indices">Indices</option>
                    <option value="Character Equity">Character Bonds</option>
                  </select>
                </div>

                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {aifAssets
                    .filter(a => selectedCategory === 'All' || a.category === selectedCategory)
                    .map(asset => {
                      const isSelected = selectedAssetSymbol === asset.symbol;
                      const hasProfit = asset.changePercent >= 0;
                      return (
                        <button
                          key={asset.symbol}
                          type="button"
                          onClick={() => { setSelectedAssetSymbol(asset.symbol); playDigitalSound('click'); }}
                          className={`w-full text-left p-3 rounded-2xl border font-mono transition-all duration-300 flex items-center justify-between group ${
                            isSelected 
                              ? 'bg-cyan-950/30 border-cyan-500/40 text-white shadow-[0_0_12px_rgba(34,211,238,0.1)]' 
                              : 'bg-zinc-950/40 border-zinc-900 text-zinc-400 hover:border-zinc-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-8 h-8 rounded-xl bg-zinc-900 border flex items-center justify-center text-[10px] font-black group-hover:scale-105 transition-transform duration-200 shrink-0 ${
                              isSelected ? 'border-cyan-500/30 text-cyan-300' : 'border-zinc-800 text-zinc-500'
                            }`}>
                              {asset.symbol}
                            </span>
                            <div>
                              <span className="text-xs font-bold block text-zinc-200 truncate max-w-[130px]">{asset.name}</span>
                              <span className="text-[7.5px] text-zinc-550 block font-normal tracking-wide uppercase leading-none mt-1">{asset.category}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-black block text-zinc-100">{asset.currentPrice.toFixed(1)} CR</span>
                            <span className={`text-[8.5px] font-semibold flex items-center gap-0.5 justify-end mt-0.5 ${hasProfit ? 'text-emerald-400' : 'text-rose-500'}`}>
                              {hasProfit ? '+' : ''}{asset.changePercent.toFixed(1)}%
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* CYBER WALLET / PORTFOLIO NODE */}
              <div className="plexiglass p-5 border border-zinc-800 rounded-3xl bg-zinc-950/60 relative">
                <div className="absolute left-0 bottom-0 w-32 h-32 bg-cyan-500/5 blur-3xl pointer-events-none rounded-full" />
                
                <h3 className="text-xs font-mono font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-900 pb-3 mb-4 flex items-center gap-1.5 select-none">
                  <Briefcase size={12} className="text-cyan-400" /> Live portfolio node
                </h3>

                <div className="space-y-4">
                  {/* Glowing monospaced wallet total balance */}
                  <div className="bg-zinc-950/80 border border-cyan-500/10 p-4 rounded-2xl flex flex-col items-center justify-center text-center shadow-inner">
                    <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest leading-none block mb-1">TOTAL LIQUID BALANCE</span>
                    <span className="text-2xl font-black font-mono text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.4)] tracking-tight">
                      {aifCredits.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} <span className="text-xs select-none">CR</span>
                    </span>

                    {/* Profit Loss Summary Indicator */}
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <span className="text-[8px] font-mono text-zinc-500 block uppercase font-bold tracking-wider">PORTFOLIO PL:</span>
                      <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full flex items-center gap-0.5 ${
                        calculatedPortfolio.netAmount >= 0 
                          ? 'text-emerald-400 bg-emerald-500/5 border border-emerald-500/20' 
                          : 'text-rose-500 bg-rose-500/5 border border-rose-500/20'
                      }`}>
                        {calculatedPortfolio.netAmount >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                        {calculatedPortfolio.netAmount >= 0 ? '+' : ''}{calculatedPortfolio.profitLossPercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Tiny owned equities tracker list */}
                  <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                    <span className="text-[7.5px] font-mono text-zinc-500 block uppercase font-black tracking-widest">OWNED BLOCK POSITION KEYS:</span>
                    {Object.entries(portfolio)
                      .filter(([_, holding]) => holding.qty > 0)
                      .map(([symbol, holding]) => {
                        const current = aifAssets.find(a => a.symbol === symbol)?.currentPrice || 0;
                        const returnPct = holding.avgCost > 0 ? ((current - holding.avgCost) / holding.avgCost) * 100 : 0;
                        return (
                          <div key={symbol} className="bg-neutral-950/40 border border-zinc-900 rounded-xl px-3 py-2 flex items-center justify-between text-[10px] font-mono">
                            <div>
                              <span className="font-black text-cyan-300 block">{symbol}</span>
                              <span className="text-[8px] text-zinc-500 block">QTY: {holding.qty} • AVG: {holding.avgCost} CR</span>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-zinc-200 block">{(holding.qty * current).toFixed(1)} CR</span>
                              <span className={`text-[8px] font-bold ${returnPct >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                                {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    {Object.values(portfolio).every(h => h.qty === 0) && (
                      <p className="text-[8px] text-zinc-650 italic py-2 text-center uppercase tracking-wide">NO RECRUITED EQUITIES OR TOKENS REGISTERED</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT 8-COLUMNS: LIVE HOLOGRAPHIC CHART & LOGS CMD LINE */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* COMPONENT: RECHARTS STYLIZED CHIPS CHART CONTAINER */}
              <div className="plexiglass p-6 border border-zinc-800 rounded-3xl bg-zinc-950/60 flex flex-col justify-between h-[360px] relative overflow-hidden">
                <div className="absolute left-1/3 top-0 w-80 h-40 bg-cyan-500/5 blur-[120px] pointer-events-none rounded-full" />
                
                {/* Selected Asset Stats Row Header */}
                <div className="flex justify-between items-start border-b border-zinc-900 pb-4 select-none mb-3">
                  <div>
                    <span className="text-[7.5px] font-mono text-zinc-500 uppercase tracking-widest font-black block mb-1">
                      ▲ ACTIVE TRADING TICK: [{selectedAsset.symbol}]
                    </span>
                    <h2 className="text-lg font-black text-white font-sans uppercase tracking-tight flex items-center gap-2">
                      {selectedAsset.name} 
                      <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                        {selectedAsset.category}
                      </span>
                    </h2>
                  </div>
                  
                  <div className="text-right font-mono">
                    <span className="text-[7px] text-zinc-500 block uppercase font-bold tracking-wider">CURRENT EQUITY RATE</span>
                    <span className="text-xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]">
                      {selectedAsset.currentPrice.toFixed(1)} CR
                    </span>
                    <span className={`text-[9.5px] block font-black mt-0.5 ${selectedAsset.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                      {selectedAsset.changePercent >= 0 ? '▲' : '▼'} {selectedAsset.changePercent > 0 ? '+' : ''}{selectedAsset.changePercent.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Holographic Line/Area Chart */}
                <div className="flex-1 w-full min-h-[220px]">
                  {priceHistories[selectedAsset.symbol] && priceHistories[selectedAsset.symbol].length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={priceHistories[selectedAsset.symbol]} 
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="holoGlow" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35}/>
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.00}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.3} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#71717a" 
                          fontSize={8} 
                          fontFamily="monospace"
                          tickLine={false}
                        />
                        <YAxis 
                          domain={['auto', 'auto']} 
                          stroke="#71717a" 
                          fontSize={8} 
                          fontFamily="monospace"
                          tickLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#09090b', 
                            borderColor: '#22d3ee30', 
                            borderRadius: '12px',
                            fontFamily: 'monospace',
                            fontSize: '9px',
                            color: '#e4e4e7'
                          }}
                          labelStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#22d3ee" 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#holoGlow)" 
                          dot={{ r: 1.5, stroke: '#22d3ee', strokeWidth: 1 }}
                          activeDot={{ r: 4, stroke: '#22d3ee', strokeWidth: 2, fill: '#09090b' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-[10px] text-zinc-650 font-mono italic">
                      COMPILING DATA NODES... NETWORK SYNC GRID INITIALIZATION
                    </div>
                  )}
                </div>

                {/* Holographic background scanner line effect */}
                <div className="absolute bottom-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent pointer-events-none" />
              </div>

              {/* BUY / SELL TERMINAL SHELL (COMMAND ENGINE & OUTPUT) */}
              <div className="flex flex-col bg-zinc-950/90 border border-[#22d3ee35] rounded-3xl overflow-hidden font-mono text-[10px] p-5 text-cyan-300 relative h-[310px] shadow-[0_4px_30px_rgba(0,0,0,0.85)]">
                {/* Retro grid mask over terminal */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] opacity-20 pointer-events-none" />
                
                {/* Shell bar header */}
                <div className="flex items-center justify-between border-b border-[#22d3ee20] pb-3.5 mb-3 select-none text-zinc-500">
                  <span className="text-[8px] font-black uppercase tracking-[0.22em] flex items-center gap-1.5 leading-none">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" /> SECURE AIF CONTRACT SHELL COMMANDER
                  </span>
                  <span className="text-[7px] font-bold text-cyan-500/80 uppercase">AIF_RECON_SHELL_ACTIVE</span>
                </div>

                {/* Terminal logs list stream */}
                <div className="flex-1 space-y-1.5 overflow-y-auto pr-1 select-text mb-4 text-cyan-400/90 scrollbar-thin scrollbar-thumb-zinc-800">
                  {terminalLogs.map((log, i) => (
                    <div key={i} className="leading-relaxed whitespace-pre-wrap break-all tracking-wide">
                      {log}
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>

                {/* Interactive CLI Text-based Prompt form */}
                <div className="flex items-center gap-2 border-t border-zinc-900 pt-3 relative z-10">
                  <span className="text-cyan-400 text-xs font-black select-none shrink-0">AIF_SHELL&gt;</span>
                  <input
                    type="text"
                    value={commandInput}
                    onChange={e => setCommandInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleExecuteCommand();
                      }
                    }}
                    placeholder="Enter command (e.g. BUY MAPPA 10, SELL UFO 5, help)..."
                    className="flex-1 select-all font-mono text-xs text-white bg-black/60 border border-zinc-800 focus:border-cyan-500/60 rounded-xl px-4 py-2.5 outline-none tracking-wide transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleExecuteCommand()}
                    className="px-4 py-2.5 rounded-xl bg-cyan-700/20 border border-cyan-500/40 hover:bg-cyan-500 hover:text-black font-semibold uppercase font-mono tracking-wider text-[9px] cursor-pointer transition-all duration-200"
                  >
                    DEPLOY PKT
                  </button>
                </div>
              </div>

              {/* PRE-FORMATTED TRANSACTION SPEED LAUNCHER CHIPS */}
              <div className="flex flex-wrap gap-2 justify-end select-none">
                <span className="text-[8px] font-mono font-bold uppercase text-zinc-500 self-center mr-1">QUICK PKT SYNTAX:</span>
                <button
                  type="button"
                  onClick={() => handleExecuteCommand(`BUY ${selectedAssetSymbol} 5`)}
                  className="px-2.5 py-1 bg-zinc-900 border border-cyan-500/15 text-[8.5px] font-mono text-cyan-400 hover:text-white rounded-lg hover:border-cyan-500/40 transition-colors"
                >
                  [BUY {selectedAssetSymbol} 5]
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteCommand(`BUY ${selectedAssetSymbol} 10`)}
                  className="px-2.5 py-1 bg-zinc-900 border border-cyan-500/15 text-[8.5px] font-mono text-cyan-400 hover:text-white rounded-lg hover:border-cyan-500/40 transition-colors"
                >
                  [BUY {selectedAssetSymbol} 10]
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteCommand(`SELL ${selectedAssetSymbol} 5`)}
                  className="px-2.5 py-1 bg-zinc-900 border border-rose-500/15 text-[8.5px] font-mono text-rose-400 hover:text-white rounded-lg hover:border-rose-500/40 transition-colors"
                >
                  [SELL {selectedAssetSymbol} 5]
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: REGISTERED SEC-OP SHOP (Original items catalog list) */}
        {activeTab === 'shop' && (
          <motion.div
            key="vanguard-shop"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-6"
          >
            {/* Header sub-row with wallet detail */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div>
                <h2 className="text-xl font-bold font-sans uppercase tracking-wide text-white">Vanguard Sector Logistics</h2>
                <p className="text-[8.5px] font-mono text-zinc-500 uppercase mt-1">EQUIP INTEL AMULETS AND LEGENDARY BLADES USING THE VIRTUAL OTAKU COINS NETWORK</p>
              </div>

              <div className="flex items-center gap-3 bg-zinc-950/60 border border-crimson/25 px-4 py-2 rounded-2xl select-none">
                <Coins size={14} className="text-yellow-400" />
                <span className="text-[10px] font-mono text-zinc-400 uppercase">VIRTUAL BAL:</span>
                <span className="text-sm font-black text-rose-100 font-mono">{gearBalance} OC</span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-4 py-1.5 rounded-xl text-[9px] font-mono font-black uppercase tracking-widest transition-all shrink-0 ${
                    categoryFilter === cat
                      ? 'bg-crimson border border-crimson text-white shadow-[0_0_15px_rgba(229,9,20,0.3)]'
                      : 'bg-black/40 border border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Catalog Grid list */}
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
                        : 'border-zinc-900 bg-zinc-950/40'
                    }`}
                  >
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

                    <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-auto">
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
                          onClick={() => handlePurchaseGear(item.id, item.price)}
                          disabled={gearBalance < item.price}
                          className={`px-4 py-2 rounded-xl text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                            gearBalance < item.price
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
