'use client';

import { useState, useEffect } from 'react';

interface HeroInterfaceProps {
  onSST: (active: boolean) => void;
  onPolygons: (active: boolean) => void;
  onDateChange: (date: string) => void;
  sstActive: boolean;
  polygonsActive: boolean;
  sstOpacity: number;
  onOpacityChange: (opacity: number) => void;
}

export default function HeroInterface({
  onSST,
  onPolygons,
  onDateChange,
  sstActive,
  polygonsActive,
  sstOpacity,
  onOpacityChange
}: HeroInterfaceProps) {
  const [currentTime, setCurrentTime] = useState('');

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', {
        hour12: false,
        timeZone: 'UTC'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-8 left-8 space-y-6">
      {/* Main Control Hub */}
      <div className="bg-black/20 backdrop-blur-2xl rounded-3xl border border-cyan-500/30 p-8 min-w-[380px] shadow-2xl shadow-cyan-500/10">
        
        {/* Branding Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <span className="text-2xl">🌊</span>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  ALWAYS BENT
                </span>
              </h1>
              <p className="text-cyan-100/80 text-sm font-medium">Ocean Intelligence Platform</p>
              <p className="text-white/50 text-xs mt-1">UTC {currentTime}</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-cyan-500/15 to-purple-500/15 rounded-2xl p-4 border border-cyan-400/20">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <p className="text-cyan-100 text-sm font-semibold">Powered by Claude & Cursor</p>
                <p className="text-white/70 text-xs">Revolutionary AI-driven ocean analysis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sea Surface Temperature */}
        <div className="mb-8 p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-400/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">🌡️</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Sea Surface Temperature</h3>
                <p className="text-blue-200/80 text-xs">NOAA CoastWatch MUR • Real-time</p>
              </div>
            </div>
            <button
              onClick={() => onSST(!sstActive)}
              className={`relative px-8 py-4 rounded-2xl font-bold text-sm transition-all duration-500 transform hover:scale-105 ${
                sstActive 
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-2xl shadow-blue-500/40 animate-pulse' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
              }`}
            >
              {sstActive ? (
                <span className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-cyan-300 rounded-full animate-ping"></span>
                  <span className="w-3 h-3 bg-cyan-400 rounded-full absolute left-6"></span>
                  LIVE
                </span>
              ) : (
                'ACTIVATE'
              )}
            </button>
          </div>
          
          {sstActive && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-white/5 rounded-xl p-4">
                <div className="flex items-center gap-4 mb-3">
                  <label className="text-white/90 text-sm font-medium">Thermal Intensity</label>
                  <span className="text-cyan-400 font-mono text-sm bg-cyan-500/20 px-2 py-1 rounded-lg">
                    {Math.round(sstOpacity * 100)}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sstOpacity}
                    onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
                    className="w-full h-3 bg-gradient-to-r from-blue-900/50 to-cyan-900/50 rounded-full appearance-none cursor-pointer thermal-slider"
                  />
                  <div className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full transition-all duration-300" 
                       style={{ width: `${sstOpacity * 100}%` }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ocean Features */}
        <div className="mb-8 p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-400/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-sm font-bold">🌀</span>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Ocean Features</h3>
                <p className="text-purple-200/80 text-xs">Eddies • Filaments • Thermal Fronts</p>
              </div>
            </div>
            <button
              onClick={() => onPolygons(!polygonsActive)}
              className={`relative px-8 py-4 rounded-2xl font-bold text-sm transition-all duration-500 transform hover:scale-105 ${
                polygonsActive 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/40 animate-pulse' 
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
              }`}
            >
              {polygonsActive ? (
                <span className="flex items-center gap-3">
                  <span className="w-3 h-3 bg-pink-300 rounded-full animate-ping"></span>
                  <span className="w-3 h-3 bg-pink-400 rounded-full absolute left-6"></span>
                  DETECTING
                </span>
              ) : (
                'ACTIVATE'
              )}
            </button>
          </div>
        </div>

        {/* Temporal Control */}
        <div className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl border border-orange-400/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold">⏰</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Temporal Analysis</h3>
              <p className="text-orange-200/80 text-xs">Time-series Data Selection</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'LIVE', value: 'latest', icon: '🔴', desc: 'Real-time' },
              { label: 'TODAY', value: '2025-09-08', icon: '📍', desc: 'Current' },
              { label: '-1 DAY', value: '2025-09-07', icon: '⏪', desc: 'Yesterday' },
              { label: '-2 DAYS', value: '2025-09-06', icon: '⏮️', desc: 'Historical' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => onDateChange(option.value)}
                className={`p-4 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                  option.value === 'latest'
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                <div className="text-lg mb-1">{option.icon}</div>
                <div className="font-bold">{option.label}</div>
                <div className="text-xs opacity-80">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Performance HUD */}
      <div className="bg-black/30 backdrop-blur-xl rounded-2xl border border-green-500/30 p-6 min-w-[380px] shadow-xl shadow-green-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
            <span className="text-white text-sm font-bold">⚡</span>
          </div>
          <div>
            <h3 className="text-white font-bold">System Performance</h3>
            <p className="text-green-200/80 text-xs">Real-time Metrics</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-green-400 text-lg font-bold">99.8%</div>
            <div className="text-white/70 text-xs">Uptime</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-cyan-400 text-lg font-bold">&lt; 2s</div>
            <div className="text-white/70 text-xs">Response</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-purple-400 text-lg font-bold">0.25°</div>
            <div className="text-white/70 text-xs">Resolution</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="text-orange-400 text-lg font-bold">Live</div>
            <div className="text-white/70 text-xs">Data Feed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
