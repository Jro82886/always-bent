'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ship, User, MapPin, Loader2, ChevronRight, Waves, Fish } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
// Removed old auth - external developer handling this now
// import { saveUserProfile, upsertProfileDirect } from '@/lib/supabase/profiles';

export default function LegendaryWelcomePage() {
  const router = useRouter();
  
  const [captainName, setCaptainName] = useState('');
  const [boatName, setBoatName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [step, setStep] = useState(1); // 1: captain/boat, 2: location permission
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  
  useEffect(() => {
    checkAuth();
  }, []);
  
  const checkAuth = async () => {
    // Check if user already has details in localStorage
    const existingCaptain = localStorage.getItem('abfi_captain_name');
    const existingBoat = localStorage.getItem('abfi_boat_name');
    const existingUserId = localStorage.getItem('abfi_user_id');
    
    if (existingCaptain && existingBoat && existingUserId) {
      // Profile exists - show it for confirmation
      setCaptainName(existingCaptain);
      setBoatName(existingBoat);
      setUserId(existingUserId);
      setIsReturningUser(true);
    } else {
      // Generate a new user ID if needed
      const newUserId = existingUserId || `user-${Date.now()}`;
      setUserId(newUserId);
      if (!existingUserId) {
        localStorage.setItem('abfi_user_id', newUserId);
      }
    }
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captainName.trim() || !boatName.trim()) {
      setError('Please enter both Captain Name and Boat Name');
      return;
    }
    
    if (!userId) {
      setError('Authentication required. Please log in again.');
      // Skip auth check - user can proceed
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // External developer handling auth - just use localStorage for now
      localStorage.setItem('abfi_captain_name', captainName.trim());
      localStorage.setItem('abfi_boat_name', boatName.trim());
      localStorage.setItem('abfi_user_id', userId || `local-${Date.now()}`);
      
      // Move to location permission step
      setStep(2);
      setLoading(false);
    } catch (error: any) {
      
      // Still proceed even if localStorage fails
      setStep(2);
      setLoading(false);
    }
  };
  
  const requestLocation = async () => {
    setLoading(true);
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      
      if (permission.state === 'granted') {
        setLocationEnabled(true);
        completeOnboarding();
      } else {
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationEnabled(true);
            completeOnboarding();
          },
          () => {
            // User denied, but let them continue
            completeOnboarding();
          }
        );
      }
    } catch {
      // Permissions API not supported, try directly
      navigator.geolocation.getCurrentPosition(
        () => {
          setLocationEnabled(true);
          completeOnboarding();
        },
        () => {
          completeOnboarding();
        }
      );
    }
  };
  
  const completeOnboarding = () => {
    // Mark setup as complete
    localStorage.setItem('abfi_setup_complete', 'true');
    localStorage.setItem('abfi_location_setup', 'true');
    
    // Set flag to show tutorial on analysis page
    localStorage.setItem('abfi_show_tutorial', 'true');
    
    // Navigate to command bridge (analysis mode)
    setTimeout(() => {
      router.replace('/legendary?mode=analysis');
    }, 500);
  };
  
  const skipLocation = () => {
    completeOnboarding();
  };
  
  // Step 1: Captain and Boat Name
  if (step === 1) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        {/* Animated ocean background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 opacity-50" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl backdrop-blur-sm border border-cyan-500/30">
                  <Image src="/brand/globe.svg" alt="ABFI" width={48} height={48} className="drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                {isReturningUser ? 'Welcome Back, Captain!' : 'Welcome Aboard, Captain!'}
              </h1>
              <p className="text-slate-400 mt-2">
                {isReturningUser ? 'Confirm your details or make changes' : 'Let\'s set up your command bridge'}
              </p>
              {userEmail && (
                <p className="text-xs text-slate-500 mt-2">Signed in as {userEmail}</p>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Show returning user notice */}
            {isReturningUser && (
              <div className="mb-6 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-cyan-400 text-sm flex items-center gap-2">
                  <span>✓</span> Your profile was found. Review your details below:
                </p>
              </div>
            )}

            {/* Profile Form */}
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label htmlFor="captain" className="block text-sm font-medium text-cyan-300 mb-2">
                  <User className="inline w-4 h-4 mr-1" />
                  Captain Name
                </label>
                <input
                  type="text"
                  id="captain"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  placeholder="Captain Mike"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="boat" className="block text-sm font-medium text-cyan-300 mb-2">
                  <Ship className="inline w-4 h-4 mr-1" />
                  Boat Name
                </label>
                <input
                  type="text"
                  id="boat"
                  value={boatName}
                  onChange={(e) => setBoatName(e.target.value)}
                  placeholder="Reel Deal"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg rounded-lg hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    {isReturningUser ? 'Confirm & Continue' : 'Continue'}
                    <ChevronRight className="w-5 h-5" />
                  </span>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-center gap-2 text-cyan-400">
                <Waves className="w-4 h-4" />
                <span className="text-xs font-medium">Always Bent Fishing Intelligence</span>
                <Fish className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Step 2: Location Permission
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      {/* Animated ocean background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-950 opacity-50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl backdrop-blur-sm border border-cyan-500/30">
                <MapPin className="w-12 h-12 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Enable Location Services
            </h1>
            <p className="text-slate-400 mt-2">
              Welcome aboard, Captain {captainName}!
            </p>
            <p className="text-slate-500 text-sm mt-4">
              Location helps us show real-time conditions, track your vessel, and provide accurate fishing intelligence
            </p>
          </div>

          {/* Location Status */}
          {locationEnabled && (
            <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location services enabled successfully!
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <button
              onClick={requestLocation}
              disabled={loading || locationEnabled}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold text-lg rounded-lg hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Requesting Permission...
                </span>
              ) : locationEnabled ? (
                <span className="flex items-center justify-center gap-2">
                  Entering Command Bridge
                  <ChevronRight className="w-5 h-5" />
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Enable Location Services
                </span>
              )}
            </button>

            {!locationEnabled && (
              <button
                onClick={skipLocation}
                className="w-full py-3 text-slate-400 hover:text-slate-300 text-sm transition-colors"
              >
                Skip for now
              </button>
            )}
          </div>

          {/* Benefits */}
          <div className="mt-8 space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
              <span className="text-slate-400">Real-time ocean conditions at your location</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
              <span className="text-slate-400">Automatic vessel tracking and trip logs</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
              <span className="text-slate-400">Location-based fishing reports and intel</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <p className="text-xs text-center text-slate-500">
              Your location data is encrypted and never shared
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}