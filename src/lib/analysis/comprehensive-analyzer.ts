import * as turf from '@turf/turf';
import { getCachedMarineData, analyzeFishingConditions, formatTideStage, formatMoonPhase, getNextTide } from '@/lib/services/marineData';
import { generateWaterAnalysis, extractAnalysisData } from './water-analysis-generator';

interface ComprehensiveAnalysis {
  summary: string;
  hotspot: {
    location: [number, number];
    confidence: number;
    reasoning: string;
  } | null;
  factors: {
    sst: {
      min: number;
      max: number;
      avg: number;
      gradient: number;
      breaks: Array<{ location: [number, number]; strength: number }>;
    };
    vessels: {
      commercial: number;
      recreational: number;
      concentration: [number, number] | null;
    };
    reports: {
      total: number;
      recent: number;
      species: string[];
      cluster: [number, number] | null;
    };
  };
  recommendation: string;
}

/**
 * Generate comprehensive analysis combining all data sources
 */
export async function generateComprehensiveAnalysis(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  sstData: any,
  vesselData: { tracks: any[], summary: string, reports: any[] },
  analysis: any,
  inletId?: string
): Promise<ComprehensiveAnalysis> {
  const bounds = turf.bbox(polygon);
  const [minLng, minLat, maxLng, maxLat] = bounds;
  
  // Extract SST analysis
  const sstFactors = {
    min: analysis.stats?.min_temp_f || 68,
    max: analysis.stats?.max_temp_f || 72,
    avg: analysis.stats?.avg_temp_f || 70,
    gradient: (analysis as any).gradient_strength || 0,
    breaks: [] as Array<{ location: [number, number]; strength: number }>
  };
  
  // Find temperature breaks
  if (analysis.features) {
    sstFactors.breaks = analysis.features
      .filter((f: any) => f.type === 'edge' || f.type === 'front')
      .map((f: any) => ({
        location: f.location,
        strength: f.gradient_strength || 0
      }))
      .sort((a: any, b: any) => b.strength - a.strength)
      .slice(0, 3); // Top 3 breaks
  }
  
  // Analyze vessel concentration
  const commercialTracks = vesselData.tracks.filter(t => t.type === 'gfw');
  const recreationalTracks = vesselData.tracks.filter(t => t.type === 'individual');
  
  let vesselConcentration: [number, number] | null = null;
  if (vesselData.tracks.length > 0) {
    // Find center of vessel activity
    const allPoints = vesselData.tracks.flatMap(t => t.points);
    if (allPoints.length > 0) {
      const centerLng = allPoints.reduce((sum, p) => sum + p[0], 0) / allPoints.length;
      const centerLat = allPoints.reduce((sum, p) => sum + p[1], 0) / allPoints.length;
      vesselConcentration = [centerLng, centerLat];
    }
  }
  
  // Analyze reports
  const recentReports = vesselData.reports.filter(r => {
    const hoursSince = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
    return hoursSince < 48; // Last 48 hours
  });
  
  const species = [...new Set(vesselData.reports
    .map(r => r.species)
    .filter(s => s)
  )] as string[];
  
  let reportCluster: [number, number] | null = null;
  if (vesselData.reports.length > 2) {
    // Find center of report cluster
    const avgLng = vesselData.reports.reduce((sum, r) => sum + (r.lon || r.longitude), 0) / vesselData.reports.length;
    const avgLat = vesselData.reports.reduce((sum, r) => sum + (r.lat || r.latitude), 0) / vesselData.reports.length;
    reportCluster = [avgLng, avgLat];
  }
  
  // IDENTIFY PRIMARY HOTSPOT based on all factors
  let hotspot: ComprehensiveAnalysis['hotspot'] = null;
  let hotspotScore = 0;
  let hotspotReasoning = '';
  
  // Option 1: Strong temperature break with vessel activity
  if (sstFactors.breaks.length > 0 && vesselData.tracks.length > 0) {
    const primaryBreak = sstFactors.breaks[0];
    if (primaryBreak.strength > 0.5) {
      hotspot = {
        location: primaryBreak.location,
        confidence: Math.min(95, 70 + (primaryBreak.strength * 10) + (vesselData.tracks.length * 2)),
        reasoning: `Strong temperature break (${primaryBreak.strength.toFixed(1)}°F/mile) with ${vesselData.tracks.length} vessels active`
      };
      hotspotScore = 90;
    }
  }
  
  // Option 2: Report cluster with moderate SST gradient
  if (!hotspot && reportCluster && sstFactors.gradient > 0.3) {
    hotspot = {
      location: reportCluster,
      confidence: Math.min(85, 60 + (vesselData.reports.length * 5) + (sstFactors.gradient * 20)),
      reasoning: `${vesselData.reports.length} recent reports with ${sstFactors.gradient.toFixed(1)}°F/mile gradient`
    };
    hotspotScore = 80;
  }
  
  // Option 3: Commercial vessel concentration
  if (!hotspot && commercialTracks.length >= 2 && vesselConcentration) {
    hotspot = {
      location: vesselConcentration,
      confidence: Math.min(80, 50 + (commercialTracks.length * 10)),
      reasoning: `${commercialTracks.length} commercial vessels (trawlers/longliners) concentrated here`
    };
    hotspotScore = 70;
  }
  
  // Option 4: Use existing analysis hotspot if available
  if (!hotspot && analysis.hotspot?.location) {
    hotspot = {
      location: analysis.hotspot.location,
      confidence: analysis.hotspot.confidence * 100 || 75,
      reasoning: analysis.hotspot.optimal_approach ? 
        `Temperature convergence zone - approach from ${analysis.hotspot.optimal_approach}` :
        'Ocean conditions favorable for baitfish aggregation'
    };
    hotspotScore = 60;
  }
  
  // Fetch marine data if inlet is provided
  let marineData = null;
  let marineAnalysis = null;
  if (inletId) {
    marineData = await getCachedMarineData(inletId);
    if (marineData) {
      marineAnalysis = analyzeFishingConditions(marineData);
    }
  }
  
  // GENERATE COMPREHENSIVE WRITTEN ANALYSIS
  // Use the new water analysis generator for consistent, informative output
  const analysisData = extractAnalysisData(
    analysis,
    vesselData,
    { moonPhase: marineData?.moon?.phaseText, tide: marineData?.tide },
    [[bounds[0], bounds[1]], [bounds[2], bounds[3]]]
  );
  
  // Generate the new robust analysis
  const waterAnalysis = generateWaterAnalysis(analysisData);
  
  // For now, keep the old summary format but prepend the new analysis
  const oldSummary = await generateAnalysisSummary(
    sstFactors,
    commercialTracks.length,
    recreationalTracks.length,
    vesselData.reports,
    hotspot,
    bounds,
    marineData,
    marineAnalysis
  );
  
  // Combine both for a comprehensive view
  const summary = waterAnalysis + '\n\n---\n\n' + oldSummary;
  
  // GENERATE FISHING RECOMMENDATION
  const recommendation = generateRecommendation(
    hotspot,
    sstFactors,
    species,
    commercialTracks.length > 0
  );
  
  return {
    summary,
    hotspot,
    factors: {
      sst: sstFactors,
      vessels: {
        commercial: commercialTracks.length,
        recreational: recreationalTracks.length,
        concentration: vesselConcentration
      },
      reports: {
        total: vesselData.reports.length,
        recent: recentReports.length,
        species,
        cluster: reportCluster
      }
    },
    recommendation
  };
}

