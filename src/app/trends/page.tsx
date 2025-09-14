'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Activity,
  Thermometer,
  Moon,
  Navigation,
  Clock,
  BarChart3,
  Target,
  Zap,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Minus
} from 'lucide-react';
import NavTabs from '@/components/NavTabs';
import { useAppState } from '@/store/appState';

// Mock data for MVP - will be replaced with real data
const mockFishActivity = [
  { id: 1, type: 'BITE', species: 'Bluefin Tuna', captain: 'Mike', time: '2h ago', inlet: 'barnegat', result: 'landed' },
  { id: 2, type: 'BITE', species: 'Striped Bass', captain: 'Sarah', time: '5h ago', inlet: 'cape-cod', result: 'missed' },
  { id: 3, type: 'BITE', species: 'Yellowfin Tuna', captain: 'Tom', time: '8h ago', inlet: 'montauk', result: 'landed' },
  { id: 4, type: 'BITE', species: 'Unknown', captain: 'Jeff', time: '1h ago', inlet: 'barnegat', result: 'on' },
];

const mockPatternAlerts = [
  { type: 'increase', icon: TrendingUp, message: 'Bluefin activity up 40% this week', color: 'text-green-400' },
  { type: 'temperature', icon: Thermometer, message: 'Water temp dropped 3°F - bass moving in', color: 'text-cyan-400' },
  { type: 'timing', icon: Clock, message: 'Morning bite shifting earlier (now 5:30am)', color: 'text-yellow-400' },
];

