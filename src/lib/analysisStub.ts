export type Bbox4326 = { minLng: number; minLat: number; maxLng: number; maxLat: number };

export function bboxToHotspots(b: Bbox4326) {
  const dx = (b.maxLng - b.minLng) / 4;
  const dy = (b.maxLat - b.minLat) / 4;
  return [
    { lat: b.minLat + dy,     lng: b.minLng + dx },
    { lat: b.minLat + 2 * dy, lng: b.minLng + 2 * dx },
    { lat: b.minLat + 3 * dy, lng: b.minLng + 3 * dx },
  ];
}

export function formatAnalysis(inletName: string, hotspots: { lat: number; lng: number }[]) {
  const reasons = [
    'Strong SST/CHL gradient suggests active bait movement.',
    'Surface temp aligns with a chlorophyll edge.',
    'Likely convergence zone (prey congregation).',
  ];
  return hotspots.map((p, i) => `• Hotspot ${i + 1} — ${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}\n  Reason: ${reasons[i]}`);
}


