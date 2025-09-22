/**
 * Smart Water Analysis
 * User-controlled analysis that provides insights based on what's enabled
 * Coaches users naturally without enforcing rules
 */

import { AnalysisResult } from './sst-analyzer';

export interface AnalysisContext {
  // What the user has enabled
  layers: {
    sst: boolean;
    chl: boolean;
    vessels: boolean;
  };
  
  // Available data
  data: {
    sst?: {
      min: number;
      max: number;
      avg: number;
      gradient: number;
      breaks: number;
    };
    chl?: {
      min: number;
      max: number;
      avg: number;
      edges: number;
    };
    vessels?: {
      commercial: number;
      recreational: number;
      types: string[];
    };
    weather?: {
      inlet: any;
      offshore: any;
      moon: string;
      tide: string;
    };
    location: {
      lat: number;
      lng: number;
      nearestCanyon?: string;
      depth?: number;
    };
    recentReports?: {
      count: number;
      species: string[];
      quality: number;
    };
  };
}

/**
 * Generate organized, sectioned analysis
 */
export function generateSmartAnalysis(context: AnalysisContext): string {
  const sections: string[] = [];
  
  // Header with location context
  sections.push(generateLocationHeader(context));
  
  // Ocean Intelligence Section
  if (context.layers.sst || context.layers.chl) {
    sections.push(generateOceanIntelligence(context));
  }
  
  // Vessel Intelligence Section
  if (context.layers.vessels && context.data.vessels) {
    sections.push(generateVesselIntelligence(context));
  }
  
  // Environmental Conditions
  sections.push(generateEnvironmentalConditions(context));
  
  // Local Knowledge
  if (context.data.recentReports || context.data.location.nearestCanyon) {
    sections.push(generateLocalKnowledge(context));
  }
  
  // Fishing Intel
  sections.push(generateFishingIntel(context));
  
  // Coaching Section (gentle suggestions)
  const coaching = generateCoaching(context);
  if (coaching) {
    sections.push(coaching);
  }
  
  return sections.join('\n\n');
}

function generateLocationHeader(context: AnalysisContext): string {
  const { lat, lng, nearestCanyon } = context.data.location;
  const time = new Date().toLocaleString('en-US', { 
    timeZone: 'America/New_York',
    dateStyle: 'short',
    timeStyle: 'short'
  });
  
  let header = `# <span class="text-cyan-400 inline-block">◆</span> Analysis Report\n`;
  header += `**Location:** ${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(3)}°${lng >= 0 ? 'E' : 'W'}\n`;
  header += `**Time:** ${time} ET\n`;
  
  if (nearestCanyon) {
    header += `**Area:** Near ${nearestCanyon}\n`;
  }
  
  return header;
}

function generateOceanIntelligence(context: AnalysisContext): string {
  let section = `## <span class="text-blue-400 glow-blue">⬢</span> Ocean Intelligence\n`;
  
  // SST Analysis
  if (context.layers.sst && context.data.sst) {
    const { min, max, avg, gradient, breaks } = context.data.sst;
    
    section += `### Water Temperature\n`;
    section += `- **Range:** ${min.toFixed(1)}°F - ${max.toFixed(1)}°F\n`;
    section += `- **Average:** ${avg.toFixed(1)}°F\n`;
    
    if (gradient > 2.0) {
      section += `- **<span class="text-orange-400 glow-orange">▲</span> Strong Gradient:** ${gradient.toFixed(1)}°F/mile - Prime edge!\n`;
    } else if (gradient > 0.5) {
      section += `- **Gradient:** ${gradient.toFixed(1)}°F/mile - Good temperature change\n`;
    } else {
      section += `- **Gradient:** ${gradient.toFixed(1)}°F/mile - Fairly uniform\n`;
    }
    
    if (breaks > 0) {
      section += `- **Temperature Breaks:** ${breaks} detected\n`;
    }
  }
  
  // CHL Analysis
  if (context.layers.chl && context.data.chl) {
    const { min, max, avg, edges } = context.data.chl;
    
    section += `\n### Chlorophyll (Plankton)\n`;
    section += `- **Concentration:** ${min.toFixed(2)} - ${max.toFixed(2)} mg/m³\n`;
    
    // Productivity assessment
    if (avg < 0.5) {
      section += `- **Water Clarity:** Blue water - Low plankton\n`;
    } else if (avg < 1.5) {
      section += `- **Water Clarity:** Blue-green - Moderate plankton\n`;
    } else {
      section += `- **Water Clarity:** Green water - High plankton\n`;
    }
    
    if (edges > 0) {
      section += `- **<span class="text-green-400 glow-green">▲</span> Color Edges:** ${edges} detected - Baitfish likely!\n`;
    }
  }
  
  // Convergence analysis if both layers active
  if (context.layers.sst && context.layers.chl && context.data.sst && context.data.chl) {
    if (context.data.sst.breaks > 0 && context.data.chl.edges > 0) {
      section += `\n### <span class="text-red-500 glow-red">◈</span> Convergence Zone\n`;
      section += `Temperature breaks meeting chlorophyll edges - **Excellent conditions!**\n`;
    }
  }
  
  return section;
}

