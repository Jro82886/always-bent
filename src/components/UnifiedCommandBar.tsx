"use client";
import { useState, useEffect, useRef } from 'react';
import { 
  Map, 
  Activity, 
  Users, 
  TrendingUp,
  ChevronDown,
  Anchor,
  MapPin
} from 'lucide-react';
import { INLETS } from '@/lib/inlets';
import { flyToInlet60nm } from '@/lib/inletBounds';
import { INLET_COLORS } from '@/lib/inletColors';

interface UnifiedCommandBarProps {
  map: mapboxgl.Map | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function UnifiedCommandBar({ map, activeTab, onTabChange }: UnifiedCommandBarProps) {
  const [boatName, setBoatName] = useState<string>('');
  const [selectedInletId, setSelectedInletId] = useState<string>('overview');
  
  useEffect(() => {
    // Get boat name and inlet from localStorage
    const storedBoatName = localStorage.getItem('abfi_boat_name');
    if (storedBoatName) {
      setBoatName(storedBoatName);
    }
    
    const storedInlet = localStorage.getItem('abfi_selected_inlet');
    if (storedInlet) {
      setSelectedInletId(storedInlet);
    }
  }, []);
  
  const handleTabClick = (tab: string) => {
    onTabChange(tab);
  };
  
  const handleInletSelect = (inletId: string) => {
    setSelectedInletId(inletId);
    localStorage.setItem('abfi_selected_inlet', inletId);
    
    // Fly to inlet if map is available
    if (map) {
      const inlet = INLETS.find(i => i.id === inletId);
      if (inlet) {
        flyToInlet60nm(map, inlet);
      }
    }
  };
  
  const selectedInlet = INLETS.find(i => i.id === selectedInletId);
  const inletColor = selectedInletId !== 'overview' 
    ? INLET_COLORS[selectedInletId as keyof typeof INLET_COLORS]?.color 
    : null;
  
  return (
    <div className="absolute top-4 left-4 z-50 pointer-events-auto">
      {/* Unified Command Bar - All connected with subtle separations */}
      <div className="flex items-stretch bg-gradient-to-r from-cyan-950/90 via-blue-950/90 to-cyan-950/90 backdrop-blur-xl rounded-full border border-cyan-500/20 shadow-2xl overflow-hidden pr-2"
           style={{
             boxShadow: '0 0 40px rgba(0, 200, 255, 0.15), inset 0 0 30px rgba(0, 200, 255, 0.05)'
           }}>
        
        {/* ALWAYS BENT Command Bridge Section */}
        <div className="flex flex-col justify-center px-6 py-3 border-r border-cyan-500/10">
          <div className="text-lg font-black text-cyan-300 tracking-wider"
               style={{ 
                 textShadow: '0 0 20px rgba(0, 200, 255, 0.5)',
                 letterSpacing: '0.15em'
               }}>
            ALWAYS BENT
          </div>
          <div className="text-[10px] text-cyan-400/70 tracking-widest uppercase">
            Command Bridge
          </div>
        </div>
        
        {/* Boat & Inlet Info */}
        <div className="flex items-center gap-4 px-4 border-r border-cyan-500/10">
          {/* Captain Info */}
          {boatName && (
            <div className="flex flex-col">
              <div className="text-xs text-cyan-100/80">
                Captain: <span className="text-cyan-300 font-semibold">{boatName}</span>
              </div>
            </div>
          )}
          
          {/* Inlet Selector - Rainbow Glow Style */}
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-cyan-400" />
            <div className="relative">
              <select
                value={selectedInletId || 'overview'}
                onChange={(e) => handleInletSelect(e.target.value)}
                className="appearance-none bg-slate-900/90 border border-cyan-500/40 rounded-lg px-3 py-1.5 pr-8 text-sm text-cyan-100 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 cursor-pointer hover:bg-slate-800/90 transition-all font-medium"
                style={{
                  minWidth: '160px',
                  backgroundImage: 'linear-gradient(to right, rgba(6, 182, 212, 0.05), rgba(20, 184, 166, 0.05))',
                  boxShadow: '0 0 20px rgba(6, 182, 212, 0.15), inset 0 0 20px rgba(6, 182, 212, 0.05)'
                }}
              >
                <optgroup label="── Overview ──" className="bg-slate-900 text-cyan-300">
                  <option value="overview" className="bg-slate-900 hover:bg-slate-800">East Coast Overview</option>
                </optgroup>
                <optgroup label="── Northern Waters ──" className="bg-slate-900 text-cyan-300">
                  {INLETS.filter(i => i.id !== 'overview' && ['montauk', 'shinnecock', 'fire-island', 'jones'].includes(i.id)).map((inlet) => (
                    <option key={inlet.id} value={inlet.id} className="bg-slate-900 hover:bg-slate-800">
                      {inlet.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="── Mid-Atlantic ──" className="bg-slate-900 text-cyan-300">
                  {INLETS.filter(i => ['manasquan', 'barnegat', 'atlantic-city', 'cape-may'].includes(i.id)).map((inlet) => (
                    <option key={inlet.id} value={inlet.id} className="bg-slate-900 hover:bg-slate-800">
                      {inlet.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="── Southern Waters ──" className="bg-slate-900 text-cyan-300">
                  {INLETS.filter(i => ['indian-river', 'ocean-city-md', 'virginia-beach', 'oregon-inlet', 'hatteras'].includes(i.id)).map((inlet) => (
                    <option key={inlet.id} value={inlet.id} className="bg-slate-900 hover:bg-slate-800">
                      {inlet.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDown size={14} className="text-cyan-400" />
              </div>
            </div>
            {inletColor && selectedInletId !== 'overview' && (
              <span 
                className="w-3 h-3 rounded-full animate-pulse"
                style={{ 
                  backgroundColor: inletColor,
                  boxShadow: `0 0 15px ${inletColor}80, 0 0 30px ${inletColor}40`
                }}
              />
            )}
          </div>
        </div>
        
        {/* Navigation Tabs - Seamlessly Connected */}
        <div className="flex items-center">
          {/* Analysis Tab */}
          <button
            onClick={() => handleTabClick('analysis')}
            className={`px-5 py-2 mx-1 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'analysis'
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                : 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent'
            }`}
            style={activeTab === 'analysis' ? {
              boxShadow: '0 0 20px rgba(0, 200, 255, 0.5), inset 0 0 10px rgba(0, 200, 255, 0.2)'
            } : {}}
          >
            <Map size={14} />
            <span>Analysis</span>
          </button>
          
          {/* Tracking Tab */}
          <button
            onClick={() => handleTabClick('tracking')}
            className={`px-5 py-2 mx-1 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'tracking'
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                : 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent'
            }`}
            style={activeTab === 'tracking' ? {
              boxShadow: '0 0 20px rgba(0, 200, 255, 0.5), inset 0 0 10px rgba(0, 200, 255, 0.2)'
            } : {}}
          >
            <Activity size={14} />
            <span>Tracking</span>
          </button>
          
          {/* Community Tab */}
          <button
            onClick={() => handleTabClick('community')}
            className={`px-5 py-2 mx-1 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'community'
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                : 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent'
            }`}
            style={activeTab === 'community' ? {
              boxShadow: '0 0 20px rgba(0, 200, 255, 0.5), inset 0 0 10px rgba(0, 200, 255, 0.2)'
            } : {}}
          >
            <Users size={14} />
            <span>Community</span>
          </button>
          
          {/* Trends Tab */}
          <button
            onClick={() => handleTabClick('trends')}
            className={`px-5 py-2 mx-1 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'trends'
                ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50'
                : 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent'
            }`}
            style={activeTab === 'trends' ? {
              boxShadow: '0 0 20px rgba(0, 200, 255, 0.5), inset 0 0 10px rgba(0, 200, 255, 0.2)'
            } : {}}
          >
            <TrendingUp size={14} />
            <span>Trends</span>
          </button>
        </div>
      </div>
    </div>
  );
}
