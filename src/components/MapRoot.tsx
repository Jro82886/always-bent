"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useMVPState } from "@/lib/mvpState";

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function MapRoot({ children }: { children?: React.ReactNode }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  
  const { sstOn, polygonsOn, opacity, iso, inletId } = useMVPState();

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    // Initialize map with dark satellite style (user preference)
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12', // Dark satellite per user preference
      center: [-75, 36], // East Coast focus
      zoom: 6,
      cooperativeGestures: true
    });

    map.on('load', () => {
      console.log('[MapRoot] Map loaded and ready');
      
      // Add SST source (initially hidden)
      map.addSource('sst-src', {
        type: 'raster',
        tiles: [`/api/tiles/sst/{z}/{x}/{y}?time=${iso}`],
        tileSize: 256
      });
      
      map.addLayer({
        id: 'sst-lyr',
        type: 'raster',
        source: 'sst-src',
        layout: { visibility: 'none' },
        paint: { 'raster-opacity': opacity }
      });

      // Add polygons source (empty initially)
      map.addSource('polys-src', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Add polygons layers (fill + line)
      map.addLayer({
        id: 'polys-fill',
        type: 'fill',
        source: 'polys-src',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': ['match', ['get', 'class'],
            'filament', '#00DDEB',
            'eddy', '#E879F9', 
            '#F59E0B'
          ],
          'fill-opacity': 0.12
        }
      });

      map.addLayer({
        id: 'polys-line',
        type: 'line',
        source: 'polys-src',
        layout: { visibility: 'none' },
        paint: {
          'line-color': ['match', ['get', 'class'],
            'filament', '#06B6D4',
            'eddy', '#D946EF',
            '#F59E0B'
          ],
          'line-width': 1.4,
          'line-opacity': 0.65
        }
      });

      // Ensure proper layer ordering (polygons above SST)
      if (map.getLayer('polys-fill')) {
        map.moveLayer('polys-fill');
        map.moveLayer('polys-line');
      }
    });

    mapRef.current = map;
    (window as any).abfiMap = map;

    return () => {
      map.remove();
      mapRef.current = null;
      (window as any).abfiMap = null;
    };
  }, []);

  // Handle SST toggle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const visibility = sstOn ? 'visible' : 'none';
    if (map.getLayer('sst-lyr')) {
      map.setLayoutProperty('sst-lyr', 'visibility', visibility);
    }
  }, [sstOn]);

  // Handle polygons toggle  
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const visibility = polygonsOn ? 'visible' : 'none';
    if (map.getLayer('polys-fill')) {
      map.setLayoutProperty('polys-fill', 'visibility', visibility);
      map.setLayoutProperty('polys-line', 'visibility', visibility);
    }
  }, [polygonsOn]);

  // Handle opacity changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('sst-lyr')) {
      map.setPaintProperty('sst-lyr', 'raster-opacity', opacity);
    }
  }, [opacity]);

  // Handle date/time changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('sst-src') as mapboxgl.RasterTileSource;
    if (source && source.setTiles) {
      source.setTiles([`/api/tiles/sst/{z}/{x}/{y}?time=${iso}`]);
      map.triggerRepaint();
    }
  }, [iso]);

  // Load polygons data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !polygonsOn) return;

    const loadPolygons = async () => {
      try {
        const response = await fetch(`/api/polygons?date=${iso}`);
        const data = await response.json();
        const source = map.getSource('polys-src') as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(data);
        }
      } catch (error) {
        console.warn('Failed to load polygons:', error);
      }
    };

    loadPolygons();
  }, [iso, polygonsOn]);

  return (
    <div className="relative w-full h-full">
      {/* Map container - must be empty per Mapbox requirements */}
      <div ref={mapContainerRef} id="map" className="w-full h-full" />
      
      {/* UI overlays */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {children}
      </div>
    </div>
  );
}
