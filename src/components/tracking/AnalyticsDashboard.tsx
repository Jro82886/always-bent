'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Activity, Anchor, Navigation,
  Clock, MapPin, Zap, DollarSign, AlertTriangle,
  CheckCircle, XCircle, Info
} from 'lucide-react';

interface AnalyticsData {
  totalVessels: number;
  activeVessels: number;
  fishingVessels: number;
  anchoredVessels: number;
  avgSpeed: number;
  totalDistance: number;
  fuelEfficiency: number;
  revenue: number;
  alerts: number;
  performance: {
    efficiency: number;
    safety: number;
    compliance: number;
  };
  trends: {
    activity: number[];
    fuel: number[];
    catches: number[];
  };
}

interface AnalyticsDashboardProps {
  mode: 'individual' | 'fleet' | 'commercial';
  timeRange: '24h' | '7d' | '30d';
  onTimeRangeChange: (range: '24h' | '7d' | '30d') => void;
}

export default function AnalyticsDashboard({ mode, timeRange, onTimeRangeChange }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData>({
    totalVessels: mode === 'individual' ? 1 : mode === 'fleet' ? 24 : 156,
    activeVessels: mode === 'individual' ? 1 : mode === 'fleet' ? 18 : 142,
    fishingVessels: mode === 'fleet' ? 6 : 0,
    anchoredVessels: mode === 'fleet' ? 6 : 14,
    avgSpeed: 12.5,
    totalDistance: 1842,
    fuelEfficiency: 0.82,
    revenue: mode === 'fleet' ? 125000 : 0,
    alerts: 3,
    performance: {
      efficiency: 0.85,
      safety: 0.92,
      compliance: 0.98
    },
    trends: {
      activity: [65, 70, 68, 75, 80, 78, 82],
      fuel: [100, 95, 92, 88, 85, 87, 84],
      catches: [12, 15, 18, 14, 20, 22, 19]
    }
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => ({
        ...prev,
        avgSpeed: prev.avgSpeed + (Math.random() - 0.5) * 0.5,
        totalDistance: prev.totalDistance + Math.random() * 10,
        fuelEfficiency: Math.min(1, Math.max(0.5, prev.fuelEfficiency + (Math.random() - 0.5) * 0.02)),
        revenue: prev.revenue + (mode === 'fleet' ? Math.random() * 1000 : 0)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [mode]);

  return (
    <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Analytics Dashboard</h2>
            <p className="text-xs text-gray-400">Real-time performance metrics</p>
          </div>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex gap-1 p-1 bg-gray-900/50 rounded-lg">
          {(['24h', '7d', '30d'] as const).map(range => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                timeRange === range
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Active Vessels */}
        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-4 border border-green-500/20">
          <div className="flex items-center justify-between mb-2">
            <Navigation className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-400">+12%</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.activeVessels}</p>
          <p className="text-xs text-green-300">Active Vessels</p>
        </div>

        {/* Average Speed */}
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-blue-400">↑ 2.5</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.avgSpeed.toFixed(1)}</p>
          <p className="text-xs text-blue-300">Avg Speed (kts)</p>
        </div>

        {/* Total Distance */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <MapPin className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-purple-400">↑ 156</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.totalDistance.toFixed(0)}</p>
          <p className="text-xs text-purple-300">Total NM</p>
        </div>

        {/* Fuel Efficiency */}
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/20">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-xs text-yellow-400">{(data.fuelEfficiency * 100).toFixed(0)}%</span>
          </div>
          <p className="text-2xl font-bold text-white">{data.fuelEfficiency.toFixed(2)}</p>
          <p className="text-xs text-yellow-300">Energy Efficiency</p>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Performance</h3>
        <div className="space-y-3">
          {Object.entries(data.performance).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-20 capitalize">{key}</span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    value > 0.9 ? 'bg-green-500' : value > 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${value * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-300 w-12 text-right">{(value * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Chart */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity Trend</h3>
        <div className="h-32 flex items-end gap-1">
          {data.trends.activity.map((value, idx) => (
            <div key={idx} className="flex-1 bg-cyan-500/20 rounded-t hover:bg-cyan-500/30 transition-colors relative group">
              <div 
                className="bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t transition-all duration-300"
                style={{ height: `${value}%` }}
              />
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {value}%
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>
      </div>

      {/* Alerts & Notifications */}
      <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            Recent Alerts
          </h3>
          <span className="text-xs text-gray-500">{data.alerts} active</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-xs">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-gray-300">High fuel consumption on FV Thunder</span>
            <span className="text-gray-500 ml-auto">2m ago</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-gray-300">FV Lightning reached fishing grounds</span>
            <span className="text-gray-500 ml-auto">15m ago</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-gray-300">Weather advisory: 15kt winds expected</span>
            <span className="text-gray-500 ml-auto">1h ago</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {mode === 'fleet' && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors flex flex-col items-center gap-1">
            <DollarSign className="w-4 h-4" />
            Revenue Report
          </button>
          <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors flex flex-col items-center gap-1">
            <Zap className="w-4 h-4" />
            Energy Analysis
          </button>
          <button className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors flex flex-col items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Compliance
          </button>
        </div>
      )}
    </div>
  );
}
