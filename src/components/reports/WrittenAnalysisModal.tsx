'use client';

import { X, Thermometer, Wind, Waves, MapPin } from 'lucide-react';
import { useState } from 'react';
import dynamic from 'next/dynamic';

const SpeciesBadge = dynamic(() => import('./SpeciesBadge'), { ssr: false });
const SpeciesSelector = dynamic(() => import('./SpeciesSelector'), { ssr: false });

interface WrittenAnalysisModalProps {
  report: any;
  onClose: () => void;
}

export default function WrittenAnalysisModal({ report, onClose }: WrittenAnalysisModalProps) {
  const [reportSpecies, setReportSpecies] = useState(report?.species || []);
  
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">
              {report.type === 'snip' ? 'Snip Analysis' : 
               report.type === 'abfi' ? 'ABFI Bite Report' : 
               'Fishing Intel'}
            </h2>
            <span className="text-xs text-slate-500">
              {new Date(report.createdAtIso).toLocaleString()}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Conditions Chip */}
        <div className="p-4 bg-slate-800/50">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Thermometer className="w-4 h-4" />
              <span className="font-medium">{report.conditions.sstF}°F</span>
            </div>
            <div className="text-slate-600">|</div>
            <div className="flex items-center gap-1.5 text-white">
              <Wind className="w-4 h-4 text-cyan-400" />
              <span>{report.conditions.windKt} kt {report.conditions.windDir}</span>
            </div>
            <div className="text-slate-600">|</div>
            <div className="flex items-center gap-1.5 text-white">
              <Waves className="w-4 h-4 text-cyan-400" />
              <span>{report.conditions.swellFt} ft @ {report.conditions.periodS} s</span>
            </div>
          </div>
        </div>

        {/* Analysis Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="prose prose-invert max-w-none">
            <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
              {report.analysisText}
            </p>
          </div>

          {/* Species for ABFI reports */}
          {report.type === 'abfi' && (
            <div className="mt-6 pt-6 border-t border-cyan-500/20">
              {/* Display current species */}
              {reportSpecies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {reportSpecies.map((s: string) => (
                    <SpeciesBadge key={s} slug={s} size="sm" />
                  ))}
                </div>
              )}
              
              {/* Species selector */}
              <SpeciesSelector 
                reportId={report.id} 
                initial={reportSpecies}
                onUpdate={setReportSpecies}
              />
            </div>
          )}

          {/* Location info if available */}
          {(report.rectangleBbox || report.point) && (
            <div className="mt-6 pt-6 border-t border-cyan-500/20">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="w-4 h-4" />
                <span>
                  {report.inletId ? report.inletId.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Location'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-cyan-500/20 bg-slate-800/30">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Close
            </button>
            <button
              className="px-4 py-2 text-sm bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors"
            >
              Share to Community
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
