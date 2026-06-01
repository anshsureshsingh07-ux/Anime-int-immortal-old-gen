import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send, Radio, Terminal as TerminalIcon, Users, Settings, Award } from 'lucide-react';

const DEFAULT_MESSAGES = [
  { id: 1, user: 'Lelouch_VI', text: 'All units prepare. The Britannia infiltration route is now fully open.', faction: 'Holy Britannian Empire', time: '04:12' },
  { id: 2, user: 'Stark_Commando', text: 'Cores fully synchronized. Winter solstice multipliers are yielding solid XP.', faction: 'House Stark', time: '04:15' },
  { id: 3, user: 'Cloud_Sovereign', text: 'Does anyone have the legendary Crimson Katana from the marketplace yet? Need stat reviews.', faction: 'Akatsuki Network', time: '04:20' },
  { id: 4, user: 'Gold_Lannister', text: 'Buying active coin boosts. Ping me on the secure frequency if interested.', faction: 'House Lannister', time: '04:22' }
];

export default function DataRelay() {
  const [messages, setMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem('datarelay_messages_v1');
    return saved ? JSON.parse(saved) : DEFAULT_MESSAGES;
  });

  const [newMessage, setNewMessage] = useState('');
  const [activeChannel, setActiveChannel] = useState('Global Mainframe');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('datarelay_messages_v1', JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (localStorage.getItem('vanguard_guest_session') === 'true') {
      alert('WRITE ACTIONS RESERVED FOR AUTHENTICATED CHANNELS. GUEST_NODE ACCESS IS READ-ONLY.');
      return;
    }
    if (!newMessage.trim()) return;

    const date = new Date();
    const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

    const msg = {
      id: messages.length + 1,
      user: 'Vanguard_Agent_31',
      text: newMessage.trim(),
      faction: 'Vanguard Alliance',
      time: timeString
    };

    setMessages(prev => [...prev, msg]);
    setNewMessage('');
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-gray-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3">
            <Radio size={28} className="text-crimson shrink-0 animate-pulse" />
            Data <span className="text-crimson">Relay</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Forum or secure chat room for coordinated cross-node tactical conversation
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 border border-white/5 rounded-lg text-emerald-400 text-[10px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          RELAY: ONLINE [FREQUENCY_721]
        </div>
      </div>

      {/* Main Grid: Channels list & Chat Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch h-[500px]">
        
        {/* Left Side: Active Channels */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="plexiglass p-5 rounded-2xl flex flex-col gap-4 h-full">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/5 pb-2.5 flex items-center gap-2">
              <Users size={12} className="text-crimson" /> Active frequencies
            </h3>

            <div className="flex flex-col gap-1.5">
              {['Global Mainframe', 'War Strategy Room', 'Lannister Exchange', 'General Hub'].map(chan => (
                <button
                  key={chan}
                  type="button"
                  onClick={() => setActiveChannel(chan)}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition-all ${
                    activeChannel === chan
                      ? 'bg-crimson/25 border border-crimson text-white shadow-[0_0_10px_rgba(229,9,20,0.2)]'
                      : 'bg-black/40 border border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  📡 {chan}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Chat panel feed */}
        <div className="lg:col-span-9 flex flex-col bg-[#040206] border border-white/5 rounded-3xl overflow-hidden h-full">
          {/* Active channel indicator */}
          <div className="px-5 py-3 border-b border-white/5 bg-black/40 flex items-center justify-between">
            <span className="text-[9px] font-mono text-crimson font-black tracking-widest uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-pulse" /> CURRENT ROUTE: {activeChannel}
            </span>
            <span className="text-[7px] font-mono text-zinc-500 uppercase">LATENCY: 14ms // CHANNEL_ID: 11099x</span>
          </div>

          {/* Chat Feed Messages */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 font-sans select-text">
            {messages.map((msg, index) => {
              const colors = {
                'Akatsuki Network': '#E50914',
                'House Stark': '#00BFFF',
                'Holy Britannian Empire': '#A855F7',
                'House Lannister': '#FF9900',
                'Vanguard Alliance': '#E50914'
              }[msg.faction] || '#A855F7';

              return (
                <div key={index} className="flex flex-col gap-1 bg-white/2 p-3.5 rounded-xl border border-white/5 max-w-2xl">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-[#F2F2F5] hover:underline cursor-pointer">{msg.user}</span>
                      <span className="text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase" style={{ backgroundColor: `${colors}20`, color: colors, border: `1px solid ${colors}35` }}>
                        {msg.faction}
                      </span>
                    </div>
                    <span className="text-[7.5px] font-mono text-zinc-500">{msg.time}</span>
                  </div>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed mt-1">
                    {msg.text}
                  </p>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Text entry box */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 bg-[#030105] flex gap-3">
            <input
              type="text"
              placeholder="Synthesize secure relay transmission packets..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              className="flex-1 bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs font-mono text-white focus:outline-none focus:border-crimson transition-all"
            />
            <button
              type="submit"
              className="px-5 rounded-xl bg-crimson hover:bg-crimson/90 border border-crimson text-white text-[10px] font-mono font-black uppercase tracking-widest flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(229,9,20,0.3)] hover:shadow-[0_0_18px_rgba(229,9,20,0.5)]"
            >
              <Send size={11} /> Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
