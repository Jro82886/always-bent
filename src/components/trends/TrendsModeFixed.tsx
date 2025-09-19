'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar, BarChart3, Activity, Fish, Thermometer, Wind, 
  Moon, Waves, MapPin, Sunrise, Sunset, Navigation, Cloud, Droplets,
  AlertCircle, Info, ChevronRight, Clock, Anchor, RefreshCw, CheckCircle, XCircle,
  Sun, Gauge
} from 'lucide-react';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';
import HeaderBar from '@/components/CommandBridge/HeaderBar';
import { useInletFromURL } from '@/hooks/useInletFromURL';
import { loadTrends } from '@/lib/trends/loadTrends';
import type { TrendsData, TimeRange } from '@/types/trends';
import Tooltip from '@/components/ui/Tooltip';

// Helper functions
const toF = (c: number) => Math.round((c * 9) / 5 + 32);
const fmt = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit' 
  }).toLowerCase().replace(':00', '');
};
const trendArrow = (t: 'rising' | 'falling' | 'steady') => t === 'rising' ? '↑' : t === 'falling' ? '↓' : '→';

// Compact metric pill component
function MetricPill({ icon: Icon, label, value }: { 
  icon: React.ComponentType<any>, 
  label: string, 
  value: string 
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-white/5 px-2 py-1">
      <Icon className="h-3.5 w-3.5 opacity-70" />
      <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-xs font-medium text-slate-100">{value}</span>
    </div>
  );
}

// Source status badge
function SourceBadge({ id, status, label }: {
  id: 'stormio' | 'db', 
  status: 'ok' | 'stale' | 'error', 
  label: string
}) {
  const styles = status === 'ok' ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30' :
                 status === 'stale' ? 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30' :
                                     'bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30';
  const text = status === 'ok' ? 'Live' : status === 'stale' ? 'Stale' : 'Error';
  return (
    <Tooltip content="Data source status. Live = fresh; Stale = cached; Error = temporarily unavailable.">
      <div className={`text-[10px] px-2 py-[2px] rounded-full cursor-help ${styles}`}>
        {label}
      </div>
    </Tooltip>
  );
}

// Empty state component
function EmptyCard({ label }: { label: string }) {
  return (
    <div className="h-full flex items-center justify-center text-center text-sm text-slate-400/80">
      No {label.toLowerCase()} available yet
    </div>
  );
}

// Helper to get moon phase icon
const getMoonPhaseIcon = (phase: string) => {
  const phases: Record<string, string> = {
    'New Moon': '🌑',
    'Waxing Crescent': '🌒',
    'First Quarter': '🌓',
    'Waxing Gibbous': '🌔',
    'Full Moon': '🌕',
    'Waning Gibbous': '🌖',
    'Last Quarter': '🌗',
    'Waning Crescent': '🌘'
  };
  return phases[phase] || '🌔';
};

