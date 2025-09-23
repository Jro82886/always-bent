'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Compass, Ship, ChevronRight, CheckCircle, Sparkles } from 'lucide-react';

export default function FirstTimeSetup() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [captainName, setCaptainName] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Check if this is first visit with our simple auth
    const hasSeenSetup = localStorage.getItem('abfi_setup_complete');
    const captain = localStorage.getItem('abfi_captain_name');
    const boat = localStorage.getItem('abfi_boat_name');
    
    // Show setup if they have names but haven't seen setup yet
    if (!hasSeenSetup && captain && boat) {
      setCaptainName(captain);
      // Smooth fade in after a brief delay
      setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setFadeIn(true), 50);
      }, 500);
    }
  }, []);

  const transitionToStep = (nextStep: number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setStep(nextStep);
      setIsTransitioning(false);
    }, 300); // 300ms fade out/in transition
  };

  const requestLocation = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      
      if (permission.state === 'granted') {
        setLocationEnabled(true);
        // Smooth transition with success feedback
        setTimeout(() => transitionToStep(2), 500);
      } else {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationEnabled(true);
            // Smooth transition with success feedback
            setTimeout(() => transitionToStep(2), 500);
          },
          () => {
            // User denied, but let them continue
            setTimeout(() => transitionToStep(2), 300);
          }
        );
      }
    } catch {
      // Permissions API not supported, try directly
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationEnabled(true);
          setTimeout(() => transitionToStep(2), 500);
        },
        () => {
          setTimeout(() => transitionToStep(2), 300);
        }
      );
    }
  };

  const completeSetup = () => {
    setIsTransitioning(true);
    localStorage.setItem('abfi_setup_complete', 'true');
    
    // Smooth fade out before navigation
    setTimeout(() => {
      setFadeIn(false);
      setTimeout(() => {
        setIsVisible(false);
        router.push('/legendary/analysis');
      }, 300);
    }, 100);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-500 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full shadow-[0_0_100px_rgba(6,182,212,0.3)] transform transition-all duration-500 ${fadeIn ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        
        {step === 1 && (
          <div className={`text-center space-y-6 transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <Ship className="w-16 h-16 text-cyan-400 mx-auto animate-pulse" />
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome Aboard, {captainName || 'Captain'}!
              </h2>
              <p className="text-slate-400">
                Let's set up your Command Bridge
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 text-left space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
                <div>
                  <p className="text-white font-medium">Enable Location Services</p>
                  <p className="text-sm text-slate-400">Track your position and find nearby hotspots</p>
                </div>
              </div>
            </div>

            <button
              onClick={requestLocation}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium py-3 px-6 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Enable Location
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => transitionToStep(2)}
              className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 2 && (
          <div className={`text-center space-y-6 transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <Compass className={`w-16 h-16 text-cyan-400 mx-auto transition-transform duration-700 ${locationEnabled ? 'animate-spin-slow' : ''}`} />
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Location {locationEnabled ? 'Enabled!' : 'Setup Complete'}
              </h2>
              <p className="text-slate-400">
                {locationEnabled ? 'We can now show you nearby hotspots' : 'You can enable location later'}
              </p>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4 text-left space-y-3">
              <p className="text-cyan-400 font-medium">Would you like a quick tutorial?</p>
              <p className="text-sm text-slate-400">
                Learn how to use the Snip Tool, read vessel tracks, and find temperature breaks (2 minutes)
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => transitionToStep(3)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium py-3 px-6 rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/25"
              >
                <Sparkles className="w-4 h-4" />
                Yes, Show Me Around
                <ChevronRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={completeSetup}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200"
              >
                Skip - I'll Explore Myself
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className={`text-center space-y-6 transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
            <div className="relative">
              <Ship className="w-16 h-16 text-cyan-400 mx-auto animate-pulse" />
              <Sparkles className="w-8 h-8 text-yellow-400 absolute top-0 right-1/3 animate-pulse" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Starting Tutorial
              </h2>
              <p className="text-slate-400">
                We'll show you the key features
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-left">
              <p className="text-amber-400 font-medium mb-1">Beta Testing Week</p>
              <p className="text-sm text-amber-300/80">
                Use the feedback button to report any issues.
              </p>
            </div>

            <button
              onClick={() => {
                // Mark setup complete and start tutorial
                localStorage.setItem('abfi_setup_complete', 'true');
                localStorage.setItem('abfi_show_tutorial', 'true');
                setIsVisible(false);
                router.push('/legendary/analysis');
              }}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium py-3 px-6 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Begin Tutorial
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
