'use client';

import { useEffect, useState } from 'react';
import { Flame, Thermometer, Wind, Waves, Moon, Anchor } from 'lucide-react';
import { flags } from '@/lib/flags';

interface HighlightsStripProps {
  onSelectHighlight: (highlight: any) => void;
  month?: string;
  species?: string;
}

export default function HighlightsStrip({ onSelectHighlight, month }: HighlightsStripProps) {
  const [highlights, setHighlights] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHighlights = async () => {
      if (!flags.reportsContract) {
        setIsLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams({
          type: 'bite',
          limit: '10'
        });
        if (month) params.append('from', `${month}-01`);
        
        const response = await fetch(`/api/reports?${params}`);
        if (response.ok) {
          const { data } = await response.json();
          // Filter for highlights only
          const highlightedBites = data.filter((report: any) => 
            report.payload_json?.highlight === true
          ).slice(0, 3);
          setHighlights(highlightedBites);
        }
      } catch (error) {
        console.error('Failed to fetch highlights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHighlights();
  }, [month]);

  if (isLoading || highlights.length === 0) {
    return null; // Don't show section if no highlights
  }

  return (
    <div className="p-4 md:p-6">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-4 h-4 text-orange-400 drop-shadow-[0_0_6px_rgba(251,146,60,0.5)]" />
        <h2 className="text-sm uppercase tracking-widest bg-gradient-to-r from-orange-400/80 to-amber-400/80 bg-clip-text text-transparent font-semibold">ABFI Highlights</h2>
      </div>
      
      {/* Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {highlights.map((highlight) => {
          const payload = highlight.payload_json || {};
          const identity = payload.identity || {};
          const captain = identity.captain || 'Anonymous';
          const boat = identity.boat || '—';
          const analysis = payload.analysis || {};
          const coords = payload.coords || {};
          
          return (
            <button
              key={highlight.id}
              onClick={() => onSelectHighlight(highlight)}
              className="group rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-lg p-4 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:border-cyan-500/30 transition-all text-left"
            >
              {/* Title and Time */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-white">
                  Hot Bite Detected
                </h3>
                <span className="text-xs text-slate-400">
                  {new Date(highlight.created_at).toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              {/* Analysis Preview */}
              <p className="text-sm text-slate-200 line-clamp-2 mb-3">
                {analysis.summary || 'Productive conditions detected in this area'}
              </p>
              
              {/* Conditions Snapshot */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Thermometer className="w-3 h-3" />
                  <span>{analysis.sst ? `${analysis.sst.toFixed(1)}°F` : 'N/A'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Wind className="w-3 h-3" />
                  <span>{analysis.wind_speed ? `${analysis.wind_speed} kt` : 'Calm'}</span>
                </div>
                {payload.species && payload.species.length > 0 && (
                  <div className="flex items-center gap-1.5 text-slate-400 col-span-2">
                    <span className="text-cyan-400">
                      {payload.species.slice(0, 2).join(', ')}
                      {payload.species.length > 2 && ` +${payload.species.length - 2}`}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Captain & Boat Info */}
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5 text-xs">
                  <Anchor className="w-3 h-3 text-cyan-400/60" />
                  <span className="text-cyan-300">
                    Capt. {captain} • {boat}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}