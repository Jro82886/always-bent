'use client';

import { X, Thermometer, Wind, Waves, MapPin, Fish, Anchor } from 'lucide-react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { flags } from '@/lib/flags';
import { useAppState } from '@/lib/store';

const SpeciesBadge = dynamic(() => import('./SpeciesBadge'), { ssr: false });
const SpeciesSelector = dynamic(() => import('./SpeciesSelector'), { ssr: false });
const BiteSpeciesEditor = dynamic(() => import('./BiteSpeciesEditor').then(mod => ({ default: mod.BiteSpeciesEditor })), { ssr: false });

interface WrittenAnalysisModalProps {
  report: any;
  onClose: () => void;
}

export default function WrittenAnalysisModal({ report, onClose }: WrittenAnalysisModalProps) {
  const { user } = useAppState();
  const [reportSpecies, setReportSpecies] = useState<string[]>([]);
  
  // Handle both old format and new unified reports format
  const isNewFormat = report?.payload_json !== undefined;
  const payload = isNewFormat ? report.payload_json : report;
  const reportType = isNewFormat ? report.type : (report?.type || 'snip');
  const createdAt = isNewFormat ? report.created_at : report?.createdAtIso;
  
  // Extract data based on format
  const identity = payload?.identity || {};
  const captain = identity.captain || 'Anonymous';
  const boat = identity.boat || '—';
  const isOwner = user?.id === report?.user_id;
  
  useEffect(() => {
    // Initialize species from payload
    const species = payload?.species || [];
    setReportSpecies(Array.isArray(species) ? species : []);
  }, [payload]);
  
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-white">
                {reportType === 'snip' ? 'Ocean Intelligence Report' : 
                 reportType === 'bite' ? 'ABFI Bite Report' : 
                 reportType === 'abfi' ? 'ABFI Bite Report' : 
                 'Fishing Intel'}
              </h2>
              <span className="text-xs text-slate-500">
                {new Date(createdAt).toLocaleString()}
              </span>
            </div>
            {/* Captain & Boat info for bite reports */}
            {reportType === 'bite' && (
              <div className="flex items-center gap-1.5 text-sm text-cyan-300 mt-1">
                <Anchor className="w-3.5 h-3.5 text-cyan-400/60" />
                <span>Capt. {captain} • {boat}</span>
              </div>
            )}
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
            {/* Handle both old and new data formats */}
            {(payload?.conditions || payload?.analysis?.sst) && (
              <>
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <Thermometer className="w-4 h-4" />
                  <span className="font-medium">
                    {payload?.conditions?.sstF || 
                     (payload?.analysis?.sst ? `${payload.analysis.sst.toFixed(1)}°F` : 
                      payload?.stats?.sst_mean ? `${payload.stats.sst_mean.toFixed(1)}°F` : 'N/A')}
                  </span>
                </div>
                {payload?.conditions?.windKt && (
                  <>
                    <div className="text-slate-600">|</div>
                    <div className="flex items-center gap-1.5 text-white">
                      <Wind className="w-4 h-4 text-cyan-400" />
                      <span>{payload.conditions.windKt} kt {payload.conditions.windDir || ''}</span>
                    </div>
                  </>
                )}
                {payload?.conditions?.swellFt && (
                  <>
                    <div className="text-slate-600">|</div>
                    <div className="flex items-center gap-1.5 text-white">
                      <Waves className="w-4 h-4 text-cyan-400" />
                      <span>{payload.conditions.swellFt} ft @ {payload.conditions.periodS} s</span>
                    </div>
                  </>
                )}
              </>
            )}
            {/* Show location for bite reports */}
            {reportType === 'bite' && payload?.coords && (
              <div className="flex items-center gap-1.5 text-white ml-auto">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="text-xs">
                  {payload.coords.lat.toFixed(4)}°, {payload.coords.lon.toFixed(4)}°
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="prose prose-invert max-w-none">
            <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
              {payload?.analysisText || 
               payload?.narrative || 
               payload?.analysis?.summary || 
               'Ocean intelligence analysis completed'}
            </p>
          </div>

          {/* Species for bite reports */}
          {(reportType === 'bite' || reportType === 'abfi') && (
            <div className="mt-6 pt-6 border-t border-cyan-500/20">
              {flags.reportsContract && isNewFormat ? (
                // Use new BiteSpeciesEditor for unified reports
                <BiteSpeciesEditor 
                  reportId={report.id} 
                  initialSpecies={reportSpecies}
                  isOwner={isOwner}
                />
              ) : (
                // Legacy species display/selector
                <>
                  {reportSpecies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {reportSpecies.map((s: string) => (
                        <SpeciesBadge key={s} slug={s} size="sm" />
                      ))}
                    </div>
                  )}
                  {isOwner && (
                    <SpeciesSelector 
                      reportId={report.id} 
                      initial={reportSpecies}
                      onUpdate={setReportSpecies}
                    />
                  )}
                </>
              )}
            </div>
          )}

          {/* Location info if available */}
          {(report?.rectangleBbox || report?.point || report?.inlet_id || payload?.inlet_id) && (
            <div className="mt-6 pt-6 border-t border-cyan-500/20">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <MapPin className="w-4 h-4" />
                <span>
                  {(report?.inlet_id || report?.inletId || payload?.inlet_id || 'Location')
                    .replace(/-/g, ' ')
                    .replace(/\b\w/g, (l: string) => l.toUpperCase())}
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
