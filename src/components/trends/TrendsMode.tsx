'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Calendar, BarChart3, PieChart, Activity, Fish, Thermometer, Wind, ChevronDown } from 'lucide-react';

interface TrendsModeProps {
  // No map needed for trends - it's a dashboard!
}

export default function TrendsMode({}: TrendsModeProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'season' | 'year'>('week');
  const [selectedMetric, setSelectedMetric] = useState<'catches' | 'sst' | 'weather'>('catches');
  const [showTestData, setShowTestData] = useState(false); // Default to hiding test data
  const [stats, setStats] = useState({ catches: 0, analyses: 0 });
  const [trendFilter, setTrendFilter] = useState('By Species');
  const [showTrendDropdown, setShowTrendDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // This component is completely independent of the map
  // It's a pure data dashboard
  
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
  
  useEffect(() => {
    console.log('📊 Fishing Intelligence activated');
    
    // Load data, filtering out test data unless explicitly shown
    const loadTrendsData = () => {
      // Get production data only (not test data)
      const catches = JSON.parse(localStorage.getItem('abfi_catches') || '[]');
      const analyses = JSON.parse(localStorage.getItem('abfi_analyses') || '[]');
      
      // Filter out any test data that might have leaked into production storage
      const productionCatches = catches.filter((c: any) => !c.is_test_data);
      const productionAnalyses = analyses.filter((a: any) => !a.is_test_data);
      
      setStats({
        catches: productionCatches.length,
        analyses: productionAnalyses.length
      });
      
      console.log(`📊 Loaded production data: ${productionCatches.length} catches, ${productionAnalyses.length} analyses`);
      
      // Check for test data
      const testCatches = JSON.parse(localStorage.getItem('abfi_test_catches') || '[]');
      const testAnalyses = JSON.parse(localStorage.getItem('abfi_test_analyses') || '[]');
      if (testCatches.length > 0 || testAnalyses.length > 0) {
        console.log(`🧪 Test data available: ${testCatches.length} test catches, ${testAnalyses.length} test analyses (hidden by default)`);
      }
    };
    
    loadTrendsData();
    
    return () => {
      console.log('📊 Fishing Intelligence deactivated');
    };
  }, [showTestData]);
  
  return (
    <div className="absolute inset-0 z-20 top-16 md:top-20 pointer-events-auto overflow-y-auto">
      {/* Full-screen dashboard overlay */}
      <div className="min-h-full bg-gradient-to-br from-black/90 via-slate-900/90 to-black/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto p-6">
          {/* Dashboard Header - Make it POP! */}
          <div className="mb-8">
            <h1 className="text-3xl font-light text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 tracking-wide mb-2">Fishing Intelligence Hub</h1>
            <p className="text-gray-400 text-sm font-light leading-relaxed max-w-2xl">
              Advanced pattern recognition and predictive analytics. Discover when, where, and why fish are biting based on real-time ocean data, historical catches, and environmental factors.
            </p>
          </div>
          
          {/* KEY INSIGHTS - TOP PRIORITY */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-md rounded-xl border border-cyan-400/30 p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-medium text-cyan-400 tracking-wide">Key Insights</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-2 animate-pulse"></div>
                  <div>
                    <p className="text-white text-sm">Best performing days are 2-3 days after a cold front</p>
                    <p className="text-gray-400 text-xs mt-1">Based on last 30 days of data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 animate-pulse"></div>
                  <div>
                    <p className="text-white text-sm">68-72°F water temperature shows 40% higher catch rates</p>
                    <p className="text-gray-400 text-xs mt-1">Optimal thermal range detected</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-400 mt-2 animate-pulse"></div>
                  <div>
                    <p className="text-white text-sm">Morning bite shifting 15 min earlier each week</p>
                    <p className="text-gray-400 text-xs mt-1">Seasonal pattern emerging</p>
                  </div>
                </div>
              </div>
            </div>
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
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-cyan-500/10 p-5 hover:border-cyan-500/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Fish className="text-cyan-400/70" size={20} />
                {stats.catches > 0 && (
                  <span className="text-xs text-green-400">Production</span>
                )}
              </div>
              <div className="text-2xl font-light text-white mb-1">{stats.catches}</div>
              <div className="text-sm text-gray-400">Total Catches</div>
            </div>
            
            {/* Average SST */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-cyan-500/10 p-5 hover:border-cyan-500/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Thermometer className="text-orange-400/70" size={20} />
                <span className="text-xs text-white/60">±2°F</span>
              </div>
              <div className="text-2xl font-light text-white mb-1">68°F</div>
              <div className="text-sm text-gray-400">Avg Water Temp</div>
            </div>
            
            {/* Best Conditions */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-cyan-500/10 p-5 hover:border-cyan-500/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Wind className="text-blue-400/70" size={20} />
                <span className="text-xs text-white/60">NE</span>
              </div>
              <div className="text-2xl font-light text-white mb-1">8-12</div>
              <div className="text-sm text-gray-400">Best Wind (kts)</div>
            </div>
            
            {/* Peak Activity */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-cyan-500/10 p-5 hover:border-cyan-500/20 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Activity className="text-purple-400/70" size={20} />
                <span className="text-xs text-white/60">Dawn</span>
              </div>
              <div className="text-2xl font-light text-white mb-1">5-7am</div>
              <div className="text-sm text-gray-400">Peak Hours</div>
            </div>
          </div>
          
          {/* Real-Time Activity Feed - Moved up after stats */}
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-cyan-500/10 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-cyan-400 flex items-center gap-2">
                <Activity size={18} />
                Real-Time Activity Feed
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Live</span>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {/* Mock real-time activity items */}
              <div className="flex items-start gap-3 p-2 bg-gray-950/30 rounded-lg border border-cyan-500/5 hover:border-cyan-500/20 transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 animate-pulse" />
                <div className="flex-1">
                  <div className="text-sm text-white">Bluefin landed - 42lbs</div>
                  <div className="text-xs text-gray-400">Barnegat Inlet • 2 min ago • SST: 68°F</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-gray-950/30 rounded-lg border border-cyan-500/5 hover:border-cyan-500/20 transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2" />
                <div className="flex-1">
                  <div className="text-sm text-white">Temperature break detected</div>
                  <div className="text-xs text-gray-400">60-80ft contour • 3°F gradient • High activity zone</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-gray-950/30 rounded-lg border border-cyan-500/5 hover:border-cyan-500/20 transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 mt-2" />
                <div className="flex-1">
                  <div className="text-sm text-white">Fleet concentration building</div>
                  <div className="text-xs text-gray-400">5 boats • Canyon edge • Morning bite starting</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-gray-950/30 rounded-lg border border-cyan-500/5 hover:border-cyan-500/20 transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2" />
                <div className="flex-1">
                  <div className="text-sm text-white">Pattern alert: Tide change in 30 min</div>
                  <div className="text-xs text-gray-400">Historical data shows 45% increase in activity</div>
                </div>
              </div>
              <div className="flex items-start gap-3 p-2 bg-gray-950/30 rounded-lg border border-cyan-500/5 hover:border-cyan-500/20 transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2" />
                <div className="flex-1">
                  <div className="text-sm text-white">Striped bass on - multiple hookups</div>
                  <div className="text-xs text-gray-400">Montauk Point • 8 min ago • Dawn patrol success</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Catch Trend Chart */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-cyan-500/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-cyan-400 flex items-center gap-2">
                  <BarChart3 size={18} />
                  Catch Trends
                </h3>
                {/* Custom Stylized Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowTrendDropdown(!showTrendDropdown)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-400/40 rounded-full text-cyan-100 hover:from-cyan-800/50 hover:to-blue-800/50 transition-all group"
                    style={{
                      boxShadow: '0 0 20px rgba(6, 182, 212, 0.2), inset 0 0 15px rgba(6, 182, 212, 0.1)',
                    }}
                  >
                    <span className="text-sm font-medium tracking-wide">{trendFilter}</span>
                    <ChevronDown 
                      size={16} 
                      className={`text-cyan-400 transition-transform group-hover:text-cyan-300 ${
                        showTrendDropdown ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showTrendDropdown && (
                    <div 
                      className="absolute top-full mt-2 right-0 z-50 min-w-[160px] bg-slate-900/95 backdrop-blur-xl border border-cyan-400/40 rounded-xl shadow-2xl overflow-hidden"
                      style={{
                        boxShadow: '0 10px 40px rgba(6, 182, 212, 0.3), 0 0 60px rgba(6, 182, 212, 0.15)'
                      }}
                    >
                      {['By Species', 'By Location', 'By Time'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setTrendFilter(option);
                            setShowTrendDropdown(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-cyan-400/10 transition-all flex items-center gap-3 ${
                            trendFilter === option ? 'bg-cyan-400/20 text-cyan-300' : 'text-white/80'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {option === 'By Species' && <Fish size={14} className="text-cyan-400" />}
                            {option === 'By Location' && <Activity size={14} className="text-cyan-400" />}
                            {option === 'By Time' && <Calendar size={14} className="text-cyan-400" />}
                            <span>{option}</span>
                          </div>
                          {trendFilter === option && (
                            <span className="text-cyan-400">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {/* Placeholder for chart */}
              <div className="h-64 flex items-center justify-center border border-cyan-500/10 rounded-lg">
                <span className="text-white/40 text-sm">Chart visualization will go here</span>
              </div>
            </div>
            
            {/* Success Factors - Matching Catch Trends design */}
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-cyan-500/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-cyan-400 flex items-center gap-2">
                  <PieChart size={18} />
                  Success Factors
                </h3>
                <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">Details →</button>
              </div>
              {/* Placeholder for chart */}
              <div className="h-64 flex items-center justify-center border border-cyan-500/10 rounded-lg">
                <span className="text-white/40 text-sm">Correlation analysis will go here</span>
              </div>
            </div>
          </div>
          
          {/* Predictive Insights - Replacing Historical Calendar */}
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-xl border border-cyan-500/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-cyan-400 flex items-center gap-2">
                <TrendingUp size={18} />
                Predictive Insights
              </h3>
              <span className="text-xs text-gray-400">Next 48 hours</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-950/30 rounded-lg p-3 border border-cyan-500/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Tomorrow Morning</span>
                  <span className="text-xs text-green-400">HIGH</span>
                </div>
                <div className="text-sm text-white mb-1">Optimal conditions expected</div>
                <div className="text-xs text-gray-400">SST: 69°F • Wind: NE 8kts • Tide: Rising</div>
              </div>
              <div className="bg-gray-950/30 rounded-lg p-3 border border-cyan-500/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Tomorrow Afternoon</span>
                  <span className="text-xs text-yellow-400">MODERATE</span>
                </div>
                <div className="text-sm text-white mb-1">Wind picking up</div>
                <div className="text-xs text-gray-400">SST: 70°F • Wind: E 15kts • Tide: Slack</div>
              </div>
              <div className="bg-gray-950/30 rounded-lg p-3 border border-cyan-500/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Wednesday Dawn</span>
                  <span className="text-xs text-green-400">EXCELLENT</span>
                </div>
                <div className="text-sm text-white mb-1">Prime bluefin window</div>
                <div className="text-xs text-gray-400">Cold front passing • 3°F temp drop</div>
              </div>
              <div className="bg-gray-950/30 rounded-lg p-3 border border-cyan-500/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">Best Strategy</span>
                  <span className="text-xs text-cyan-400">AI TIP</span>
                </div>
                <div className="text-sm text-white mb-1">Target 60-80ft contours</div>
                <div className="text-xs text-gray-400">Temperature breaks forming offshore</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
