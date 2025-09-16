'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/store/appState';

export default function WelcomePage() {
  const router = useRouter();
  const { setUsername } = useAppState();
  
  const [captainName, setCaptainName] = useState('');
  const [boatName, setBoatName] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
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
              console.log('Location access granted');
              localStorage.setItem('abfi_location_permission', 'granted');
            },
            (error) => {
              console.log('Location access denied');
              localStorage.setItem('abfi_location_permission', 'denied');
            }
          );
        }
      } catch (err) {
        console.log('Location permission check failed');
      }
    }
    
    // Navigate to analysis mode (main app)
    router.push('/legendary?mode=analysis');
  };

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      {/* Glowing background effect */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-2xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-cyan-400/5 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 w-full h-full flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 md:p-12 shadow-[0_0_50px_rgba(6,182,212,0.3)]">
            
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-3">
                ABFI
              </h1>
              <p className="text-lg text-cyan-300/80">Always Bent Fishing Intelligence</p>
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