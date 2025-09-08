'use client';

import { useEffect, useRef, useState } from 'react';
import type mapboxgl from 'mapbox-gl';

type Props = {
  map: mapboxgl.Map | null;
  onBbox?: (bbox: [number, number, number, number]) => void; // [minLng,minLat,maxLng,maxLat]
};

export default function SnipTool({ map, onBbox }: Props) {
  const [snipMode, setSnipMode] = useState(false);
  const [bbox, setBbox] = useState<[number, number, number, number] | null>(null);
  const startRef = useRef<[number, number] | null>(null);
  const moveRef = useRef<(e: mapboxgl.MapMouseEvent) => void>(null);
  const upRef = useRef<(e: mapboxgl.MapMouseEvent) => void>(null);

  useEffect(() => {
    if (!map) return;
    const srcId = 'snip-rect-src';
    const fillId = 'snip-rect-fill';
    const lineId = 'snip-rect-line';

    if (!map.getSource(srcId)) {
      map.addSource(srcId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] } as any,
      } as any);
    }
    if (!map.getLayer(fillId)) {
      map.addLayer({
        id: fillId,
        type: 'fill',
        source: srcId,
        paint: { 'fill-opacity': 0.15, 'fill-color': '#00DDEB' },
      } as any);
    }
    if (!map.getLayer(lineId)) {
      map.addLayer({
        id: lineId,
        type: 'line',
        source: srcId,
        paint: { 'line-width': 2, 'line-color': '#00DDEB' },
      } as any);
    }
  }, [map]);

  const rectPolygon = (minLng: number, minLat: number, maxLng: number, maxLat: number) => ({
    type: 'FeatureCollection' as const,
    features: [{
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [[
          [minLng, minLat],
          [maxLng, minLat],
          [maxLng, maxLat],
          [minLng, maxLat],
          [minLng, minLat],
        ]],
      },
      properties: {},
    }],
  });

  const setRect = (b: [number, number, number, number]) => {
    setBbox(b);
    onBbox?.(b);
    if (!map) return;
    const src = map.getSource('snip-rect-src') as mapboxgl.GeoJSONSource;
    src?.setData(rectPolygon(b[0], b[1], b[2], b[3]) as any);
  };

  const clearRect = () => {
    setBbox(null);
    if (!map) return;
    const src = map.getSource('snip-rect-src') as mapboxgl.GeoJSONSource;
    src?.setData({ type: 'FeatureCollection', features: [] } as any);
  };

  const beginSnip = () => {
    if (!map) return;
    console.log('ENTER SNIP MODE');
    setSnipMode(true);
    clearRect();
    map.getCanvas().style.cursor = 'crosshair';

    moveRef.current = (e) => {
      if (!startRef.current) return;
      const [sLng, sLat] = startRef.current;
      const eLng = e.lngLat.lng;
      const eLat = e.lngLat.lat;
      const minLng = Math.min(sLng, eLng);
      const minLat = Math.min(sLat, eLat);
      const maxLng = Math.max(sLng, eLng);
      const maxLat = Math.max(sLat, eLat);
      setRect([minLng, minLat, maxLng, maxLat]);
    };

    upRef.current = (e) => {
      console.log('UP', e.lngLat);
      map.off('mousemove', moveRef.current!);
      map.off('mouseup', upRef.current!);
      startRef.current = null;
      map.getCanvas().style.cursor = '';
      setSnipMode(false);
      console.log('SNIP_BBOX', bbox);
    };

    map.once('mousedown', (e) => {
      console.log('DOWN', e.lngLat);
      startRef.current = [e.lngLat.lng, e.lngLat.lat];
      map.on('mousemove', moveRef.current!);
      map.on('mouseup', upRef.current!);
    });
  };

  useEffect(() => {
    return () => {
      if (!map) return;
      if (moveRef.current) map.off('mousemove', moveRef.current);
      if (upRef.current) map.off('mouseup', upRef.current);
    };
  }, [map]);

  return (
    <div className="flex items-center gap-2">
      <button
        className="px-3 py-2 rounded bg-black/70 text-white"
        onClick={beginSnip}
        disabled={!map || snipMode}
      >
        Snip Area
      </button>
      <button
        className="px-3 py-2 rounded bg-black/70 text-white disabled:opacity-40"
        onClick={() => console.log('ANALYZE CLICKED with bbox', bbox)}
        disabled={!bbox}
      >
        Analyze
      </button>
      <span className="text-xs opacity-70">{bbox ? `bbox: ${bbox.map(n=>n.toFixed(3)).join(', ')}` : 'no bbox'}</span>
    </div>
  );
}


