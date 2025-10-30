// src/lib/analysis/narrative-builder.ts
// One source of truth for Analysis copy. Safe on missing data.

import type { SnipAnalysis } from './types';

// Optional context you can pass in from the page/store
export type AnalysisContext = {
  // live Weather card (optional)
  weather?: {
    wind_kn?: number;        // surface wind (knots)
    wind_dir_deg?: number;   // 0–360
    swell_ft?: number;       // primary swell height (ft)
    swell_period_s?: number; // seconds
  };
  // fleet/user presence (optional; computed server- or client-side)
  fleetRecentCount?: number; // vessels from this inlet in last 4 days inside polygon
  userInside?: boolean;      // user's current dot within polygon
};

// ---- Copy constants (used across modal + list) ----
export const COPY = {
  SST_OFF: 'SST (off): information not available — toggle ON to include.',
  SST_NA: 'SST: no data returned for the selected time.',
  CHL_OFF: 'Chlorophyll (off): information not available — toggle ON to include.',
  CHL_NA: 'Chlorophyll: no data returned for the selected time.',
  GFW_OFF: 'Commercial vessel activity (off).',
  GFW_NA: 'Commercial vessel data not available.',
};

// ---- Thresholds (tune easily) ----
const T = {
  // Area size
  AREA_TOO_SMALL_KM2: 0.5,    // km²
  AREA_TOO_LARGE_KM2: 250,    // km²
  
  // SST thresholds
  GRADIENT_STRONG_F: 2.0,      // strong SST change across snip area (°F)
  GRADIENT_WEAK_F: 0.5,        // weak edge threshold
  GRADIENT_MODERATE_F: 1.5,    // moderate edge
  GRADIENT_UNIFORM_F: 0.5,     // below this = uniform
  TEMP_GOOD_MIN_F: 68,         // optimal pelagic band
  TEMP_GOOD_MAX_F: 74,
  
  // Chlorophyll thresholds
  CHL_VERY_LOW: 0.05,          // mg/m³ - extremely clean
  CHL_LOW: 0.05,               // mg/m³ - optimal low end
  CHL_OPTIMAL_MAX: 1.5,        // mg/m³ - optimal high end
  CHL_HIGH: 3.0,               // mg/m³ - too turbid
  CHL_GRADIENT: 0.4,           // mg/m³ - significant gradient
  
  // Weather
  WIND_FRESH_MIN_KT: 12,       // fresh breeze starts to move water
  SWELL_WORKABLE_MAX_FT: 5,
};

// ---- Utilities ----
const f1 = (n: number | null | undefined) => (Number.isFinite(n!) ? (n as number).toFixed(1) : '—');
const f2 = (n: number | null | undefined) => (Number.isFinite(n!) ? (n as number).toFixed(2) : '—');
const deg = (d?: number) => (Number.isFinite(d!) ? `${Math.round(d!)}°` : '—');
const compass = (d?: number) => {
  if (!Number.isFinite(d!)) return '—';
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(((d!%360)+360)%360 / 22.5) % 16];
};

// Basic inside-band helper
const inBand = (x: number | null | undefined, lo: number, hi: number) => x !== null && x !== undefined && x >= lo && x <= hi;

