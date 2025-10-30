'use client';

import React from 'react';
import { useWaterMovement } from '@/lib/visualization/water-movement';

interface WaterMovementToggleProps {
  map: mapboxgl.Map | null;
  className?: string;
}

export default function WaterMovementToggle({ map, className = '' }: WaterMovementToggleProps) {
  const { isEnabled, toggle, animate, stats } = useWaterMovement(map);
  const [showStats, setShowStats] = React.useState(false);

  const handleToggle = async () => {
    await toggle(!isEnabled);
  };

  const handleAnimate = () => {
    animate();
  };

  return (
    <div className={`bg-slate-900/95 border border-slate-700 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-cyan-400 text-sm font-semibold">
          3-Day Movement
        </label>
        <button
          onClick={handleToggle}
          className={`
            relative w-12 h-6 rounded-full transition-colors duration-200
            ${isEnabled ? 'bg-cyan-500' : 'bg-slate-600'}
          `}
          aria-label="Toggle 3-day water movement"
        >
          <span
            className={`
              absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full
              transition-transform duration-200
              ${isEnabled ? 'translate-x-6' : 'translate-x-0'}
            `}
          />
        </button>
      </div>

      {isEnabled && (
        <div className="space-y-2">
          <div className="text-xs text-slate-400">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 bg-red-500 opacity-100" />
              <span>Today (100%)</span>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 bg-red-500 opacity-40" />
              <span>Yesterday (40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 opacity-20" />
              <span>2 Days Ago (20%)</span>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAnimate}
              className="flex-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded transition-colors"
            >
              Animate
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded transition-colors"
            >
              {showStats ? 'Hide' : 'Show'} Stats
            </button>
          </div>

          {showStats && stats && (
            <div className="mt-2 p-2 bg-slate-800 rounded text-xs">
              <div className="text-cyan-300 font-semibold mb-1">
                Movement Statistics
              </div>
              <div className="space-y-1 text-slate-300">
                <div>Total Features: {stats.totalFeatures}</div>
                {stats.movement.edges.count > 0 && (
                  <div className="pl-2">
                    • Edges: {stats.movement.edges.count}
                    {stats.movement.edges.avgDisplacement > 0 && (
                      <span className="text-slate-400">
                        {' '}(~{stats.movement.edges.avgDisplacement.toFixed(1)} km/day)
                      </span>
                    )}
                  </div>
                )}
                {stats.movement.filaments.count > 0 && (
                  <div className="pl-2">
                    • Filaments: {stats.movement.filaments.count}
                    {stats.movement.filaments.avgDisplacement > 0 && (
                      <span className="text-slate-400">
                        {' '}(~{stats.movement.filaments.avgDisplacement.toFixed(1)} km/day)
                      </span>
                    )}
                  </div>
                )}
                {stats.movement.eddies.count > 0 && (
                  <div className="pl-2">
                    • Eddies: {stats.movement.eddies.count}
                    {stats.movement.eddies.avgDisplacement > 0 && (
                      <span className="text-slate-400">
                        {' '}(~{stats.movement.eddies.avgDisplacement.toFixed(1)} km/day)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 text-xs text-slate-500">
        {isEnabled ? 'Showing water mass movement over 3 days' : 'Enable to see water movement'}
      </div>
    </div>
  );
}