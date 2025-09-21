'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StatusPage() {
  const [status, setStatus] = useState<Record<string, any>>({});
  
  useEffect(() => {
    // Set auth cookies
    document.cookie = 'abfi_onboarded=1; path=/; max-age=2592000';
    localStorage.setItem('abfi_authenticated', 'true');
    
    // Check environment
    const envStatus = {
      mapbox: process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? '✅ Set' : '❌ Missing',
      supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      polygons: process.env.NEXT_PUBLIC_POLYGONS_URL || 'Not configured',
    };
    setStatus(envStatus);
  }, []);

  const modes = [
    {
      name: 'Analysis',
      path: '/legendary/analysis',
      description: 'Map with SST/CHL layers, vessel tracking, polygon detection',
      features: ['Mapbox map', 'SST toggle', 'CHL toggle', 'Polygon panel', 'Date picker'],
      color: 'cyan'
    },
    {
      name: 'Tracking',
      path: '/legendary/tracking',
      description: 'Real-time vessel positions and fleet management',
      features: ['Vessel map', 'Fleet list', 'Position updates', 'Track history'],
      color: 'blue'
    },
    {
      name: 'Community',
      path: '/legendary/community/reports',
      description: 'Shared catch reports and community data',
      features: ['Report feed', 'Catch data', 'Social features', 'Leaderboards'],
      color: 'purple'
    },
    {
      name: 'Trends',
      path: '/legendary/trends',
      description: 'Historical patterns and fishing analytics',
      features: ['Data charts', 'Seasonal patterns', 'Bite predictions', 'Statistics'],
      color: 'green'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-8">ABFI System Status</h1>
        
        {/* Environment Status */}
        <div className="bg-slate-900 rounded-lg p-6 mb-8 border border-slate-700">
          <h2 className="text-2xl font-semibold text-white mb-4">Environment Status</h2>
          <div className="space-y-2">
            <p className="text-gray-300">Mapbox Token: <span className="font-mono">{status.mapbox}</span></p>
            <p className="text-gray-300">Supabase URL: <span className="font-mono">{status.supabase}</span></p>
            <p className="text-gray-300">Polygon Backend: <span className="font-mono text-yellow-400">{status.polygons}</span></p>
          </div>
        </div>

        {/* Mode Status Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {modes.map((mode) => (
            <div key={mode.name} className="bg-slate-900 rounded-lg p-6 border border-slate-700 hover:border-cyan-500/50 transition-all">
              <div className="flex justify-between items-start mb-4">
                <h3 className={`text-2xl font-bold text-${mode.color}-400`}>{mode.name} Mode</h3>
                <Link 
                  href={mode.path}
                  className={`px-4 py-2 bg-${mode.color}-600 hover:bg-${mode.color}-700 text-white rounded-lg font-medium transition-colors`}
                >
                  Open →
                </Link>
              </div>
              
              <p className="text-gray-400 mb-4">{mode.description}</p>
              
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-300">Features:</p>
                <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
                  {mode.features.map((feature, i) => (
                    <li key={i}>{feature}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <p className="text-xs text-gray-500">
                  Path: <code className="bg-slate-800 px-2 py-1 rounded">{mode.path}</code>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Test Instructions */}
        <div className="mt-8 bg-amber-900/20 border border-amber-600/30 rounded-lg p-6">
          <h3 className="text-amber-400 font-semibold mb-3">🧪 Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Click each mode's "Open →" button to test</li>
            <li>In Analysis: Check if map loads, try SST/CHL toggles</li>
            <li>In Tracking: Look for vessel icons on map</li>
            <li>In Community: Check if reports page loads</li>
            <li>In Trends: Verify charts/data display</li>
          </ol>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4 justify-center">
          <Link 
            href="/check"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
          >
            Check Env Vars
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
}

