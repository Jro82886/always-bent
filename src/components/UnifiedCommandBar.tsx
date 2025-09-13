"use client";
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
}

export default function UnifiedCommandBar({ map }: UnifiedCommandBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [boatName, setBoatName] = useState<string>('');
  const [selectedInletId, setSelectedInletId] = useState<string>('overview');
  const [showInletDropdown, setShowInletDropdown] = useState(false);
  
  // Determine active tab from pathname
  const activeTab = pathname?.includes('tracking') ? 'tracking' 
                  : pathname?.includes('community') ? 'community'
                  : pathname?.includes('trends') ? 'trends'
                  : 'analysis';
  
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
    switch(tab) {
      case 'tracking':
        router.push('/tracking');
        break;
      case 'community':
        router.push('/community');
        break;
      case 'trends':
        router.push('/trends');
        break;
      default:
        router.push('/legendary');
    }
  };
  
  const handleInletSelect = (inletId: string) => {
    setSelectedInletId(inletId);
    setShowInletDropdown(false);
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
      <div className="flex items-stretch bg-gradient-to-r from-cyan-950/90 via-blue-950/90 to-cyan-950/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl overflow-hidden"
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
        <div className="flex items-center px-4 border-r border-cyan-500/10">
          <div className="flex flex-col">
            {boatName && (
              <div className="text-xs text-cyan-100/80">
                Captain: <span className="text-cyan-300 font-semibold">{boatName}</span>
              </div>
            )}
            {/* Inlet Selector */}
            <div className="relative">
              <button
                onClick={() => setShowInletDropdown(!showInletDropdown)}
                className="flex items-center gap-1.5 text-xs text-cyan-300/90 hover:text-cyan-200 transition-colors mt-1"
              >
                <MapPin size={10} />
                <span className="font-medium">
                  {selectedInlet?.name || 'Select Inlet'}
                </span>
                {inletColor && (
                  <span 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: inletColor }}
                  />
                )}
                <ChevronDown size={10} />
              </button>
              
              {/* Inlet Dropdown */}
              {showInletDropdown && (
                <div className="absolute top-full mt-2 left-0 bg-black/95 backdrop-blur-md rounded-lg border border-cyan-500/20 p-2 min-w-[220px] max-h-[400px] overflow-y-auto z-50 shadow-2xl">
                  {INLETS.map((inlet) => (
                    <button
                      key={inlet.id}
                      onClick={() => handleInletSelect(inlet.id)}
                      className={`w-full px-3 py-2 text-left text-xs rounded hover:bg-cyan-500/20 transition-colors flex items-center gap-2 ${
                        selectedInletId === inlet.id ? 'bg-cyan-500/10 text-cyan-300' : 'text-gray-400 hover:text-cyan-200'
                      }`}
                    >
                      {inlet.id !== 'overview' && (
                        <span 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: INLET_COLORS[inlet.id as keyof typeof INLET_COLORS]?.color || '#00ffff' }}
                        />
                      )}
                      <span>{inlet.name}</span>
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
            className={`px-5 py-3 text-sm font-medium transition-all flex items-center gap-2 border-r border-cyan-500/10 ${
              activeTab === 'analysis'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-inner'
                : 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10'
            }`}
          >
            <Map size={14} />
            <span>Analysis</span>
          </button>
          
          {/* Tracking Tab */}
          <button
            onClick={() => handleTabClick('tracking')}
            className={`px-5 py-3 text-sm font-medium transition-all flex items-center gap-2 border-r border-cyan-500/10 ${
              activeTab === 'tracking'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-inner'
                : 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10'
            }`}
          >
            <Activity size={14} />
            <span>Tracking</span>
          </button>
          
          {/* Community Tab */}
          <button
            onClick={() => handleTabClick('community')}
            className={`px-5 py-3 text-sm font-medium transition-all flex items-center gap-2 border-r border-cyan-500/10 ${
              activeTab === 'community'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-inner'
                : 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10'
            }`}
          >
            <Users size={14} />
            <span>Community</span>
          </button>
          
          {/* Trends Tab */}
          <button
            onClick={() => handleTabClick('trends')}
            className={`px-5 py-3 text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'trends'
                ? 'bg-cyan-500/20 text-cyan-300 shadow-inner'
                : 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10'
            }`}
          >
            <TrendingUp size={14} />
            <span>Trends</span>
          </button>
        </div>
      </div>
    </div>
  );
}