function generateVesselIntelligence(context: AnalysisContext): string {
  let section = `## <span class="text-purple-400 glow-purple">⬡</span> Vessel Intelligence\n`;
  
  const vessels = context.data.vessels!;
  
  if (vessels.commercial > 0) {
    section += `- **Commercial Fleet:** ${vessels.commercial} vessel${vessels.commercial > 1 ? 's' : ''}\n`;
    if (vessels.types.length > 0) {
      section += `  - Types: ${vessels.types.join(', ')}\n`;
    }
  }
  
  if (vessels.recreational > 0) {
    section += `- **Recreational Boats:** ${vessels.recreational} tracked\n`;
  }
  
  if (vessels.commercial === 0 && vessels.recreational === 0) {
    section += `- No recent vessel activity in this area\n`;
  } else if (vessels.commercial > 2) {
    section += `- **Note:** Commercial concentration indicates productive waters\n`;
  }
  
  return section;
}

function generateEnvironmentalConditions(context: AnalysisContext): string {
  let section = `## <span class="text-indigo-400 glow-indigo">◉</span> Environmental Conditions\n`;
  
  const weather = context.data.weather;
  
  if (weather) {
    // Inlet conditions
    if (weather.inlet) {
      section += `### Inlet Conditions\n`;
      section += `- **Wind:** ${weather.inlet.wind || 'Data pending'}\n`;
      section += `- **Seas:** ${weather.inlet.seas || 'Data pending'}\n`;
    }
    
    // Offshore conditions
    if (weather.offshore) {
      section += `\n### Offshore Conditions\n`;
      section += `- **Wind:** ${weather.offshore.wind || 'Data pending'}\n`;
      section += `- **Seas:** ${weather.offshore.seas || 'Data pending'}\n`;
    }
    
    // Moon and Tide
    if (weather.moon || weather.tide) {
      section += `\n### Celestial & Tidal\n`;
      if (weather.moon) {
        section += `- **Moon Phase:** ${weather.moon}\n`;
      }
      if (weather.tide) {
        section += `- **Tide:** ${weather.tide}\n`;
      }
    }
  } else {
    section += `- Weather data loading...\n`;
  }
  
  return section;
}

function generateLocalKnowledge(context: AnalysisContext): string {
  let section = `## <span class="text-amber-400 glow-amber">◇</span> Local Knowledge\n`;
  
  // Canyon information
  if (context.data.location.nearestCanyon) {
    section += `### ${context.data.location.nearestCanyon}\n`;
    section += getCanyonInfo(context.data.location.nearestCanyon);
    section += '\n';
  }
  
  // Recent reports
  if (context.data.recentReports && context.data.recentReports.count > 0) {
    section += `### Recent Activity\n`;
    section += `- **Reports:** ${context.data.recentReports.count} in last 48 hours\n`;
    
    if (context.data.recentReports.species.length > 0) {
      section += `- **Species:** ${context.data.recentReports.species.join(', ')}\n`;
    }
    
    if (context.data.recentReports.quality > 3) {
      section += `- **Quality:** Above average catches reported\n`;
    }
  }
  
  return section;
}

