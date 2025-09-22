import mapboxgl from 'mapbox-gl';

export function fitBoundsToPolygon(map: mapboxgl.Map, bbox: [number, number, number, number]) {
  if (!bbox || bbox.some(Number.isNaN)) return;
  const [w, s, e, n] = bbox;

  // Leave room for side panels
  const padding = { top: 64, right: 420, bottom: 96, left: 320 };
  const tiny = (Math.abs(e - w) < 0.15) && (Math.abs(n - s) < 0.15);
  const maxZoom = 11.5;

  if (tiny) {
    map.easeTo({
      center: [(w + e) / 2, (s + n) / 2],
      zoom: Math.min(map.getZoom() + 2.5, maxZoom),
      duration: 1200,
      essential: true
    });
    return;
  }
  
  map.fitBounds([[w, s], [e, n]], { 
    padding, 
    maxZoom, 
    duration: 1200, 
    essential: true 
  });
}

export function zoomToSnip(
  map: mapboxgl.Map,
  bbox: [number, number, number, number],
  opts: { padding?: mapboxgl.PaddingOptions; maxZoom?: number; duration?: number } = {}
): Promise<void> {
  return new Promise((resolve) => {
    if (!bbox || bbox.some((v) => Number.isNaN(v))) return resolve();

    const [w, s, e, n] = bbox;
    const padding = opts.padding ?? { top: 64, right: 420, bottom: 96, left: 320 };
    const maxZoom = opts.maxZoom ?? 11.5;
    const duration = opts.duration ?? 1200;

    // Ensure we don't stack listeners
    map.off('moveend', resolve as any);

    // Fallback if animation is interrupted
    const timer = setTimeout(() => resolve(), duration + 250);
    map.once('moveend', () => { clearTimeout(timer); resolve(); });

    const tiny = (Math.abs(e - w) < 0.15) && (Math.abs(n - s) < 0.15);
    if (tiny) {
      map.easeTo({
        center: [(w + e) / 2, (s + n) / 2],
        zoom: Math.min(map.getZoom() + 2.5, maxZoom),
        duration, essential: true,
      });
    } else {
      map.fitBounds([[w, s], [e, n]], { padding, maxZoom, duration, essential: true });
    }
  });
}
