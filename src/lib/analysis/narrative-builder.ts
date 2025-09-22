import type { SnipAnalysis } from './types';
import { SST_IDEAL_RANGE_F, SST_STRONG_FRONT_F_PER_KM, CHL_IDEAL_RANGE, CHL_FRONT_PER_KM, FORMAT } from './thresholds';
import { gfwEnabled } from '@/lib/features/gfw';

export function buildNarrative(a: SnipAnalysis): string {
  const lines: string[] = [];

  // Title line is handled by UI; we provide concise paragraphs here.

  // SST
  if (!a.toggles.sst) {
    lines.push(`• **SST** (off): information not available — toggle ON to include.`);
  } else if (!a.sst || a.sst.mean == null) {
    lines.push(`• **SST**: n/a${a.sst?.reason ? ` (${a.sst.reason})` : ''}.`);
  } else {
    const inBand = a.sst.mean >= SST_IDEAL_RANGE_F.min && a.sst.mean <= SST_IDEAL_RANGE_F.max;
    const front = (a.sst.gradient ?? 0) >= SST_STRONG_FRONT_F_PER_KM;
    lines.push(
      `• **SST** ${FORMAT.sst(a.sst.mean)} (min ${FORMAT.sst(a.sst.min)}, max ${FORMAT.sst(a.sst.max)}).` +
      (front ? ` Strong thermal edge (~${FORMAT.grad(a.sst.gradient, '°F')}) detected.` : ``) +
      (inBand ? ` Temp is within target band (${SST_IDEAL_RANGE_F.min}–${SST_IDEAL_RANGE_F.max}°F).` : ` Temp is outside the ideal band.`)
    );
  }

  // CHL
  if (!a.toggles.chl) {
    lines.push(`• **Chl** (off): information not available — toggle ON to include.`);
  } else if (!a.chl || a.chl.mean == null) {
    lines.push(`• **Chl**: n/a${a.chl?.reason ? ` (${a.chl.reason})` : ''}.`);
  } else {
    const inBand = a.chl.mean >= CHL_IDEAL_RANGE.min && a.chl.mean <= CHL_IDEAL_RANGE.max;
    const front = (a.chl.gradient ?? 0) >= CHL_FRONT_PER_KM;
    lines.push(
      `• **Chl** ${FORMAT.chl(a.chl.mean)} (min ${FORMAT.chl(a.chl.min)}, max ${FORMAT.chl(a.chl.max)}).` +
      (front ? ` Color-front present (~${FORMAT.grad(a.chl.gradient, 'mg/m³')}).` : ``) +
      (inBand ? ` Productivity sits in the target band (${CHL_IDEAL_RANGE.min}–${CHL_IDEAL_RANGE.max} mg/m³).` : ` Productivity outside the ideal band.`)
    );
  }

  // GFW
  if (!gfwEnabled) {
    lines.push(`• **Commercial vessels**: coming soon.`);
  } else if (!a.toggles.gfw) {
    lines.push(`• **Commercial** (off): information not available — toggle ON to include.`);
  } else if (!a.gfw) {
    lines.push(`• **Commercial**: n/a.`);
  } else {
    const c = a.gfw.counts;
    const total = c.longliner + c.drifting_longline + c.trawler;
    lines.push(
      `• **Commercial vessels (last 4 days)**: ${total} total — ` +
      `Longliner ${c.longliner}, Drifting ${c.drifting_longline}, Trawler ${c.trawler}.` +
      (c.events ? ` Fishing events: ${c.events}.` : ``)
    );
  }

  // Tracks awareness (we don't render here; we nudge cross-checking)
  if (a.toggles.myTracks || a.toggles.fleetTracks || a.toggles.gfwTracks) {
    const parts: string[] = [];
    if (a.toggles.myTracks) parts.push('your tracks');
    if (a.toggles.fleetTracks) parts.push('fleet tracks');
    if (a.toggles.gfwTracks) parts.push('commercial tracks');
    lines.push(`• Tracks enabled: ${parts.join(', ')}. Cross-check behavior on **Tracking** for reinforcement patterns.`);
  }

  // Final hint if a lot is off
  const offCount = ['sst','chl','gfw'].filter(k => !(a.toggles as any)[k]).length;
  if (offCount >= 2) {
    lines.push(`Tip: enable more layers to strengthen the prediction signal.`);
  }

  return lines.join('\n');
}