'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar, BarChart3, Activity, Fish, Thermometer, Wind,
  Moon, Waves, MapPin, Sunrise, Sunset, Navigation, Cloud, Droplets,
  AlertCircle, Info, ChevronRight, Clock, Anchor, RefreshCw, CheckCircle, XCircle, Gauge, Sun
} from 'lucide-react';
import { useAppState } from '@/lib/store';
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

// Reusable components matching the design system
function PillsBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 flex-wrap py-3 px-4 md:px-6">
      {children}
    </div>
  );
}

function MoonPill({ icon: Icon, label, value, tooltip }: { 
  icon: React.ComponentType<any>, 
  label: string, 
  value: string,
  tooltip?: string 
}) {
  const content = (
    <div className="abfi-card-bg abfi-glow abfi-glow-hover rounded-full px-3 py-1.5 text-sm flex items-center gap-2 cursor-default">
      <Icon className="h-4 w-4 text-cyan-300" />
      <span className="text-[11px] uppercase tracking-wide text-slate-400">{label}</span>
      <span className="font-medium text-cyan-200">{value}</span>
    </div>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{content}</Tooltip>;
  }
  return content;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 md:px-6 mt-2 mb-4">
      <h2 className="text-xl font-bold abfi-header-glow text-cyan-300">
        {title}
      </h2>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`abfi-card-bg abfi-glow abfi-glow-hover rounded-xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function CardHeader({ title, right, color = "text-cyan-300" }: { 
  title: string; 
  right?: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between pb-3 mb-4 abfi-underline">
      <h3 className={`text-base font-semibold abfi-header-glow ${color}`}>{title}</h3>
      {right}
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
      No {label.toLowerCase()} available yet.
    </div>
  );
}

const getMoonPhaseIcon = (phase: string) => {
  const phases: Record<string, string> = {
    'New Moon': '🌑', 'Waxing Crescent': '🌒', 'First Quarter': '🌓', 'Waxing Gibbous': '🌔',
    'Full Moon': '🌕', 'Waning Gibbous': '🌖', 'Last Quarter': '🌗', 'Waning Crescent': '🌘'
  };
  return phases[phase] || '🌔';
};

export default function TrendsMode() {
  const { selectedInletId } = useAppState();
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;
  
  useInletFromURL();
  
  const [timeRange, setTimeRange] = useState<TimeRange>('1d');
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(false); // Start with false to show UI immediately
  const [error, setError] = useState<string | null>(null);
  
  const fetchTrendsData = async () => {
    if (!selectedInletId) {
      setLoading(false);
      return;
    }
    
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
  
  useEffect(() => {
    fetchTrendsData();
  }, [selectedInletId, timeRange]);
  
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
      
      {/* Main content area - adjusted for header height */}
      <div className="pt-16 lg:pt-16 h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] overflow-y-auto">
        {/* Pills Bar - directly under command tabs */}
        <PillsBar>
          {trendsData?.envBar && (
            <>
              <MoonPill 
                icon={Moon} 
                label="Moon" 
                value={`${getMoonPhaseIcon(trendsData.envBar.moon.phase)} ${trendsData.envBar.moon.illumPct}%`}
                tooltip="Moon phase and illumination. Major phases boost tidal movement."
              />
              <MoonPill 
                icon={Waves} 
                label="Next Tide" 
                value={`${trendsData.envBar.nextTide.type} · ${fmt(trendsData.envBar.nextTide.timeIso)}`}
                tooltip="Next tide event at local time. Bite windows often bracket tide changes."
              />
              {trendsData.envBar.weather?.sstC !== undefined && (
                <MoonPill 
                  icon={Thermometer} 
                  label="SST" 
                  value={`${toF(trendsData.envBar.weather.sstC)}°F`}
                  tooltip="Sea surface temperature in °F from Stormio. Converted from °C."
                />
              )}
              {trendsData.envBar.weather?.windKt !== undefined && (
                <MoonPill 
                  icon={Wind} 
                  label="Wind" 
                  value={`${trendsData.envBar.weather.windKt} kt ${trendsData.envBar.weather.windDir || ''}`}
                  tooltip="Wind speed in knots and cardinal direction."
                />
              )}
              {trendsData.envBar.weather?.pressureHpa !== undefined && (
                <MoonPill 
                  icon={Gauge} 
                  label="Pressure" 
                  value={`${trendsData.envBar.weather.pressureHpa} mb ${trendArrow(trendsData.envBar.weather.pressureTrend || 'steady')}`}
                  tooltip="Barometric pressure (mb). ↑ rising, ↓ falling, → steady."
                />
              )}
              <MoonPill 
                icon={Sun} 
                label="Sun" 
                value={`↑${fmt(trendsData.envBar.sun.sunriseIso)} / ↓${fmt(trendsData.envBar.sun.sunsetIso)}`}
                tooltip="Sunrise / Sunset for today at your selected inlet."
              />
            </>
          )}
          
          {/* Time range selector and source badges */}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1">
              {(['1d', '7d', '14d'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                    timeRange === range
                      ? 'bg-cyan-400/20 text-cyan-300 ring-1 ring-cyan-400/30'
                      : 'text-slate-300/70 hover:text-white'
                  }`}
                >
                  {range === '1d' ? 'Today' : range === '7d' ? '7 Days' : '14 Days'}
                </button>
              ))}
            </div>
            
            {trendsData && (
              <>
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
              </>
            )}
            
            <button
              onClick={fetchTrendsData}
              disabled={loading}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </PillsBar>
        
        {/* Section Header - separated from pills */}
        <SectionHeader title="OCEAN INTELLIGENCE OVERVIEW" />
        
        {/* Show inlet selection message if no inlet selected */}
        {!selectedInletId && !loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-cyan-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400 text-lg">Please select an inlet to view trends</p>
            </div>
          </div>
        )}
        
        {/* Always show some content for debugging */}
        {!trendsData && !loading && !error && selectedInletId && (
          <div className="px-4 md:px-6 pb-8">
            <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2">
              <Card className="h-[260px]">
                <CardHeader title="Swell" color="text-teal-300" />
                <div className="text-center text-gray-400 mt-8">Swell data will appear here</div>
              </Card>
              <Card className="h-[260px]">
                <CardHeader title="Wind" color="text-blue-300" />
                <div className="text-center text-gray-400 mt-8">Wind data will appear here</div>
              </Card>
              <Card className="h-[220px]">
                <CardHeader title="Pressure" color="text-purple-300" />
                <div className="text-center text-gray-400 mt-8">Pressure data will appear here</div>
              </Card>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-cyan-400 animate-pulse">Loading ocean intelligence...</div>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="px-4 md:px-6">
            <div className="rounded-xl bg-red-900/20 border border-red-500/20 p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-300">Error Loading Data</h3>
                  <p className="text-sm text-red-300/70 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Cards Grid */}
        {!loading && !error && trendsData && (
          <div className="px-4 md:px-6 pb-8">
            <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2">
              {/* Tide Schedule */}
              <Card className="h-[260px]">
                <CardHeader title="Tide Schedule" color="text-teal-300" />
                {trendsData.tideChart.events.length > 0 ? (
                  <div className="h-[calc(100%-4rem)]">
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
              </Card>
              
              {/* Bite Prediction */}
              <Card className="h-[260px]">
                <CardHeader 
                  title="Bite Prediction" 
                  color="text-amber-300"
                  right={<span className="text-[10px] text-slate-400">Based on Stormio + ABFI heuristic</span>}
                />
                
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
                    const score = data?.activityPct ? data.activityPct / 100 : 0;
                    const pct = Math.round(score * 100);
                    
                    return (
                      <div key={period} className="flex items-center gap-2">
                        <div className="text-xs text-slate-400 w-16">{period}</div>
                        <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                          <div 
                            className="h-full transition-all bg-gradient-to-r from-cyan-400 to-amber-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-400 w-10 text-right">{pct}%</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
              
              {/* Today's Activity */}
              <Card className="h-[220px]">
                <CardHeader 
                  title={`${timeRange === '1d' ? "Today's" : timeRange === '7d' ? 'Weekly' : '2-Week'} ABFI Community Activity`}
                  color="text-emerald-300"
                />
                {trendsData.activitySeries.length > 0 ? (
                  <div className="h-32">
                    <div className="text-xs text-slate-400">
                      {trendsData.activitySeries.reduce((sum, d) => sum + d.reports, 0)} reports from the community
                    </div>
                  </div>
                ) : (
                  <EmptyCard label="activity data" />
                )}
              </Card>
              
              {/* Species Distribution */}
              <Card className="h-[220px]">
                <CardHeader 
                  title="ABFI Community Species Activity"
                  color="text-emerald-300"
                />
                {trendsData.speciesDistribution.length > 0 ? (
                  <div className="space-y-2">
                    {trendsData.speciesDistribution.slice(0, 5).map((species) => (
                      <div key={species.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Fish className="h-3 w-3 text-cyan-400" />
                          <span className="text-sm text-slate-300">{species.name}</span>
                        </div>
                        <span className="text-sm text-slate-300">{species.pct}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyCard label="species data" />
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}