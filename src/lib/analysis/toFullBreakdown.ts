import { computeSpeciesOutlook } from '@/lib/analysis/speciesOutlook';
import { buildReadout } from '@/lib/analysis/readout';

export function toFullBreakdownV1(s: any) {
  const samp = s?.sst || s?.chl ? { sst: s.sst, chl: s.chl } : s?.sample || {};
  const outlook = computeSpeciesOutlook(samp);

  const sstF = samp?.sst
    ? {
        avg: ((samp.sst.mean * 9) / 5 + 32),
        min: ((samp.sst.min * 9) / 5 + 32),
        max: ((samp.sst.max * 9) / 5 + 32),
      }
    : undefined;

  const data = {
    version: 1,
    snip: {
      id: s?.id || 'snip',
      inlet: s?.inlet || 'unknown',
      time_utc: s?.timeISO || new Date().toISOString(),
      region_text: s?.region_text || '',
      bbox: s?.bbox || [],
      area_sq_mi: s?.polygonMeta?.area_sq_km ? s.polygonMeta.area_sq_km * 0.386102 : 0,
    },
    metrics: {
      water_temp_f: sstF,
      water_color_summary: samp?.chl?.mean != null ? (samp.chl.mean <= 0.2 ? 'clear blue' : samp.chl.mean >= 0.8 ? 'green' : 'mixed') : undefined,
    },
    species_outlook: outlook,
    ai_readout: buildReadout({ sstF, chl: samp?.chl }),
    hotspot: s?.hotspot ?? { show: false, label: '', confidence: 'medium' },
    confidence: s?.confidence ?? 'medium',
    data_gaps: s?.gaps ?? []
  };

  return data;
}