// ---- Scoring helpers (0–100) ----
function fishinessScore(a: SnipAnalysis, ctx?: AnalysisContext) {
  let score = 0;
  
  // SST scoring (up to 40 points)
  if (a.toggles.sst && a.sst && a.sst.mean !== null) {
    const delta = (a.sst.max ?? a.sst.mean ?? 0) - (a.sst.min ?? a.sst.mean ?? 0);
    const meanOk = inBand(a.sst.mean, T.TEMP_GOOD_MIN_F, T.TEMP_GOOD_MAX_F);
    
    if (delta < T.GRADIENT_UNIFORM_F) {
      score += 5; // Uniform water
    } else if (delta >= T.GRADIENT_STRONG_F) {
      score += 30; // Strong edge
    } else if (delta >= T.GRADIENT_MODERATE_F) {
      score += 20; // Moderate edge
    } else {
      score += 10; // Weak edge
    }
    
    if (meanOk) score += 10; // Good temperature band
  }
  
  // CHL scoring (up to 40 points)
  if (a.toggles.chl && a.chl && a.chl.mean !== null) {
    const mean = a.chl.mean ?? 0;
    const gradient = a.chl.gradient ?? 0;
    
    if (mean < T.CHL_VERY_LOW) {
      score += 5; // Too clean
    } else if (mean >= T.CHL_LOW && mean <= T.CHL_OPTIMAL_MAX) {
      score += 30; // Optimal range
    } else if (mean > T.CHL_HIGH) {
      score += 5; // Too turbid
    } else {
      score += 15; // Transitional
    }
    
    if (gradient >= T.CHL_GRADIENT) score += 10; // Significant gradient
  }
  
  // Combined conditions bonus (up to 20 points)
  if (a.toggles.sst && a.toggles.chl && a.sst && a.chl && 
      a.sst.mean !== null && a.chl.mean !== null) {
    const sstDelta = (a.sst.max ?? a.sst.mean ?? 0) - (a.sst.min ?? a.sst.mean ?? 0);
    const chlMean = a.chl.mean ?? 0;
    
    if (sstDelta >= T.GRADIENT_STRONG_F && 
        chlMean >= T.CHL_LOW && chlMean <= T.CHL_OPTIMAL_MAX) {
      score += 20; // Perfect combo
    } else if (sstDelta < T.GRADIENT_UNIFORM_F && chlMean < T.CHL_VERY_LOW) {
      score -= 10; // Bad combo (but don't go below 10)
    }
  }
  
  // Ensure score is between 10-90
  score = Math.max(10, Math.min(90, score));
  
  // Determine label
  let label: string;
  if (score >= 80) label = 'strong chance of activity';
  else if (score >= 60) label = 'good potential';
  else if (score >= 40) label = 'moderate potential';
  else if (score >= 20) label = 'weak signals';
  else label = 'very weak';
  
  return { score, label };
}

// ---- Line writers (each returns a string or null) ----
function lineAreaSize(a: SnipAnalysis): string | null {
  const area = a.polygonMeta?.area_sq_km;
  if (!area) return null;
  
  if (area < T.AREA_TOO_SMALL_KM2) {
    return `Area is very small (${f1(area)} km²); signals may be noisy. Try a slightly larger box.`;
  } else if (area > T.AREA_TOO_LARGE_KM2) {
    return `Area is very broad (${Math.round(area)} km²). Consider focusing on smaller features for sharper analysis.`;
  }
  return null; // Area size is fine, no comment needed
}

function lineSST(a: SnipAnalysis) {
  if (!a.toggles.sst) return COPY.SST_OFF;
  if (!a.sst || a.sst.mean === null || a.sst.mean === undefined) return COPY.SST_NA;
  
  const { mean, min, max, gradient } = a.sst;
  const delta = (max ?? mean ?? 0) - (min ?? mean ?? 0);
  
  // Check for uniform water first
  if (delta < T.GRADIENT_UNIFORM_F) {
    return `Water is uniform in temperature (Δ ${f1(delta)}°F). Uniform water is usually less productive.`;
  }
  
  // Build narrative based on gradient strength
  let narrative = '';
  if (delta < T.GRADIENT_WEAK_F) {
    narrative = `Water is uniform in temperature (Δ ${f1(delta)}°F). Uniform water is usually less productive.`;
  } else if (delta >= T.GRADIENT_WEAK_F && delta < T.GRADIENT_MODERATE_F) {
    narrative = `SST gradient of ~${f1(delta)}°F — weak edge, may hold limited bait.`;
  } else if (delta >= T.GRADIENT_STRONG_F) {
    narrative = `Sharp SST gradient of ${f1(delta)}°F — strong edge, favorable for pelagic activity.`;
  } else {
    // Between moderate and strong
    narrative = `SST gradient of ${f1(delta)}°F — moderate edge, watch for bait concentration.`;
  }
  
  // Add temperature band context
  if (inBand(mean, T.TEMP_GOOD_MIN_F, T.TEMP_GOOD_MAX_F)) {
    narrative += ` Water temp within productive band (${T.TEMP_GOOD_MIN_F}–${T.TEMP_GOOD_MAX_F}°F). Often associated with pelagic species.`;
  } else if ((mean ?? 0) < T.TEMP_GOOD_MIN_F) {
    narrative += ` Water temp outside typical range for target species here.`;
  } else {
    narrative += ` Water temp outside typical range for target species here.`;
  }
  
  return narrative;
}

