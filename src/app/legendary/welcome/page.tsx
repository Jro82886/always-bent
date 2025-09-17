'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/store/appState';
import { getCurrentUser, getProfile } from '@/lib/supabase/client';
import { Anchor, MapPin, Users, Activity, TrendingUp, Compass } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const { setUsername } = useAppState();
  
  const [captainName, setCaptainName] = useState('');
  const [boatName, setBoatName] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const user = await getCurrentUser();
      if (user) {
        const profile = await getProfile(user.id);
        if (profile) {
          setCaptainName(profile.captain_name);
          setBoatName(profile.boat_name);
          setIsLoggedIn(true);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedCaptain = captainName.trim();
    const trimmedBoat = boatName.trim();
    
    if (!trimmedCaptain || !trimmedBoat) return;
    
    // Save user preferences
    localStorage.setItem('abfi_captain_name', trimmedCaptain);
    localStorage.setItem('abfi_boat_name', trimmedBoat);
    localStorage.setItem('abfi_username', trimmedCaptain); // For compatibility
    localStorage.setItem('abfi_location_enabled', locationEnabled.toString());
    localStorage.setItem('abfi_water_only_tracking', 'true'); // Always true - water only
    
    // Set username in app state
    setUsername(trimmedCaptain);
    
    // Request location permission if enabled
    if (locationEnabled) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'prompt' || permission.state === 'granted') {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              
              localStorage.setItem('abfi_location_permission', 'granted');
            },
            (error) => {
              
              localStorage.setItem('abfi_location_permission', 'denied');
            }
          );
        }
      } catch (err) {
        
      }
    }
    
    // Navigate to analysis mode (main app)
    router.push('/legendary?mode=analysis');
  };

  // Show dashboard for logged-in users
  if (isLoggedIn && !loading) {
    return (
      <div className="w-full min-h-screen overflow-y-auto overflow-x-hidden bg-black">
        {/* Background effects */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        </div>
        
        <div className="relative z-10 w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Welcome Header */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 mb-6 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                    Welcome Back, Captain {captainName}!
                  </h1>
                  <p className="text-cyan-300/80 mt-2 flex items-center gap-2">
                    <Anchor className="w-4 h-4" />
                    {boatName} • Command Bridge Active
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-green-400 text-sm flex items-center gap-2 justify-end">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Online
                  </div>
                </div>
              </div>
              
              {/* Quick Launch Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <button
                  onClick={() => router.push('/legendary?mode=analysis')}
                  className="p-4 bg-slate-800/50 hover:bg-slate-800/70 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg transition-all group"
                >
                  <Compass className="w-8 h-8 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-white font-medium">Analysis Mode</div>
                  <div className="text-xs text-slate-400">Ocean intelligence</div>
                </button>
                
                <button
                  onClick={() => router.push('/legendary?mode=tracking')}
                  className="p-4 bg-slate-800/50 hover:bg-slate-800/70 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg transition-all group"
                >
                  <MapPin className="w-8 h-8 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-white font-medium">Tracking</div>
                  <div className="text-xs text-slate-400">Fleet positions</div>
                </button>
                
                <button
                  onClick={() => router.push('/legendary?mode=community')}
                  className="p-4 bg-slate-800/50 hover:bg-slate-800/70 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg transition-all group"
                >
                  <Users className="w-8 h-8 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-white font-medium">Community</div>
                  <div className="text-xs text-slate-400">Live reports</div>
                </button>
                
                <button
                  onClick={() => router.push('/legendary?mode=trends')}
                  className="p-4 bg-slate-800/50 hover:bg-slate-800/70 border border-cyan-500/20 hover:border-cyan-500/40 rounded-lg transition-all group"
                >
                  <TrendingUp className="w-8 h-8 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-white font-medium">Trends</div>
                  <div className="text-xs text-slate-400">Patterns & insights</div>
                </button>
                
                <button
                  onClick={() => router.push('/legendary?mode=analysis')}
                  className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 rounded-lg transition-all group col-span-2"
                >
                  <Activity className="w-8 h-8 text-cyan-300 mb-2 group-hover:scale-110 transition-transform inline-block" />
                  <div className="text-white font-medium">Start Fishing Session</div>
                  <div className="text-xs text-cyan-300/80">Begin with current conditions</div>
                </button>
              </div>
            </div>
            
            {/* Live Activity Feed */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Who's Fishing Now</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-white">Captain Mike</span>
                    <span className="text-slate-400 text-sm">• Sea Hawk</span>
                  </div>
                  <span className="text-cyan-400 text-sm">Ocean City</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-white">Captain Sarah</span>
                    <span className="text-slate-400 text-sm">• Blue Runner</span>
                  </div>
                  <span className="text-cyan-400 text-sm">Montauk</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Show signup form for non-logged-in users
  return (
    <div className="w-full min-h-screen overflow-y-auto overflow-x-hidden bg-black">
      {/* Glowing background effect - fixed position */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[800px] h-[400px] sm:h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-blue-500/5 rounded-full blur-2xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-cyan-400/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 w-full px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-6 sm:p-8 md:p-12 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            
            {/* Header - responsive sizing */}
            <div className="text-center mb-6 sm:mb-10">
              <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2 sm:mb-3">
                ABFI
              </h1>
              <p className="text-base sm:text-lg text-cyan-300/80">Always Bent Fishing Intelligence</p>
              <div className="mt-2 h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Captain Name */}
              <div>
                <label htmlFor="captainName" className="block text-sm font-medium text-cyan-300 mb-2">
                  Captain Name
                </label>
                <input
                  type="text"
                  id="captainName"
                  value={captainName}
                  onChange={(e) => setCaptainName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  required
                />
              </div>
              
              {/* Boat Name */}
              <div>
                <label htmlFor="boatName" className="block text-sm font-medium text-cyan-300 mb-2">
                  Boat Name
                </label>
                <input
                  type="text"
                  id="boatName"
                  value={boatName}
                  onChange={(e) => setBoatName(e.target.value)}
                  placeholder="Enter your boat name"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  required
                />
              </div>
              
              {/* Location Services */}
              <div className="bg-slate-800/30 rounded-lg p-4 border border-cyan-500/10">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={locationEnabled}
                    onChange={(e) => setLocationEnabled(e.target.checked)}
                    className="mt-1 w-5 h-5 bg-slate-700 border-cyan-500/30 rounded focus:ring-cyan-500/50 focus:ring-2 text-cyan-500"
                  />
                  <div className="flex-1">
                    <span className="block text-cyan-300 font-medium mb-1">
                      Enable Location Services
                    </span>
                    <span className="block text-xs text-slate-400">
                      Share your location to access fleet tracking and see other vessels. 
                      Location sharing is required to view the tracking page.
                    </span>
                    <span className="block text-xs text-cyan-400/80 mt-2 font-medium">
                      Water-only tracking: Your location is only tracked when on water, never on land.
                    </span>
                  </div>
                </label>
              </div>
              
              {/* Access Info */}
              <div className="bg-slate-800/20 rounded-lg p-4 space-y-2 text-sm">
                <div className="text-cyan-300 font-medium mb-2">Your Access:</div>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                  <span className="text-slate-300">Analysis Mode - Ocean intelligence & SST/CHL layers</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-4 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)] ${locationEnabled ? 'bg-gradient-to-b from-cyan-400 to-cyan-600' : 'bg-gradient-to-b from-slate-500 to-slate-700'}`} />
                  <span className={locationEnabled ? 'text-slate-300' : 'text-slate-500'}>
                    Tracking Mode - {locationEnabled ? 'Full access with location sharing' : 'Disabled without location services'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                  <span className="text-slate-300">Community - Connect with other captains</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-cyan-600 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                  <span className="text-slate-300">Trends - Fishing patterns & insights</span>
                </div>
              </div>
              
              {/* Terms */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 bg-slate-700 border-cyan-500/30 rounded focus:ring-cyan-500/50 focus:ring-2 text-cyan-500"
                    required
                  />
                  <span className="text-xs text-slate-400">
                    I understand that ABFI tracks vessel locations for fishing intelligence purposes only. 
                    Location data is never tracked on land and is only used to improve the fishing experience.
                  </span>
                </label>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={!agreedToTerms}
                className={`
                  w-full py-4 px-6 font-semibold rounded-lg shadow-lg transition-all duration-300
                  ${agreedToTerms 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 transform hover:scale-[1.02] shadow-[0_10px_40px_rgba(6,182,212,0.3)]' 
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }
                `}
              >
                Launch ABFI Platform
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}