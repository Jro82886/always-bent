'use client';

import { useState } from 'react';
import HighlightsStrip from '@/components/reports/HighlightsStrip';
import MyReportsList from '@/components/reports/MyReportsList';
import WrittenAnalysisModal from '@/components/reports/WrittenAnalysisModal';

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<any>(null);

  return (
    <>
      <div className="h-full overflow-y-auto bg-slate-950">
        {/* Highlights Strip */}
        <HighlightsStrip onSelectHighlight={setSelectedReport} />
        
        {/* My Reports List */}
        <MyReportsList onSelectReport={setSelectedReport} />
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
