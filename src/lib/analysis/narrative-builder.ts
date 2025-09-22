import type { SnipAnalysis } from './types';

export function buildNarrative(a: SnipAnalysis): string {
  const lines: string[] = [];

  // SST
  if (a.toggles.sst) {
    if (a.sst) {
      lines.push(
        `SST mean ${fmt(a.sst.mean)}° (${fmt(a.sst.min)}–${fmt(a.sst.max)}), gradient ${fmt(a.sst.gradient)}°/km.`
      );
    } else {
      lines.push(`SST: no valid pixels (clouds/coverage).`);
    }
  } else {
    lines.push(`SST (off): information not available — toggle ON to include.`);
  }

  // CHL
  if (a.toggles.chl) {
    if (a.chl) {
      lines.push(
        `CHL mean ${fmt(a.chl.mean)} mg/m³ (${fmt(a.chl.min)}–${fmt(a.chl.max)}), gradient ${fmt(a.chl.gradient)}.`
      );
    } else {
      lines.push(`CHL: no valid pixels (coverage).`);
    }
  } else {
    lines.push(`CHL (off): information not available — toggle ON to include.`);
  }

  // GFW
  if (a.toggles.gfw) {
    if (a.gfw) {
      const c = a.gfw.counts;
      lines.push(
        `Commercial (4d): ${c.longliner} longliners, ${c.drifting_longline} drifting longline, ${c.trawler} trawlers, ${c.events} events.`
      );
    } else {
      lines.push(`Commercial: no recent activity in this area (4d).`);
    }
  } else {
    lines.push(`Commercial (off): information not available — toggle ON to include.`);
  }

  // Presence summary
  if (a.presence.user?.present) {
    lines.push(`Your vessel has recent fixes inside this area.`);
  } else {
    lines.push(`No recent positions from your vessel in this area.`);
  }

  if (a.presence.fleet) {
    if (a.presence.fleet.count > 0) {
      lines.push(
        `Fleet (${a.presence.fleet.count} vessels) seen over the last days; max consecutive days: ${a.presence.fleet.consecutiveDays}.`
      );
    } else {
      lines.push(`No vessels from your inlet have been in this area.`);
    }
  }

  // Hotspots
  if (a.hotspots && a.hotspots.length > 0) {
    const strong = a.hotspots.filter(h => h.strength === 'strong').length;
    lines.push(`Hotspots detected${strong ? ` (${strong} strong)` : ''}.`);
  }

  return lines.join(' ');
}

const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : 'n/a');