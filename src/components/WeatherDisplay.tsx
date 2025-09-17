'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/store/appState';
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
  const ratingColors = {
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
        {conditions.is_recent && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] text-white/50">LIVE</span>
          </div>
        )}
      </div>

      {/* Primary conditions */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        {/* Wind */}
        {conditions.wind_speed_kt !== undefined && (
          <div className="bg-white/5 rounded p-2">
            <div className="text-[10px] text-white/50 uppercase tracking-wide mb-1">Wind</div>
            <div className="text-sm font-medium text-white">
              {formatWind(conditions.wind_speed_kt, conditions.wind_direction)}
            </div>
            {conditions.wind_gust_kt && (
              <div className="text-[10px] text-orange-400 mt-0.5">
                Gusts {Math.round(conditions.wind_gust_kt)} kts
              </div>
            )}
          </div>
        )}

        {/* Waves */}
        {conditions.wave_height_ft !== undefined && (
          <div className="bg-white/5 rounded p-2">
            <div className="text-[10px] text-white/50 uppercase tracking-wide mb-1">Waves</div>
            <div className="text-sm font-medium text-white">
              {formatWaves(conditions.wave_height_ft, conditions.wave_period_sec)}
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
        {conditions.water_temp_f && (
          <div className="flex items-center gap-1">
            <span className="text-white/40">Water:</span>
            <span className="text-cyan-400 font-medium">
              {Math.round(conditions.water_temp_f)}°F
            </span>
          </div>
        )}
        {conditions.air_temp_f && (
          <div className="flex items-center gap-1">
            <span className="text-white/40">Air:</span>
            <span>{Math.round(conditions.air_temp_f)}°F</span>
          </div>
        )}
        {conditions.pressure_mb && (
          <div className="flex items-center gap-1">
            <span className="text-white/40">Baro:</span>
            <span>{Math.round(conditions.pressure_mb)} mb</span>
            {conditions.pressure_tendency && (
              <span className="text-[9px] ml-0.5">
                {conditions.pressure_tendency === 'rising' ? '↑' : '↓'}
              </span>
            )}
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
        {assessment.factors.length > 0 && (
          <div className="mt-1 text-[10px] text-white/60">
            {assessment.factors.join(' • ')}
          </div>
        )}
      </div>

      {/* Data source */}
      <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
        <span className="text-[9px] text-white/30">
          {weather.buoy_station} • {weather.distance_nm > 0 ? `${Math.round(weather.distance_nm)} nm` : 'Nearby'}
        </span>
        <span className="text-[9px] text-white/30">
          {new Date(conditions.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}
