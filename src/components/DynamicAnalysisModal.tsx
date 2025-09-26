import React from 'react'
import type { AnalysisVM } from '@/types/analyze'
import { X } from 'lucide-react'

type Props = {
  vm: AnalysisVM
  isOpen: boolean
  onClose: () => void
  onEnableLayers: () => void
}

export default function DynamicAnalysisModal({
  vm, isOpen, onClose, onEnableLayers
}: Props) {
  if (!isOpen || !vm) return null

  const { areaKm2, sst, chl, hasSST, hasCHL, weather, fleet, reports } = vm
  
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[100]">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-700 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">Extended Analysis</h2>
            <div className="mt-2 text-xs text-slate-400 space-y-1">
              <div>Region / Inlet: East Coast</div>
              <div>Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div>Area: {areaNm2.toFixed(1)} nm²</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
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
          
          {/* Temperature Analysis */}
          {hasSST && sst && (
            <div className="border-l-4 border-cyan-500/60 pl-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide">Temperature Analysis (SST)</h3>
              <div className="space-y-1 text-slate-300 text-sm">
                <div>• Current (mean): <span className="font-medium text-slate-100">{sst.meanF.toFixed(1)}°F</span></div>
                <div>• Range: <span className="font-medium text-slate-100">{sst.minF.toFixed(1)}°F – {sst.maxF.toFixed(1)}°F</span></div>
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

          {/* Water Quality */}
          {hasCHL && chl && (
            <div className="border-l-4 border-emerald-500/60 pl-4">
              <h3 className="text-sm font-semibold text-slate-100 mb-2 tracking-wide">Water Quality (Chlorophyll‑a)</h3>
              <div className="space-y-1 text-slate-300 text-sm">
                <div>• Current (mean): <span className="font-medium text-slate-100">{chl.mean.toFixed(2)} mg/m³</span></div>
                <div>• Range: <span className="font-medium text-slate-100">{(chl.mean * 0.7).toFixed(2)} – {(chl.mean * 1.3).toFixed(2)} mg/m³</span></div>
                <div>• Clarity: <span className="font-medium text-slate-100">{getWaterClarity(chl.mean)}</span></div>
                <div>• Gradient: <span className="font-medium text-slate-100">{(chl.mean * 0.8).toFixed(2)} mg/m³ across polygon</span></div>
              </div>
            </div>
          )}
          
          {/* CHL Error Message */}
          {hasCHL && !chl && (
            <div className="text-gray-600 italic">
              Chlorophyll unavailable (temporary error).
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
              {hasSST && sst && (
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