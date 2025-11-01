'use client';

import { useState, useEffect } from 'react';
import { Cloud, Waves, Thermometer, Wind, Gauge, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { useAppState } from '@/lib/store';
import { getInletById } from '@/lib/inlets';

interface WeatherData {
  waves: {
    height: number;
    period: number;
    direction: number;
  };
  water: {
    temperature: number;
  };
  wind: {
    speed: number;
    direction: number;
  };
  pressure: {
    value: number;
    trend: 'rising' | 'falling' | 'steady';
  };
  source: {
    id: string;
    status: 'ok' | 'stale' | 'error';
  };
  lastUpdate: string;
}

export default function WeatherCard() {
  const { selectedInletId } = useAppState();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;

  useEffect(() => {
    const fetchWeather = async () => {
      if (!selectedInletId) {
        setWeatherData(null);
        setError(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/weather?inlet=${selectedInletId}`, { cache: 'no-store' });
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        
        const data = await response.json();
        setWeatherData(data);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError('Unable to load weather data');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedInletId]);

  const formatDirection = (deg: number) => {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  const getPressureTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="w-3 h-3 text-green-400" />;
      case 'falling': return <TrendingDown className="w-3 h-3 text-red-400" />;
      default: return <Minus className="w-3 h-3 text-gray-400" />;
    }
  };

  const getConditionsRating = () => {
    if (!weatherData) return { rating: 'UNKNOWN', color: 'text-gray-400' };
    
    const waveHeight = weatherData.waves.height;
    const windSpeed = weatherData.wind.speed;
    
    if (waveHeight < 2 && windSpeed < 10) return { rating: 'EXCELLENT', color: 'text-emerald-400' };
    if (waveHeight < 4 && windSpeed < 15) return { rating: 'GOOD', color: 'text-cyan-400' };
    if (waveHeight < 6 && windSpeed < 20) return { rating: 'FAIR', color: 'text-yellow-400' };
    return { rating: 'POOR', color: 'text-red-400' };
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-cyan-500/20 p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (!selectedInletId) {
    return (
      <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-cyan-500/20 p-6">
        <div className="flex items-center justify-center py-8 text-cyan-400">
          <MapPin className="w-5 h-5 mr-2" />
          <span className="text-sm">Select an inlet to view weather</span>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-cyan-500/20 p-6">
        <div className="flex items-center justify-center py-8 text-red-400">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm">{error || 'No weather data available'}</span>
        </div>
      </div>
    );
  }

  const conditions = getConditionsRating();

  return (
    <div className="bg-slate-900/50 backdrop-blur rounded-xl border border-cyan-500/20 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Current Conditions</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${conditions.color}`}>
            {conditions.rating}
          </span>
          {weatherData.source.status !== 'ok' && (
            <span className="text-xs text-yellow-400">
              ({weatherData.source.status})
            </span>
          )}
        </div>
      </div>

      {/* Weather Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Waves */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Waves className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-gray-400 uppercase">Waves</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {weatherData.waves.height.toFixed(1)} ft
          </div>
          <div className="text-xs text-gray-500">
            @ {weatherData.waves.period.toFixed(1)}s from {formatDirection(weatherData.waves.direction)}
          </div>
        </div>

        {/* Water Temp */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-400 uppercase">Water</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {weatherData.water.temperature.toFixed(1)}°F
          </div>
          <div className="text-xs text-gray-500">
            Surface temperature
          </div>
        </div>

        {/* Wind */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400 uppercase">Wind</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {weatherData.wind.speed.toFixed(1)} kts
          </div>
          <div className="text-xs text-gray-500">
            From {formatDirection(weatherData.wind.direction)}
          </div>
        </div>

        {/* Pressure */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400 uppercase">Pressure</span>
          </div>
          <div className="text-xl font-semibold text-white flex items-center gap-1">
            {weatherData.pressure.value.toFixed(0)}
            {getPressureTrendIcon(weatherData.pressure.trend)}
          </div>
          <div className="text-xs text-gray-500">
            hPa • {weatherData.pressure.trend}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {inlet?.name || 'Location'}
        </span>
        <span className="text-xs text-gray-500">
          Updated: {new Date(weatherData.lastUpdate).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
