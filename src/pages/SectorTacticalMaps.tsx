import { useState, useRef } from 'react';
import { motion, useMotionValue } from 'motion/react';
import { Compass, ZoomIn, ZoomOut, RotateCcw, AlertOctagon, Target, Shield, Users } from 'lucide-react';
import { playDigitalSound } from '../lib/sounds';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

interface TacticalSector {
  id: string;
  name: string;
  faction: string;
  threatLevel: 'CRITICAL' | 'STABLE' | 'ELEVATED' | 'SECURE';
  militaryStrength: string;
  activeSquads: number;
  coordinates: string;
  description: string;
  color: string;
  sigil: string;
}

const TACTICAL_SECTORS: TacticalSector[] = [
  {
    id: 'sec-akatsuki',
    name: 'Akatsuki Outpost (Rain Citadel)',
    faction: 'Akatsuki Network',
    threatLevel: 'CRITICAL',
    militaryStrength: 'SS-RANK COMMANDO',
    activeSquads: 18,
    coordinates: 'SECTOR_X02_Y91',
    description: 'Highly fortified metropolitan area covered by dark rain firewalls and secret communication rings. Unidentified drone sweeps reported.',
    color: '#E50914',
    sigil: '☁️'
  },
  {
    id: 'sec-stark',
    name: 'The Winterfell Sanctuary',
    faction: 'House Stark Network',
    threatLevel: 'SECURE',
    militaryStrength: '84,500 DR-UNITS',
    activeSquads: 9,
    coordinates: 'SECTOR_X14_Y12',
    description: 'Protected by massive freeze perimeter barriers and deep geothermal hot loops. Direct satellite sync lines verified normal.',
    color: '#22D3EE',
    sigil: '🐺'
  },
  {
    id: 'sec-britannia',
    name: 'Britannian Central Core',
    faction: 'Holy Britannian Empire',
    threatLevel: 'ELEVATED',
    militaryStrength: '52 KNIGHTMARE CORES',
    activeSquads: 31,
    coordinates: 'SECTOR_X75_Y42',
    description: 'Area 11 governing center. Constant threat of localized rebel grid intrusion. Guard-beams active near sovereign border vectors.',
    color: '#A855F7',
    sigil: '👑'
  },
  {
    id: 'sec-lannister',
    name: 'Casterly Treasury Vault',
    faction: 'House Lannister Core',
    threatLevel: 'STABLE',
    militaryStrength: '1.2M V-COIN NODES',
    activeSquads: 14,
    coordinates: 'SECTOR_X82_Y05',
    description: 'Deep mountain vault housing primary ledger systems and resource miners. Laser intrusion defenses currently at peak performance.',
    color: '#FFB300',
    sigil: '🦁'
  },
  {
    id: 'sec-uzumaki',
    name: 'Uzumaki Hidden Redoubt',
    faction: 'Uzumaki Alliance',
    threatLevel: 'STABLE',
    militaryStrength: '94,200 CH-VECTORS',
    activeSquads: 12,
    coordinates: 'SECTOR_X50_Y50',
    description: 'Sealing barrier matrix covers this region. Shadows clones signal packets distribute randomly across sectors to secure identities.',
    color: '#F97316',
    sigil: '🌀'
  }
];

interface GeospatialEvent {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  eventId: string;
  threatLevel: 'CRITICAL' | 'STABLE' | 'ELEVATED' | 'SECURE';
  eventDetails: string;
  signalStrength: string;
}

