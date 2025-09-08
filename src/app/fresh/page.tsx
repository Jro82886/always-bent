'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

export default function FreshUI() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  // Simple, clean state
  const [sstVisible, setSstVisible] = useState(false);
  const [polygonsVisible, setPolygonsVisible] = useState(false);
  const [sstOpacity, setSstOpacity] = useState(0.8);
  const [currentDate, setCurrentDate] = useState('latest');

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Clean map initialization
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12', // Dark satellite per your preference
      center: [-75, 36], // East Coast
      zoom: 6,
      cooperativeGestures: true
    });

    const mapInstance = map.current;

    mapInstance.on('load', () => {
      console.log('Map loaded successfully');

      // Add SST source
      mapInstance.addSource('sst', {
        type: 'raster',
        tiles: [`/api/sst/{z}/{x}/{y}?time=${currentDate}`],
        tileSize: 256
      });

      // Add SST layer (hidden by default)
      mapInstance.addLayer({
        id: 'sst-layer',
        type: 'raster',
        source: 'sst',
        layout: { visibility: 'none' },
        paint: { 'raster-opacity': sstOpacity }
      });

      // Add polygons source
      mapInstance.addSource('polygons', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Add polygon fill layer
      mapInstance.addLayer({
        id: 'polygons-fill',
        type: 'fill',
        source: 'polygons',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': '#00DDEB',
          'fill-opacity': 0.3
        }
      });

      // Add polygon outline layer
      mapInstance.addLayer({
        id: 'polygons-line',
        type: 'line',
        source: 'polygons',
        layout: { visibility: 'none' },
        paint: {
          'line-color': '#06B6D4',
          'line-width': 2,
          'line-opacity': 0.8
        }
      });

      // Make map available globally for debugging
      (window as any).map = mapInstance;
    });

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Handle SST toggle
  const toggleSST = () => {
    if (!map.current) return;
    const newVisible = !sstVisible;
    setSstVisible(newVisible);
    
    if (map.current.getLayer('sst-layer')) {
      map.current.setLayoutProperty('sst-layer', 'visibility', newVisible ? 'visible' : 'none');
      console.log(`SST ${newVisible ? 'ON' : 'OFF'}`);
    }
  };

  // Handle polygons toggle
  const togglePolygons = () => {
    if (!map.current) return;
    const newVisible = !polygonsVisible;
    setPolygonsVisible(newVisible);
    
    if (map.current.getLayer('polygons-fill')) {
      map.current.setLayoutProperty('polygons-fill', 'visibility', newVisible ? 'visible' : 'none');
      map.current.setLayoutProperty('polygons-line', 'visibility', newVisible ? 'visible' : 'none');
      console.log(`Polygons ${newVisible ? 'ON' : 'OFF'}`);
      
      // Load polygon data when turned on
      if (newVisible) {
        loadPolygons();
      }
    }
  };

  // Load polygon data
  const loadPolygons = async () => {
    try {
      const response = await fetch(`/api/polygons?date=${currentDate}`);
      const data = await response.json();
      const source = map.current?.getSource('polygons') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(data);
        console.log('Polygons data loaded');
      }
    } catch (error) {
      console.warn('Failed to load polygons:', error);
    }
  };

  // Handle opacity changes
  useEffect(() => {
    if (!map.current || !map.current.getLayer('sst-layer')) return;
    map.current.setPaintProperty('sst-layer', 'raster-opacity', sstOpacity);
  }, [sstOpacity]);

  // Handle date changes
  useEffect(() => {
    if (!map.current) return;
    const source = map.current.getSource('sst') as mapboxgl.RasterTileSource;
    if (source && (source as any).setTiles) {
      (source as any).setTiles([`/api/sst/{z}/{x}/{y}?time=${currentDate}`]);
      map.current.triggerRepaint();
      console.log(`Date changed to: ${currentDate}`);
    }
  }, [currentDate]);

  return (
    <div className="w-full h-screen relative bg-gray-900">
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Modern Control Panel */}
      <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-6 min-w-[280px]">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ocean Analysis</h2>
        
        {/* Layer Controls */}
        <div className="space-y-4">
          
          {/* SST Controls */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Sea Surface Temperature</label>
              <button
                onClick={toggleSST}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  sstVisible 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {sstVisible ? 'ON' : 'OFF'}
              </button>
            </div>
            
            {sstVisible && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-gray-600 w-12">Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={sstOpacity}
                    onChange={(e) => setSstOpacity(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-600 w-8">{Math.round(sstOpacity * 100)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Polygons Controls */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">SST Features</label>
              <button
                onClick={togglePolygons}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  polygonsVisible 
                    ? 'bg-cyan-500 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {polygonsVisible ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Date Controls */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Date</label>
            <select
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="latest">Latest Available</option>
              <option value="2025-09-08">Today</option>
              <option value="2025-09-07">Yesterday</option>
              <option value="2025-09-06">2 Days Ago</option>
              <option value="2025-09-05">3 Days Ago</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="absolute bottom-6 right-6 bg-black/80 text-white px-4 py-2 rounded-lg text-sm">
        SST: {sstVisible ? 'ON' : 'OFF'} | Polygons: {polygonsVisible ? 'ON' : 'OFF'}
      </div>
    </div>
  );
}
