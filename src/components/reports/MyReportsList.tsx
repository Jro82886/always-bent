'use client';

import { MOCK_SNIPS, MOCK_ABFI } from '@/mocks/reports';
import { Maximize2, Target, Thermometer, Wind, Waves, WifiOff } from 'lucide-react';

interface MyReportsListProps {
  onSelectReport: (report: any) => void;
}

export default function MyReportsList({ onSelectReport }: MyReportsListProps) {
  const allReports = [
    ...MOCK_SNIPS.map(s => ({ ...s, type: 'snip' })),
    ...MOCK_ABFI.map(a => ({ ...a, type: 'abfi' }))
  ].sort((a, b) => 
    new Date(b.createdAtIso).getTime() - new Date(a.createdAtIso).getTime()
  );

  if (allReports.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">No reports yet. Start analyzing!</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-sm font-medium text-white mb-4">My Reports</h2>
      
      <div className="space-y-3">
        {allReports.map(report => (
          <button
            key={report.id}
            onClick={() => onSelectReport(report)}
            className="w-full bg-slate-800/50 border border-cyan-500/20 rounded-lg p-4 hover:bg-slate-800 transition-colors text-left"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {report.type === 'snip' ? (
                  <Maximize2 className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Target className="w-4 h-4 text-green-400" />
                )}
                <span className="text-xs font-medium text-white">
                  {report.type === 'snip' ? 'Snip Analysis' : 'ABFI Bite'}
                </span>
                {report.type === 'abfi' && report.offlineCaptured && (
                  <WifiOff className="w-3 h-3 text-amber-400" />
                )}
              </div>
              <span className="text-xs text-slate-500">
                {new Date(report.createdAtIso).toLocaleTimeString([], {
                  hour: 'numeric',
                  minute: '2-digit'
                })}
              </span>
            </div>
            
            <p className="text-sm text-slate-300 line-clamp-2 mb-3">
              {report.analysisText}
            </p>
            
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                <span>{report.conditions.sstF}°F</span>
              </div>
              <div className="flex items-center gap-1">
                <Wind className="w-3 h-3" />
                <span>{report.conditions.windKt} kt {report.conditions.windDir}</span>
              </div>
              <div className="flex items-center gap-1">
                <Waves className="w-3 h-3" />
                <span>{report.conditions.swellFt} ft @ {report.conditions.periodS} s</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