export default function TrendsMode() {
  const { selectedInletId } = useAppState();
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;
  
  // Sync inlet from URL on mount
  useInletFromURL();
  
  const [timeRange, setTimeRange] = useState<TimeRange>('1d');
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch trends data
  const fetchTrendsData = async () => {
    if (!selectedInletId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await loadTrends({
        inletId: selectedInletId,
        range: timeRange,
        nowIso: new Date().toISOString()
      });
      
      setTrendsData(data);
    } catch (err) {
      console.error('Failed to load trends:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trends data');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchTrendsData();
  }, [selectedInletId, timeRange]);
  
  // Listen for report-posted events
  useEffect(() => {
    const handleReportPosted = () => {
      console.log('[Trends] Refreshing on report-posted event');
      fetchTrendsData();
    };
    
    window.addEventListener('report-posted', handleReportPosted);
    return () => window.removeEventListener('report-posted', handleReportPosted);
  }, [selectedInletId, timeRange]);

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 overflow-hidden">
      {/* Command Bridge Header */}
      <HeaderBar activeMode="trends" />
      
      {/* Main content area */}
      <div className="pt-24 h-full overflow-y-auto px-4 md:px-6 pb-8">
        {/* Compact Ocean Intelligence Overview */}
        <div className="rounded-xl bg-slate-900/60 backdrop-blur-md shadow-sm px-4 py-2 border border-white/5 mb-3">
          <div className="flex items-center gap-3 justify-between">
            <Tooltip content="Live ocean snapshot for your inlet: moon, tides, SST, wind, pressure, sun.">
              <h2 className="text-sm font-semibold tracking-wide uppercase text-slate-200 cursor-help">
                Ocean Intelligence Overview
              </h2>
            </Tooltip>

            {/* Source status badges */}
            <div className="flex items-center gap-2">
              <SourceBadge 
                id="stormio" 
                status={trendsData?.sources?.find(s => s.id === 'stormio')?.status || 'error'} 
                label="Stormio" 
              />
              <SourceBadge 
                id="db" 
                status={trendsData?.sources?.find(s => s.id === 'db')?.status || 'error'} 
                label="ABFI DB" 
              />
            </div>

            {/* Time range selector */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {(['1d', '7d', '14d'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-xs rounded-md transition-all ${
                    timeRange === range
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {range === '1d' ? 'Today' : range === '7d' ? '7 Days' : '14 Days'}
                </button>
              ))}
            </div>

            {/* Refresh button */}
            <button
              onClick={fetchTrendsData}
              disabled={loading}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Metrics row */}
          {trendsData?.envBar && (
            <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
              <Tooltip content="Moon phase and illumination. Major phases boost tidal movement.">
                <div>
                  <MetricPill 
                    icon={Moon} 
                    label="Moon" 
                    value={`${getMoonPhaseIcon(trendsData.envBar.moon.phase)} ${trendsData.envBar.moon.illumPct}%`} 
                  />
                </div>
              </Tooltip>
              <Tooltip content="Next tide event at local time. Bite windows often bracket tide changes.">
                <div>
                  <MetricPill 
                    icon={Waves} 
                    label="Next Tide" 
                    value={`${trendsData.envBar.nextTide.type} · ${fmt(trendsData.envBar.nextTide.timeIso)}`} 
                  />
                </div>
              </Tooltip>
              {trendsData.envBar.weather?.sstC !== undefined && (
                <Tooltip content="Sea surface temperature in °F from Stormio. Converted from °C.">
                  <div>
                    <MetricPill 
                      icon={Thermometer} 
                      label="SST" 
                      value={`${toF(trendsData.envBar.weather.sstC)}°F`} 
                    />
                  </div>
                </Tooltip>
              )}
              {trendsData.envBar.weather?.windKt !== undefined && (
                <Tooltip content="Wind speed in knots and cardinal direction.">
                  <div>
                    <MetricPill 
                      icon={Wind} 
                      label="Wind" 
                      value={`${trendsData.envBar.weather.windKt} kt ${trendsData.envBar.weather.windDir || ''}`} 
                    />
                  </div>
                </Tooltip>
              )}
              {trendsData.envBar.weather?.pressureHpa !== undefined && (
                <Tooltip content="Barometric pressure (mb). ↑ rising, ↓ falling, → steady.">
                  <div>
                    <MetricPill 
                      icon={Gauge} 
                      label="Pressure" 
                      value={`${trendsData.envBar.weather.pressureHpa} mb ${trendArrow(trendsData.envBar.weather.pressureTrend || 'steady')}`} 
                    />
                  </div>
                </Tooltip>
              )}
              <Tooltip content="Sunrise / Sunset for today at your selected inlet.">
                <div>
                  <MetricPill 
                    icon={Sun} 
                    label="Sun" 
                    value={`↑${fmt(trendsData.envBar.sun.sunriseIso)} / ↓${fmt(trendsData.envBar.sun.sunsetIso)}`} 
                  />
                </div>
              </Tooltip>
            </div>
          )}
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-cyan-400 animate-pulse">Loading ocean intelligence...</div>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="rounded-xl bg-red-900/20 border border-red-500/20 p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-300">Error Loading Data</h3>
                <p className="text-sm text-red-300/70 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Main content grid */}
        {!loading && !error && trendsData && (
          <>
            {/* Top row - Tide and Bite Prediction */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Tide Schedule */}
              <div className="rounded-xl bg-slate-900/60 border border-white/5 p-3 h-[220px]">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Tide Schedule</h3>
                {trendsData.tideChart.events.length > 0 ? (
                  <div className="h-[calc(100%-2rem)]">
                    {/* Tide chart would go here */}
                    <div className="grid grid-cols-2 gap-2">
                      {trendsData.tideChart.events.slice(0, 4).map((event, idx) => (
                        <div key={idx} className="rounded-lg bg-white/5 p-2">
                          <div className="text-xs text-slate-400">{event.type}</div>
                          <div className="text-sm font-medium text-slate-200">{fmt(event.timeIso)}</div>
                          <div className="text-xs text-slate-500">{event.heightM.toFixed(1)}m</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <EmptyCard label="tide data" />
                )}
              </div>
              
              {/* Bite Prediction */}
              <div className="rounded-xl bg-slate-900/60 border border-white/5 p-3 h-[220px]">
                <div className="flex items-center justify-between mb-1">
                  <Tooltip content="Score combines tide phase, wind, pressure trend, SST vs season, time of day.">
                    <h3 className="text-sm font-semibold text-slate-200 cursor-help">Bite Prediction</h3>
                  </Tooltip>
                  <span className="text-[10px] text-slate-400">Based on Stormio + ABFI heuristic</span>
                </div>
                
                {trendsData.bitePrediction.best && (
                  <div className="mb-3 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                    <div className="text-xs text-cyan-400 mb-1">Best Fishing Window</div>
                    <div className="text-sm font-medium text-cyan-300">
                      {fmt(trendsData.bitePrediction.best.startIso)} - {fmt(trendsData.bitePrediction.best.endIso)}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Tooltip content="Relative bite likelihood for each period today.">
                    <div className="text-xs text-slate-400 uppercase tracking-wide mb-1 cursor-help">Activity by Period</div>
                  </Tooltip>
                  {['Morning', 'Midday', 'Afternoon', 'Evening'].map((period) => {
                    const data = trendsData.bitePrediction.periods.find(p => p.label === period);
                    const score = data?.score || 0;
                    const pct = Math.round(score * 100);
                    
                    return (
                      <div key={period} className="flex items-center gap-2">
                        <div className="text-xs text-slate-400 w-16">{period}</div>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div 
                            className={`h-full transition-all ${
                              pct >= 70 ? 'bg-cyan-400' : 
                              pct >= 50 ? 'bg-yellow-400' : 
                              'bg-blue-400'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-400 w-10 text-right">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Bottom row - Activity Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {/* Today's Activity */}
              <div className="rounded-xl bg-slate-900/60 border border-white/5 p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">
                  {timeRange === '1d' ? "Today's" : timeRange === '7d' ? 'Weekly' : '2-Week'} ABFI Community Activity
                </h3>
                {trendsData.activitySeries.length > 0 ? (
                  <div className="h-32">
                    {/* Activity chart would go here */}
                    <div className="text-xs text-slate-400">
                      {trendsData.activitySeries.reduce((sum, d) => sum + d.reports, 0)} reports from the community
                    </div>
                  </div>
                ) : (
                  <EmptyCard label="activity data" />
                )}
              </div>
              
              {/* Species Distribution */}
              <div className="rounded-xl bg-slate-900/60 border border-white/5 p-4">
                <h3 className="text-sm font-semibold text-slate-200 mb-3">
                  ABFI Community Species Activity
                </h3>
                {trendsData.speciesDistribution.length > 0 ? (
                  <div className="space-y-2">
                    {trendsData.speciesDistribution.slice(0, 5).map((species) => (
                      <div key={species.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Fish className="h-3 w-3 text-cyan-400" />
                          <span className="text-sm text-slate-300">{species.name}</span>
                        </div>
                        <span className="text-xs text-slate-400">{species.pct}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyCard label="species data" />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
