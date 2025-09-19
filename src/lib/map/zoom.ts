import type { Map as MapboxMap, LngLatBoundsLike } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';

// tiny event waiter
const waitFor = (evt: 'idle' | 'moveend', map: MapboxMap) =>
  new Promise<void>((resolve) => {
    const once = () => { map.off(evt, once); resolve(); };
    map.on(evt, once);
  });

export async function zoomToBounds(
  map: MapboxMap,
  rawBounds: LngLatBoundsLike,
  opts: {
    padding?: number | { top: number; bottom: number; left: number; right: number };
    duration?: number;
    bearing?: number;
    pitch?: number;
  } = {}
) {
  map.resize(); // in case drawers/layout changed

  // normalize/epsilon
  const b = (mapboxgl as any).LngLatBounds.convert(rawBounds);
  const sw = b.getSouthWest(); const ne = b.getNorthEast();
  const minSpan = 0.0005;
  if (Math.abs(ne.lng - sw.lng) < minSpan && Math.abs(ne.lat - sw.lat) < minSpan) {
    b.extend([sw.lng + minSpan, sw.lat + minSpan]);
  }

  map.stop();
  if (!map.isStyleLoaded()) await waitFor('idle', map);

  const pad = typeof opts.padding === 'number'
    ? { top: opts.padding, bottom: opts.padding, left: opts.padding, right: opts.padding }
    : (opts.padding ?? { top: 100, bottom: 100, left: 100, right: 100 });

  map.fitBounds(b, {
    padding: pad,
    duration: opts.duration ?? 1500,
    essential: true,
    animate: true,
    bearing: opts.bearing ?? 0,
    pitch: opts.pitch ?? 0
  });

  await waitFor('moveend', map);
}
