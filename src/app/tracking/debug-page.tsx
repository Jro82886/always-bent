'use client';

import { useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Direct token check
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function TrackingDebugPage() {
  const [status, setStatus] = useState<string[]>([]);
  
  useEffect(() => {
    const logs: string[] = [];
    
    // 1. Check token
    logs.push(`Token exists: ${TOKEN ? 'YES' : 'NO'}`);
    logs.push(`Token value: ${TOKEN ? TOKEN.substring(0, 20) + '...' : 'UNDEFINED'}`);
    
    // 2. Check mapboxgl
    logs.push(`mapboxgl exists: ${typeof mapboxgl !== 'undefined' ? 'YES' : 'NO'}`);
    logs.push(`mapboxgl.accessToken: ${mapboxgl.accessToken ? 'SET' : 'NOT SET'}`);
    
    // 3. Set token directly
    if (TOKEN) {
      mapboxgl.accessToken = TOKEN;
      logs.push('Token set directly to mapboxgl');
    }
    
    // 4. Check DOM
    logs.push(`Document ready: ${document.readyState}`);
    
    // 5. Try creating a simple map
    const container = document.getElementById('debug-map');
    if (container && TOKEN) {
      try {
        const map = new mapboxgl.Map({
          container: 'debug-map',
          style: 'mapbox://styles/mapbox/satellite-v9',
          center: [-74.0, 40.0],
          zoom: 8
        });
        
        map.on('load', () => {
          logs.push('✅ Map loaded successfully!');
          setStatus([...logs]);
        });
        
        map.on('error', (e) => {
          logs.push(`❌ Map error: ${e.error.message}`);
          setStatus([...logs]);
        });
        
      } catch (e: any) {
        logs.push(`❌ Map creation error: ${e.message}`);
      }
    }
    
    setStatus(logs);
  }, []);
  
  return (
    <div className="w-full h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-4 text-red-500">TRACKING DEBUG PAGE</h1>
      
      <div className="mb-8">
        <h2 className="text-xl mb-2">Status Checks:</h2>
        {status.map((log, i) => (
          <div key={i} className="font-mono text-sm mb-1">{log}</div>
        ))}
      </div>
      
      <div className="mb-4">
        <h2 className="text-xl mb-2">Simple Map Test:</h2>
        <div id="debug-map" className="w-full h-96 bg-gray-800 border-2 border-red-500"></div>
      </div>
      
      <div className="mt-8 p-4 bg-yellow-900 rounded">
        <p>If you see this page but no map above, the Mapbox token is not loading.</p>
        <p>Check browser console for additional errors.</p>
      </div>
    </div>
  );
}
