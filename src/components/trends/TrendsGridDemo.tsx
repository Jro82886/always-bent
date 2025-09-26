'use client';

import { useState, useEffect } from 'react';
import { useAppState } from '@/lib/store';
import { getInletById } from '@/lib/inlets';
import { resolveInlet, getDemoMessage } from '@/lib/inlet';
import {
  Waves, Sun, Fish, Users, Activity, TrendingUp, 
  Clock, Calendar, Thermometer, Wind
} from 'lucide-react';

export default function TrendsGridDemo() {
  const { selectedInletId } = useAppState();
  const demoMessage = getDemoMessage();
  
  let inlet = getInletById(selectedInletId);
  if (!inlet) {
    inlet = resolveInlet(null);
  }

  // Mock data for a polished demo experience
  const mockData = {
    tides: [
      { type: 'high' as const, time: '6:42 AM', height: '4.2 ft' },
      { type: 'low' as const, time: '12:15 PM', height: '1.1 ft' },
      { type: 'high' as const, time: '6:58 PM', height: '4.5 ft' },
      { type: 'low' as const, time: '12:45 AM', height: '0.8 ft' },
    ],
    weather: {
      temp: 72,
      wind: '12 kt NE',
      waves: '2-3 ft',
      visibility: '10+ mi'
    },
    fishing: {
      bestWindow: 'Dawn & Dusk',
      activity: 'Moderate',
      species: ['Striped Bass', 'Bluefish', 'Flounder']
    },
    community: {
      reportsToday: 8,
      activeAnglers: 24,
      topSpecies: 'Striped Bass'
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Fishing Trends</h1>
        <p className="text-slate-300">
          {inlet ? `Live conditions and patterns for ${inlet.name}` : 'Live fishing intelligence and patterns'}
        </p>
        {demoMessage && (
          <div className="text-xs text-cyan-200/60 italic mt-2 px-3 py-1 bg-cyan-500/10 rounded-full inline-block">
            {demoMessage}
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        
        {/* Current Conditions */}
        <div className="col-span-1 xl:col-span-2">
          <div className="abfi-card bg-slate-900/60 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Thermometer className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Current Conditions</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <div className="text-sm text-slate-400">Waves</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-300">{mockData.weather.visibility}</div>
                <div className="text-sm text-slate-400">Visibility</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tide Schedule */}
        <div className="abfi-card bg-slate-900/60 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Waves className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Today's Tides</h3>
          </div>
          
          <div className="space-y-3">
            {mockData.tides.map((tide, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${tide.type === 'high' ? 'bg-cyan-400' : 'bg-slate-500'}`} />
                  <span className="text-white capitalize">{tide.type}</span>
                </div>
                <div className="text-right">
                  <div className="text-cyan-300 font-medium">{tide.time}</div>
                  <div className="text-xs text-slate-400">{tide.height}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Fishing Window */}
        <div className="abfi-card bg-slate-900/60 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Fish className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Best Fishing</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Prime Time</span>
              <span className="text-cyan-300 font-medium">{mockData.fishing.bestWindow}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Activity Level</span>
              <span className="text-green-400 font-medium">{mockData.fishing.activity}</span>
            </div>
            
            <div className="mt-4">
              <div className="text-sm text-slate-400 mb-2">Active Species</div>
              <div className="flex flex-wrap gap-2">
                {mockData.fishing.species.map((species, i) => (
                  <span key={i} className="chip">
                    {species}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Community Activity */}
        <div className="abfi-card bg-slate-900/60 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Community</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Reports Today</span>
              <span className="text-cyan-300 font-bold">{mockData.community.reportsToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Active Anglers</span>
              <span className="text-cyan-300 font-bold">{mockData.community.activeAnglers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Hot Species</span>
              <span className="text-green-400 font-medium">{mockData.community.topSpecies}</span>
            </div>
          </div>
        </div>

        {/* Weekly Outlook */}
        <div className="abfi-card bg-slate-900/60 backdrop-blur border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Week Ahead</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Tomorrow</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="text-green-400 text-sm">Excellent</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Weekend</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <span className="text-yellow-400 text-sm">Good</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Next Week</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                <span className="text-cyan-400 text-sm">Variable</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
