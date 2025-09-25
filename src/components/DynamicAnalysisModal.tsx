import React from 'react'
import type { AnalysisVM } from '@/types/analyze'

type Props = {
  vm: AnalysisVM | null
  sstOn: boolean
  chlOn: boolean
  isOpen: boolean
  onClose: () => void
  onEnableLayers: () => void
}

export default function DynamicAnalysisModal({
  vm, sstOn, chlOn, isOpen, onClose, onEnableLayers
}: Props) {
  if (!isOpen) return null
  if (!vm) return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <section className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 border border-cyan-500/20">
        <h3 className="text-xl font-bold text-white mb-4">Ocean Analysis</h3>
        <p className="text-gray-300">No analysis yet.</p>
        <button 
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
        >
          Close
        </button>
      </section>
    </div>
  )

  const { areaKm2, sst, chl, hasSST, hasCHL, narrative } = vm
  const oceanLayersActive = sstOn && chlOn
  const haveData = (!!sst && hasSST) || (!!chl && hasCHL)

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <section className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 border border-cyan-500/20 max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">Ocean Analysis</h3>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">LIVE DATA</span>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close"
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </header>

        {!oceanLayersActive && (
          <div className="text-center py-8">
            <p className="text-gray-300 mb-4">
              Ocean data layers are not currently active.<br/>
              Enable SST and CHL layers to see live analysis.
            </p>
            <button 
              onClick={onEnableLayers}
              className="px-6 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
            >
              Enable Ocean Layers
            </button>
          </div>
        )}

        {oceanLayersActive && !haveData && (
          <div className="py-4">
            {!hasSST && <p className="text-yellow-400 mb-2">⚠️ SST data not available for this area/time.</p>}
            {!hasCHL && <p className="text-yellow-400 mb-2">⚠️ Chlorophyll data not available for this area/time.</p>}
            <p className="text-gray-300 mb-4">Analysis area: {areaKm2.toFixed(1)} km²</p>
            <div className="bg-gray-800 rounded p-4">
              <p className="text-gray-300 font-semibold mb-2">Try:</p>
              <ul className="text-gray-400 space-y-1 list-disc list-inside">
                <li>Select a different date</li>
                <li>Move to an area with better coverage</li>
                <li>Check back later for updated data</li>
              </ul>
            </div>
          </div>
        )}

        {oceanLayersActive && haveData && (
          <div className="space-y-6">
            {/* Primary Narrative */}
            {narrative && (
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
                <p className="text-cyan-100 whitespace-pre-line">{narrative}</p>
              </div>
            )}

            {/* SST Analysis */}
            {sst && (
              <div>
                <h4 className="text-lg font-semibold text-cyan-400 mb-3">Temperature Analysis</h4>
                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Average:</span>
                    <span className="text-white font-medium">{sst.meanF.toFixed(1)}°F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Range:</span>
                    <span className="text-white font-medium">{sst.minF.toFixed(1)}°F - {sst.maxF.toFixed(1)}°F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gradient:</span>
                    <span className="text-white font-medium">{sst.gradFperMile.toFixed(1)}°F/mile</span>
                  </div>
                  {sst.gradFperMile > 1.0 && (
                    <div className="mt-2 text-green-400 text-sm">
                      ✓ Strong thermal edge detected - favorable conditions
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chlorophyll Analysis */}
            {chl && (
              <div>
                <h4 className="text-lg font-semibold text-emerald-400 mb-3">Water Quality</h4>
                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chlorophyll:</span>
                    <span className="text-white font-medium">{chl.mean.toFixed(2)} mg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Clarity:</span>
                    <span className="text-white font-medium">
                      {chl.mean < 0.2 ? 'Very Clear' : chl.mean < 0.5 ? 'Good' : 'Moderate'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Productivity:</span>
                    <span className="text-white font-medium">
                      {chl.mean < 0.1 ? 'Low' : chl.mean < 0.8 ? 'Active feeding zone' : 'High'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div>
              <h4 className="text-lg font-semibold text-blue-400 mb-3">Recommendations</h4>
              <div className="bg-gray-800 rounded-lg p-4">
                <ul className="text-gray-300 space-y-2">
                  {sst && sst.gradFperMile > 1.0 && (
                    <li className="flex items-start">
                      <span className="text-cyan-400 mr-2">•</span>
                      Work the temperature break tight
                    </li>
                  )}
                  {sst && (
                    <li className="flex items-start">
                      <span className="text-cyan-400 mr-2">•</span>
                      Focus on the {sst.meanF > 75 ? 'warmer' : 'cooler'} side of the edge
                    </li>
                  )}
                  {chl && chl.mean > 0.2 && chl.mean < 0.8 && (
                    <li className="flex items-start">
                      <span className="text-cyan-400 mr-2">•</span>
                      Good water clarity for sight feeding
                    </li>
                  )}
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">•</span>
                    Best action at first light
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer Info */}
            <div className="text-center text-gray-500 text-sm pt-4 border-t border-gray-700">
              Analysis area: {areaKm2.toFixed(1)} km² • Confidence: {vm.confidence}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
