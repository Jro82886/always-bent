'use client';
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN as string;

let mapRefSingleton: mapboxgl.Map | null = null;
export function getMap(){ return mapRefSingleton; }

export default function MapStage({ initialBounds }: { initialBounds?: 'eastCoast' }){
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(()=>{
    if(mapRefSingleton || !containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-76.0, 36.5],
      zoom: 4
    });

    map.addControl(new mapboxgl.NavigationControl({showZoom:true}), 'bottom-right');

    if(initialBounds === 'eastCoast'){
      map.fitBounds([[-82.5, 24.0], [-65.0, 45.0]], { padding: 40, duration: 0 });
    }

    mapRefSingleton = map;
    return () => { map.remove(); mapRefSingleton = null; };
  }, [initialBounds]);

  return <div ref={containerRef} className="absolute inset-0" />;
}
