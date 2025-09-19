'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/store/appState';
import { InletWeather, formatWind, formatWaves, assessFishingConditions } from '@/lib/weather/noaa';
import { getInletById } from '@/lib/inlets';

interface OceanConditionsProps {
  // Remove layer props as they're moving back to LeftZone
}

export default function WeatherPanel() {
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
        if (data.conditions?.water_temp_f) {
          setOceanTemp(`${Math.round(data.conditions.water_temp_f)}°F`);
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
  const conditions = weather?.conditions ? assessFishingConditions(weather.conditions) : null;

  return (
    <div className="absolute top-64 right-4 z-[60] w-80">
      {/* Compact Weather Panel - Below right toolbar */}
      <div className="bg-gray-900/90 backdrop-blur-lg rounded-lg shadow-xl border border-cyan-500/20 overflow-hidden">
        
        {/* Compact Header Bar */}
        <div className="px-4 py-2 bg-gradient-to-r from-cyan-600/20 to-blue-600/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {inlet && (
                <span className="text-cyan-400 text-sm font-medium">{inlet.name}</span>
              )}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Water:</span>
                  <span className="text-cyan-400 font-bold">{oceanTemp}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Wind:</span>
                  <span className="text-white font-bold">
                    {weather?.conditions ? formatWind(weather.conditions.wind_speed, weather.conditions.wind_direction) : '--'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Waves:</span>
                  <span className="text-white font-bold">
                    {weather?.conditions ? formatWaves(weather.conditions.wave_height, weather.conditions.dominant_wave_period) : '--'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 hover:bg-cyan-500/20 rounded transition-colors"
            >
              <svg 
                className={`w-4 h-4 text-gray-400 transform transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {expanded && (
          <>

            {/* Conditions Assessment */}
            {conditions && (
              <div className={`px-4 py-2 text-xs font-medium text-center ${
                conditions.rating === 'excellent' ? 'bg-green-500/20 text-green-400' :
                conditions.rating === 'good' ? 'bg-blue-500/20 text-blue-400' :
                conditions.rating === 'fair' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {conditions.rating.charAt(0).toUpperCase() + conditions.rating.slice(1)} Fishing Conditions
              </div>
            )}

            {/* Removed Data Layers - Now in LeftZone */}

            {/* Weather Details */}
            {weather?.conditions && (
              <div className="px-4 py-3 border-t border-gray-800 space-y-2">
                <div className="text-xs text-gray-400 mb-2">CURRENT CONDITIONS</div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Air Temp:</span>
                    <span className="text-white ml-1">
                      {weather.conditions.air_temp ? `${Math.round(weather.conditions.air_temp)}°F` : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Pressure:</span>
                    <span className="text-white ml-1">
                      {weather.conditions.sea_pressure ? `${weather.conditions.sea_pressure.toFixed(1)} mb` : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Visibility:</span>
                    <span className="text-white ml-1">
                      {weather.conditions.visibility ? `${weather.conditions.visibility} nm` : '--'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Wind Gust:</span>
                    <span className="text-white ml-1">
                      {weather.conditions.wind_gust ? `${Math.round(weather.conditions.wind_gust)} kts` : '--'}
                    </span>
                  </div>
                </div>

                {/* Wave Direction if available */}
                {weather.conditions.wave_direction && (
                  <div className="pt-2 border-t border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">WAVE DIRECTION</div>
                    <div className="text-sm text-white">
                      {weather.conditions.wave_direction}° • {weather.conditions.dominant_wave_period ? `${weather.conditions.dominant_wave_period}s dominant` : ''}
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