function generateFishingIntel(context: AnalysisContext): string {
  let section = `## <span class="text-teal-400 glow-teal">⬢</span> Fishing Intel\n`;
  
  const factors: string[] = [];
  
  // Analyze positive factors
  if (context.data.sst && context.data.sst.gradient > 1.0) {
    factors.push('<span class="text-green-400">✓</span> Strong temperature gradient present');
  }
  
  if (context.data.chl && context.data.chl.edges > 0) {
    factors.push('<span class="text-green-400">✓</span> Chlorophyll edges detected');
  }
  
  if (context.data.vessels && context.data.vessels.commercial > 0) {
    factors.push('<span class="text-green-400">✓</span> Commercial fleet working area');
  }
  
  if (context.data.weather?.moon && ['New Moon', 'Full Moon'].includes(context.data.weather.moon)) {
    factors.push('<span class="text-green-400">✓</span> Favorable moon phase');
  }
  
  if (factors.length > 0) {
    section += `### Positive Factors\n`;
    section += factors.join('\n') + '\n';
  }
  
  // Key targets based on conditions
  section += `\n### Target Species (Based on Conditions)\n`;
  if (context.data.sst && context.data.sst.avg > 72) {
    section += `- Mahi, Wahoo (warm water present)\n`;
  } else if (context.data.sst && context.data.sst.avg < 68) {
    section += `- Bluefin Tuna (cool water present)\n`;
  } else {
    section += `- Yellowfin Tuna, Bigeye (optimal temps)\n`;
  }
  
  return section;
}

function generateCoaching(context: AnalysisContext): string {
  const suggestions: string[] = [];
  
  // Only suggest if it would significantly improve the analysis
  if (!context.layers.sst && context.layers.chl) {
    suggestions.push('<span class="text-yellow-400 glow-yellow">◈</span> **Tip:** Adding SST layer would show temperature breaks - key for finding feeding zones');
  }
  
  if (!context.layers.chl && context.layers.sst && context.data.sst && context.data.sst.gradient > 0.5) {
    suggestions.push('<span class="text-yellow-400 glow-yellow">◈</span> **Tip:** Adding CHL layer would reveal if baitfish are present at this temperature break');
  }
  
  if (!context.layers.vessels && (context.layers.sst || context.layers.chl)) {
    suggestions.push('<span class="text-yellow-400 glow-yellow">◈</span> **Tip:** Toggling Commercial Vessels would show if boats are working this area');
  }
  
  // Only return if we have helpful suggestions
  if (suggestions.length > 0) {
    return `## <span class="text-yellow-400 glow-yellow">◆</span> Analysis Tips\n${suggestions.join('\n')}`;
  }
  
  return '';
}

function getCanyonInfo(canyon: string): string {
  // Real canyon facts - expand this database
  const canyonFacts: { [key: string]: string } = {
    'Hudson Canyon': 'The largest submarine canyon on the East Coast. Known for excellent tuna and tilefish fishing, especially where the 100 fathom curve meets temperature breaks.',
    'Baltimore Canyon': 'A productive canyon system with steep walls that create upwelling. Famous for bigeye tuna at night and yellowfin during the day.',
    'Washington Canyon': 'Features dramatic depth changes from 50 to 500 fathoms. The eastern wall is particularly productive for billfish in late summer.',
    'Norfolk Canyon': 'Where the Gulf Stream often touches the shelf edge. Known for early season yellowfin and excellent white marlin fishing.',
    'Poor Mans Canyon': 'Despite its name, consistently produces quality fish. The 30 fathom lumps before the drop are mahi magnets in summer.',
    'Wilmington Canyon': 'A narrow, steep canyon that concentrates baitfish. The tip at 70 fathoms is a known wahoo spot when water temps exceed 72°F.',
    'Tom\'s Canyon': 'Smaller canyon but very productive. The west wall creates eddies that hold bait and attract marlin.',
    'Lindenkohl Canyon': 'Often overlooked but excellent when the Gulf Stream pushes in. The 60 fathom fingers are prime for chunking.',
    'Spencer Canyon': 'The inshore lumps at 40-50 fathoms warm first in spring, making it an early season hotspot for yellowfin.',
    'Block Canyon': 'The northernmost major canyon. When warm water reaches here, it concentrates southern species like a funnel.'
  };
  
  return canyonFacts[canyon] || `Known for its productive fishing when conditions align.`;
}

