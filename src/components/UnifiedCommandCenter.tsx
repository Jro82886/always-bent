'use client';

import { useState, useEffect, useCallback } from 'react';
import { Target, ChevronDown, ChevronUp, Map, Navigation, GraduationCap, 
         Thermometer, Wind, Waves, Compass, Eye, Cloud, Activity } from 'lucide-react';
import { useAppState } from '@/lib/store';
// Weather types and formatters
interface InletWeather {
  conditions?: any;
}

const formatWind = (speed: number, direction: number) => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(direction / 45) % 8;
  return `${Math.round(speed)} kt ${dirs[index]}`;
};

const formatWaves = (height: number, period: number) => {
  return `${Math.round(height)}ft @ ${Math.round(period)}s`;
};

const assessFishingConditions = (conditions: any) => {
  if (!conditions) return null;
  // Simple assessment based on wind/waves
  const windSpeed = conditions.wind_speed || 0;
  const waveHeight = conditions.wave_height || 0;
  
  let rating = 'good';
  if (windSpeed > 20 || waveHeight > 6) rating = 'poor';
  else if (windSpeed > 15 || waveHeight > 4) rating = 'fair';
  else if (windSpeed < 10 && waveHeight < 3) rating = 'excellent';
  
  return { rating };
};
import { getInletById } from '@/lib/inlets';

interface UnifiedCommandCenterProps {
  onAnalyze: () => void;
  currentMode: 'analysis' | 'tracking';
  isTracking?: boolean;
  onStartTracking?: () => void;
  onStopTracking?: () => void;
}

