'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

const EAST: mapboxgl.LngLatBoundsLike = [[-85, 24], [-65, 45]];

export default function Map() {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: ref.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-75, 33],
      zoom: 4,
      attributionControl: false,
      preserveDrawingBuffer: true,
    });

    mapRef.current = map;

    map.on('load', () => {
      map.resize();
      map.fitBounds(EAST, { padding: 20, duration: 0 });
    });

    // expose
    (window as any).mapboxglMap = map;

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      delete (window as any).mapboxglMap;
    };
  }, []);

  return <div ref={ref} className="absolute inset-0" id="map" />;
}


