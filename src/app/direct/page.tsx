'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function DirectAccessPage() {
  useEffect(() => {
    // Set all necessary data for demo access
    document.cookie = 'abfi_onboarded=1; path=/; max-age=2592000';
    localStorage.setItem('abfi_authenticated', 'true');
    localStorage.setItem('abfi_captain_name', 'Demo Captain');
    localStorage.setItem('abfi_boat_name', 'Demo Vessel');
    localStorage.setItem('abfi_selected_inlet', 'md-ocean-city');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2">ABFI Direct Access</h1>
        <p className="text-gray-400 mb-8">Click any mode to go directly there:</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Link 
            href="/legendary/analysis"
            className="block p-6 bg-slate-800/50 backdrop-blur rounded-lg border border-cyan-500/20 hover:border-cyan-500/50 transition-all"
          >
            <h2 className="text-2xl font-semibold text-cyan-400 mb-2">🗺️ Analysis Mode</h2>
            <p className="text-gray-300">Main map with SST/Chlorophyll layers, polygons, vessel tracking</p>
            <p className="text-sm text-gray-500 mt-2">Features: Ocean data, hotspot detection, layer toggles</p>
          </Link>

          <Link 
            href="/legendary/tracking"
            className="block p-6 bg-slate-800/50 backdrop-blur rounded-lg border border-cyan-500/20 hover:border-cyan-500/50 transition-all"
          >
            <h2 className="text-2xl font-semibold text-cyan-400 mb-2">🚢 Tracking Mode</h2>
            <p className="text-gray-300">Real-time vessel positions and fleet tracking</p>
            <p className="text-sm text-gray-500 mt-2">Features: Live positions, vessel filters, track history</p>
          </Link>

          <Link 
            href="/legendary/community/reports"
            className="block p-6 bg-slate-800/50 backdrop-blur rounded-lg border border-cyan-500/20 hover:border-cyan-500/50 transition-all"
          >
            <h2 className="text-2xl font-semibold text-cyan-400 mb-2">👥 Community Mode</h2>
            <p className="text-gray-300">Shared catch reports and community insights</p>
            <p className="text-sm text-gray-500 mt-2">Features: Bite reports, catch data, social features</p>
          </Link>

          <Link 
            href="/legendary/trends"
            className="block p-6 bg-slate-800/50 backdrop-blur rounded-lg border border-cyan-500/20 hover:border-cyan-500/50 transition-all"
          >
            <h2 className="text-2xl font-semibold text-cyan-400 mb-2">📊 Trends Mode</h2>
            <p className="text-gray-300">Historical data and fishing patterns</p>
            <p className="text-sm text-gray-500 mt-2">Features: Analytics, seasonal patterns, predictions</p>
          </Link>
        </div>

        <div className="mt-8 p-6 bg-amber-900/20 border border-amber-600/30 rounded-lg">
          <h3 className="text-amber-400 font-semibold mb-2">🔍 Check These Features:</h3>
          <ul className="space-y-2 text-gray-300">
            <li>✓ <strong>Polygons Panel</strong> - Toggle SST fronts, chlorophyll edges, eddies</li>
            <li>✓ <strong>Layer Toggles</strong> - SST/CHL buttons in top toolbar</li>
            <li>✓ <strong>Inlet Selection</strong> - Dropdown to change locations</li>
            <li>✓ <strong>Date Picker</strong> - Select different dates for ocean data</li>
            <li>✓ <strong>Vessel Tracking</strong> - See fleet positions on map</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-500 text-sm">
            Note: Mapbox token must be set in Vercel for maps to load.
            <br />
            Current status: {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? '✅ Token Set' : '❌ Token Missing'}
          </p>
        </div>
      </div>
    </div>
  );
}
