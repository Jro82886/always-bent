'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Compass, Ship, ChevronRight, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/supabase/AuthProvider';

export default function FirstTimeSetup() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if this is first visit
    const hasSeenSetup = localStorage.getItem('abfi_setup_complete');
    if (!hasSeenSetup && user) {
      setIsVisible(true);
    }
  }, [user]);

  const requestLocation = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      
      if (permission.state === 'granted') {
        setLocationEnabled(true);
        setStep(2);
      } else {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationEnabled(true);
            setStep(2);
          },
          () => {
            // User denied, but let them continue
            setStep(2);
          }
        );
      }
    } catch {
      // Permissions API not supported, try directly
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationEnabled(true);
          setStep(2);
        },
        () => {
          setStep(2);
        }
      );
    }
  };

  const completeSetup = () => {
    localStorage.setItem('abfi_setup_complete', 'true');
    setIsVisible(false);
    // Go to analysis mode
    router.push('/legendary?mode=analysis');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-8 max-w-md w-full shadow-[0_0_100px_rgba(6,182,212,0.3)]">
        
        {step === 1 && (
          <div className="text-center space-y-6">
            <Ship className="w-16 h-16 text-cyan-400 mx-auto animate-pulse" />
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome Aboard, {profile?.captain_name || 'Captain'}!
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
              onClick={() => setStep(2)}
              className="text-sm text-slate-500 hover:text-slate-400 transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="text-center space-y-6">
            <Compass className="w-16 h-16 text-cyan-400 mx-auto" />
            
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                You're All Set!
              </h2>
              <p className="text-slate-400">
                {locationEnabled ? 'Location services enabled' : 'You can enable location later in settings'}
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-left">
              <p className="text-amber-400 font-medium mb-1">🚧 Beta Testing Week</p>
              <p className="text-sm text-amber-300/80">
                We're testing new features. Please use the feedback button to report any issues.
              </p>
            </div>

            <div className="space-y-3 text-left">
              <h3 className="text-cyan-400 font-medium">Quick Start:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span><strong>Analysis:</strong> View SST, chlorophyll, and hotspots</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span><strong>Tracking:</strong> Share your location with the fleet</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span><strong>Community:</strong> Read fishing reports</span>
                </div>
              </div>
            </div>

            <button
              onClick={completeSetup}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-medium py-3 px-6 rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Enter Command Bridge
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