export default function TrendsPage() {
  const { selectedInletId, username } = useAppState();
  const [dataCount, setDataCount] = useState(12); // Simulated data count
  const [moonPhase, setMoonPhase] = useState('waxing');
  const [tideStatus, setTideStatus] = useState({ current: 'rising', nextHigh: '2h 14m' });
  const [bestTimes, setBestTimes] = useState([5, 6, 7, 17, 18]); // Best hours
  
  // Calculate what widgets should be visible based on data count
  const showSpeciesMovement = dataCount >= 50;
  const showSuccessZones = dataCount >= 100;
  const showPredictiveScore = dataCount >= 200;
  const showAIInsights = dataCount >= 500;

  // Moon phase calculator (simplified)
  useEffect(() => {
    const getMoonPhase = () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      
      // Simple moon phase calculation
      const c = Math.floor(365.25 * year);
      const e = Math.floor(30.6 * month);
      const jd = c + e + day - 694039.09;
      const phase = jd / 29.53;
      const phaseNorm = phase - Math.floor(phase);
      
      if (phaseNorm < 0.125) return 'new';
      if (phaseNorm < 0.25) return 'waxing-crescent';
      if (phaseNorm < 0.375) return 'first-quarter';
      if (phaseNorm < 0.5) return 'waxing-gibbous';
      if (phaseNorm < 0.625) return 'full';
      if (phaseNorm < 0.75) return 'waning-gibbous';
      if (phaseNorm < 0.875) return 'last-quarter';
      return 'waning-crescent';
    };
    
    setMoonPhase(getMoonPhase());
  }, []);

  const getMoonIcon = () => {
    // SVG moon phases - simplified representations
    const phases: Record<string, React.ReactElement> = {
      'new': <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />,
      'waxing-crescent': <path d="M12 2 A10 10 0 1 1 12 22 A6 6 0 0 0 12 2" fill="currentColor" />,
      'first-quarter': <path d="M12 2 A10 10 0 0 1 12 22 Z" fill="currentColor" />,
      'waxing-gibbous': <path d="M12 2 A10 10 0 1 1 12 22 A6 6 0 0 1 12 2" fill="currentColor" />,
      'full': <circle cx="12" cy="12" r="10" fill="currentColor" />,
      'waning-gibbous': <path d="M12 2 A6 6 0 0 0 12 22 A10 10 0 1 0 12 2" fill="currentColor" />,
      'last-quarter': <path d="M12 2 A10 10 0 0 0 12 22 Z" fill="currentColor" />,
      'waning-crescent': <path d="M12 2 A6 6 0 0 1 12 22 A10 10 0 1 1 12 2" fill="currentColor" />,
    };
    
    return (
      <svg className="w-8 h-8 text-cyan-400" viewBox="0 0 24 24">
        {phases[moonPhase] || phases['full']}
      </svg>
    );
  };

  const getTrendArrow = (value: number) => {
    if (value > 0) return <ChevronUp className="w-4 h-4 text-green-400" />;
    if (value < 0) return <ChevronDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <NavTabs />
      
      {/* Dashboard Container */}
      <div className="flex-1 overflow-y-auto bg-gray-950">
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-xl font-light text-cyan-400 tracking-wider">Fishing Intelligence</h1>
            <p className="text-gray-500 text-xs mt-1 font-light">Pattern analysis and performance insights</p>
          </div>

          {/* KEY INSIGHTS - Top Priority */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 backdrop-blur-md rounded-lg border border-cyan-400/30 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-cyan-400/70" />
                <h3 className="text-xs font-medium text-cyan-400/80 tracking-wide">Key Insights</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-3 border border-cyan-500/10">
                  <div className="text-green-400/90 font-light text-sm mb-1">Best Time: 5:30-7:30 AM</div>
                  <div className="text-xs text-gray-500 font-light">Peak activity window</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3 border border-cyan-500/10">
                  <div className="text-cyan-400/90 font-light text-sm mb-1">Water: 68°F <span className="text-cyan-300/60">↓3°</span></div>
                  <div className="text-xs text-gray-500 font-light">Optimal tuna range</div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-3 border border-cyan-500/10">
                  <div className="text-yellow-400/90 font-light text-sm mb-1">Moon: {moonPhase.replace('-', ' ')}</div>
                  <div className="text-xs text-gray-500 font-light">32% higher activity</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Catches Ticker */}
          <div className="mb-6">
            <div className="bg-gray-950/60 backdrop-blur-md rounded-lg border border-cyan-500/20 p-2 overflow-hidden">
              <div className="flex items-center gap-4 animate-scroll-left">
                <span className="text-xs text-cyan-400 font-bold uppercase">Recent:</span>
                {[...mockFishActivity, ...mockFishActivity].map((activity, idx) => (
                  <span key={idx} className="text-xs text-white whitespace-nowrap">
                    <span className={activity.result === 'landed' ? 'text-green-400' : activity.result === 'on' ? 'text-yellow-400' : 'text-orange-400'}>●</span> 
                    {activity.captain}: {activity.type} - {activity.species} {activity.time} • 
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Pattern Alerts - Always visible */}
          <div className="mb-6">
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-cyan-500/10 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-cyan-400/70" />
                <h3 className="text-xs font-medium text-cyan-400/80 tracking-wide">Pattern Alerts</h3>
              </div>
              <div className="space-y-2">
                {mockPatternAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 bg-gray-950/30 rounded-lg border border-cyan-500/5 hover:border-cyan-500/20 transition-all">
                    <alert.icon className={`w-4 h-4 ${alert.color} opacity-80`} />
                    <span className="text-xs text-gray-300 font-light">{alert.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            
            {/* Catch Trends */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-cyan-500/10 p-4 hover:border-cyan-500/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-cyan-400/80 tracking-wide">Catch Trends</h3>
                <TrendingUp className="w-4 h-4 text-cyan-400/60" />
              </div>
              <div className="space-y-2">
                <select className="w-full bg-gray-950/50 border border-cyan-500/20 rounded-lg px-3 py-1.5 text-xs text-gray-300 font-light focus:outline-none focus:border-cyan-400/40 transition-all">
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="season">This Season</option>
                </select>
                <div className="mt-3 p-2 bg-gradient-to-r from-cyan-500/5 to-teal-500/5 rounded border border-cyan-500/10">
                  <div className="text-xs text-cyan-400 mb-1">What you'll see:</div>
                  <div className="text-xs text-gray-400 leading-relaxed">
                    Species migration patterns, catch size trends, hot/cold streaks by location, and success rate changes over time.
                  </div>
                </div>
              </div>
            </div>

            {/* Best Times */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-cyan-500/10 p-4 hover:border-cyan-500/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-cyan-400/80 tracking-wide">Best Times Today</h3>
                <Clock className="w-4 h-4 text-cyan-400/60" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Peak Activity</span>
                  <span className="text-sm text-white font-medium">5:30 - 7:30 AM</span>
                </div>
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: 24 }, (_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-8 rounded-sm ${
                        bestTimes.includes(i) 
                          ? 'bg-gradient-to-t from-cyan-500/40 to-cyan-400/20 border border-cyan-400/30' 
                          : 'bg-gray-950/40 border border-gray-700/30'
                      }`}
                      title={`${i}:00`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>12am</span>
                  <span>6am</span>
                  <span>12pm</span>
                  <span>6pm</span>
                  <span>12am</span>
                </div>
              </div>
            </div>

            {/* Moon Phase */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-cyan-500/10 p-4 hover:border-cyan-500/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-cyan-400/80 tracking-wide">Moon Phase</h3>
                <div className="opacity-60">{getMoonIcon()}</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Current</span>
                  <span className="text-sm text-white capitalize">{moonPhase.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Next New Moon</span>
                  <span className="text-sm text-white">7 days</span>
                </div>
                <div className="text-xs text-green-400 mt-2">
                  Full moon = 32% more tuna catches
                </div>
              </div>
            </div>

            {/* Tide Status */}
            <div className="bg-gray-950/60 backdrop-blur-md rounded-lg border border-cyan-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Tide Intel</h3>
                <Navigation className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">Status</span>
                  <span className="text-sm text-white capitalize">{tideStatus.current}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">High Tide</span>
                  <span className="text-sm text-white">in {tideStatus.nextHigh}</span>
                </div>
                <div className="text-xs text-green-400 mt-2">
                  Best: 2 hours before high tide
                </div>
              </div>
            </div>

            {/* Activity Gauge */}
            <div className="bg-gray-950/60 backdrop-blur-md rounded-lg border border-cyan-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Activity Level</h3>
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="relative h-32 flex items-center justify-center">
                {/* Circular gauge visualization */}
                <div className="relative">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-gray-700"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - 0.7)}`}
                      className="text-cyan-400"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">70%</div>
                      <div className="text-xs text-gray-400">High</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Temperature Trends */}
            <div className="bg-gray-950/60 backdrop-blur-md rounded-lg border border-cyan-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Water Temp</h3>
                <Thermometer className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Current</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold text-white">68°F</span>
                    {getTrendArrow(-3)}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">7-day avg</span>
                  <span className="text-sm text-white">71°F</span>
                </div>
                <div className="text-xs text-cyan-400 mt-2">
                  Optimal range detected
                </div>
              </div>
            </div>

            {/* Species Movement - Unlockable */}
            {showSpeciesMovement ? (
              <div className="bg-gray-950/60 backdrop-blur-md rounded-lg border border-cyan-500/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Species Movement</h3>
                  <Target className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white">Bluefin</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">Moving</span>
                      <Navigation className="w-4 h-4 text-cyan-400 rotate-45" />
                      <span className="text-xs text-cyan-400">NE</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Following 68°F isotherm north
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-950/60 backdrop-blur-md rounded-lg border border-gray-700/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Species Movement</h3>
                  <Target className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-center py-4">
                  <div className="text-gray-500 text-sm mb-2">Learning patterns...</div>
                  <div className="text-gray-600 text-xs mb-3">Need {50 - dataCount} more reports</div>
                  <div className="p-2 bg-gradient-to-r from-cyan-500/5 to-teal-500/5 rounded border border-cyan-500/10">
                    <div className="text-xs text-cyan-400 mb-1">Coming soon:</div>
                    <div className="text-xs text-gray-400 leading-relaxed">
                      Real-time species migration tracking, temperature preference mapping, and predictive movement based on water conditions.
                    </div>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
                    <div 
                      className="bg-cyan-500/50 h-2 rounded-full transition-all"
                      style={{ width: `${(dataCount / 50) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Success Zones - Unlockable */}
            {showSuccessZones ? (
              <div className="bg-gray-950/60 backdrop-blur-md rounded-lg border border-cyan-500/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">Success Zones</h3>
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-white">Canyon Edge</div>
                  <div className="text-xs text-gray-400">87% success rate</div>
                  <div className="text-xs text-cyan-400">3 boats active now</div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-950/60 backdrop-blur-md rounded-lg border border-gray-700/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Success Zones</h3>
                  <Zap className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-center py-4">
                  <div className="text-gray-500 text-sm mb-2">Analyzing hotspots...</div>
                  <div className="text-gray-600 text-xs mb-3">Unlocks at 100 reports</div>
                  <div className="p-2 bg-gradient-to-r from-cyan-500/5 to-teal-500/5 rounded border border-cyan-500/10">
                    <div className="text-xs text-cyan-400 mb-1">What's coming:</div>
                    <div className="text-xs text-gray-400 leading-relaxed">
                      Heat maps of high-success areas, real-time boat clustering analysis, depth/structure correlations, and secret spot rankings.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Insights - Unlockable */}
            {showAIInsights ? (
              <div className="bg-gray-950/60 backdrop-blur-md rounded-lg border border-cyan-500/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">AI Insights</h3>
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-white">Discovered Pattern</div>
                  <div className="text-xs text-gray-400">
                    Boats arriving at 4:45am catch 3x more
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-950/60 backdrop-blur-md rounded-lg border border-gray-700/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">AI Insights</h3>
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                </div>
                <div className="text-center py-4">
                  <div className="text-gray-500 text-sm mb-2">Training AI model...</div>
                  <div className="text-gray-600 text-xs mb-3">Unlocks at 500 data points</div>
                  <div className="p-2 bg-gradient-to-r from-cyan-500/5 to-teal-500/5 rounded border border-cyan-500/10">
                    <div className="text-xs text-cyan-400 mb-1">AI will reveal:</div>
                    <div className="text-xs text-gray-400 leading-relaxed">
                      Hidden patterns in catch timing, weather impact predictions, optimal boat positioning strategies, and personalized fishing recommendations.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Data Collection Progress */}
          <div className="bg-gray-950/60 backdrop-blur-md rounded-lg border border-cyan-500/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">System Intelligence</h3>
              <span className="text-xs text-gray-400">{dataCount} data points collected</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Species Movement</span>
                  <span className={dataCount >= 50 ? 'text-green-400' : 'text-gray-500'}>
                    {dataCount >= 50 ? 'UNLOCKED' : `${50 - dataCount} to unlock`}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      dataCount >= 50 ? 'bg-green-400' : 'bg-cyan-500/50'
                    }`}
                    style={{ width: `${Math.min((dataCount / 50) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">Success Zones</span>
                  <span className={dataCount >= 100 ? 'text-green-400' : 'text-gray-500'}>
                    {dataCount >= 100 ? 'UNLOCKED' : `${100 - dataCount} to unlock`}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      dataCount >= 100 ? 'bg-green-400' : 'bg-cyan-500/50'
                    }`}
                    style={{ width: `${Math.min((dataCount / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">AI Insights</span>
                  <span className={dataCount >= 500 ? 'text-green-400' : 'text-gray-500'}>
                    {dataCount >= 500 ? 'UNLOCKED' : `${500 - dataCount} to unlock`}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all ${
                      dataCount >= 500 ? 'bg-green-400' : 'bg-cyan-500/50'
                    }`}
                    style={{ width: `${Math.min((dataCount / 500) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
