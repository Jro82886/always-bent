import type { SnipAnalysis } from './types';

export function buildNarrative(a: SnipAnalysis): string {
  const lines: string[] = [];
  
  // SST
  if (!a.toggles.sst) {
    lines.push('SST (off): information not available — toggle ON to include.');
  } else if (!a.sst) {
    lines.push('SST: no data returned for the selected time.');
  } else {
    const span = (a.sst.max - a.sst.min);
    lines.push(`SST ${a.sst.mean.toFixed(1)}°F (range ${a.sst.min.toFixed(1)}–${a.sst.max.toFixed(1)}°, Δ ${span.toFixed(1)}°).`);
    
    if (span < 0.8) {
      lines.push('Water appears uniform — lower structure signal; try scanning adjacent breaks.');
    } else if (span >= 1.0) {
      lines.push('Gradient present — frontal activity may concentrate bait & fish.');
    }
  }
  
  // CHL
  if (!a.toggles.chl) {
    lines.push('Chlorophyll (off): information not available — toggle ON to include.');
  } else if (!a.chl) {
    lines.push('Chlorophyll: no data returned for the selected time.');
  } else {
    const gradient = a.chl.max - a.chl.min;
    lines.push(`Chlorophyll ${a.chl.mean.toFixed(2)} mg/m³ (Δ ${gradient.toFixed(2)}).`);
    
    if (a.chl.mean > 0.5) {
      lines.push('Elevated chlorophyll — potential productivity zone.');
    }
  }
  
  // GFW (stubbed for now)
  if (a.toggles.gfw) {
    const counts = a.presence?.counts || { longliner: 0, drifting_longline: 0, trawler: 0, events: 0 };
    lines.push(`Commercial vessels (last 4d): L ${counts.longliner} • D ${counts.drifting_longline} • T ${counts.trawler} • events ${counts.events}.`);
  }
  
  // Track toggles mentioned
  const trackInfo: string[] = [];
  if (a.toggles.myTracks) trackInfo.push('my tracks');
  if (a.toggles.fleetTracks) trackInfo.push('fleet tracks');
  if (a.toggles.gfwTracks) trackInfo.push('GFW tracks');
  
  if (trackInfo.length > 0) {
    lines.push(`Overlays active: ${trackInfo.join(', ')}.`);
  }
  
  // Always return something
  if (lines.length === 0) {
    lines.push('Analysis complete. Toggle layers ON for environmental data.');
  }
  
  return lines.join('\n');
}
