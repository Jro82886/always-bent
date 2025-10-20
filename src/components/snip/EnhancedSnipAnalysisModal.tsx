'use client';

import React from 'react';
import { useSnipStore } from '@/store/snip-store';
import { X, Anchor, Wind, Waves, Fish, Thermometer, MapPin, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import type { EnhancedAnalysis } from '@/types/analyze';

export default function EnhancedSnipAnalysisModal() {
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

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400 bg-green-500/20 border-green-500/50';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
    return 'text-red-400 bg-red-500/20 border-red-500/50';
  };

  const getScoreCategory = (category: string) => {
    const colors = {
      'strong': 'text-green-400',
      'fair': 'text-yellow-400',
      'poor': 'text-red-400'
    };
    return colors[category] || 'text-slate-400';
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

  const enhanced = (results as any).enhanced as EnhancedAnalysis | undefined;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={hideAnalysisModal}
      />

      {/* Modal */}
      <div className="relative w-[90%] max-w-5xl max-h-[90vh] bg-slate-900 rounded-lg shadow-2xl border border-slate-700 pointer-events-auto overflow-hidden flex flex-col">

        {/* Header with Snip Score */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-cyan-400">Enhanced Analysis</h2>
            {getDataQualityBadge()}
          </div>

          {/* Snip Score Display */}
          {enhanced?.score && (
            <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${getScoreColor(enhanced.score.total)}`}>
              <div className="text-center">
                <div className="text-3xl font-bold">{enhanced.score.total}</div>
                <div className={`text-xs uppercase ${getScoreCategory(enhanced.score.category)}`}>
                  {enhanced.score.category}
                </div>
              </div>
              <div className="h-12 w-px bg-slate-600" />
              <div className="text-xs text-slate-400 space-y-1">
                <div>Temp: {enhanced.score.breakdown.temperatureAndGradient}/20</div>
                <div>CHL: {enhanced.score.breakdown.chlorophyll}/20</div>
                <div>Fleet: {enhanced.score.breakdown.fleetActivity}/20</div>
              </div>
            </div>
          )}

          <button
            onClick={hideAnalysisModal}
            className="p-2 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Ocean Intel Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                <Waves className="w-5 h-5" />
                Ocean Intelligence
              </h3>

              {/* Enhanced SST Data */}
              {enhanced?.temperature ? (
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">Sea Surface Temperature</h4>

                  {/* Current Temperature Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Current Average:</span>
                      <span className="text-cyan-300 font-bold">{enhanced.temperature.currentAvgF.toFixed(1)}°F</span>
                    </div>
                    <div className="h-3 bg-slate-700 rounded-full relative">
                      <div
                        className="absolute h-3 bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 rounded-full"
                        style={{ width: `${((enhanced.temperature.currentAvgF - 32) / (90 - 32)) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{enhanced.temperature.rangeF.min.toFixed(1)}°F</span>
                      <span>{enhanced.temperature.rangeF.max.toFixed(1)}°F</span>
                    </div>
                  </div>

                  {/* Best Break */}
                  {enhanced.temperature.bestBreak && (
                    <div className="p-3 bg-green-500/10 rounded border border-green-500/30">
                      <p className="text-sm text-green-300">
                        <strong>Best Temperature Break Detected!</strong><br />
                        ΔT: {enhanced.temperature.bestBreak.strengthF.toFixed(1)}°F at {enhanced.temperature.bestBreak.location}
                      </p>
                    </div>
                  )}

                  {/* Temperature Trends */}
                  {enhanced.trends && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        {enhanced.trends.sst7Day.changeF > 0 ? (
                          <TrendingUp className="w-4 h-4 text-red-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="text-slate-400">7-day:</span>
                        <span className="text-slate-200">{enhanced.trends.sst7Day.trend}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {enhanced.trends.sst14Day.changeF > 0 ? (
                          <TrendingUp className="w-4 h-4 text-red-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="text-slate-400">14-day:</span>
                        <span className="text-slate-200">{enhanced.trends.sst14Day.trend}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : results.sst && (
                // Fallback to original SST display
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
                  </div>
                </div>
              )}

              {/* Enhanced CHL Data */}
              {enhanced?.chlorophyll ? (
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-medium text-slate-300">Chlorophyll & Water Quality</h4>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Current Average:</span>
                      <span className="text-cyan-300 font-bold">{enhanced.chlorophyll.currentAvg.toFixed(2)} mg/m³</span>
                    </div>

                    {/* Clarity Scale */}
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-sm">Clarity:</span>
                      <div
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${enhanced.chlorophyll.clarityColor}20`,
                          color: enhanced.chlorophyll.clarityColor,
                          border: `1px solid ${enhanced.chlorophyll.clarityColor}50`
                        }}
                      >
                        {enhanced.chlorophyll.clarity}
                      </div>
                    </div>
                  </div>

                  {/* Chlorophyll Trends */}
                  {enhanced.trends && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        {enhanced.trends.chl7Day.change > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="text-slate-400">7-day:</span>
                        <span className="text-slate-200">{enhanced.trends.chl7Day.trend}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {enhanced.trends.chl14Day.change > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-400" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-blue-400" />
                        )}
                        <span className="text-slate-400">14-day:</span>
                        <span className="text-slate-200">{enhanced.trends.chl14Day.trend}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : results.chl && (
                // Fallback to original CHL display
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium text-slate-300">Chlorophyll Concentration</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-slate-500">Average:</span>
                      <span className="ml-2 text-slate-200">{results.chl.mean.toFixed(2)} mg/m³</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Oceanographic Features */}
              {enhanced?.oceanographicFeatures && enhanced.oceanographicFeatures.features.length > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                  <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    Oceanographic Features Detected
                  </h4>
                  <div className="space-y-2">
                    {['edge', 'filament', 'eddy'].map(type => {
                      const count = enhanced.oceanographicFeatures.features.filter((f: any) =>
                        f.properties?.type === type
                      ).length;
                      if (count === 0) return null;

                      const colors = {
                        edge: 'text-red-400',
                        filament: 'text-yellow-400',
                        eddy: 'text-green-400'
                      };

                      return (
                        <div key={type} className="flex items-center justify-between text-sm">
                          <span className={`capitalize ${colors[type]}`}>{type}s:</span>
                          <span className="text-slate-300 font-bold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Vessel & Environmental Section */}
            <div className="space-y-4">

              {/* Enhanced Fleet Intel */}
              {enhanced?.fleetActivity ? (
                <div>
                  <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2 mb-3">
                    <Anchor className="w-5 h-5" />
                    Fleet Intelligence
                  </h3>
                  <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Fleet Density:</span>
                      <span className={`text-sm font-bold uppercase ${
                        enhanced.fleetActivity.density === 'high' ? 'text-green-400' :
                        enhanced.fleetActivity.density === 'medium' ? 'text-yellow-400' :
                        enhanced.fleetActivity.density === 'low' ? 'text-orange-400' :
                        'text-red-400'
                      }`}>
                        {enhanced.fleetActivity.density}
                      </span>
                    </div>

                    {enhanced.fleetActivity.vessels.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 uppercase">Active Vessels:</p>
                        {enhanced.fleetActivity.vessels.slice(0, 3).map((vessel, idx) => (
                          <div key={idx} className="p-2 bg-slate-700/50 rounded text-sm">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-300 font-medium">{vessel.name}</span>
                              <span className="text-xs text-slate-500">{vessel.dwellTime}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {vessel.type} • {vessel.activity}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : results.vessels && results.vessels.length > 0 && (
                // Fallback to original vessel display
                <div>
                  <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2 mb-3">
                    <Anchor className="w-5 h-5" />
                    Vessel Intelligence
                  </h3>
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-sm text-slate-400 mb-2">
                      {results.vessels.length} vessel{results.vessels.length > 1 ? 's' : ''} detected
                    </p>
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

              {/* Narrative Summary */}
              {enhanced?.narrative && (
                <div>
                  <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2 mb-3">
                    <Fish className="w-5 h-5" />
                    Analysis Summary
                  </h3>
                  <div className="bg-cyan-500/10 rounded-lg border border-cyan-500/30 p-4">
                    <p className="text-sm text-cyan-100 leading-relaxed">
                      {enhanced.narrative}
                    </p>
                  </div>
                </div>
              )}

              {/* Tactical Advice */}
              {enhanced?.tactical && (
                <div className="bg-green-500/10 rounded-lg border border-green-500/30 p-4">
                  <h4 className="text-sm font-semibold text-green-300 mb-2">Tactical Advice:</h4>
                  <p className="text-sm text-green-100">
                    {enhanced.tactical}
                  </p>
                </div>
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