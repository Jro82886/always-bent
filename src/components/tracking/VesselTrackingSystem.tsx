'use client';

import { useState, useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import { Navigation, Eye, EyeOff, MapPin, Clock, Users, Trophy, ArrowLeftRight, Brain } from 'lucide-react';
import { getInletById, INLETS } from '@/lib/inlets';
import { getInletColor } from '@/lib/inletColors';
import * as turf from '@turf/turf';

interface VesselTrackingSystemProps {
  map: mapboxgl.Map | null;
  onModeSwitch?: () => void;
}

interface VesselTrack {
  id: string;
  vesselName: string;
  inletId: string;
  points: [number, number][];
  timestamps: Date[];
  isVisible: boolean;
  isSharing: boolean;
}

interface FishingHotspot {
  location: [number, number];
  vesselName: string;
  duration: number; // minutes
  timestamp: Date;
}

export default function VesselTrackingSystem({ map, onModeSwitch }: VesselTrackingSystemProps) {
  // Core state
  const [isTracking, setIsTracking] = useState(false);
  const [selectedInlet, setSelectedInlet] = useState<string>('');
  const [showTracks, setShowTracks] = useState(true);
  const [daysToShow, setDaysToShow] = useState(7);
  const [tournamentMode, setTournamentMode] = useState(false);
  const [userSharing, setUserSharing] = useState(true);
  
  // Track data
  const [memberTracks, setMemberTracks] = useState<VesselTrack[]>([]);
  const [hotspots, setHotspots] = useState<FishingHotspot[]>([]);
  
  // References
  const trackLayersRef = useRef<string[]>([]);
  const watchIdRef = useRef<number | null>(null);

  // Start tracking
  const startTracking = () => {
    if (!selectedInlet) {
      alert('Please select an inlet area first');
      return;
    }
    
    setIsTracking(true);
    
    // Start GPS tracking
    if (navigator.geolocation && userSharing && !tournamentMode) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          // Store position to Supabase (in production)
          console.log('Position:', position.coords.latitude, position.coords.longitude);
          
          // Check for hotspot (1+ hour in 1 mile radius)
          checkForHotspot(position.coords.latitude, position.coords.longitude);
        },
        (error) => console.error('GPS error:', error),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    
    // Load member tracks for selected inlet
    loadMemberTracks(selectedInlet);
  };

  // Stop tracking
  const stopTracking = () => {
    setIsTracking(false);
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    clearTracksFromMap();
  };

  // Load member vessel tracks
  const loadMemberTracks = async (inletId: string) => {
    // In production, query Supabase for real tracks
    // For MVP, generate mock tracks
    
    const mockTracks: VesselTrack[] = [
      {
        id: 'vessel-1',
        vesselName: 'Sea Hunter',
        inletId,
        points: generateMockTrack(inletId, 50),
        timestamps: generateTimestamps(50, 2), // 2 days ago
        isVisible: true,
        isSharing: true
      },
      {
        id: 'vessel-2',
        vesselName: 'Blue Marlin',
        inletId,
        points: generateMockTrack(inletId, 40),
        timestamps: generateTimestamps(40, 1), // 1 day ago
        isVisible: true,
        isSharing: true
      },
      {
        id: 'vessel-3',
        vesselName: 'Reel Deal',
        inletId,
        points: generateMockTrack(inletId, 35),
        timestamps: generateTimestamps(35, 3), // 3 days ago
        isVisible: true,
        isSharing: true
      }
    ];
    
    // Filter by days to show
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToShow);
    
    const filteredTracks = mockTracks.filter(track => 
      track.timestamps[0] >= cutoffDate
    );
    
    setMemberTracks(filteredTracks);
    
    // Draw tracks on map
    if (map && showTracks) {
      drawTracksOnMap(filteredTracks);
    }
    
    // Detect hotspots
    detectHotspots(filteredTracks);
  };

  // Draw vessel tracks on map
  const drawTracksOnMap = (tracks: VesselTrack[]) => {
    if (!map) return;
    
    // Clear existing tracks
    clearTracksFromMap();
    
    tracks.forEach((track, index) => {
      if (!track.isVisible || (tournamentMode && track.id !== 'user')) return;
      
      const inlet = getInletById(track.inletId);
      const color = getInletColor(track.inletId);
      
      const sourceId = `track-${track.id}`;
      const layerId = `track-line-${track.id}`;
      
      // Add track source
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {
            vesselName: track.vesselName,
            inlet: inlet?.name
          },
          geometry: {
            type: 'LineString',
            coordinates: track.points
          }
        }
      });
      
      // Add track layer
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': color,
          'line-width': 2,
          'line-opacity': 0.7
        }
      });
      
      trackLayersRef.current.push(layerId, sourceId);
      
      // Add vessel marker at last position
      const lastPoint = track.points[track.points.length - 1];
      if (lastPoint) {
        const el = document.createElement('div');
        el.className = 'vessel-marker';
        el.innerHTML = `
          <div style="
            width: 20px;
            height: 20px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `;
        
        new (window as any).mapboxgl.Marker(el)
          .setLngLat(lastPoint)
          .setPopup(
            new (window as any).mapboxgl.Popup({ offset: 15 })
              .setHTML(`
                <div style="padding: 8px;">
                  <div style="font-weight: bold; color: ${color};">
                    ${track.vesselName}
                  </div>
                  <div style="font-size: 11px; color: #666;">
                    Inlet: ${inlet?.name}<br/>
                    Last seen: ${track.timestamps[track.timestamps.length - 1].toLocaleString()}
                  </div>
                </div>
              `)
          )
          .addTo(map);
      }
    });
    
    // Add hotspot markers
    hotspots.forEach(hotspot => {
      const el = document.createElement('div');
      el.className = 'hotspot-marker';
      el.innerHTML = `
        <div style="
          width: 30px;
          height: 30px;
          background: radial-gradient(circle, rgba(255, 215, 0, 0.6), transparent);
          border: 2px solid #FFD700;
          border-radius: 50%;
          animation: pulse 2s infinite;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 16px;
          ">🎣</div>
        </div>
      `;
      
      new (window as any).mapboxgl.Marker(el)
        .setLngLat(hotspot.location)
        .setPopup(
          new (window as any).mapboxgl.Popup({ offset: 15 })
            .setHTML(`
              <div style="padding: 8px;">
                <div style="font-weight: bold; color: #FFD700;">
                  🎣 Fishing Hotspot
                </div>
                <div style="font-size: 11px; color: #666;">
                  ${hotspot.vesselName}<br/>
                  Duration: ${hotspot.duration} minutes<br/>
                  ${hotspot.timestamp.toLocaleString()}
                </div>
              </div>
            `)
        )
        .addTo(map);
    });
  };

  // Clear tracks from map
  const clearTracksFromMap = () => {
    if (!map) return;
    
    trackLayersRef.current.forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });
    
    trackLayersRef.current = [];
    
    // Remove markers
    document.querySelectorAll('.vessel-marker, .hotspot-marker').forEach(el => {
      el.parentElement?.parentElement?.remove();
    });
  };

  // Check for fishing hotspot
  const checkForHotspot = (lat: number, lng: number) => {
    // Logic to detect if vessel has been in 1 mile radius for 1+ hour
    // This would track position history and calculate duration
    console.log('Checking for hotspot at:', lat, lng);
  };

  // Detect hotspots from tracks
  const detectHotspots = (tracks: VesselTrack[]) => {
    const detectedHotspots: FishingHotspot[] = [];
    
    tracks.forEach(track => {
      // Analyze track for stationary periods (1+ hour in 1 mile)
      for (let i = 0; i < track.points.length - 10; i++) {
        const segment = track.points.slice(i, i + 10);
        const center = turf.center(turf.points(segment));
        
        // Check if all points in segment are within 1 mile of center
        const allWithinMile = segment.every(point => {
          const distance = turf.distance(
            turf.point(point),
            center,
            { units: 'miles' }
          );
          return distance <= 1;
        });
        
        if (allWithinMile) {
          // This is a hotspot
          detectedHotspots.push({
            location: center.geometry.coordinates as [number, number],
            vesselName: track.vesselName,
            duration: 60, // Mock 60 minutes
            timestamp: track.timestamps[i]
          });
          break; // Only one hotspot per track for simplicity
        }
      }
    });
    
    setHotspots(detectedHotspots);
  };

  // Generate mock track for inlet
  const generateMockTrack = (inletId: string, pointCount: number): [number, number][] => {
    const inlet = getInletById(inletId);
    if (!inlet) return [];
    
    const points: [number, number][] = [];
    const [centerLng, centerLat] = inlet.center;
    let lat = centerLat + (Math.random() - 0.5) * 0.1;
    let lng = centerLng + (Math.random() - 0.5) * 0.1;
    
    for (let i = 0; i < pointCount; i++) {
      points.push([lng, lat]);
      lng += (Math.random() - 0.5) * 0.01;
      lat += (Math.random() - 0.5) * 0.01;
    }
    
    return points;
  };

  // Generate timestamps
  const generateTimestamps = (count: number, daysAgo: number): Date[] => {
    const timestamps: Date[] = [];
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - daysAgo);
    
    for (let i = 0; i < count; i++) {
      const time = new Date(startTime.getTime() + i * 60000); // 1 minute intervals
      timestamps.push(time);
    }
    
    return timestamps;
  };

  return (
    <div className="absolute top-20 left-4 bg-slate-900/90 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl w-80">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-cyan-300">Vessel Tracking</h3>
        </div>
        {isTracking && (
          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded-full border border-green-500/30 animate-pulse">
            LIVE
          </span>
        )}
      </div>

      {/* Inlet Selection */}
      {!isTracking && (
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-2 block">Select Inlet Area:</label>
          <select
            value={selectedInlet}
            onChange={(e) => setSelectedInlet(e.target.value)}
            className="w-full bg-black/30 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">Choose inlet...</option>
            {INLETS.map(inlet => (
              <option key={inlet.id} value={inlet.id}>
                {inlet.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Privacy Controls */}
      <div className="space-y-2 mb-4">
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={userSharing}
            onChange={(e) => setUserSharing(e.target.checked)}
            disabled={tournamentMode}
            className="rounded"
          />
          <Eye className="w-3 h-3" />
          Share my location
        </label>
        
        <label className="flex items-center gap-2 text-xs text-gray-300">
          <input
            type="checkbox"
            checked={tournamentMode}
            onChange={(e) => {
              setTournamentMode(e.target.checked);
              if (e.target.checked) setUserSharing(false);
            }}
            className="rounded"
          />
          <Trophy className="w-3 h-3" />
          Tournament mode (no sharing)
        </label>
      </div>

      {/* Track Controls */}
      {isTracking && (
        <div className="space-y-2 mb-4">
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={showTracks}
              onChange={(e) => {
                setShowTracks(e.target.checked);
                if (e.target.checked) {
                  loadMemberTracks(selectedInlet);
                } else {
                  clearTracksFromMap();
                }
              }}
              className="rounded"
            />
            Show vessel tracks
          </label>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Days:</label>
            <select
              value={daysToShow}
              onChange={(e) => {
                setDaysToShow(Number(e.target.value));
                loadMemberTracks(selectedInlet);
              }}
              className="bg-black/30 border border-slate-600 rounded px-2 py-1 text-xs text-white"
            >
              <option value="1">Last 24 hours</option>
              <option value="4">Last 4 days</option>
              <option value="7">Last 7 days</option>
            </select>
          </div>
        </div>
      )}

      {/* Start/Stop Button */}
      <button
        onClick={isTracking ? stopTracking : startTracking}
        disabled={!selectedInlet && !isTracking}
        className={`w-full py-2 rounded-lg font-medium text-sm transition-all ${
          isTracking 
            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
            : selectedInlet
            ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 cursor-not-allowed'
        }`}
      >
        {isTracking ? 'Stop Tracking' : 'Start Tracking'}
      </button>

      {/* Info */}
      {isTracking && (
        <div className="mt-4 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-blue-300">
            {tournamentMode 
              ? '🏆 Tournament mode: Your location is private'
              : userSharing
              ? `📍 Tracking ${memberTracks.length} vessels in ${getInletById(selectedInlet)?.name}`
              : '🔒 Location sharing disabled'}
          </p>
        </div>
      )}

      {/* Hotspot Count */}
      {hotspots.length > 0 && (
        <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-xs text-yellow-300">
            🎣 {hotspots.length} fishing hotspot{hotspots.length > 1 ? 's' : ''} detected
          </p>
        </div>
      )}
    </div>
  );
}
