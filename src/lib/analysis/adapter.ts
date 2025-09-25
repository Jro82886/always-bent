// src/lib/analysis/adapter.ts
import type { AnalysisVM } from '@/types/analyze';
import type { SnipAnalysis, ScalarStats, LayerToggles } from '@/lib/analysis/types';

/**
 * Adapter to convert new AnalysisVM format to legacy SnipAnalysis format
 * that the existing modal expects
 */
export function vmToSnipLegacy(
  vm: AnalysisVM, 
  polygon: GeoJSON.Polygon,
  timeISO: string,
  toggles: LayerToggles
): SnipAnalysis {
  // Convert SST data to ScalarStats format
  const sstStats: ScalarStats | null = vm.sst ? {
    mean: vm.sst.meanF,
    min: vm.sst.minF,
    max: vm.sst.maxF,
    gradient: vm.sst.gradFperMile,
    units: '°F' as const,
    reason: undefined
  } : (vm.hasSST ? null : null);

  // Convert CHL data to ScalarStats format
  const chlStats: ScalarStats | null = vm.chl ? {
    mean: vm.chl.mean,
    min: vm.chl.min,
    max: vm.chl.max,
    gradient: 0, // Not provided in VM
    units: 'mg/m³' as const,
    reason: undefined
  } : (vm.hasCHL ? null : null);

  // Calculate bbox from polygon
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const ring of polygon.coordinates) {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    }
  }
  const bbox: [number, number, number, number] = [minLng, minLat, maxLng, maxLat];

  // Calculate centroid
  let sumLng = 0, sumLat = 0, count = 0;
  for (const ring of polygon.coordinates) {
    for (const [lng, lat] of ring) {
      sumLng += lng;
      sumLat += lat;
      count++;
    }
  }
  const centroid = { 
    lon: sumLng / count, 
    lat: sumLat / count 
  };

  return {
    polygon,
    bbox,
    timeISO,
    sst: sstStats,
    chl: chlStats,
    wind: null,
    swell: null,
    presence: null,
    toggles,
    polygonMeta: {
      bbox,
      area_sq_km: vm.areaKm2,
      centroid
    },
    narrative: vm.narrative,
    obtainedVia: 'snip'
  };
}
