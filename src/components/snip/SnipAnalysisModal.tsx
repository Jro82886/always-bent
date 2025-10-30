'use client';

import React from 'react';
import { useSnipStore } from '@/store/snip-store';
import { X, Anchor, Wind, Waves, Fish, Thermometer, MapPin, TrendingUp, TrendingDown, Minus, Activity, Droplets, Target } from 'lucide-react';
import type { SnipAnalysisReport } from '@/lib/analysis/snip-report-analyzer';
import { getEastCoastColor, getEastCoastLabel, getEastCoastFishingNote } from '@/components/EastCoastTemperatureScale';

export default function SnipAnalysisModal() {
  const { results, showModal, hideAnalysisModal, returnToOverview } = useSnipStore();

  if (!showModal || !results) return null;

  // Check if we have the new comprehensive report
  const comprehensive = results.comprehensiveReport as SnipAnalysisReport | undefined;

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

  const getScoreBadge = (score: number) => {
    let color = '';
    if (score >= 70) color = 'bg-green-500/20 text-green-300 border-green-500/50';
    else if (score >= 40) color = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    else color = 'bg-red-500/20 text-red-300 border-red-500/50';

    return (
      <div className={`px-3 py-2 rounded-lg border ${color}`}>
        <div className="text-2xl font-bold">{score}</div>
        <div className="text-xs">/ 100</div>
      </div>
    );
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'warming' || trend === 'greening') return <TrendingUp className="w-4 h-4 text-orange-400" />;
    if (trend === 'cooling' || trend === 'clearing') return <TrendingDown className="w-4 h-4 text-blue-400" />;
    return <Minus className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={hideAnalysisModal}
      />

      {/* Modal */}
      <div className="relative w-[95%] max-w-6xl max-h-[90vh] bg-slate-900 rounded-lg shadow-2xl border border-slate-700 pointer-events-auto overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-cyan-400">ABFI Comprehensive Analysis</h2>
            {getDataQualityBadge()}
            {comprehensive && (
              <div className="flex items-center gap-2">
                {getScoreBadge(comprehensive.score.total)}
                <span className="text-xs text-slate-400">
                  {comprehensive.score.category}
                </span>
              </div>
            )}
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
          {comprehensive ? (
            /* NEW COMPREHENSIVE REPORT VIEW */
            <div className="space-y-6">

              {/* Narrative Summary */}
              {comprehensive.narrative && (
                <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                  <h3 className="text-sm font-semibold text-cyan-300 mb-2">Analysis Summary</h3>
                  <p className="text-sm text-slate-300 mb-3">{comprehensive.narrative.overview}</p>

                  {comprehensive.narrative.tacticalAdvice && (
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <h4 className="text-xs font-semibold text-green-300 mb-1">Tactical Advice</h4>
                      <p className="text-sm text-green-200">{comprehensive.narrative.tacticalAdvice}</p>
                    </div>
                  )}

                  {comprehensive.narrative.keyFactors.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {comprehensive.narrative.keyFactors.map((factor, idx) => (
                        <p key={idx} className="text-xs text-slate-300">▲ {factor}</p>
                      ))}
                    </div>
                  )}

                  {comprehensive.narrative.warnings.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {comprehensive.narrative.warnings.map((warning, idx) => (
                        <p key={idx} className="text-xs text-yellow-300">⚠ {warning}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Score Breakdown */}
              {comprehensive.score && (
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Score Breakdown
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-400">{comprehensive.score.breakdown.temperatureGradient}</div>
                      <div className="text-xs text-slate-400">Temp + Grad</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{comprehensive.score.breakdown.chlorophyll}</div>
                      <div className="text-xs text-slate-400">Chlorophyll</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{comprehensive.score.breakdown.fleetActivity}</div>
                      <div className="text-xs text-slate-400">Fleet</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{comprehensive.score.breakdown.userReports}</div>
                      <div className="text-xs text-slate-400">Reports</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{comprehensive.score.breakdown.trendAlignment}</div>
                      <div className="text-xs text-slate-400">Trends</div>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-500 text-center">
                    Each category worth up to 20 points
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Temperature Analysis */}
                {comprehensive.temperature && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                      <Thermometer className="w-5 h-5" />
                      Temperature Analysis
                    </h3>

                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                      {/* East Coast Temperature Classification */}
                      <div className="p-3 rounded-lg border-2" style={{
                        backgroundColor: getEastCoastColor(comprehensive.temperature.currentAvgF) + '20',
                        borderColor: getEastCoastColor(comprehensive.temperature.currentAvgF)
                      }}>
                        <div className="text-lg font-bold" style={{
                          color: getEastCoastColor(comprehensive.temperature.currentAvgF)
                        }}>
                          {comprehensive.temperature.currentAvgF}°F - {getEastCoastLabel(comprehensive.temperature.currentAvgF)}
                        </div>
                        <div className="text-xs text-slate-300 mt-1">
                          {getEastCoastFishingNote(comprehensive.temperature.currentAvgF)}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500">Average:</span>
                          <span className="ml-2 text-slate-200 font-semibold">
                            {comprehensive.temperature.currentAvgF}°F
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Range:</span>
                          <span className="ml-2 text-slate-200">
                            {comprehensive.temperature.minF}°F - {comprehensive.temperature.maxF}°F
                          </span>
                        </div>
                      </div>

                      {/* Temperature Range Bar */}
                      <div className="space-y-1">
                        <div className="text-xs text-slate-500">Temperature Range</div>
                        <div className="relative h-6 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="absolute h-full bg-gradient-to-r from-blue-500 via-yellow-500 to-red-500 opacity-50"
                            style={{ width: '100%' }}
                          />
                          <div
                            className="absolute h-full w-1 bg-white"
                            style={{
                              left: `${((comprehensive.temperature.currentAvgF - comprehensive.temperature.minF) / (comprehensive.temperature.maxF - comprehensive.temperature.minF)) * 100}%`
                            }}
                          />
                        </div>
                      </div>

                      {/* Best Temperature Break */}
                      {comprehensive.temperature.bestBreak && (
                        <div className="p-3 bg-orange-500/10 rounded border border-orange-500/30">
                          <h4 className="text-xs font-semibold text-orange-300 mb-1">Best Temperature Break</h4>
                          <div className="text-sm text-slate-300">
                            <div><strong>{comprehensive.temperature.bestBreak.strengthF.toFixed(1)}°F</strong> change</div>
                            <div className="text-xs text-slate-400 mt-1">
                              {comprehensive.temperature.bestBreak.description}
                            </div>
                            <div className="text-xs text-orange-300 mt-2">
                              → Fish the <strong>{comprehensive.temperature.bestBreak.side}</strong> side
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Chlorophyll Analysis */}
                {comprehensive.chlorophyll && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                      <Droplets className="w-5 h-5" />
                      Water Quality
                    </h3>

                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500">Average:</span>
                          <span className="ml-2 text-slate-200 font-semibold">
                            {comprehensive.chlorophyll.currentAvgMgM3} mg/m³
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500">Range:</span>
                          <span className="ml-2 text-slate-200">
                            {comprehensive.chlorophyll.minMgM3} - {comprehensive.chlorophyll.maxMgM3}
                          </span>
                        </div>
                      </div>

                      {/* Clarity Scale */}
                      <div className="p-3 rounded" style={{ backgroundColor: comprehensive.chlorophyll.clarityScale.color + '20' }}>
                        <div className="text-sm font-semibold" style={{ color: comprehensive.chlorophyll.clarityScale.color }}>
                          {comprehensive.chlorophyll.clarityScale.label}
                        </div>
                        <div className="text-xs text-slate-400 mt-1">Water Clarity</div>
                      </div>

                      {/* Water Quality Break */}
                      {comprehensive.chlorophyll.waterQualityBreak && (
                        <div className="p-2 bg-green-500/10 rounded border border-green-500/30">
                          <p className="text-xs text-green-300">
                            ⬢ {comprehensive.chlorophyll.waterQualityBreak.description}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fleet Activity */}
                {comprehensive.fleetActivity && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                      <Anchor className="w-5 h-5" />
                      Fleet Activity
                    </h3>

                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-sm text-slate-500">Density:</span>
                        <span className="ml-2 text-slate-200 font-semibold capitalize">
                          {comprehensive.fleetActivity.density}
                        </span>
                      </div>

                      {comprehensive.fleetActivity.vessels.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs text-slate-400">
                            {comprehensive.fleetActivity.vessels.length} vessel(s) detected
                          </div>
                          {comprehensive.fleetActivity.vessels.slice(0, 3).map((vessel, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-2 bg-slate-700/30 rounded">
                              <div>
                                <div className="text-slate-200">{vessel.name}</div>
                                <div className="text-slate-500">{vessel.type}</div>
                              </div>
                              <div className="text-slate-400">
                                {vessel.dwellTimeHours}h dwell
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* User Reports */}
                      {comprehensive.fleetActivity.userReports.totalReports > 0 && (
                        <div className="p-3 bg-purple-500/10 rounded border border-purple-500/30">
                          <h4 className="text-xs font-semibold text-purple-300 mb-2">Community Reports</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-green-300">
                              ✓ {comprehensive.fleetActivity.userReports.caught} Caught
                            </div>
                            <div className="text-red-300">
                              ✗ {comprehensive.fleetActivity.userReports.noCatch} No Catch
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Trends */}
                {comprehensive.trends && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Trends
                    </h3>

                    <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                      {/* SST Trends */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 mb-2">Temperature Trends</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-300 flex items-center gap-2">
                              {getTrendIcon(comprehensive.trends.sst.sevenDay.trend)}
                              7-day
                            </span>
                            <span className="text-slate-200">
                              {comprehensive.trends.sst.sevenDay.deltaF > 0 ? '+' : ''}
                              {comprehensive.trends.sst.sevenDay.deltaF.toFixed(1)}°F
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-300 flex items-center gap-2">
                              {getTrendIcon(comprehensive.trends.sst.fourteenDay.trend)}
                              14-day
                            </span>
                            <span className="text-slate-200">
                              {comprehensive.trends.sst.fourteenDay.deltaF > 0 ? '+' : ''}
                              {comprehensive.trends.sst.fourteenDay.deltaF.toFixed(1)}°F
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CHL Trends */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 mb-2">Chlorophyll Trends</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-300 flex items-center gap-2">
                              {getTrendIcon(comprehensive.trends.chl.sevenDay.trend)}
                              7-day
                            </span>
                            <span className="text-slate-200">
                              {comprehensive.trends.chl.sevenDay.deltaMgM3 > 0 ? '+' : ''}
                              {comprehensive.trends.chl.sevenDay.deltaMgM3.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-300 flex items-center gap-2">
                              {getTrendIcon(comprehensive.trends.chl.fourteenDay.trend)}
                              14-day
                            </span>
                            <span className="text-slate-200">
                              {comprehensive.trends.chl.fourteenDay.deltaMgM3 > 0 ? '+' : ''}
                              {comprehensive.trends.chl.fourteenDay.deltaMgM3.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ocean Features */}
                {comprehensive.oceanFeatures && (comprehensive.oceanFeatures.edges > 0 || comprehensive.oceanFeatures.filaments > 0 || comprehensive.oceanFeatures.eddies > 0) && (
                  <div className="space-y-3 md:col-span-2">
                    <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                      <Waves className="w-5 h-5" />
                      Ocean Features Detected
                    </h3>

                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-red-400">{comprehensive.oceanFeatures.edges}</div>
                          <div className="text-xs text-slate-400">Edges</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-yellow-400">{comprehensive.oceanFeatures.filaments}</div>
                          <div className="text-xs text-slate-400">Filaments</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-400">{comprehensive.oceanFeatures.eddies}</div>
                          <div className="text-xs text-slate-400">Eddies</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            /* LEGACY REPORT VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Legacy view code here (keep existing code) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-300 flex items-center gap-2">
                  <Waves className="w-5 h-5" />
                  Ocean Intelligence
                </h3>

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
              </div>

              <div className="space-y-4">
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
          )}
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