function lineCHL(a: SnipAnalysis) {
  if (!a.toggles.chl) return COPY.CHL_OFF;
  if (!a.chl || a.chl.mean === null || a.chl.mean === undefined) return COPY.CHL_NA;
  
  const { mean, min, max, gradient } = a.chl;
  
  // Build narrative based on concentration
  let narrative = '';
  if ((mean ?? 0) < T.CHL_VERY_LOW) {
    narrative = `Extremely clean water (${f2(mean)} mg/m³). Bait unlikely to hold.`;
  } else if ((mean ?? 0) >= T.CHL_LOW && (mean ?? 0) <= T.CHL_OPTIMAL_MAX) {
    narrative = `Moderate chlorophyll (${f2(mean)} mg/m³) — favorable feeding zone.`;
  } else if ((mean ?? 0) > T.CHL_HIGH) {
    narrative = `Very high chlorophyll (${f2(mean)} mg/m³). Often turbid; predators may avoid.`;
  } else {
    // Between optimal and high
    narrative = `Chlorophyll ${f2(mean)} mg/m³ — transitional water quality.`;
  }
  
  // Add gradient information if significant
  if ((gradient ?? 0) >= T.CHL_GRADIENT) {
    narrative += ` Chlorophyll gradient of ${f2(gradient)} mg/m³ — frontal edge may concentrate bait.`;
  }
  
  return narrative;
}

function lineWeather(ctx?: AnalysisContext) {
  if (!ctx?.weather) return null;
  const { wind_kn, wind_dir_deg, swell_ft, swell_period_s } = ctx.weather;
  const parts: string[] = [];
  if (Number.isFinite(wind_kn)) parts.push(`${Math.round(wind_kn!)} kt ${compass(wind_dir_deg)}`);
  if (Number.isFinite(swell_ft) && Number.isFinite(swell_period_s)) parts.push(`${f1(swell_ft!)} ft @ ${Math.round(swell_period_s!)}s`);
  if (!parts.length) return null;
  // Brief read on workability
  let work = '';
  if ((wind_kn ?? 0) <= T.WIND_FRESH_MIN_KT && (swell_ft ?? 0) <= T.SWELL_WORKABLE_MAX_FT) work = 'Sea state looks workable.';
  else work = 'Watch sea state; conditions may be sporty.';
  return `Weather: ${parts.join(' • ')}. ${work}`;
}

function linePresence(a: SnipAnalysis, ctx?: AnalysisContext) {
  if (!a.toggles.fleetTracks && !a.toggles.myTracks) return null;
  
  const bits: string[] = [];
  if (a.toggles.fleetTracks) {
    if (ctx?.fleetRecentCount && ctx.fleetRecentCount > 0) {
      bits.push(`Fleet activity detected (${ctx.fleetRecentCount} tracks). May indicate productive zone`);
    } else {
      bits.push('No active vessels detected in this snip');
    }
  }
  if (a.toggles.myTracks && ctx?.userInside) {
    bits.push('you are currently inside this area');
  }
  
  return bits.length > 0 ? `${bits.join('. ')}.` : null;
}

function lineCombinedConditions(a: SnipAnalysis): string | null {
  // Only analyze if both SST and CHL are toggled and have data
  if (!a.toggles.sst || !a.toggles.chl) return null;
  if (!a.sst || a.sst.mean === null || !a.chl || a.chl.mean === null) return null;
  
  const sstDelta = (a.sst.max ?? a.sst.mean ?? 0) - (a.sst.min ?? a.sst.mean ?? 0);
  const chlMean = a.chl.mean ?? 0;
  
  // Check conditions
  const sstUniform = sstDelta < T.GRADIENT_UNIFORM_F;
  const sstEdge = sstDelta >= T.GRADIENT_STRONG_F;
  const chlOptimal = chlMean >= T.CHL_LOW && chlMean <= T.CHL_OPTIMAL_MAX;
  const chlClean = chlMean < T.CHL_VERY_LOW;
  
  if (sstUniform && chlClean) {
    return "Uniform water + clean chlorophyll — low productivity expected.";
  } else if (sstEdge && chlOptimal) {
    return "Strong SST edge aligned with favorable chlorophyll — high-probability zone.";
  } else if (sstEdge && !chlOptimal) {
    return "Temp edge present, but chlorophyll weak — mixed signal.";
  }
  
  return null; // No special combined condition
}

