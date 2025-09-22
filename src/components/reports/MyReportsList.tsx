'use client';

import { useState, useEffect } from 'react';
import { MapPin, Fish, Thermometer, Wind, Waves, WifiOff, ChevronDown, ChevronUp, Loader2, RefreshCw, AlertCircle, Anchor } from 'lucide-react';
import dynamic from 'next/dynamic';
import { getInletById } from '@/lib/inlets';
import { flags } from '@/lib/flags';

const SpeciesBadge = dynamic(() => import('./SpeciesBadge'), { ssr: false });
const SpeciesSelector = dynamic(() => import('./SpeciesSelector'), { ssr: false });

interface MyReportsListProps {
  onSelectReport: (report: any) => void;
  month?: string;
  species?: string;
}

interface Report {
  id: string;
  type: 'snip' | 'bite';
  status?: 'queued' | 'complete' | 'failed';
  created_at: string;
  payload_json: any;
  // Legacy format support
  createdAtIso?: string;
  analysisText?: string;
  conditions?: any;
  species?: string[];
}

export default function MyReportsList({ onSelectReport, month, species }: MyReportsListProps) {
  const [snipReports, setSnipReports] = useState<Report[]>([]);
  const [biteReports, setBiteReports] = useState<Report[]>([]);
  const [expandedSnips, setExpandedSnips] = useState(false);
  const [expandedBites, setExpandedBites] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch reports from API
  const fetchReports = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const params = new URLSearchParams({
        limit: '50' // Get more reports
      });
      
      // Add month filter if provided
      if (month) {
        params.append('from', `${month}-01`);
        const [year, monthNum] = month.split('-');
        const nextMonth = parseInt(monthNum) + 1;
        if (nextMonth <= 12) {
          params.append('to', `${year}-${nextMonth.toString().padStart(2, '0')}-01`);
        } else {
          params.append('to', `${parseInt(year) + 1}-01-01`);
        }
      }

      const response = await fetch(`/api/reports?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const { data } = await response.json();
      
      // Separate snips and bites
      const snips = data.filter((r: Report) => r.type === 'snip');
      const bites = data.filter((r: Report) => r.type === 'bite');
      
      // Filter by species if provided
      if (species) {
        const filteredBites = bites.filter((r: Report) => 
          r.payload_json?.species?.includes(species)
        );
        setBiteReports(filteredBites);
      } else {
        setBiteReports(bites);
      }
      
      setSnipReports(snips);
      setError(null);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (flags.reportsContract) {
      fetchReports();
    } else {
      // Use mock data if flag is off
      setIsLoading(false);
    }
  }, [month, species]);

  // Helper to extract display data from report
  const getReportData = (report: Report) => {
    const isNewFormat = report.payload_json !== undefined;
    
    if (isNewFormat) {
      const payload = report.payload_json;
      const identity = payload.identity || {};
      const captain = identity.captain || 'Anonymous';
      const boat = identity.boat || '—';
      
      return {
        id: report.id,
        type: report.type,
        status: report.status,
        createdAt: report.created_at,
        analysisText: payload.narrative || payload.analysis?.summary || 'Ocean intelligence analysis completed',
        conditions: {
          sstF: payload.stats?.sst_mean ? payload.stats.sst_mean.toFixed(1) : 
                payload.analysis?.sst ? payload.analysis.sst.toFixed(1) : 'N/A',
          windKt: payload.conditions?.windKt || 'N/A',
          windDir: payload.conditions?.windDir || '',
          swellFt: payload.conditions?.swellFt || 'N/A',
          periodS: payload.conditions?.periodS || 'N/A'
        },
        species: payload.species || [],
        captain,
        boat,
        coords: payload.coords
      };
    } else {
      // Legacy format
      return {
        id: report.id,
        type: report.type || 'snip',
        status: 'complete',
        createdAt: report.createdAtIso || new Date().toISOString(),
        analysisText: report.analysisText || '',
        conditions: report.conditions || {},
        species: report.species || [],
        captain: 'Anonymous',
        boat: '—'
      };
    }
  };

  const displayedSnips = expandedSnips ? snipReports : snipReports.slice(0, 3);
  const displayedBites = expandedBites ? biteReports : biteReports.slice(0, 3);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-400">Loading reports...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isRefreshing) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button
            onClick={() => fetchReports()}
            className="px-4 py-2 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm uppercase tracking-widest bg-gradient-to-r from-emerald-400/80 to-teal-400/80 bg-clip-text text-transparent font-semibold">My Reports</h2>
            <button
              onClick={() => fetchReports(true)}
              disabled={isRefreshing}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh reports"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
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
                  displayedSnips.map(report => {
                    const data = getReportData(report);
                    return (
                      <button
                        key={data.id}
                        onClick={() => onSelectReport(report)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-lg p-4 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:border-cyan-500/30 transition-all text-left"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-medium text-cyan-400">Snip Analysis</span>
                          <span className="text-xs text-slate-400">
                            {new Date(data.createdAt).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        <p className="text-sm text-slate-200 line-clamp-2 mb-3">
                          {data.analysisText}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Thermometer className="w-3 h-3" />
                            <span>{data.conditions.sstF}°F</span>
                          </div>
                          {data.conditions.windKt !== 'N/A' && (
                            <>
                              <div className="flex items-center gap-1">
                                <Wind className="w-3 h-3" />
                                <span>{data.conditions.windKt} kt {data.conditions.windDir}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Waves className="w-3 h-3" />
                                <span>{data.conditions.swellFt} ft @ {data.conditions.periodS} s</span>
                              </div>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            
            {/* Bite Reports Section */}
            <div className="abfi-card-bg abfi-glow rounded-xl p-5 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Fish className="w-4 h-4 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                  <h3 className="text-sm font-semibold text-white">My ABFI Bite Reports</h3>
                  <span className="text-xs text-slate-500">({biteReports.length})</span>
                </div>
                {biteReports.length > 3 && (
                  <button
                    onClick={() => setExpandedBites(!expandedBites)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    {expandedBites ? 'Show Less' : 'View All'}
                    {expandedBites ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
              
              <div className="space-y-3">
                {displayedBites.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No ABFI reports yet - press the button when you get a bite!</p>
                ) : (
                  displayedBites.map(report => {
                    const data = getReportData(report);
                    return (
                      <button
                        key={data.id}
                        onClick={() => onSelectReport(report)}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md shadow-lg p-4 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:border-cyan-500/30 transition-all text-left"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${
                              data.status === 'queued' ? 'text-gray-400' :
                              data.status === 'failed' ? 'text-red-400' :
                              'text-green-400'
                            }`}>
                              ABFI Bite
                            </span>
                            {data.status === 'queued' && (
                              <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 rounded-full">
                                Pending Upload
                              </span>
                            )}
                            {data.status === 'failed' && (
                              <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                                Failed
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400">
                            {new Date(data.createdAt).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        
                        {/* Captain and Boat info */}
                        {(data.captain !== 'Anonymous' || data.boat !== '—') && (
                          <div className="flex items-center gap-1.5 text-xs text-cyan-300 mb-2">
                            <Anchor className="w-3 h-3 text-cyan-400/60" />
                            <span>Capt. {data.captain} • {data.boat}</span>
                          </div>
                        )}
                        
                        <p className="text-sm text-slate-200 line-clamp-2 mb-3">
                          {data.analysisText}
                        </p>
                        
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <div className="flex items-center gap-1">
                            <Thermometer className="w-3 h-3" />
                            <span>{data.conditions.sstF}°F</span>
                          </div>
                          {data.conditions.windKt !== 'N/A' && (
                            <>
                              <div className="flex items-center gap-1">
                                <Wind className="w-3 h-3" />
                                <span>{data.conditions.windKt} kt {data.conditions.windDir}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Waves className="w-3 h-3" />
                                <span>{data.conditions.swellFt} ft @ {data.conditions.periodS} s</span>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Species badges if any */}
                        {data.species && data.species.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {data.species.map((s: string) => (
                              <SpeciesBadge key={s} slug={s} size="xs" />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}