const GEOSPATIAL_EVENTS: GeospatialEvent[] = [
  {
    id: "geo-tokyo",
    name: "New Tokyo-3 Geo-Front Node",
    coordinates: { lat: 35.6895, lng: 139.6917 },
    eventId: "EV-TOKYO-03-A",
    threatLevel: "CRITICAL",
    eventDetails: "Intense subterranean chakra readings detected inside Command Geo-Front Core. Deploy secure scan barriers.",
    signalStrength: "98.4%"
  },
  {
    id: "geo-kyoto",
    name: "Kyoto Spiritual Seal Vertex",
    coordinates: { lat: 35.0116, lng: 135.7681 },
    eventId: "EV-KYOTO-BARRIER",
    threatLevel: "STABLE",
    eventDetails: "Spiritual mana locks operating completely normal. Secondary shields are active and synchronized.",
    signalStrength: "89.1%"
  },
  {
    id: "geo-fuji",
    name: "Mount Fuji Volcanic Core Unit",
    coordinates: { lat: 35.3606, lng: 138.7274 },
    eventId: "EV-FUJI-CORE",
    threatLevel: "ELEVATED",
    eventDetails: "Deep geological thermal fluctuations detected. High-frequency robotic drones dispatched to survey crater path.",
    signalStrength: "92.7%"
  },
  {
    id: "geo-paris",
    name: "Area 11 Paris Sub-Mainframe",
    coordinates: { lat: 48.8566, lng: 2.3522 },
    eventId: "EV-PARIS-SECURE",
    threatLevel: "SECURE",
    eventDetails: "Perimeter visual scanners running without any alert flags. Frame hanger storage secure.",
    signalStrength: "95.2%"
  }
];

const DARK_INDUSTRIAL_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#09090b" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#09090b" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#71717a" }] },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3b82f6" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#09090b" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#52525b" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#18181b" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.stroke",
    "stylers": [{ "color": "#27272a" }]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#71717a" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#020204" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#3f3f46" }]
  }
];

