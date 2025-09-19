'use client';

import { useState } from 'react';
import HighlightsStrip from '@/components/reports/HighlightsStrip';
import MyReportsList from '@/components/reports/MyReportsList';
import WrittenAnalysisModal from '@/components/reports/WrittenAnalysisModal';

// Static page with client-side data fetching for optimal performance
export const dynamic = 'force-dynamic';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<any>(null);

  return (
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
  );
}