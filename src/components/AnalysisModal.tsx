"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { X, Target, Waves, Thermometer, Activity, Save, Share2, Fish } from 'lucide-react';
import FullBreakdownCard, { FullBreakdownData } from '@/components/analysis/FullBreakdownCard';
import { toFullBreakdownV1 } from '@/lib/analysis/toFullBreakdown';
import { getAnalysisQuote } from '@/lib/philosophy';
// Removed import from deprecated SnipController
import { showToast } from '@/components/ui/Toast';
import { flags } from '@/lib/flags';
import { useAppState } from '@/lib/store';
import type { SnipAnalysis } from '@/lib/analysis/types';
import { INLETS } from '@/lib/inlets';
import { centroidOf, fmtDeg } from '@/lib/geo/format';
import '@/styles/analysis-glow.css';

interface AnalysisModalProps {
  analysis: (SnipAnalysis & { narrative: string; [key: string]: any }) | null;
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function AnalysisModal({ analysis, visible, onClose, onSave }: AnalysisModalProps) {
  const mapRef = (window as any).abfiMap || (window as any).map;
  const { selectedInletId, analysis: storeAnalysis } = useAppState();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [fullData, setFullData] = useState<FullBreakdownData | null>(null);
  
  // Debug logging
  console.log('[Modal] opened with analysis:', analysis);
  console.log('[Modal] store narrative:', storeAnalysis.narrative);
  console.log('[Modal] pendingAnalysis:', storeAnalysis.pendingAnalysis);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (visible && analysis) {
      setIsVisible(true);
      setIsAnimating(true);
      // mark modal open in global store
      useAppState.setState(s => ({ analysis: { ...s.analysis, isModalOpen: true } }));
    } else if (!visible) {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
      // mark modal closed
      useAppState.setState(s => ({ analysis: { ...s.analysis, isModalOpen: false } }));
    }
  }, [visible, analysis, mounted]);

  // Build Extended Analysis view model (async) from current analysis
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!analysis) { setFullData(null); return; }
      try {
        const d = await toFullBreakdownV1(analysis);
        if (!cancelled) setFullData(d);
      } catch {
        if (!cancelled) setFullData(null);
      }
    })();
    return () => { cancelled = true; };
  }, [analysis]);

  const cleanupSnipVisualization = (map: any) => {
    // Clean up snip outline layer if present
    if (map) {
      const sourceId = 'snip-outline';
      if (map.getSource(sourceId)) {
        if (map.getLayer('snip-outline-layer-glow')) {
          map.removeLayer('snip-outline-layer-glow');
        }
        if (map.getLayer('snip-outline-layer')) {
          map.removeLayer('snip-outline-layer');
        }
        map.removeSource(sourceId);
      }
    }
  };

  const reEnable = () => {
    const map = (window as any).mapboxMap || (window as any).map;
    if (map) map.getCanvas().style.cursor = 'crosshair';
    useAppState.setState(s => ({ 
      ...s, 
      analysis: { 
        ...s.analysis, 
        isZoomingToSnip: false, 
        showReviewCta: false, 
        pendingAnalysis: null, 
        narrative: '' 
      } 
    }));
    setTimeout(() => {
      if ((window as any).startSnipping) {
        (window as any).startSnipping();
      }
    }, 300);
  };

  const onDone = () => {
    cleanupSnipVisualization(mapRef);
    onClose?.();
    reEnable();
  };

  const onSaveReport = async () => {
    if (isSaving || reportId || !analysis) return;
    
    setIsSaving(true);
    try {
      // Freeze the exact data shown in the card when available
      const payloadToSave = fullData ?? analysis;
      // Prefer frozen FullBreakdown JSON if available
      const sot: any = fullData ?? analysis;
      const body = {
        source: 'snip',
        type: 'snip',
        version: sot?.version ?? 1.0,
        snip_id: sot?.snip?.id ?? null,
        inlet_id: selectedInletId || sot?.snip?.inlet || undefined,
        analysis_json: sot, // spec: freeze SoT exactly as shown
        // Backend compatibility: keep existing contract field
        payload_json: sot,
        status: 'complete'
      };

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const report = await response.json();
      const newId = report.report_id || report.id;
      setReportId(newId);
      
      showToast({
        type: 'success',
        title: 'Report Saved',
        message: 'Your ocean intelligence report has been saved',
        duration: 5000
      });
      
      if (onSave) onSave();
      // Navigate to Reports page with this report highlighted
      try {
        // Route to Reprott (single view or list filtered)
        router.push(`/legendary/reprott/reports/${newId}`);
      } catch {}
    } catch (error) {
      console.error('Failed to save report:', error);
      showToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Unable to save report. Please try again.',
        duration: 7000
      });
    } finally {
      setIsSaving(false);
    }
  };

  const onShareReport = async () => {
    if (!reportId) {
      await onSaveReport();
    }
    
    if (reportId) {
      const shareUrl = `${window.location.origin}/legendary/community/reports?reportId=${reportId}`;
      
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast({
          type: 'success',
          title: 'Link Copied',
          message: 'Report link copied to clipboard',
          duration: 5000
        });
      } catch (error) {
        console.error('Failed to copy link:', error);
        showToast({
          type: 'error',
          title: 'Copy Failed',
          message: 'Unable to copy link. Please try again.',
          duration: 5000
        });
      }
    }
  };

  const onSnipAnother = () => {
    // Reset zoom to inlet view
    if (mapRef) {
      const inletId = selectedInletId || 'ocean-city';
      const inlet = INLETS.find(i => i.id === inletId);
      if (inlet) {
        mapRef.easeTo({ 
          center: [inlet.lng, inlet.lat], 
          zoom: 8, 
          duration: 1000 
        });
      } else {
        // Fallback: zoom out 2 levels
        mapRef.zoomTo(mapRef.getZoom() - 2, { duration: 1000 });
      }
    }
    cleanupSnipVisualization(mapRef);
    onClose?.();
    setReportId(null);
    setTimeout(() => {
      const snipButton = document.querySelector('[data-snip-button]') as HTMLButtonElement;
      if (snipButton) {
        snipButton.click();
      }
    }, 300);
  };
  
  const onBackToOverview = () => {
    if (mapRef) {
      const cam = useAppState.getState().analysis.preZoomCamera;
      if (cam) {
        mapRef.easeTo({ 
          center: cam.center, 
          zoom: cam.zoom, 
          bearing: cam.bearing, 
          pitch: cam.pitch, 
          duration: 900 
        });
      } else {
        // Fallback to East Coast view
        mapRef.easeTo({ 
          center: [-75, 35], 
          zoom: 5.5, 
          duration: 900 
        });
      }
      cleanupSnipVisualization(mapRef);
    }
    onClose?.();
    reEnable();
  };

  if (!mounted || !visible || !analysis) {
    return null;
  }

  // Format SST display
  const formatSST = (stats: any) => {
    if (!stats || stats.mean === null) return 'n/a';
    return `${stats.mean.toFixed(1)}°F (${stats.min.toFixed(1)}-${stats.max.toFixed(1)})`;
  };

  // Format CHL display
  const formatCHL = (stats: any) => {
    if (!stats || stats.mean === null) return 'n/a';
    return `${stats.mean.toFixed(3)} mg/m³`;
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60"
      onClick={onDone}
      style={{ pointerEvents: 'auto', display: 'flex' }}
      data-analysis-modal="true"
    >
      <div 
        className="relative max-w-4xl w-full max-h-[90vh] bg-gradient-to-br from-gray-900 via-black to-cyan-950 rounded-2xl shadow-2xl border border-cyan-500/30"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
      >
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-cyan-500/20 blur-xl -z-10" />
        
        {/* Header */}
        <div className="relative p-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            </div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Prediction Report
            </h2>
            <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full ml-2">
              Snip
            </span>
            <span className="text-xs text-gray-400 ml-2">
              {new Date(analysis.timeISO).toLocaleString()}
            </span>
            {analysis.polygonMeta && (
              <span className="text-xs text-gray-400 ml-2">
                • {analysis.polygonMeta.area_sq_km.toFixed(1)} km²
              </span>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6 max-h-[calc(90vh-8rem)] overflow-y-auto">
          {/* Badges Row */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* SST Badge */}
            {analysis.toggles.sst && (
              <div className={`px-3 py-1 rounded-full border ${
                analysis.sst && analysis.sst.mean !== null
                  ? 'bg-orange-500/20 border-orange-500/30'
                  : 'bg-gray-500/20 border-gray-500/30'
              }`}>
                <span className={`text-sm flex items-center gap-1 ${
                  analysis.sst && analysis.sst.mean !== null ? 'text-orange-300' : 'text-gray-400'
                }`}>
                  <Thermometer size={14} />
                  SST: {formatSST(analysis.sst)}
                  {analysis.sst?.gradient && analysis.sst.gradient > 0.5 && (
                    <span className="text-xs text-orange-400 ml-1">
                      • {analysis.sst.gradient.toFixed(1)}°F/mi gradient
                    </span>
                  )}
                </span>
              </div>
            )}
            {!analysis.toggles.sst && (
              <div className="px-3 py-1 bg-gray-700/50 border border-gray-600/30 rounded-full">
                <span className="text-sm text-gray-500">SST: Off</span>
              </div>
            )}

            {/* CHL Badge */}
            {analysis.toggles.chl && (
              <div className={`px-3 py-1 rounded-full border ${
                analysis.chl && analysis.chl.mean !== null
                  ? 'bg-green-500/20 border-green-500/30'
                  : 'bg-gray-500/20 border-gray-500/30'
              }`}>
                <span className={`text-sm flex items-center gap-1 ${
                  analysis.chl && analysis.chl.mean !== null ? 'text-green-300' : 'text-gray-400'
                }`}>
                  🌿 CHL: {formatCHL(analysis.chl)}
                </span>
              </div>
            )}
            {!analysis.toggles.chl && (
              <div className="px-3 py-1 bg-gray-700/50 border border-gray-600/30 rounded-full">
                <span className="text-sm text-gray-500">CHL: Off</span>
              </div>
            )}

            {/* Weather Badges */}
            {analysis.wind && analysis.wind.speed_kn !== null && (
              <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                <span className="text-sm text-blue-300 flex items-center gap-1">
                  💨 {Math.round(analysis.wind.speed_kn)} kt • {analysis.wind.direction_deg}°
                </span>
              </div>
            )}
            
            {analysis.swell && analysis.swell.height_ft !== null && (
              <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                <span className="text-sm text-indigo-300 flex items-center gap-1">
                  🌊 {analysis.swell.height_ft} ft • {analysis.swell.period_s}s • {analysis.swell.direction_deg}°
                </span>
              </div>
            )}
            
            {/* Fleet Presence Badge */}
            {analysis.presence && analysis.presence.fleetVessels > 0 && (
              <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full">
                <span className="text-sm text-purple-300 flex items-center gap-1">
                  🚤 {analysis.presence.fleetVessels} Fleet Vessels
                </span>
              </div>
            )}

          </div>

          {/* Extended Analysis Card (v1) */}
          {fullData ? (
            <FullBreakdownCard
              data={fullData}
              onSave={onSaveReport}
              onSnipAgain={onSnipAnother}
              onDone={onDone}
              provenance={{ server_time_utc: new Date().toISOString(), request_id: Math.random().toString(36).slice(2) }}
            />
          ) : (
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-xl p-4 border border-cyan-500/30 text-sm text-gray-400">
              Building analysis…
            </div>
          )}

          {/* Area Stats */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <div>Area analyzed: {analysis.polygonMeta?.area_sq_km.toFixed(1) || '0.0'} km²</div>
            {(() => {
              const center = analysis.polygon ? centroidOf(analysis.polygon) : 
                (analysis.polygonMeta?.centroid || (useAppState.getState().analysis.lastSnipCenter ?? {lat: NaN, lon: NaN}));
              return !isNaN(center.lat) && !isNaN(center.lon) ? (
                <div>
                  Center: {fmtDeg(center.lat, true)}, {fmtDeg(center.lon, false)}
                </div>
              ) : null;
            })()}
          </div>
        </div>

        {/* Footer Actions */}
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
            {flags.reportsContract && (
              <>
                <button
                  onClick={onSaveReport}
                  disabled={isSaving || !!reportId}
                  className={`px-4 py-2 text-sm rounded-lg font-semibold transition-all flex items-center gap-2 
                    ${reportId 
                      ? 'bg-green-500/20 text-green-300 border border-green-500/30 cursor-default' 
                      : 'bg-gradient-to-r from-green-600 to-cyan-600 hover:from-green-500 hover:to-cyan-500 text-white transform hover:scale-105 shadow-lg shadow-cyan-500/25'
                    }`}
                >
                  <Save size={14} className={reportId ? 'text-green-300' : 'text-white drop-shadow-[0_0_8px_rgba(134,239,172,0.8)]'} />
                  <span>{isSaving ? 'Saving...' : reportId ? 'Saved to My Reports' : 'Save to Snip Reports'}</span>
                </button>
                
                <button
                  onClick={onShareReport}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25 flex items-center gap-2"
                >
                  <Share2 size={14} className="text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <span>Share</span>
                </button>
              </>
            )}
            
            <button
              onClick={onBackToOverview}
              className="px-4 py-2 text-sm bg-slate-700/50 hover:bg-slate-700/70 text-slate-300 hover:text-white rounded-lg transition-all border border-slate-600/30"
            >
              Back to overview
            </button>
            
            <button
              onClick={onDone}
              className="px-5 py-2 text-sm bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg font-semibold transition-all border border-cyan-500/30"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
