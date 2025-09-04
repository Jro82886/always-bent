'use client';

import AnalysisReportPanel from './AnalysisReportPanel';
import type { AnalysisReport } from '@/types/analysis';
import { useEffect } from 'react';

type Props = {
  report: AnalysisReport | null;
  reportOpen: boolean;
  snipActive: boolean;
  onStartSnip: () => void;
  onAnalyze: () => void;
  onBackToInlet: () => void;
  onOpenReport: () => void;
  onCloseReport: () => void;
};

export default function AnalysisFooterBar({
  report,
  reportOpen,
  snipActive,
  onStartSnip,
  onAnalyze,
  onBackToInlet,
  onOpenReport,
  onCloseReport,
}: Props) {
  const reportReady = !!report;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName || '';
      if (/INPUT|TEXTAREA|SELECT/i.test(tag)) return;
      const k = e.key.toLowerCase();
      if (k === 's') onStartSnip();
      if (k === 'a') onAnalyze();
      if (k === 'r' && reportReady) onOpenReport();
      if (k === 'b') onBackToInlet();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [reportReady, onStartSnip, onAnalyze, onOpenReport, onBackToInlet]);

  return (
    <>
      <div className="abfi-footer">
        <div className="abfi-group">
          <button className={`abfi-btn abfi-btn-compact ${snipActive ? 'abfi-glow' : ''}`} onClick={onStartSnip} title="Snip Area (S)">Snip Area</button>
          <button className="abfi-btn abfi-btn-compact" onClick={onAnalyze} title="Analyze (A)">Analyze</button>
        </div>
        <div className="abfi-group">
          <button className={`abfi-btn abfi-btn-compact ${reportReady ? 'abfi-glow abfi-pulse' : ''}`} onClick={onOpenReport} title="Request Written Report (R)">Request Written Report</button>
        </div>
        <div className="abfi-group">
          <button className="abfi-btn abfi-btn-compact" onClick={onBackToInlet} title="Back to Inlet (B)">Back to Inlet</button>
        </div>
      </div>

      {/* Present report in a simple modal wrapper using the same panel UI */}
      {reportOpen && report && (
        <div className="abfi-modal">
          <div className="abfi-modal-backdrop" onClick={onCloseReport} />
          <div className="abfi-modal-card">
            <div className="abfi-modal-header">
              <div className="text-white/80 text-sm">Hotspot Report</div>
              <button className="abfi-btn abfi-btn-compact" onClick={onCloseReport}>Close</button>
            </div>
            <div className="abfi-modal-body">
              <AnalysisReportPanel report={report} open={true} onClose={onCloseReport} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}