/**
 * Generate detailed written analysis summary
 */
async function generateAnalysisSummary(
  sst: any,
  commercialCount: number,
  recreationalCount: number,
  reports: any[],
  hotspot: any,
  bounds: number[],
  marineData: any,
  marineAnalysis: any
): Promise<string> {
  const [minLng, minLat, maxLng, maxLat] = bounds;
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  
  let summary = `📊 **COMPREHENSIVE ANALYSIS**\n\n`;
  
  // Location context
  summary += `**Location:** ${Math.abs(centerLat).toFixed(2)}°${centerLat >= 0 ? 'N' : 'S'}, ${Math.abs(centerLng).toFixed(2)}°${centerLng >= 0 ? 'E' : 'W'}\n`;
  summary += `**Time:** ${new Date().toLocaleString()}\n`;
  
  // Marine conditions if available
  if (marineData) {
    summary += `\n🌙 **Marine Conditions:**\n`;
    
    if (marineData.moon.phaseText) {
      const moonInfo = formatMoonPhase(marineData.moon);
      summary += `• Moon: ${moonInfo}\n`;
    }
    
    if (marineData.tide.stage) {
      const tideInfo = formatTideStage(marineData.tide.stage, marineData.tide.rateCmPerHr);
      summary += `• Tide: ${tideInfo}\n`;
    }
    
    const nextTide = getNextTide(marineData.tide.extremes);
    if (nextTide) {
      summary += `• Next ${nextTide.type}: ${nextTide.timeUntil} (${nextTide.height.toFixed(1)}m)\n`;
    }
    
    if (marineAnalysis) {
      summary += `• Conditions Score: ${marineAnalysis.score}/100\n`;
    }
  }
  
  summary += `\n`;
  
  // Ocean Conditions
  summary += `🌊 **Ocean Conditions:**\n`;
  summary += `• SST Range: ${sst.min.toFixed(1)}°F - ${sst.max.toFixed(1)}°F (avg ${sst.avg.toFixed(1)}°F)\n`;
  
  if (sst.gradient > 0.5) {
    summary += `• **Strong temperature gradient:** ${sst.gradient.toFixed(1)}°F/mile ⚠️ PRIME CONDITIONS\n`;
  } else if (sst.gradient > 0.3) {
    summary += `• Moderate gradient: ${sst.gradient.toFixed(1)}°F/mile - Good potential\n`;
  } else {
    summary += `• Weak gradient: ${sst.gradient.toFixed(1)}°F/mile - Uniform temperatures\n`;
  }
  
  if (sst.breaks.length > 0) {
    summary += `• ${sst.breaks.length} temperature break${sst.breaks.length > 1 ? 's' : ''} detected\n`;
  }
  
  // Vessel Activity
  summary += `\n🚢 **Vessel Activity:**\n`;
  
  if (commercialCount > 0) {
    summary += `• ${commercialCount} commercial vessel${commercialCount > 1 ? 's' : ''} (GFW: trawlers/longliners)\n`;
  }
  if (recreationalCount > 0) {
    summary += `• ${recreationalCount} recreational boat${recreationalCount > 1 ? 's' : ''} tracked\n`;
  }
  if (commercialCount === 0 && recreationalCount === 0) {
    summary += `• No vessel activity in last 4 days\n`;
  }
  
  // User Reports
  if (reports.length > 0) {
    summary += `\n🎣 **Fishing Reports:**\n`;
    summary += `• ${reports.length} report${reports.length > 1 ? 's' : ''} in this area\n`;
    
    const recentReports = reports.filter(r => {
      const hoursSince = (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60);
      return hoursSince < 48;
    });
    
    if (recentReports.length > 0) {
      summary += `• ${recentReports.length} in last 48 hours\n`;
    }
    
    const species = [...new Set(reports.map(r => r.species).filter(s => s))];
    if (species.length > 0) {
      summary += `• Species: ${species.join(', ')}\n`;
    }
  } else {
    summary += `\n🎣 **Fishing Reports:** No recent reports\n`;
  }
  
  // Hotspot Analysis
  if (hotspot) {
    summary += `\n🎯 **PRIMARY HOTSPOT IDENTIFIED**\n`;
    summary += `• Confidence: ${hotspot.confidence.toFixed(0)}%\n`;
    summary += `• ${hotspot.reasoning}\n`;
  } else {
    summary += `\n📍 **Analysis:** Uniform conditions - no clear hotspot\n`;
  }
  
  return summary;
}

