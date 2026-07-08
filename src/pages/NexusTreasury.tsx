import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Search, 
  Briefcase, History, DollarSign, CheckCircle2, Wallet, 
  ArrowLeftRight, RefreshCw, Star, Info, FileText, ChevronRight, Check, Play, Crosshair
} from 'lucide-react';
import { playDigitalSound } from '../lib/sounds';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  LineChart, Line 
} from 'recharts';

// Types matching backend engines
interface Stock {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  prevClose: number;
  history1D: { time: string; price: number }[];
  priceChange: number;
  priceChangePercent: number;
}

interface PortfolioHolding {
  symbol: string;
  shares: number;
  averagePrice: number;
  name: string;
  currentPrice: number;
  priceChangePercent: number;
  investedValue: number;
  currentValue: number;
  totalReturn: number;
  totalReturnPercent: number;
}

interface LedgerEntry {
  id: string;
  txType: string;
  amountCR: number;
  exchangeRate: number;
  description: string;
  timestamp: string;
}

interface Order {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  orderClass: 'MARKET' | 'LIMIT';
  shares: number;
  limitPrice?: number;
  executedPrice?: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  totalCredits: number;
  timestamp: string;
}

export default function NexusTreasury() {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'explore' | 'holdings' | 'history'>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');

  // Core Stock State
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  
  // Real-time flash effect on price change
  const [priceFlash, setPriceFlash] = useState<Record<string, 'up' | 'down' | null>>({});
  const prevPricesRef = useRef<Record<string, number>>({});

  // Charts
  const [chartPeriod, setChartPeriod] = useState<'1D' | '1W' | '1M' | '1Y'>('1D');

  // Watchlist
  const [watchlist, setWatchlist] = useState<string[]>(['VNG', 'NEX', 'ANM']);

  // Portfolio
  const [portfolio, setPortfolio] = useState<{
    holdings: PortfolioHolding[];
    totalInvested: number;
    totalCurrent: number;
    totalPnL: number;
    totalPnLPercent: number;
    creditsBalance: number;
    vcoinBalance: number;
    exchangeRateCR: number;
  } | null>(null);

  // Orders and Ledgers
  const [ledgerLogs, setLedgerLogs] = useState<LedgerEntry[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Order Ticket State
  const [orderType, setOrderType] = useState<'BUY' | 'SELL'>('BUY');
  const [orderClass, setOrderClass] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [sharesQuantity, setSharesQuantity] = useState<string>('10');
  const [limitPriceInput, setLimitPriceInput] = useState<string>('');

  // Conversion Ticket State
  const [convertAmount, setConvertAmount] = useState<string>('500');

  // Status banners & feedback
  const [actionFeedback, setActionFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. FETCH STOCKS, PORTFOLIO & LEDGERS
  const fetchData = async (isPoll = false) => {
    try {
      const pRes = await fetch('/api/trading/portfolio');
      if (pRes.ok) {
        const pData = await pRes.json();
        setPortfolio(pData);
      }

      const sRes = await fetch('/api/trading/prices');
      if (sRes.ok) {
        const sData = await sRes.json();
        const nextStocks: Stock[] = sData.securities || [];
        setStocks(nextStocks);

        // Map flashes on price movements
        const newFlashes: Record<string, 'up' | 'down' | null> = {};
        nextStocks.forEach(s => {
          const prev = prevPricesRef.current[s.symbol];
          if (prev !== undefined && prev !== s.currentPrice) {
            newFlashes[s.symbol] = s.currentPrice > prev ? 'up' : 'down';
          }
          prevPricesRef.current[s.symbol] = s.currentPrice;
        });

        if (Object.keys(newFlashes).length > 0) {
          setPriceFlash(prev => ({ ...prev, ...newFlashes }));
          setTimeout(() => {
            setPriceFlash({});
          }, 800);
        }

        // Set default selected stock if null
        if (!selectedStock && nextStocks.length > 0) {
          const defaultAsset = nextStocks.find(s => s.symbol === 'VNG') || nextStocks[0];
          setSelectedStock(defaultAsset);
          setLimitPriceInput(defaultAsset.currentPrice.toString());
        } else if (selectedStock) {
          // Sync active selected stock price update
          const updatedSelected = nextStocks.find(s => s.symbol === selectedStock.symbol);
          if (updatedSelected) {
            setSelectedStock(updatedSelected);
          }
        }
      }

      // Fill secondary ledgers
      if (!isPoll) {
        const ledgRes = await fetch('/api/trading/ledger');
        if (ledgRes.ok) {
          const ledgData = await ledgRes.json();
          setLedgerLogs(ledgData.logs || []);
        }

        // Standard firebase auth token would fall back peacefully
        setOrders([]);
      }
    } catch (err) {
      console.error('[Trading Portal] Error syncing data:', err);
    } finally {
      if (!isPoll) setIsLoading(false);
    }
  };

  // Poll server for pricing changes & portfolio calculations
  useEffect(() => {
    fetchData(false);
    const interval = setInterval(() => {
      fetchData(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedStock?.symbol]);

  // Handle Sector filter selections
  const handleSectorFilter = (sector: string) => {
    playDigitalSound('click');
    setSelectedSector(sector);
  };

  // Load selected stock as active asset
  const handleSelectStock = (stock: Stock) => {
    playDigitalSound('click');
    setSelectedStock(stock);
    setLimitPriceInput(stock.currentPrice.toString());
    setActionFeedback(null);
  };

  // Watchlist bookmarked toggle
  const toggleWatchlist = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    playDigitalSound('ping');
    setWatchlist(prev => 
      prev.includes(symbol) ? prev.filter(s => s !== symbol) : [...prev, symbol]
    );
  };

  // Convert V-COIN to internal Nexus Credits (CR)
  const handleConvertCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    playDigitalSound('ping');
    const amt = Number(convertAmount);
    if (!amt || amt <= 0) return;

    try {
      const res = await fetch('/api/trading/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vcoinAmount: amt })
      });

      const body = await res.json();
      if (res.ok) {
        setActionFeedback({ success: true, message: body.message });
        // Retrieve fresh snapshot including updated balances & ledger audit log
        const lRes = await fetch('/api/trading/ledger');
        if (lRes.ok) {
          const lData = await lRes.json();
          setLedgerLogs(lData.logs || []);
        }
        fetchData(true);
      } else {
        setActionFeedback({ success: false, message: body.error || 'Conversion refused.' });
      }
    } catch {
      setActionFeedback({ success: false, message: 'Server connection severed. Check system logs.' });
    }
  };

  // Submit buy or sell order ticket
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    playDigitalSound('ping');
    if (!selectedStock) return;

    const qty = Number(sharesQuantity);
    const limitVal = orderClass === 'LIMIT' ? Number(limitPriceInput) : undefined;

    if (!qty || qty <= 0) {
      setActionFeedback({ success: false, message: 'Specify quantity above 0 shares.' });
      return;
    }

    try {
      const response = await fetch('/api/trading/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedStock.symbol,
          type: orderType,
          orderClass: orderClass,
          shares: qty,
          limitPrice: limitVal
        })
      });

      const body = await response.json();
      if (response.ok) {
        setActionFeedback({ success: true, message: body.message });
        const ledgRes = await fetch('/api/trading/ledger');
        if (ledgRes.ok) {
          const ledgData = await ledgRes.json();
          setLedgerLogs(ledgData.logs || []);
        }
        fetchData(true);
      } else {
        setActionFeedback({ success: false, message: body.error || 'Execution block. Trade declined.' });
      }
    } catch {
      setActionFeedback({ success: false, message: 'Server communication error. Order cancelled.' });
    }
  };

  // Populate quick input percentage values
  const handleQuickPercent = (percent: number) => {
    playDigitalSound('click');
    if (!selectedStock || !portfolio) return;
    const price = orderClass === 'LIMIT' ? Number(limitPriceInput) : selectedStock.currentPrice;
    if (price <= 0) return;

    if (orderType === 'BUY') {
      const budget = portfolio.creditsBalance * percent;
      const sharesToBuy = Math.floor(budget / price);
      setSharesQuantity(Math.max(1, sharesToBuy).toString());
    } else {
      const holding = portfolio.holdings.find(h => h.symbol === selectedStock.symbol);
      if (holding) {
        const sharesToSell = Math.floor(holding.shares * percent);
        setSharesQuantity(Math.max(1, sharesToSell).toString());
      } else {
        setSharesQuantity('0');
      }
    }
  };

  // Filter stocks based on query & selected sector
  const filteredStocks = stocks.filter(s => {
    const matchesSearch = s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'ALL' || s.sector.toUpperCase() === selectedSector;
    return matchesSearch && matchesSector;
  });

  // Unique list of sectors for filter UI
  const sectors = ['ALL', 'TECHNOLOGY', 'CYBERNETICS & MECHATRONICS', 'QUANTUM PROPULSION', 'MAKO GRID INFRASTRUCTURE', 'HIGH-DENSITY CRYSTALS', 'NEURAL REALITY & MEDIA'];

  // Simulated multi-period historical points generator
  const getSimulatedChartData = () => {
    if (!selectedStock) return [];
    if (chartPeriod === '1D') {
      // Intraday simulation directly from backend
      return selectedStock.history1D;
    }

    // Larger historical trends for weekly/monthly periods
    const points: { time: string; price: number }[] = [];
    const basePrice = selectedStock.prevClose;
    let entriesCount = 30;
    let formatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };

    if (chartPeriod === '1W') entriesCount = 7;
    else if (chartPeriod === '1Y') {
      entriesCount = 12;
      formatOptions = { month: 'short' };
    }

    const intervalMs = chartPeriod === '1W' ? 86400000 : chartPeriod === '1M' ? 86400000 : 2592000000;
    const dateOrigin = Date.now() - entriesCount * intervalMs;

    for (let i = 0; i < entriesCount; i++) {
      const dayTime = new Date(dateOrigin + i * intervalMs);
      const label = dayTime.toLocaleDateString([], formatOptions);
      // Slight randomized path
      const cycleNoise = Math.sin(i * 0.4) * (basePrice * 0.05);
      const randomWalk = (Math.random() - 0.48) * (basePrice * 0.06);
      points.push({
        time: label,
        price: Number((basePrice + cycleNoise + randomWalk).toFixed(2))
      });
    }

    // append today's active price
    points.push({
      time: 'Today',
      price: selectedStock.currentPrice
    });

    return points;
  };

  const chartData = getSimulatedChartData();

  if (isLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 text-zinc-400">
        <div className="w-12 h-12 rounded-full border-t-2 border-red-500 animate-spin" />
        <p className="font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Neural Trading Matrices...</p>
      </div>
    );
  }

  // Identify P&L colors and utilities
  const isLoss = (portfolio?.totalPnL || 0) < 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-zinc-200 font-sans min-h-screen">
      
      {/* 1. SECURE PORTFOLIO OVERHEAD GLOW PANEL */}
      <div className="relative overflow-hidden bg-gradient-to-r from-zinc-950 via-zinc-900/60 to-black border border-white/5 p-6 rounded-3xl flex flex-col lg:flex-row justify-between lg:items-center gap-6 shadow-[0_0_50px_rgba(239,68,68,0.02)]">
        {/* Abstract design elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-zinc-950 rounded-full" />
        
        {/* Left column: Portfolio stats */}
        <div className="flex flex-col gap-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-black">NEXUS TRADING TERMINAL LIVE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2 bg-gradient-to-r from-white via-zinc-100 to-red-400 bg-clip-text text-transparent">
            Nexus Market <span className="text-red-500 font-serif lowercase italic">&</span> Exchange
          </h1>
          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
            Groww-inspired execution matching engine // Audited in custom Nexus Credits (CR)
          </p>
        </div>

        {/* Right column: Dynamic Balance & P&L stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 z-10 font-mono">
          <div className="bg-zinc-950/40 p-3 rounded-2xl border border-white/5">
            <div className="text-[8px] text-zinc-500 uppercase tracking-widest">INVESTED VALUE</div>
            <div className="text-sm font-black text-white mt-1">
              {(portfolio?.totalInvested || 0).toLocaleString()} <span className="text-[10px] text-zinc-400">CR</span>
            </div>
          </div>

          <div className="bg-zinc-950/40 p-3 rounded-2xl border border-white/5">
            <div className="text-[8px] text-zinc-500 uppercase tracking-widest">CURRENT VALUE</div>
            <div className="text-sm font-black text-white mt-1">
              {(portfolio?.totalCurrent || 0).toLocaleString()} <span className="text-[10px] text-zinc-400">CR</span>
            </div>
          </div>

          <div className="bg-zinc-950/40 p-3 rounded-2xl border border-white/5">
            <div className="text-[8px] text-zinc-500 uppercase tracking-widest">TOTAL RETURNS</div>
            <div className={`text-sm font-black mt-1 flex items-center gap-1 ${isLoss ? 'text-rose-500' : 'text-emerald-400'}`}>
              {isLoss ? '-' : '+'}
              {Math.abs(portfolio?.totalPnL || 0).toLocaleString()}
              <span className="text-[10px]">({(portfolio?.totalPnLPercent || 0).toFixed(2)}%)</span>
            </div>
          </div>

          {/* Secure Balances */}
          <div className="bg-red-500/[0.02] p-3 rounded-2xl border border-red-500/10">
            <div className="text-[8px] text-red-400/80 uppercase tracking-widest flex items-center gap-1">
              <Wallet className="size-2.5 text-red-500" /> CASH BALANCE
            </div>
            <div className="text-sm font-black text-red-400 mt-1">
              {(portfolio?.creditsBalance || 0).toLocaleString()} <span className="text-[10px]">CR</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAIN LAYOUT GRID (LEFT EXPLORE/PORTFOLIO, RIGHT TERMINALS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* ==================== LEFT MAJOR SECTION ==================== */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Tab Selection */}
          <div className="flex bg-zinc-950 p-1 rounded-2xl border border-white/5 w-fit" id="market-tabs">
            <button
              onClick={() => { playDigitalSound('click'); setActiveTab('explore'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'explore'
                  ? 'bg-zinc-900 border border-white/5 text-white shadow-md'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <TrendingUp size={13} className={activeTab === 'explore' ? 'text-red-500' : ''} />
              Stock Explore
            </button>
            <button
              onClick={() => { playDigitalSound('click'); setActiveTab('holdings'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'holdings'
                  ? 'bg-zinc-900 border border-white/5 text-white shadow-md'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Briefcase size={13} className={activeTab === 'holdings' ? 'text-red-500' : ''} />
              Holdings ({(portfolio?.holdings || []).length})
            </button>
            <button
              onClick={() => { playDigitalSound('click'); setActiveTab('history'); }}
              className={`px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all flex items-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-zinc-900 border border-white/5 text-white shadow-md'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <History size={13} className={activeTab === 'history' ? 'text-red-500' : ''} />
              Conversions Ledger
            </button>
          </div>

          {/* Tab Renderers */}
          {activeTab === 'explore' && (
            <div className="flex flex-col gap-6">
              
              {/* Sector Filters & Search Carousel */}
              <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between bg-zinc-900/10 p-4 rounded-3xl border border-white/5">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search stock ticker or business sector..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-2 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-red-500/40 transition-all font-mono placeholder:text-zinc-600"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase font-black select-none tracking-widest mr-1">SECTOR:</span>
                  {['ALL', 'TECHNOLOGY', 'CYBERNETICS', 'NEURAL'].map(secName => {
                    const matchMap: Record<string, string> = {
                      'ALL': 'ALL',
                      'TECHNOLOGY': 'TECHNOLOGY',
                      'CYBERNETICS': 'CYBERNETICS & MECHATRONICS',
                      'NEURAL': 'NEURAL REALITY & MEDIA'
                    };
                    const exactSectorStr = matchMap[secName];
                    const isAct = selectedSector === exactSectorStr;
                    return (
                      <button
                        key={secName}
                        onClick={() => handleSectorFilter(exactSectorStr)}
                        className={`text-[9px] font-mono tracking-widest uppercase py-1.5 px-3 rounded-lg border leading-none transition-all ${
                          isAct
                            ? 'bg-red-500/10 border-red-500/30 text-red-400'
                            : 'bg-zinc-950 border-white/5 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {secName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STOCKS SCANNER TABLE */}
              <div className="overflow-hidden border border-white/5 rounded-3xl bg-zinc-950/40 backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-white/5 text-[9px] text-zinc-500 uppercase tracking-widest">
                        <th className="py-4 px-5">COMPANY / TICKER</th>
                        <th className="py-4 px-5">SECTOR</th>
                        <th className="py-4 px-5 text-right">CURRENT PRICE</th>
                        <th className="py-4 px-5 text-right">DAY CHANGE</th>
                        <th className="py-4 px-5 text-center">WATCHLIST</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {filteredStocks.map(s => {
                        const isUp = s.priceChangePercent >= 0;
                        const flash = priceFlash[s.symbol];
                        const isSelected = selectedStock?.symbol === s.symbol;

                        return (
                          <tr
                            key={s.symbol}
                            onClick={() => handleSelectStock(s)}
                            className={`group cursor-pointer hover:bg-white/[0.02] transition-colors ${
                              isSelected ? 'bg-red-500/[0.03] border-l-2 border-red-500' : ''
                            }`}
                          >
                            <td className="py-4 px-5">
                              <div>
                                <span className="font-black text-sm text-white group-hover:text-red-400 transition-colors">
                                  {s.symbol}
                                </span>
                                <span className="text-[10px] text-zinc-500 block font-normal leading-tight">
                                  {s.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-5 text-zinc-400">
                              <span className="px-2.5 py-1 bg-zinc-900 border border-white/5 rounded text-[10px] uppercase text-zinc-400">
                                {s.sector.split(' ')[0]}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right font-black">
                              <span className={`px-2 py-0.5 rounded transition-all duration-300 ${
                                flash === 'up' 
                                  ? 'bg-emerald-500/20 text-emerald-300 block scale-102' 
                                  : flash === 'down' 
                                  ? 'bg-rose-500/20 text-rose-300 block scale-102' 
                                  : 'text-zinc-100'
                              }`}>
                                {s.currentPrice.toFixed(2)} <span className="text-[9px] text-zinc-500 font-normal">CR</span>
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right font-bold">
                              <span className={`inline-flex items-center gap-1 ${
                                isUp ? 'text-emerald-400' : 'text-rose-500'
                              }`}>
                                {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                {s.priceChangePercent.toFixed(2)}%
                              </span>
                            </td>
                            <td className="py-4 px-5 text-center">
                              <button
                                onClick={(e) => toggleWatchlist(s.symbol, e)}
                                className={`p-1.5 rounded transition-all hover:bg-zinc-900 ${
                                  watchlist.includes(s.symbol) ? 'text-yellow-500' : 'text-zinc-600'
                                }`}
                              >
                                <Star size={13} fill={watchlist.includes(s.symbol) ? 'currentColor' : 'none'} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredStocks.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-500 text-xs">
                            No market securities matched active lookup parameters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SELECTED CORE GRAPH MODULE */}
              {selectedStock && (
                <div className="bg-gradient-to-b from-zinc-900/40 to-zinc-950/20 rounded-3xl border border-white/5 p-6 flex flex-col gap-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-mono font-black text-sm">
                        {selectedStock.symbol}
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white hover:text-red-400 transition-colors uppercase leading-none">
                          {selectedStock.name}
                        </h2>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-mono mt-1 block">
                          Sector: {selectedStock.sector}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col text-right">
                      <span className="text-2xl font-mono font-black text-white">
                        {selectedStock.currentPrice.toFixed(2)} <span className="text-xs text-zinc-500">CR</span>
                      </span>
                      <span className={`inline-flex items-center justify-end gap-1 text-xs font-bold ${
                        selectedStock.priceChangePercent >= 0 ? 'text-emerald-400' : 'text-rose-500'
                      }`}>
                        {selectedStock.priceChangePercent >= 0 ? '+' : ''}
                        {selectedStock.priceChange.toFixed(2)} ({selectedStock.priceChangePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* Period selection */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5" id="charts-period-triggers">
                      {(['1D', '1W', '1M', '1Y'] as const).map(p => (
                        <button
                          key={p}
                          onClick={() => { playDigitalSound('click'); setChartPeriod(p); }}
                          className={`text-[9px] font-mono py-1 px-3 rounded transition-all uppercase leading-none font-black ${
                            chartPeriod === p
                              ? 'bg-zinc-900 border border-white/10 text-white'
                              : 'text-zinc-600 hover:text-zinc-400'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    <span className="text-[8px] font-mono text-zinc-600 tracking-wider">
                      // REALTIME INTEGRATION STREAMED SECURE
                    </span>
                  </div>

                  {/* Graph Canvas */}
                  <div className="h-[240px] w-full" id="trading-recharts-chart">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 5, left: -25, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={selectedStock.priceChangePercent >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={selectedStock.priceChangePercent >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <XAxis 
                          dataKey="time" 
                          stroke="#3f3f46" 
                          fontSize={8} 
                          fontFamily="monospace"
                          dy={10}
                        />
                        <YAxis 
                          stroke="#3f3f46" 
                          fontSize={8} 
                          fontFamily="monospace"
                          domain={['auto', 'auto']}
                          dx={-5}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#070707',
                            borderColor: '#3f3f46',
                            borderRadius: '12px',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                          }}
                          labelStyle={{ color: '#a1a1aa' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="price" 
                          stroke={selectedStock.priceChangePercent >= 0 ? '#10b981' : '#f43f5e'} 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#chartGradient)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stock Metrics Box */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-950/20 p-4 border border-white/5 rounded-2xl text-[10px] font-mono text-zinc-400">
                    <div>
                      <span className="text-zinc-600 block uppercase">PREV CLOSE</span>
                      <span className="text-zinc-200 block text-xs font-black mt-0.5">
                        {selectedStock.prevClose.toFixed(2)} CR
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600 block uppercase">OPEN</span>
                      <span className="text-zinc-200 block text-xs font-black mt-0.5">
                        {(selectedStock.prevClose * 0.998).toFixed(2)} CR
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600 block uppercase">DAY HIGH</span>
                      <span className="text-emerald-400 block text-xs font-black mt-0.5">
                        {Math.max(selectedStock.currentPrice, selectedStock.prevClose * 1.012).toFixed(2)} CR
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-600 block uppercase">DAY LOW</span>
                      <span className="text-rose-500 block text-xs font-black mt-0.5">
                        {Math.min(selectedStock.currentPrice, selectedStock.prevClose * 0.985).toFixed(2)} CR
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE PORTFOLIO RENDERER */}
          {activeTab === 'holdings' && (
            <div className="flex flex-col gap-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <div>
                    <span className="text-zinc-500 uppercase tracking-widest block text-[9px]">TOTAL INVESTED COST</span>
                    <span className="text-base font-black text-white mt-1 block">
                      {(portfolio?.totalInvested || 0).toLocaleString()} CR
                    </span>
                  </div>
                  <span className="text-[8px] text-zinc-600 block mt-3">Principal currency locked</span>
                </div>

                <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <div>
                    <span className="text-zinc-500 uppercase tracking-widest block text-[9px]">CURRENT HOLDINGS VALUE</span>
                    <span className="text-base font-black text-white mt-1 block">
                      {(portfolio?.totalCurrent || 0).toLocaleString()} CR
                    </span>
                  </div>
                  <span className="text-[8px] text-zinc-600 block mt-3">Based on real-time tickers</span>
                </div>

                <div className="p-4 bg-zinc-950 rounded-2xl border border-red-500/15 flex flex-col justify-between">
                  <div>
                    <span className="text-zinc-500 uppercase tracking-widest block text-[9px]">OVERALL P&L YIELD</span>
                    <span className={`text-base font-black block mt-1 ${isLoss ? 'text-rose-500' : 'text-emerald-400'}`}>
                      {isLoss ? '-' : '+'}
                      {Math.abs(portfolio?.totalPnL || 0).toLocaleString()} CR
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold block mt-3 ${isLoss ? 'text-rose-600' : 'text-emerald-500'}`}>
                    {(portfolio?.totalPnLPercent || 0).toFixed(2)}% net returns
                  </span>
                </div>
              </div>

              {/* HOLDINGS LIST TABLE */}
              <div className="overflow-hidden border border-white/5 rounded-3xl bg-zinc-950/40 backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-mono text-xs">
                    <thead>
                      <tr className="bg-zinc-950 border-b border-white/5 text-[9px] text-zinc-500 uppercase tracking-widest">
                        <th className="py-4 px-5">HOLDING SECURITY</th>
                        <th className="py-4 px-5 text-right">QUANTITY</th>
                        <th className="py-4 px-5 text-right">AVG COSTE</th>
                        <th className="py-4 px-5 text-right">LIVE PRICE</th>
                        <th className="py-4 px-5 text-right">NET RETURN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.03]">
                      {(portfolio?.holdings || []).map(hold => {
                        const isHoldingDown = hold.totalReturn < 0;

                        return (
                          <tr
                            key={hold.symbol}
                            onClick={() => {
                              const matchStock = stocks.find(s => s.symbol === hold.symbol);
                              if (matchStock) handleSelectStock(matchStock);
                            }}
                            className="group cursor-pointer hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="py-4 px-5">
                              <div>
                                <span className="font-black text-sm text-white group-hover:text-red-400 transition-colors">
                                  {hold.symbol}
                                </span>
                                <span className="text-[10px] text-zinc-500 block font-normal leading-tight">
                                  {hold.name}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-5 text-right font-black text-zinc-300">
                              {hold.shares} <span className="text-[9px] text-zinc-500 font-normal">S</span>
                            </td>
                            <td className="py-4 px-5 text-right text-zinc-400">
                              {hold.averagePrice.toFixed(2)} CR
                            </td>
                            <td className="py-4 px-5 text-right font-black text-zinc-200">
                              {hold.currentPrice.toFixed(2)} CR
                            </td>
                            <td className="py-4 px-5 text-right font-bold">
                              <span className={`inline-flex items-center gap-1 ${
                                isHoldingDown ? 'text-rose-500' : 'text-emerald-400'
                              }`}>
                                {isHoldingDown ? '-' : '+'}
                                {Math.abs(hold.totalReturn).toFixed(2)} CR
                                <span className="text-[9px] font-normal">
                                  ({hold.totalReturnPercent.toFixed(1)}%)
                                </span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}

                      {(portfolio?.holdings || []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-500 text-xs">
                            Your holdings archive is empty. Invest through the Exploratory tracker.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* HISTORICAL LEDGER & TRANSACTIONS */}
          {activeTab === 'history' && (
            <div className="flex flex-col gap-6">
              
              {/* LEDGER LOGGER LIST */}
              <div className="neural-glass border border-white/5 p-6 rounded-3xl flex flex-col gap-4">
                <h3 className="text-xs font-mono font-black uppercase text-white tracking-widest flex items-center gap-2 border-b border-white/5 pb-3 select-none">
                  <FileText size={14} className="text-red-500" /> SECURE AUDIT DOUBLE-ENTRY LEDGER LOGS
                </h3>

                <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {ledgerLogs.map((log) => {
                    const isDebit = log.amountCR < 0;

                    return (
                      <div
                        key={log.id}
                        className="bg-black/40 border border-white/5 p-3.5 rounded-2xl flex items-center justify-between font-mono text-xs hover:border-white/10 transition-all gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                            isDebit 
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }`}>
                            {isDebit ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                          </div>
                          <div>
                            <span className="text-[11px] font-bold text-white block leading-snug">
                              {log.description}
                            </span>
                            <span className="text-[7.5px] text-zinc-500 tracking-wider font-semibold block mt-1">
                              {log.id.toUpperCase()} • {log.timestamp}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-xs font-black block tracking-wider ${
                            isDebit ? 'text-rose-400' : 'text-emerald-400 animate-pulse'
                          }`}>
                            {isDebit ? '' : '+'}{log.amountCR.toLocaleString()} CR
                          </span>
                          <span className="text-[7.5px] text-zinc-500 uppercase font-black block mt-1 tracking-wider">
                            Rate: {log.exchangeRate} CR / COIN
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {ledgerLogs.length === 0 && (
                    <p className="text-center text-zinc-600 text-xs py-8">
                      No transactional coordinates filed to datastore ledger.
                    </p>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* ==================== RIGHT SIDEBAR TICKETS ==================== */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* BLOCK 1: ORDER EXECUTION FORM */}
          {selectedStock && (
            <div className="bg-[#0c0c0e] border border-white/5 rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/[0.01] rounded-full blur-3xl pointer-events-none" />

              <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/5 pb-2 ml-0 w-full flex items-center justify-between">
                <span>ORDER DESPATCH HANDSHAKE</span>
                <span className="text-[8px] bg-red-500/10 text-red-500 border border-red-500/20 px-1 py-0.5 rounded leading-none">
                  SECURE MODE
                </span>
              </h3>

              {/* Buy/Sell switches */}
              <div className="grid grid-cols-2 bg-zinc-950 p-1 rounded-xl border border-white/5">
                <button
                  type="button"
                  onClick={() => { playDigitalSound('click'); setOrderType('BUY'); }}
                  className={`py-2 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all ${
                    orderType === 'BUY'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  BUY
                </button>
                <button
                  type="button"
                  onClick={() => { playDigitalSound('click'); setOrderType('SELL'); }}
                  className={`py-2 text-[10px] font-mono font-black uppercase tracking-widest rounded-lg transition-all ${
                    orderType === 'SELL'
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 font-black'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  SELL
                </button>
              </div>

              {/* Form Input Body */}
              <form onSubmit={handleSubmitOrder} className="flex flex-col gap-4 font-mono text-xs">
                
                {/* Active stock quick details */}
                <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-2xl flex items-center justify-between select-none">
                  <div>
                    <span className="text-[8px] text-zinc-500 uppercase block">SECURITY NODE</span>
                    <span className="text-xs font-black text-white block mt-0.5">{selectedStock.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] text-zinc-500 uppercase block">TICK VALUE</span>
                    <span className="text-xs font-bold text-zinc-200 block mt-0.5">
                      {selectedStock.currentPrice.toFixed(2)} CR
                    </span>
                  </div>
                </div>

                {/* Buy vs Sell limit parameter setting */}
                <div className="grid grid-cols-2 bg-zinc-950 p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => { playDigitalSound('click'); setOrderClass('MARKET'); }}
                    className={`py-1.5 text-[9px] font-mono font-black uppercase tracking-widest rounded-lg transition-all ${
                      orderClass === 'MARKET'
                        ? 'bg-zinc-905 border border-white/10 text-white shadow'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    MARKET RATE
                  </button>
                  <button
                    type="button"
                    onClick={() => { playDigitalSound('click'); setOrderClass('LIMIT'); }}
                    className={`py-1.5 text-[9px] font-mono font-black uppercase tracking-widest rounded-lg transition-all ${
                      orderClass === 'LIMIT'
                        ? 'bg-zinc-905 border border-white/10 text-white shadow'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    LIMIT TRIG
                  </button>
                </div>

                {/* shares field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] text-zinc-500 uppercase tracking-widest">SHARES QUANTITY</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Enter shares..."
                    value={sharesQuantity}
                    onChange={(e) => setSharesQuantity(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-red-500/40 transition-all font-mono text-xs"
                  />
                  
                  {/* Quick sizing pills */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {['25%', '50%', '100%'].map((percentStr, index) => {
                      const decimal = index === 0 ? 0.25 : index === 1 ? 0.5 : 1.0;
                      return (
                        <button
                          key={percentStr}
                          type="button"
                          onClick={() => handleQuickPercent(decimal)}
                          className="text-[8px] font-mono py-1 px-2 border border-white/5 bg-zinc-950 text-zinc-500 hover:text-zinc-300 rounded uppercase leading-none"
                        >
                          {percentStr}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* limit field if limit trigger is selected */}
                {orderClass === 'LIMIT' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] text-zinc-500 uppercase tracking-widest">TARGET LIMIT PRICE (CR)</label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      placeholder="e.g. 340.00"
                      value={limitPriceInput}
                      onChange={(e) => setLimitPriceInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl py-2 px-3 text-white focus:outline-none focus:border-red-500/40 transition-all font-mono text-xs"
                    />
                  </div>
                )}

                {/* Summary calculation parameters */}
                <div className="border-t border-white/5 pt-3.5 space-y-1.5 text-[10px] text-zinc-500">
                  <div className="flex items-center justify-between">
                    <span>UNIT PRICE</span>
                    <span className="text-zinc-300">
                      {(orderClass === 'LIMIT' ? Number(limitPriceInput) : selectedStock.currentPrice).toFixed(2)} CR
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-black border-t border-white/[0.03] pt-1.5">
                    <span className="text-zinc-300 uppercase">ESTIMATED TOTAL</span>
                    <span className={orderType === 'BUY' ? 'text-emerald-400' : 'text-rose-500'}>
                      {(Number(sharesQuantity || 0) * (orderClass === 'LIMIT' ? Number(limitPriceInput || 0) : selectedStock.currentPrice)).toLocaleString()} CR
                    </span>
                  </div>
                </div>

                {/* Action trigger button */}
                <button
                  type="submit"
                  className={`w-full flex items-center justify-center gap-2 py-3 font-mono font-black text-[9px] uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
                    orderType === 'BUY'
                      ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-black'
                      : 'bg-rose-500/10 border border-rose-500/40 text-rose-400 hover:bg-rose-500 hover:text-black'
                  }`}
                >
                  <Play size={10} />
                  <span>TRANSMIT {orderType} ORDER</span>
                </button>
              </form>

            </div>
          )}

          {/* BLOCK 2: TREASURY CASH DEPOSIT & CONVERSION HANDSHAKE */}
          <div className="bg-[#0c0c0e] border border-white/5 rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.01] rounded-full blur-3xl pointer-events-none" />

            <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/5 pb-2 ml-0 w-full flex items-center justify-between">
              <span>DISPATCH CONVERSION TOKENS</span>
              <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 rounded leading-none">
                LEDGER ACTIVE
              </span>
            </h3>

            {/* Live conversion widget */}
            <div className="p-3.5 bg-zinc-950/40 border border-emerald-500/10 rounded-2xl flex items-center justify-between select-none font-mono">
              <div>
                <span className="text-[8px] text-zinc-500 uppercase block">LIVE RATE TRACK</span>
                <span className="text-xs font-black text-white block mt-0.5">
                  1 V-COIN = {portfolio?.exchangeRateCR || '1.2580'} CR
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 animate-pulse">
                <ArrowLeftRight size={14} />
              </div>
            </div>

            {/* Fast deposit converter form */}
            <form onSubmit={handleConvertCredits} className="flex flex-col gap-4 font-mono text-xs">
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] text-zinc-500 uppercase tracking-widest">COIN QUANTITY (TO EXCHANGE)</label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    min="10"
                    placeholder="e.g. 500"
                    value={convertAmount}
                    onChange={(e) => setConvertAmount(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl py-2 px-3 pr-16 text-white focus:outline-none focus:border-emerald-500/40 transition-all font-mono text-xs"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-[9px] text-[#E50914] font-black uppercase select-none">
                    V-COIN
                  </span>
                </div>
                <span className="text-[8.5px] text-zinc-500 font-semibold block mt-1 tracking-normal uppercase">
                  Outer Reserve: {portfolio?.vcoinBalance.toLocaleString()} V-COIN available
                </span>
              </div>

              {/* conversion yields */}
              <div className="border-t border-white/5 pt-3.5 space-y-1.5 text-[10px] text-zinc-500">
                <div className="flex items-center justify-between">
                  <span>EXCHANGE RATE</span>
                  <span className="text-zinc-400 font-black">
                    {portfolio?.exchangeRateCR || '1.25'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-black border-t border-white/[0.03] pt-1.5">
                  <span className="text-zinc-300 uppercase">CREDITS PRODUCEDE</span>
                  <span className="text-emerald-400">
                    {(Number(convertAmount) * (portfolio?.exchangeRateCR || 1.25)).toLocaleString()} CR
                  </span>
                </div>
              </div>

              {/* Conversion trigger submission */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-mono font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-emerald-500 hover:text-black transition-all cursor-pointer"
              >
                <RefreshCw size={11} className="animate-spin-slow" />
                <span>EXCHANGE RESERVES</span>
              </button>
            </form>

          </div>

          {/* Action toast or error ticker display inside sidebar cards */}
          {actionFeedback && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`p-4 rounded-2xl border font-mono text-[10px] uppercase leading-normal tracking-wide flex gap-3 ${
                actionFeedback.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              {actionFeedback.success ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              ) : (
                <span className="shrink-0 text-rose-400 font-black">⚠️</span>
              )}
              <p>{actionFeedback.message}</p>
            </motion.div>
          )}

        </div>

      </div>

    </div>
  );
}
