'use client';
import { useEffect } from 'react';

export default function SSTRasterInner({ iso }: { iso: string }) {
  useEffect(() => {
    const map: any = (window as any).mapboxglMap;
    if (!map || !iso) return;

    const srcId = 'sst';
    const lyrId = 'sst-layer';
    const tilesUrl = `${window.location.origin}/api/tiles/sst/{z}/{x}/{y}.png?source=mur&time=${iso}`;

    const recreate = () => {
      if (map.getLayer(lyrId)) map.removeLayer(lyrId);
      if (map.getSource(srcId)) map.removeSource(srcId);
      map.addSource(srcId, { type: 'raster', tiles: [tilesUrl], tileSize: 256 } as any);
      map.addLayer({ id: lyrId, type: 'raster', source: srcId, paint: { 'raster-opacity': 0.9 } });
    };

    const existing: any = map.getSource(srcId);
    if (!existing) {
      recreate();
    } else {
      const current = (existing as any)?.tiles?.[0];
      if (current !== tilesUrl) recreate();
      else if (!map.getLayer(lyrId)) {
        map.addLayer({ id: lyrId, type: 'raster', source: srcId, paint: { 'raster-opacity': 0.9 } });
      }
    }

    return () => {
      if (map.getLayer(lyrId)) map.removeLayer(lyrId);
      if (map.getSource(srcId)) map.removeSource(srcId);
    };
  }, [iso]);

  return null;
}


