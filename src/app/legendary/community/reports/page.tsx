'use client';

import { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';

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

const MonthFilter = dynamic(() => import('@/components/reports/MonthFilter').then(mod => ({ default: mod.MonthFilter })), {
  ssr: false
});

const MonthQuickChips = dynamic(() => import('@/components/reports/MonthFilter').then(mod => ({ default: mod.MonthQuickChips })), {
  ssr: false
});

function ReportsContent() {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentMonth = searchParams.get('month') || '';

  const handleMonthSelect = (month: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('month', month);
    router.push(`?${params.toString()}`);
  };

  return (
    <>
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 to-slate-900">
        {/* Page Header with Month Filter */}
        <div className="px-4 md:px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="abfi-card-bg abfi-glow rounded-full inline-flex items-center gap-3 px-4 py-2">
              <span className="text-sm font-semibold abfi-header-glow text-cyan-300">Reports</span>
              <span className="text-xs opacity-70 text-slate-400">Your saved snips and on-water bite logs</span>
            </div>
            <MonthFilter />
          </div>
          
          {/* Quick Chips */}
          <MonthQuickChips onSelectMonth={handleMonthSelect} />
        </div>

        {/* Highlights Section */}
        <div className="border-b border-white/10 bg-slate-950/50">
          <HighlightsStrip onSelectHighlight={setSelectedReport} month={currentMonth} />
        </div>
        
        {/* My Reports Section */}
        <div className="flex-1 relative overflow-hidden">
          <MyReportsList onSelectReport={setSelectedReport} month={currentMonth} />
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

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400 animate-pulse">Loading reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}