'use client';

import { useState, useEffect } from 'react';
import { Cloud, Waves, Thermometer, Wind, Navigation, Loader2, WifiOff, Wifi, MapPin, AlertCircle } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { getInletById } from '@/lib/inlets';
import { useWeather } from '@/lib/hooks/queries';

interface WeatherData {
  waves: {
    height: number;
    period: number;
    direction: number;
  };
  water: {
    temp: number;
  };
  conditions: {
    rating: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT';
    description: string;
  };
  wind: {
    speed: number;
    direction: number;
  };
  lastUpdate: Date;
}

export default function LiveWeatherWidget() {
  const { selectedInletId } = useAppState();
  const { data: apiData, isLoading: loading, error } = useWeather(selectedInletId);
  const [online, setOnline] = useState(true);
  const [expanded, setExpanded] = useState(false);
  
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;
  
  // Helper functions for weather conditions
  const determineRating = (data: any): 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT' => {
    const waveHeight = data.waves?.height || 0;
    const windSpeed = data.wind?.speed || 0;
    
    if (waveHeight < 2 && windSpeed < 10) return 'EXCELLENT';
    if (waveHeight < 4 && windSpeed < 15) return 'GOOD';
    if (waveHeight < 6 && windSpeed < 20) return 'FAIR';
    return 'POOR';
  };
  
  const generateDescription = (data: any): string => {
    const conditions = [];
    const waveHeight = data.waves?.height || 0;
    const windSpeed = data.wind?.speed || 0;
    
    if (waveHeight < 2) conditions.push('Calm seas');
    else if (waveHeight < 4) conditions.push('Light chop');
    else if (waveHeight < 6) conditions.push('Moderate seas');
    else conditions.push('Rough conditions');
    
    if (data.water?.temperature > 80) conditions.push('Warm water');
    else if (data.water?.temperature > 70) conditions.push('Good water temp');
    else conditions.push('Cool water');
    
    return conditions.join(' • ');
  };

  // Transform API data to our interface
  const weatherData: WeatherData | null = apiData ? {
    waves: {
      height: apiData.waves?.height || 2.5,
      period: apiData.waves?.period || 10,
      direction: apiData.waves?.direction || 0
    },
    water: {
      temp: apiData.water?.temperature || 75
    },
    wind: {
      speed: apiData.wind?.speed || 10,
      direction: apiData.wind?.direction || 0
    },
    conditions: {
      rating: determineRating(apiData),
      description: generateDescription(apiData)
    },
    lastUpdate: new Date()
  } : null;

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Update online status based on error
  useEffect(() => {
    setOnline(!error);
  }, [error]);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT': return 'text-emerald-400';
      case 'GOOD': return 'text-cyan-400';
      case 'FAIR': return 'text-yellow-400';
      case 'POOR': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatDirection = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-cyan-500/20">
        <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
        <span className="text-xs text-cyan-400">Loading weather...</span>
      </div>
    );
  }

  if (!selectedInletId) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-cyan-500/20">
        <MapPin className="w-3 h-3 text-cyan-400" />
        <span className="text-xs text-cyan-400">Select inlet for weather</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-red-500/20">
        <AlertCircle className="w-3 h-3 text-red-400" />
        <span className="text-xs text-red-400">Weather unavailable</span>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-cyan-500/20">
        <Cloud className="w-3 h-3 text-cyan-400" />
        <span className="text-xs text-cyan-400">No weather data</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Compact View */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`
          flex items-center gap-3 px-3 py-1.5 rounded-lg
          bg-black/60 backdrop-blur-sm border transition-all
          ${expanded ? 'border-cyan-400/40 shadow-lg shadow-cyan-500/10' : 'border-cyan-500/20 hover:border-cyan-400/30'}
        `}
      >
        {/* Connection Status */}
        <div className="flex items-center gap-1.5">
          {online ? (
            <Wifi className="w-3 h-3 text-emerald-400" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400" />
          )}
          <span className="text-[10px] uppercase tracking-wider text-gray-400">
            {online ? 'LIVE' : 'OFFLINE'}
          </span>
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-white/10" />

        {/* Weather Summary */}
        <div className="flex items-center gap-2">
          <Waves className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs text-white/90">
            {weatherData.waves.height.toFixed(1)}ft @ {weatherData.waves.period}s
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Thermometer className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs text-white/90">
            {weatherData.water.temp > 0 ? `${weatherData.water.temp}°F` : '--°F'}
          </span>
        </div>

        {/* Conditions Badge */}
        <div className={`px-2 py-0.5 rounded text-[10px] font-medium ${getRatingColor(weatherData.conditions.rating)} bg-black/40`}>
          {weatherData.conditions.rating}
        </div>
      </button>

      {/* Expanded View */}
      {expanded && (
        <div className="absolute top-full mt-2 left-0 z-50 w-80 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-cyan-500/20 shadow-2xl">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-medium text-white">Live Weather</h3>
                {online && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Waves */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-400">WAVES</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-white font-medium">
                  {weatherData.waves.height.toFixed(1)} ft @ {weatherData.waves.period}s
                </div>
                <div className="text-xs text-gray-500">
                  From {weatherData.waves.direction}° ({formatDirection(weatherData.waves.direction)})
                </div>
              </div>
            </div>

            {/* Water Temp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-gray-400">WATER</span>
              </div>
              <div className="text-sm text-white font-medium">
                {weatherData.water.temp > 0 ? `${weatherData.water.temp}°F` : '--°F'}
              </div>
            </div>

            {/* Wind */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">WIND</span>
              </div>
              <div className="text-right">
                <div className="text-sm text-white font-medium">
                  {weatherData.wind.speed} kts
                </div>
                <div className="text-xs text-gray-500">
                  From {formatDirection(weatherData.wind.direction)}
                </div>
              </div>
            </div>

            {/* Fishing Conditions */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">FISHING CONDITIONS</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRatingColor(weatherData.conditions.rating)}`}>
                  {weatherData.conditions.rating}
                </span>
              </div>
              <p className="text-xs text-gray-300">
                {weatherData.conditions.description}
              </p>
            </div>

            {/* Last Update */}
            <div className="pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">
                  Last updated: {weatherData.lastUpdate.toLocaleTimeString()}
                </span>
                {inlet && (
                  <span className="text-[10px] text-gray-500">
                    {inlet.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
