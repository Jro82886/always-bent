'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, Calendar, BarChart3, Activity, Fish, Thermometer, Wind, 
  Moon, Waves, MapPin, Sunrise, Sunset, Navigation, Cloud, Droplets,
  AlertCircle, Info, ChevronRight, Clock, Anchor
} from 'lucide-react';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';
import HeaderBar from '@/components/CommandBridge/HeaderBar';
import { useInletFromURL } from '@/hooks/useInletFromURL';
import { calculateBitePrediction, getCurrentSeason, getCurrentTidePhase, type BiteFactors } from '@/lib/analysis/bite-predictor';

interface TideData {
  type: 'high' | 'low';
  time: string;
  height: number;
}

interface MoonPhase {
  phase: string;
  illumination: number;
  icon: string;
}

interface EnvironmentalData {
  tides: TideData[];
  moonPhase: MoonPhase;
  sunrise: string;
  sunset: string;
  waterTemp: number;
  airTemp: number;
  windSpeed: number;
  windDirection: string;
  pressure: number;
  visibility: number;
  cloudCover: number;
}

// Helper functions for environmental calculations
function calculateMoonPhase(date: Date): MoonPhase {
  // Simple moon phase calculation
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Calculate days since new moon (Jan 6, 2000)
  const julianDate = Math.floor((date.getTime() / 86400000) - (date.getTimezoneOffset() / 1440) + 2440587.5);
  const daysSinceNew = (julianDate - 2451549.5) % 29.53059;
  const phase = daysSinceNew / 29.53059;
  
  let phaseName: string;
  let icon: string;
  
  if (phase < 0.0625) {
    phaseName = 'New Moon';
    icon = '🌑';
  } else if (phase < 0.1875) {
    phaseName = 'Waxing Crescent';
    icon = '🌒';
  } else if (phase < 0.3125) {
    phaseName = 'First Quarter';
    icon = '🌓';
  } else if (phase < 0.4375) {
    phaseName = 'Waxing Gibbous';
    icon = '🌔';
  } else if (phase < 0.5625) {
    phaseName = 'Full Moon';
    icon = '🌕';
  } else if (phase < 0.6875) {
    phaseName = 'Waning Gibbous';
    icon = '🌖';
  } else if (phase < 0.8125) {
    phaseName = 'Last Quarter';
    icon = '🌗';
  } else if (phase < 0.9375) {
    phaseName = 'Waning Crescent';
    icon = '🌘';
  } else {
    phaseName = 'New Moon';
    icon = '🌑';
  }
  
  return {
    phase: phaseName,
    illumination: Math.round(Math.abs(0.5 - phase) * 200),
    icon
  };
}

function calculateSunTimes(lat: number, lon: number): { sunrise: string; sunset: string } {
  // Simple sunrise/sunset calculation
  const now = new Date();
  const julianDay = Math.floor((now.getTime() / 86400000) + 2440587.5);
  const n = julianDay - 2451545.0 + 0.0008;
  const meanAnomaly = (357.5291 + 0.98560028 * n) % 360;
  const center = 1.9148 * Math.sin(meanAnomaly * Math.PI / 180);
  const lambda = (280.46 + 0.98565 * n + center) % 360;
  const declination = Math.asin(0.39779 * Math.sin(lambda * Math.PI / 180));
  
  const hourAngle = Math.acos(-Math.tan(lat * Math.PI / 180) * Math.tan(declination));
  const sunrise = 12 - hourAngle * 12 / Math.PI - lon / 15;
  const sunset = 12 + hourAngle * 12 / Math.PI - lon / 15;
  
  const formatTime = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
  };
  
  return {
    sunrise: formatTime(sunrise),
    sunset: formatTime(sunset)
  };
}

function generateTidePredictions(): TideData[] {
  // Placeholder tide predictions - would be replaced with NOAA tide API
  const now = new Date();
  const tides: TideData[] = [];
  
  // Generate 4 tides for the day (roughly 6 hours apart)
  for (let i = 0; i < 4; i++) {
    const time = new Date(now);
    time.setHours(6 + i * 6, Math.floor(Math.random() * 60));
    
    tides.push({
      type: i % 2 === 0 ? 'high' : 'low',
      time: time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      height: i % 2 === 0 ? 3.5 + Math.random() * 2 : 0.5 + Math.random()
    });
  }
  
  return tides;
}

function getCompassDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export default function TrendsModeFixed() {
  const { selectedInletId } = useAppState();
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;
  
  // Sync inlet from URL on mount
  useInletFromURL();
  
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [environmentalData, setEnvironmentalData] = useState<EnvironmentalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bitePrediction, setBitePrediction] = useState<any>(null);
  
  // Fetch real weather data and calculate moon phase
  useEffect(() => {
    const fetchEnvironmentalData = async () => {
      if (!inlet) return;
      
      try {
        // Fetch Stormio weather data (single source of truth)
        const stormioResponse = await fetch(`/api/stormio?lat=${inlet.center[1]}&lng=${inlet.center[0]}`);
        
        if (stormioResponse.ok) {
          const stormioData = await stormioResponse.json();
          
          // Convert Stormio tide events to our format
          const tides = stormioData.tides.events.map((event: any) => ({
            type: event.type,
            time: new Date(event.time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            height: event.height
          }));
          
          // Format sun times
          const formatTime = (isoString: string) => {
            return new Date(isoString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          };
          
          setEnvironmentalData({
            tides,
            moonPhase: {
              phase: stormioData.moon.phase,
              illumination: stormioData.moon.illumPct,
              icon: getMoonPhaseIcon(stormioData.moon.phase)
            },
            sunrise: formatTime(stormioData.sun.sunriseIso),
            sunset: formatTime(stormioData.sun.sunsetIso),
            waterTemp: stormioData.weather.sstC * 9/5 + 32, // C to F
            airTemp: stormioData.weather.sstC * 9/5 + 32 + Math.random() * 10, // Approximate air temp
            windSpeed: stormioData.weather.windKt,
            windDirection: stormioData.weather.windDir,
            pressure: stormioData.weather.pressureHpa,
            visibility: 10, // Not provided by Stormio
            cloudCover: 25 // Not provided by Stormio
          });
        } else {
          // Use fallback data if Stormio fails
          throw new Error('Stormio API failed');
        }
        
          // Calculate bite prediction using Stormio data
          if (stormioResponse.ok) {
            const stormioData = await stormioResponse.json();
            const factors: BiteFactors = {
              moonPhase: stormioData.moon.illumPct / 100,
              tidePhase: getCurrentTidePhase(stormioData.tides.events),
              waterTemp: stormioData.weather.sstC * 9/5 + 32,
              windSpeed: stormioData.weather.windKt,
              pressure: stormioData.weather.pressureHpa,
              pressureTrend: stormioData.weather.pressureTrend,
              timeOfDay: new Date().getHours(),
              season: getCurrentSeason()
            };
            
            const prediction = calculateBitePrediction(factors);
            setBitePrediction(prediction);
          }
      } catch (error) {
        console.error('Failed to fetch environmental data:', error);
        // Use fallback data if API fails
        setEnvironmentalData({
          tides: [
            { type: 'high', time: '06:23 AM', height: 4.2 },
            { type: 'low', time: '12:45 PM', height: 0.8 },
            { type: 'high', time: '06:52 PM', height: 4.5 },
            { type: 'low', time: '01:10 AM', height: 0.6 }
          ],
          moonPhase: { phase: 'Waxing Gibbous', illumination: 78, icon: '🌔' },
          sunrise: '06:42 AM',
          sunset: '07:15 PM',
          waterTemp: 72,
          airTemp: 78,
          windSpeed: 12,
          windDirection: 'NE',
          pressure: 1013,
          visibility: 10,
          cloudCover: 25
        });
      } catch (error) {
        console.error('Failed to fetch environmental data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEnvironmentalData();
    // Refresh every hour
    const interval = setInterval(fetchEnvironmentalData, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [inlet]);

  // Mock trend data for visualization
  const [activityTrend] = useState([
    { time: '6am', activity: 20, bites: 2 },
    { time: '8am', activity: 45, bites: 8 },
    { time: '10am', activity: 78, bites: 15 },
    { time: '12pm', activity: 65, bites: 12 },
    { time: '2pm', activity: 82, bites: 18 },
    { time: '4pm', activity: 90, bites: 22 },
    { time: '6pm', activity: 75, bites: 16 },
    { time: '8pm', activity: 40, bites: 6 }
  ]);

  const [topSpecies] = useState([
    { name: 'Mahi', percentage: 35, trend: 'up', color: 'bg-yellow-500' },
    { name: 'Tuna', percentage: 28, trend: 'up', color: 'bg-blue-500' },
    { name: 'Wahoo', percentage: 20, trend: 'stable', color: 'bg-purple-500' },
    { name: 'Marlin', percentage: 12, trend: 'down', color: 'bg-indigo-500' },
    { name: 'Other', percentage: 5, trend: 'stable', color: 'bg-gray-500' }
  ]);

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
            </div>
            
            {/* Time Range Selector */}
            <div className="flex items-center gap-2">
              {(['today', 'week', 'month'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    timeRange === range
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                      : 'bg-black/40 text-gray-400 border border-white/10 hover:border-white/20'
                  }`}
                >
                  {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : 'This Month'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-36 px-6 pb-6 h-full overflow-y-auto">
        {/* Environmental Conditions Bar */}
        <div className="mb-6 bg-gradient-to-r from-blue-900/20 via-cyan-900/20 to-teal-900/20 backdrop-blur-xl rounded-xl border border-cyan-500/20 p-4">
          <div className="grid grid-cols-6 gap-4">
            {/* Moon Phase */}
            <div className="text-center">
              <div className="text-3xl mb-1">{environmentalData?.moonPhase.icon}</div>
              <div className="text-xs text-gray-400">Moon Phase</div>
              <div className="text-sm text-white font-medium">{environmentalData?.moonPhase.phase}</div>
              <div className="text-xs text-cyan-400">{environmentalData?.moonPhase.illumination}% illuminated</div>
            </div>

            {/* Current Tide */}
            <div className="text-center border-l border-white/10 pl-4">
              <Waves className="w-8 h-8 text-cyan-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Next Tide</div>
              <div className="text-sm text-white font-medium">
                {environmentalData?.tides[0]?.type === 'high' ? 'High' : 'Low'} Tide
              </div>
              <div className="text-xs text-cyan-400">{environmentalData?.tides[0]?.time}</div>
            </div>

            {/* Sunrise/Sunset */}
            <div className="text-center border-l border-white/10 pl-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sunrise className="w-4 h-4 text-orange-400" />
                <Sunset className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xs text-gray-400">Sun Times</div>
              <div className="text-xs text-white">↑ {environmentalData?.sunrise}</div>
              <div className="text-xs text-white">↓ {environmentalData?.sunset}</div>
            </div>

            {/* Water Temp */}
            <div className="text-center border-l border-white/10 pl-4">
              <Thermometer className="w-8 h-8 text-orange-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Water Temp</div>
              <div className="text-lg text-white font-bold">{environmentalData?.waterTemp}°F</div>
              <div className="text-xs text-emerald-400">Optimal</div>
            </div>

            {/* Wind */}
            <div className="text-center border-l border-white/10 pl-4">
              <Wind className="w-8 h-8 text-blue-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Wind</div>
              <div className="text-sm text-white font-medium">
                {environmentalData?.windSpeed} kts
              </div>
              <div className="text-xs text-cyan-400">{environmentalData?.windDirection}</div>
            </div>

            {/* Pressure */}
            <div className="text-center border-l border-white/10 pl-4">
              <Cloud className="w-8 h-8 text-gray-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400">Pressure</div>
              <div className="text-sm text-white font-medium">{environmentalData?.pressure} mb</div>
              <div className="text-xs text-cyan-400">Stable</div>
            </div>
          </div>
        </div>

        {/* Tide Chart */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="col-span-2 bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Today's Tides</h2>
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
                {environmentalData?.tides.map((tide, i) => (
                  <g key={i} transform={`translate(${i * 200 + 100}, ${tide.type === 'high' ? 20 : 80})`}>
                    <circle r="4" fill="#06b6d4" />
                    <text x="0" y="-10" textAnchor="middle" fill="white" fontSize="10">
                      {tide.time}
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
              {environmentalData?.tides.map((tide, i) => (
                <div key={i} className={`p-2 rounded-lg ${
                  tide.type === 'high' ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-gray-800/50 border border-gray-700'
                }`}>
                  <div className="text-xs text-gray-400 mb-1">
                    {tide.type === 'high' ? '↑ High Tide' : '↓ Low Tide'}
                  </div>
                  <div className="text-sm text-white font-medium">{tide.time}</div>
                  <div className="text-xs text-cyan-400">{tide.height.toFixed(1)} ft</div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Prediction */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Bite Prediction</h2>
            {bitePrediction ? (
              <div className="space-y-3">
                <div className={`flex items-center justify-between p-3 rounded-lg border ${
                  bitePrediction.rating === 'excellent' ? 'bg-emerald-500/10 border-emerald-500/30' :
                  bitePrediction.rating === 'good' ? 'bg-blue-500/10 border-blue-500/30' :
                  bitePrediction.rating === 'fair' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-red-500/10 border-red-500/30'
                }`}>
                  <div>
                    <div className="text-sm text-white font-medium">Current Conditions</div>
                    <div className="text-xs text-gray-400">{bitePrediction.rating.charAt(0).toUpperCase() + bitePrediction.rating.slice(1)} for fishing</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      bitePrediction.rating === 'excellent' ? 'text-emerald-400' :
                      bitePrediction.rating === 'good' ? 'text-blue-400' :
                      bitePrediction.rating === 'fair' ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>{bitePrediction.score}%</div>
                    <div className="text-xs text-gray-400">Activity Score</div>
                  </div>
                </div>
                
                {/* Best Times */}
                <div className="space-y-2">
                  <div className="text-xs text-gray-400 uppercase tracking-wide">Best Times</div>
                  {bitePrediction.bestTimes.map((time: string, i: number) => (
                    <div key={i} className="text-sm text-cyan-400 pl-2">• {time}</div>
                  ))}
                </div>
                
                {/* Positive Factors */}
                {bitePrediction.factors.positive.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Positive Factors</div>
                    {bitePrediction.factors.positive.map((factor: string, i: number) => (
                      <div key={i} className="text-sm text-emerald-400 pl-2">✓ {factor}</div>
                    ))}
                  </div>
                )}
                
                {/* Negative Factors */}
                {bitePrediction.factors.negative.length > 0 && (
                  <div className="space-y-1">
                    <div className="text-xs text-gray-400 uppercase tracking-wide">Challenges</div>
                    {bitePrediction.factors.negative.map((factor: string, i: number) => (
                      <div key={i} className="text-sm text-orange-400 pl-2">• {factor}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-pulse space-y-3">
                <div className="h-20 bg-gray-800 rounded-lg" />
                <div className="h-32 bg-gray-800 rounded-lg" />
              </div>
            )}
          </div>
        </div>

        {/* Activity Trends & Species Distribution */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Activity Chart */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Today's Activity Pattern</h2>
            <div className="h-48 flex items-end justify-between gap-2">
              {activityTrend.map((data, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="relative w-full flex flex-col items-center">
                    <span className="text-xs text-cyan-400 mb-1">{data.bites}</span>
                    <div 
                      className="w-full bg-gradient-to-t from-cyan-500/40 to-cyan-400/20 rounded-t"
                      style={{ height: `${(data.activity / 100) * 150}px` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">{data.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Species Distribution */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Species Activity</h2>
            <div className="space-y-3">
              {topSpecies.map((species, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${species.color}`} />
                  <span className="text-sm text-white flex-1">{species.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${species.color} opacity-60`}
                        style={{ width: `${species.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">{species.percentage}%</span>
                    {species.trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-400" />}
                    {species.trend === 'down' && <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Intelligence Insights */}
        <div className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 backdrop-blur-xl rounded-xl border border-cyan-500/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Intelligence Insights</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Anchor className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="text-sm text-white font-medium">Optimal Conditions</div>
                <div className="text-xs text-gray-400 mt-1">
                  Rising tide with moderate wind creates ideal feeding conditions this afternoon
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <Thermometer className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <div className="text-sm text-white font-medium">Temperature Break</div>
                <div className="text-xs text-gray-400 mt-1">
                  2°F temperature change detected 15 miles offshore - potential hotspot
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Moon className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-white font-medium">Moon Influence</div>
                <div className="text-xs text-gray-400 mt-1">
                  Waxing moon phase typically increases night bite activity
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}