/**
 * Validation - ensure at least one data layer is active
 */
export function canGenerateAnalysis(context: AnalysisContext): boolean {
  return context.layers.sst || context.layers.chl;
}

/**
 * Extract context from various sources
 */
export function buildAnalysisContext(
  analysis: AnalysisResult,
  vesselData: any,
  weatherData: any,
  activeLayers: { sst: boolean; chl: boolean; vessels: boolean },
  location: { lat: number; lng: number }
): AnalysisContext {
  return {
    layers: activeLayers,
    data: {
      sst: activeLayers.sst && analysis.stats ? {
        min: analysis.stats.min_temp_f,
        max: analysis.stats.max_temp_f,
        avg: analysis.stats.avg_temp_f,
        gradient: analysis.hotspot?.gradient_strength || 0,
        breaks: analysis.features.filter(f => f.type === 'edge' || f.type === 'hard_edge').length
      } : undefined,
      chl: activeLayers.chl && analysis.layerAnalysis?.chl ? {
        min: 0, // TODO: Get actual min
        max: analysis.layerAnalysis.chl.max_chl_mg_m3 || 0,
        avg: analysis.layerAnalysis.chl.avg_chl_mg_m3 || 0,
        edges: 0 // TODO: Count actual edges
      } : undefined,
      vessels: activeLayers.vessels && vesselData ? {
        commercial: vesselData.tracks?.filter((t: any) => t.type === 'gfw').length || 0,
        recreational: vesselData.tracks?.filter((t: any) => t.type === 'individual').length || 0,
        types: ['Trawlers', 'Longliners', 'Drifting Gear'] // TODO: Get actual types
      } : undefined,
      weather: weatherData,
      location: {
        lat: location.lat,
        lng: location.lng,
        nearestCanyon: findNearestCanyon(location.lat, location.lng)
      },
      recentReports: vesselData?.reports ? {
        count: vesselData.reports.length,
        species: [...new Set(vesselData.reports.map((r: any) => r.species).filter(Boolean))] as string[],
        quality: vesselData.reports.reduce((sum: number, r: any) => sum + (r.quality || 3), 0) / vesselData.reports.length
      } : undefined
    }
  };
}

function findNearestCanyon(lat: number, lng: number): string | undefined {
  // Simple canyon positions - expand this
  const canyons = [
    { name: 'Hudson Canyon', lat: 39.5, lng: -72.5 },
    { name: 'Baltimore Canyon', lat: 38.0, lng: -73.8 },
    { name: 'Washington Canyon', lat: 37.8, lng: -74.0 },
    { name: 'Norfolk Canyon', lat: 36.9, lng: -74.7 },
    { name: 'Wilmington Canyon', lat: 38.8, lng: -73.3 }
  ];
  
  // Find closest within 50nm
  let closest = { name: '', distance: Infinity };
  
  for (const canyon of canyons) {
    const distance = Math.sqrt(
      Math.pow(lat - canyon.lat, 2) + Math.pow(lng - canyon.lng, 2)
    ) * 60; // Rough conversion to nautical miles
    
    if (distance < 50 && distance < closest.distance) {
      closest = { name: canyon.name, distance };
    }
  }
  
  return closest.name || undefined;
}
