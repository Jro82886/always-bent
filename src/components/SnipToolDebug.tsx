'use client';

import { useState, useEffect } from 'react';
import { useMapbox } from '@/lib/MapCtx';

export default function SnipToolDebug() {
  const map = useMapbox();
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    if (!map) return;

    const checkDataSources = () => {
      const info: any = {
        timestamp: new Date().toISOString(),
        mapReady: !!map,
        sources: {},
        layers: {},
        dataMode: 'checking...'
      };

      // Check map sources
      if (map.getStyle()) {
        const style = map.getStyle();
        
        // Check for SST/CHL sources
        const sources = style.sources;
        info.sources.sst = !!sources['sst-src'];
        info.sources.chl = !!sources['chl-src'];
        
        // Check for SST/CHL layers
        const layers = style.layers;
        info.layers.sst = layers.some(l => l.id === 'sst-lyr');
        info.layers.chl = layers.some(l => l.id === 'chl-lyr');
        
        // Check if layers are visible
        if (info.layers.sst) {
          info.sstVisible = map.getLayoutProperty('sst-lyr', 'visibility') !== 'none';
        }
        if (info.layers.chl) {
          info.chlVisible = map.getLayoutProperty('chl-lyr', 'visibility') !== 'none';
        }
      }

      // Check environment variables
      info.env = {
        sstTilesUrl: !!process.env.NEXT_PUBLIC_SST_TILES_URL,
        chlTilesUrl: !!process.env.NEXT_PUBLIC_CHL_TILES_URL,
        sstWmtsTemplate: !!process.env.NEXT_PUBLIC_SST_WMTS_TEMPLATE,
        chlWmtsTemplate: !!process.env.NEXT_PUBLIC_CHL_WMTS_TEMPLATE,
      };

      // Determine data mode
      if (info.sources.sst && info.sstVisible) {
        info.dataMode = '🟢 LIVE DATA READY (SST visible)';
      } else if (info.sources.chl && info.chlVisible) {
        info.dataMode = '🟢 LIVE DATA READY (CHL visible)';
      } else if (info.sources.sst || info.sources.chl) {
        info.dataMode = '🟡 LAYERS EXIST but not visible - Toggle SST/CHL buttons';
      } else {
        info.dataMode = '🔴 MOCK DATA MODE - No ocean layers loaded';
      }

      setDebugInfo(info);
    };

    // Initial check
    checkDataSources();

    // Listen for style changes
    map.on('styledata', checkDataSources);
    map.on('sourcedata', checkDataSources);

    return () => {
      map.off('styledata', checkDataSources);
      map.off('sourcedata', checkDataSources);
    };
  }, [map]);

  return (
    <div className="fixed bottom-20 right-4 bg-black/90 text-white p-4 rounded-lg border border-cyan-500/50 max-w-sm text-xs font-mono z-[100]">
      <h3 className="text-cyan-400 font-bold mb-2">🔍 SnipTool Data Mode</h3>
      
      <div className="space-y-1">
        <div className="text-sm font-bold">{debugInfo.dataMode}</div>
        
        <div className="mt-2 pt-2 border-t border-cyan-500/30">
          <div>SST Source: {debugInfo.sources?.sst ? '✅' : '❌'}</div>
          <div>CHL Source: {debugInfo.sources?.chl ? '✅' : '❌'}</div>
          <div>SST Layer: {debugInfo.layers?.sst ? '✅' : '❌'} {debugInfo.sstVisible ? '(visible)' : '(hidden)'}</div>
          <div>CHL Layer: {debugInfo.layers?.chl ? '✅' : '❌'} {debugInfo.chlVisible ? '(visible)' : '(hidden)'}</div>
        </div>

        <div className="mt-2 pt-2 border-t border-cyan-500/30">
          <div className="text-cyan-300">Environment:</div>
          <div>SST Tiles URL: {debugInfo.env?.sstTilesUrl ? '✅' : '❌'}</div>
          <div>CHL Tiles URL: {debugInfo.env?.chlTilesUrl ? '✅' : '❌'}</div>
        </div>

        <div className="mt-2 pt-2 border-t border-cyan-500/30 text-[10px] text-gray-400">
          To enable live data:
          <br />1. Click SST or CHL button in header
          <br />2. Wait for tiles to load
          <br />3. Use SnipTool - it will extract real values
        </div>
      </div>
    </div>
  );
}
