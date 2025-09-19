'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, Calendar, BarChart3, Activity, Fish, Thermometer, Wind, 
  Moon, Waves, MapPin, Sunrise, Sunset, Navigation, Cloud, Droplets,
  AlertCircle, Info, ChevronRight, Clock, Anchor, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';
import HeaderBar from '@/components/CommandBridge/HeaderBar';
import { useInletFromURL } from '@/hooks/useInletFromURL';
import { loadTrends } from '@/lib/trends/loadTrends';
import type { TrendsData, TimeRange } from '@/types/trends';

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
  
  // Format time helper
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 overflow-hidden">
      {/* Command Bridge Header */}
      <HeaderBar activeMode="trends" />
      
      {/* Clean Header - Everything at a Glance */}
      <div className="absolute top-32 left-0 right-0 z-30 px-6">
        <div className="bg-black/40 backdrop-blur-xl rounded-xl border border-cyan-500/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h1 className="text-lg font-bold text-white">Ocean Intelligence Overview</h1>
              </div>
              <span className="text-sm text-gray-400">Everything at a glance</span>
              
              {/* Source Status Badges */}
              {trendsData && (
                <div className="flex items-center gap-2 ml-4">
                  {trendsData.sources.map(source => (
                    <div 
                      key={source.id}
                      className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        source.status === 'ok' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : source.status === 'stale'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {source.status === 'ok' && <CheckCircle className="w-3 h-3" />}
                      {source.status === 'error' && <XCircle className="w-3 h-3" />}
                      {source.status === 'stale' && <AlertCircle className="w-3 h-3" />}
                      <span>{source.id}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              {(['1d', '7d', '14d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    timeRange === range
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'bg-black/40 text-gray-400 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {range === '1d' ? 'Today' : range === '7d' ? '7 Days' : '14 Days'}
                </button>
              ))}
              
              <button
                onClick={fetchTrendsData}
                disabled={loading}
                className="ml-2 p-1.5 rounded-lg bg-black/40 text-gray-400 border border-white/10 hover:border-white/20 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-36 px-6 pb-6 h-full overflow-y-auto">
        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-2">Error Loading Trends</h3>
            <p className="text-gray-400">{error}</p>
            <button
              onClick={fetchTrendsData}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all"
            >
              Try Again
            </button>
          </div>
        ) : !trendsData ? (
          <div className="animate-pulse space-y-6">
            <div className="h-32 bg-gray-800/50 rounded-xl" />
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 h-64 bg-gray-800/50 rounded-xl" />
              <div className="h-64 bg-gray-800/50 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {/* Environmental Conditions Bar */}
            <div className="mb-6 bg-gradient-to-r from-blue-900/20 via-cyan-900/20 to-teal-900/20 backdrop-blur-xl rounded-xl border border-cyan-500/20 p-4">
              <div className="grid grid-cols-6 gap-4">
                {/* Moon Phase */}
                <div className="text-center">
                  <div className="text-3xl mb-1">{getMoonPhaseIcon(trendsData.envBar.moon.phase)}</div>
                  <div className="text-xs text-gray-400">Moon Phase</div>
                  <div className="text-sm text-white font-medium">{trendsData.envBar.moon.phase}</div>
                  <div className="text-xs text-cyan-400">{trendsData.envBar.moon.illumPct}% illuminated</div>
                </div>

                {/* Current Tide */}
                <div className="text-center border-l border-white/10 pl-4">
                  <Waves className="w-8 h-8 text-cyan-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-400">Next Tide</div>
                  <div className="text-sm text-white font-medium">
                    {trendsData.envBar.nextTide.type === 'high' ? 'High' : 'Low'} Tide
                  </div>
                  <div className="text-xs text-cyan-400">{formatTime(trendsData.envBar.nextTide.timeIso)}</div>
                </div>

                {/* Sunrise/Sunset */}
                <div className="text-center border-l border-white/10 pl-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Sunrise className="w-4 h-4 text-orange-400" />
                    <Sunset className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xs text-gray-400">Sun Times</div>
                  <div className="text-xs text-white">↑ {formatTime(trendsData.envBar.sun.sunriseIso)}</div>
                  <div className="text-xs text-white">↓ {formatTime(trendsData.envBar.sun.sunsetIso)}</div>
                </div>

                {/* Water Temp */}
                <div className="text-center border-l border-white/10 pl-4">
                  <Thermometer className="w-8 h-8 text-orange-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-400">Water Temp</div>
                  <div className="text-lg text-white font-bold">
                    {trendsData.envBar.weather.sstC 
                      ? `${Math.round(trendsData.envBar.weather.sstC * 9/5 + 32)}°F`
                      : '--°F'}
                  </div>
                  <div className="text-xs text-emerald-400">
                    {trendsData.envBar.weather.sstC && trendsData.envBar.weather.sstC >= 18 && trendsData.envBar.weather.sstC <= 26 
                      ? 'Optimal' 
                      : 'Variable'}
                  </div>
                </div>

                {/* Wind */}
                <div className="text-center border-l border-white/10 pl-4">
                  <Wind className="w-8 h-8 text-blue-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-400">Wind</div>
                  <div className="text-sm text-white font-medium">
                    {trendsData.envBar.weather.windKt 
                      ? `${Math.round(trendsData.envBar.weather.windKt)} kts`
                      : '-- kts'}
                  </div>
                  <div className="text-xs text-cyan-400">{trendsData.envBar.weather.windDir || '--'}</div>
                </div>

                {/* Pressure */}
                <div className="text-center border-l border-white/10 pl-4">
                  <Cloud className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                  <div className="text-xs text-gray-400">Pressure</div>
                  <div className="text-sm text-white font-medium">
                    {trendsData.envBar.weather.pressureHpa 
                      ? `${Math.round(trendsData.envBar.weather.pressureHpa)} mb`
                      : '-- mb'}
                  </div>
                  <div className="text-xs text-cyan-400">
                    {trendsData.envBar.weather.pressureTrend 
                      ? trendsData.envBar.weather.pressureTrend.charAt(0).toUpperCase() + trendsData.envBar.weather.pressureTrend.slice(1)
                      : 'Stable'}
                  </div>
                </div>
              </div>
            </div>

            {/* Tide Chart */}
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="col-span-2 bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Tide Schedule</h2>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span>{inlet?.name || 'East Coast'}</span>
                  </div>
                </div>
                
                {/* Tide Timeline */}
                <div className="relative h-32 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 800 100">
                    {/* Tide curve */}
                    <path
                      d="M 0 50 Q 100 20 200 50 T 400 50 T 600 50 T 800 50"
                      fill="none"
                      stroke="url(#tideGradient)"
                      strokeWidth="2"
                    />
                    <defs>
                      <linearGradient id="tideGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#06b6d4" />
                        <stop offset="50%" stopColor="#0891b2" />
                        <stop offset="100%" stopColor="#0e7490" />
                      </linearGradient>
                    </defs>
                    
                    {/* Tide markers */}
                    {trendsData.tideChart.events.slice(0, 4).map((tide, i) => (
                      <g key={i} transform={`translate(${i * 200 + 100}, ${tide.type === 'high' ? 20 : 80})`}>
                        <circle r="4" fill="#06b6d4" />
                        <text x="0" y="-10" textAnchor="middle" fill="white" fontSize="10">
                          {formatTime(tide.timeIso)}
                        </text>
                        <text x="0" y="20" textAnchor="middle" fill="#9ca3af" fontSize="9">
                          {tide.type === 'high' ? 'HIGH' : 'LOW'}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>
                
                {/* Tide List */}
                <div className="grid grid-cols-4 gap-4">
                  {trendsData.tideChart.events.slice(0, 4).map((tide, i) => (
                    <div key={i} className={`p-2 rounded-lg ${
                      tide.type === 'high' ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-gray-800/50 border border-gray-700'
                    }`}>
                      <div className="text-xs text-gray-400 mb-1">
                        {tide.type === 'high' ? '↑ High Tide' : '↓ Low Tide'}
                      </div>
                      <div className="text-sm text-white font-medium">{formatTime(tide.timeIso)}</div>
                      <div className="text-xs text-cyan-400">
                        {tide.heightM ? `${(tide.heightM * 3.28084).toFixed(1)} ft` : '--'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Prediction */}
              <div className="bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Bite Prediction</h2>
                <div className="space-y-3">
                  {/* Best Time Window */}
                  <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-1">Best Fishing Window</div>
                    <div className="text-sm text-white font-medium">
                      {formatTime(trendsData.bitePrediction.best.startIso)} - {formatTime(trendsData.bitePrediction.best.endIso)}
                    </div>
                  </div>
                  
                  {/* Period Breakdown */}
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Activity by Period</div>
                    {trendsData.bitePrediction.periods.map((period, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm text-white">{period.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${
                                period.activityPct >= 80 ? 'bg-emerald-500' :
                                period.activityPct >= 60 ? 'bg-blue-500' :
                                period.activityPct >= 40 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${period.activityPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-10 text-right">{period.activityPct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Trends & Species Distribution */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Activity Chart */}
              <div className="bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  {timeRange === '1d' ? "Today's Activity" : `${timeRange} Activity Pattern`}
                </h2>
                <div className="h-48 flex items-end justify-between gap-2">
                  {trendsData.activitySeries.length > 0 ? (
                    trendsData.activitySeries.map((data, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="relative w-full flex flex-col items-center">
                          <span className="text-xs text-cyan-400 mb-1">{data.reports}</span>
                          <div 
                            className="w-full bg-gradient-to-t from-cyan-500/40 to-cyan-400/20 rounded-t"
                            style={{ 
                              height: `${Math.max(10, (data.reports / Math.max(...trendsData.activitySeries.map(d => d.reports)) * 150))}px` 
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 rotate-45 origin-left">
                          {timeRange === '1d' 
                            ? new Date(data.t).getHours() + ':00'
                            : new Date(data.t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          }
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      No activity data available
                    </div>
                  )}
                </div>
              </div>

              {/* Species Distribution */}
              <div className="bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Species Activity</h2>
                <div className="space-y-3">
                  {trendsData.speciesDistribution.length > 0 ? (
                    trendsData.speciesDistribution.map((species, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Fish className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm text-white flex-1">{species.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-cyan-500 opacity-60"
                              style={{ width: `${species.pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-10 text-right">{species.pct}%</span>
                          {species.trending === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                          {species.trending === 'down' && <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No species data available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Intelligence Insights */}
            {trendsData.insights.length > 0 && (
              <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 backdrop-blur-xl rounded-xl border border-cyan-500/20 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-semibold text-white">Intelligence Insights</h2>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  {trendsData.insights.map((insight) => (
                    <div key={insight.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        insight.kind === 'optimal' ? 'bg-cyan-500/20' :
                        insight.kind === 'break' ? 'bg-orange-500/20' :
                        'bg-purple-500/20'
                      }`}>
                        {insight.kind === 'optimal' && <Anchor className="w-4 h-4 text-cyan-400" />}
                        {insight.kind === 'break' && <Thermometer className="w-4 h-4 text-orange-400" />}
                        {insight.kind === 'moon' && <Moon className="w-4 h-4 text-purple-400" />}
                      </div>
                      <div className="text-sm text-white">{insight.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}