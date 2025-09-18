'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Calendar, BarChart3, PieChart, Activity, Fish, Thermometer, Wind, ChevronDown, Users, Target, MapPin } from 'lucide-react';

interface TrendData {
  date: string;
  catches: number;
  temperature: number;
  activity: number;
}

export default function TrendsModeFixed() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'season' | 'year'>('week');
  const [selectedMetric, setSelectedMetric] = useState<'catches' | 'sst' | 'weather'>('catches');
  const [trendFilter, setTrendFilter] = useState('By Species');
  const [showTrendDropdown, setShowTrendDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Mock data for demonstration
  const [stats] = useState({ 
    catches: 247, 
    analyses: 1432, 
    reports: 892,
    activeCaptains: 156
  });

  const [trendData] = useState<TrendData[]>([
    { date: 'Mon', catches: 12, temperature: 72, activity: 65 },
    { date: 'Tue', catches: 19, temperature: 74, activity: 78 },
    { date: 'Wed', catches: 15, temperature: 73, activity: 72 },
    { date: 'Thu', catches: 25, temperature: 75, activity: 85 },
    { date: 'Fri', catches: 32, temperature: 76, activity: 92 },
    { date: 'Sat', catches: 28, temperature: 74, activity: 88 },
    { date: 'Sun', catches: 22, temperature: 73, activity: 76 }
  ]);

  const [topSpecies] = useState([
    { name: 'Mahi', count: 89, trend: '+12%', color: 'bg-yellow-500' },
    { name: 'Tuna', count: 67, trend: '+8%', color: 'bg-blue-500' },
    { name: 'Wahoo', count: 45, trend: '+15%', color: 'bg-purple-500' },
    { name: 'Marlin', count: 23, trend: '-3%', color: 'bg-indigo-500' },
    { name: 'Sailfish', count: 19, trend: '+5%', color: 'bg-cyan-500' }
  ]);

  const [hotspots] = useState([
    { name: 'Baltimore Canyon', activity: 'High', temp: '76°F', depth: '80-120ft' },
    { name: 'Washington Canyon', activity: 'Medium', temp: '74°F', depth: '60-100ft' },
    { name: 'Norfolk Canyon', activity: 'High', temp: '75°F', depth: '100-150ft' },
    { name: 'Poor Mans Canyon', activity: 'Low', temp: '73°F', depth: '70-110ft' }
  ]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTrendDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getMaxValue = () => {
    switch (selectedMetric) {
      case 'catches': return Math.max(...trendData.map(d => d.catches));
      case 'sst': return Math.max(...trendData.map(d => d.temperature));
      case 'weather': return Math.max(...trendData.map(d => d.activity));
      default: return 100;
    }
  };

  const getValue = (data: TrendData) => {
    switch (selectedMetric) {
      case 'catches': return data.catches;
      case 'sst': return data.temperature;
      case 'weather': return data.activity;
      default: return 0;
    }
  };

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-cyan-500/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h1 className="text-lg font-bold text-white">Fishing Trends & Analytics</h1>
            </div>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            {(['week', 'month', 'season', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  timeRange === range
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    : 'bg-black/40 text-gray-400 border border-white/10 hover:border-white/20'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 px-6 pb-6 h-full overflow-y-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <Fish className="w-5 h-5 text-cyan-400" />
              <span className="text-xs text-emerald-400">+12%</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.catches}</div>
            <div className="text-xs text-gray-400">Total Catches</div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-orange-400" />
              <span className="text-xs text-emerald-400">+8%</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.analyses}</div>
            <div className="text-xs text-gray-400">Analyses Run</div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-emerald-400">+15%</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.reports}</div>
            <div className="text-xs text-gray-400">Reports Filed</div>
          </div>
          
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span className="text-xs text-emerald-400">+5%</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.activeCaptains}</div>
            <div className="text-xs text-gray-400">Active Captains</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="col-span-2 bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Activity Trends</h2>
              <div className="flex items-center gap-2">
                {(['catches', 'sst', 'weather'] as const).map((metric) => (
                  <button
                    key={metric}
                    onClick={() => setSelectedMetric(metric)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                      selectedMetric === metric
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-black/40 text-gray-400 border border-white/10'
                    }`}
                  >
                    {metric === 'sst' ? 'SST' : metric.charAt(0).toUpperCase() + metric.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Bar Chart */}
            <div className="h-64 flex items-end justify-between gap-4">
              {trendData.map((data, i) => {
                const value = getValue(data);
                const maxValue = getMaxValue();
                const height = (value / maxValue) * 100;
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full h-48 flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-cyan-500/40 to-cyan-400/20 rounded-t-lg transition-all duration-300 hover:from-cyan-500/60 hover:to-cyan-400/30"
                        style={{ height: `${height}%` }}
                      >
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-cyan-400 font-medium">
                          {value}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{data.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Species */}
          <div className="bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Top Species</h2>
            <div className="space-y-3">
              {topSpecies.map((species, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${species.color}`} />
                    <span className="text-sm text-white">{species.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{species.count}</span>
                    <span className={`text-xs ${species.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {species.trend}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hotspots Table */}
        <div className="mt-6 bg-black/40 backdrop-blur-md rounded-xl border border-cyan-500/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Hot Fishing Zones</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <MapPin className="w-4 h-4" />
              <span>East Coast Overview</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs text-gray-400 font-medium pb-2">Location</th>
                  <th className="text-left text-xs text-gray-400 font-medium pb-2">Activity</th>
                  <th className="text-left text-xs text-gray-400 font-medium pb-2">Water Temp</th>
                  <th className="text-left text-xs text-gray-400 font-medium pb-2">Depth Range</th>
                </tr>
              </thead>
              <tbody>
                {hotspots.map((spot, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-3 text-sm text-white">{spot.name}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        spot.activity === 'High' ? 'bg-emerald-500/20 text-emerald-400' :
                        spot.activity === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {spot.activity}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-white">{spot.temp}</td>
                    <td className="py-3 text-sm text-gray-400">{spot.depth}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
