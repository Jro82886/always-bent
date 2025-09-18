'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/store/appState';
import { InletWeather, formatWind, formatWaves, assessFishingConditions } from '@/lib/weather/noaa';
import { getInletById } from '@/lib/inlets';

interface OceanConditionsProps {
  sstActive: boolean;
  chlActive: boolean;
  oceanActive: boolean;
  onToggleSST: () => void;
  onToggleCHL: () => void;
  onToggleOcean: () => void;
}

export default function UnifiedOceanConditions({
  sstActive,
  chlActive,
  oceanActive,
  onToggleSST,
  onToggleCHL,
  onToggleOcean
}: OceanConditionsProps) {
  const { selectedInletId } = useAppState();
  const [weather, setWeather] = useState<InletWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [oceanTemp, setOceanTemp] = useState<string>('--');

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
        
        // Extract ocean temp if available
        if (data.waterTemp) {
          setOceanTemp(`${Math.round(data.waterTemp)}°F`);
        }
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
  const conditions = weather ? assessFishingConditions(weather) : null;

  return (
    <div className="absolute top-20 right-4 z-50 w-80">
      {/* Unified Ocean Conditions Panel */}
      <div className="bg-gray-900/95 backdrop-blur-lg rounded-xl shadow-2xl border border-cyan-500/20 overflow-hidden">
        
        {/* Header */}
        <div 
          className="px-4 py-3 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <h3 className="text-white font-semibold">Ocean Conditions</h3>
              {inlet && (
                <span className="text-cyan-400 text-sm">• {inlet.name}</span>
              )}
            </div>
            <svg 
              className={`w-4 h-4 text-gray-400 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {expanded && (
          <>
            {/* Quick Stats Bar */}
            <div className="px-4 py-2 bg-black/30 grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-gray-400">Water</div>
                <div className="text-cyan-400 font-bold text-lg">{oceanTemp}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Wind</div>
                <div className="text-white font-bold text-lg">
                  {weather ? formatWind(weather.wind) : '--'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Waves</div>
                <div className="text-white font-bold text-lg">
                  {weather ? formatWaves(weather.waves) : '--'}
                </div>
              </div>
            </div>

            {/* Conditions Assessment */}
            {conditions && (
              <div className={`px-4 py-2 text-xs font-medium text-center ${
                conditions === 'Excellent' ? 'bg-green-500/20 text-green-400' :
                conditions === 'Good' ? 'bg-blue-500/20 text-blue-400' :
                conditions === 'Fair' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {conditions} Fishing Conditions
              </div>
            )}

            {/* Data Layers Section */}
            <div className="px-4 py-3 border-t border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">OCEAN DATA LAYERS</span>
                <span className="text-xs text-cyan-400">
                  {[sstActive, chlActive, oceanActive].filter(Boolean).length} active
                </span>
              </div>
              
              <div className="space-y-2">
                {/* SST Toggle */}
                <button
                  onClick={onToggleSST}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    sstActive 
                      ? 'bg-orange-500/20 border border-orange-500/40' 
                      : 'bg-black/20 border border-gray-700 hover:bg-black/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${sstActive ? 'bg-orange-500' : 'bg-gray-600'}`} />
                    <span className={`text-sm ${sstActive ? 'text-orange-400' : 'text-gray-400'}`}>
                      Sea Surface Temp
                    </span>
                  </div>
                  {sstActive && (
                    <span className="text-xs text-orange-400 animate-pulse">LIVE</span>
                  )}
                </button>

                {/* Chlorophyll Toggle */}
                <button
                  onClick={onToggleCHL}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    chlActive 
                      ? 'bg-green-500/20 border border-green-500/40' 
                      : 'bg-black/20 border border-gray-700 hover:bg-black/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${chlActive ? 'bg-green-500' : 'bg-gray-600'}`} />
                    <span className={`text-sm ${chlActive ? 'text-green-400' : 'text-gray-400'}`}>
                      Chlorophyll
                    </span>
                  </div>
                  {chlActive && (
                    <span className="text-xs text-green-400 animate-pulse">LIVE</span>
                  )}
                </button>

                {/* Bathymetry Toggle */}
                <button
                  onClick={onToggleOcean}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                    oceanActive 
                      ? 'bg-blue-500/20 border border-blue-500/40' 
                      : 'bg-black/20 border border-gray-700 hover:bg-black/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${oceanActive ? 'bg-blue-500' : 'bg-gray-600'}`} />
                    <span className={`text-sm ${oceanActive ? 'text-blue-400' : 'text-gray-400'}`}>
                      Bathymetry
                    </span>
                  </div>
                  {oceanActive && (
                    <span className="text-xs text-blue-400 animate-pulse">ACTIVE</span>
                  )}
                </button>
              </div>
            </div>

            {/* Weather Details */}
            {weather && (
              <div className="px-4 py-3 border-t border-gray-800 space-y-2">
                <div className="text-xs text-gray-400 mb-2">CURRENT CONDITIONS</div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Air Temp:</span>
                    <span className="text-white ml-1">{Math.round(weather.airTemp)}°F</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Pressure:</span>
                    <span className="text-white ml-1">{weather.pressure.toFixed(1)} mb</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Visibility:</span>
                    <span className="text-white ml-1">{weather.visibility} mi</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Humidity:</span>
                    <span className="text-white ml-1">{weather.humidity}%</span>
                  </div>
                </div>

                {/* Tide Info if available */}
                {weather.tides && weather.tides.length > 0 && (
                  <div className="pt-2 border-t border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">NEXT TIDE</div>
                    <div className="text-sm text-white">
                      {weather.tides[0].type} at {new Date(weather.tides[0].time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Update Time */}
            <div className="px-4 py-2 bg-black/30 text-center text-xs text-gray-500">
              Updated {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
