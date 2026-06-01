import { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Bell, Clock, Compass, HelpCircle, Sparkles } from 'lucide-react';

const EVENT_DATA = [
  { id: 1, title: 'Demon Slayer Season 5 Premiere', type: 'Release', time: '18:00 UTC', date: 'JUN 04, 2026', desc: 'The official broadcast launch of the highly anticipated Infinity Castle final movie trilogy arc.', category: 'Anime Broadcast' },
  { id: 2, title: 'Stark House Summer War Solstice', type: 'Community', time: '12:00 UTC', date: 'JUN 08, 2026', desc: 'Summer solar events reach peak energy, boosting House Stark alignment multipliers by +200%.', category: 'Faction Bounties' },
  { id: 3, title: 'Re:Zero Season 3 Episode 12 Stream', type: 'Release', time: '14:30 UTC', date: 'JUN 15, 2026', desc: 'Continuous loop temporal parameters converge on the ultimate season-ending sequence.', category: 'Anime Broadcast' },
  { id: 4, title: 'Akatsuki Silent Node Infiltration', type: 'Community', time: '21:00 UTC', date: 'JUN 22, 2026', desc: 'Coordinated decrypter login surge to overrun the Britannia Empire terminal database.', category: 'Faction War' },
  { id: 5, title: 'My Hero Academia: Final Movie Global', type: 'Release', time: '00:00 UTC', date: 'JUN 28, 2026', desc: 'Mainstream servers authorized for decentralized global community watch parties.', category: 'Anime Broadcast' }
];

export default function EventHorizon() {
  const [reminders, setReminders] = useState<number[]>([]);
  const [filterType, setFilterType] = useState('All');

  const toggleReminder = (id: number) => {
    setReminders(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const filteredEvents = EVENT_DATA.filter(event => 
    filterType === 'All' || event.type === filterType
  );

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-gray-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3">
            <Calendar size={28} className="text-crimson shrink-0" />
            Event <span className="text-crimson">Horizon</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            System schedule calendar tracking upcoming anime releases and faction skirmishes
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 border border-white/5 rounded-lg text-zinc-400 text-[10px] font-mono select-none">
          <Clock size={11} className="text-crimson" />
          CLOCK: 2026-05-31_UTC
        </div>
      </div>

      {/* Main Layout: Filters and Listing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Filter buttons and Quick Calendar Overview */}
        <div className="lg:col-span-4 flex flex-col gap-4 col-span-1">
          <div className="plexiglass p-5 rounded-2xl flex flex-col gap-4">
            <h3 className="text-xs font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/5 pb-2">
              Horizon Controls
            </h3>

            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black">Event Classification</span>
              <div className="flex flex-col gap-1.5">
                {['All', 'Release', 'Community'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterType(type)}
                    className={`w-full text-left py-2.5 px-3.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition-all ${
                      filterType === type
                        ? 'bg-crimson border border-crimson text-white shadow-[0_0_12px_rgba(229,9,20,0.2)]'
                        : 'bg-black/40 border border-white/5 text-gray-400 hover:text-white hover:border-white/10'
                    }`}
                  >
                    ✦ {type} events
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#09060c] border border-white/5 p-4 rounded-2xl flex flex-col gap-3 font-mono text-[9px] text-zinc-400">
            <span className="font-sans font-black text-white uppercase tracking-wider block">EVENT PARAMETERS</span>
            <p className="leading-relaxed text-zinc-500 font-sans">
              Schedule entries update automatically relative to authorized Jikan APIs and community vanguard coordinators. Add reminders to sync active updates inside local terminals instantly.
            </p>
          </div>
        </div>

        {/* Right Side: Timeline Listings */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            {filteredEvents.map(event => {
              const hasReminder = reminders.includes(event.id);
              const isRelease = event.type === 'Release';

              return (
                <div 
                  key={event.id}
                  className={`neural-glass rounded-2xl p-5 border relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover-pulse transition-all duration-300 ${
                    isRelease ? 'border-l-4 border-l-crimson' : 'border-l-4 border-l-purple-500'
                  }`}
                >
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] font-mono font-black bg-black/60 px-2 py-0.5 rounded text-zinc-400 border border-white/10">
                        {event.date}
                      </span>
                      <span className={`text-[8px] font-mono font-black uppercase tracking-widest ${
                        isRelease ? 'text-crimson' : 'text-purple-400'
                      }`}>
                        // {event.category.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-sm font-sans font-black text-white uppercase tracking-tight">
                      {event.title}
                    </h3>

                    <p className="text-xs text-zinc-400 leading-relaxed font-sans max-w-xl">
                      {event.desc}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-end gap-3 justify-between w-full sm:w-auto shrink-0 font-mono text-right">
                    <div className="text-left sm:text-right">
                      <span className="text-[7px] text-zinc-600 uppercase font-black block">SYS TIME</span>
                      <span className="text-xs font-black text-[#F2F2F5] block">{event.time}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleReminder(event.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[8px] font-mono font-black uppercase tracking-widest border transition-all ${
                        hasReminder
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-white/10 bg-black hover:bg-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Bell size={10} className={hasReminder ? 'fill-emerald-400 text-emerald-400' : ''} />
                      {hasReminder ? 'Reminder Synced' : 'Set Reminder'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
