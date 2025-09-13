"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPhilosophicalQuote } from '@/lib/philosophy';
import { getRandomPhilosophicalQuote, getTimeOfDayQuote } from '@/lib/philosophyBank';
import { User, Anchor, MapPin, Globe, Shield, Waves } from 'lucide-react';

export default function WelcomePage() {
  const router = useRouter();
  const [captainName, setCaptainName] = useState('');
  const [boatName, setBoatName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [welcomeQuote, setWelcomeQuote] = useState('');
  const [quoteOpacity, setQuoteOpacity] = useState(1);
  const [locationChoice, setLocationChoice] = useState<boolean | null>(null);
  
  // Glowing animation for the logo
  const [glowIntensity, setGlowIntensity] = useState(0);
  
  useEffect(() => {
    // Set a random welcome quote on mount - use time-based for first quote
    const firstQuote = Math.random() > 0.5 ? getTimeOfDayQuote() : getRandomPhilosophicalQuote();
    setWelcomeQuote(firstQuote);
    
    // Keep track of shown quotes to avoid repeats
    const shownQuotes = new Set<string>([firstQuote]);
    
    // Glow animation
    const glowInterval = setInterval(() => {
      setGlowIntensity(prev => (prev + 1) % 100);
    }, 50);
    
    // Change quote every 8 seconds for users who are reading/thinking
    const quoteInterval = setInterval(() => {
      // Fade out
      setQuoteOpacity(0);
      
      // After fade out, change quote and fade in
      setTimeout(() => {
        // Get a new random quote from the full bank
        let newQuote = getRandomPhilosophicalQuote();
        
        // Avoid showing the same quote twice in this session
        let attempts = 0;
        while (shownQuotes.has(newQuote) && attempts < 10) {
          newQuote = getRandomPhilosophicalQuote();
          attempts++;
        }
        
        shownQuotes.add(newQuote);
        setWelcomeQuote(newQuote);
        setQuoteOpacity(1);
        
        // Reset shown quotes if we've shown too many (avoid memory bloat)
        if (shownQuotes.size > 50) {
          shownQuotes.clear();
          shownQuotes.add(newQuote);
        }
      }, 300);
    }, 8000);
    
    return () => {
      clearInterval(glowInterval);
      clearInterval(quoteInterval);
    };
  }, []);
  
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
    
    // Navigate to main app
    setTimeout(() => {
      router.push('/legendary');
    }, 1000);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-950 flex items-center justify-center p-4">
      {/* Ocean wave animation background with teal accents */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 to-transparent animate-pulse" />
        <div className="absolute top-20 left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="relative max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div 
            className="inline-block mb-4 relative"
            style={{
              filter: `drop-shadow(0 0 ${20 + glowIntensity / 5}px rgba(0, 255, 255, ${0.5 + glowIntensity / 200}))`
            }}
          >
            <div className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-400 bg-clip-text text-transparent">
              ALWAYS BENT
            </div>
          </div>
          <p className="text-lg tracking-wider bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text text-transparent">
            FISHING INTELLIGENCE
          </p>
          <p className="text-cyan-400/60 text-sm mt-2">
            Where Ocean Data Becomes Intuition
          </p>
        </div>
        
        {/* Inspirational Quote */}
        {welcomeQuote && (
          <div className="mb-6 px-8 py-4 bg-gradient-to-r from-black/30 via-teal-950/20 to-black/30 backdrop-blur-sm rounded-xl border border-teal-500/20 shadow-lg shadow-teal-500/10">
            <p 
              className="text-transparent bg-gradient-to-r from-teal-300 to-cyan-300 bg-clip-text italic text-center text-sm transition-opacity duration-300 font-medium"
              style={{ opacity: quoteOpacity }}
            >
              "{welcomeQuote}"
            </p>
          </div>
        )}
        
        {/* Main Card */}
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-cyan-500/30 p-8 shadow-2xl">
          {/* Captain Name Input */}
          <div className="mb-6">
            <label className="flex items-center gap-2.5 text-cyan-300 text-sm font-semibold mb-2">
              <div className="p-1.5 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-lg border border-teal-500/20">
                <User size={16} className="text-teal-400" />
              </div>
              <span className="tracking-wider uppercase">Your Name, Captain</span>
            </label>
            <input
              type="text"
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              placeholder="Captain name"
              className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/20 transition-all"
              maxLength={30}
            />
          </div>
          
          {/* Boat Name Input */}
          <div className="mb-6">
            <label className="flex items-center gap-2.5 text-cyan-300 text-sm font-semibold mb-2">
              <div className="p-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <Anchor size={16} className="text-cyan-400" />
              </div>
              <span className="tracking-wider uppercase">Your Vessel's Name</span>
            </label>
            <input
              type="text"
              value={boatName}
              onChange={(e) => setBoatName(e.target.value)}
              placeholder="Boat name"
              className="w-full px-4 py-3 bg-slate-900/50 border border-cyan-500/30 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
              maxLength={30}
            />
          </div>
          
          {/* Location Services Choice */}
          <div className="mb-8">
            <label className="flex items-center gap-2.5 text-cyan-300 text-sm font-semibold mb-3">
              <div className="p-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <MapPin size={16} className="text-cyan-400" />
              </div>
              <span className="tracking-wider uppercase">Enable Location Services?</span>
            </label>
            
            <div className="space-y-3">
              <button
                onClick={() => setLocationChoice(true)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  locationChoice === true 
                    ? 'bg-green-500/20 border-green-400 text-green-300' 
                    : 'bg-slate-900/30 border-slate-700 text-slate-300 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Globe size={20} className={locationChoice === true ? 'text-green-400' : 'text-slate-500'} />
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
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  locationChoice === false 
                    ? 'bg-blue-500/20 border-blue-400 text-blue-300' 
                    : 'bg-slate-900/30 border-slate-700 text-slate-300 hover:border-cyan-500/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Shield size={20} className={locationChoice === false ? 'text-blue-400' : 'text-slate-500'} />
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
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
              boatName.trim() && locationChoice !== null && !isLoading
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/30'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Waves size={20} className="animate-pulse text-white" />
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
        
        {/* Footer */}
        <div className="text-center mt-6 text-cyan-400/40 text-xs">
          By entering, you agree to share the stoke responsibly
        </div>
      </div>
    </div>
  );
}