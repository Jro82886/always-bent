// Adapter to convert new SnipAnalysis to legacy format
import type { SnipAnalysis } from './types';
import type { LegacySnipAnalysis } from '@/types/ml-fishing';

export function toLegacy(a: SnipAnalysis): LegacySnipAnalysis {
  return {
    id: crypto.randomUUID(),
    user_id: 'unknown',
    geometry: a.polygon,
    area_sq_km: 0, // Would need to calculate from polygon
    conditions: {
      sst_min: a.sst?.min ?? 0,
      sst_max: a.sst?.max ?? 0,
      sst_gradient_max: a.sst?.gradient ?? 0,
      chlorophyll_avg: a.chl?.mean ?? undefined,
      time_of_day: 'morning' // Default for now
    },
    detected_features: [],
    report_text: 'Generated via adapter',
    hotspot_confidence: 0,
    success_prediction: 0,
    predicted_species: [],
    created_at: new Date().toISOString(),
    layers_active: {
      sst: a.toggles.sst,
      chl: a.toggles.chl,
      current: false,
      bathymetry: false
    }
  } as LegacySnipAnalysis;
}
