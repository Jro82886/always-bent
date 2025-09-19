import mapboxgl, { Map as MapboxMap, LngLatBoundsLike } from 'mapbox-gl';

// Promise that resolves on moveend or times out
function waitForMove(map: MapboxMap, timeoutMs = 2000): Promise<void> {
  return new Promise((resolve) => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    map.once('moveend', finish);
    setTimeout(finish, timeoutMs);
  });
}

export async function zoomToBounds(
  map: MapboxMap,
  rawBounds: LngLatBoundsLike,
  opts?: {
    padding?: number | { top: number; bottom: number; left: number; right: number };
    duration?: number;
  }
) {
  if (!map) throw new Error('zoomToBounds: no map');

  // normalize bounds, make sure it's not degenerate
  const b = mapboxgl.LngLatBounds.convert(rawBounds);
  const sw = b.getSouthWest(), ne = b.getNorthEast();
  if (Math.abs(ne.lng - sw.lng) < 0.0005) b.extend([sw.lng + 0.0005, sw.lat]);
  if (Math.abs(ne.lat - sw.lat) < 0.0005) b.extend([sw.lng, sw.lat + 0.0005]);

  // clear any in-flight animation
  map.stop();
  // force layout recalc
  map.resize();

  console.log('[SNIP] zoomToBounds →', b.toArray());

  map.fitBounds(b, {
    padding: opts?.padding ?? { top: 100, bottom: 100, left: 100, right: 100 },
    duration: opts?.duration ?? 1500,
    animate: true,
    essential: true,
    bearing: 0,
    pitch: 0,
  });

  await waitForMove(map, (opts?.duration ?? 1500) + 500);
  console.log('[SNIP] Zoom animation complete');
}
