/**
 * Water Analysis Generator
 * Creates consistent, informative analysis text based on real ocean data
 */

import { AnalysisResult } from './sst-analyzer';

export interface WaterAnalysisData {
  sst: {
    min: number;
    max: number;
    avg: number;
    range: number;
    gradient: number;
    hasData: boolean;
  };
  chl: {
    min: number;
    max: number;
    avg: number;
    hasData: boolean;
  };
  features: {
    temperatureBreaks: number;
    chlorophyllEdges: number;
    eddies: number;
    convergenceZones: number;
  };
  vessels: {
    commercial: number;
    recreational: number;
    convergenceAreas: number;
  };
  location: {
    lat: number;
    lng: number;
    depth?: number;
    distanceToShelf?: number;
  };
  conditions: {
    moon?: string;
    tide?: string;
    current?: string;
    time: string;
  };
}

/**
 * Generate standardized water analysis text
 */
export function generateWaterAnalysis(data: WaterAnalysisData): string {
  const sections: string[] = [];
  
  // Header
  sections.push('## Water Analysis\n');
  
  // Temperature Analysis
  if (data.sst.hasData) {
    const tempSection = generateTemperatureSection(data.sst, data.features.temperatureBreaks);
    sections.push(tempSection);
  } else {
    sections.push('**Temperature Data:** Not available for this area\n');
  }
  
  // Chlorophyll Analysis
  if (data.chl.hasData) {
    const chlSection = generateChlorophyllSection(data.chl, data.features.chlorophyllEdges);
    sections.push(chlSection);
  } else if (data.sst.hasData) {
    sections.push('**Chlorophyll Data:** Layer not active - toggle CHL to see plankton concentrations\n');
  }
  
  // Feature Detection
  const featureSection = generateFeatureSection(data.features, data.sst.hasData, data.chl.hasData);
  if (featureSection) {
    sections.push(featureSection);
  }
  
  // Vessel Activity
  const vesselSection = generateVesselSection(data.vessels);
  sections.push(vesselSection);
  
  // Conditions & Timing
  const conditionsSection = generateConditionsSection(data.conditions, data.location);
  sections.push(conditionsSection);
  
  // Recommendations
  const recommendations = generateRecommendations(data);
  sections.push(recommendations);
  
  // What to Look For
  const guidance = generateGuidance(data);
  sections.push(guidance);
  
  return sections.join('\n');
}

function generateTemperatureSection(sst: WaterAnalysisData['sst'], breaks: number): string {
  let section = `**Water Temperature:**\n`;
  
  // Temperature range
  section += `• Range: ${sst.min.toFixed(1)}°F - ${sst.max.toFixed(1)}°F (${sst.range.toFixed(1)}°F spread)\n`;
  section += `• Average: ${sst.avg.toFixed(1)}°F\n`;
  
  // Gradient analysis
  if (sst.gradient > 2.0) {
    section += `• **STRONG GRADIENT:** ${sst.gradient.toFixed(1)}°F/mile - Prime conditions! 🎯\n`;
  } else if (sst.gradient > 0.5) {
    section += `• Gradient: ${sst.gradient.toFixed(1)}°F/mile - Good temperature change\n`;
  } else if (sst.gradient > 0.2) {
    section += `• Gradient: ${sst.gradient.toFixed(1)}°F/mile - Mild temperature variation\n`;
  } else {
    section += `• Gradient: Minimal (${sst.gradient.toFixed(1)}°F/mile) - Uniform temperatures\n`;
  }
  
  // Temperature breaks
  if (breaks > 0) {
    section += `• **${breaks} temperature break${breaks > 1 ? 's' : ''} detected**\n`;
  }
  
  // Key isotherms for the region
  const keyTemps = [68, 70, 72, 74, 76];
  const crossedIsotherms = keyTemps.filter(t => t > sst.min && t < sst.max);
  if (crossedIsotherms.length > 0) {
    section += `• Key isotherms in area: ${crossedIsotherms.map(t => `${t}°F`).join(', ')}\n`;
  }
  
  return section;
}