export default function UnifiedCommandCenter({ 
  onAnalyze, 
  currentMode,
  isTracking = false,
  onStartTracking,
  onStopTracking
}: UnifiedCommandCenterProps) {
  const { selectedInletId, analysis } = useAppState();
  const [weather, setWeather] = useState<InletWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [legendExpanded, setLegendExpanded] = useState(false);
  const [weatherExpanded, setWeatherExpanded] = useState(true);
  const set = useAppState.setState;

  // Hardened snip starter: clears stuck state, forces crosshair, engages drawing
  const startSnipSafe = useCallback(() => {
    try {
      console.log('[SNIP] startSnipSafe - clearing state and starting draw');
      
      // Clear stale analysis state
      useAppState.setState(s => ({
        analysis: {
          ...s.analysis,
          showReviewCta: false,
          isZoomingToSnip: false,
          pendingAnalysis: null,
          narrative: '',
          lastSnipPolygon: null,
          lastSnipBBox: null,
          lastSnipCenter: null
        }
      }));
      
      // Call the actual snip tool's start function
      // This properly sets isDrawing=true and enables mouse handlers
      if ((window as any).startSnipping) {
        (window as any).startSnipping();
        console.log('[SNIP] startSnipping called successfully');
      } else {
        console.error('[SNIP] startSnipping not found - SnipTool may not be mounted');
        // Fallback: try to set cursor at least
        const map = (window as any).mapboxMap || (window as any).map;
        if (map?.getCanvas) {
          map.getCanvas().style.cursor = 'crosshair';
        }
      }
    } catch (e) {
      console.error('[SNIP] startSnipSafe error', e);
    }
  }, []);

  // Keyboard fallback: Shift + S
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const editing = tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable;
      if (editing) return;
      if (e.shiftKey && (e.key === 'S' || e.key === 's')) startSnipSafe();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startSnipSafe]);
  
  // Fetch weather data
  useEffect(() => {
    if (!selectedInletId) return;

    const fetchWeather = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/weather?inlet=${selectedInletId}`);
        if (!response.ok) throw new Error('Failed to fetch weather');
        const data = await response.json();
        setWeather(data);
      } catch (err) {
        console.error('Weather fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedInletId]);

  const inlet = selectedInletId ? getInletById(selectedInletId) : null;
  const conditions = weather?.conditions ? assessFishingConditions(weather.conditions) : null;
  
  // Analysis mode legend
  const analysisLegendItems = [
    { color: 'bg-cyan-500', label: 'Recreational', description: '4-day history' },
    { color: 'bg-orange-500', label: 'Commercial', description: 'Fishing vessels' },
    { color: 'bg-yellow-400', label: 'Hotspot', description: 'High confidence', pulse: true },
    { color: 'bg-gradient-to-r from-red-500/60 to-orange-500/60', label: 'SST Break', description: 'Temperature edge' },
    { color: 'bg-gradient-to-r from-teal-500/60 to-green-500/60', label: 'Chlorophyll Edge', description: 'Baitfish zone' }
  ];

  const legendItems = currentMode === 'analysis' ? analysisLegendItems : [];

  return (
    <div className="absolute top-20 right-4 z-40 flex flex-col gap-0 w-[320px]">
      {/* UNIFIED COMMAND CENTER - Single sleek panel */}
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl border border-cyan-500/30 shadow-2xl overflow-hidden">
        
        {/* WEATHER HEADER - Always visible */}
        <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-cyan-500/20">
          <button
            onClick={() => setWeatherExpanded(!weatherExpanded)}
            className="w-full px-4 py-3 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cloud size={16} className="text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-300">
                  {inlet ? inlet.name : 'Select Inlet'}
                </span>
              </div>
              
              {/* Quick weather stats */}
              {weather?.conditions && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <Thermometer size={12} className="text-orange-400" />
                    <span className="text-white font-medium">
                      {weather.conditions.water_temp ? `${Math.round(weather.conditions.water_temp)}°` : '--'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wind size={12} className="text-blue-400" />
                    <span className="text-white font-medium">
                      {formatWind(weather.conditions.wind_speed, weather.conditions.wind_direction).split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Waves size={12} className="text-teal-400" />
                    <span className="text-white font-medium">
                      {formatWaves(weather.conditions.wave_height, weather.conditions.dominant_wave_period).split(' ')[0]}
                    </span>
                  </div>
                </div>
              )}
              
              <ChevronDown size={14} className={`text-cyan-400 transition-transform ${weatherExpanded ? 'rotate-180' : ''}`} />
            </div>
          </button>
          
          {/* Conditions bar */}
          {conditions && !weatherExpanded && (
            <div className={`h-1 ${
              conditions.rating === 'excellent' ? 'bg-green-500' :
              conditions.rating === 'good' ? 'bg-blue-500' :
              conditions.rating === 'fair' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
          )}
        </div>

        {/* Expanded weather details */}
        {weatherExpanded && weather?.conditions && (
          <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
            {/* Conditions Assessment */}
            {conditions && (
              <div className={`px-3 py-2 rounded-lg text-xs font-semibold text-center mb-3 ${
                conditions.rating === 'excellent' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                conditions.rating === 'good' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                conditions.rating === 'fair' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                <Activity size={12} className="inline mr-1" />
                {conditions.rating.charAt(0).toUpperCase() + conditions.rating.slice(1)} Fishing Conditions
              </div>
            )}
            
            {/* Detailed conditions grid */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="text-center">
                <div className="text-gray-500 text-[10px] uppercase">Water</div>
                <div className="text-white font-bold text-sm">
                  {weather.conditions.water_temp ? `${Math.round(weather.conditions.water_temp)}°F` : '--'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-[10px] uppercase">Wind</div>
                <div className="text-white font-bold text-sm">
                  {formatWind(weather.conditions.wind_speed, weather.conditions.wind_direction)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-500 text-[10px] uppercase">Waves</div>
                <div className="text-white font-bold text-sm">
                  {formatWaves(weather.conditions.wave_height, weather.conditions.dominant_wave_period)}
                </div>
              </div>
            </div>
            
            {/* Additional details */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700/50 text-[11px]">
              <div className="flex items-center gap-2">
                <Eye size={10} className="text-gray-500" />
                <span className="text-gray-400">Visibility:</span>
                <span className="text-white">
                  {weather.conditions.visibility ? `${weather.conditions.visibility} nm` : '--'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Compass size={10} className="text-gray-500" />
                <span className="text-gray-400">Pressure:</span>
                <span className="text-white">
                  {weather.conditions.sea_pressure ? `${weather.conditions.sea_pressure.toFixed(1)} mb` : '--'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SNIP TOOL SECTION - Only show on Analysis mode */}
        {currentMode === 'analysis' && (
          <div className="p-4 bg-gradient-to-b from-slate-800/30 to-transparent">
            <div className="space-y-3">
              {/* Snip Tool Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-cyan-400" />
                  <span className="text-sm font-semibold text-cyan-300">Ocean Analysis Tool</span>
                </div>
                <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-medium rounded-full border border-cyan-500/20">
                  SNIP MODE
                </span>
              </div>
              
              {/* Alternative Snip Button - In Command Center */}
              <button
                className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 font-semibold rounded-lg border border-cyan-500/30 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20 flex items-center justify-center gap-2"
                aria-label="Draw analysis area"
                onClick={startSnipSafe}
              >
                <span className="text-lg">▢</span>
                <span>Draw Analysis Area</span>
              </button>
              
              {/* Quick instructions */}
              <div className="text-center text-[11px] text-gray-500">
                Click and drag to select ocean area for analysis
              </div>
            </div>
          </div>
        )}


        {/* LEGEND SECTION - Collapsible */}
        <div className="border-t border-slate-700/50">
          <button
            onClick={() => setLegendExpanded(!legendExpanded)}
            className="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Map size={12} className="text-slate-500" />
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                Map Legend
              </span>
            </div>
            <ChevronDown size={12} className={`text-slate-500 transition-transform ${legendExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {legendExpanded && (
            <div className="px-4 py-3 space-y-2 bg-slate-800/30">
              {legendItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 group">
                  <div className="flex items-center justify-center w-4">
                    {item.pulse ? (
                      <div className={`w-2 h-2 ${item.color} rounded-full animate-pulse`} />
                    ) : item.color.includes('gradient') ? (
                      <div className={`w-3 h-3 ${item.color} rounded`} />
                    ) : (
                      <div className={`w-3 h-0.5 ${item.color} rounded-full`} />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-300 flex-1">{item.label}</span>
                  <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.description}
                  </span>
                </div>
              ))}
              
              <div className="pt-2 mt-2 border-t border-slate-700/50">
                <p className="text-[10px] text-slate-500 italic text-center">
                  Vessel tracks show last 4 days
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Update timestamp */}
        <div className="px-4 py-2 bg-black/20 text-center text-[10px] text-gray-600">
          Weather updated {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      </div>
    </div>
  );
}