/**
 * Generate fishing recommendation
 */
function generateRecommendation(
  hotspot: any,
  sst: any,
  species: string[],
  hasCommercial: boolean
): string {
  let rec = `\n💡 **RECOMMENDATION:**\n`;
  
  if (hotspot && hotspot.confidence > 80) {
    rec += `✅ **FISH THIS SPOT** - High confidence (${hotspot.confidence.toFixed(0)}%)\n`;
    rec += `• Target the marked hotspot\n`;
    
    if (sst.gradient > 0.5) {
      rec += `• Work the temperature break carefully\n`;
      rec += `• Troll parallel to the break\n`;
    }
    
    if (hasCommercial) {
      rec += `• Commercial vessels present - proven fishing grounds\n`;
    }
    
    if (species.length > 0) {
      rec += `• Recent catches: ${species.join(', ')}\n`;
    }
  } else if (hotspot && hotspot.confidence > 60) {
    rec += `🔍 **EXPLORE WITH CAUTION** - Moderate potential\n`;
    rec += `• Scout the area thoroughly\n`;
    rec += `• Look for bait activity\n`;
    
    if (sst.gradient > 0.3) {
      rec += `• Focus on temperature changes\n`;
    }
  } else {
    rec += `⚠️ **LIMITED POTENTIAL** - Conditions not optimal\n`;
    rec += `• Consider different area or time\n`;
    rec += `• Look for structure or depth changes\n`;
    rec += `• Monitor for condition changes\n`;
  }
  
  // Time-based advice
  const hour = new Date().getHours();
  if (hour < 7 || hour > 18) {
    rec += `\n🌅 Best fishing typically at dawn/dusk\n`;
  }
  
  return rec;
}

export type { ComprehensiveAnalysis };
