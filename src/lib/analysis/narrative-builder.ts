/**
 * Narrative builder for ocean intelligence reports
 * Handles conditional content based on layer toggles
 */

export type LayersOn = ('sst' | 'chl' | 'gfw')[];

export type Stats = Partial<{
  sst_mean: number;
  sst_min: number;
  sst_max: number;
  sst_midband_pct: number;
  sst_p90: number;
  chl_mean: number;
  chl_midband_pct: number;
  chl_p90: number;
  front_strength_mean: number;
  front_strength_p90: number;
  front_coverage_pct: number;
  coverage_pct: number;
}>;

export type GfwSummary = { 
  total?: number; 
  byType?: Record<string, number> 
} | null;

const MISSING = 'Information not available — toggle ON for it to be included in the report.';

/**
 * Build narrative with conditional sections based on active layers
 */
export function buildNarrativeWithToggles(
  stats: Stats,
  layers_on: LayersOn,
  gfw: GfwSummary
): string {
  const sections: string[] = [];

  // SST / Fronts section
  if (layers_on.includes('sst')) {
    if (Number.isFinite(stats.sst_mean)) {
      const parts: string[] = [];
      
      // Temperature
      parts.push(`SST ~${stats.sst_mean!.toFixed(1)}°F`);
      
      // Target band percentage
      if (Number.isFinite(stats.sst_midband_pct)) {
        parts.push(`${Math.round(stats.sst_midband_pct! * 100)}% in target band`);
      }
      
      // Front detection
      if (Number.isFinite(stats.front_strength_p90) && stats.front_strength_p90! > 0) {
        parts.push(`fronts detected (strength ${stats.front_strength_p90!.toFixed(2)})`);
      } else if (Number.isFinite(stats.front_coverage_pct) && stats.front_coverage_pct! > 0.1) {
        parts.push(`${Math.round(stats.front_coverage_pct! * 100)}% front coverage`);
      }
      
      sections.push(parts.join(' · '));
    } else {
      sections.push(MISSING);
    }
  } else {
    sections.push(MISSING);
  }

  // Chlorophyll section
  if (layers_on.includes('chl')) {
    if (Number.isFinite(stats.chl_mean)) {
      const parts: string[] = [];
      
      // Chlorophyll concentration
      parts.push(`CHL avg ${stats.chl_mean!.toFixed(2)} mg/m³`);
      
      // Mid-band percentage
      if (Number.isFinite(stats.chl_midband_pct)) {
        parts.push(`${Math.round(stats.chl_midband_pct! * 100)}% productive`);
      }
      
      sections.push(parts.join(' · '));
    } else {
      sections.push(MISSING);
    }
  } else {
    sections.push(MISSING);
  }

  // Commercial vessels section
  if (layers_on.includes('gfw')) {
    if (gfw && (gfw.total ?? 0) > 0) {
      const parts: string[] = [];
      
      if (gfw.byType && Object.keys(gfw.byType).length > 0) {
        // List vessel types and counts
        for (const [type, count] of Object.entries(gfw.byType)) {
          if (count > 0) {
            parts.push(`${count} ${type}${count > 1 ? 's' : ''}`);
          }
        }
        sections.push(`Commercial vessels: ${parts.join(', ')}`);
      } else {
        sections.push(`${gfw.total} commercial vessel${gfw.total > 1 ? 's' : ''} detected`);
      }
    } else {
      sections.push('No commercial vessels in area');
    }
  } else {
    sections.push(MISSING);
  }

  // Add data quality note if coverage is low
  if (Number.isFinite(stats.coverage_pct) && stats.coverage_pct! < 0.5) {
    sections.push('\nNote: Limited data coverage in this area');
  }

  return sections.join('\n');
}

/**
 * Generate a comprehensive analysis narrative
 */
export function generateFullNarrative(
  stats: Stats,
  layers_on: LayersOn,
  gfw: GfwSummary,
  area_km2?: number
): string {
  const basicNarrative = buildNarrativeWithToggles(stats, layers_on, gfw);
  
  const parts: string[] = [basicNarrative];
  
  // Add area if provided
  if (area_km2) {
    parts.push(`\nAnalysis area: ${area_km2.toFixed(1)} km²`);
  }
  
  // Add fishing recommendations based on available data
  if (layers_on.includes('sst') && Number.isFinite(stats.sst_mean)) {
    if (stats.front_strength_p90 && stats.front_strength_p90 > 0.5) {
      parts.push('\n💡 Strong temperature break detected - focus on the edges');
    } else if (stats.sst_midband_pct && stats.sst_midband_pct > 0.6) {
      parts.push('\n💡 Optimal temperature conditions throughout the area');
    }
  }
  
  return parts.join('');
}
