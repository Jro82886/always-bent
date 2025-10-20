'use client';

import React from 'react';
import { useSnipStore } from '@/store/snip-store';
import { X, Anchor, Wind, Waves, Fish, Thermometer, MapPin } from 'lucide-react';

export default function SnipAnalysisModal() {
  const { results, showModal, hideAnalysisModal, returnToOverview } = useSnipStore();

  if (!showModal || !results) return null;

  const formatTemp = (celsius: number) => {
    const fahrenheit = (celsius * 9) / 5 + 32;
    return `${fahrenheit.toFixed(1)}°F`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-400';
    if (confidence > 0.5) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getDataQualityBadge = () => {
    if (!results) return null;

    const colors = {
      high: 'bg-green-500/20 text-green-300 border-green-500/50',
      medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
      low: 'bg-orange-500/20 text-orange-300 border-orange-500/50'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full border ${colors[results.dataQuality]}`}>
        {results.dataQuality.toUpperCase()} QUALITY DATA
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={hideAnalysisModal}
      />

      {/* Modal */}
      <div className="relative w-[90%] max-w-4xl max-h-[85vh] bg-slate-900 rounded-lg shadow-2xl border border-slate-700 pointer-events-auto overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-cyan-400">Comprehensive Analysis</h2>
            {getDataQualityBadge()}
          </div>
          <button
            onClick={hideAnalysisModal}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Ocean Intel Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                <Waves className="w-5 h-5" />
                Ocean Intelligence
              </h3>

              {/* SST Data */}
              {results.sst && (
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium text-slate-300">Sea Surface Temperature</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Range:</span>
                      <span className="ml-2 text-slate-200">
                        {formatTemp(results.sst.min)} - {formatTemp(results.sst.max)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Average:</span>
                      <span className="ml-2 text-slate-200">{formatTemp(results.sst.mean)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Gradient:</span>
                      <span className="ml-2 text-slate-200">
                        {results.sst.gradientPerKm.toFixed(2)}°F/mile
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Coverage:</span>
                      <span className="ml-2 text-slate-200">{results.sst.coveragePct.toFixed(0)}%</span>
                    </div>
                  </div>
                  {results.sst.gradientPerKm > 0.5 && (
                    <div className="mt-2 p-2 bg-green-500/10 rounded border border-green-500/30">
                      <p className="text-xs text-green-300">◆ Strong temperature break detected - excellent fishing conditions</p>
                    </div>
                  )}
                </div>
              )}

              {/* CHL Data */}
              {results.chl && (
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium text-slate-300">Chlorophyll Concentration</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Range:</span>
                      <span className="ml-2 text-slate-200">
                        {results.chl.min.toFixed(2)} - {results.chl.max.toFixed(2)} mg/m³
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Average:</span>
                      <span className="ml-2 text-slate-200">{results.chl.mean.toFixed(2)} mg/m³</span>
                    </div>
                  </div>
                  {results.chl.mean > 2 && (
                    <div className="mt-2 p-2 bg-green-500/10 rounded border border-green-500/30">
                      <p className="text-xs text-green-300">⬢ High plankton concentration - baitfish likely present</p>
                    </div>
                  )}
                </div>
              )}

              {/* Low Coverage Warning */}
              {((results.sst && results.sst.coveragePct < 20) ||
                (results.chl && results.chl.coveragePct < 20)) && (
                <div className="p-3 bg-yellow-500/10 rounded border border-yellow-500/30">
                  <p className="text-xs text-yellow-300">
                    ⚠ Low data coverage detected. Results may be less accurate.
                  </p>
                </div>
              )}
            </div>

            {/* Vessel & Environmental Section */}
            <div className="space-y-4">

              {/* Vessel Intel */}
              {results.vessels.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2 mb-3">
                    <Anchor className="w-5 h-5" />
                    Vessel Intelligence
                  </h3>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-sm text-slate-400 mb-2">
                      {results.vessels.length} vessel{results.vessels.length > 1 ? 's' : ''} detected
                    </p>
                    <div className="space-y-2">
                      {results.vessels.slice(0, 3).map((vessel, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-slate-300">{vessel.name}</span>
                          <span className="text-slate-500">{vessel.lastSeen}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Weather Conditions */}
              {results.weather && (
                <div>
                  <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2 mb-3">
                    <Wind className="w-5 h-5" />
                    Environmental Conditions
                  </h3>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-500">Wind:</span>
                        <span className="ml-2 text-slate-200">
                          {results.weather.windSpeed} kts @ {results.weather.windDirection}°
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Waves:</span>
                        <span className="ml-2 text-slate-200">{results.weather.waveHeight} ft</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Hotspots */}
              {results.hotspots.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2 mb-3">
                    <Fish className="w-5 h-5" />
                    Identified Hotspots
                  </h3>
                  <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                    {results.hotspots.slice(0, 3).map((spot, idx) => (
                      <div key={spot.id} className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">
                          {idx + 1}. {spot.title}
                        </span>
                        <span className={`text-sm font-medium ${getConfidenceColor(spot.confidence)}`}>
                          {(spot.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Fishing Intel Summary */}
          <div className="mt-6 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
            <h3 className="text-sm font-semibold text-cyan-300 mb-2">Fishing Intelligence Summary</h3>
            <div className="space-y-1 text-sm text-slate-300">
              {results.sst && results.sst.mean > 20 && results.sst.mean < 28 && (
                <p>▲ Optimal temperature range for pelagic species</p>
              )}
              {results.sst && results.sst.gradientPerKm > 0.5 && (
                <p>▲ Strong temperature breaks present - concentrate efforts along edges</p>
              )}
              {results.chl && results.chl.mean > 1 && (
                <p>▲ Good chlorophyll levels indicate active food chain</p>
              )}
              {results.hotspots.filter(h => h.confidence > 0.7).length > 0 && (
                <p>▲ High-confidence hotspots identified - mark waypoints</p>
              )}
              {results.vessels.length > 2 && (
                <p>▲ Multiple vessels in area - recent fishing activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            Analysis performed: {new Date(results.timestamp).toLocaleString()}
          </div>
          <div className="flex gap-2">
            <button
              onClick={returnToOverview}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors text-sm"
            >
              Return to Overview
            </button>
            <button
              onClick={hideAnalysisModal}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}