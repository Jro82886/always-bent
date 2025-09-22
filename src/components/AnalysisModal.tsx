"use client";
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Target, Waves, Thermometer, Activity, Save, Share2, Fish } from 'lucide-react';
import { getAnalysisQuote } from '@/lib/philosophy';
import { hardResetSnip } from '@/components/SnipController';
import { showToast } from '@/components/ui/Toast';
import { flags } from '@/lib/flags';
import { useAppState } from '@/lib/store';
import type { SnipAnalysis } from '@/lib/analysis/types';
import '@/styles/analysis-glow.css';

interface AnalysisModalProps {
  analysis: (SnipAnalysis & { narrative: string; [key: string]: any }) | null;
  visible: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function AnalysisModal({ analysis, visible, onClose, onSave }: AnalysisModalProps) {
  const mapRef = (window as any).abfiMap || (window as any).map;
  const { selectedInletId } = useAppState();
  const [isSaving, setIsSaving] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (visible && analysis) {
      setIsVisible(true);
      setIsAnimating(true);
    } else if (!visible) {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [visible, analysis, mounted]);

  const onDone = () => {
    hardResetSnip(mapRef);
    onClose?.();
  };

  const onSaveReport = async () => {
    if (isSaving || reportId || !analysis) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'snip',
          status: 'complete',
          inlet_id: selectedInletId || undefined,
          payload_json: {
            analysis,
            bounds: analysis.bbox,
            preview: {
              sst: !!analysis.sst && analysis.sst.mean !== null,
              chl: !!analysis.chl && analysis.chl.mean !== null,
              gfw: !!analysis.gfw && analysis.gfw.counts.longliner > 0
            }
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
      }
      
      const report = await response.json();
      setReportId(report.id);
      
      showToast({
        type: 'success',
        title: 'Report Saved',
        message: 'Your ocean intelligence report has been saved',
        duration: 5000
      });
      
      if (onSave) onSave();
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
    hardResetSnip(mapRef);
    onClose?.();
    setReportId(null);
    setTimeout(() => {
      const snipButton = document.querySelector('[data-snip-button]') as HTMLButtonElement;
      if (snipButton) {
        snipButton.click();
      }
    }, 300);
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
            <span className="text-xs text-gray-400 ml-2">
              {new Date(analysis.timeISO).toLocaleString()}
            </span>
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

            {/* GFW Badges */}
            {analysis.toggles.gfw && analysis.gfw && (
              <>
                {analysis.gfw.counts.longliner > 0 && (
                  <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
                    <span className="text-sm text-red-300">
                      {analysis.gfw.counts.longliner} Longliner{analysis.gfw.counts.longliner > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {analysis.gfw.counts.drifting_longline > 0 && (
                  <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                    <span className="text-sm text-cyan-300">
                      {analysis.gfw.counts.drifting_longline} Drifting
                    </span>
                  </div>
                )}
                {analysis.gfw.counts.trawler > 0 && (
                  <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                    <span className="text-sm text-blue-300">
                      {analysis.gfw.counts.trawler} Trawler{analysis.gfw.counts.trawler > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {analysis.gfw.counts.longliner === 0 && 
                 analysis.gfw.counts.drifting_longline === 0 && 
                 analysis.gfw.counts.trawler === 0 && (
                  <div className="px-3 py-1 bg-gray-500/20 border border-gray-500/30 rounded-full">
                    <span className="text-sm text-gray-400">No GFW vessels</span>
                  </div>
                )}
              </>
            )}
            {!analysis.toggles.gfw && (
              <div className="px-3 py-1 bg-gray-700/50 border border-gray-600/30 rounded-full">
                <span className="text-sm text-gray-500">GFW: Off</span>
              </div>
            )}
          </div>

          {/* Narrative Section */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-xl p-4 border border-cyan-500/30">
            <h3 className="text-cyan-300 font-bold mb-3 flex items-center gap-2">
              <Activity size={20} className="text-cyan-400" />
              Ocean Intelligence Analysis
            </h3>
            <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
              {analysis.narrative}
            </div>
          </div>

          {/* Area Stats */}
          <div className="mt-4 text-center text-xs text-gray-500">
            Area analyzed: {((analysis as any).stats?.area_km2 || 0).toFixed(1)} km²
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
                  <span>{isSaving ? 'Saving...' : reportId ? 'Saved' : 'Save'}</span>
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
