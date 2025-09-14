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
import { useAppState } from '@/store/appState';

interface UnifiedCommandBarProps {
  map: mapboxgl.Map | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function UnifiedCommandBar({ map, activeTab, onTabChange }: UnifiedCommandBarProps) {
  const [boatName, setBoatName] = useState<string>('');
  const [inletDropdownOpen, setInletDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { selectedInletId, setSelectedInletId } = useAppState();
  
  useEffect(() => {
    // Get boat name from localStorage
    const storedBoatName = localStorage.getItem('abfi_boat_name');
    if (storedBoatName) {
      setBoatName(storedBoatName);
    }
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setInletDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleTabClick = (tab: string) => {
    onTabChange(tab);
  };
  
  const handleInletSelect = (inletId: string) => {
    setSelectedInletId(inletId);
    
    // Fly to inlet if map is available
    if (map) {
      const inlet = INLETS.find(i => i.id === inletId);
      if (inlet) {
        flyToInlet60nm(map, inlet);
      }
    }
  };
  
  const selectedInlet = INLETS.find(i => i.id === selectedInletId);
  const inletColor = selectedInlet?.color || null;
  
  return (
    <div className="absolute top-4 left-4 z-50 pointer-events-auto">
      <div className="relative">
      {/* Unified Command Bar - All connected with subtle separations */}
      <div className="flex items-stretch bg-gradient-to-r from-cyan-950/90 via-blue-950/90 to-cyan-950/90 backdrop-blur-xl rounded-full border border-cyan-500/20 shadow-2xl pr-2 overflow-visible"
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
          
          {/* Inlet Selector - ALWAYS VISIBLE */}
          <div className="flex items-center gap-2 min-w-[200px] relative">
            <MapPin size={14} className="text-cyan-400" />
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setInletDropdownOpen(!inletDropdownOpen)}
                className="flex items-center justify-between gap-2 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-2 border-cyan-400/60 rounded-xl px-4 py-2 text-sm text-cyan-100 focus:outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/40 cursor-pointer hover:from-slate-800 hover:via-slate-700 hover:to-slate-800 transition-all font-semibold tracking-wide"
                style={{
                  minWidth: '280px',
                  backgroundImage: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(20, 184, 166, 0.1), rgba(59, 130, 246, 0.15))',
                  boxShadow: '0 0 30px rgba(6, 182, 212, 0.3), inset 0 0 20px rgba(6, 182, 212, 0.15), 0 4px 15px rgba(0, 0, 0, 0.3)',
                  textShadow: '0 0 10px rgba(6, 182, 212, 0.3)'
                }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: selectedInlet?.color || '#26c281',
                      boxShadow: `0 0 12px ${selectedInlet?.color || '#26c281'}`,
                    }}
                  />
                  <span className="text-left truncate text-sm">
                    {selectedInlet?.name || 'Select Inlet'}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-cyan-400 transition-transform ${inletDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu - Positioned relative to the button */}
              {inletDropdownOpen && (
                <div 
                  className="absolute top-full mt-2 left-0 z-[9999] w-[280px] max-h-[320px] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border-2 border-cyan-400/40 rounded-xl shadow-2xl"
                  style={{
                    boxShadow: '0 10px 40px rgba(6, 182, 212, 0.3), 0 0 60px rgba(6, 182, 212, 0.15)'
                  }}
                >
                  {INLETS.map((inlet) => (
                    <button
                      key={inlet.id}
                      onClick={() => {
                        handleInletSelect(inlet.id);
                        setInletDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-cyan-400/10 transition-all ${
                        selectedInletId === inlet.id ? 'bg-cyan-400/20 text-cyan-300' : 'text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: inlet.color || '#26c281',
                            boxShadow: `0 0 8px ${inlet.color || '#26c281'}`,
                          }}
                        />
                        <span className="text-left truncate">{inlet.name}</span>
                      </div>
                      {selectedInletId === inlet.id && (
                        <span className="text-cyan-400 text-[10px]">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
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
    </div>
  );
}
