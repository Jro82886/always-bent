'use client';

import { useState, useEffect } from 'react';
import { useAppState } from '@/lib/store';
import { getInletById } from '@/lib/inlets';
import { resolveInlet, getDemoMessage } from '@/lib/inlet';
import {
  Waves, Sun, Fish, Users, Activity, TrendingUp, 
  Clock, Calendar, Thermometer, Wind, Anchor
} from 'lucide-react';

const PELAGIC_SEED = {
  speciesActivityRange: [
    { name: 'Yellowfin Tuna', pct: 38 },
    { name: 'Mahi-Mahi', pct: 27 },
    { name: 'Wahoo', pct: 14 },
    { name: 'Marlin', pct: 12 },
    { name: 'Bigeye Tuna', pct: 9 }
  ],
  communityToday: [
    { hour: '06', count: 3 }, 
    { hour: '08', count: 4 }, 
    { hour: '12', count: 2 }, 
    { hour: '17', count: 5 }
  ],
  counts: { 
    reportsToday: 9, 
    activeAnglers: 24, 
    hotSpecies: 'Yellowfin Tuna' 
  }
};

export default function TrendsGridPolished() {
  const { selectedInletId } = useAppState();
  const demoMessage = getDemoMessage();
  
  let inlet = getInletById(selectedInletId);
  if (!inlet) {
    inlet = resolveInlet(null);
  }

  // Check pelagic mock flag
  const PELAGIC_ON = process.env.NEXT_PUBLIC_TRENDS_PELAGIC_MOCK === '1';

  // Use pelagic seed data when flag is on, otherwise use realistic coastal data
  const mockData = {
    tides: [
      { type: 'high' as const, time: '6:42 AM', height: '4.2 ft' },
      { type: 'low' as const, time: '12:15 PM', height: '1.1 ft' },
      { type: 'high' as const, time: '6:58 PM', height: '4.5 ft' },
      { type: 'low' as const, time: '12:45 AM', height: '0.8 ft' },
    ],
    weather: {
      temp: 74,
      wind: '15 kt NE',
      waves: '3-4 ft',
      visibility: '12+ mi'
    },
    fishing: {
      bestWindow: 'Dawn & Dusk',
      activity: 'High',
      primaryDepth: PELAGIC_ON ? 'Offshore (50+ nm)' : 'Near Shore (5-15 nm)'
    },
    species: PELAGIC_ON ? PELAGIC_SEED.speciesActivityRange : [
      { name: 'Striped Bass', pct: 42 },
      { name: 'Bluefish', pct: 28 },
      { name: 'Flounder', pct: 18 },
      { name: 'Black Sea Bass', pct: 12 }
    ],
    community: PELAGIC_ON ? PELAGIC_SEED.counts : {
      reportsToday: 12,
      activeAnglers: 31,
      hotSpecies: 'Striped Bass'
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      
      {/* Command Bridge Header */}
      <div className="mb-8">
        <h1 className="abfi-title text-3xl font-bold mb-3">Fishing Trends</h1>
        <p className="text-slate-300 mb-2">
          {inlet ? `Live conditions and patterns for ${inlet.name}` : 'Live fishing intelligence and patterns'}
        </p>
        {demoMessage && (
          <div className="text-xs text-cyan-200/60 italic">
            {demoMessage}
          </div>
        )}
      </div>

      {/* Main 2x2 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Current Conditions */}
        <div className="abfi-card abfi-glow">
          <div className="flex items-center gap-3 mb-4">
            <Thermometer className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Current Conditions</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-300">{mockData.weather.temp}°F</div>
              <div className="text-sm text-slate-400">Water Temp</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-300">{mockData.weather.wind}</div>
              <div className="text-sm text-slate-400">Wind</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-300">{mockData.weather.waves}</div>
              <div className="text-sm text-slate-400">Seas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-300">{mockData.weather.visibility}</div>
              <div className="text-sm text-slate-400">Visibility</div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Primary Zone</span>
              <span className="text-cyan-300">{mockData.fishing.primaryDepth}</span>
            </div>
          </div>
        </div>

        {/* Today's Tides */}
        <div className="abfi-card abfi-glow">
          <div className="flex items-center gap-3 mb-4">
            <Waves className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Today's Tides</h3>
          </div>
          
          <div className="space-y-3">
            {mockData.tides.map((tide, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${tide.type === 'high' ? 'bg-cyan-400' : 'bg-slate-500'}`} />
                  <span className="text-white capitalize font-medium">{tide.type}</span>
                </div>
                <div className="text-right">
                  <div className="text-cyan-300 font-medium">{tide.time}</div>
                  <div className="text-xs text-slate-400">{tide.height}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Best Fishing */}
        <div className="abfi-card abfi-glow">
          <div className="flex items-center gap-3 mb-4">
            <Fish className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Active Species</h3>
          </div>
          
          {mockData.species.length > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between mb-3">
                <span className="text-slate-400">Prime Time</span>
                <span className="text-cyan-300 font-medium">{mockData.fishing.bestWindow}</span>
              </div>
              
              <div>
                <div className="text-sm text-slate-400 mb-3">Species Activity</div>
                <ul className="flex flex-wrap gap-2">
                  {mockData.species.map(s => (
                    <li key={s.name} className="px-2.5 py-1 rounded-lg bg-white/8 text-cyan-100 text-sm abfi-glow">
                      {s.name} · {s.pct}%
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <div className="text-sm">No species data yet — you'll see hot pelagics here during the season.</div>
            </div>
          )}
        </div>

        {/* Community Activity */}
        <div className="abfi-card abfi-glow">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Community Activity</h3>
          </div>
          
          {mockData.community.reportsToday > 0 ? (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-slate-400 text-xs mb-1">Reports Today</div>
                <div className="text-cyan-100 text-lg font-bold">{mockData.community.reportsToday}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">Active Anglers</div>
                <div className="text-cyan-100 text-lg font-bold">{mockData.community.activeAnglers}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">Hot Species</div>
                <div className="text-green-400 text-sm font-medium mt-2">{mockData.community.hotSpecies}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400">
              <div className="text-sm">No angler activity yet — this fills in as the fleet reports bites.</div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