function generateChlorophyllSection(chl: WaterAnalysisData['chl'], edges: number): string {
  let section = `**Chlorophyll (Plankton):**\n`;
  
  // Concentration levels
  const avgChl = chl.avg;
  let productivity = '';
  if (avgChl < 0.5) {
    productivity = 'Low - Clear blue water';
  } else if (avgChl < 1.0) {
    productivity = 'Moderate - Some plankton present';
  } else if (avgChl < 2.0) {
    productivity = 'Good - Productive water';
  } else {
    productivity = 'High - Very productive, likely green water';
  }
  
  section += `• Concentration: ${chl.min.toFixed(2)} - ${chl.max.toFixed(2)} mg/m³\n`;
  section += `• Productivity: ${productivity}\n`;
  
  // Chlorophyll edges
  if (edges > 0) {
    section += `• **${edges} chlorophyll edge${edges > 1 ? 's' : ''} detected** - Baitfish likely!\n`;
  }
  
  // Color water transitions
  if (chl.max - chl.min > 0.5) {
    section += `• Color change detected: Blue to green water transition\n`;
  }
  
  return section;
}

function generateFeatureSection(features: WaterAnalysisData['features'], hasSst: boolean, hasChl: boolean): string | null {
  const detectedFeatures: string[] = [];
  
  if (features.temperatureBreaks > 0 && hasSst) {
    detectedFeatures.push(`${features.temperatureBreaks} temperature break${features.temperatureBreaks > 1 ? 's' : ''}`);
  }
  
  if (features.chlorophyllEdges > 0 && hasChl) {
    detectedFeatures.push(`${features.chlorophyllEdges} chlorophyll edge${features.chlorophyllEdges > 1 ? 's' : ''}`);
  }
  
  if (features.eddies > 0) {
    detectedFeatures.push(`${features.eddies} edd${features.eddies > 1 ? 'ies' : 'y'}`);
  }
  
  if (features.convergenceZones > 0) {
    detectedFeatures.push(`${features.convergenceZones} convergence zone${features.convergenceZones > 1 ? 's' : ''}`);
  }
  
  if (detectedFeatures.length === 0) {
    return null;
  }
  
  return `**Detected Features:**\n• ${detectedFeatures.join(', ')}\n`;
}

function generateVesselSection(vessels: WaterAnalysisData['vessels']): string {
  let section = `**Vessel Activity:**\n`;
  
  if (vessels.commercial > 0) {
    section += `• ${vessels.commercial} commercial vessel${vessels.commercial > 1 ? 's' : ''} (trawlers/longliners)\n`;
  }
  
  if (vessels.recreational > 0) {
    section += `• ${vessels.recreational} recreational boat${vessels.recreational > 1 ? 's' : ''}\n`;
  }
  
  if (vessels.commercial === 0 && vessels.recreational === 0) {
    section += `• No recent vessel activity detected\n`;
  } else if (vessels.convergenceAreas > 0) {
    section += `• Vessels converging in ${vessels.convergenceAreas} area${vessels.convergenceAreas > 1 ? 's' : ''}\n`;
  }
  
  return section;
}

function generateConditionsSection(conditions: WaterAnalysisData['conditions'], location: WaterAnalysisData['location']): string {
  let section = `**Conditions:**\n`;
  
  section += `• Time: ${conditions.time}\n`;
  section += `• Location: ${Math.abs(location.lat).toFixed(3)}°${location.lat >= 0 ? 'N' : 'S'}, ${Math.abs(location.lng).toFixed(3)}°${location.lng >= 0 ? 'E' : 'W'}\n`;
  
  if (conditions.moon) {
    section += `• Moon: ${conditions.moon}\n`;
  }
  
  if (conditions.tide) {
    section += `• Tide: ${conditions.tide}\n`;
  }
  
  if (location.depth) {
    section += `• Depth: ${location.depth} fathoms\n`;
  }
  
  if (location.distanceToShelf) {
    section += `• Distance to shelf: ${location.distanceToShelf.toFixed(1)} nm\n`;
  }
  
  return section;
}

