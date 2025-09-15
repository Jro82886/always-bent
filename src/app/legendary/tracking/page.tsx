'use client';

import { useState, useEffect } from 'react';
import { useAppState } from '@/store/appState';
import { getInletById } from '@/lib/inlets';

export default function TrackingPage() {
  const { selectedInletId } = useAppState();
  const [showUser, setShowUser] = useState(true);
  const [showFleet, setShowFleet] = useState(true);
  const [showCommercial, setShowCommercial] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Get inlet info
  const inlet = selectedInletId ? getInletById(selectedInletId) : null;

  // Mock vessel data
  const mockVessels = {
    user: { name: 'My Vessel', status: 'Active', speed: '18 kts', heading: 'NE' },
    fleet: [
      { name: 'Reel Deal', status: 'Fishing', location: 'North Ledge' },
      { name: 'Sea Hunter', status: 'Moving', speed: '22 kts' },
      { name: 'Lucky Strike', status: 'Anchored', location: 'Canyon Edge' }
    ],
    commercial: [
      { name: 'Commercial 1', type: 'Trawler', distance: '12 nm' },
      { name: 'Commercial 2', type: 'Longliner', distance: '8 nm' }
    ]
  };

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      
      {/* Top Info Bar */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-cyan-500/20 shadow-2xl px-6 py-3">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-cyan-400 rounded-sm" />
              <div>
                <div className="text-xs text-slate-400 uppercase tracking-wider">Active Inlet</div>
                <div className="text-lg font-bold text-white">{inlet?.name || 'Select Inlet'}</div>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">Vessels in Area:</span>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-cyan-400">6</div>
                  <div className="text-[10px] text-slate-500">TOTAL</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-400">4</div>
                  <div className="text-[10px] text-slate-500">ACTIVE</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-400">2</div>
                  <div className="text-[10px] text-slate-500">FISHING</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Left Panel - Fleet Command */}
      <div className="absolute top-32 left-4 z-40 w-80">
        <div className="bg-slate-900/95 backdrop-blur-md rounded-xl border border-cyan-500/20 shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 px-4 py-3 border-b border-cyan-500/20">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Fleet Command Center</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`} />
                <span className="text-xs text-slate-400">{autoRefresh ? 'LIVE' : 'PAUSED'}</span>
              </div>
            </div>
          </div>

          {/* Your Vessel Status */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-slate-400 uppercase tracking-wider">Your Vessel</h3>
              <button
                onClick={() => setShowUser(!showUser)}
                className={`text-xs font-bold ${showUser ? 'text-cyan-400' : 'text-slate-600'}`}
              >
                {showUser ? 'VISIBLE' : 'HIDDEN'}
              </button>
            </div>
            {showUser && (
              <div className="bg-slate-800/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{mockVessels.user.name}</span>
                  <span className="text-xs text-green-400">{mockVessels.user.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Speed:</span>
                    <span className="text-cyan-400 ml-1">{mockVessels.user.speed}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Heading:</span>
                    <span className="text-cyan-400 ml-1">{mockVessels.user.heading}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fleet Vessels */}
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-slate-400 uppercase tracking-wider">Fleet Vessels (3)</h3>
              <button
                onClick={() => setShowFleet(!showFleet)}
                className={`text-xs font-bold ${showFleet ? 'text-cyan-400' : 'text-slate-600'}`}
              >
                {showFleet ? 'VISIBLE' : 'HIDDEN'}
              </button>
            </div>
            {showFleet && (
              <div className="space-y-2">
                {mockVessels.fleet.map((vessel, i) => (
                  <div key={i} className="bg-slate-800/30 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{vessel.name}</span>
                      <span className="text-xs text-cyan-400">{vessel.status}</span>
                    </div>
                    {vessel.location && (
                      <span className="text-xs text-slate-500">{vessel.location}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Commercial Traffic */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs text-slate-400 uppercase tracking-wider">Commercial (2)</h3>
              <button
                onClick={() => setShowCommercial(!showCommercial)}
                className={`text-xs font-bold ${showCommercial ? 'text-cyan-400' : 'text-slate-600'}`}
              >
                {showCommercial ? 'VISIBLE' : 'HIDDEN'}
              </button>
            </div>
            {showCommercial && (
              <div className="space-y-2">
                {mockVessels.commercial.map((vessel, i) => (
                  <div key={i} className="bg-slate-800/30 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white">{vessel.name}</span>
                      <span className="text-xs text-orange-400">{vessel.type}</span>
                    </div>
                    <span className="text-xs text-slate-500">Distance: {vessel.distance}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto-refresh Control */}
          <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Auto-refresh</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  autoRefresh 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600'
                }`}
              >
                {autoRefresh ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Activity Feed */}
      <div className="absolute top-32 right-4 z-40 w-72">
        <div className="bg-slate-900/95 backdrop-blur-md rounded-xl border border-cyan-500/20 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 px-4 py-3 border-b border-cyan-500/20">
            <h2 className="text-sm font-bold text-white">Real-Time Activity</h2>
          </div>
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            <ActivityItem 
              type="fishing"
              vessel="Reel Deal"
              message="Started fishing at North Ledge"
              time="2 min ago"
            />
            <ActivityItem 
              type="movement"
              vessel="Sea Hunter"
              message="Heading offshore at 22 kts"
              time="15 min ago"
            />
            <ActivityItem 
              type="anchor"
              vessel="Lucky Strike"
              message="Anchored at Canyon Edge"
              time="45 min ago"
            />
            <ActivityItem 
              type="bite"
              vessel="Fleet Alert"
              message="Multiple hookups reported North Ledge"
              time="1 hour ago"
            />
          </div>
        </div>
      </div>

      {/* Center Map Area */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-cyan-400 mb-2">Fleet Tracking System</h1>
            <p className="text-lg text-slate-400">Real-time vessel positions and activity</p>
          </div>
          
          {/* Mock Map Placeholder */}
          <div className="relative w-[600px] h-[400px] bg-slate-800/50 rounded-xl border border-cyan-500/20 mx-auto">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-slate-500">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-sm">Interactive map with vessel positions</p>
                <p className="text-xs text-slate-600 mt-2">Mapbox integration coming soon</p>
              </div>
            </div>
            
            {/* Mock vessel dots */}
            <div className="absolute top-1/3 left-1/2 w-4 h-4 bg-white rounded-full shadow-lg animate-pulse" />
            <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-cyan-400 rounded-full" />
            <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-cyan-400 rounded-full" />
            <div className="absolute top-1/4 right-1/4 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-orange-500" />
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-slate-900/95 backdrop-blur-xl rounded-xl border border-cyan-500/20 px-6 py-2">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-full" />
              <span className="text-slate-400">Your Vessel</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-cyan-400 rounded-full" />
              <span className="text-slate-400">Fleet</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-transparent border-b-orange-500" />
              <span className="text-slate-400">Commercial</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <span className="text-green-400">System Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Activity Item Component
function ActivityItem({ type, vessel, message, time }: any) {
  const getIcon = () => {
    switch(type) {
      case 'fishing': return '🎣';
      case 'movement': return '➡️';
      case 'anchor': return '⚓';
      case 'bite': return '⚡';
      default: return '📍';
    }
  };

  const getColor = () => {
    switch(type) {
      case 'fishing': return 'text-green-400';
      case 'movement': return 'text-blue-400';
      case 'anchor': return 'text-yellow-400';
      case 'bite': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-800/30 transition-all">
      <span className="text-lg">{getIcon()}</span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${getColor()}`}>{vessel}</span>
          <span className="text-xs text-slate-500">{time}</span>
        </div>
        <p className="text-xs text-slate-400 mt-0.5">{message}</p>
      </div>
    </div>
  );
}