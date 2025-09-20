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

const SpeciesFilter = dynamic(() => import('@/components/reports/SpeciesFilter'), {
  ssr: false
});

function ReportsContent() {
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentMonth = searchParams.get('month') || '';
  const currentSpecies = searchParams.get('species') || '';

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
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <div className="abfi-card-bg abfi-glow rounded-full inline-flex items-center gap-3 px-4 py-2">
              <span className="text-sm font-semibold abfi-header-glow text-cyan-300">Reports</span>
              <span className="text-xs opacity-70 text-slate-400">Your saved snips and on-water bite logs</span>
            </div>
            <div className="flex items-center gap-3">
              <MonthFilter />
              <SpeciesFilter />
            </div>
          </div>
          
          {/* Intelligence Vision */}
          <div className="abfi-card-bg rounded-xl p-4 mb-3">
            <div className="text-center space-y-2">
              <h2 className="flex items-center justify-center gap-2 text-[15px] md:text-lg font-semibold tracking-wide">
                <span className="text-cyan-400">PREDICTION</span>
                <span className="text-slate-400">→</span>
                <span className="text-emerald-400">CONFIRMATION</span>
                <span className="text-slate-400">→</span>
                <span className="bg-gradient-to-r from-orange-400/80 to-amber-400/80 bg-clip-text text-transparent">INTELLIGENCE</span>
              </h2>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl mx-auto opacity-80">
                <span className="text-cyan-300">Snip Reports</span> = predictions.
                <span className="text-emerald-300 ml-2">ABFI Bite Reports</span> = confirmations.
                Together they train ABFI into <span className="bg-gradient-to-r from-orange-400/80 to-amber-400/80 bg-clip-text text-transparent font-semibold">collective fishing intelligence</span>.
              </p>
            </div>
          </div>
          
          {/* Quick Chips */}
          <MonthQuickChips onSelectMonth={handleMonthSelect} />
          
          {/* TODO: Add species filter chips here when ready
          <div className="flex gap-2 flex-wrap mt-3">
            {SPECIES.map(s => (
              <button className="species-filter-chip">
                {s.label}
              </button>
            ))}
          </div>
          */}
        </div>

        {/* Highlights Section */}
        <div className="border-b border-white/10 bg-slate-950/50">
          <HighlightsStrip onSelectHighlight={setSelectedReport} month={currentMonth} species={currentSpecies} />
        </div>
        
        {/* My Reports Section */}
        <div className="flex-1 relative overflow-y-auto">
          <MyReportsList onSelectReport={setSelectedReport} month={currentMonth} species={currentSpecies} />
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