function generateRecommendations(data: WaterAnalysisData): string {
  const recommendations: string[] = [];
  
  // Temperature-based recommendations
  if (data.sst.gradient > 1.0) {
    recommendations.push('**Strong temperature gradient** - Work the warm side of the break');
  }
  
  // Feature-based recommendations
  if (data.features.temperatureBreaks > 0 && data.features.chlorophyllEdges > 0) {
    recommendations.push('**SST and CHL convergence** - Excellent conditions where temperature meets plankton');
  }
  
  // Vessel-based recommendations
  if (data.vessels.commercial > 2) {
    recommendations.push('**Commercial fleet present** - They\'ve found the fish');
  }
  
  // Time-based recommendations
  const hour = new Date().getHours();
  if (hour < 8 || hour > 17) {
    recommendations.push('**Prime time** - Dawn/dusk feeding window');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Continue searching for temperature changes and color breaks');
  }
  
  return `**Recommendations:**\n${recommendations.map(r => `• ${r}`).join('\n')}\n`;
}

function generateGuidance(data: WaterAnalysisData): string {
  let guidance = `**What to Look For:**\n`;
  
  const items: string[] = [];
  
  // Always include these
  items.push('Color transitions on SST layer (red/orange meeting blue/green)');
  items.push('Chlorophyll concentration edges (dark blue meeting light green)');
  items.push('Areas where vessel tracks converge');
  items.push('Structure like ledges, canyons, or current edges');
  
  // Specific guidance based on what's missing
  if (!data.sst.hasData) {
    items.push('**Enable SST layer** to see temperature breaks');
  }
  
  if (!data.chl.hasData && data.sst.hasData) {
    items.push('**Enable CHL layer** to find plankton concentrations');
  }
  
  if (data.sst.gradient < 0.5) {
    items.push('**Expand search area** to find stronger temperature gradients');
  }
  
  if (data.vessels.commercial === 0) {
    items.push('**Check vessel layer** to see where boats are fishing');
  }
  
  // Ideal conditions description
  guidance += items.map(item => `• ${item}`).join('\n');
  guidance += `\n\n**Ideal Prediction Factors:**\n`;
  guidance += `• Temperature break > 2°F/mile with vessel activity\n`;
  guidance += `• Chlorophyll edge coinciding with temperature break\n`;
  guidance += `• Multiple vessels working the same area\n`;
  guidance += `• Favorable moon phase and tide conditions\n`;
  guidance += `• Structure or current convergence nearby\n`;
  
  return guidance;
}

/**
 * Extract analysis data from various sources
 */
export function extractAnalysisData(
  analysis: AnalysisResult,
  vesselData: any,
  weatherData: any,
  bounds: [[number, number], [number, number]]
): WaterAnalysisData {
  const center = [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2
  ];
  
  return {
    sst: {
      min: analysis.stats.min_temp_f,
      max: analysis.stats.max_temp_f,
      avg: analysis.stats.avg_temp_f,
      range: analysis.stats.temp_range_f,
      gradient: analysis.hotspot?.gradient_strength || 0,
      hasData: analysis.layerAnalysis?.sst?.active || false
    },
    chl: {
      min: analysis.layerAnalysis?.chl?.avg_chl_mg_m3 || 0,
      max: analysis.layerAnalysis?.chl?.max_chl_mg_m3 || 0,
      avg: analysis.layerAnalysis?.chl?.avg_chl_mg_m3 || 0,
      hasData: analysis.layerAnalysis?.chl?.active || false
    },
    features: {
      temperatureBreaks: analysis.features.filter(f => f.type === 'edge' || f.type === 'hard_edge').length,
      chlorophyllEdges: 0, // TODO: Extract from CHL analysis
      eddies: analysis.features.filter(f => f.type === 'eddy').length,
      convergenceZones: analysis.layerAnalysis?.convergence?.detected ? 1 : 0
    },
    vessels: {
      commercial: vesselData?.tracks?.filter((t: any) => t.type === 'gfw').length || 0,
      recreational: vesselData?.tracks?.filter((t: any) => t.type === 'individual').length || 0,
      convergenceAreas: 0 // TODO: Calculate vessel clustering
    },
    location: {
      lat: center[1],
      lng: center[0],
      depth: undefined, // TODO: Add bathymetry
      distanceToShelf: undefined // TODO: Calculate distance
    },
    conditions: {
      moon: weatherData?.moonPhase || undefined,
      tide: weatherData?.tide?.stage || undefined,
      current: undefined, // TODO: Add current data
      time: new Date().toLocaleString()
    }
  };
}
