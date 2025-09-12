"use client";
import { useEffect, useState } from 'react';
import type { AnalysisResult } from '@/lib/analysis/sst-analyzer';
import { getAnalysisQuote } from '@/lib/philosophy';

interface AnalysisModalProps {
  analysis: AnalysisResult | null;
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function AnalysisModal({ analysis, visible, onClose, onSave }: AnalysisModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible && analysis) {
      // Show immediately when visible prop is true (user clicked)
      setIsVisible(true);
      setTimeout(() => {
        setIsAnimating(true);
      }, 50); // Small delay for animation
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [visible, analysis]);

  if (!isVisible || !analysis) return null;

  const { hotspot, stats, features, layerAnalysis } = analysis;
  
  // Find the strongest feature
  const strongestFeature = features.length > 0 ? 
    features.reduce((best, current) => 
      (current.properties.score > (best?.properties.score || 0)) ? current : best
    , features[0]) : null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div 
        className={`relative max-w-2xl w-full bg-gradient-to-br from-gray-900 via-black to-cyan-950 rounded-2xl shadow-2xl border border-cyan-500/30 transform transition-all duration-700 ${
          isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 blur-xl -z-10" />
        
        {/* Header with pulse indicator */}
        <div className="relative p-6 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
            </div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Ocean Intelligence Report
            </h2>
          </div>
          <p className="text-cyan-300/70 text-sm mt-2">Analysis complete • Patterns detected</p>
        </div>

        {/* Main Content */}
        <div className="p-6 space-y-6">
          {/* Convergence Alert if detected */}
          {layerAnalysis?.convergence?.detected && (
            <div className="bg-gradient-to-r from-cyan-500/20 via-green-500/20 to-cyan-500/20 rounded-xl p-4 border-2 border-cyan-400/50 animate-pulse">
              <h3 className="text-cyan-300 font-bold mb-2 flex items-center gap-2">
                <span className="text-xl">🎯</span> CONVERGENCE ZONE DETECTED!
              </h3>
              <p className="text-white font-semibold">
                {layerAnalysis.convergence.description}
              </p>
            </div>
          )}
          
          {/* Analysis Result - Educational */}
          <div className={`rounded-xl p-4 border ${
            hotspot ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-yellow-500/5 border-yellow-500/20'
          }`}>
            <h3 className={`font-semibold mb-2 flex items-center gap-2 ${
              hotspot ? 'text-cyan-300' : 'text-yellow-300'
            }`}>
              <span className="text-lg">{hotspot ? '🎯' : '📚'}</span> 
              {hotspot ? 'Why This Spot?' : 'Water Analysis'}
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {hotspot ? (
                <>
                  The pulsing cyan marker shows a <span className="text-cyan-400 font-semibold">
                  {hotspot.gradient_strength.toFixed(1)}°F/mile temperature gradient</span> - 
                  a powerful edge where {stats.max_temp_f > 74 ? 'warm water' : 'cooler water'} meets 
                  {stats.max_temp_f > 74 ? ' cooler water' : ' warmer water'}. 
                  This creates upwelling that concentrates baitfish, making it a 
                  <span className="text-cyan-400"> prime feeding zone</span>.
                </>
              ) : (
                <>
                  This area shows <span className="text-yellow-400 font-semibold">uniform water 
                  temperatures ({stats.min_temp_f.toFixed(1)}°F - {stats.max_temp_f.toFixed(1)}°F)</span> with 
                  minimal gradients. Fish prefer edges and structure - areas where different water masses meet. 
                  <span className="text-yellow-300"> Try snipping an area where you see color changes 
                  or temperature variations on the layers.</span> Look for where blue meets green (chlorophyll) 
                  or where SST shows color transitions.
                </>
              )}
            </p>
          </div>
          
          {/* Layer Analysis */}
          {layerAnalysis && (
            <div className="space-y-3">
              {/* SST Analysis */}
              {layerAnalysis.sst?.active && (
                <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  <h4 className="text-red-300 text-sm font-semibold mb-1">🌡️ Temperature Analysis</h4>
                  <p className="text-gray-300 text-sm">{layerAnalysis.sst.description}</p>
                </div>
              )}
              
              {/* Chlorophyll Analysis */}
              {layerAnalysis.chl?.active && (
                <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                  <h4 className="text-green-300 text-sm font-semibold mb-1">🌿 Chlorophyll Analysis</h4>
                  <p className="text-gray-300 text-sm">{layerAnalysis.chl.description}</p>
                  {layerAnalysis.chl.max_chl_mg_m3 && (
                    <p className="text-green-400 text-xs mt-1">
                      Peak concentration: {layerAnalysis.chl.max_chl_mg_m3.toFixed(2)} mg/m³
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Ocean Conditions */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-cyan-500/20">
              <h4 className="text-cyan-300 text-sm font-semibold mb-2">Temperature Range</h4>
              <p className="text-2xl font-bold text-white">
                {stats.min_temp_f.toFixed(1)}° - {stats.max_temp_f.toFixed(1)}°F
              </p>
              <p className="text-cyan-400 text-xs mt-1">
                {stats.max_temp_f - stats.min_temp_f > 2 ? 'Strong break detected' : 'Moderate gradient'}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/10 to-cyan-500/10 rounded-lg p-4 border border-cyan-500/20">
              <h4 className="text-cyan-300 text-sm font-semibold mb-2">Feature Type</h4>
              <p className="text-2xl font-bold text-white capitalize">
                {strongestFeature?.type.replace('_', ' ') || 'Edge'}
              </p>
              <p className="text-cyan-400 text-xs mt-1">
                Confidence: {((strongestFeature?.properties.score || 0.5) * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {/* Pattern Explanation */}
          <div className="bg-gradient-to-r from-purple-500/5 to-blue-500/5 rounded-xl p-4 border border-cyan-500/20">
            <h3 className="text-cyan-300 font-semibold mb-2 flex items-center gap-2">
              <span className="text-lg">🌀</span> Pattern Recognition
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {features.some(f => f.type === 'eddy') ? (
                <>
                  An <span className="text-cyan-400">eddy formation</span> was detected - 
                  a circular current that traps nutrients and baitfish in its center. 
                  These are like underwater hurricanes that create isolated ecosystems.
                </>
              ) : features.some(f => f.type === 'filament') ? (
                <>
                  A <span className="text-cyan-400">filament structure</span> extends from the main current - 
                  these fingers of warm water carry nutrients far from their source, 
                  creating feeding highways for pelagic species.
                </>
              ) : (
                <>
                  The <span className="text-cyan-400">temperature edge</span> creates a natural barrier 
                  where different water masses collide. Baitfish get confused at these boundaries, 
                  making them vulnerable to predators lurking below.
                </>
              )}
            </p>
          </div>

          {/* Life Insight - Contextual Philosophy */}
          <div className="text-center py-4 px-6 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-cyan-500/5 rounded-xl">
            <p className="text-cyan-300 italic">
              "{getAnalysisQuote(analysis)}"
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-cyan-500/20 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <span>✂️</span>
            <span>Back to Snipping</span>
          </button>
          
          <div className="flex gap-3">
            {onSave && (
              <button
                onClick={onSave}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/25 flex items-center gap-2"
              >
                <span>💾</span>
                <span>Save to Community</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg font-semibold transition-all border border-cyan-500/30"
            >
              Done Reading
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
