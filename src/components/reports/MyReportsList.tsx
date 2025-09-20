'use client';

import { useState } from 'react';
import { MOCK_SNIPS, MOCK_ABFI } from '@/mocks/reports';
import { MapPin, Fish, Thermometer, Wind, Waves, WifiOff, ChevronDown, ChevronUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { getInletById } from '@/lib/inlets';

const SpeciesBadge = dynamic(() => import('./SpeciesBadge'), { ssr: false });
const SpeciesSelector = dynamic(() => import('./SpeciesSelector'), { ssr: false });

interface MyReportsListProps {
  onSelectReport: (report: any) => void;
  month?: string;
  species?: string;
}

export default function MyReportsList({ onSelectReport, month, species }: MyReportsListProps) {
  // TODO: Filter reports by month when connected to real API
  const [expandedSnips, setExpandedSnips] = useState(false);
  const [expandedABFI, setExpandedABFI] = useState(false);
  
  const snipReports = MOCK_SNIPS.map(s => ({ ...s, type: 'snip' }));
  const abfiReports = MOCK_ABFI.map(a => ({ ...a, type: 'abfi' }));


  const displayedSnips = expandedSnips ? snipReports : snipReports.slice(0, 3);
  const displayedABFI = expandedABFI ? abfiReports : abfiReports.slice(0, 3);

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6">
          <h2 className="text-sm uppercase tracking-widest bg-gradient-to-r from-emerald-400/80 to-teal-400/80 bg-clip-text text-transparent font-semibold mb-6">My Reports</h2>
          
          {/* Two Column Layout on Desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Snips Section */}
            <div className="abfi-card-bg abfi-glow rounded-xl p-5 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
                  <h3 className="text-sm font-semibold text-white">My Snipped Reports</h3>
                  <span className="text-xs text-slate-500">({snipReports.length})</span>
                </div>
              {snipReports.length > 3 && (
                <button
                  onClick={() => setExpandedSnips(!expandedSnips)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  {expandedSnips ? 'Show Less' : 'View All'}
                  {expandedSnips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {displayedSnips.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No snip analyses yet</p>
              ) : (
                displayedSnips.map(report => (
                  <button
                    key={report.id}
                    onClick={() => onSelectReport(report)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-lg p-4 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:border-cyan-500/30 transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-cyan-400">Snip Analysis</span>
                      <span className="text-xs text-slate-400">
                        {new Date(report.createdAtIso).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-200 line-clamp-2 mb-3">
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
                    
                    {/* Species badges if any */}
                    {report.species && report.species.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {report.species.map((s: string) => (
                          <SpeciesBadge key={s} slug={s} size="xs" />
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
            </div>
            
            {/* ABFI Reports Section */}
            <div className="abfi-card-bg abfi-glow rounded-xl p-5 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Fish className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                  <h3 className="text-sm font-semibold text-white">My ABFI Bite Reports</h3>
                  <span className="text-xs text-slate-500">({abfiReports.length})</span>
                </div>
              {abfiReports.length > 3 && (
                <button
                  onClick={() => setExpandedABFI(!expandedABFI)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  {expandedABFI ? 'Show Less' : 'View All'}
                  {expandedABFI ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {displayedABFI.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No ABFI reports yet - press the button when you get a bite!</p>
              ) : (
                displayedABFI.map(report => (
                  <button
                    key={report.id}
                    onClick={() => onSelectReport(report)}
                    className="w-full rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-lg p-4 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:border-cyan-500/30 transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-green-400">ABFI Bite</span>
                        {report.type === 'abfi' && 'offlineCaptured' in report && report.offlineCaptured && (
                          <WifiOff className="w-3 h-3 text-amber-400" />
                        )}
                      </div>
                      <span className="text-xs text-slate-400">
                        {new Date(report.createdAtIso).toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <p className="text-sm text-slate-200 line-clamp-2 mb-3">
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
                    
                    {/* Species badges if any */}
                    {report.species && report.species.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {report.species.map((s: string) => (
                          <SpeciesBadge key={s} slug={s} size="xs" />
                        ))}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}