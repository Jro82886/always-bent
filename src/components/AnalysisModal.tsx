"use client";
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Waves, Thermometer, Activity, Save } from 'lucide-react';
import type { AnalysisResult } from '@/lib/analysis/sst-analyzer';
import { getAnalysisQuote } from '@/lib/philosophy';
import { hardResetSnip } from '@/components/SnipController';
import '@/styles/analysis-glow.css';

interface AnalysisModalProps {
  analysis: (AnalysisResult & { vesselTracks?: any }) | null;
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function AnalysisModal({ analysis, visible, onClose, onSave }: AnalysisModalProps) {
  const mapRef = (window as any).abfiMap || (window as any).map;
  
  const onDone = () => {
    hardResetSnip(mapRef); // clean + idle
    onClose?.();
  };
  
  const onSaveReport = () => {
    if (onSave) onSave(); // persist report
    hardResetSnip(mapRef); // clean + idle
    onClose?.();
  };
  
  const onSnipAnother = () => {
    hardResetSnip(mapRef); // clean
    onClose?.();
    // Re-enter draw mode
    setTimeout(() => {
      const snipButton = document.querySelector('[data-snip-button]') as HTMLButtonElement;
      if (snipButton) {
        snipButton.click();
      } else if ((window as any).startSnipping) {
        (window as any).startSnipping();
      }
    }, 300);
  };
  
  const handleClose = onDone; // Default close is "Done"
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure we're mounted on the client before using portal
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (visible && analysis) {
      // Show immediately when visible prop is true
      setIsVisible(true);
      // Force animation to start immediately
      setIsAnimating(true);
    } else if (!visible) {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [visible, analysis, mounted]);

  // Don't render on server or if not mounted
  if (!mounted) {
    return null;
  }

  // Show the modal if we have both visibility and analysis
  if (!visible || !analysis) {
    
    return null;
  }
  
  
  

  const { hotspot, stats, features, layerAnalysis, boatActivity, vesselTracks, edgeAnalysis, comprehensiveAnalysis } = analysis as any;
  
  // Find the strongest feature
  const strongestFeature = features.length > 0 ? 
    features.reduce((best: any, current: any) => 
      (current.properties.score > (best?.properties.score || 0)) ? current : best
    , features[0]) : null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60"
      onClick={handleClose}
      style={{ pointerEvents: 'auto', display: 'flex' }}
      data-analysis-modal="true"
    >
      {/* Modal Content - Wide layout to fit everything */}
      <div 
        className="relative max-w-5xl w-full max-h-[90vh] bg-gradient-to-br from-gray-900 via-black to-cyan-950 rounded-2xl shadow-2xl border border-cyan-500/30"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
      >
        {/* Glowing border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 blur-xl -z-10" />
        
        {/* Compact Header */}
        <div className="relative p-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            </div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Ocean Intelligence Report
            </h2>
          </div>
          <p className="text-cyan-300/70 text-xs mt-1">Analysis complete • Patterns detected</p>
        </div>

        {/* Grid Layout Main Content */}
        <div className="p-4 grid grid-cols-2 gap-4 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {/* Comprehensive Analysis - Full Width at Top */}
          {comprehensiveAnalysis && (
            <div className="col-span-2 bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-xl p-4 border border-cyan-500/30">
              <h3 className="text-cyan-300 font-bold mb-3 flex items-center gap-2">
                <Activity size={20} className="text-cyan-400" />
                Comprehensive Analysis
              </h3>
              <div 
                className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed analysis-content"
                dangerouslySetInnerHTML={{ __html: comprehensiveAnalysis.summary }}
              />
              {comprehensiveAnalysis.recommendation && (
                <div className="mt-3 pt-3 border-t border-cyan-500/20 text-gray-300 text-sm whitespace-pre-wrap font-mono">
                  {comprehensiveAnalysis.recommendation}
                </div>
              )}
            </div>
          )}
          
          {/* Convergence Alert if detected - full width */}
          {layerAnalysis?.convergence?.detected && (
            <div className="col-span-2 bg-gradient-to-r from-cyan-500/20 via-green-500/20 to-cyan-500/20 rounded-xl p-4 border-2 border-cyan-400/50 animate-pulse">
              <h3 className="text-cyan-300 font-bold mb-2 flex items-center gap-2">
                <Target size={20} className="text-cyan-300 drop-shadow-[0_0_10px_rgba(103,232,249,0.9)]" />
                CONVERGENCE ZONE DETECTED!
              </h3>
              <p className="text-white font-semibold">
                {layerAnalysis.convergence.description}
              </p>
            </div>
          )}
          
          {/* Analysis Result - Educational - full width */}
          <div className={`col-span-2 rounded-xl p-4 border ${
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
                  only a {stats.temp_range_f.toFixed(1)}°F range. <span className="text-gray-400">No significant temperature breaks detected.</span>
                  <br/><br/>
                  <span className="text-cyan-300 font-semibold">What to look for:</span>
                  <br/>• Color transitions on SST layer (red/orange meeting blue/green)
                  <br/>• Chlorophyll concentration edges (dark blue meeting light green)
                  <br/>• Areas where vessel tracks converge
                  <br/>• Near structure like ledges, canyons, or current edges
                  <br/><br/>
                  <span className="text-yellow-300">Try snipping where you see these features for better results.</span>
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
          
          {/* Vessel Tracks */}
          {vesselTracks && (
            <div className="bg-gradient-to-r from-orange-500/10 to-cyan-500/10 rounded-xl p-4 border border-orange-500/20">
              <h4 className="text-orange-300 font-semibold mb-3 flex items-center gap-2">
                <Activity size={18} className="text-orange-400" />
                Vessel Activity (Last 4 Days)
              </h4>
              <div className="space-y-3">
                {vesselTracks.recreational > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-cyan-500 rounded-full" />
                      <span className="text-cyan-300 text-sm">Recreational Vessels</span>
                    </div>
                    <span className="text-white font-bold">{vesselTracks.recreational}</span>
                  </div>
                )}
                {vesselTracks.commercial > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-orange-500 rounded-full" />
                      <span className="text-orange-300 text-sm">Commercial (GFW)</span>
                    </div>
                    <span className="text-white font-bold">{vesselTracks.commercial}</span>
                  </div>
                )}
                {vesselTracks.total > 0 && (
                  <div className="pt-2 mt-2 border-t border-orange-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Total Tracks</span>
                      <span className="text-cyan-300 font-bold text-lg">{vesselTracks.total}</span>
                    </div>
                  </div>
                )}
                {vesselTracks.total > 5 && (
                  <div className="bg-cyan-500/10 rounded-lg p-2 mt-2">
                    <p className="text-cyan-300 text-xs">
                      High vessel convergence indicates productive fishing area
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Comprehensive Tracking Analysis */}
          {(vesselTracks?.total > 0 || boatActivity?.unique_boats > 0) && (
            <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-4 border border-indigo-500/20">
              <h4 className="text-indigo-300 font-semibold mb-3 flex items-center gap-2">
                <Activity size={18} className="text-indigo-400" />
                Complete Tracking Intelligence
              </h4>
              <div className="prose prose-sm text-gray-300 leading-relaxed">
                <p className="mb-3">
                  <span className="text-indigo-400 font-semibold">Vessel Analysis:</span> This area shows{' '}
                  {vesselTracks?.total > 10 ? 'heavy' : vesselTracks?.total > 5 ? 'moderate' : 'light'} vessel traffic 
                  with <span className="text-white font-bold">{vesselTracks?.total || 0} total tracks</span> recorded over the past 4 days.
                  {vesselTracks?.recreational > 0 && (
                    <> The presence of <span className="text-cyan-400">{vesselTracks.recreational} recreational vessels</span> suggests 
                    local knowledge of productive waters.</>
                  )}
                  {vesselTracks?.commercial > 0 && (
                    <> Commercial activity from <span className="text-orange-400">{vesselTracks.commercial} GFW-tracked vessels</span> confirms 
                    this as an established fishing ground.</>
                  )}
                </p>
                
                {boatActivity && boatActivity.unique_boats > 0 && (
                  <p className="mb-3">
                    <span className="text-indigo-400 font-semibold">Recent Activity:</span> In the last 48 hours,{' '}
                    <span className="text-white font-bold">{boatActivity.unique_boats} unique vessels</span> have worked this area
                    {boatActivity.fishing_activity?.loitering_events > 0 && (
                      <> with <span className="text-green-400">{boatActivity.fishing_activity.loitering_events} confirmed fishing events</span> 
                      (vessels holding position or drifting, indicating active fishing)</>
                    )}.
                    {boatActivity.peak_activity && (
                      <> Peak activity occurs around <span className="text-cyan-300">{boatActivity.peak_activity.hour}</span>, 
                      suggesting optimal bite windows.</>
                    )}
                  </p>
                )}
                
                <p className="text-xs text-indigo-300 italic mt-3">
                  Fleet convergence patterns are the ocean's report card - where boats gather, fish prosper.
                </p>
              </div>
            </div>
          )}
          
          {/* Polygon Features Analysis (Edges, Fronts, Eddies) */}
          {(edgeAnalysis || features?.length > 0) && (
            <div className="bg-gradient-to-r from-purple-500/10 to-teal-500/10 rounded-xl p-4 border border-teal-500/20">
              <h4 className="text-teal-300 font-semibold mb-3 flex items-center gap-2">
                <Waves size={18} className="text-teal-400" />
                Ocean Feature Detection
              </h4>
              <div className="prose prose-sm text-gray-300 leading-relaxed">
                {edgeAnalysis && (
                  <p className="mb-3">
                    <span className="text-teal-400 font-semibold">Temperature Edges:</span> {edgeAnalysis}
                    These thermal boundaries act as walls in the water column, concentrating baitfish and creating 
                    ambush points for predators.
                  </p>
                )}
                
                {features && features.length > 0 && (
                  <>
                    <p className="mb-3">
                      <span className="text-teal-400 font-semibold">Detected Features:</span> Analysis identified{' '}
                      <span className="text-white font-bold">{features.length} oceanographic features</span> including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      {features.filter((f: any) => f.type === 'eddy').length > 0 && (
                        <li className="text-cyan-300">
                          <span className="font-semibold">Eddies ({features.filter((f: any) => f.type === 'eddy').length})</span>: 
                          Circular currents that trap nutrients and baitfish
                        </li>
                      )}
                      {features.filter((f: any) => f.type === 'front').length > 0 && (
                        <li className="text-blue-300">
                          <span className="font-semibold">Fronts ({features.filter((f: any) => f.type === 'front').length})</span>: 
                          Sharp temperature/salinity boundaries where water masses collide
                        </li>
                      )}
                      {features.filter((f: any) => f.type === 'filament').length > 0 && (
                        <li className="text-purple-300">
                          <span className="font-semibold">Filaments ({features.filter((f: any) => f.type === 'filament').length})</span>: 
                          Nutrient-rich fingers extending from upwelling zones
                        </li>
                      )}
                      {features.filter((f: any) => f.type === 'upwelling').length > 0 && (
                        <li className="text-green-300">
                          <span className="font-semibold">Upwelling ({features.filter((f: any) => f.type === 'upwelling').length})</span>: 
                          Deep, nutrient-rich water rising to the surface
                        </li>
                      )}
                    </ul>
                  </>
                )}
                
                <p className="text-xs text-teal-300 italic mt-3">
                  Toggle polygon filters to visualize these features directly on the map
                </p>
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

          {/* Life Insight - Contextual Philosophy - full width */}
          <div className="col-span-2 text-center py-4 px-6 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-cyan-500/5 rounded-xl">
            <p className="text-cyan-300 italic">
              "{getAnalysisQuote({
                hotspot,
                tempRange: { min: stats.min_temp_f, max: stats.max_temp_f },
                layerAnalysis
              })}"
            </p>
          </div>
        </div>

        {/* Compact Footer Actions */}
        <div className="px-6 py-3 border-t border-cyan-500/20 flex justify-between items-center">
          <button
            onClick={onSnipAnother}
            className="px-4 py-2 text-sm bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 transition-all rounded-lg flex items-center gap-2 border border-cyan-500/20"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" strokeDasharray="3 3" />
            </svg>
            <span>Snip Another Area</span>
          </button>
          
          <div className="flex gap-2">
            {onSave && (
              <button
                onClick={onSaveReport}
                className="px-5 py-2 text-sm bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-cyan-500/25 flex items-center gap-2"
              >
                <Save size={14} className="text-white drop-shadow-[0_0_8px_rgba(134,239,172,0.8)]" />
                <span>Save as Report</span>
              </button>
            )}
            <button
              onClick={handleClose}
              className="px-5 py-2 text-sm bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg font-semibold transition-all border border-cyan-500/30"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Use portal to render at document body level
  return createPortal(modalContent, document.body);
}
