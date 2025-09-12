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
  Users
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
  const [showOpacityControls, setShowOpacityControls] = useState(false);
  const [currentView, setCurrentView] = useState('analysis'); // analysis | tracking | community
  
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
        
        {/* Right Section: Date First, Then Layers */}
        <div className="flex items-center gap-2">
          {/* Date Selector - FIRST for workflow */}
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
          
          {/* Layer Toggle Group - SECOND in workflow */}
          <div className="bg-black/70 backdrop-blur-md rounded-full px-2 py-1 border border-cyan-500/20 flex items-center gap-1">
            {/* Opacity Controls Toggle - MOVED TO FRONT for better discovery */}
            <button
              onClick={() => setShowOpacityControls(!showOpacityControls)}
              className={`px-2 py-1.5 rounded-full text-xs font-medium transition-all ${
                showOpacityControls
                  ? 'bg-white/20 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              title="Adjust Layer Opacity"
            >
              <Sliders size={14} />
            </button>
            
            {/* Divider line */}
            <div className="w-px h-4 bg-cyan-500/20"></div>
            
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
            </button>
            
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
            </button>
            
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
            </button>
            
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
        </div>
      </div>
      
      {/* Opacity Control Panel */}
      {showOpacityControls && (oceanActive || sstActive || chlActive) && (
        <div className="absolute top-16 right-4 bg-black/90 backdrop-blur-md rounded-lg border border-cyan-500/20 p-4 space-y-3 z-30">
          <h3 className="text-xs font-semibold text-cyan-300 mb-2">Layer Opacity</h3>
          
          {oceanActive && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-blue-300">🌊 Ocean</span>
                <span className="text-gray-400">{oceanOpacity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                value={oceanOpacity}
                onChange={(e) => updateOpacity('ocean', parseInt(e.target.value))}
                className="w-32 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${oceanOpacity}%, rgba(255,255,255,0.2) ${oceanOpacity}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
          )}
          
          {sstActive && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-300">🌡️ SST</span>
                <span className="text-gray-400">{sstOpacity}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={sstOpacity}
                onChange={(e) => updateOpacity('sst', parseInt(e.target.value))}
                className="w-32 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${sstOpacity}%, rgba(255,255,255,0.2) ${sstOpacity}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
          )}
          
          {chlActive && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-300">🌿 CHL</span>
                <span className="text-gray-400">{chlOpacity}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={chlOpacity}
                onChange={(e) => updateOpacity('chl', parseInt(e.target.value))}
                className="w-32 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #22c55e 0%, #22c55e ${chlOpacity}%, rgba(255,255,255,0.2) ${chlOpacity}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>
          )}
        </div>
      )}
      
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
