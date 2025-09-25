import React, { useEffect } from 'react'
import type { AnalysisVM } from '@/types/analyze'
import { assertNoStaticCopy, assertValidAnalysisData, trackAnalysisQuality } from '@/lib/antiStatic'

type Props = {
  vm: AnalysisVM  // NOT null - required real data
  sstOn: boolean
  chlOn: boolean
  isOpen: boolean
  onClose: () => void
  onEnableLayers: () => void
}

export default function DynamicAnalysisModal({
  vm, sstOn, chlOn, isOpen, onClose, onEnableLayers
}: Props) {
  // Track quality on mount
  useEffect(() => {
    if (isOpen && vm) {
      trackAnalysisQuality(vm)
    }
  }, [isOpen, vm])

  if (!isOpen) return null

  // HARD GUARDS - no fake data allowed
  if (!vm) {
    throw new Error('DynamicAnalysisModal opened without analysis data')
  }

  if (!vm.hasSST && !vm.hasCHL) {
    throw new Error('DynamicAnalysisModal opened without any ocean data capability')
  }

  // Validate real data if layers are on
  if ((sstOn || chlOn) && (vm.hasSST || vm.hasCHL)) {
    try {
      assertValidAnalysisData(vm)
    } catch (e) {
      console.error('[ABFI] Invalid analysis data:', e)
      // Show error state instead of crashing in production
      if (process.env.NODE_ENV === 'production') {
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <section className="bg-red-900 rounded-lg p-6 max-w-2xl w-full mx-4 border border-red-500">
              <h3 className="text-xl font-bold text-white mb-4">Data Error</h3>
              <p className="text-red-200">Analysis data validation failed. Please try again.</p>
              <button 
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Close
              </button>
            </section>
          </div>
        )
      }
      throw e
    }
  }

  const { areaKm2, sst, chl, hasSST, hasCHL, narrative } = vm
  const oceanLayersActive = sstOn && chlOn
  const haveData = (!!sst && hasSST) || (!!chl && hasCHL)

  // Build content and validate it's not static
  let content = ''
  
  if (!oceanLayersActive) {
    content = 'SST and CHL layers must be enabled to see ocean analysis.'
  } else if (!haveData) {
    const missing = []
    if (!hasSST) missing.push('SST')
    if (!hasCHL) missing.push('Chlorophyll')
    content = `${missing.join(' and ')} data not available for this area/time. Try a different date or location.`
  } else {
    // Real data content
    if (narrative) {
      content = narrative
    } else {
      // Build from data
      const parts = []
      
      if (sst) {
        const gradient = sst.gradFperMile
        if (gradient < 0.5) {
          parts.push(`Uniform water temperature (Δ ${gradient.toFixed(1)}°F/mile). Less productive conditions.`)
        } else if (gradient >= 2.0) {
          parts.push(`Sharp SST gradient of ${gradient.toFixed(1)}°F/mile — strong thermal edge detected.`)
        } else {
          parts.push(`Moderate SST gradient of ${gradient.toFixed(1)}°F/mile — transitional water.`)
        }
        parts.push(`Water temp: ${sst.meanF.toFixed(1)}°F (${sst.minF.toFixed(1)}-${sst.maxF.toFixed(1)}°F)`)
      }
      
      if (chl) {
        if (chl.mean < 0.1) {
          parts.push(`Very clear water (${chl.mean.toFixed(2)} mg/m³). Minimal bait presence.`)
        } else if (chl.mean >= 0.3 && chl.mean <= 1.0) {
          parts.push(`Good chlorophyll levels (${chl.mean.toFixed(2)} mg/m³) — active feeding zone.`)
        } else if (chl.mean > 2.0) {
          parts.push(`High chlorophyll (${chl.mean.toFixed(2)} mg/m³). May be too turbid.`)
        } else {
          parts.push(`Chlorophyll: ${chl.mean.toFixed(2)} mg/m³`)
        }
      }
      
      content = parts.join(' ')
    }
  }

  // CRITICAL: Block any static text
  try {
    assertNoStaticCopy(content)
  } catch (e) {
    console.error('[ABFI] Static text detected:', e)
    content = 'Real-time analysis unavailable. Please refresh.'
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <section className="bg-gray-900 rounded-lg p-6 max-w-2xl w-full mx-4 border border-cyan-500/20 max-h-[90vh] overflow-y-auto">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold text-white">Ocean Analysis</h3>
            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">LIVE DATA</span>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">v2</span>
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
            <p className="text-gray-300 mb-4">{content}</p>
            <button 
              onClick={onEnableLayers}
              className="px-6 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600"
            >
              Enable SST + CHL Layers
            </button>
          </div>
        )}

        {oceanLayersActive && !haveData && (
          <div className="py-4">
            <p className="text-yellow-400 mb-4">⚠️ {content}</p>
            <p className="text-gray-300 mb-4">Analysis area: {areaKm2.toFixed(1)} km²</p>
            <div className="bg-gray-800 rounded p-4">
              <p className="text-gray-300 font-semibold mb-2">Next steps:</p>
              <ul className="text-gray-400 space-y-1 list-disc list-inside">
                <li>Select a recent date (within last 3 days)</li>
                <li>Move to offshore waters with better coverage</li>
                <li>Check back in a few hours for updated data</li>
              </ul>
            </div>
          </div>
        )}

        {oceanLayersActive && haveData && (
          <div className="space-y-6">
            {/* Primary Analysis */}
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
              <p className="text-cyan-100 whitespace-pre-line">{content}</p>
            </div>

            {/* Data Breakdown */}
            {sst && (
              <div>
                <h4 className="text-lg font-semibold text-cyan-400 mb-3">Temperature Analysis</h4>
                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current:</span>
                    <span className="text-white font-medium">{sst.meanF.toFixed(1)}°F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Range:</span>
                    <span className="text-white font-medium">{sst.minF.toFixed(1)}°F - {sst.maxF.toFixed(1)}°F</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gradient:</span>
                    <span className="text-white font-medium">{sst.gradFperMile.toFixed(2)}°F/mile</span>
                  </div>
                  {sst.gradFperMile > 1.0 && (
                    <div className="mt-2 text-green-400 text-sm">
                      ✓ Thermal edge present - concentrate efforts here
                    </div>
                  )}
                </div>
              </div>
            )}

            {chl && (
              <div>
                <h4 className="text-lg font-semibold text-emerald-400 mb-3">Water Quality</h4>
                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Chlorophyll:</span>
                    <span className="text-white font-medium">{chl.mean.toFixed(3)} mg/m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Water clarity:</span>
                    <span className="text-white font-medium">
                      {chl.mean < 0.2 ? 'Blue water' : 
                       chl.mean < 0.5 ? 'Clean green' : 
                       chl.mean < 1.0 ? 'Green' : 'Dirty'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bait potential:</span>
                    <span className="text-white font-medium">
                      {chl.mean < 0.1 ? 'Low' : 
                       chl.mean < 0.8 ? 'Good' : 
                       'High'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Fishing Intel */}
            <div>
              <h4 className="text-lg font-semibold text-blue-400 mb-3">Tactical Advice</h4>
              <div className="bg-gray-800 rounded-lg p-4">
                <ul className="text-gray-300 space-y-2">
                  {sst && sst.gradFperMile > 1.0 && (
                    <li className="flex items-start">
                      <span className="text-cyan-400 mr-2">•</span>
                      Work the temperature break in a zigzag pattern
                    </li>
                  )}
                  {sst && sst.meanF > 72 && sst.meanF < 78 && (
                    <li className="flex items-start">
                      <span className="text-cyan-400 mr-2">•</span>
                      Optimal temperature range for pelagics
                    </li>
                  )}
                  {chl && chl.mean > 0.2 && chl.mean < 0.8 && (
                    <li className="flex items-start">
                      <span className="text-cyan-400 mr-2">•</span>
                      Water clarity ideal for sight casting
                    </li>
                  )}
                  <li className="flex items-start">
                    <span className="text-cyan-400 mr-2">•</span>
                    {new Date().getHours() < 10 ? 'Prime time - work this area hard' : 
                     new Date().getHours() > 16 ? 'Evening bite window approaching' :
                     'Midday - focus on deeper edges'}
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-gray-500 text-sm pt-4 border-t border-gray-700">
              Analysis area: {areaKm2.toFixed(1)} km² • 
              Confidence: {vm.confidence || 'high'} • 
              Data: {new Date().toLocaleTimeString()}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}