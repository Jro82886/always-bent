'use client';

import { useEffect } from 'react';

const SRC_ID = 'sst-polys-src';
const LINE_ID = 'sst-polys-line';
const FILL_ID = 'sst-polys-fill';

function addLayers(map: any) {
  if (!map.getSource(SRC_ID)) {
    map.addSource(SRC_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  }
  if (!map.getLayer(FILL_ID)) {
    map.addLayer({
      id: FILL_ID,
      type: 'fill',
      source: SRC_ID,
      paint: {
        'fill-color': [
          'match',
          ['get', 'type'],
          'eddy', '#22d3ee',
          'filament', '#a78bfa',
          'edge', '#f59e0b',
          '#94a3b8'
        ],
        'fill-opacity': 0.18,
      },
    });
  }
  if (!map.getLayer(LINE_ID)) {
    map.addLayer({
      id: LINE_ID,
      type: 'line',
      source: SRC_ID,
      paint: {
        'line-color': [
          'match',
          ['get', 'type'],
          'eddy', '#22d3ee',
          'filament', '#a78bfa',
          'edge', '#f59e0b',
          '#94a3b8'
        ],
        'line-width': 1.2,
        'line-opacity': 0.9,
      },
    });
  }
}

function removeLayers(map: any) {
  if (map.getLayer(LINE_ID)) map.removeLayer(LINE_ID);
  if (map.getLayer(FILL_ID)) map.removeLayer(FILL_ID);
  if (map.getSource(SRC_ID)) map.removeSource(SRC_ID);
}

export default function PolysLayer({ iso }: { iso: string }) {
  useEffect(() => {
    const map: any = (window as any).mapboxglMap;
    if (!map || !iso) return;

    let cancelled = false;
    let debTimer: any = null;

    const base =
      process.env.NEXT_PUBLIC_SST_POLYGONS_URL ??
      process.env.NEXT_PUBLIC_POLYGONS_URL ??
      '';
    const daysBack = process.env.NEXT_PUBLIC_SST_POLYGONS_DAYS_BACK || '';
    const gsUrl = process.env.NEXT_PUBLIC_SST_POLYGONS_GS_URL || '';

    const fetchAndRender = async () => {
      if (!map) return;
      try {
        const b = map.getBounds();
        const bbox = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()].join(',');
        const q = new URLSearchParams();
        q.set('time', `${iso}T00:00:00Z`);
        q.set('bbox', bbox);
        if (daysBack) q.set('days_back', String(daysBack));
        if (gsUrl) q.set('gs_url', gsUrl as string);
        const url = `${base}?${q.toString()}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return;
        const gj = await res.json();
        if (cancelled) return;
        addLayers(map);
        const src: any = map.getSource(SRC_ID);
        if (src && src.setData) src.setData(gj);
      } catch (e) {
        // no-op
      }
    };

    const onMoveEnd = () => {
      clearTimeout(debTimer);
      debTimer = setTimeout(fetchAndRender, 250);
    };

    // ensure style loaded then render
    if (!map.isStyleLoaded()) {
      const onLoad = () => { fetchAndRender(); map.off('styledata', onLoad); };
      map.on('styledata', onLoad);
    } else {
      fetchAndRender();
    }
    map.on('moveend', onMoveEnd);

    return () => {
      cancelled = true;
      clearTimeout(debTimer);
      map.off('moveend', onMoveEnd);
      removeLayers(map);
    };
  }, [iso]);

  return null;
}


