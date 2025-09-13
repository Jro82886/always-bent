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
  MapPin
} from 'lucide-react';
import SSTLegend from '@/components/SSTLegend';
import GetOrganized from '@/components/GetOrganized';

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
}

export default function LeftZone({
  oceanActive, sstActive, chlActive,
  setOceanActive, setSstActive, setChlActive,
  oceanOpacity, sstOpacity, chlOpacity,
  setOceanOpacity, setSstOpacity, setChlOpacity,
  selectedDate, setSelectedDate,
  map,
  analysisResults
}: LeftZoneProps) {
  const [showLayers, setShowLayers] = useState(true);
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [showSstOpacity, setShowSstOpacity] = useState(false);
  const [showChlOpacity, setShowChlOpacity] = useState(false);
  const [showOceanOpacity, setShowOceanOpacity] = useState(false);
  const [showSstEnhance, setShowSstEnhance] = useState(false);
  const [sstContrast, setSstContrast] = useState(50);
  const [sstSaturation, setSstSaturation] = useState(50);
  
  // Refs for click-outside detection
  const sstEnhanceRef = useRef<HTMLDivElement>(null);
  const sstOpacityRef = useRef<HTMLDivElement>(null);
  const chlOpacityRef = useRef<HTMLDivElement>(null);
  const oceanOpacityRef = useRef<HTMLDivElement>(null);
  const dateSelectorRef = useRef<HTMLDivElement>(null);
  const layersPanelRef = useRef<HTMLDivElement>(null);
  
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
    <div className="absolute left-4 top-20 z-40 pointer-events-auto w-72">
      <div className="space-y-3">
        
        {/* INTELLIGENCE HEADER */}
        <div className="bg-gradient-to-r from-cyan-950/95 to-blue-950/95 backdrop-blur-xl rounded-lg px-4 py-2.5 border border-cyan-500/20 shadow-xl">
          <h2 className="text-sm font-bold text-cyan-300 tracking-wider uppercase">OCEAN INTELLIGENCE</h2>
        </div>
        
        {/* LAYERS PANEL */}
        <div className="bg-black/80 backdrop-blur-md rounded-lg border border-cyan-500/20 overflow-hidden">
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
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => toggleLayer('sst')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    sstActive
                      ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      : 'bg-gray-800/50 text-gray-400 hover:text-gray-300 hover:bg-gray-800/70 border border-gray-700/50'
                  }`}
                >
                  <span>🌡️ SST</span>
                </button>
                {sstActive && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setShowSstOpacity(!showSstOpacity);
                        setShowSstEnhance(false);
                      }}
                      className="p-1.5 bg-black/60 rounded hover:bg-cyan-500/20 transition-colors"
                      title="Opacity"
                    >
                      <Sliders size={12} className="text-cyan-400" />
                    </button>
                    <button
                      onClick={() => {
                        setShowSstEnhance(!showSstEnhance);
                        setShowSstOpacity(false);
                      }}
                      className="p-1.5 bg-gradient-to-r from-cyan-600/60 to-blue-600/60 rounded hover:from-cyan-500/60 hover:to-blue-500/60 transition-colors"
                      title="Enhance"
                    >
                      <Sparkles size={12} className="text-white" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* SST Controls */}
              {showSstOpacity && sstActive && (
                <div ref={sstOpacityRef} className="bg-black/60 rounded-lg p-3 border border-orange-500/20">
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
                <div ref={sstEnhanceRef} className="bg-black/60 rounded-lg p-3 border border-purple-500/20 space-y-2">
                  <div className="text-xs font-bold text-purple-300 flex items-center gap-1">
                    <Sparkles size={12} /> Enhance SST
                  </div>
                  <div className="space-y-2">
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
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => toggleLayer('chl')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    chlActive
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                      : 'bg-gray-800/50 text-gray-400 hover:text-gray-300 hover:bg-gray-800/70 border border-gray-700/50'
                  }`}
                >
                  <span>🌿 CHL</span>
                </button>
                {chlActive && (
                  <button
                    onClick={() => {
                      setShowChlOpacity(!showChlOpacity);
                      setShowSstOpacity(false);
                      setShowSstEnhance(false);
                    }}
                    className="p-1.5 bg-black/60 rounded hover:bg-cyan-500/20 transition-colors"
                    title="Opacity"
                  >
                    <Sliders size={12} className="text-cyan-400" />
                  </button>
                )}
              </div>
              
              {/* CHL Opacity */}
              {showChlOpacity && chlActive && (
                <div ref={chlOpacityRef} className="bg-black/60 rounded-lg p-3 border border-green-500/20">
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
              
              {/* Ocean Basemap */}
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => toggleLayer('ocean')}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    oceanActive
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-gray-800/50 text-gray-400 hover:text-gray-300 hover:bg-gray-800/70 border border-gray-700/50'
                  }`}
                >
                  <span>🌊 Ocean</span>
                </button>
                {oceanActive && (
                  <button
                    onClick={() => {
                      setShowOceanOpacity(!showOceanOpacity);
                      setShowSstOpacity(false);
                      setShowChlOpacity(false);
                      setShowSstEnhance(false);
                    }}
                    className="p-1.5 bg-black/60 rounded hover:bg-cyan-500/20 transition-colors"
                    title="Opacity"
                  >
                    <Sliders size={12} className="text-cyan-400" />
                  </button>
                )}
              </div>
              
              {/* Ocean Opacity */}
              {showOceanOpacity && oceanActive && (
                <div ref={oceanOpacityRef} className="bg-black/60 rounded-lg p-3 border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-300">Opacity</span>
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
        </div>
        
        {/* DATE SELECTOR - Always visible, disabled when no layers active */}
        <div className={`bg-black/80 backdrop-blur-md rounded-lg border border-cyan-500/20 px-4 py-3 ${
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
        {sstActive && <SSTLegend visible={true} />}
        
        {/* POLYGONS PANEL - Integrated here */}
        <GetOrganized map={map} />
        
        {/* ANALYSIS RESULTS - Show if available */}
        {analysisResults && (
          <div className="bg-black/80 backdrop-blur-md rounded-lg border border-cyan-500/20 p-4">
            <h3 className="text-sm font-bold text-cyan-300 mb-2">Analysis Results</h3>
            <div className="text-xs text-gray-400">
              {/* Analysis results would go here */}
              Area analyzed: {analysisResults.area || 'N/A'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
