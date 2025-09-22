"use client";
import { useState, useEffect, useRef } from 'react';
import { 
  Layers, 
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  CalendarDays,
  Sliders,
  Sparkles,
  GitBranch,
  Circle,
  TrendingUp,
  Activity,
  MapPin,
  Waves,
  Thermometer,
  Leaf
} from 'lucide-react';
import PolygonsPanel from '@/components/PolygonsPanel';
import ContoursLayer from '@/components/layers/ContoursLayer';
import CHLGreenTintLayer from '@/components/layers/CHLGreenTintLayer';
// Removed CHLHighlightLayer import - replaced with Green Tint
// Removed CHLEdgesLayer import - edge detection button removed
import Tooltip from '@/components/ui/Tooltip';
import { ToggleCard } from '@/components/ui/ToggleCard';

interface LeftZoneProps {
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
  
  // Map reference
  map: mapboxgl.Map | null;
  
  // Analysis results (if any)
  analysisResults?: any;
  
  // Commercial vessels
  showCommercial?: boolean;
  setShowCommercial?: (show: boolean) => void;
}

export default function LeftZone({
  oceanActive, sstActive, chlActive,
  setOceanActive, setSstActive, setChlActive,
  oceanOpacity, sstOpacity, chlOpacity,
  setOceanOpacity, setSstOpacity, setChlOpacity,
  selectedDate, setSelectedDate,
  map,
  analysisResults,
  showCommercial = false,
  setShowCommercial
}: LeftZoneProps) {
  const [showLayers, setShowLayers] = useState(true);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [showSstOpacity, setShowSstOpacity] = useState(false);
  const [showChlOpacity, setShowChlOpacity] = useState(false);
  const [showChlEnhance, setShowChlEnhance] = useState(false);
  const [chlContrast, setChlContrast] = useState(50);
  const [chlSaturation, setChlSaturation] = useState(50);
  const [chlHue, setChlHue] = useState(0);  // Green tint intensity (0-100)
  // Removed chlEdges state - edge detection feature removed
  const [sstContours, setSstContours] = useState(false);  // Temperature contour lines
  const [showOceanOpacity, setShowOceanOpacity] = useState(false);
  const [showSstEnhance, setShowSstEnhance] = useState(false);
  const [sstContrast, setSstContrast] = useState(50);
  const [sstSaturation, setSstSaturation] = useState(50);
  
  // Refs for click-outside detection
  const sstEnhanceRef = useRef<HTMLDivElement>(null);
  const sstOpacityRef = useRef<HTMLDivElement>(null);
  const chlOpacityRef = useRef<HTMLDivElement>(null);
  const chlEnhanceRef = useRef<HTMLDivElement>(null);
  const oceanOpacityRef = useRef<HTMLDivElement>(null);
  const dateSelectorRef = useRef<HTMLDivElement>(null);
  const layersPanelRef = useRef<HTMLDivElement>(null);
  
  // Initialize green tint from localStorage
  useEffect(() => {
    const savedTint = localStorage.getItem('chl_green_tint');
    if (savedTint) {
      setChlHue(parseInt(savedTint));
    }
  }, []);
  
  // Click outside handler - Smart closing for better UX
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Close ALL sub-panels when clicking outside
      // This creates a clean, predictable experience
      
      // SST Enhancement panel
      if (showSstEnhance && sstEnhanceRef.current && !sstEnhanceRef.current.contains(target)) {
        const sparklesButton = document.querySelector('[title="Enhance"]');
        if (!sparklesButton?.contains(target)) {
          setShowSstEnhance(false);
        }
      }
      
      // SST Opacity panel
      if (showSstOpacity && sstOpacityRef.current && !sstOpacityRef.current.contains(target)) {
        // Don't close if clicking on the SST layer button itself
        const sstLayerButton = (target as HTMLElement).closest('.flex-1.px-3.py-2.rounded-lg');
        if (!sstLayerButton) {
          setShowSstOpacity(false);
        }
      }
      
      // CHL Opacity panel
      if (showChlOpacity && chlOpacityRef.current && !chlOpacityRef.current.contains(target)) {
        setShowChlOpacity(false);
      }
      
      // Ocean Opacity panel
      if (showOceanOpacity && oceanOpacityRef.current && !oceanOpacityRef.current.contains(target)) {
        setShowOceanOpacity(false);
      }
      
      // Date Selector dropdown
      if (showDateSelector && dateSelectorRef.current && !dateSelectorRef.current.contains(target)) {
        const dateButton = (target as HTMLElement).closest('[class*="hover:bg-cyan-500/10"]');
        if (!dateButton) {
          setShowDateSelector(false);
        }
      }
      
      // Close all opacity/enhance panels when clicking on any layer toggle
      // This prevents multiple panels being open at once
      const isLayerToggle = (target as HTMLElement).closest('button')?.textContent?.includes('SST') ||
                           (target as HTMLElement).closest('button')?.textContent?.includes('CHL') ||
                           (target as HTMLElement).closest('button')?.textContent?.includes('Ocean');
      
      if (isLayerToggle) {
        // Close all secondary panels when toggling layers
        setShowSstEnhance(false);
        setShowSstOpacity(false);
        setShowChlOpacity(false);
        setShowOceanOpacity(false);
      }
    };
    
    // Add event listener with slight delay to prevent immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);
    
    // Cleanup
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSstEnhance, showSstOpacity, showChlOpacity, showOceanOpacity, showDateSelector]);
  
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
  
  const anyLayerActive = oceanActive || sstActive || chlActive;
  
  return (
    <div className="absolute left-4 top-24 z-40 pointer-events-auto w-72 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
      <div className="space-y-3 pb-4">
        
        {/* OCEAN INTELLIGENCE + DATA LAYERS - Connected as one unit */}
        <div className="bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 backdrop-blur-md rounded-lg border border-cyan-400/30 overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          {/* Intelligence Header */}
          <div className="bg-gradient-to-r from-cyan-950/95 via-teal-950/95 to-cyan-900/95 px-4 py-2.5 border-b border-cyan-500/30">
            <h2 className="text-sm font-bold text-cyan-300 tracking-wider uppercase">OCEAN INTELLIGENCE</h2>
          </div>
          
          {/* Data Layers Section */}
          <button
            onClick={() => setShowLayers(!showLayers)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-cyan-500/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-cyan-400" />
              <span className="text-sm font-medium text-cyan-300">Data Layers</span>
            </div>
            {showLayers ? (
              <ChevronUp size={14} className="text-cyan-400" />
            ) : (
              <ChevronDown size={14} className="text-cyan-400" />
            )}
          </button>
          
          {showLayers && (
            <div className="px-4 pb-3 space-y-2">
              {/* SST Layer */}
              <div className="flex items-center gap-2">
                <ToggleCard
                  icon={<Thermometer size={18} className="text-orange-300 drop-shadow-[0_0_6px_rgba(251,146,60,0.8)]" />}
                  label="SST"
                  active={sstActive}
                  tone="sst"
                  onClick={() => toggleLayer('sst')}
                  rightSlot={
                    sstActive && (
                      <Tooltip content="Enhancements" side="bottom">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSstEnhance(!showSstEnhance);
                            setShowSstOpacity(false);
                            setShowChlOpacity(false);
                            setShowChlEnhance(false);
                          }}
                          className="p-1.5 bg-gradient-to-r from-cyan-600/60 to-teal-600/60 rounded hover:from-cyan-500/60 hover:to-teal-500/60 transition-colors"
                        >
                          <Sparkles size={12} className="text-white" />
                        </button>
                      </Tooltip>
                    )
                  }
                />
              </div>
              
              {/* Compact SST Temperature Legend - Only when SST is active */}
              {sstActive && (
                <div className="mt-2 ml-0.5">
                  <div className="relative w-44 h-5 rounded border border-white/15 overflow-hidden"
                       style={{
                         background: 'linear-gradient(to right, #00008B 0%, #0000FF 12%, #00BFFF 24%, #00FFFF 36%, #00FF00 48%, #ADFF2F 56%, #FFFF00 64%, #FFA500 72%, #FF4500 80%, #FF0000 88%, #DC143C 94%, #8B0000 100%)'
                       }}>
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>32°F</span>
                    <span className="ml-1">59°F</span>
                    <span className="text-red-400">86°F</span>
                  </div>
                </div>
              )}
              
              {/* SST Controls */}
              {showSstOpacity && sstActive && (
                <div ref={sstOpacityRef} className="bg-slate-700/60 rounded-lg p-3 border border-orange-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-orange-300">Opacity</span>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={sstOpacity}
                      onChange={(e) => updateOpacity('sst', parseInt(e.target.value))}
                      className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-400 w-10">{sstOpacity}%</span>
                  </div>
                </div>
              )}
              
              {showSstEnhance && sstActive && (
                <div ref={sstEnhanceRef} className="bg-slate-700/60 rounded-lg p-3 border border-purple-500/20 space-y-2">
                  <div className="text-xs font-bold text-purple-300 flex items-center gap-1">
                    <Sparkles size={12} /> SST Enhancements
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-16">Opacity</span>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={sstOpacity}
                        onChange={(e) => updateOpacity('sst', parseInt(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[10px] text-gray-400 w-8">{sstOpacity}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-16">Contrast</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sstContrast}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setSstContrast(val);
                          if (map?.getLayer('sst-lyr')) {
                            const contrastAdjust = (val - 50) / 50;
                            map.setPaintProperty('sst-lyr', 'raster-contrast', contrastAdjust);
                          }
                        }}
                        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[10px] text-gray-400 w-8">{sstContrast}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-16">Saturation</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sstSaturation}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setSstSaturation(val);
                          if (map?.getLayer('sst-lyr')) {
                            const satAdjust = (val - 50) / 50;
                            map.setPaintProperty('sst-lyr', 'raster-saturation', satAdjust);
                          }
                        }}
                        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[10px] text-gray-400 w-8">{sstSaturation}%</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* CHL Layer */}
              <div className="flex items-center gap-2">
                <ToggleCard
                  icon={<Leaf size={18} className="text-green-300 drop-shadow-[0_0_6px_rgba(34,197,94,0.8)]" />}
                  label="CHL"
                  active={chlActive}
                  tone="chl"
                  onClick={() => toggleLayer('chl')}
                  rightSlot={
                    chlActive && (
                      <Tooltip content="Enhancements" side="bottom">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowChlEnhance(!showChlEnhance);
                            setShowChlOpacity(false);
                            setShowSstOpacity(false);
                            setShowSstEnhance(false);
                          }}
                          className="p-1.5 bg-gradient-to-r from-green-600/60 to-teal-600/60 rounded hover:from-green-500/60 hover:to-teal-500/60 transition-colors"
                        >
                          <Sparkles size={12} className="text-white" />
                        </button>
                      </Tooltip>
                    )
                  }
                />
              </div>
              
              {/* CHL Opacity */}
              {showChlOpacity && chlActive && (
                <div ref={chlOpacityRef} className="bg-slate-700/60 rounded-lg p-3 border border-green-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-300">Opacity</span>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      value={chlOpacity}
                      onChange={(e) => updateOpacity('chl', parseInt(e.target.value))}
                      className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-400 w-10">{chlOpacity}%</span>
                  </div>
                </div>
              )}
              
              {/* CHL Enhancement */}
              {showChlEnhance && chlActive && (
                <div ref={chlEnhanceRef} className="bg-slate-700/60 rounded-lg p-3 border border-green-500/20 space-y-2">
                  <div className="text-xs font-bold text-green-300 flex items-center gap-1">
                    <Sparkles size={12} /> CHL Enhancements
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-16">Opacity</span>
                      <input
                        type="range"
                        min="50"
                        max="100"
                        value={chlOpacity}
                        onChange={(e) => updateOpacity('chl', parseInt(e.target.value))}
                        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[10px] text-gray-400 w-8">{chlOpacity}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-16">Contrast</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={chlContrast}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setChlContrast(val);
                          if (map?.getLayer('chl-lyr')) {
                            const contrastAdjust = (val - 50) / 50;
                            map.setPaintProperty('chl-lyr', 'raster-contrast', contrastAdjust);
                          }
                        }}
                        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[10px] text-gray-400 w-8">{chlContrast}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-16">Saturation</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={chlSaturation}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setChlSaturation(val);
                          if (map?.getLayer('chl-lyr')) {
                            const satAdjust = (val - 50) / 50;
                            map.setPaintProperty('chl-lyr', 'raster-saturation', satAdjust);
                          }
                        }}
                        className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[10px] text-gray-400 w-8">{chlSaturation}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip content="Adds a green tint proportional to chlorophyll. Keeps the base layer clear—just makes CHL easier to see." side="top">
                        <span className="text-[10px] text-green-400 w-16 cursor-help">Green Tint</span>
                      </Tooltip>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={chlHue || 0}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setChlHue(val);
                            localStorage.setItem('chl_green_tint', val.toString());
                          }}
                          className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #064e3b 0%, #10b981 50%, #34d399 100%)`
                          }}
                        />
                      <span className="text-[10px] text-green-400 w-8">{chlHue || 0}%</span>
                    </div>
                    
                    {/* DEV ONLY: Viridis Palette Test */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-3 pt-3 border-t border-green-500/20">
                        <div className="text-[10px] text-yellow-400 mb-1">⚠️ DEV TEST</div>
                        <button
                          onClick={() => {
                            if (map) {
                              const testLayer = map.getLayer('chl-test-layer');
                              const prodLayer = map.getLayer('chl-lyr');
                              
                              if (testLayer && prodLayer) {
                                const testVisible = map.getLayoutProperty('chl-test-layer', 'visibility') === 'visible';
                                
                                // Toggle visibility
                                map.setLayoutProperty('chl-test-layer', 'visibility', testVisible ? 'none' : 'visible');
                                map.setLayoutProperty('chl-lyr', 'visibility', testVisible ? 'visible' : 'none');
                                
                                console.log('[CHL] Viridis test:', testVisible ? 'OFF' : 'ON');
                              } else {
                                console.warn('[CHL] Test layer not available - probe may have failed');
                              }
                            }
                          }}
                          className="w-full px-3 py-1.5 bg-gradient-to-r from-blue-600/40 to-green-600/40 rounded text-xs font-medium text-white hover:from-blue-600/60 hover:to-green-600/60 transition-colors"
                        >
                          CHL (viridis test)
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Ocean Basemap */}
              <div className="flex items-center gap-2">
                <ToggleCard
                  icon={<Waves size={18} className="text-purple-300 drop-shadow-[0_0_6px_rgba(196,181,253,0.8)]" />}
                  label="Ocean Floor"
                  active={oceanActive}
                  tone="ocean"
                  onClick={() => toggleLayer('ocean')}
                  rightSlot={
                    oceanActive && (
                      <Tooltip content="Adjust opacity" side="bottom">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowOceanOpacity(!showOceanOpacity);
                            setShowSstOpacity(false);
                            setShowChlOpacity(false);
                            setShowSstEnhance(false);
                          }}
                          className="p-1.5 bg-slate-700/60 rounded hover:bg-cyan-500/20 transition-colors"
                        >
                          <Sliders size={12} className="text-cyan-400" />
                        </button>
                      </Tooltip>
                    )
                  }
                />
              </div>
              
              {/* Ocean Opacity */}
              {showOceanOpacity && oceanActive && (
                <div ref={oceanOpacityRef} className="bg-slate-700/60 rounded-lg p-3 border border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-300">Opacity</span>
                    <input
                      type="range"
                      min="20"
                      max="80"
                      value={oceanOpacity}
                      onChange={(e) => updateOpacity('ocean', parseInt(e.target.value))}
                      className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-xs text-gray-400 w-10">{oceanOpacity}%</span>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Weather Section */}
          <div className="border-t border-cyan-500/20 px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <Waves size={14} className="text-cyan-400" />
              <span className="text-xs font-medium text-cyan-300 uppercase tracking-wider">Weather</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Wind</span>
                <span className="text-cyan-300">12kt SE ↗</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Swell</span>
                <span className="text-cyan-300">4.2ft @ 9s</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* DATE SELECTOR - Always visible, disabled when no layers active */}
        <div className={`bg-slate-800/90 backdrop-blur-md rounded-lg border border-cyan-500/20 px-4 py-3 ${
          !anyLayerActive ? 'opacity-50' : ''
        }`}>
          <button
            onClick={() => anyLayerActive && setShowDateSelector(!showDateSelector)}
            className={`w-full flex items-center justify-between rounded transition-colors px-2 py-1 ${
              anyLayerActive ? 'hover:bg-cyan-500/10 cursor-pointer' : 'cursor-not-allowed'
            }`}
            disabled={!anyLayerActive}
          >
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className={anyLayerActive ? 'text-cyan-400' : 'text-gray-500'} />
              <span className={`text-sm font-medium ${anyLayerActive ? 'text-cyan-300' : 'text-gray-500'}`}>
                Date Selection
              </span>
            </div>
            <span className={`text-xs ${anyLayerActive ? 'text-cyan-400' : 'text-gray-500'}`}>
              {selectedDate === 'today' ? 'Today' : 
               selectedDate === 'yesterday' ? 'Yesterday' : 
               selectedDate === '2days' ? '2 Days Ago' : selectedDate}
            </span>
          </button>
          
          {showDateSelector && anyLayerActive && (
            <div ref={dateSelectorRef} className="mt-2 pt-2 border-t border-cyan-500/10 space-y-1">
              <button
                onClick={() => setSelectedDate('today')}
                className={`w-full px-3 py-2 text-xs rounded transition-colors ${
                  selectedDate === 'today' 
                    ? 'bg-cyan-500/20 text-cyan-300' 
                    : 'hover:bg-cyan-500/10 text-gray-400'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setSelectedDate('yesterday')}
                className={`w-full px-3 py-2 text-xs rounded transition-colors ${
                  selectedDate === 'yesterday' 
                    ? 'bg-cyan-500/20 text-cyan-300' 
                    : 'hover:bg-cyan-500/10 text-gray-400'
                }`}
              >
                Yesterday
              </button>
              <button
                onClick={() => setSelectedDate('2days')}
                className={`w-full px-3 py-2 text-xs rounded transition-colors ${
                  selectedDate === '2days' 
                    ? 'bg-cyan-500/20 text-cyan-300' 
                    : 'hover:bg-cyan-500/10 text-gray-400'
                }`}
              >
                2 Days Ago
              </button>
            </div>
          )}
        </div>
        
        {/* SST LEGEND - Show when SST is active */}
        
        {/* COMMERCIAL VESSELS TOGGLE - Hidden for now */}
        {false && setShowCommercial && (
          <div className="bg-slate-800/90 backdrop-blur-md rounded-lg border border-cyan-500/20 p-3 space-y-2">
            <ToggleCard
              icon={
                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="Commercial Vessels"
              active={showCommercial}
              tone="orange"
              onClick={() => setShowCommercial?.(!showCommercial)}
              rightSlot={showCommercial && <span className="text-xs text-orange-400">GFW</span>}
            />
            
            {/* Commercial Vessels Legend - Using ToggleCard for consistency */}
            {showCommercial && (
              <div className="space-y-2 pl-2">
                {/* Trawlers */}
                <ToggleCard
                  icon={<div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-orange-500" />}
                  label="Trawlers"
                  tone="orange"
                  disabled
                />
                
                {/* Longliners */}
                <ToggleCard
                  icon={<div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-purple-500" />}
                  label="Longliners"
                  tone="orange"
                  disabled
                />
                
                {/* Drifting Gear */}
                <ToggleCard
                  icon={<div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[7px] border-l-transparent border-r-transparent border-b-yellow-500" />}
                  label="Drifting Gear"
                  tone="orange"
                  disabled
                />
                
                {/* Info */}
                <p className="text-[10px] text-orange-300/70 pl-4 pt-1">
                  Global Fishing Watch data
                </p>
              </div>
            )}
          </div>
        )}
        
        {/* POLYGONS PANEL */}
        <PolygonsPanel map={map} />
        
        {/* ANALYSIS RESULTS - Show if available */}
        {analysisResults && (
          <div className="bg-slate-800/90 backdrop-blur-md rounded-lg border border-cyan-500/20 p-4">
            <h3 className="text-sm font-bold text-cyan-300 mb-2">Analysis Results</h3>
            <div className="text-xs text-gray-400">
              {/* Analysis results would go here */}
              Area analyzed: {analysisResults.area || 'N/A'}
            </div>
          </div>
        )}
      </div>
      
      {/* Render edge detection layers */}
      {sstContours && map && <ContoursLayer map={map} enabled={sstContours} />}
      {/* CHL Green Tint Layer - Value-weighted green overlay */}
      {chlActive && map && <CHLGreenTintLayer map={map} enabled={chlHue > 0} intensity={chlHue} />}
    </div>
  );
}
