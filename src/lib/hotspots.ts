import type mapboxgl from 'mapbox-gl';

type FC = GeoJSON.FeatureCollection<GeoJSON.Polygon>;

export function ensureAnalysisHotspotLayers(map: mapboxgl.Map) {
  if (!map.getSource('analysis-hotspots')) {
    map.addSource('analysis-hotspots', { type: 'geojson', data: emptyFC() } as any);
  }
  if (!map.getLayer('analysis-hotspots')) {
    map.addLayer({
      id: 'analysis-hotspots',
      type: 'fill',
      source: 'analysis-hotspots',
      paint: {
        'fill-color': '#00ffff',
        'fill-opacity': ['interpolate', ['linear'], ['get','score'], 0, 0.15, 3, 0.45],
        'fill-outline-color': '#000000',
      },
    } as any);
  }
}

export function setAnalysisHotspots(map: mapboxgl.Map, fc: FC) {
  const src = map.getSource('analysis-hotspots') as mapboxgl.GeoJSONSource | undefined;
  if (src?.setData) src.setData(fc as any);
}

export function pickTop3HotspotsForSnip(
  snip: GeoJSON.Polygon | GeoJSON.MultiPolygon,
  allHotspots: FC,
  opts = { minScore: 1.2, maxReturn: 3 }
): FC {
  const snipB = featureBbox({ type:'Feature', properties:{}, geometry: snip } as any);
  const candidates = allHotspots.features.filter(f => bboxIntersects(snipB, featureBbox(f as any)));
  if (!candidates.length) return emptyFC();

  const scored = candidates.map(f => {
    const p: any = f.properties || {};
    const score = Number(p.score ?? 0);
    const lenKm = Number(p.edge_length_km ?? 0);
    const b = featureBbox(f as any);
    const bboxAreaKm2 = bboxKm2(b);
    const polyAreaKm2 = areaKm2(f as any);
    const compactness = polyAreaKm2 > 0 ? polyAreaKm2 / (bboxAreaKm2 + 1e-6) : 0;
    return { f, score, lenKm, compactness };
  });

  const qualified = scored
    .filter(s => s.score >= opts.minScore)
    .sort((a, b) => (
      b.score - a.score ||
      b.lenKm - a.lenKm ||
      b.compactness - a.compactness
    ))
    .slice(0, opts.maxReturn)
    .map(s => s.f);

  return { type: 'FeatureCollection', features: qualified } as FC;
}

function areaKm2(f: any){
  // Approximate planar area by projecting lon/lat to km at mid-latitude
  const geom = f.geometry;
  if (!geom) return 0;
  const polys: number[][][] =
    geom.type === 'Polygon' ? (geom.coordinates as any) : geom.type === 'MultiPolygon' ? (geom.coordinates as any)[0] : [];
  if (!polys || !polys.length) return 0;
  const midLat = averageLat(polys);
  const kx = 111 * Math.cos(midLat * Math.PI/180);
  const ky = 111;
  let total = 0;
  // Exterior ring minus holes
  polys.forEach((ring, idx) => {
    let sum = 0;
    for (let i = 0; i < ring.length; i++) {
      const [x1lon, y1lat] = ring[i];
      const [x2lon, y2lat] = ring[(i+1) % ring.length];
      const x1 = x1lon * kx; const y1 = y1lat * ky;
      const x2 = x2lon * kx; const y2 = y2lat * ky;
      sum += x1 * y2 - x2 * y1;
    }
    const a = Math.abs(sum) / 2;
    total += idx === 0 ? a : -a; // subtract holes
  });
  return Math.max(0, total);
}
function averageLat(polys: number[][][]){
  let s = 0, n = 0;
  polys.forEach(r => r.forEach(pt => { s += pt[1]; n++; }));
  return n ? s/n : 0;
}
function bboxKm2(b: number[]){
  const [minX,minY,maxX,maxY] = b;
  const kmX = (maxX - minX) * 111 * Math.cos(((minY+maxY)/2) * Math.PI/180);
  const kmY = (maxY - minY) * 111;
  return Math.max(0, kmX) * Math.max(0, kmY);
}
function featureBbox(f: any): number[] {
  const g = f.geometry || f;
  let minX =  180, minY =  90, maxX = -180, maxY = -90;
  const eachCoord = (coords: any) => {
    if (typeof coords[0] === 'number') {
      const x = coords[0]; const y = coords[1];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    } else {
      coords.forEach(eachCoord);
    }
  };
  if (g && g.coordinates) eachCoord(g.coordinates);
  return [minX, minY, maxX, maxY];
}
function emptyFC(): FC { return { type:'FeatureCollection', features: [] } as FC; }