// ---- Public API ----
export function buildNarrative(a: SnipAnalysis, ctx?: AnalysisContext): string {
  console.log('[NARRATIVE] Building with analysis:', {
    toggles: a.toggles,
    sst: a.sst,
    chl: a.chl,
    hasSST: !!a.sst,
    hasCHL: !!a.chl,
    sstMean: a.sst?.mean,
    chlMean: a.chl?.mean
  });
  
  const lines: string[] = [];

  // 1. Area size check (if problematic)
  const areaLine = lineAreaSize(a);
  if (areaLine) lines.push(areaLine);

  // 2. Core ocean signals
  lines.push(lineSST(a));
  lines.push(lineCHL(a));

  // 3. Combined conditions (if applicable)
  const combinedLine = lineCombinedConditions(a);
  if (combinedLine) lines.push(combinedLine);

  // 4. Presence/Vessels (if toggled)
  const presenceLine = linePresence(a, ctx);
  if (presenceLine) lines.push(presenceLine);

  // 5. Commercial vessels from GFW API (Amanda's request - show real vessel data)
  if (a.toggles.gfw) {
    // Check for fleet data from analyze API
    const fleetData = (a as any).fleet;
    if (fleetData && fleetData.count > 0) {
      const vesselTypes = fleetData.vessels
        .map((v: any) => v.type)
        .filter((t: string, i: number, arr: string[]) => arr.indexOf(t) === i); // unique types

      if (fleetData.count === 1) {
        lines.push(`COMMERCIAL VESSEL ACTIVITY: 1 ${fleetData.vessels[0].type} vessel detected. Last seen ${fleetData.vessels[0].lastSeen}.`);
      } else if (fleetData.count <= 5) {
        const vesselList = fleetData.vessels
          .map((v: any) => `${v.type} (${v.lastSeen})`)
          .join(', ');
        lines.push(`COMMERCIAL VESSEL ACTIVITY: ${fleetData.count} vessels detected - ${vesselList}.`);
      } else {
        const typeBreakdown = vesselTypes
          .map((type: string) => {
            const count = fleetData.vessels.filter((v: any) => v.type === type).length;
            return `${count} ${type}${count > 1 ? 's' : ''}`;
          })
          .join(', ');
        lines.push(`COMMERCIAL VESSEL ACTIVITY: ${fleetData.count} vessels detected - ${typeBreakdown}. Increased vessel traffic indicates productive fishing area.`);
      }
    } else if (!a.presence?.gfw) {
      lines.push(`COMMERCIAL VESSEL ACTIVITY: No commercial vessels detected in this area in the last 7 days.`);
    } else {
      const c = a.presence.gfw;
      lines.push(`Commercial vessels (last 4d): Longliners ${c.longliner} • Drifting ${c.drifting_longline} • Trawlers ${c.trawler} • Events ${c.events}.`);
    }
  }

  // 6. User Reports Data (Amanda's request - show recent catches and conditions)
  const reportsData = (a as any).reports;
  if (reportsData && reportsData.count > 0) {
    const speciesList = reportsData.species && reportsData.species.length > 0
      ? reportsData.species.join(', ')
      : reportsData.recentCatch;

    if (reportsData.count === 1) {
      lines.push(`RECENT USER REPORTS: 1 report of ${speciesList} in the last 7 days.`);
    } else {
      lines.push(`RECENT USER REPORTS: ${reportsData.count} reports in last 7 days. Species: ${speciesList}. Active fishing area.`);
    }
  }

  // 7. AI "Fishiness" Score (always show)
  const { score, label } = fishinessScore(a, ctx);
  lines.push(`Signal strength: ${score}/100 — ${label}.`);

  // Clean out any nulls/empties, keep 3–8 lines (increased to fit new data), join with newlines
  return lines.filter(Boolean).slice(0, 8).join('\n');
}

// Optional: export score if you want a pill/indicator
export function getFishiness(a: SnipAnalysis, ctx?: AnalysisContext) {
  return fishinessScore(a, ctx);
}

// Legacy function for backward compatibility
export function buildNarrativeWithToggles(a: SnipAnalysis): string {
  // Use the new buildNarrative with minimal context
  const ctx: AnalysisContext = {
    weather: a.wind && a.swell ? {
      wind_kn: a.wind.speed_kn ?? undefined,
      wind_dir_deg: a.wind.direction_deg ?? undefined,
      swell_ft: a.swell.height_ft ?? undefined,
      swell_period_s: a.swell.period_s ?? undefined,
    } : undefined,
    fleetRecentCount: a.presence?.fleetVessels,
    userInside: a.presence?.myVesselInArea,
  };
  return buildNarrative(a, ctx);
}