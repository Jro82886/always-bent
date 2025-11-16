'use client';

import React from 'react';
import { COPERNICUS_THERMAL_COLORMAP } from '@/lib/analysis/sst-color-mapping';

interface EastCoastSSTScaleProps {
  currentTemp?: number; // Current temperature in Fahrenheit
  unit?: 'F' | 'C';
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export default function EastCoastSSTScale({
  currentTemp,
  unit = 'F',
  className = '',
  orientation = 'horizontal'
}: EastCoastSSTScaleProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  // Define East Coast specific temperature ranges
  const eastCoastRanges = [
    { minF: 32, maxF: 40, label: 'Winter Cold', season: 'Dec-Feb', color: '#4B0082' },
    { minF: 40, maxF: 50, label: 'Early Spring', season: 'Mar-Apr', color: '#0000FF' },
    { minF: 50, maxF: 60, label: 'Spring', season: 'Apr-May', color: '#00FFFF' },
    { minF: 60, maxF: 70, label: 'Late Spring', season: 'May-Jun', color: '#00FF00' },
    { minF: 70, maxF: 75, label: 'Summer', season: 'Jun-Aug', color: '#FFFF00' },
    { minF: 75, maxF: 80, label: 'Peak Summer', season: 'Jul-Sep', color: '#FFA500' },
    { minF: 80, maxF: 85, label: 'Gulf Stream', season: 'Year-round', color: '#FF4500' },
    { minF: 85, maxF: 90, label: 'Tropical', season: 'Rare', color: '#FF0000' }
  ];

  // Convert temperature if needed
  const convertToC = (tempF: number) => (tempF - 32) * 5 / 9;

  // Find current temperature position
  const getCurrentTempPosition = () => {
    if (!currentTemp) return null;
    const minTemp = 50; // Updated to match Copernicus range 283K
    const maxTemp = 86; // Updated to match Copernicus range 303K
    const position = ((currentTemp - minTemp) / (maxTemp - minTemp)) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const currentPosition = getCurrentTempPosition();

  // Build gradient from colormap
  const buildGradient = () => {
    const stops = COPERNICUS_THERMAL_COLORMAP.map(point => {
      const position = ((point.tempF - 50) / (86 - 50)) * 100; // Updated to 50-86°F range
      const color = `rgb(${point.rgb[0]}, ${point.rgb[1]}, ${point.rgb[2]})`;
      return `${color} ${position}%`;
    }).join(', ');

    return orientation === 'horizontal'
      ? `linear-gradient(to right, ${stops})`
      : `linear-gradient(to top, ${stops})`;
  };

  const renderHorizontal = () => (
    <div className={`bg-slate-900/95 border border-slate-700 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-cyan-400 text-sm font-semibold">
          East Coast SST Scale
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {/* Temperature scale bar */}
      <div className="relative">
        <div
          className="h-6 rounded-full shadow-inner"
          style={{ background: buildGradient() }}
        />

        {/* Current temperature indicator */}
        {currentPosition !== null && (
          <div
            className="absolute top-0 h-6 w-1 bg-white shadow-lg"
            style={{ left: `${currentPosition}%` }}
          >
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-slate-800 px-2 py-0.5 rounded text-xs text-cyan-300 whitespace-nowrap">
              {currentTemp?.toFixed(1)}°{unit}
            </div>
          </div>
        )}

        {/* Temperature labels */}
        <div className="flex justify-between mt-1 text-xs text-slate-400">
          <span>50°{unit}</span>
          <span>62°{unit}</span>
          <span>74°{unit}</span>
          <span>86°{unit}</span>
        </div>
      </div>

      {/* Seasonal ranges */}
      {showDetails && (
        <div className="mt-3 space-y-1">
          {eastCoastRanges.map((range, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs p-1 rounded hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: range.color }}
                />
                <span className="text-slate-300">{range.label}</span>
              </div>
              <div className="text-slate-500">
                {unit === 'F' ? (
                  <span>{range.minF}-{range.maxF}°F</span>
                ) : (
                  <span>{convertToC(range.minF).toFixed(0)}-{convertToC(range.maxF).toFixed(0)}°C</span>
                )}
                <span className="ml-2 text-slate-600">({range.season})</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fishing conditions guide */}
      <div className="mt-3 p-2 bg-slate-800 rounded text-xs">
        <div className="text-cyan-300 font-semibold mb-1">Optimal Conditions</div>
        <div className="space-y-0.5 text-slate-400">
          <div>• Tuna: 68-78°F (yellow/orange zones)</div>
          <div>• Mahi: 75-82°F (orange/red zones)</div>
          <div>• Wahoo: 72-80°F (yellow/orange zones)</div>
          <div>• Marlin: 75-85°F (orange/red zones)</div>
        </div>
      </div>
    </div>
  );

  const renderVertical = () => (
    <div className={`bg-slate-900/95 border border-slate-700 rounded-lg p-3 ${className}`}>
      <h3 className="text-cyan-400 text-sm font-semibold mb-2 text-center">
        SST
      </h3>

      <div className="flex gap-2">
        {/* Temperature scale bar */}
        <div className="relative">
          <div
            className="w-8 h-48 rounded"
            style={{ background: buildGradient() }}
          />

          {/* Current temperature indicator */}
          {currentPosition !== null && (
            <div
              className="absolute left-0 w-8 h-0.5 bg-white shadow-lg"
              style={{ bottom: `${currentPosition}%` }}
            />
          )}
        </div>

        {/* Temperature labels */}
        <div className="flex flex-col justify-between text-xs text-slate-400">
          <span>86°{unit}</span>
          <span>77°{unit}</span>
          <span>68°{unit}</span>
          <span>59°{unit}</span>
          <span>50°{unit}</span>
        </div>

        {/* Seasonal indicators */}
        {showDetails && (
          <div className="flex flex-col justify-between text-xs ml-2">
            <div className="text-red-500">Tropical</div>
            <div className="text-orange-500">Gulf Stream</div>
            <div className="text-yellow-500">Summer</div>
            <div className="text-green-500">Spring</div>
            <div className="text-blue-500">Winter</div>
          </div>
        )}
      </div>

      {currentTemp && (
        <div className="mt-2 text-center text-xs text-cyan-300">
          Current: {currentTemp.toFixed(1)}°{unit}
        </div>
      )}
    </div>
  );

  return orientation === 'horizontal' ? renderHorizontal() : renderVertical();
}

/**
 * Hook to get current SST at a location
 */
export function useCurrentSST(lat: number, lng: number) {
  const [temp, setTemp] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchSST = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/ocean-conditions?lat=${lat}&lng=${lng}&data=sst`
        );
        if (response.ok) {
          const data = await response.json();
          setTemp(data.sst?.tempF || null);
        }
      } catch (error) {
        console.error('Failed to fetch SST:', error);
      } finally {
        setLoading(false);
      }
    };

    if (lat && lng) {
      fetchSST();
    }
  }, [lat, lng]);

  return { temp, loading };
}

/**
 * Mini scale component for map overlay
 */
export function SSTScaleMini({ currentTemp, className = '' }: { currentTemp?: number; className?: string }) {
  const minTemp = 50; // Updated to match Copernicus range 283K
  const maxTemp = 86; // Updated to match Copernicus range 303K
  const position = currentTemp
    ? ((currentTemp - minTemp) / (maxTemp - minTemp)) * 100
    : null;

  return (
    <div className={`bg-slate-900/90 rounded p-2 ${className}`}>
      <div className="text-xs text-slate-400 mb-1">SST °F</div>
      <div
        className="h-2 w-32 rounded-full"
        style={{
          background: 'linear-gradient(to right, #4B0082 0%, #0000FF 20%, #00FFFF 35%, #00FF00 50%, #FFFF00 65%, #FFA500 80%, #FF0000 100%)'
        }}
      >
        {position !== null && (
          <div
            className="h-2 w-0.5 bg-white"
            style={{ marginLeft: `${position}%` }}
          />
        )}
      </div>
      <div className="flex justify-between mt-0.5 text-xs text-slate-500">
        <span>50</span>
        <span>68</span>
        <span>86</span>
      </div>
    </div>
  );
}