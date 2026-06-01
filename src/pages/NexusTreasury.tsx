import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Landmark, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, DollarSign, Send, History } from 'lucide-react';
import { playDigitalSound } from '../lib/sounds';

interface Transaction {
  id: string;
  txId: string;
  timestamp: string;
  source: string;
  amount: number;
  type: 'INCOMING' | 'OUTGOING';
  currency: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'tx-01', txId: 'TXN_6841_X9', timestamp: '05:21:42', source: 'Casterly Treasury Mine', amount: 4850, type: 'INCOMING', currency: 'L_GOLD' },
  { id: 'tx-02', txId: 'TXN_3201_A4', timestamp: '05:20:11', source: 'Rain Tower Sensory Grid', amount: -650, type: 'OUTGOING', currency: 'AK_CREDIT' },
  { id: 'tx-03', txId: 'TXN_9011_W2', timestamp: '05:18:55', source: 'Dragonstone Mine Syndicate', amount: 1200, type: 'INCOMING', currency: 'ST_GLASS' },
  { id: 'tx-04', txId: 'TXN_4111_K8', timestamp: '05:16:03', source: 'Britannian Knightmare Deputization', amount: -2100, type: 'OUTGOING', currency: 'BR_COINS' }
];

export default function NexusTreasury() {
  const [balance, setBalance] = useState(84250);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [tickerFlash, setTickerFlash] = useState<'GAIN' | 'LOSS' | null>(null);

  // Auto-generate transactions every 2 seconds simulating live block changes
  useEffect(() => {
    const transactionSources = [
      'Gawayn float core dividends',
      'Winterfell outpost solar panels',
      'Akatsuki rogue bounty collect',
      'Iron Bank interest compound',
      'Lannister gold mine sweep',
      'Uzumaki alliance toll gate',
      'Vanguard Node maintenance task'
    ];
    const currencies = ['L_GOLD', 'AK_CREDIT', 'ST_GLASS', 'BR_COINS', 'V_COIN'];

    const interval = setInterval(() => {
      const isIncoming = Math.random() > 0.4;
      const amount = Math.floor(Math.random() * 2500) + 120;
      const finalAmount = isIncoming ? amount : -amount;
      
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        txId: `TXN_${Math.floor(Math.random() * 9000) + 1000}_${['A','B','X','K'][Math.floor(Math.random()*4)]}${Math.floor(Math.random()*9)}`,
        timestamp: new Date().toLocaleTimeString([], { hour12: false }),
        source: transactionSources[Math.floor(Math.random() * transactionSources.length)],
        amount: finalAmount,
        type: isIncoming ? 'INCOMING' : 'OUTGOING',
        currency: currencies[Math.floor(Math.random() * currencies.length)]
      };

      setBalance(prev => prev + finalAmount);
      setTransactions(prev => [newTx, ...prev.slice(0, 7)]); // Keep max 8 items
      
      setTickerFlash(isIncoming ? 'GAIN' : 'LOSS');
      setTimeout(() => setTickerFlash(null), 850);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleManualTransaction = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    playDigitalSound('ping');
    const formData = new FormData(e.currentTarget);
    const sourceNode = formData.get('sourceNode') as string;
    const pledgeAmountStr = formData.get('pledgeAmount') as string;

    if (!sourceNode || !pledgeAmountStr) return;

    const amount = Number(pledgeAmountStr);
    const isIncoming = amount > 0;

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      txId: `TXN_MANUAL_${Math.floor(Math.random() * 90) + 10}`,
      timestamp: new Date().toLocaleTimeString([], { hour12: false }),
      source: sourceNode,
      amount: amount,
      type: isIncoming ? 'INCOMING' : 'OUTGOING',
      currency: 'V_COIN'
    };

    setBalance(prev => prev + amount);
    setTransactions(prev => [newTx, ...prev]);
    e.currentTarget.reset();
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-zinc-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
            <span className="text-[9px] font-mono tracking-widest text-[#E50914] uppercase font-black">NEXUS TREASURY LOGISTICS</span>
          </div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3 chromatic-aberration">
            <Landmark size={28} className="text-crimson shrink-0" />
            Nexus Treasury <span className="text-crimson">& Ledger</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Accounting ledger ledger and block transactions tracing faction resource flow streams
          </p>
        </div>

        {/* Dynamic Balance Display */}
        <div className={`p-3 border rounded-2xl flex items-center gap-3 select-none font-mono transition-all duration-300 min-w-[200px] justify-between ${
          tickerFlash === 'GAIN' 
            ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.35)] scale-102' 
            : tickerFlash === 'LOSS' 
            ? 'border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(229,9,20,0.35)] scale-102' 
            : 'border-white/5 bg-black/40'
        }`}>
          <div>
            <span className="text-[8px] text-zinc-500 uppercase block leading-none">TOTAL V-NET ACCOUNT</span>
            <span className="text-base font-black text-white block mt-1 tracking-wider">
              {balance.toLocaleString()} V-COIN
            </span>
          </div>
          {tickerFlash === 'GAIN' ? (
            <TrendingUp className="text-emerald-500 animate-bounce" size={20} />
          ) : tickerFlash === 'LOSS' ? (
            <TrendingDown className="text-red-500 animate-bounce" size={20} />
          ) : (
            <DollarSign className="text-zinc-500" size={16} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Side: Ledger List & Logs */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="neural-glass p-6 rounded-3xl flex flex-col gap-5">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-white border-b border-white/5 pb-3 flex items-center gap-2 select-none">
              <History size={14} className="text-crimson" /> LIVE TRANSACTION STREAM (2S TICKER)
            </h3>

            {/* List */}
            <div className="flex flex-col gap-2.5 overflow-hidden">
              <AnimatePresence initial={false}>
                {transactions.map(tx => {
                  const isIncoming = tx.type === 'INCOMING';
                  return (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, x: -15, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: 15, height: 0 }}
                      transition={{ duration: 0.28 }}
                      className="bg-black/40 border border-white/5 p-3.5 rounded-2xl flex items-center justify-between font-mono text-xs hover:border-white/10 transition-all select-all gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                          isIncoming ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'
                        }`}>
                          {isIncoming ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                        </div>
                        <div>
                          <span className="text-[10px] font-black text-white block leading-none truncate max-w-[150px] sm:max-w-[280px]">
                            {tx.source}
                          </span>
                          <span className="text-[7.5px] text-zinc-500 tracking-wider font-semibold block mt-1">
                            {tx.txId} • {tx.timestamp}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`text-xs font-black block tracking-wider ${isIncoming ? 'text-emerald-400 animate-pulse' : 'text-red-500'}`}>
                          {isIncoming ? '+' : ''}{tx.amount.toLocaleString()}
                        </span>
                        <span className="text-[7.5px] text-zinc-500 uppercase font-black block mt-1 tracking-wider">
                          {tx.currency}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right Side: Dispatch Manual Ledger Entry */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="neural-glass p-6 rounded-3xl flex flex-col gap-4 justify-between h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-crimson/5 rounded-full blur-3xl pointer-events-none" />

            <form onSubmit={handleManualTransaction} className="flex flex-col gap-4">
              <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/5 pb-2 ml-0 w-full">
                DISPATCH TRANSACTION CODE
              </h3>

              <div className="flex flex-col gap-2">
                <label className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Target Node Source</label>
                <input
                  name="sourceNode"
                  required
                  placeholder="e.g. Uzumaki Portal Bridge"
                  className="w-full bg-black/60 border border-white/5 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-crimson transition-all font-mono premium-input"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Amount Pledged (Loss/Gain)</label>
                <input
                  name="pledgeAmount"
                  type="number"
                  required
                  placeholder="e.g. -450 (loss) or 1500 (gain)"
                  className="w-full bg-black/60 border border-white/5 rounded-xl py-2 px-3.5 text-xs text-white focus:outline-none focus:border-crimson transition-all font-mono premium-input"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 bg-crimson/10 border border-crimson/40 text-white font-mono font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-crimson hover:border-crimson hover:shadow-[0_0_15px_rgba(229,9,20,0.4)] transition-all cursor-pointer mt-2"
              >
                <Send size={11} className="text-white" />
                <span>Submit Audit Log</span>
              </button>
            </form>

            <div className="text-[8.5px] font-mono text-zinc-500 leading-relaxed uppercase tracking-normal border-t border-white/5 pt-4 select-none">
              SECURE TRANSACTION LEDGER ASSUMES NO LIABILITY FOR MISPLACED OR INCORRECT CODE ADDRESSING VECTORS. DO NOT DISCLOSE SYNC KEYWORDS.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
