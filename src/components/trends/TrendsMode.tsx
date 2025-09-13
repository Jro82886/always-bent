'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, BarChart3, PieChart, Activity, Fish, Thermometer, Wind } from 'lucide-react';

interface TrendsModeProps {
  // No map needed for trends - it's a dashboard!
}

export default function TrendsMode({}: TrendsModeProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'season' | 'year'>('week');
  const [selectedMetric, setSelectedMetric] = useState<'catches' | 'sst' | 'weather'>('catches');
  
  // This component is completely independent of the map
  // It's a pure data dashboard
  
  useEffect(() => {
    console.log('📊 Trends dashboard activated');
    // Future: Fetch historical data, analytics, etc.
    
    return () => {
      console.log('📊 Trends dashboard deactivated');
    };
  }, []);
  
  return (
    <div className="absolute inset-0 z-20 top-16 md:top-20 pointer-events-auto overflow-y-auto">
      {/* Full-screen dashboard overlay */}
      <div className="min-h-full bg-gradient-to-br from-black/90 via-slate-900/90 to-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto p-6">
          {/* Dashboard Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-cyan-400 mb-2">Fishing Trends & Analytics</h1>
            <p className="text-white/60">Historical patterns and performance insights</p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex gap-2 mb-6">
            {(['week', 'month', 'season', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeRange === range
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                    : 'bg-black/40 text-white/60 hover:text-white hover:bg-black/60 border border-white/10'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Main Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Catches */}
            <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-500/30 p-6">
              <div className="flex items-center justify-between mb-2">
                <Fish className="text-cyan-400" size={24} />
                <span className="text-xs text-green-400">+12%</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">247</div>
              <div className="text-xs text-white/60">Total Catches</div>
            </div>
            
            {/* Average SST */}
            <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-500/30 p-6">
              <div className="flex items-center justify-between mb-2">
                <Thermometer className="text-orange-400" size={24} />
                <span className="text-xs text-white/60">±2°F</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">68°F</div>
              <div className="text-xs text-white/60">Avg Water Temp</div>
            </div>
            
            {/* Best Conditions */}
            <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-500/30 p-6">
              <div className="flex items-center justify-between mb-2">
                <Wind className="text-blue-400" size={24} />
                <span className="text-xs text-white/60">NE</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">8-12</div>
              <div className="text-xs text-white/60">Best Wind (kts)</div>
            </div>
            
            {/* Peak Activity */}
            <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-500/30 p-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="text-purple-400" size={24} />
                <span className="text-xs text-white/60">Dawn</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">5-7am</div>
              <div className="text-xs text-white/60">Peak Hours</div>
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Catch Trend Chart */}
            <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-500/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                  <BarChart3 size={20} />
                  Catch Trends
                </h3>
                <select className="px-3 py-1 rounded bg-black/50 border border-cyan-500/30 text-white text-xs">
                  <option>By Species</option>
                  <option>By Location</option>
                  <option>By Time</option>
                </select>
              </div>
              {/* Placeholder for chart */}
              <div className="h-64 flex items-center justify-center border border-cyan-500/10 rounded-lg">
                <span className="text-white/40 text-sm">Chart visualization will go here</span>
              </div>
            </div>
            
            {/* Conditions Correlation */}
            <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-500/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                  <PieChart size={20} />
                  Success Factors
                </h3>
                <button className="text-xs text-cyan-400 hover:text-cyan-300">Details →</button>
              </div>
              {/* Placeholder for chart */}
              <div className="h-64 flex items-center justify-center border border-cyan-500/10 rounded-lg">
                <span className="text-white/40 text-sm">Correlation analysis will go here</span>
              </div>
            </div>
          </div>
          
          {/* Insights Section */}
          <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-500/30 p-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Key Insights
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5" />
                <div>
                  <div className="text-sm text-white mb-1">Best performing days are 2-3 days after a cold front</div>
                  <div className="text-xs text-white/60">Based on last 30 days of data</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5" />
                <div>
                  <div className="text-sm text-white mb-1">68-72°F water temperature shows 40% higher catch rates</div>
                  <div className="text-xs text-white/60">Compared to seasonal average</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-400 mt-1.5" />
                <div>
                  <div className="text-sm text-white mb-1">Edge zones near temperature breaks are most productive</div>
                  <div className="text-xs text-white/60">Especially 2-4°F gradients</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Historical Calendar */}
          <div className="bg-black/60 backdrop-blur-md rounded-xl border border-cyan-500/30 p-6 mt-6">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Historical Performance
            </h3>
            <div className="grid grid-cols-7 gap-2">
              {/* Calendar grid placeholder */}
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded bg-black/40 border border-cyan-500/20 flex items-center justify-center text-xs text-white/40"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
