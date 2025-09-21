'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberstack } from '@/lib/memberstack/MemberstackProvider';
import { Anchor, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function AuthPage() {
  const router = useRouter();
  const { member, loading, openModal } = useMemberstack();

  useEffect(() => {
    // If already authenticated, redirect to app
    if (!loading && member) {
      // Check if profile is complete
      const { captainName, boatName } = member.customFields || {};
      
      if (captainName && boatName) {
        router.push('/legendary');
      } else {
        router.push('/legendary/welcome');
      }
    }
  }, [member, loading, router]);

  const handleLaunchApp = () => {
    if (member) {
      // Already logged in - go to app
      router.push('/legendary');
    } else {
      // Open Memberstack signup modal
      openModal('signup');
    }
  };

  const handleLogin = () => {
    openModal('login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/4 right-1/4 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <div className="p-6 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-cyan-500/30">
              <Image 
                src="/brand/abfi-logo.svg" 
                alt="ABFI" 
                width={120} 
                height={120} 
                className="drop-shadow-[0_0_30px_rgba(6,182,212,0.8)]" 
              />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Always Bent
            </span>
            <br />
            <span className="text-3xl md:text-4xl text-slate-300">
              Fishing Intelligence
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto">
            Real-time ocean data, vessel tracking, and fishing intelligence 
            for serious offshore anglers
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleLaunchApp}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2"
            >
              <Anchor className="w-5 h-5" />
              Launch App
            </button>

            <button
              onClick={handleLogin}
              className="px-8 py-4 bg-slate-800 text-cyan-400 font-medium text-lg rounded-lg hover:bg-slate-700 transition-all border border-cyan-500/30 hover:border-cyan-500/50"
            >
              Sign In
            </button>
          </div>

          {/* Features Grid */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-slate-900/50 backdrop-blur rounded-xl border border-cyan-500/20">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🌊</span>
              </div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-2">Ocean Intelligence</h3>
              <p className="text-slate-400">Real-time SST, chlorophyll, and current data to find the bite</p>
            </div>

            <div className="p-6 bg-slate-900/50 backdrop-blur rounded-xl border border-cyan-500/20">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🚢</span>
              </div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-2">Vessel Tracking</h3>
              <p className="text-slate-400">See where the fleet is fishing with real-time AIS data</p>
            </div>

            <div className="p-6 bg-slate-900/50 backdrop-blur rounded-xl border border-cyan-500/20">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <span className="text-2xl">🎣</span>
              </div>
              <h3 className="text-xl font-semibold text-cyan-300 mb-2">Bite Reports</h3>
              <p className="text-slate-400">Share and track catches with your trusted crew</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
