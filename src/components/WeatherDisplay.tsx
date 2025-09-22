'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/lib/store';
import { InletWeather, formatWind, formatWaves, assessFishingConditions } from '@/lib/weather/noaa';

export default function WeatherDisplay({ className = '' }: { className?: string }) {
  const { selectedInletId } = useAppState();
  const [weather, setWeather] = useState<InletWeather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedInletId) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/weather?inlet=${selectedInletId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch weather');
        }
        
        const data = await response.json();
        setWeather(data);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError('Weather data temporarily unavailable');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [selectedInletId]);

  if (loading && !weather) {
    return (
      <div className={`bg-black/60 backdrop-blur rounded-lg p-3 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-white/20 rounded w-24 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (error || !weather?.conditions) {
    return null; // Silently fail if no weather data
  }

  const conditions = weather.conditions;
  const assessment = assessFishingConditions(conditions);
  
  // Color coding for conditions
  const ratingColors: Record<string, string> = {
    excellent: 'text-green-400',
    good: 'text-cyan-400',
    fair: 'text-yellow-400',
    poor: 'text-red-400'
  };

  return (
    <div className={`bg-black/60 backdrop-blur rounded-lg p-3 ${className}`}>
      {/* Header with ABFI branding */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-[8px] font-bold text-white">W</span>
          </div>
          <h3 className="text-xs font-semibold text-white/90">
            Live Weather
          </h3>
        </div>
      </div>

      {/* Primary conditions */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Wind */}
        {conditions.wind_speed !== null && (
          <div className="bg-white/5 rounded p-2">
            <div className="text-[10px] text-white/50 uppercase tracking-wide mb-1">Wind</div>
            <div className="text-sm font-medium text-white">
              {formatWind(conditions.wind_speed, conditions.wind_direction)}
            </div>
            {conditions.wind_gust && (
              <div className="text-[10px] text-orange-400 mt-0.5">
                Gusts {Math.round(conditions.wind_gust)} kts
              </div>
            )}
          </div>
        )}

        {/* Waves */}
        {conditions.wave_height !== null && (
          <div className="bg-white/5 rounded p-2">
            <div className="text-[10px] text-white/50 uppercase tracking-wide mb-1">Waves</div>
            <div className="text-sm font-medium text-white">
              {formatWaves(conditions.wave_height, conditions.dominant_wave_period)}
            </div>
            {conditions.wave_direction && (
              <div className="text-[10px] text-white/40 mt-0.5">
                From {Math.round(conditions.wave_direction)}°
              </div>
            )}
          </div>
        )}
      </div>

      {/* Secondary conditions */}
      <div className="flex items-center gap-3 text-[11px] text-white/70 mb-2">
        {conditions.water_temp && (
          <div className="flex items-center gap-1">
            <span className="text-white/40">Water:</span>
            <span className="text-cyan-400 font-medium">
              {Math.round(conditions.water_temp)}°F
            </span>
          </div>
        )}
        {conditions.air_temp && (
          <div className="flex items-center gap-1">
            <span className="text-white/40">Air:</span>
            <span>{Math.round(conditions.air_temp)}°F</span>
          </div>
        )}
        {conditions.sea_pressure && (
          <div className="flex items-center gap-1">
            <span className="text-white/40">Baro:</span>
            <span>{Math.round(conditions.sea_pressure)} mb</span>
          </div>
        )}
      </div>

      {/* Fishing conditions assessment */}
      <div className="border-t border-white/10 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/50 uppercase tracking-wide">
            Fishing Conditions
          </span>
          <span className={`text-xs font-semibold ${ratingColors[assessment.rating]}`}>
            {assessment.rating.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Data source */}
      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[9px] text-white/30">
          {weather.station} • NOAA Buoy
        </span>
        <span className="text-[9px] text-white/30">
          {new Date(conditions.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
