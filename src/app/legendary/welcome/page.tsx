'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Anchor, Compass, Fish, Map, Users, TrendingUp, ChevronRight, Waves } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: <Compass className="w-8 h-8" />,
      title: "Analysis Mode",
      description: "Real-time ocean conditions, SST, chlorophyll, and fishing intelligence",
      action: () => router.push('/legendary?mode=analysis'),
      color: "from-cyan-500 to-blue-500"
    },
    {
      icon: <Map className="w-8 h-8" />,
      title: "Tracking Mode",
      description: "Fleet tracking, vessel monitoring, and navigation tools",
      action: () => router.push('/legendary?mode=tracking'),
      color: "from-emerald-500 to-teal-500"
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Mode",
      description: "Share reports, connect with captains, and view fleet activity",
      action: () => router.push('/legendary?mode=community'),
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Trends Mode",
      description: "Historical patterns, seasonal analysis, and predictive insights",
      action: () => router.push('/legendary?mode=trends'),
      color: "from-orange-500 to-red-500"
    }
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 opacity-50" />
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-cyan-500/30">
              <Anchor className="w-16 h-16 text-cyan-400" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Welcome to ABFI Platform
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Your complete fishing intelligence system. Choose a mode to begin exploring real-time ocean data, 
            tracking tools, and community insights.
          </p>

          <div className="flex items-center justify-center gap-2 mt-6 text-cyan-400">
            <Waves className="w-5 h-5" />
            <span className="text-sm font-medium">Powered by Always Bent Fishing Intelligence</span>
            <Fish className="w-5 h-5" />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <button
              key={index}
              onClick={feature.action}
              className="group relative overflow-hidden rounded-2xl bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 p-8 hover:border-cyan-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="relative z-10">
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                
                <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-gray-400 mb-4">
                  {feature.description}
                </p>
                
                <div className="flex items-center text-cyan-400 font-medium">
                  <span>Enter Mode</span>
                  <ChevronRight className="w-5 h-5 ml-1 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Start */}
        <div className="text-center">
          <p className="text-gray-500 mb-4">New to ABFI?</p>
          <button
            onClick={() => router.push('/legendary?mode=analysis')}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-bold text-white hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
          >
            Start with Analysis Mode
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-16 pt-8 border-t border-slate-800">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>All Systems Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Real-time Data Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Fleet Tracking Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
