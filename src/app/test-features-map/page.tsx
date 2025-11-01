'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import SSTLayer from '@/components/layers/SSTLayer';
import { detectOceanographicFeatures } from '@/lib/analysis/oceanographic-features';
import { getTemperatureFromColor } from '@/lib/analysis/sst-color-mapping';
export default function TestFeaturesMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [sstActive, setSstActive] = useState(true);
  const [features, setFeatures] = useState<any>(null);
  const [detecting, setDetecting] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-75, 35.5], // East Coast
      zoom: 7,
      attributionControl: false
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Simulate feature detection
  const detectFeatures = async () => {
    if (!map.current) return;

    setDetecting(true);

    // Create simulated pixel data for testing
    const bounds = map.current.getBounds();
    if (!bounds) return;

    const pixels: any[] = [];

    // Create a grid of test pixels with temperature gradient
    for (let i = 0; i < 20; i++) {
      for (let j = 0; j < 20; j++) {
        const lng = bounds.getWest() + (bounds.getEast() - bounds.getWest()) * (i / 20);
        const lat = bounds.getSouth() + (bounds.getNorth() - bounds.getSouth()) * (j / 20);

        // Create temperature gradient (cold on west, hot on east)
        let r, g, b;
        if (i < 8) {
          // Cold water (blue)
          r = 0; g = 0; b = 200;
        } else if (i < 12) {
          // Transition zone (cyan/green)
          r = 0; g = 150 + (i - 8) * 12; b = 200 - (i - 8) * 40;
        } else {
          // Warm water (yellow/red)
          r = 200 + (i - 12) * 5; g = 200 - (i - 12) * 15; b = 0;
        }

        pixels.push({ lat, lng, r, g, b });
      }
    }

    try {
      const detected = await detectOceanographicFeatures(
        pixels,
        [[bounds.getWest(), bounds.getSouth()], [bounds.getEast(), bounds.getNorth()]]
      );

      setFeatures(detected);

      // Add features to map
      if (map.current) {
        // Remove old layers if they exist
        ['edges', 'filaments', 'eddies'].forEach(type => {
          const sourceId = `detected-${type}`;
          if (map.current!.getSource(sourceId)) {
            if (map.current!.getLayer(`${sourceId}-fill`)) {
              map.current!.removeLayer(`${sourceId}-fill`);
            }
            if (map.current!.getLayer(`${sourceId}-outline`)) {
              map.current!.removeLayer(`${sourceId}-outline`);
            }
            map.current!.removeSource(sourceId);
          }
        });

        // Add new features
        const featuresByType = {
          edges: detected.features.filter(f => f.properties?.type === 'edge'),
          filaments: detected.features.filter(f => f.properties?.type === 'filament'),
          eddies: detected.features.filter(f => f.properties?.type === 'eddy')
        };

        Object.entries(featuresByType).forEach(([type, typeFeatures]) => {
          if (typeFeatures.length === 0) return;

          const sourceId = `detected-${type}`;
          const color = type === 'edge' ? '#FF0000' : type === 'filament' ? '#FFFF00' : '#00FF00';

          map.current!.addSource(sourceId, {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: typeFeatures }
          });

          map.current!.addLayer({
            id: `${sourceId}-fill`,
            type: 'fill',
            source: sourceId,
            paint: {
              'fill-color': color,
              'fill-opacity': 0.2
            }
          });

          map.current!.addLayer({
            id: `${sourceId}-outline`,
            type: 'line',
            source: sourceId,
            paint: {
              'line-color': color,
              'line-width': 2
            }
          });
        });
      }
    } catch (error) {
      console.error('Feature detection failed:', error);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-700 p-4">
        <h1 className="text-2xl font-bold text-cyan-400">
          Test 3: Oceanographic Feature Detection
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          This map simulates feature detection for Edges (Red), Filaments (Yellow), and Eddies (Green)
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 relative">
        {/* Map container */}
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Loading indicator */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
            <div className="text-cyan-400 text-lg">Loading map...</div>
          </div>
        )}

        {/* Control panel */}
        <div className="absolute top-4 left-4 space-y-4 z-10">
          {/* SST Layer Toggle */}
          <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-4">
            <h3 className="text-cyan-400 font-semibold mb-2">Controls</h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={sstActive}
                  onChange={(e) => setSstActive(e.target.checked)}
                  className="rounded"
                />
                Show SST Layer
              </label>
              <button
                onClick={detectFeatures}
                disabled={detecting}
                className={`w-full px-4 py-2 rounded transition-colors ${
                  detecting
                    ? 'bg-slate-600 cursor-not-allowed'
                    : 'bg-cyan-500 hover:bg-cyan-600'
                } text-white font-semibold`}
              >
                {detecting ? 'Detecting...' : 'Detect Features'}
              </button>
            </div>
          </div>

          {/* Results */}
          {features && (
            <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-4 max-w-xs">
              <h3 className="text-cyan-400 font-semibold mb-2">Detection Results</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500" />
                    Edges
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {features.features.filter((f: any) => f.properties?.type === 'edge').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500" />
                    Filaments
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {features.features.filter((f: any) => f.properties?.type === 'filament').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500" />
                    Eddies
                  </span>
                  <span className="text-cyan-300 font-bold">
                    {features.features.filter((f: any) => f.properties?.type === 'eddy').length}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700">
                  <div className="text-slate-400">
                    Total Features: <span className="text-cyan-300">{features.features.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-slate-900/95 border border-slate-700 rounded-lg p-3">
          <h4 className="text-cyan-400 text-sm font-semibold mb-2">Feature Types</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 border border-red-700" />
              <span className="text-slate-300">Edge: ΔT ≥ 2°F / mile</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 border border-yellow-700" />
              <span className="text-slate-300">Filament: Elongated, ΔT ≥ 0.5°F</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 border border-green-700" />
              <span className="text-slate-300">Eddy: Circular, ΔT ≥ 0.5°F</span>
            </div>
          </div>
        </div>
      </div>

      {/* SST Layer Component */}
      {map.current && <SSTLayer map={map.current} on={sstActive} selectedDate="today" />}
    </div>
  );
}