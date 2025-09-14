"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Anchor, MapPin, Globe, Shield, Waves } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const [captainName, setCaptainName] = useState('');
  const [boatName, setBoatName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [locationChoice, setLocationChoice] = useState<boolean | null>(null);
  
  const handleEnterApp = async () => {
    if (!captainName.trim()) {
      alert('We need your name, Captain!');
      return;
    }
    
    if (!boatName.trim()) {
      alert('What\'s your vessel\'s name?');
      return;
    }
    
    if (locationChoice === null) {
      alert('Please choose whether to enable location services');
      return;
    }
    
    setIsLoading(true);
    
    // Store user preferences
    localStorage.setItem('abfi_captain_name', captainName);
    localStorage.setItem('abfi_boat_name', boatName);
    localStorage.setItem('abfi_username', captainName); // For backwards compatibility
    localStorage.setItem('abfi_location_enabled', locationChoice.toString());
    
    // If location enabled, request permission
    if (locationChoice) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'prompt' || permission.state === 'granted') {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              console.log('📍 Location acquired:', position.coords);
              localStorage.setItem('abfi_last_location', JSON.stringify({
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }));
            },
            (error) => {
              console.warn('📍 Location denied:', error);
            }
          );
        }
      } catch (error) {
        console.warn('Location permission check failed:', error);
      }
    }
    
    // Quick navigation to main app
    setTimeout(() => {
      router.push('/legendary');
    }, 300); // Much faster transition
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black flex items-center justify-center p-4">
      {/* Subtle ocean background - static, no animation */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 via-transparent to-transparent" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4 relative">
            <div className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-400 bg-clip-text text-transparent relative">
              ALWAYS BENT
            </div>
          </div>
          <p className="text-lg tracking-wider bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
            FISHING INTELLIGENCE
          </p>
          <p className="text-sm mt-2 bg-gradient-to-r from-cyan-400/60 to-teal-400/60 bg-clip-text text-transparent">
            Where Ocean Data Becomes Intuition
          </p>
        </div>
        
        {/* Main Card - grounded like analysis page */}
        <div className="relative">
          {/* Subtle glow behind card */}
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-2xl blur-xl" />
          <div className="relative bg-black/60 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-8 shadow-2xl">
          {/* Captain Name Input */}
          <div className="mb-6">
            <label className="flex items-center gap-2.5 text-sm font-semibold mb-2">
              <div className="p-1.5 bg-gradient-to-br from-cyan-500/30 to-teal-500/30 rounded-lg border border-cyan-400/50 shadow-lg shadow-cyan-500/30">
                <User size={16} className="text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              </div>
              <span className="tracking-wider uppercase bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">Your Name, Captain</span>
            </label>
            <input
              type="text"
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              placeholder="Captain name"
              className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
              maxLength={30}
            />
          </div>
          
          {/* Boat Name Input */}
          <div className="mb-6">
            <label className="flex items-center gap-2.5 text-sm font-semibold mb-2">
              <div className="p-1.5 bg-gradient-to-br from-emerald-500/30 to-teal-500/30 rounded-lg border border-emerald-400/50 shadow-lg shadow-emerald-500/30">
                <Anchor size={16} className="text-emerald-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </div>
              <span className="tracking-wider uppercase bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">Your Vessel's Name</span>
            </label>
            <input
              type="text"
              value={boatName}
              onChange={(e) => setBoatName(e.target.value)}
              placeholder="Boat name"
              className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
              maxLength={30}
            />
          </div>
          
          {/* Location Services Choice */}
          <div className="mb-8">
            <label className="flex items-center gap-2.5 text-sm font-semibold mb-3">
              <div className="p-1.5 bg-gradient-to-br from-orange-500/30 to-amber-500/30 rounded-lg border border-orange-400/50 shadow-lg shadow-orange-500/30">
                <MapPin size={16} className="text-orange-300 drop-shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
              </div>
              <span className="tracking-wider uppercase bg-gradient-to-r from-cyan-300 to-teal-300 bg-clip-text text-transparent">Enable Location Services?</span>
            </label>
            
            <div className="space-y-3">
              <button
                onClick={() => setLocationChoice(true)}
                className={`w-full p-4 rounded-2xl border-2 transition-all ${
                  locationChoice === true 
                    ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border-teal-400 text-teal-300' 
                    : 'bg-slate-900/30 border-slate-700 text-slate-300 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe size={20} className={locationChoice === true ? 'text-teal-300 drop-shadow-[0_0_8px_rgba(94,234,212,0.8)]' : 'text-slate-500'} />
                  <div className="text-left flex-1">
                    <div className="font-semibold mb-1">YES - Join ABFI Community</div>
                    <div className="text-xs opacity-80">
                      Share location • See other boats • Save analyses • Full access
                    </div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setLocationChoice(false)}
                className={`w-full p-4 rounded-2xl border-2 transition-all ${
                  locationChoice === false 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400 text-cyan-300' 
                    : 'bg-slate-900/30 border-slate-700 text-slate-300 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield size={20} className={locationChoice === false ? 'text-cyan-400' : 'text-slate-500'} />
                  <div className="text-left flex-1">
                    <div className="font-semibold mb-1">NO - Private Mode</div>
                    <div className="text-xs opacity-80">
                      Browse layers • Use tools • Chat only • No tracking
                    </div>
                  </div>
                </div>
              </button>
            </div>
            
            <p className="text-cyan-400/60 text-xs mt-3 text-center">
              Share your location to see other boats from your inlet<br/>
              and contribute to community intelligence
            </p>
          </div>
          
          {/* Enter Button */}
          <button
            onClick={handleEnterApp}
            disabled={!boatName.trim() || locationChoice === null || isLoading}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              boatName.trim() && locationChoice !== null && !isLoading
                ? locationChoice === true 
                  ? 'bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border-2 border-teal-400 text-teal-300 hover:from-teal-500/30 hover:to-cyan-500/30 shadow-lg shadow-teal-500/20'
                  : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400 text-cyan-300 hover:from-cyan-500/30 hover:to-blue-500/30 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Waves size={20} className="text-white animate-pulse" />
                <span>Analyzing Ocean Data...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Enter ABFI Platform</span>
                <Waves size={18} className="text-white/80" />
              </span>
            )}
          </button>
          </div>
        </div>
        
        {/* Footer with gradient text */}
        <div className="text-center mt-6">
          <p className="text-xs bg-gradient-to-r from-cyan-400/40 to-teal-400/40 bg-clip-text text-transparent">
            By entering, you agree to share the stoke responsibly
          </p>
        </div>
      </div>
    </div>
  );
}