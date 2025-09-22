'use client';

import { useState, useEffect } from 'react';
import { Wind, Anchor, Users, Ship, Navigation, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { flags } from '@/lib/flags';

interface TrackingToolbarProps {
  selectedInletId: string | null;
  locationGranted: boolean;
  showYou: boolean;
  setShowYou: (show: boolean) => void;
  showTracks: boolean;
  setShowTracks: (show: boolean) => void;
  showFleet: boolean;
  setShowFleet: (show: boolean) => void;
  showFleetTracks: boolean;
  setShowFleetTracks: (show: boolean) => void;
  showCommercial: boolean;
  setShowCommercial: (show: boolean) => void;
  showCommercialTracks: boolean;
  setShowCommercialTracks: (show: boolean) => void;
  userPosition: { lat: number; lng: number; speed: number } | null;
  onFlyToInlet: () => void;
  onChatToggle?: () => void;
}

export default function TrackingToolbar({
  selectedInletId,
  locationGranted,
  showYou,
  setShowYou,
  showTracks,
  setShowTracks,
  showFleet,
  setShowFleet,
  showFleetTracks,
  setShowFleetTracks,
  showCommercial,
  setShowCommercial,
  showCommercialTracks,
  setShowCommercialTracks,
  userPosition,
  onFlyToInlet,
  onChatToggle
}: TrackingToolbarProps) {
  const router = useRouter();
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Fetch weather data when inlet changes
  useEffect(() => {
    if (!selectedInletId || selectedInletId === 'overview') {
      setWeatherData(null);
      return;
    }

    const fetchWeather = async () => {
      setWeatherLoading(true);
      try {
        // Get inlet coordinates
        const inlet = await import('@/lib/inlets').then(m => m.getInletById(selectedInletId));
        if (!inlet) return;

        const response = await fetch(`/api/stormio?lat=${inlet.lat}&lng=${inlet.lng}`);
        if (!response.ok) throw new Error('Failed to fetch weather');
        
        const data = await response.json();
        setWeatherData(data);
      } catch (error) {
        console.error('Weather fetch error:', error);
        setWeatherData(null);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 30 seconds
    const interval = setInterval(fetchWeather, 30000);
    
    return () => clearInterval(interval);
  }, [selectedInletId]);

  const handleChatClick = () => {
    // Use drawer if available, otherwise redirect
    if (flags.communityDrawer && onChatToggle) {
      onChatToggle();
    } else {
      // Redirect to Community tab with inlet pre-selected
      if (selectedInletId && selectedInletId !== 'overview') {
        router.push(`/legendary/community?inlet=${selectedInletId}`);
      } else {
        router.push('/legendary/community');
      }
    }
  };

  return (
    <div className="absolute left-4 top-24 z-10 space-y-4 pointer-events-none">
      {/* Weather Card */}
      <div className="bg-slate-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 shadow-lg pointer-events-auto w-72">
        <div className="flex items-center gap-2 mb-3">
          <Wind className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-medium text-white">Weather</h3>
        </div>
        
        {weatherLoading ? (
          <div className="text-xs text-slate-400">Loading...</div>
        ) : weatherData ? (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">SST:</span>
              <span className="text-white font-medium">
                {weatherData.weather?.sstC ? `${(weatherData.weather.sstC * 9/5 + 32).toFixed(1)}°F` : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Wind:</span>
              <span className="text-white font-medium">
                {weatherData.weather?.windKt ? `${weatherData.weather.windKt} kt ${weatherData.weather.windDir || ''}` : '--'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Swell:</span>
              <span className="text-white font-medium">
                {weatherData.weather?.swellFt ? `${weatherData.weather.swellFt}ft @ ${weatherData.weather.swellPeriodS || '?'}s` : '--'}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400">Select an inlet to see conditions</div>
        )}
      </div>

      {/* My Vessel Section */}
      <div className="bg-slate-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 shadow-lg pointer-events-auto w-72">
        <div className="flex items-center gap-2 mb-3">
          <Anchor className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-medium text-white">My Vessel</h3>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => setShowYou(!showYou)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
              showYou ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <span>Show Me</span>
            <div className={`w-2 h-2 rounded-full ${showYou ? 'bg-cyan-400' : 'bg-slate-600'}`} />
          </button>
          
          <button
            onClick={() => setShowTracks(!showTracks)}
            disabled={!showYou}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
              showTracks ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            } ${!showYou ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>My Tracks</span>
            <div className={`w-2 h-2 rounded-full ${showTracks ? 'bg-cyan-400' : 'bg-slate-600'}`} />
          </button>
          
          <button
            onClick={onFlyToInlet}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 transition-colors"
          >
            <Navigation className="w-3 h-3" />
            <span>Fly to Inlet Zoom</span>
          </button>
        </div>
      </div>

      {/* My Inlet Fleet Section */}
      <div className="bg-slate-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 shadow-lg pointer-events-auto w-72">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-medium text-white">My Inlet Fleet</h3>
        </div>
        
        {!locationGranted ? (
          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-md p-2 mb-2">
            Location permission required to see fleet
          </div>
        ) : null}
        
        <div className="space-y-2">
          <button
            onClick={() => setShowFleet(!showFleet)}
            disabled={!locationGranted}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
              showFleet ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            } ${!locationGranted ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>Fleet Boats</span>
            <div className={`w-2 h-2 rounded-full ${showFleet ? 'bg-cyan-400' : 'bg-slate-600'}`} />
          </button>
          
          <button
            onClick={() => setShowFleetTracks(!showFleetTracks)}
            disabled={!locationGranted || !showFleet}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
              showFleetTracks ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            } ${!locationGranted || !showFleet ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>Fleet Tracks</span>
            <div className={`w-2 h-2 rounded-full ${showFleetTracks ? 'bg-cyan-400' : 'bg-slate-600'}`} />
          </button>
          
          {/* Chat CTA */}
          <button
            onClick={handleChatClick}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-colors mt-3"
          >
            <MessageSquare className="w-3 h-3" />
            <span>Talk to your inlet fleet</span>
          </button>
        </div>
      </div>

      {/* Commercial Vessels Section */}
      <div className="bg-slate-900/90 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-4 shadow-lg pointer-events-auto w-72">
        <div className="flex items-center gap-2 mb-3">
          <Ship className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-medium text-white">Commercial Vessels</h3>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={() => setShowCommercial(!showCommercial)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
              showCommercial ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            }`}
          >
            <span>GFW Boats</span>
            <div className={`w-2 h-2 rounded-full ${showCommercial ? 'bg-cyan-400' : 'bg-slate-600'}`} />
          </button>
          
          <button
            onClick={() => setShowCommercialTracks(!showCommercialTracks)}
            disabled={!showCommercial}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors ${
              showCommercialTracks ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
            } ${!showCommercial ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>Commercial Tracks</span>
            <div className={`w-2 h-2 rounded-full ${showCommercialTracks ? 'bg-cyan-400' : 'bg-slate-600'}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
