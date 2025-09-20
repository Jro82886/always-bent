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
}

export default function MyReportsList({ onSelectReport, month }: MyReportsListProps) {
  // TODO: Filter reports by month when connected to real API
  const [showBiteAnimation, setShowBiteAnimation] = useState(false);
  const [expandedSnips, setExpandedSnips] = useState(false);
  const [expandedABFI, setExpandedABFI] = useState(false);
  
  const snipReports = MOCK_SNIPS.map(s => ({ ...s, type: 'snip' }));
  const abfiReports = MOCK_ABFI.map(a => ({ ...a, type: 'abfi' }));

  const handleBiteButton = () => {
    setShowBiteAnimation(true);
    // In Phase 2, this will save to database
    console.log('ABFI Bite button pressed!');
    setTimeout(() => setShowBiteAnimation(false), 1000);
  };

  const displayedSnips = expandedSnips ? snipReports : snipReports.slice(0, 3);
  const displayedABFI = expandedABFI ? abfiReports : abfiReports.slice(0, 3);

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6">
          <h2 className="text-sm uppercase tracking-widest bg-gradient-to-r from-emerald-400/80 to-teal-400/80 bg-clip-text text-transparent font-semibold mb-4">My Reports</h2>
          
          {/* Snips Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 drop-shadow-[0_0_6px_rgba(34,211,238,0.5)]" />
                <h3 className="text-sm font-medium text-white">Snips</h3>
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
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Fish className="w-4 h-4 text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.5)]" />
                <h3 className="text-sm font-medium text-white">ABFI Reports</h3>
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
      
      {/* Mobile ABFI Button - Docked at bottom */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent pointer-events-none">
        <button
          onClick={handleBiteButton}
          className={`pointer-events-auto w-full relative px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all transform shadow-lg ${
            showBiteAnimation ? 'scale-95' : 'hover:scale-105'
          }`}
        >
          <span className="flex items-center justify-center gap-2">
            <Fish className="w-5 h-5" />
            ABFI BITE
          </span>
          {showBiteAnimation && (
            <div className="absolute inset-0 rounded-xl bg-green-400/50 animate-ping" />
          )}
        </button>
      </div>
      
      {/* Desktop ABFI Button - In header */}
      <div className="hidden md:block absolute top-4 right-4">
        <button
          onClick={handleBiteButton}
          className={`relative px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all transform ${
            showBiteAnimation ? 'scale-95' : 'hover:scale-105'
          }`}
        >
          <span className="flex items-center gap-2">
            <Fish className="w-4 h-4" />
            ABFI Bite
          </span>
          {showBiteAnimation && (
            <div className="absolute inset-0 rounded-lg bg-green-400/50 animate-ping" />
          )}
        </button>
      </div>
    </>
  );
}