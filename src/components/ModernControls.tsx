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
  Calendar,
  Sliders,
  MapPin,
  Users,
  Sparkles
} from 'lucide-react';

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
  
  // Enhancement settings for SST
  const [sstSmoothing, setSstSmoothing] = useState(0); // 0-2 pixels blur
  const [sstBrightness, setSstBrightness] = useState(100); // 100-150%
  const [sstSaturation, setSstSaturation] = useState(100); // 100-200%
  const [sstContrast, setSstContrast] = useState(100); // 100-150%
  
  useEffect(() => {
    // Check location permission status
    const enabled = localStorage.getItem('abfi_location_enabled') === 'true';
    setLocationEnabled(enabled);
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
          {/* Logo */}
          <div className="bg-black/70 backdrop-blur-md rounded-full px-4 py-2 border border-cyan-500/20">
            <h1 className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              ALWAYS BENT
            </h1>
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
                      className="absolute -top-1 -right-5 w-4 h-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center hover:from-purple-500 hover:to-pink-500 transition-all"
                      title="Enhance SST visualization"
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
                    
                    {/* Smoothing */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">Smoothing</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={sstSmoothing}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setSstSmoothing(val);
                            // Smoothing via blur is challenging on raster layers
                            // We'll use contrast adjustment to simulate smoothing
                            if (map?.getLayer('sst-lyr')) {
                              // Lower contrast = smoother appearance
                              const smoothContrast = val > 0 ? -val * 0.1 : 0;
                              map.setPaintProperty('sst-lyr', 'raster-contrast', smoothContrast);
                            }
                          }}
                          className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] text-gray-400 w-8">{sstSmoothing.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    {/* Brightness */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">Brightness</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="100"
                          max="150"
                          value={sstBrightness}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setSstBrightness(val);
                            if (map?.getLayer('sst-lyr')) {
                              // Mapbox uses brightness values from -1 to 1
                              // 100% = 0, 150% = 0.5
                              const brightAdjust = (val - 100) / 100;
                              map.setPaintProperty('sst-lyr', 'raster-brightness-min', Math.max(0, brightAdjust));
                              map.setPaintProperty('sst-lyr', 'raster-brightness-max', Math.min(1, 1 + brightAdjust));
                            }
                          }}
                          className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] text-gray-400 w-8">{sstBrightness}%</span>
                      </div>
                    </div>
                    
                    {/* Saturation */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400">Color Vibrance</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="100"
                          max="200"
                          value={sstSaturation}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setSstSaturation(val);
                            if (map?.getLayer('sst-lyr')) {
                              // Mapbox saturation: -1 (grayscale) to 1 (double saturation)
                              // 100% = 0, 200% = 1
                              const satAdjust = (val - 100) / 100;
                              map.setPaintProperty('sst-lyr', 'raster-saturation', satAdjust);
                            }
                          }}
                          className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] text-gray-400 w-8">{sstSaturation}%</span>
                      </div>
                    </div>
                    
                    {/* Reset Button */}
                    <button
                      onClick={() => {
                        setSstSmoothing(0);
                        setSstBrightness(100);
                        setSstSaturation(100);
                        setSstContrast(100);
                        if (map?.getLayer('sst-lyr')) {
                          // Reset all paint properties to defaults
                          map.setPaintProperty('sst-lyr', 'raster-contrast', -0.02);
                          map.setPaintProperty('sst-lyr', 'raster-brightness-min', 0);
                          map.setPaintProperty('sst-lyr', 'raster-brightness-max', 1);
                          map.setPaintProperty('sst-lyr', 'raster-saturation', 0.02);
                        }
                      }}
                      className="w-full px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-[10px] rounded transition-colors"
                    >
                      Reset
                    </button>
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
                  toast.innerHTML = '✨ Custom ABFI layers coming soon! The chef\'s special composite view is in development...';
                  document.body.appendChild(toast);
                  setTimeout(() => toast.remove(), 4000);
                }}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-gradient-to-r from-purple-600/20 to-cyan-600/20 text-purple-300 border border-purple-500/30 opacity-70 hover:opacity-100 hover:from-purple-600/30 hover:to-cyan-600/30 relative overflow-hidden"
                style={{
                  animation: 'shimmer 3s infinite',
                  backgroundSize: '200% 100%'
                }}
                title="ABFI Custom Composite Layer - Coming Soon!"
              >
                <span className="relative z-10">⭐ ABFI</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
              </button>
              
              {/* Hover tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-48">
                <div className="bg-purple-900/90 text-white text-xs rounded-lg px-3 py-2">
                  <div className="font-bold text-purple-300 mb-1">🌟 Chef's Special</div>
                  <div className="text-[10px] leading-relaxed">
                    Custom composite layers curated by Captain Jeff. Multiple data sources in one view!
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-purple-900/90"></div>
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
              <Calendar size={14} />
              {selectedDate === 'today' ? '📅 Today' : selectedDate === 'yesterday' ? '📅 Yesterday' : '📅 2 Days Ago'}
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
