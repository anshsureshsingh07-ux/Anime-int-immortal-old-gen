import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Compass, BookOpen, Layers, Disc, Globe2, Network, ArrowRight } from 'lucide-react';

const MAP_NODES = [
  { id: 'abyss', title: 'The Great Abyss', faction: 'Akatsuki Network', coord: { x: 50, y: 70 }, depth: 'SEC_LEVEL_3', description: 'A massive fissure in the earth descending into terrifying and beautiful depths, holding mystical treasures and a deadly curse of ascension.', lore: 'Discovered in century 0. All terminals attempting to scan below level 6 experienced terminal sensory decay. Only Vanguard-level explorers can decrypt lore packets.' },
  { id: 'britannia', title: 'Holy Britannian Territory', faction: 'Holy Britannian Empire', coord: { x: 140, y: 130 }, depth: 'MILITARY_Z_9', description: 'Metropolitan nerve centers ruling over Area 11 and global sectors with automated Knightmare Frame units.', lore: 'The seat of absolute imperial authority. It maintains secure communications through the Britannian Core. Controlled entirely by the royal lineage.' },
  { id: 'winterfell', title: 'The Cold North (Winterfell)', faction: 'House Stark', coord: { x: 60, y: 130 }, depth: 'NORTH_ZONE_2', description: 'A vast freezing territory insulated by thermal hot springs running beneath the cold granite walls.', lore: 'This sector represents resilience. Historically robust against extreme heat storms and solar events. Synced entirely with Stark core registers.' },
  { id: 'casterly', title: 'Casterly Treasury Core', faction: 'House Lannister', coord: { x: 150, y: 60 }, depth: 'GOLD_REGISTRY', description: 'Multi-tiered fortress networks built directly into deep seaside mountains, acting as the primary repository of virtual treasury assets.', lore: 'The bedrock of capital. Contains records of all virtual coin transactions. Highly fortified. Intrusion detection remains at peak status.' }
];

