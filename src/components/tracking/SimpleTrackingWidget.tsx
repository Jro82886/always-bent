'use client';

import { useState, useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import { Navigation, Play, Stop, MapPin } from 'lucide-react';

interface SimpleTrackingWidgetProps {
  map: mapboxgl.Map | null;
}

/**
 * MVP Tracking Widget - Just the essentials:
 * 1. Start/Stop tracking
 * 2. Show your position
 * 3. Draw a trail on the map
 * That's it!
 */
export default function SimpleTrackingWidget({ map }: SimpleTrackingWidgetProps) {
  const [isTracking, setIsTracking] = useState(false);
  const [position, setPosition] = useState<{lat: number, lng: number} | null>(null);
  const [trackPoints, setTrackPoints] = useState<[number, number][]>([]);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Start/Stop tracking
  const toggleTracking = () => {
    if (!isTracking) {
      // Start tracking
      setIsTracking(true);
      setTrackPoints([]);
      
      if (navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setPosition(newPos);
            setTrackPoints(prev => [...prev, [newPos.lng, newPos.lat]]);
            
            // Update marker on map
            if (map) {
              if (!markerRef.current) {
                markerRef.current = new (window as any).mapboxgl.Marker({ color: '#3b82f6' })
                  .setLngLat([newPos.lng, newPos.lat])
                  .addTo(map);
              } else {
                markerRef.current.setLngLat([newPos.lng, newPos.lat]);
              }
              
              // Center map on user
              map.flyTo({ center: [newPos.lng, newPos.lat], zoom: 14 });
            }
          },
          (error) => console.error('GPS error:', error),
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    } else {
      // Stop tracking
      setIsTracking(false);
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }
  };

  // Draw trail on map
  useEffect(() => {
    if (!map || trackPoints.length < 2) return;

    // Update or create trail line
    if (map.getSource('track-trail')) {
      (map.getSource('track-trail') as mapboxgl.GeoJSONSource).setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: trackPoints
        }
      });
    } else {
      map.addSource('track-trail', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: trackPoints
          }
        }
      });

      map.addLayer({
        id: 'track-trail-line',
        type: 'line',
        source: 'track-trail',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
          'line-opacity': 0.7
        }
      });
    }
  }, [map, trackPoints]);

  return (
    <div className="absolute top-20 left-4 bg-slate-900/90 backdrop-blur-md rounded-xl p-4 border border-slate-700/50 shadow-xl w-72">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
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

      {/* Simple Controls */}
      <button
        onClick={toggleTracking}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
          isTracking 
            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
            : 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
        }`}
      >
        {isTracking ? (
          <>
            <Stop className="w-4 h-4" />
            Stop Tracking
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Start Tracking
          </>
        )}
      </button>

      {/* Position Display */}
      {position && (
        <div className="mt-3 p-2 bg-black/30 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span className="text-xs text-gray-400">Current Position</span>
          </div>
          <div className="text-xs text-white font-mono">
            {position.lat.toFixed(5)}°, {position.lng.toFixed(5)}°
          </div>
        </div>
      )}

      {/* Track Info */}
      {trackPoints.length > 0 && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          {trackPoints.length} points recorded
        </div>
      )}
    </div>
  );
}