function GeospatialMarkerComponent({ event, onSelect, activeEventId }: {
  event: GeospatialEvent;
  onSelect: (event: GeospatialEvent | null) => void;
  activeEventId: string | null;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const isOpen = activeEventId === event.id;

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={event.coordinates}
        onClick={() => {
          onSelect(isOpen ? null : event);
          playDigitalSound('click');
        }}
        title={event.name}
      >
        <div 
          className="relative flex items-center justify-center cursor-pointer" 
          style={{ width: '32px', height: '32px' }}
        >
          {/* Glowing concentric neural waves */}
          <span className="absolute w-8 h-8 rounded-full bg-cyan-400/20 animate-ping opacity-75" />
          <span className="absolute w-5 h-5 rounded-full bg-red-500/25 animate-pulse border border-red-500/40" />
          <span className="relative w-3.5 h-3.5 rounded-full bg-red-600 border border-white shadow-[0_0_10px_#ef4444]" />
        </div>
      </AdvancedMarker>

      {isOpen && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => {
            onSelect(null);
            playDigitalSound('click');
          }}
        >
          <div className="p-3 font-mono text-[9px] text-zinc-300 bg-[#070709] min-w-[210px] max-w-[250px] rounded-lg tracking-wider space-y-2 uppercase leading-relaxed text-wrap">
            <div className="text-red-500 font-extrabold border-b border-white/5 pb-1 flex justify-between select-none">
              <span>// NEURAL SIGNAL</span>
              <span className="text-cyan-400 shrink-0">ONLINE</span>
            </div>
            
            <div className="text-white font-black text-[10px] leading-normal">{event.name}</div>
            
            <div className="space-y-0.5 text-zinc-400">
              <div className="text-zinc-500 font-bold">[EVENT_ID: {event.eventId}]</div>
              <div className="text-zinc-500 font-bold">[COORDINATES: {event.coordinates.lat.toFixed(4)}, {event.coordinates.lng.toFixed(4)}]</div>
              <div>[THREAT LEVEL]: <span className="text-red-400 font-bold">{event.threatLevel}</span></div>
              <div>[SIGNAL INTEN]: <span className="text-amber-500 font-bold">{event.signalStrength}</span></div>
            </div>
            
            <p className="text-[8px] text-zinc-400 border-t border-white/5 pt-1.5 leading-relaxed bg-black/40 p-1.5 rounded normal-case leading-normal">
              {event.eventDetails}
            </p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function SectorTacticalMaps() {
  const [selectedSector, setSelectedSector] = useState<TacticalSector>(TACTICAL_SECTORS[0]);
  const [scale, setScale] = useState(1);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Layer toggling and Geospatial state
  const [activeLayer, setActiveLayer] = useState<'orbital' | 'geospatial'>('orbital');
  const [selectedGeoEvent, setSelectedGeoEvent] = useState<GeospatialEvent | null>(null);

  // Load API secrets safely
  const MAPS_API_KEY = 
    process.env.GOOGLE_MAPS_PLATFORM_KEY || 
    process.env.MAPS_API_KEY ||
    (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
    (import.meta as any).env?.VITE_MAPS_API_KEY ||
    '';
  const hasValidMapsKey = Boolean(MAPS_API_KEY) && MAPS_API_KEY !== 'YOUR_API_KEY' && MAPS_API_KEY !== '';

  const currentViewEvent = activeLayer === 'geospatial' ? selectedGeoEvent : null;

  // Position motion values for pan boundaries
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);

  const handleZoomIn = () => {
    playDigitalSound('click');
    setScale(prev => Math.min(3, prev + 0.25));
  };

  const handleZoomOut = () => {
    playDigitalSound('click');
    setScale(prev => Math.max(0.75, prev - 0.25));
  };

  const handleZoomReset = () => {
    playDigitalSound('whir');
    setScale(1);
    panX.set(0);
    panY.set(0);
  };

  const threatColorMap = {
    CRITICAL: 'text-red-500 bg-red-500/10 border-red-500/30',
    ELEVATED: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
    STABLE: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    SECURE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  };

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full text-zinc-200">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-crimson animate-ping" />
            <span className="text-[9px] font-mono tracking-widest text-crimson uppercase font-black">TACTICAL ORBITAL SCAN</span>
          </div>
          <h1 className="text-3xl font-black font-sans uppercase tracking-tight text-white flex items-center gap-3 chromatic-aberration">
            <Compass size={28} className="text-crimson shrink-0" />
            Sector <span className="text-crimson">Tactical Maps</span>
          </h1>
          <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mt-1">
            Real-time orbital tracking mesh visualizing military borders, threat nodes, and core squad deployments
          </p>
        </div>

        {/* Layer Toggles & Zoom Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer switcher tab buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-black/50 border border-white/5 rounded-xl mr-2">
            <button
              onClick={() => {
                setActiveLayer('orbital');
                playDigitalSound('click');
              }}
              className={`text-[8.5px] font-mono font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeLayer === 'orbital' 
                  ? 'bg-crimson text-white shadow-[0_0_10px_rgba(229,9,20,0.3)] font-black border border-white/10' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              1. Orbital Grid
            </button>
            <button
              onClick={() => {
                setActiveLayer('geospatial');
                playDigitalSound('whir');
              }}
              className={`text-[8.5px] font-mono font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 border border-transparent ${
                activeLayer === 'geospatial' 
                  ? 'bg-red-950/40 border-red-500/40 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.25)]' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <span className="w-1 h-1 rounded-full bg-red-400 animate-ping" />
              2. Geospatial Node
            </button>
          </div>

          {activeLayer === 'orbital' && (
            <div className="flex items-center gap-1 bg-black/60 border border-white/5 p-1 rounded-xl">
              <button
                onClick={handleZoomIn}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Zoom In"
              >
                <ZoomIn size={14} />
              </button>
              <button
                onClick={handleZoomOut}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                title="Zoom Out"
              >
                <ZoomOut size={14} />
              </button>
              <button
                onClick={handleZoomReset}
                className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all border-l border-white/5"
                title="Reset Pan & Zoom"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left column: SVG Orbital Map OR Google Maps Geospatial Node */}
        <div className="lg:col-span-8 flex flex-col bg-carbon border border-white/5 rounded-3xl p-4 relative overflow-hidden min-h-[500px] justify-center select-none shadow-[inset_0_3px_15px_rgba(0,0,0,0.95)]">
          
          <div className="absolute top-3 left-4 text-[7px] font-mono text-zinc-500 tracking-[0.2em] uppercase select-none z-10 flex items-center gap-2">
            <span>TRACKING_MODE //</span>
            <span className="font-extrabold text-white">
              {activeLayer === 'orbital' ? 'ORBITAL MESH SCANNER' : 'LIVE NEURAL SIGNAL ATLAS'}
            </span>
          </div>

          {activeLayer === 'orbital' ? (
            <div 
              ref={mapContainerRef}
              className="w-full h-full relative flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden min-h-[440px]"
            >
              {/* Draggable Motion Wrapper */}
              <motion.div
                drag
                dragElastic={0.15}
                style={{
                  x: panX,
                  y: panY,
                  scale: scale
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                className="w-[450px] h-[450px] relative flex items-center justify-center origin-center"
              >
                {/* Radar Sweeper Rings */}
                <div className="absolute w-[95%] h-[95%] rounded-full border border-zinc-800/20 pointer-events-none" />
                <div className="absolute w-[70%] h-[70%] rounded-full border border-zinc-850/30 pointer-events-none" />
                <div className="absolute w-[45%] h-[45%] rounded-full border border-zinc-900/40 pointer-events-none animate-pulse" />

                {/* Glowing Scan Sweep sector */}
                <div 
                  className="absolute w-[90%] h-[90%] rounded-full bg-gradient-to-r from-transparent via-crimson/[0.03] to-transparent animate-spin pointer-events-none" 
                  style={{ animationDuration: '12s' }}
                />

                <svg viewBox="0 0 200 200" className="w-full h-full filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.95)] z-10">
                  {/* Sector border path structures */}
                  {/* Rain/Akatsuki Sector */}
                  <path d="M10,10 L100,10 L100,100 L10,100 Z" fill="rgba(229,9,20, 0.015)" stroke="rgba(229,9,20,0.18)" strokeWidth="0.5" strokeDasharray="2 2" />
                  {/* Stark Cold Sector */}
                  <path d="M10,100 L100,100 L100,190 L10,190 Z" fill="rgba(34,211,238, 0.015)" stroke="rgba(34,211,238,0.18)" strokeWidth="0.5" strokeDasharray="3 3" />
                  {/* Lannister Gold Sect */}
                  <path d="M100,10 L190,10 L190,100 L100,100 Z" fill="rgba(255,179,0, 0.015)" stroke="rgba(255,179,0,0.18)" strokeWidth="0.5" strokeDasharray="2 3" />
                  {/* Britannia Core */}
                  <path d="M100,100 L190,100 L190,190 L100,190 Z" fill="rgba(168,85,247, 0.015)" stroke="rgba(168,85,247,0.18)" strokeWidth="0.5" strokeDasharray="3 2" />

                  {/* Grid Grid coordinates text */}
                  <text x="30" y="30" fill="rgba(255,255,255,0.06)" fontSize="3.5" fontFamily="monospace">SEC_NW_AKATSUKI</text>
                  <text x="140" y="30" fill="rgba(255,255,255,0.06)" fontSize="3.5" fontFamily="monospace">SEC_NE_LANNISTER</text>
                  <text x="30" y="170" fill="rgba(255,255,255,0.06)" fontSize="3.5" fontFamily="monospace">SEC_SW_STARK</text>
                  <text x="140" y="170" fill="rgba(255,255,255,0.06)" fontSize="3.5" fontFamily="monospace">SEC_SE_BRITANNIA</text>

                  {/* Connection links vectors */}
                  <line x1="45" y1="52" x2="100" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="3 3" />
                  <line x1="48" y1="135" x2="100" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="3 3" />
                  <line x1="150" y1="58" x2="100" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="3 3" />
                  <line x1="145" y1="138" x2="100" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" strokeDasharray="3 3" />

                  {/* Center Mainframe Vertex */}
                  <circle cx="100" cy="100" r="4" fill="#0c0714" stroke="#ff0042" strokeWidth="1" className="animate-pulse" />
                  <circle cx="100" cy="100" r="1.5" fill="#ffffff" />

                  {/* Interactive Faction Fortresses */}
                  {TACTICAL_SECTORS.map(sec => {
                    let cx = 100;
                    let cy = 100;
                    if (sec.id === 'sec-akatsuki') { cx = 45; cy = 52; }
                    else if (sec.id === 'sec-stark') { cx = 48; cy = 135; }
                    else if (sec.id === 'sec-britannia') { cx = 145; cy = 138; }
                    else if (sec.id === 'sec-lannister') { cx = 150; cy = 58; }
                    else if (sec.id === 'sec-uzumaki') { cx = 95; cy = 76; }

                    const isSelected = selectedSector.id === sec.id;

                    return (
                      <g
                        key={sec.id}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSector(sec);
                          playDigitalSound('click');
                        }}
                      >
                        {/* Emissive pulse circle if selected */}
                        {isSelected && (
                          <circle
                            cx={cx}
                            cy={cy}
                            r="12"
                            fill="none"
                            stroke={sec.color}
                            strokeWidth="0.8"
                            className="animate-ping"
                            style={{ animationDuration: '2.5s' }}
                          />
                        )}

                        {/* Outward Ring */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r="6.5"
                          fill="rgba(4, 4, 6, 0.85)"
                          stroke={isSelected ? '#ffffff' : sec.color}
                          strokeWidth={isSelected ? '1.2' : '0.8'}
                          className="transition-all duration-300"
                        />

                        {/* Center Point */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r="2.5"
                          fill={sec.color}
                        />

                        {/* Text Label */}
                        <text
                          x={cx}
                          y={cy - 10}
                          fill={isSelected ? '#ffffff' : 'rgba(255,255,255,0.55)'}
                          fontSize="4.5"
                          fontFamily="monospace"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          textAnchor="middle"
                          className="transition-all duration-300 pointer-events-none"
                        >
                          {sec.name.split(' (')[0].toUpperCase()}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </motion.div>
            </div>
          ) : (
            <div className="w-full h-full flex-1 relative min-h-[440px] rounded-2xl overflow-hidden border border-white/5 bg-zinc-950 flex flex-col justify-stretch">
              {!hasValidMapsKey ? (
                <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto font-mono my-auto">
                  <div className="w-12 h-12 bg-red-950/20 border border-red-500/30 rounded-full flex items-center justify-center mb-4 relative shrink-0">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  </div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-2">Google Maps API Key Required</h2>
                  <p className="text-[10px] text-zinc-400 mb-6 uppercase leading-relaxed font-mono">
                    Activate the Geospatial Neural Engine Layer on the Live Atlas to track Tokyo-3, Kyoto barriers, and Fuji cores.
                  </p>
                  
                  <div className="text-left text-[9px] text-zinc-500 uppercase space-y-2 border-t border-white/5 pt-4">
                    <p className="font-extrabold text-zinc-400">// INTEGRATION COMMANDS:</p>
                    <p>1. Get an API key: <a href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" target="_blank" rel="noopener noreferrer" className="text-red-400 hover:underline inline">Google Cloud Console</a></p>
                    <p>2. Paste your API key when the <strong>"Enter your environment variable to continue"</strong> prompt shows on compilation.</p>
                    <p>3. Or manually: Open <strong>Settings</strong> (⚙️ gear icon) → <strong>Secrets</strong> → add <code>GOOGLE_MAPS_PLATFORM_KEY</code> as secret, paste token and save.</p>
                  </div>
                </div>
              ) : (
                <APIProvider apiKey={MAPS_API_KEY} version="weekly">
                  <Map
                    defaultCenter={{ lat: 35.8, lng: 137.9 }} // Center on Central Japan region covering Kyoto, Tokyo, Fuji
                    defaultZoom={6.5}
                    mapId="DARK_INDUSTRIAL_ID"
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                    style={{ width: '100%', height: '100%' }}
                    {...{
                      options: {
                        styles: DARK_INDUSTRIAL_STYLE,
                        clickableIcons: false
                      }
                    } as any}
                  >
                    {GEOSPATIAL_EVENTS.map(event => (
                      <GeospatialMarkerComponent
                        key={event.id}
                        event={event}
                        onSelect={setSelectedGeoEvent}
                        activeEventId={selectedGeoEvent?.id || null}
                      />
                    ))}
                  </Map>
                </APIProvider>
              )}
            </div>
          )}
        </div>

        {/* Right column: Selected Sector or Geospatial Node Intelligence details */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="neural-glass p-6 rounded-3xl flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/2 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-[#F2F2F5] border-b border-white/5 pb-2 flex items-center justify-between">
                <span>{currentViewEvent ? 'GEOSPATIAL INTELLIGENCE REPORT' : 'SECTOR INTELLIGENCE REPORT'}</span>
                <span className="text-zinc-500">
                  {currentViewEvent 
                    ? `COORD: ${currentViewEvent.coordinates.lat.toFixed(4)}, ${currentViewEvent.coordinates.lng.toFixed(4)}` 
                    : selectedSector.coordinates}
                </span>
              </h3>

              <div className="flex items-center gap-3 mt-1.5 min-h-[44px]">
                <span className="text-3xl filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.1)] shrink-0">
                  {currentViewEvent ? '📡' : selectedSector.sigil}
                </span>
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight line-clamp-1">
                    {currentViewEvent ? currentViewEvent.name : selectedSector.name}
                  </h4>
                  <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">
                    {currentViewEvent ? `EVENT SECURITY NODE` : selectedSector.faction}
                  </span>
                </div>
              </div>

              {/* Visual Threat Level Meter */}
              <div className="p-3 border border-white/5 bg-black/40 rounded-2xl flex items-center justify-between mt-1">
                <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertOctagon size={11} className="text-crimson" /> THREAT COEFFICIENT
                </span>
                <span className={`text-[9px] font-mono font-black px-2.5 py-0.5 rounded tracking-wide border ${
                  threatColorMap[currentViewEvent ? currentViewEvent.threatLevel : selectedSector.threatLevel]
                }`}>
                  {currentViewEvent ? currentViewEvent.threatLevel : selectedSector.threatLevel}
                </span>
              </div>

              {/* Data parameters list */}
              <div className="flex flex-col gap-2.5 font-mono text-[9.5px] mt-2">
                <div className="flex justify-between items-center py-1.5 border-b border-zinc-900">
                  <span className="text-zinc-500 uppercase flex items-center gap-1.5">
                    <Target size={11} className="text-crimson text-wrap" /> {currentViewEvent ? 'EVENT_ID CODE:' : 'STRENGTH COEFFICIENT:'}
                  </span>
                  <span className="text-white font-extrabold pr-1">
                    {currentViewEvent ? currentViewEvent.eventId : selectedSector.militaryStrength}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-zinc-900">
                  <span className="text-zinc-500 uppercase flex items-center gap-1.5">
                    <Users size={11} className="text-[#00BFFF]" /> {currentViewEvent ? 'SIGNAL INTENSITY:' : 'ACTIVE SQUAD PATROLS:'}
                  </span>
                  <span className={`${currentViewEvent ? 'text-amber-500' : 'text-[#00BFFF]'} font-black pr-1`}>
                    {currentViewEvent ? currentViewEvent.signalStrength : `${selectedSector.activeSquads} UNITS`}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 border-b border-zinc-900">
                  <span className="text-zinc-500 uppercase flex items-center gap-1.5">
                    <Shield size={11} className="text-yellow-400" /> BORDER VECTOR PROTECTION:
                  </span>
                  <span className="text-emerald-400 font-extrabold">SHA-256 SECURED</span>
                </div>
              </div>

              {/* Sector Description brief */}
              <div className="mt-2.5">
                <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-black block mb-1">
                  {currentViewEvent ? 'LIVE GEOSPATIAL ATTESTATION' : 'COSMOLOGICAL RECORD'}
                </span>
                <p className="text-xs text-zinc-400 leading-relaxed font-sans bg-black/40 p-3.5 rounded-xl border border-white/5 min-h-[75px]">
                  {currentViewEvent ? currentViewEvent.eventDetails : selectedSector.description}
                </p>
              </div>
            </div>

            {/* Bottom action trigger */}
            <button
              onClick={() => {
                playDigitalSound('ping');
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 text-white font-mono font-black text-[9px] uppercase tracking-widest rounded-xl border border-white/10 hover:border-white/20 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] mt-6 cursor-pointer"
            >
              <span>{currentViewEvent ? 'Analyze Geo Signal Frequency' : 'Initialize Holo Drone Probe Sweep'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
