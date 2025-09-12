"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Map, 
  Layers, 
  Navigation, 
  MessageCircle, 
  Settings,
  ChevronDown,
  Eye,
  EyeOff,
  CalendarDays,
  Sliders,
  MapPin,
  Users,
  Sparkles,
  Anchor
} from 'lucide-react';
import { INLETS } from '@/lib/inlets';
import { flyToInlet60nm } from '@/lib/inletBounds';
import { INLET_COLORS } from '@/lib/inletColors';

interface ModernControlsProps {
  // Layer states
  oceanActive: boolean;
  sstActive: boolean;
  chlActive: boolean;
  setOceanActive: (active: boolean) => void;
  setSstActive: (active: boolean) => void;
  setChlActive: (active: boolean) => void;
  
  // Opacity controls
  oceanOpacity: number;
  sstOpacity: number;
  chlOpacity: number;
  setOceanOpacity: (opacity: number) => void;
  setSstOpacity: (opacity: number) => void;
  setChlOpacity: (opacity: number) => void;
  
  // Date control
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  
  // Map reference for layer control
  map: mapboxgl.Map | null;
}

export default function ModernControls({
  oceanActive, sstActive, chlActive,
  setOceanActive, setSstActive, setChlActive,
  oceanOpacity, sstOpacity, chlOpacity,
  setOceanOpacity, setSstOpacity, setChlOpacity,
  selectedDate, setSelectedDate,
  map
}: ModernControlsProps) {
  const router = useRouter();
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [currentView, setCurrentView] = useState('analysis'); // analysis | tracking | community
  const [showOceanOpacity, setShowOceanOpacity] = useState(false);
  const [showSstOpacity, setShowSstOpacity] = useState(false);
  const [showChlOpacity, setShowChlOpacity] = useState(false);
  const [showSstEnhance, setShowSstEnhance] = useState(false);
  const [boatName, setBoatName] = useState<string>('');
  const [selectedInletId, setSelectedInletId] = useState<string>('overview');
  const [showInletDropdown, setShowInletDropdown] = useState(false);
  
  // Enhancement settings for SST
  const [sstSmoothing, setSstSmoothing] = useState(0); // 0-2 pixels blur
  const [sstBrightness, setSstBrightness] = useState(100); // 100-150%
  const [sstSaturation, setSstSaturation] = useState(50); // 0-100% where 50 is normal
  const [sstContrast, setSstContrast] = useState(50); // 0-100% where 50 is normal
  
  useEffect(() => {
    // Check location permission status and boat name
    const enabled = localStorage.getItem('abfi_location_enabled') === 'true';
    setLocationEnabled(enabled);
    
    const storedBoatName = localStorage.getItem('abfi_boat_name');
    if (storedBoatName) {
      setBoatName(storedBoatName);
    }
  }, []);
  
  const handleViewChange = (view: string) => {
    setCurrentView(view);
    if (view === 'tracking') {
      router.push('/tracking');
    } else if (view === 'community') {
      router.push('/community');
    } else {
      router.push('/legendary');
    }
  };
  
  const toggleLayer = (layer: 'ocean' | 'sst' | 'chl') => {
    if (layer === 'ocean') {
      const newState = !oceanActive;
      setOceanActive(newState);
      if (map?.getLayer('ocean-layer')) {
        map.setLayoutProperty('ocean-layer', 'visibility', newState ? 'visible' : 'none');
      }
    } else if (layer === 'sst') {
      setSstActive(!sstActive);
    } else if (layer === 'chl') {
      const newState = !chlActive;
      setChlActive(newState);
      if (map?.getLayer('chl-lyr')) {
        map.setLayoutProperty('chl-lyr', 'visibility', newState ? 'visible' : 'none');
      }
    }
  };
  
  const updateOpacity = (layer: string, opacity: number) => {
    if (layer === 'ocean' && map?.getLayer('ocean-layer')) {
      setOceanOpacity(opacity);
      map.setPaintProperty('ocean-layer', 'raster-opacity', opacity / 100);
    } else if (layer === 'sst' && map?.getLayer('sst-lyr')) {
      setSstOpacity(opacity);
      map.setPaintProperty('sst-lyr', 'raster-opacity', opacity / 100);
    } else if (layer === 'chl' && map?.getLayer('chl-lyr')) {
      setChlOpacity(opacity);
      map.setPaintProperty('chl-lyr', 'raster-opacity', opacity / 100);
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-40">
        {/* Left Section: Logo and Main Navigation */}
        <div className="flex items-center gap-2">
          {/* Command Center Identity with Inlet Selector */}
          <div className="bg-black/70 backdrop-blur-md rounded-full px-6 py-3 border border-cyan-500/20">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h1 className="text-lg font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent tracking-wide">
                  ALWAYS BENT
                </h1>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-cyan-400/70 font-medium uppercase tracking-wider">
                    Command Bridge
                  </span>
                  {boatName && (
                    <>
                      <span className="text-cyan-500/40">|</span>
                      <span className="text-xs font-semibold text-cyan-300">
                        F/V {boatName}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Inlet Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowInletDropdown(!showInletDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-full transition-colors border border-cyan-500/20"
                >
                  <Anchor size={12} className="text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-300">
                    {INLETS.find(i => i.id === selectedInletId)?.name || 'Select Inlet'}
                  </span>
                  {selectedInletId !== 'overview' && (
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: INLET_COLORS[selectedInletId as keyof typeof INLET_COLORS]?.color || '#00ffff' }}
                    />
                  )}
                  <ChevronDown size={12} className="text-cyan-400" />
                </button>
                
                {/* Inlet Dropdown */}
                {showInletDropdown && (
                  <div className="absolute top-full mt-2 left-0 bg-black/90 backdrop-blur-md rounded-lg border border-cyan-500/20 p-2 min-w-[200px] max-h-[400px] overflow-y-auto z-50">
                    {INLETS.map((inlet) => (
                      <button
                        key={inlet.id}
                        onClick={() => {
                          setSelectedInletId(inlet.id);
                          setShowInletDropdown(false);
                          // Store in localStorage for persistence
                          localStorage.setItem('abfi_selected_inlet', inlet.id);
                          // Fly to inlet with 60nm view
                          if (map) {
                            flyToInlet60nm(map, inlet);
                          }
                        }}
                        className={`w-full px-3 py-2 text-left text-xs rounded hover:bg-cyan-500/20 transition-colors flex items-center gap-2 ${
                          selectedInletId === inlet.id ? 'bg-cyan-500/10 text-cyan-300' : 'text-gray-400'
                        }`}
                      >
                        {inlet.id !== 'overview' && (
                          <span 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: INLET_COLORS[inlet.id as keyof typeof INLET_COLORS]?.color || '#00ffff' }}
                          />
                        )}
                        <span className={inlet.isOverview ? 'font-semibold' : ''}>
                          {inlet.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Main Navigation Pills */}
          <div className="bg-black/70 backdrop-blur-md rounded-full px-1 py-1 border border-cyan-500/20 flex items-center">
            <button
              onClick={() => handleViewChange('analysis')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                currentView === 'analysis'
                  ? 'bg-cyan-500/30 text-cyan-300 shadow-inner shadow-cyan-500/50'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Map size={14} />
              Analysis
            </button>
            
            {locationEnabled ? (
              <button
                onClick={() => handleViewChange('tracking')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  currentView === 'tracking'
                    ? 'bg-cyan-500/30 text-cyan-300 shadow-inner shadow-cyan-500/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Navigation size={14} />
                Tracking
              </button>
            ) : (
              <button
                onClick={() => handleViewChange('community')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                  currentView === 'community'
                    ? 'bg-cyan-500/30 text-cyan-300 shadow-inner shadow-cyan-500/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Users size={14} />
                Community
              </button>
            )}
            
            <button
              className="px-4 py-1.5 rounded-full text-xs font-medium text-gray-600 cursor-not-allowed flex items-center gap-1.5"
              title="Coming Soon"
            >
              <MessageCircle size={14} />
              Chat
            </button>
          </div>
        </div>
        
        {/* Right Section: Layers First, Then Date */}
        <div className="flex items-center gap-2">
          {/* Layer Toggle Group - FIRST to show available layers */}
          <div className="bg-black/70 backdrop-blur-md rounded-full px-2 py-1 border border-cyan-500/20 flex items-center gap-1">
            <div className="relative">
              <button
                onClick={() => toggleLayer('ocean')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  oceanActive
                    ? 'bg-blue-500/30 text-blue-300 shadow-inner shadow-blue-500/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                style={oceanActive ? {
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 10px rgba(59, 130, 246, 0.3)'
                } : {}}
                title="Ocean Basemap (Bathymetry)"
              >
                🌊 Ocean
                {oceanActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOceanOpacity(!showOceanOpacity);
                      setShowSstOpacity(false);
                      setShowChlOpacity(false);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-black/80 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    title="Adjust Ocean opacity"
                  >
                    <Sliders size={10} className="text-white" />
                  </button>
                )}
              </button>
              
              {/* Ocean Opacity Popup */}
              {showOceanOpacity && oceanActive && (
                <div className="absolute top-full mt-2 left-0 bg-black/90 backdrop-blur-md rounded-lg border border-blue-500/30 p-3 z-50">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-300 text-xs">🌊</span>
                    <input
                      type="range"
                      min="20"
                      max="80"
                      value={oceanOpacity}
                      onChange={(e) => updateOpacity('ocean', parseInt(e.target.value))}
                      className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${oceanOpacity}%, rgba(255,255,255,0.2) ${oceanOpacity}%, rgba(255,255,255,0.2) 100%)`
                      }}
                    />
                    <span className="text-gray-400 text-xs">{oceanOpacity}%</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button
                onClick={() => toggleLayer('sst')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  sstActive
                    ? 'bg-orange-500/30 text-orange-300 shadow-inner shadow-orange-500/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                style={sstActive ? {
                  boxShadow: '0 0 20px rgba(251, 146, 60, 0.5), inset 0 0 10px rgba(251, 146, 60, 0.3)'
                } : {}}
                title="Sea Surface Temperature"
              >
                🌡️ SST
                {sstActive && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSstOpacity(!showSstOpacity);
                        setShowOceanOpacity(false);
                        setShowChlOpacity(false);
                        setShowSstEnhance(false);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-black/80 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                      title="Adjust SST opacity"
                    >
                      <Sliders size={10} className="text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSstEnhance(!showSstEnhance);
                        setShowSstOpacity(false);
                        setShowOceanOpacity(false);
                        setShowChlOpacity(false);
                      }}
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full flex items-center justify-center hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg"
                      title="Enhance SST contrast"
                    >
                      <Sparkles size={10} className="text-white" />
                    </button>
                  </>
                )}
              </button>
              
              {/* SST Opacity Popup */}
              {showSstOpacity && sstActive && (
                <div className="absolute top-full mt-2 left-0 bg-black/90 backdrop-blur-md rounded-lg border border-orange-500/30 p-3 z-50">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-300 text-xs">🌡️</span>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={sstOpacity}
                      onChange={(e) => updateOpacity('sst', parseInt(e.target.value))}
                      className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #f97316 0%, #f97316 ${sstOpacity}%, rgba(255,255,255,0.2) ${sstOpacity}%, rgba(255,255,255,0.2) 100%)`
                      }}
                    />
                    <span className="text-gray-400 text-xs">{sstOpacity}%</span>
                  </div>
                </div>
              )}
              
              {/* SST Enhancement Popup */}
              {showSstEnhance && sstActive && (
                <div className="absolute top-full mt-2 left-0 bg-black/90 backdrop-blur-md rounded-lg border border-purple-500/30 p-4 z-50 min-w-[200px]">
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1">
                      <Sparkles size={12} /> Enhance SST
                    </h4>
                    
                    {/* Contrast - MAIN CONTROL for clarity */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">Contrast (Edge Definition)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sstContrast}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setSstContrast(val);
                            if (map?.getLayer('sst-lyr')) {
                              // Mapbox contrast: -1 to 1, where 0 is normal
                              // We want 0-100 slider where 50 is normal
                              const contrastAdjust = (val - 50) / 50; // -1 to 1
                              map.setPaintProperty('sst-lyr', 'raster-contrast', contrastAdjust);
                            }
                          }}
                          className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] text-gray-400 w-8">{sstContrast}%</span>
                      </div>
                    </div>
                    
                    {/* Saturation - Make colors POP */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">Color Intensity</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sstSaturation}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setSstSaturation(val);
                            if (map?.getLayer('sst-lyr')) {
                              // Mapbox saturation: -1 (grayscale) to 1 (double saturation)
                              // 0-100 slider where 50 is normal
                              const satAdjust = (val - 50) / 50;
                              map.setPaintProperty('sst-lyr', 'raster-saturation', satAdjust);
                            }
                          }}
                          className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] text-gray-400 w-8">{sstSaturation}%</span>
                      </div>
                    </div>
                    
                    {/* Quick Presets */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          // High contrast for edges
                          setSstContrast(80);
                          setSstSaturation(70);
                          if (map?.getLayer('sst-lyr')) {
                            map.setPaintProperty('sst-lyr', 'raster-contrast', 0.6);
                            map.setPaintProperty('sst-lyr', 'raster-saturation', 0.4);
                          }
                        }}
                        className="flex-1 px-2 py-1 bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 text-[10px] rounded transition-colors"
                      >
                        🎯 Edges
                      </button>
                      <button
                        onClick={() => {
                          // Smooth for gradients
                          setSstContrast(30);
                          setSstSaturation(60);
                          if (map?.getLayer('sst-lyr')) {
                            map.setPaintProperty('sst-lyr', 'raster-contrast', -0.4);
                            map.setPaintProperty('sst-lyr', 'raster-saturation', 0.2);
                          }
                        }}
                        className="flex-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-[10px] rounded transition-colors"
                      >
                        🌊 Smooth
                      </button>
                      <button
                        onClick={() => {
                          setSstContrast(50);
                          setSstSaturation(50);
                          if (map?.getLayer('sst-lyr')) {
                            map.setPaintProperty('sst-lyr', 'raster-contrast', 0);
                            map.setPaintProperty('sst-lyr', 'raster-saturation', 0);
                          }
                        }}
                        className="flex-1 px-2 py-1 bg-gray-600/20 hover:bg-gray-600/30 text-gray-300 text-[10px] rounded transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <button
                onClick={() => toggleLayer('chl')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  chlActive
                    ? 'bg-green-500/30 text-green-300 shadow-inner shadow-green-500/50'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
                style={chlActive ? {
                  boxShadow: '0 0 20px rgba(34, 197, 94, 0.5), inset 0 0 10px rgba(34, 197, 94, 0.3)'
                } : {}}
                title="Chlorophyll Concentration"
              >
                🌿 CHL
                {chlActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChlOpacity(!showChlOpacity);
                      setShowOceanOpacity(false);
                      setShowSstOpacity(false);
                    }}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-black/80 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
                    title="Adjust CHL opacity"
                  >
                    <Sliders size={10} className="text-white" />
                  </button>
                )}
              </button>
              
              {/* CHL Opacity Popup */}
              {showChlOpacity && chlActive && (
                <div className="absolute top-full mt-2 left-0 bg-black/90 backdrop-blur-md rounded-lg border border-green-500/30 p-3 z-50">
                  <div className="flex items-center gap-2">
                    <span className="text-green-300 text-xs">🌿</span>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={chlOpacity}
                      onChange={(e) => updateOpacity('chl', parseInt(e.target.value))}
                      className="w-24 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #22c55e 0%, #22c55e ${chlOpacity}%, rgba(255,255,255,0.2) ${chlOpacity}%, rgba(255,255,255,0.2) 100%)`
                      }}
                    />
                    <span className="text-gray-400 text-xs">{chlOpacity}%</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* ABFI Custom Layer - COMING SOON TEASER */}
            <div className="relative group">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  // Show teaser message
                  const toast = document.createElement('div');
                  toast.className = 'fixed top-20 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-6 py-3 rounded-full shadow-2xl z-50 animate-slide-down';
                  toast.innerHTML = 'Custom ABFI layers coming soon! The Captain\'s composite view is in development...';
                  document.body.appendChild(toast);
                  setTimeout(() => toast.remove(), 4000);
                }}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-gradient-to-r from-cyan-600/20 to-blue-600/20 text-cyan-300 border border-cyan-500/30 opacity-70 hover:opacity-100 hover:from-cyan-600/30 hover:to-blue-600/30"
                title="ABFI Custom Composite Layer - Coming Soon!"
              >
                <span className="relative z-10">ABFI</span>
              </button>
              
              {/* Hover tooltip - positioned below to avoid cutoff */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-48 z-50">
                <div className="bg-black/90 backdrop-blur-md text-white text-xs rounded-lg px-3 py-2 border border-cyan-500/30">
                  <div className="font-bold text-cyan-300 mb-1">Captain's Intelligence</div>
                  <div className="text-[10px] leading-relaxed text-cyan-100/80">
                    AI-powered composite layers. Multiple data sources analyzed for optimal fishing intelligence.
                  </div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45 w-2 h-2 bg-black/90 border-t border-l border-cyan-500/30"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Date Selector - AFTER layers for better workflow */}
          <div className="relative">
            <button
              onClick={() => setShowLayerPanel(!showLayerPanel)}
              className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-md rounded-full px-4 py-1.5 border border-purple-500/30 text-xs text-purple-300 font-medium flex items-center gap-1.5"
            >
              <CalendarDays size={14} />
              {selectedDate === 'today' ? 'Today' : selectedDate === 'yesterday' ? 'Yesterday' : '2 Days Ago'}
              <ChevronDown size={14} />
            </button>
            
            {showLayerPanel && (
              <div className="absolute top-full mt-2 right-0 bg-black/90 backdrop-blur-md rounded-lg border border-cyan-500/20 p-2 min-w-[150px]">
                {['today', 'yesterday', '2days'].map((date) => (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      setShowLayerPanel(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs rounded hover:bg-white/10 transition-colors ${
                      selectedDate === date ? 'text-cyan-300' : 'text-gray-400'
                    }`}
                  >
                    {date === 'today' ? 'Today' : date === 'yesterday' ? 'Yesterday' : '2 Days Ago'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Location Permission Prompt (if not set) */}
      {currentView === 'analysis' && locationEnabled === false && (
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-md rounded-full px-6 py-3 border border-yellow-400/30 z-30">
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-white" />
            <div className="text-white text-sm">
              <p className="font-semibold">Enable location for tracking features</p>
              <p className="text-xs opacity-90">Track your boat and share with crew</p>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('abfi_location_enabled', 'true');
                setLocationEnabled(true);
                window.location.reload();
              }}
              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-semibold transition-colors"
            >
              Enable
            </button>
          </div>
        </div>
      )}
    </>
  );
}
