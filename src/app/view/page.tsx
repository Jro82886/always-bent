'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ViewPage() {
  const router = useRouter();

  useEffect(() => {
    // Set all necessary data
    document.cookie = 'abfi_onboarded=1; path=/; max-age=2592000';
    localStorage.setItem('abfi_authenticated', 'true');
    localStorage.setItem('abfi_captain_name', 'Demo Captain');
    localStorage.setItem('abfi_boat_name', 'Demo Vessel');
    localStorage.setItem('abfi_selected_inlet', 'md-ocean-city');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-8">Always Bent Fishing Intelligence</h1>
        
        <div className="grid gap-6">
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-cyan-500/20">
            <h2 className="text-2xl font-semibold text-white mb-4">🎣 Welcome Demo Captain!</h2>
            <p className="text-gray-300 mb-4">
              Your app is deployed and working! The map features require a Mapbox token to be set in Vercel.
            </p>
            
            <div className="bg-slate-900 rounded p-4 mb-4">
              <h3 className="text-cyan-400 font-medium mb-2">Quick Setup:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-400">
                <li>Go to Vercel Dashboard → Settings → Environment Variables</li>
                <li>Add: NEXT_PUBLIC_MAPBOX_TOKEN</li>
                <li>Value: pk.eyJ1IjoiYWx3YXlzYmVudCIsImEiOiJjbTJqeWJhcGUwZnppMmtzNjJtcDN6bnFnIn0.U7aqDmXmN1gvk-0VcpHnog</li>
                <li>Save and redeploy</li>
              </ol>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-cyan-500/20">
            <h2 className="text-2xl font-semibold text-white mb-4">🚀 Available Features</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <FeatureCard title="Ocean Data" description="SST & Chlorophyll mapping" icon="🌡️" />
              <FeatureCard title="Vessel Tracking" description="Real-time fleet positions" icon="🚢" />
              <FeatureCard title="Analysis Tools" description="Hotspot detection & trends" icon="📊" />
              <FeatureCard title="Community Reports" description="Shared catch data" icon="👥" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-cyan-500/20">
            <h2 className="text-2xl font-semibold text-white mb-4">🔗 Navigation</h2>
            <div className="flex gap-4">
              <button
                onClick={() => router.push('/legendary/welcome')}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors"
              >
                Go to Welcome Screen
              </button>
              <button
                onClick={() => router.push('/legendary/community/reports')}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
              >
                View Community
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-slate-900 rounded-lg p-4">
      <div className="text-2xl mb-2">{icon}</div>
      <h3 className="text-white font-medium">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}