export default function NeuralMaps() {
  const [selectedNode, setSelectedNode] = useState(MAP_NODES[0]);

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-gray-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3">
            <Compass size={28} className="text-crimson shrink-0" />
            Neural <span className="text-crimson">Maps</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Visual breakdown of cosmological world-building and faction lore matrices
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 select-none animate-pulse">
          <Layers size={11} className="text-crimson" />
          ACTIVE PROJECTIONS: 4
        </div>
      </div>

      {/* Main Grid: Visual SVG Map (Left) and Lore Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side: SVG Map Projection */}
        <div className="lg:col-span-7 flex flex-col bg-[#040206] border border-white/5 rounded-3xl p-6 relative overflow-hidden min-h-[400px] justify-center">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(168,85,247,0.01),rgba(0,0,0,0.1),rgba(168,85,247,0.01))] bg-[size:100%_4px,3px_100%] opacity-25 pointer-events-none" />
          
          <div className="absolute top-3 left-4 text-[7px] font-mono text-zinc-500 tracking-[0.2em] uppercase select-none">
            COSMOLOGICAL NODE COORDINATES // SUBSECTION MATRIX X-19
          </div>

          <div className="relative w-full aspect-square max-w-[400px] mx-auto flex items-center justify-center">
            {/* SVG radar ring controls */}
            <div className="absolute inset-0 rounded-full border border-purple-500/5 animate-pulse" />
            <div className="absolute w-[85%] h-[85%] rounded-full border border-white/5 pointer-events-none" />
            <div className="absolute w-[60%] h-[60%] rounded-full border border-purple-500/10 pointer-events-none" />
            <div className="absolute w-[35%] h-[35%] rounded-full border border-white/5 pointer-events-none" />

            {/* Living Sweep Line */}
            <div className="absolute w-[95%] h-[95%] rounded-full bg-gradient-to-r from-crimson/0 via-crimson/5 to-crimson/0 animate-spin pointer-events-none" style={{ animationDuration: '8s' }} />

            <svg viewBox="0 0 200 200" className="w-full h-full z-10 filter drop-shadow-[0_0_15px_rgba(0,0,0,0.95)]">
              {/* Core Lines connect nodes to center */}
              {MAP_NODES.map((node) => (
                <line
                  key={`line-${node.id}`}
                  x1="100"
                  y1="100"
                  x2={node.coord.x}
                  y2={node.coord.y}
                  stroke={selectedNode.id === node.id ? '#E50914' : 'rgba(255, 255, 255, 0.15)'}
                  strokeWidth="0.85"
                  strokeDasharray="4 2"
                  className="transition-all duration-300"
                />
              ))}

              {/* Center System Core Node */}
              <circle cx="100" cy="100" r="10" fill="#0D0612" stroke="#E50914" strokeWidth="1.2" />
              <circle cx="100" cy="100" r="6" fill="#010002" />
              <circle cx="100" cy="100" r="2" fill="#E50914" className="animate-pulse" />

              {/* Faction Quadrants Text markers */}
              <text x="50" y="25" fill="rgba(255, 255, 255, 0.2)" fontSize="4.5" fontFamily="monospace" textAnchor="middle">SEC_01_AKATSUKI</text>
              <text x="150" y="25" fill="rgba(255, 255, 255, 0.2)" fontSize="4.5" fontFamily="monospace" textAnchor="middle">SEC_02_LANNISTER</text>
              <text x="50" y="180" fill="rgba(255, 255, 255, 0.2)" fontSize="4.5" fontFamily="monospace" textAnchor="middle">SEC_03_STARK</text>
              <text x="150" y="180" fill="rgba(255, 255, 255, 0.2)" fontSize="4.5" fontFamily="monospace" textAnchor="middle">SEC_04_BRITANNIA</text>

              {/* Interactive Nodes */}
              {MAP_NODES.map((node) => {
                const isSelected = selectedNode.id === node.id;
                return (
                  <g 
                    key={node.id} 
                    className="cursor-pointer"
                    onClick={() => setSelectedNode(node)}
                  >
                    {/* Ring highlight pulse */}
                    {isSelected && (
                      <circle 
                        cx={node.coord.x} 
                        cy={node.coord.y} 
                        r="12" 
                        fill="none" 
                        stroke="#E50914" 
                        strokeWidth="1" 
                        className="animate-ping opacity-60" 
                      />
                    )}
                    <circle 
                      cx={node.coord.x} 
                      cy={node.coord.y} 
                      r="7" 
                      fill={isSelected ? '#E50914' : '#140c1e'} 
                      stroke={isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'} 
                      strokeWidth="1.2" 
                      className="transition-all duration-300 hover:scale-110"
                    />
                    {/* Small inner core */}
                    <circle 
                      cx={node.coord.x} 
                      cy={node.coord.y} 
                      r="2" 
                      fill={isSelected ? '#ffffff' : '#E50914'} 
                    />
                    
                    {/* Floating label */}
                    <text 
                      x={node.coord.x} 
                      y={node.coord.y - 11} 
                      fill={isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'} 
                      fontSize="5" 
                      fontFamily="monospace" 
                      fontWeight="bold" 
                      textAnchor="middle"
                      className="transition-all duration-300 pointer-events-none"
                    >
                      {node.title.toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right Side: Lore Data Panel */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.24 }}
              className="plexiglass p-6 rounded-3xl border border-white/5 flex flex-col gap-4 justify-between h-full"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-mono font-black uppercase tracking-widest bg-black/60 border border-crimson/30 px-2 py-0.5 rounded text-crimson">
                    {selectedNode.depth}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
                    {selectedNode.faction} Aligned
                  </span>
                </div>

                <h2 className="text-xl font-black font-sans uppercase tracking-tight text-white">
                  {selectedNode.title}
                </h2>

                {/* Micro metrics */}
                <div className="flex items-center gap-6 py-2 border-y border-white/5 mb-1 text-[10px] font-mono text-zinc-400">
                  <div>
                    <span className="text-zinc-600 block">LATENCY</span>
                    <span className="text-white font-bold">12ms Sync</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block">GRID CORDS</span>
                    <span className="text-white font-bold">X:{selectedNode.coord.x} Y:{selectedNode.coord.y}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block">SECURITY</span>
                    <span className="text-emerald-400 font-bold">Verified SEC_OK</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-[9px] font-mono font-black uppercase tracking-widest text-[#F2F2F5] mb-1.5 flex items-center gap-1.5">
                    <BookOpen size={10} className="text-crimson" /> COSMOLOGICAL BRIEFING
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed font-sans bg-black/40 p-3.5 rounded-xl border border-white/5">
                    {selectedNode.description}
                  </p>
                </div>

                <div>
                  <h4 className="text-[9px] font-mono font-black uppercase tracking-widest text-[#F2F2F5] mb-1.5 flex items-center gap-1.5">
                    <Network size={10} className="text-crimson" /> DECRYPTED NETWORK LORE PACKETS
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed italic font-sans">
                    {selectedNode.lore}
                  </p>
                </div>
              </div>

              {/* Bottom interaction action */}
              <button 
                type="button"
                className="w-full flex items-center justify-between text-left py-3 px-4 rounded-xl border border-crimson/40 bg-crimson/10 text-white text-[10px] font-mono font-black uppercase tracking-widest hover:bg-crimson/20 hover:border-crimson hover:shadow-[0_0_15px_rgba(229,9,20,0.3)] transition-all mt-4"
              >
                <span>Initialize Full-Scale Holo Projection</span>
                <ArrowRight size={12} className="text-crimson" />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
