'use client';

import { useState, useEffect } from 'react';
import { Wind, Waves, Thermometer, Eye, Gauge } from 'lucide-react';
import { formatNOAAData } from '@/lib/weather/noaa';
import type { NOAABuoyData } from '@/lib/weather/noaa';

interface BuoyWeatherWidgetProps {
  inletId: string;
}

export default function BuoyWeatherWidget({ inletId }: BuoyWeatherWidgetProps) {
  const [weather, setWeather] = useState<ReturnType<typeof formatNOAAData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(false);
        
        const response = await fetch(`/api/weather?inlet=${inletId}`);
        if (!response.ok) throw new Error('Failed to fetch weather');
        
        const data: NOAABuoyData = await response.json();
        if (data) {
          setWeather(formatNOAAData(data));
        }
      } catch (err) {
        console.error('[BuoyWeather] Error:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [inletId]);

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-32 mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-slate-700 rounded w-full"></div>
          <div className="h-3 bg-slate-700 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-4">
        <p className="text-sm text-gray-500">Weather data unavailable</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-lg p-4 border border-cyan-500/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider">
          NOAA Buoy Data
        </h3>
        <span className="text-[10px] text-gray-500">{weather.time}</span>
      </div>

      <div className="space-y-3">
        {/* Wind */}
        <div className="flex items-center gap-3">
          <Wind size={16} className="text-cyan-400" />
          <div className="flex-1">
            <div className="text-xs text-gray-400">Wind</div>
            <div className="text-sm font-medium text-white">{weather.wind}</div>
          </div>
        </div>

        {/* Waves */}
        <div className="flex items-center gap-3">
          <Waves size={16} className="text-blue-400" />
          <div className="flex-1">
            <div className="text-xs text-gray-400">Waves</div>
            <div className="text-sm font-medium text-white">{weather.waves}</div>
          </div>
        </div>

        {/* Temperatures */}
        <div className="flex items-center gap-3">
          <Thermometer size={16} className="text-orange-400" />
          <div className="flex-1">
            <div className="text-xs text-gray-400">Temperature</div>
            <div className="text-sm font-medium text-white">
              {weather.airTemp} / {weather.waterTemp}
            </div>
          </div>
        </div>

        {/* Pressure & Visibility */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <Gauge size={14} className="text-purple-400" />
            <div>
              <div className="text-[10px] text-gray-400">Pressure</div>
              <div className="text-xs font-medium text-white">{weather.pressure}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-green-400" />
            <div>
              <div className="text-[10px] text-gray-400">Visibility</div>
              <div className="text-xs font-medium text-white">{weather.visibility}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Station Info */}
      {weather.raw && (
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <p className="text-[10px] text-gray-500">
            Station: {weather.raw.station_name} ({weather.raw.station_id})
          </p>
        </div>
      )}
    </div>
  );
}
