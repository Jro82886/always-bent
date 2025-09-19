'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import components to avoid SSR issues
const HighlightsStrip = dynamic(() => import('@/components/reports/HighlightsStrip'), {
  ssr: false
});

const MyReportsList = dynamic(() => import('@/components/reports/MyReportsList'), {
  ssr: false
});

const WrittenAnalysisModal = dynamic(() => import('@/components/reports/WrittenAnalysisModal'), {
  ssr: false
});

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<any>(null);

  return (
    <Suspense fallback={<div className="p-6 text-slate-400 animate-pulse">Loading reports...</div>}>
      <>
      <div className="h-full flex flex-col bg-black relative">
        {/* Highlights Section */}
        <div className="border-b border-white/10 bg-slate-950">
          <HighlightsStrip onSelectHighlight={setSelectedReport} />
        </div>
        
        {/* My Reports Section */}
        <div className="flex-1 relative">
          <MyReportsList onSelectReport={setSelectedReport} />
        </div>
      </div>

      {/* Analysis Modal */}
      {selectedReport && (
        <WrittenAnalysisModal 
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </>
    </Suspense>
  );
}