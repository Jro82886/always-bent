"use client";
import { useEffect, useState } from 'react';
import { X, Target, Waves, Thermometer, Activity } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analysis/sst-analyzer';
// Temporarily remove philosophy import to fix crash
// import { getAnalysisQuote } from '@/lib/philosophy';

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

  const { hotspot, stats, features, layerAnalysis, boatActivity } = analysis as any;
  
  // Find the strongest feature
  const strongestFeature = features.length > 0 ? 
    features.reduce((best: any, current: any) => 
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
                <Target size={20} className="text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
                CONVERGENCE ZONE DETECTED!
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
              {hotspot ? (
                <Target size={18} className="text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.8)]" />
              ) : (
                <Activity size={18} className="text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]" />
              )} 
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
          
          {/* Boat Activity - Jeff's Vision! */}
          {boatActivity && (
            <div className={`rounded-lg p-4 border ${
              boatActivity.activity_level === 'HIGH' 
                ? 'bg-cyan-500/10 border-cyan-500/30 animate-pulse' 
                : boatActivity.activity_level === 'MODERATE'
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-gray-500/10 border-gray-500/20'
            }`}>
              <h3 className="font-semibold mb-2 flex items-center gap-2 text-cyan-300">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 18v-6a9 9 0 0118 0v6" />
                  <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
                </svg>
                Fleet Intelligence
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Boat Activity:</span>
                  <span className={`font-bold text-sm ${
                    boatActivity.activity_level === 'HIGH' ? 'text-cyan-400' :
                    boatActivity.activity_level === 'MODERATE' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    {boatActivity.activity_level}
                  </span>
                </div>
                {boatActivity.unique_boats > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Vessels (48hrs):</span>
                      <span className="text-white font-semibold">{boatActivity.unique_boats}</span>
                    </div>
                    {boatActivity.fishing_activity?.loitering_events > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Fishing Events:</span>
                        <span className="text-green-400 font-semibold">{boatActivity.fishing_activity.loitering_events}</span>
                      </div>
                    )}
                    {boatActivity.peak_activity && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 text-sm">Peak Time:</span>
                        <span className="text-cyan-300 text-sm">{boatActivity.peak_activity.hour}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="mt-3 pt-3 border-t border-cyan-500/20">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {boatActivity.description}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Layer Analysis */}
          {layerAnalysis && (
            <div className="space-y-3">
              {/* SST Analysis */}
              {layerAnalysis.sst?.active && (
                <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                  <h4 className="text-red-300 text-sm font-semibold mb-1 flex items-center gap-2">
                    <Thermometer size={16} className="text-orange-300 drop-shadow-[0_0_6px_rgba(251,146,60,0.8)]" />
                    Temperature Analysis
                  </h4>
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
              <Waves size={18} className="text-purple-300 drop-shadow-[0_0_8px_rgba(216,180,254,0.8)]" />
              Pattern Recognition
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {features.some((f: any) => f.type === 'eddy') ? (
                <>
                  An <span className="text-cyan-400">eddy formation</span> was detected - 
                  a circular current that traps nutrients and baitfish in its center. 
                  These are like underwater hurricanes that create isolated ecosystems.
                </>
              ) : features.some((f: any) => f.type === 'filament') ? (
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
              "The ocean reveals her secrets to those who look deeply."
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
