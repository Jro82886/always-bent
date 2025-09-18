'use client';

import { useState, useEffect } from 'react';
import { 
  Maximize2, Target, Layers, Map, Wifi, WifiOff, 
  Thermometer, Waves, Wind, Clock, ChevronDown,
  Navigation, TrendingUp, Activity
} from 'lucide-react';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';
import SnipTool from '@/components/SnipTool';
import type mapboxgl from 'mapbox-gl';
import type { AnalysisResult } from '@/lib/analysis/sst-analyzer';

interface UnifiedToolbarProps {
  map: mapboxgl.Map | null;
}

export default function UnifiedToolbar({ map }: UnifiedToolbarProps) {
  const { selectedInletId, activeRaster, setActiveRaster } = useAppState();
  const [connectionMode, setConnectionMode] = useState<'online' | 'offline'>('online');
  const [snipActive, setSnipActive] = useState(false);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;

  // Monitor online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setConnectionMode(navigator.onLine ? 'online' : 'offline');
    };
    
    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleAnalysisComplete = (analysis: AnalysisResult) => {
    console.log('Analysis complete:', analysis);
    setSnipActive(false);
  };

  // Mock weather data - replace with actual API
  const weatherData = {
    waves: { height: 3.0, period: 11, direction: 36 },
    water: { temp: 85 },
    wind: { speed: 8, direction: 'NE' },
    conditions: 'EXCELLENT',
    description: 'Light chop • Good water temp'
  };

  return (
    <div className="absolute left-4 top-20 z-[100] pointer-events-auto">
      <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-cyan-500/20 shadow-2xl overflow-hidden">
        {/* Connection Status Bar */}
        <div className="flex items-center justify-between px-3 py-2 bg-black/40 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-gray-400">CONNECTION MODE</span>
          </div>
          <div className="flex items-center gap-2">
            {connectionMode === 'online' ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="text-xs text-emerald-400 font-medium">ONLINE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-400" />
                <span className="text-xs text-red-400 font-medium">OFFLINE</span>
              </>
            )}
          </div>
        </div>

        {/* Main Toolbar */}
        <div className="p-3 space-y-3">
          {/* Mode Selection */}
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-medium">
              <Navigation className="w-3 h-3" />
              LEAD FINDER
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 text-gray-400 text-xs hover:text-white transition-colors">
              <Activity className="w-3 h-3" />
              Ocean Analysis
            </button>
          </div>

          {/* Map Controls */}
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">MAP LAYERS</div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setActiveRaster(activeRaster === 'sst' ? null : 'sst')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
                  activeRaster === 'sst' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-400/40' 
                    : 'bg-black/40 text-gray-400 border border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-orange-500" />
                SST Breaks
              </button>
              
              <button 
                onClick={() => setActiveRaster(activeRaster === 'chl' ? null : 'chl')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
                  activeRaster === 'chl' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40' 
                    : 'bg-black/40 text-gray-400 border border-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                Chlorophyll Edge
              </button>

              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-black/40 text-gray-400 border border-white/10 hover:border-white/20">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                Hotspots
              </button>

              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-black/40 text-gray-400 border border-white/10 hover:border-white/20">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Recent Catches
              </button>

              <button className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-black/40 text-gray-400 border border-white/10 hover:border-white/20">
                <div className="w-2 h-2 rounded-full bg-purple-500" />
                Community Reports
              </button>
            </div>
          </div>

          {/* Snip Tool Integration */}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => setSnipActive(!snipActive)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                snipActive 
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40' 
                  : 'bg-black/40 text-gray-300 border border-white/10 hover:border-cyan-400/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span className="text-xs font-medium">Snip & Analyze Area</span>
              </div>
              {snipActive && <span className="text-[10px] bg-cyan-400/20 px-2 py-0.5 rounded">ACTIVE</span>}
            </button>
          </div>

          {/* Weather Section */}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => setWeatherExpanded(!weatherExpanded)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-white">Live Weather</span>
                  <span className="text-[10px] text-emerald-400">LIVE</span>
                </div>
                <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${weatherExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            <div className="space-y-2">
              {/* Waves */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">WAVES</span>
                <span className="text-white">{weatherData.waves.height} ft @ {weatherData.waves.period}s</span>
              </div>

              {/* Water Temp */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Water:</span>
                <span className="text-cyan-400 font-medium">{weatherData.water.temp}°F</span>
              </div>

              {/* Conditions */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">FISHING CONDITIONS</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-400">
                  {weatherData.conditions}
                </span>
              </div>

              {weatherExpanded && (
                <div className="pt-2 space-y-2 border-t border-white/10">
                  <p className="text-xs text-gray-300">{weatherData.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Wind:</span>
                    <span className="text-white">{weatherData.wind.speed} kts {weatherData.wind.direction}</span>
                  </div>
                  {inlet && (
                    <div className="text-[10px] text-gray-500">
                      Location: {inlet.name} • Updated: {new Date().toLocaleTimeString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Historical Mode Toggle */}
          <div className="pt-2 border-t border-white/10">
            <button className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/10 transition-colors">
              <Clock className="w-3 h-3" />
              <span className="text-xs font-medium">HISTORICAL MODE</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-black/40 border-t border-white/10">
          <p className="text-[10px] text-gray-500 text-center">
            Vessel tracks show last 4 days
          </p>
        </div>
      </div>

      {/* Hidden Snip Tool (activated by button) */}
      {map && (
        <div className="hidden">
          <SnipTool 
            map={map} 
            onAnalysisComplete={handleAnalysisComplete}
            isActive={snipActive}
          />
        </div>
      )}
    </div>
  );
}
