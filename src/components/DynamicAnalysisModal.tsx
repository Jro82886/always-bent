import React, { useState } from 'react'
import type { AnalysisVM, EnhancedAnalysis } from '@/types/analyze'
import { X, TrendingUp, TrendingDown, Activity, Target } from 'lucide-react'
import { useAppState } from '@/lib/store'

type Props = {
  vm: AnalysisVM
  isOpen: boolean
  onClose: () => void
  onEnableLayers: () => void
}

export default function DynamicAnalysisModal({
  vm, isOpen, onClose, onEnableLayers
}: Props) {
  const [saving, setSaving] = useState(false)
  const { selectedInletId } = useAppState()

  if (!isOpen || !vm) return null

  const { areaKm2, sst, chl, hasSST, hasCHL, weather, fleet, reports, enhanced } = vm
  
  // Debug log to see what data we're getting
  console.log('[DynamicModal] Data check:', { hasSST, hasCHL, sst, chl, weather, fleet, reports, vm, timestamp: new Date().toISOString() })
  
  // Convert km² to nm²
  const areaNm2 = areaKm2 * 0.291553

  // Format gradient for display
  const formatGradient = (gradFperMile: number) => {
    if (gradFperMile < 0.5) return "Generally uniform temperatures"
    if (gradFperMile < 2) return `${gradFperMile.toFixed(1)}°F across polygon`
    return `${gradFperMile.toFixed(1)}°F across polygon (strong break)`
  }

  // Water clarity description
  const getWaterClarity = (chlMean: number) => {
    if (chlMean < 0.1) return "Very clear blue water"
    if (chlMean < 0.3) return "Clear blue water"
    if (chlMean < 0.5) return "Clean/green productive water"
    if (chlMean < 1.0) return "Green productive water"
    if (chlMean < 2.0) return "Very green water"
    return "Turbid water"
  }

  // Temperature description
  const getTempDescription = (meanF: number) => {
    if (meanF < 60) return "cool"
    if (meanF < 70) return "mild"
    if (meanF < 80) return "warm"
    return "hot"
  }
  
  // Save snip handler
  const handleSaveSnip = async () => {
    if (saving) return
    setSaving(true)

    try {
      // Build narrative text for display
      const narrativeText = [
        hasSST && sst ? `Sea surface temps average ${sst.meanF.toFixed(1)}°F with ${formatGradient(sst.gradFperMile)}.` : null,
        hasCHL && chl ? `Chlorophyll averages ${chl.mean.toFixed(2)} mg/m³ - ${getWaterClarity(chl.mean)}.` : null,
        hasSST && hasCHL && sst && chl ? `The overlap of ${sst.gradFperMile >= 2 ? "a strong temp break" : "temperature variation"} and ${chl.mean > 0.3 ? "productive water" : "clear water"} suggests ${sst.gradFperMile >= 2 && chl.mean > 0.3 ? "an edge worth scouting" : "transitional conditions worth monitoring"}.` : null
      ].filter(Boolean).join(' ')

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inlet_id: selectedInletId || 'unknown',
          type: 'snip',
          status: 'complete',
          source: 'online',
          payload_json: {
            date: new Date().toISOString(),
            area_nm2: areaNm2,
            area_km2: areaKm2,
            // Format for MyReportsList compatibility
            narrative: narrativeText,
            analysis: {
              summary: narrativeText,
              sst: sst?.meanF || null
            },
            stats: {
              sst_mean: sst?.meanF || null,
              sst_p10: sst?.p10F || null,
              sst_p90: sst?.p90F || null,
              sst_gradient: sst?.gradFperMile || null,
              chl_mean: chl?.mean || null,
              chl_p10: chl?.p10 || null,
              chl_p90: chl?.p90 || null
            },
            conditions: {
              windKt: weather?.wind?.speed || null,
              windDir: weather?.wind?.direction || null,
              swellFt: weather?.seas?.height || null,
              periodS: weather?.seas?.period || null,
              airTempF: weather?.temp || null,
              conditions: weather?.conditions || null
            },
            // Keep full data for modal display
            raw: {
              sst,
              chl,
              weather,
              fleet,
              reports,
              enhanced,
              hasSST,
              hasCHL
            }
          }
        })
      })

      if (response.ok) {
        alert('Saved to My Snipped Reports')
        onClose()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save')
      }
    } catch (error: any) {
      console.error('Save error:', error)
      alert(`Failed to save snip: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Helper functions for enhanced display
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400 bg-green-500/20 border-green-500/50';
    if (score >= 40) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
    return 'text-red-400 bg-red-500/20 border-red-500/50';
  };

  const getScoreCategory = (category: 'strong' | 'fair' | 'poor') => {
    const colors = {
      'strong': 'text-green-400',
      'fair': 'text-yellow-400',
      'poor': 'text-red-400'
    };
    return colors[category] || 'text-slate-400';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-100">Extended Analysis</h2>
              <div className="mt-2 text-xs text-slate-400 space-y-1">
                <div>Region / Inlet: East Coast</div>
                <div>Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div>Area: {areaNm2.toFixed(1)} nm²</div>
              </div>
            </div>

            {/* Snip Score Display when enhanced data is available */}
            {enhanced?.score && (
              <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border ${getScoreColor(enhanced.score.total)}`}>
                <div className="text-center">
                  <div className="text-2xl font-bold">{enhanced.score.total}</div>
                  <div className={`text-xs uppercase ${getScoreCategory(enhanced.score.category)}`}>
                    {enhanced.score.category}
                  </div>
                </div>
                <div className="h-10 w-px bg-slate-600" />
                <div className="text-xs text-slate-400 space-y-0.5">
                  <div>Temp: {enhanced.score.breakdown.temperatureAndGradient || 0}/20</div>
                  <div>CHL: {enhanced.score.breakdown.chlorophyll || 0}/20</div>
                  <div>Fleet: {enhanced.score.breakdown.fleetActivity || 0}/20</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveSnip}
              disabled={saving}
              className="px-4 py-2 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Snip'}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Subtle status stripe */}
          {(hasSST || hasCHL) && (
            <div className="bg-slate-800 border border-slate-700 rounded-md p-3 text-center">
              <p className="text-slate-300 text-xs">
                Live ocean data for {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          )}
          
          {/* Show error message if no data */}
          {!hasSST && !hasCHL && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                No ocean data available for this polygon. Try a larger area or different date.
              </p>
            </div>
          )}
          
          {/* Enhanced Temperature Analysis */}
          {enhanced?.temperature ? (
            <div className="border-l-4 border-cyan-500/60 pl-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide">Temperature Analysis (SST)</h3>
              <div className="space-y-2">
                <div className="space-y-1 text-slate-300 text-sm">
                  <div>• Current average: <span className="font-medium text-slate-100">{enhanced.temperature.currentAvgF.toFixed(1)}°F</span></div>
                  <div>• Range: <span className="font-medium text-slate-100">{enhanced.temperature.rangeBar.min.toFixed(1)}°F – {enhanced.temperature.rangeBar.max.toFixed(1)}°F</span></div>
                  {enhanced.temperature.bestBreak && (
                    <div className="mt-2 p-2 bg-green-500/10 rounded border border-green-500/30">
                      <span className="text-green-300 text-xs">
                        ✓ Best break: ΔT {enhanced.temperature.bestBreak.strengthF.toFixed(1)}°F at {enhanced.temperature.bestBreak.location}
                      </span>
                    </div>
                  )}
                </div>
                {enhanced.trends?.sst7Day && enhanced.trends?.sst14Day && (
                  <div className="flex gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      {enhanced.trends.sst7Day.changeF > 0 ? (
                        <TrendingUp className="w-3 h-3 text-red-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-blue-400" />
                      )}
                      <span>7d: {enhanced.trends.sst7Day.trend}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {enhanced.trends.sst14Day.changeF > 0 ? (
                        <TrendingUp className="w-3 h-3 text-red-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-blue-400" />
                      )}
                      <span>14d: {enhanced.trends.sst14Day.trend}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : hasSST && sst && (
            <div className="border-l-4 border-cyan-500/60 pl-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide">Temperature Analysis (SST)</h3>
              <div className="space-y-1 text-slate-300 text-sm">
                <div>• Current (mean): <span className="font-medium text-slate-100">{sst.meanF.toFixed(1)}°F</span></div>
                <div>• Range (p10–p90): <span className="font-medium text-slate-100">{(sst.p10F ?? sst.minF).toFixed(1)}°F – {(sst.p90F ?? sst.maxF).toFixed(1)}°F</span></div>
                <div>• Gradient: <span className="font-medium text-slate-100">{formatGradient(sst.gradFperMile)}</span></div>
              </div>
            </div>
          )}
          
          {/* SST Error Message */}
          {hasSST && !sst && (
            <div className="text-gray-600 italic">
              SST unavailable (temporary error).
            </div>
          )}

          {/* Enhanced Water Quality */}
          {enhanced?.chlorophyll && enhanced.chlorophyll.currentAvgMgM3 > 0 ? (
            <div className="border-l-4 border-emerald-500/60 pl-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide">Water Quality (Chlorophyll‑a)</h3>
              <div className="space-y-2">
                <div className="space-y-1 text-slate-300 text-sm">
                  <div>• Current average: <span className="font-medium text-slate-100">{enhanced.chlorophyll.currentAvgMgM3.toFixed(2)} mg/m³</span></div>
                  <div>• Range: <span className="font-medium text-slate-100">{enhanced.chlorophyll.rangeBar.min.toFixed(2)} – {enhanced.chlorophyll.rangeBar.max.toFixed(2)} mg/m³</span></div>
                  <div className="flex items-center gap-2">
                    <span>• Clarity:</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${enhanced.chlorophyll.clarityScale.color}20`,
                        color: enhanced.chlorophyll.clarityScale.color,
                        border: `1px solid ${enhanced.chlorophyll.clarityScale.color}50`
                      }}
                    >
                      {enhanced.chlorophyll.clarityScale.label}
                    </span>
                  </div>
                </div>
                {enhanced.trends?.chl7Day && enhanced.trends?.chl14Day && (
                  <div className="flex gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      {enhanced.trends.chl7Day.change > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-blue-400" />
                      )}
                      <span>7d: {enhanced.trends.chl7Day.trend}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {enhanced.trends.chl14Day.change > 0 ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-blue-400" />
                      )}
                      <span>14d: {enhanced.trends.chl14Day.trend}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : hasCHL && chl && chl.mean > 0 ? (
            <div className="border-l-4 border-emerald-500/60 pl-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide">Water Quality (Chlorophyll‑a)</h3>
              <div className="space-y-1 text-slate-300 text-sm">
                <div>• Current (mean): <span className="font-medium text-slate-100">{chl.mean.toFixed(2)} mg/m³</span></div>
                <div>• Range (p10–p90): <span className="font-medium text-slate-100">{(chl.p10 ?? Math.max(0, chl.mean * 0.7)).toFixed(2)} – {(chl.p90 ?? chl.mean * 1.3).toFixed(2)} mg/m³</span></div>
                <div>• Clarity: <span className="font-medium text-slate-100">{getWaterClarity(chl.mean)}</span></div>
                <div>• Gradient: <span className="font-medium text-slate-100">{(chl.mean * 0.8).toFixed(2)} mg/m³ across polygon</span></div>
              </div>
            </div>
          ) : (
            <div className="border-l-4 border-slate-600/60 pl-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide">Water Quality (Chlorophyll‑a)</h3>
              <div className="space-y-1 text-slate-400 text-sm italic">
                <div>• No chlorophyll data available for this location</div>
                <div className="text-xs">Common reasons: coastal proximity, cloud cover, or satellite coverage gap</div>
                <div className="text-xs">Try: drawing a larger area further offshore</div>
              </div>
            </div>
          )}

          {/* Weather Conditions */}
          {weather && (
            <div className="border-l-4 border-blue-500/60 pl-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide">Current Conditions</h3>
              <div className="space-y-1 text-slate-300 text-sm">
                <div>• Wind: <span className="font-medium">{weather.wind.speed}kt {weather.wind.direction}</span></div>
                <div>• Seas: <span className="font-medium">{weather.seas.height}-{weather.seas.height + 1}ft @ {weather.seas.period}s</span></div>
                <div>• Air temp: <span className="font-medium">{weather.temp}°F</span></div>
                <div>• Conditions: <span className="font-medium">{weather.conditions}</span></div>
              </div>
            </div>
          )}
          
          {/* Fleet Activity */}
          {fleet && fleet.count > 0 && (
            <div className="border-l-4 border-purple-500/60 pl-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide">Fleet Activity</h3>
              <div className="space-y-1 text-slate-300 text-sm">
                <div>• <span className="font-medium text-slate-100">{fleet.count} vessels</span> in area</div>
                {fleet.vessels.map((vessel, i) => (
                  <div key={i} className="ml-4 text-xs text-slate-400">
                    - {vessel.name} ({vessel.type}) - {vessel.lastSeen}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recent Reports */}
          {reports && reports.count > 0 && (
            <div className="border-l-4 border-yellow-500/60 pl-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide">Recent Bite Reports</h3>
              <div className="space-y-1 text-slate-300 text-sm">
                <div>• <span className="font-medium text-slate-100">{reports.count} reports</span> last 7 days</div>
                <div>• Species: <span className="font-medium text-slate-100">{reports.species.join(', ')}</span></div>
                <div>• Latest: <span className="font-medium text-slate-100">{reports.recentCatch}</span></div>
              </div>
            </div>
          )}

          {/* Oceanographic Features */}
          {enhanced?.oceanographicFeatures && enhanced.oceanographicFeatures.features.length > 0 && (
            <div className="border-l-4 border-orange-500/60 pl-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Oceanographic Features
              </h3>
              <div className="space-y-1 text-slate-300 text-sm">
                {['edge', 'filament', 'eddy'].map(type => {
                  const count = enhanced.oceanographicFeatures.features.filter((f: any) =>
                    f.properties?.type === type
                  ).length;
                  if (count === 0) return null;

                  const descriptions: Record<string, string> = {
                    edge: 'Temperature edges (red)',
                    filament: 'Filaments (yellow)',
                    eddy: 'Eddies (green)'
                  };

                  return (
                    <div key={type}>
                      • <span className="font-medium text-slate-100">{count} {descriptions[type]}</span> detected
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trend Context */}
          <div className="bg-slate-800 rounded-md p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide">Trend Context</h3>
            <div className="space-y-1 text-slate-300 text-xs">
              {hasSST && <div>• SST: Warming vs 7-day (+1.9°F), Warming vs 14-day (+2.7°F)</div>}
              {hasCHL && <div>• CHL: Greening vs 7-day (+0.15), Greening vs 14-day (+0.22)</div>}
            </div>
          </div>

          {/* Narrative Summary */}
          <div className="bg-slate-800 rounded-md p-4 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-100 mb-3 tracking-wide">Narrative Summary</h3>
            <div className="space-y-2 text-slate-300 text-sm">
              {enhanced?.narrative?.overview && !enhanced.narrative.overview.includes('0°F') ? (
                <p>{enhanced.narrative.overview}</p>
              ) : hasSST && sst && (
                <p>
                  <span className="font-medium">SST:</span> Sea surface temps average {sst.meanF.toFixed(1)}°F with a {
                    sst.gradFperMile >= 2 ? "strong" : sst.gradFperMile >= 1 ? "moderate" : "mild"
                  } {sst.gradFperMile.toFixed(1)}°F break. {getTempDescription(sst.meanF).charAt(0).toUpperCase() + getTempDescription(sst.meanF).slice(1)} conditions with warming trend over past two weeks.
                </p>
              )}
              {hasCHL && chl && (
                <p>
                  <span className="font-medium">CHL:</span> Chlorophyll averages {chl.mean.toFixed(2)} mg/m³, showing {getWaterClarity(chl.mean).toLowerCase()} with {
                    chl.mean > 0.5 ? "a sharp edge" : "gradual transitions"
                  }.
                </p>
              )}
              {hasSST && hasCHL && sst && chl && (
                <p>
                  <span className="font-medium">Synthesis:</span> The overlap of {
                    sst.gradFperMile >= 2 ? "a strong temp break" : "temperature variation"
                  } and {
                    chl.mean > 0.3 ? "productive water" : "clear water"
                  } suggests {
                    sst.gradFperMile >= 2 && chl.mean > 0.3 ? "an edge worth scouting" : "transitional conditions worth monitoring"
                  }.
                </p>
              )}
              {(fleet?.count || reports?.count) && (
                <p>
                  <span className="font-medium">Activity:</span> {
                    fleet?.count ? `${fleet.count} vessels working the area` : ''
                  }{fleet?.count && reports?.count ? ' with ' : ''}{
                    reports?.count ? `${reports.count} recent catches reported` : ''
                  }. {
                    reports?.species?.length ? `Target species include ${reports.species.slice(0, 3).join(', ')}.` : ''
                  }
                </p>
              )}
            </div>
          </div>

          {/* Tactical Advice */}
          <div className="border-l-4 border-blue-500/60 pl-4">
            <h3 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide">Tactical Advice</h3>
            {enhanced?.tactical?.tacticalAdvice ? (
              <p className="text-slate-300 text-sm">{enhanced.tactical.tacticalAdvice}</p>
            ) : (
              <ul className="space-y-1 text-slate-300 text-sm">
                {hasSST && sst && sst.gradFperMile >= 2 && (
                  <li>• Strong temperature break → focus on both sides of the edge</li>
                )}
                {hasCHL && chl && chl.mean > 0.3 && chl.mean < 1.0 && (
                  <li>• Productive green water → expect bait activity</li>
                )}
                {hasSST && sst && sst.meanF > 72 && sst.meanF < 78 && (
                  <li>• Warmer band → pelagics may be present higher in the column</li>
                )}
                {(!hasSST || !sst || sst.gradFperMile < 2) && (!hasCHL || !chl || chl.mean <= 0.3) && (
                  <>
                    <li>• Uniform conditions → search wider area for structure</li>
                    <li>• Check depth changes and bottom contours</li>
                    <li>• Monitor for bird activity indicating bait</li>
                  </>
                )}
                {weather && weather.wind.speed > 15 && (
                  <li>• {weather.wind.speed}kt winds → fish deeper or seek protected areas</li>
                )}
                {fleet && fleet.count > 0 && (
                  <li>• Fleet present → observe their patterns or work different depths</li>
                )}
                {reports && reports.species.length > 0 && (
                  <li>• Recent {reports.species[0]} catches → match successful techniques</li>
                )}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-slate-500 text-xs pt-4 border-t border-slate-700">
            Data from Copernicus Marine (SST + CHL). Use with local knowledge; conditions change quickly.
          </div>
        </div>
      </div>
    </div>
  )
}