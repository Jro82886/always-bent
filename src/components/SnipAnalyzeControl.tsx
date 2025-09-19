"use client";
import { useState } from "react";
import type mapboxgl from "mapbox-gl";
import SnipTool from "@/components/SnipTool";
import type { AnalysisResult } from '@/lib/analysis/sst-analyzer';
import { analysisToReport } from '@/lib/reports/analysis-to-report';
import { useAppState } from '@/store/appState';
import { CheckCircle, Save, X, RefreshCw } from 'lucide-react';

export default function SnipAnalyzeControl({ map }: { map: mapboxgl.Map }) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { selectedInletId } = useAppState();

  const handleAnalysisComplete = (analysis: AnalysisResult) => {
    
    setCurrentAnalysis(analysis);
    setShowAnalysis(true);
    setSaveSuccess(false);
  };

  const handleSaveReport = async () => {
    if (!currentAnalysis) return;
    
    setIsSaving(true);
    try {
      // Get user info from localStorage
      const userId = localStorage.getItem('abfi_user_id') || `user-${Date.now()}`;
      const captainName = localStorage.getItem('abfi_captain_name') || 'Anonymous';
      
      // Convert analysis to report format
      const reportData = {
        ...currentAnalysis,
        user_id: userId,
        user_name: captainName,
        inlet_id: selectedInletId,
        timestamp: new Date().toISOString()
      };
      
      // Save to reports (this will use the existing analysis-to-report logic)
      const result = await analysisToReport(reportData as any);
      
      if (result) {
        setSaveSuccess(true);
        
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
          setShowAnalysis(false);
          setCurrentAnalysis(null);
        }, 2000);
      }
    } catch (error) {
      
      alert('Failed to save report. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewSnip = () => {
    setShowAnalysis(false);
    setCurrentAnalysis(null);
    setSaveSuccess(false);
    // Trigger new snip
    const button = document.querySelector('[data-snip-button]') as HTMLButtonElement;
    if (button) button.click();
  };

  return (
    <>
      <SnipTool map={map} onAnalysisComplete={handleAnalysisComplete} />
      
      {/* Analysis Modal */}
      {showAnalysis && currentAnalysis && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900/95 backdrop-blur-xl rounded-xl border border-cyan-500/20 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Ocean Intelligence Analysis</h2>
              <button
                onClick={() => setShowAnalysis(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
              <div className="space-y-4">
                {/* Summary */}
                <div>
                  <h3 className="text-sm font-medium text-cyan-400 mb-2">Analysis Summary</h3>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">
                    {(currentAnalysis as any).summary || 'Ocean analysis complete. See details below.'}
                  </p>
                </div>
                
                {/* Hotspots */}
                {(currentAnalysis as any).hotspots && (currentAnalysis as any).hotspots.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-cyan-400 mb-2">Detected Hotspots</h3>
                    <div className="space-y-2">
                      {(currentAnalysis as any).hotspots.map((hotspot: any, i: number) => (
                        <div key={i} className="bg-black/40 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-white">{hotspot.type}</span>
                            <span className="text-xs text-emerald-400">
                              {Math.round(hotspot.confidence * 100)}% confidence
                            </span>
                          </div>
                          <p className="text-xs text-gray-400">{hotspot.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Ocean Conditions */}
                {(currentAnalysis as any).conditions && (
                  <div>
                    <h3 className="text-sm font-medium text-cyan-400 mb-2">Ocean Conditions</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(currentAnalysis as any).conditions.sst && (
                        <div className="bg-black/40 rounded-lg p-2">
                          <span className="text-xs text-gray-400">SST Range</span>
                          <p className="text-sm text-white">
                            {(currentAnalysis as any).conditions.sst.min?.toFixed(1)}°F - {(currentAnalysis as any).conditions.sst.max?.toFixed(1)}°F
                          </p>
                        </div>
                      )}
                      {(currentAnalysis as any).conditions.chlorophyll && (
                        <div className="bg-black/40 rounded-lg p-2">
                          <span className="text-xs text-gray-400">Chlorophyll</span>
                          <p className="text-sm text-white">
                            {(currentAnalysis as any).conditions.chlorophyll.avg?.toFixed(2)} mg/m³
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Recommendations */}
                {(currentAnalysis as any).recommendations && (currentAnalysis as any).recommendations.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-cyan-400 mb-2">Recommendations</h3>
                    <ul className="space-y-1">
                      {(currentAnalysis as any).recommendations.map((rec: string, i: number) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <button
                onClick={handleNewSnip}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-black/40 text-gray-300 border border-white/10 hover:border-cyan-400/30 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm">New Analysis</span>
              </button>
              
              <button
                onClick={handleSaveReport}
                disabled={isSaving || saveSuccess}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  saveSuccess 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40' 
                    : 'bg-cyan-500/20 text-cyan-400 border border-cyan-400/40 hover:bg-cyan-500/30'
                } disabled:opacity-50`}
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Saved!</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span className="text-sm">{isSaving ? 'Saving...' : 'Save Report'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}