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
  // °F/°C agnostic internally—assume your sampler already returns °F and mg/m³.
  GRADIENT_STRONG_F: 2.0,      // strong SST change across snip area (°F)
  GRADIENT_MODERATE_F: 0.8,    // moderate edge
  TEMP_GOOD_MIN_F: 68,         // generic pelagic-friendly band; adjust per region/species later
  TEMP_GOOD_MAX_F: 74,
  CHL_LOW: 0.10,               // mg/m³
  CHL_MOD: 0.30,
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
function scoreThermal(sst?: any): number {
  if (!sst || sst.mean === null || sst.mean === undefined) return 0;
  const g = sst.gradient ?? 0;
  let s = 0;
  if (g >= T.GRADIENT_STRONG_F) s += 55;
  else if (g >= T.GRADIENT_MODERATE_F) s += 35;
  const meanOk = inBand(sst.mean, T.TEMP_GOOD_MIN_F, T.TEMP_GOOD_MAX_F);
  s += meanOk ? 25 : 10;
  // more spread can hint at micro-structure
  const spread = Math.max(0, ((sst.max ?? sst.mean) - (sst.min ?? sst.mean)));
  s += Math.min(20, spread * 4);
  return Math.max(0, Math.min(100, Math.round(s)));
}

function scoreChl(chl?: any): number {
  if (!chl || chl.mean === null || chl.mean === undefined) return 0;
  // Favor low-moderate chlorophyll + some gradient (front between clear/off-color)
  let s = 0;
  if (chl.mean <= T.CHL_LOW) s += 30;
  else if (chl.mean <= T.CHL_MOD) s += 20;
  s += Math.min(30, Math.max(0, (chl.gradient ?? 0) * 40)); // gradient in mg/m³; scaled
  return Math.max(0, Math.min(60, Math.round(s)));
}

function scorePresence(ctx?: AnalysisContext): number {
  if (!ctx) return 0;
  let s = 0;
  if (ctx.fleetRecentCount && ctx.fleetRecentCount > 0) s += Math.min(25, 10 + ctx.fleetRecentCount * 3);
  if (ctx.userInside) s += 5;
  return Math.min(30, s);
}

// Final combined score
function fishinessScore(a: SnipAnalysis, ctx?: AnalysisContext) {
  const st = scoreThermal(a.sst);
  const sc = scoreChl(a.chl);
  const sp = scorePresence(ctx);
  const score = Math.max(0, Math.min(100, Math.round(st + sc + sp)));
  let label: 'Low'|'Fair'|'Good'|'Strong';
  if (score >= 75) label = 'Strong';
  else if (score >= 55) label = 'Good';
  else if (score >= 35) label = 'Fair';
  else label = 'Low';
  return { score, label, parts: { thermal: st, chlorophyll: sc, presence: sp } };
}

// ---- Line writers (each returns a string or null) ----
function lineSST(a: SnipAnalysis) {
  if (!a.toggles.sst) return COPY.SST_OFF;
  if (!a.sst || a.sst.mean === null || a.sst.mean === undefined) return COPY.SST_NA;
  const { mean, min, max, gradient } = a.sst;
  const range = `${f1(min)}–${f1(max)}°F`;
  const g = f1(gradient);
  // Short factual line
  const base = `SST ${f1(mean)}°F (range ${range}, Δ ${g}°).`;
  // Insight
  let insight = '';
  if ((gradient ?? 0) >= T.GRADIENT_STRONG_F)      insight = 'Sharp temperature break present—often a productive edge.';
  else if ((gradient ?? 0) >= T.GRADIENT_MODERATE_F) insight = 'Moderate temp change—watch for bait stacking along this line.';
  else                                       insight = 'Uniform water—limited structure to concentrate bait.';
  // Band context
  const band =
    inBand(mean, T.TEMP_GOOD_MIN_F, T.TEMP_GOOD_MAX_F)
      ? 'Temp band is within a favorable range.'
      : (mean ?? 0) < T.TEMP_GOOD_MIN_F
        ? 'Water reads cool for typical pelagic activity.'
        : 'Water reads warm for typical pelagic activity.';
  return `${base} ${insight} ${band}`;
}

function lineCHL(a: SnipAnalysis) {
  if (!a.toggles.chl) return COPY.CHL_OFF;
  if (!a.chl || a.chl.mean === null || a.chl.mean === undefined) return COPY.CHL_NA;
  const { mean, min, max, gradient } = a.chl;
  const base = `Chlorophyll ${f2(mean)} mg/m³ (range ${f2(min)}–${f2(max)}, Δ ${f2(gradient)}).`;
  let insight = '';
  if ((mean ?? 0) <= T.CHL_LOW)        insight = 'Clearer water—good visibility; pair with an SST break.';
  else if ((mean ?? 0) <= T.CHL_MOD)   insight = 'Slight color; workable clarity with potential edge.';
  else                           insight = 'Off-color water—look for cleaner seams or rips.';
  return `${base} ${insight}`;
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
  const bits: string[] = [];
  if (ctx?.fleetRecentCount && ctx.fleetRecentCount > 0) {
    bits.push(`${ctx.fleetRecentCount} fleet vessel${ctx.fleetRecentCount>1?'s':''} in the last 4 days`);
  } else {
    bits.push('No recent fleet presence here');
  }
  if (a.toggles.myTracks && ctx?.userInside) bits.push('you are currently inside this area');
  return `Presence: ${bits.join(' • ')}.`;
}

// ---- Public API ----
export function buildNarrative(a: SnipAnalysis, ctx?: AnalysisContext): string {
  const lines: string[] = [];

  // Core ocean signals
  lines.push(lineSST(a));
  lines.push(lineCHL(a));

  // Commercial (placeholder until GFW clip is live)
  if (!a.toggles.gfw) lines.push(COPY.GFW_OFF);
  else if (!a.presence?.gfw)    lines.push(COPY.GFW_NA);
  else {
    const c = a.presence.gfw.counts;
    lines.push(`Commercial vessels (last 4d): Longliners ${c.longliner} • Drifting ${c.drifting_longline} • Trawlers ${c.trawler} • Events ${c.events}.`);
  }

  // Local weather + presence (optional)
  const w = lineWeather(ctx);
  if (w) lines.push(w);
  lines.push(linePresence(a, ctx));

  // Score summary (final line)
  const { score, label } = fishinessScore(a, ctx);
  lines.push(`Signal strength: ${label} (${score}/100).`);

  // Clean out any nulls/empties, keep 3–6 lines, join with newlines
  return lines.filter(Boolean).slice(0, 6).join('\n');
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