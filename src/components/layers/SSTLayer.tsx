"use client";
import { useEffect } from 'react';
import type mapboxgl from 'mapbox-gl';
import { dailyAtMidnightUTCISO } from '@/lib/imagery/time';
import { buildWMTS } from '@/lib/imagery/url';

type Props = { map: mapboxgl.Map | null; on: boolean };

export default function SSTLayer({ map, on }: Props) {
  useEffect(() => {
    if (!map) return;

    const srcId = 'sst-src';
    const lyrId = 'sst-lyr';
    const template = process.env.NEXT_PUBLIC_SST_WMTS_TEMPLATE!;
    const tileSize = Number(process.env.NEXT_PUBLIC_SST_TILESIZE || 256);

    if (!on) {
      if (map.getLayer(lyrId)) map.removeLayer(lyrId);
      if (map.getSource(srcId)) (map as any).removeSource(srcId);
      return;
    }

    const url = buildWMTS(template, dailyAtMidnightUTCISO(1));

    if (map.getLayer(lyrId)) map.removeLayer(lyrId);
    if (map.getSource(srcId)) (map as any).removeSource(srcId);

    (map as any).addSource(srcId, { type: 'raster', tiles: [url], tileSize } as any);
    map.addLayer({
      id: lyrId,
      type: 'raster',
      source: srcId,
      layout: { visibility: 'visible' },
      paint: { 'raster-opacity': 1, 'raster-resampling': 'linear' },
    } as any);

    const top = map.getStyle().layers?.at(-1)?.id;
    if (top && top !== lyrId) map.moveLayer(lyrId, top);
  }, [map, on]);

  return null;
}


