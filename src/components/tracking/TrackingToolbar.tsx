'use client';

import { useState, useEffect, useRef } from 'react';
import { Wind, Anchor, Users, Ship, Navigation, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { flags } from '@/lib/flags';
import { useAppState } from '@/lib/store';
import { showToast } from '@/components/ui/Toast';
import { gfwEnabled } from '@/lib/features/gfw';
import { isInsideInlet } from '@/lib/geo/inletBounds';
import mapboxgl from 'mapbox-gl';
import '@/styles/vessel-glow.css';
import { USER_VESSEL } from '@/config/vessel-style';
import AbfiBiteButton from '@/components/common/AbfiBiteButton';

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
  onChatToggle?: () => void;
  map?: mapboxgl.Map | null;
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
  onChatToggle,
  map
}: TrackingToolbarProps) {
  const router = useRouter();
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  
  // Get user location state from store
  const { userLoc, userLocStatus, setUserLoc, setUserLocStatus, restrictToInlet, myTracksEnabled, appendMyTrack } = useAppState();
  const watchIdRef = useRef<number | null>(null);
  const lastTrackUpdateRef = useRef<number>(0);

  // Fetch weather data when inlet changes
  useEffect(() => {
    if (!selectedInletId || selectedInletId === 'overview') {
      setWeatherData(null);
      return;
    }

    const ac = new AbortController();
    let mounted = true;

    const fetchWeather = async () => {
      if (!mounted) return;
      setWeatherLoading(true);
      try {
        const response = await fetch(`/api/weather?inlet=${selectedInletId}`, {
          signal: ac.signal
        });
        if (!response.ok) throw new Error('Failed to fetch weather');
        
        const data = await response.json();
        if (!mounted) return;
        setWeatherData(data);
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('Weather fetch error:', error);
          if (mounted) setWeatherData(null);
        }
      } finally {
        if (mounted) setWeatherLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 30 seconds
    const interval = setInterval(fetchWeather, 30000);
    
    return () => {
      mounted = false;
      ac.abort();
      clearInterval(interval);
    };
  }, [selectedInletId]);

  const handleChatClick = () => {
    // Check if inlet is selected
    if (!selectedInletId || selectedInletId === 'overview') {
      showToast({
        type: 'info',
        title: 'Select an Inlet',
        message: 'Pick an inlet to open chat',
        duration: 3000
      });
      return;
    }
    
    // Use drawer if available, otherwise redirect
    if (flags.communityDrawer && onChatToggle) {
      onChatToggle();
    } else {
      // Redirect to Community tab with inlet pre-selected
      router.push(`/legendary/community?inlet=${selectedInletId}`);
    }
  };

  // Draw or update user dot on map
  const drawOrUpdateUserDot = (lon: number, lat: number, accuracy?: number) => {
    if (!map) return;
    
    const src = map.getSource('user-vessel') as mapboxgl.GeoJSONSource | undefined;
    const feature: GeoJSON.Feature = { 
      type: 'Feature', 
      geometry: { type: 'Point', coordinates: [lon, lat] }, 
      properties: { accuracy: accuracy ?? null } 
    };
    
    if (src) {
      src.setData({ type: 'FeatureCollection', features: [feature] });
    } else {
      map.addSource('user-vessel', { 
        type: 'geojson', 
        data: { type: 'FeatureCollection', features: [feature] } 
      });
      
      // Add outer halo layer
      map.addLayer({
        id: 'user-vessel-halo-outer', 
        type: 'circle', 
        source: 'user-vessel',
        paint: { 
          'circle-radius': 22, 
          'circle-color': USER_VESSEL.haloOuter,
          'circle-opacity': 0.35,
          'circle-blur': 1.8
        } 
      });
      
      // Add inner halo layer
      map.addLayer({
        id: 'user-vessel-halo', 
        type: 'circle', 
        source: 'user-vessel',
        paint: { 
          'circle-radius': 14, 
          'circle-color': USER_VESSEL.haloInner,
          'circle-opacity': 0.35,
          'circle-blur': 1.2
        } 
      }, 'user-vessel-halo-outer');
      
      // Add dot layer on top
      map.addLayer({
        id: 'user-vessel-dot', 
        type: 'circle', 
        source: 'user-vessel',
        paint: { 
          'circle-radius': 6, 
          'circle-color': USER_VESSEL.color,
          'circle-blur': 0.1,
          'circle-opacity': 1,
          'circle-stroke-width': 0
        } 
      }, 'user-vessel-halo');
    }
  };

  // Handle Show Me button click
  const onShowMe = async () => {
    if (!map) return;
    
    setUserLocStatus('requesting');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const accuracy = pos.coords.accuracy;

        // Check if we should restrict to inlet bounds
        if (restrictToInlet) {
          const inside = isInsideInlet(lon, lat, selectedInletId || '');
          if (!inside) {
            setUserLoc(undefined);
            setUserLocStatus('idle');
            showToast({
              type: 'info',
              title: 'Outside Selected Inlet',
              message: 'You\'re outside the selected inlet. Switch inlets to show your position.',
              duration: 5000
            });
            return;
          }
        }

        // Update state
        const newLoc = { lat, lon, accuracy, updatedAt: Date.now() };
        setUserLoc(newLoc);
        setUserLocStatus('active');
        setShowYou(true);
        
        // Append to track if enabled
        if (myTracksEnabled) {
          appendMyTrack(lon, lat);
        }
        
        // Draw the dot (no camera movement)
        drawOrUpdateUserDot(lon, lat, accuracy);
      },
      (err) => {
        setUserLocStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
        showToast({
          type: 'warning',
          title: 'Location Access',
          message: err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Enable to show your vessel.'
            : 'Could not get location. Try again.',
          duration: 5000
        });
      },
      { 
        enableHighAccuracy: true, 
        timeout: 8000, 
        maximumAge: 15000 
      }
    );
  };

  // Handle Hide Me
  const onHideMe = () => {
    if (!map) return;
    
    setUserLoc(undefined);
    setUserLocStatus('idle');
    setShowYou(false);
    
    // Remove all user vessel layers
    ['user-vessel-dot', 'user-vessel-halo', 'user-vessel-halo-outer'].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource('user-vessel')) map.removeSource('user-vessel');
  };

  // Effect to handle showYou state changes
  useEffect(() => {
    if (!showYou && map) {
      onHideMe();
    }
  }, [showYou, map]);

  // Effect to handle continuous tracking when enabled
  useEffect(() => {
    if (showYou && myTracksEnabled && userLocStatus === 'active' && !watchIdRef.current) {
      // Start watching position for track updates
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const now = Date.now();
          const { latitude: lat, longitude: lon, accuracy } = position.coords;
          
          // Update location
          const newLoc = { lat, lon, accuracy, updatedAt: now };
          setUserLoc(newLoc);
          
          // Update track every 30 seconds
          if (now - lastTrackUpdateRef.current >= 30000) {
            appendMyTrack(lon, lat);
            lastTrackUpdateRef.current = now;
          }
          
          // Update dot on map
          if (map) {
            drawOrUpdateUserDot(lon, lat, accuracy);
          }
        },
        (error) => {
          console.error('Track watch error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
    
    // Cleanup watch when disabled
    if ((!showYou || !myTracksEnabled) && watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [showYou, myTracksEnabled, userLocStatus, map, setUserLoc, appendMyTrack]);

  return (
    <div className="absolute left-4 top-24 z-10 space-y-4 pointer-events-none">
      {/* Weather Card */}
      <div className="ab-card pointer-events-auto w-72">
        <div className="ab-head">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-cyan-400" />
            <h3 className="ab-head__title">Weather</h3>
          </div>
        </div>
        <div className="ab-head__underline" />
        
        {weatherLoading ? (
          <div className="text-xs text-slate-400">Loading...</div>
        ) : weatherData ? (
          <div className="space-y-2 text-xs">
            {weatherData.weather?.sstC && (
              <div className="flex justify-between">
                <span className="text-slate-400">SST:</span>
                <span className="text-white font-medium">
                  {`${(weatherData.weather.sstC * 9/5 + 32).toFixed(1)}°F`}
                </span>
              </div>
            )}
            {weatherData.weather?.windKt && (
              <div className="flex justify-between">
                <span className="text-slate-400">Wind:</span>
                <span className="text-white font-medium">
                  {`${Math.round(weatherData.weather.windKt)} kt ${weatherData.weather.windDir || ''}`}
                </span>
              </div>
            )}
            {weatherData.weather?.swellFt && (
              <div className="flex justify-between">
                <span className="text-slate-400">Swell:</span>
                <span className="text-white font-medium">
                  {`${Math.round(weatherData.weather.swellFt)}ft @ ${Math.round(weatherData.weather.swellPeriodS || 0)}s`}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-400">Select an inlet to see conditions</div>
        )}
      </div>

      {/* My Vessel Section */}
      <div className="ab-card pointer-events-auto w-72">
        <div className="ab-head">
          <div className="flex items-center gap-2">
            <Anchor className="w-4 h-4 text-cyan-400" />
            <h3 className="ab-head__title">My Vessel</h3>
          </div>
        </div>
        <div className="ab-head__underline" />
        
        <div className="space-y-2">
          <div className="ab-row">
            <span className="text-sm text-slate-300">{showYou ? 'Hide Me' : 'Show Me'}</span>
            <button
              onClick={showYou ? onHideMe : onShowMe}
              className={`ab-pill ${showYou ? 'ab-pill--on' : 'ab-pill--off'}`}
            >
              {showYou ? 'Active' : 'Hidden'}
            </button>
          </div>
          
          <div className="ab-row">
            <span className="text-sm text-slate-300">My Tracks</span>
            <button
              onClick={() => setShowTracks(!showTracks)}
              disabled={!showYou}
              className={`ab-pill ${showTracks ? 'ab-pill--on' : 'ab-pill--off'} ${!showYou ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {showTracks ? 'Active' : 'Hidden'}
            </button>
          </div>
          
          {/* ABFI Bite Button moved to Command Bridge header; remove duplicate here */}

          {/* Location Status */}
          {userLocStatus !== 'idle' && (
            <div className="mt-2 text-xs">
              {userLocStatus === 'requesting' && (
                <div className="text-slate-400">Locating...</div>
              )}
              {userLocStatus === 'active' && userLoc && (
                <div className="flex items-center gap-2">
                  <div className="vessel-status flex items-center gap-2">
                    <span className="vessel-dot" />
                    <span className="text-slate-400 text-xs">Position marker</span>
                  </div>
                  <span className="vessel-status-active text-xs">Active</span>
                </div>
              )}
              {userLocStatus === 'denied' && (
                <div className="text-amber-400">
                  Enable location to show your vessel
                  <button
                    onClick={onShowMe}
                    className="ml-2 text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Enable
                  </button>
                </div>
              )}
              {userLocStatus === 'error' && (
                <div className="text-red-400">Location error - try again</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* My Inlet Fleet Section */}
      <div className="ab-card pointer-events-auto w-72">
        <div className="ab-head">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <h3 className="ab-head__title">My Inlet Fleet</h3>
          </div>
        </div>
        <div className="ab-head__underline" />
        
        {!locationGranted && (
          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-md p-2 mb-2">
            Location permission required to see fleet
          </div>
        )}
        
        <div className="space-y-2">
          <div className="ab-row">
            <span className="text-sm text-slate-300">Fleet Boats</span>
            <button
              onClick={() => setShowFleet(!showFleet)}
              disabled={!locationGranted}
              className={`ab-pill ${showFleet ? 'ab-pill--on' : 'ab-pill--off'} ${!locationGranted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {showFleet ? 'Active' : 'Hidden'}
            </button>
          </div>
          
          <div className="ab-row">
            <span className="text-sm text-slate-300">Fleet Tracks</span>
            <button
              onClick={() => setShowFleetTracks(!showFleetTracks)}
              disabled={!locationGranted || !showFleet}
              className={`ab-pill ${showFleetTracks ? 'ab-pill--on' : 'ab-pill--off'} ${!locationGranted || !showFleet ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {showFleetTracks ? 'Active' : 'Hidden'}
            </button>
          </div>
          
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
      {gfwEnabled && (
        <div className="ab-card pointer-events-auto w-72">
          <div className="ab-head">
            <div className="flex items-center gap-2">
              <Ship className="w-4 h-4 text-cyan-400" />
              <h3 className="ab-head__title">Commercial Vessels</h3>
            </div>
          </div>
          <div className="ab-head__underline" />
          
          <div className="space-y-2 p-3">
            <div className="ab-row">
              <span className="text-sm text-slate-300">GFW Boats</span>
              <button
                onClick={() => setShowCommercial(!showCommercial)}
                className={`ab-pill ${showCommercial ? 'ab-pill--on' : 'ab-pill--off'}`}
              >
                {showCommercial ? 'Active' : 'Hidden'}
              </button>
            </div>
            
            <div className="ab-row">
              <span className="text-sm text-slate-300">Commercial Tracks</span>
              <button
                onClick={() => setShowCommercialTracks(!showCommercialTracks)}
                disabled={!showCommercial}
                className={`ab-pill ${showCommercialTracks ? 'ab-pill--on' : 'ab-pill--off'} ${!showCommercial ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {showCommercialTracks ? 'Active' : 'Hidden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
