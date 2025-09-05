'use client';

import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { getMap } from '@/components/MapStage';

export default function SSTRaster({ iso }: { iso: string }){
  useEffect(() => {
    const map = getMap();
    if (!map || !iso) return;

    const srcId = 'sst-mur-src';
    const layerId = 'sst-mur-layer';
    const url = `/api/tiles/sst/{z}/{x}/{y}.png?source=mur&time=${encodeURIComponent(iso)}`;

    if (!map.getSource(srcId)) {
      map.addSource(srcId, {
        type: 'raster',
        tiles: [url],
        tileSize: 256,
      } as any);
    } else {
      const s = map.getSource(srcId) as any;
      if (s && s.tiles && s.tiles[0] !== url) s.tiles = [url];
      try { (map as any).style.sourceCaches[srcId]?.clearTiles(); } catch {}
      map.triggerRepaint();
    }

    if (!map.getLayer(layerId)) {
      map.addLayer({ id: layerId, type: 'raster', source: srcId, paint: { 'raster-opacity': 0.88 } });
    }

    return () => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(srcId)) map.removeSource(srcId);
    };
  }, [iso]);

  return null;
}


