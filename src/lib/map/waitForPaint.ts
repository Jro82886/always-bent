import type mapboxgl from 'mapbox-gl';

export function waitForSSTRasterPaint(map: mapboxgl.Map, layerId: string, timeoutMs: number = 1500) {
  return new Promise<void>((resolve) => {
    const timeoutId = setTimeout(() => {
      console.warn(`[ABFI] Timeout waiting for SST layer ${layerId} to paint`);
      resolve();
    }, timeoutMs);

    const done = () => {
      clearTimeout(timeoutId);
      resolve();
    };

    if (!map.isStyleLoaded()) {
      map.once('styledata', () => wait());
    } else {
      wait();
    }

    function wait() {
      // ensure the layer exists and is visible
      const vis = map.getLayoutProperty(layerId, 'visibility');
      if (vis === 'none') {
        map.once('idle', wait);
        return;
      }
      // wait until the map reports idle (tiles rendered)
      map.once('idle', done);
      map.triggerRepaint?.();
    }
  });
}
