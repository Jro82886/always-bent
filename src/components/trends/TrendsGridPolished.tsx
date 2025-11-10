'use client';

import { useState, useEffect } from 'react';
import { useAppState } from '@/lib/store';
import { getInletById } from '@/lib/inlets';
import { resolveInlet, getDemoMessage } from '@/lib/inlet';
import HeaderBar from '@/components/CommandBridge/HeaderBar';
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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const demoMessage = getDemoMessage();
  
  let inlet = getInletById(selectedInletId);
  if (!inlet) {
    inlet = resolveInlet(null);
  }

  // Check pelagic mock flag
  const PELAGIC_ON = process.env.NEXT_PUBLIC_TRENDS_PELAGIC_MOCK === '1';

  useEffect(() => {
    const fetchTrends = async () => {
      if (!inlet) {
        setLoading(false);
        return;
      }

      try {
        const [lng, lat] = inlet.center;
        const params = new URLSearchParams({
          inlet: inlet.id || '',
          lat: lat.toString(),
          lng: lng.toString(),
          rangeDays: '14'
        });

        const res = await fetch(`/api/trends?${params}`, { cache: 'no-store' });
        if (res.ok) {
          const apiData = await res.json();
          setData(apiData);
        }
      } catch (error) {
        console.error('Error fetching trends:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [selectedInletId, inlet]);

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
      { name: 'Yellowfin Tuna', pct: 38 },
      { name: 'Mahi-Mahi', pct: 27 },
      { name: 'Wahoo', pct: 20 },
      { name: 'Bluefin Tuna', pct: 15 }
    ],
    community: PELAGIC_ON ? PELAGIC_SEED.counts : {
      reportsToday: 12,
      activeAnglers: 31,
      hotSpecies: 'Yellowfin Tuna'
    }
  };

  // Use real data when available, fallback to mock data for demo
  const displayData = {
    tides: data?.tides?.events?.length ? data.tides.events.slice(0, 4).map((tide: any) => ({
      type: tide.type,
      time: new Date(tide.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
      height: `${tide.height_m?.toFixed(1) || '0.0'} ft`
    })) : mockData.tides,
    weather: mockData.weather, // Use mock for now, can be enhanced later
    fishing: mockData.fishing,
    species: data?.speciesActivityRange?.length ? data.speciesActivityRange : mockData.species,
    community: {
      reportsToday: data?.communityActivityToday?.reduce((sum: number, item: any) => sum + item.count, 0) || mockData.community.reportsToday,
      activeAnglers: mockData.community.activeAnglers, // This would come from presence data
      hotSpecies: data?.speciesActivityRange?.[0]?.name || mockData.community.hotSpecies
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 overflow-hidden">
        <HeaderBar activeMode="trends" />
        <div className="pt-16 lg:pt-16 h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="abfi-title text-3xl font-bold mb-3">Fishing Trends</h1>
              <div className="animate-pulse text-slate-400">Loading live trends data...</div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="abfi-card abfi-glow">
                  <div className="animate-pulse">
                    <div className="h-4 bg-slate-700 rounded mb-3"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-800 rounded"></div>
                      <div className="h-3 bg-slate-800 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 overflow-hidden">
      <HeaderBar activeMode="trends" />

      <div className="pt-16 lg:pt-16 h-[calc(100vh-4rem)] lg:h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-4 md:p-6 max-w-7xl mx-auto">

          {/* Page Header */}
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
                <div className="text-2xl font-bold text-cyan-300">{displayData.weather.temp}°F</div>
                <div className="text-sm text-slate-400">Water Temp</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-300">{displayData.weather.wind}</div>
                <div className="text-sm text-slate-400">Wind</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-300">{displayData.weather.waves}</div>
                <div className="text-sm text-slate-400">Seas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-300">{displayData.weather.visibility}</div>
                <div className="text-sm text-slate-400">Visibility</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Primary Zone</span>
                <span className="text-cyan-300">{displayData.fishing.primaryDepth}</span>
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
            {displayData.tides.map((tide: any, i: number) => (
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
          
          {displayData.species.length > 0 ? (
            <div className="space-y-3">
              <div className="flex justify-between mb-3">
                <span className="text-slate-400">Prime Time</span>
                <span className="text-cyan-300 font-medium">{displayData.fishing.bestWindow}</span>
              </div>
              
              <div>
                <div className="text-sm text-slate-400 mb-3">Species Activity</div>
                <ul className="flex flex-wrap gap-2">
                  {displayData.species.map((s: any) => (
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
          
          {displayData.community.reportsToday > 0 ? (
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-slate-400 text-xs mb-1">Reports Today</div>
                <div className="text-cyan-100 text-lg font-bold">{displayData.community.reportsToday}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">Active Anglers</div>
                <div className="text-cyan-100 text-lg font-bold">{displayData.community.activeAnglers}</div>
              </div>
              <div>
                <div className="text-slate-400 text-xs mb-1">Hot Species</div>
                <div className="text-green-400 text-sm font-medium mt-2">{displayData.community.hotSpecies}</div>
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
      </div>
    </div>
  );
}
