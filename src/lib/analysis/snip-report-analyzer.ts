/**
 * Enhanced Snip Report Analyzer
 * Provides comprehensive analysis of user-drawn polygons including:
 * - Temperature analysis with breaks
 * - Chlorophyll/water quality analysis
 * - Fleet activity integration
 * - Trend analysis
 * - Narrative generation
 */

import * as turf from '@turf/turf';
import { getTemperatureFromColor, findBestTemperatureBreak } from './sst-color-mapping';
import { detectOceanographicFeatures } from './oceanographic-features';
import { getGFWVesselsInArea } from '../services/gfw';
import { fetchHistoricalData, calculateTrend, calculateChlTrend } from './historical-data-fetcher';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS for server-side queries
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface SnipAnalysisReport {
  temperature: TemperatureAnalysis;
  chlorophyll: ChlorophyllAnalysis;
  fleetActivity: FleetActivity;
  trends: TrendAnalysis;
  oceanFeatures: OceanFeatures;
  narrative: NarrativeSummary;
  score: SnipScore;
  metadata: {
    timestamp: string;
    areaKm2: number;
    centerPoint: [number, number];
    dataQuality: 'high' | 'medium' | 'low';
  };
}

export interface TemperatureAnalysis {
  currentAvgF: number;
  currentAvgC: number;
  minF: number;
  maxF: number;
  rangeBar: {
    min: number;
    max: number;
    avg: number;
    unit: 'F' | 'C';
  };
  bestBreak: {
    location: [number, number];
    strengthF: number;
    strengthC: number;
    description: string;
    side: 'shallow' | 'deep';
  } | null;
  gradientMap: Array<{
    lat: number;
    lng: number;
    gradientF: number;
  }>;
}

export interface ChlorophyllAnalysis {
  currentAvgMgM3: number;
  minMgM3: number;
  maxMgM3: number;
  rangeBar: {
    min: number;
    max: number;
    avg: number;
  };
  clarityScale: {
    value: number;
    label: 'Dirty' | 'Clean' | 'Green' | 'Green-Blue' | 'Blue' | 'Cobalt Blue';
    color: string;
  };
  waterQualityBreak: {
    location: [number, number];
    strengthMgM3: number;
    description: string;
  } | null;
}

export interface FleetActivity {
  vessels: Array<{
    id: string;
    name: string;
    type: string;
    activity: string;
    dwellTimeHours: number;
    lastSeen: string;
    position: [number, number];
  }>;
  userReports: {
    caught: number;
    noCatch: number;
    totalReports: number;
    hotSpots: Array<[number, number]>;
  };
  density: 'high' | 'medium' | 'low' | 'none';
}

export interface TrendAnalysis {
  sst: {
    sevenDay: {
      deltaF: number;
      deltaC: number;
      trend: 'warming' | 'cooling' | 'stable';
      description: string;
    };
    fourteenDay: {
      deltaF: number;
      deltaC: number;
      trend: 'warming' | 'cooling' | 'stable';
      description: string;
    };
  };
  chl: {
    sevenDay: {
      deltaMgM3: number;
      trend: 'greening' | 'clearing' | 'stable';
      description: string;
    };
    fourteenDay: {
      deltaMgM3: number;
      trend: 'greening' | 'clearing' | 'stable';
      description: string;
    };
  };
}

export interface OceanFeatures {
  edges: number;
  filaments: number;
  eddies: number;
  features: Array<{
    type: string;
    strength: number;
    location: [number, number];
  }>;
}

export interface NarrativeSummary {
  overview: string;
  tacticalAdvice: string;
  keyFactors: string[];
  warnings: string[];
}

export interface SnipScore {
  total: number; // 0-100
  breakdown: {
    temperatureGradient: number; // 0-20
    chlorophyll: number; // 0-20
    fleetActivity: number; // 0-20
    userReports: number; // 0-20
    trendAlignment: number; // 0-20
  };
  category: 'Poor' | 'Fair' | 'Strong';
  color: string;
}

/**
 * Main analysis function for snip reports
 */
export async function analyzeSnipArea(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  pixelData: Array<{
    lat: number;
    lng: number;
    r: number;
    g: number;
    b: number;
    type: 'sst' | 'chl';
  }>,
  options: {
    date?: Date;
    includeFleet?: boolean;
    includeTrends?: boolean;
    includeUserReports?: boolean;
  } = {}
): Promise<SnipAnalysisReport> {
  const {
    date = new Date(),
    includeFleet = true,
    includeTrends = true,
    includeUserReports = true
  } = options;

  // Calculate area and center
  const areaKm2 = turf.area(polygon) / 1000000;
  const center = turf.centroid(polygon).geometry.coordinates as [number, number];
  const bounds = turf.bbox(polygon) as [number, number, number, number];

  // Separate SST and CHL pixels
  const sstPixels = pixelData.filter(p => p.type === 'sst');
  const chlPixels = pixelData.filter(p => p.type === 'chl');

  // Analyze temperature
  const temperatureAnalysis = analyzeTemperature(sstPixels, polygon);

  // Analyze chlorophyll
  const chlorophyllAnalysis = analyzeChlorophyll(chlPixels);

  // Get fleet activity
  const fleetActivity = await analyzeFleetActivity(bounds, date, includeFleet);

  // Calculate trends (if enabled)
  const trends = includeTrends ?
    await calculateTrends(polygon, date, temperatureAnalysis.currentAvgF, chlorophyllAnalysis.currentAvgMgM3) :
    createEmptyTrends();

  // Detect ocean features
  const oceanFeatures = await detectFeatures(sstPixels, bounds);

  // Calculate score
  const score = calculateSnipScore(
    temperatureAnalysis,
    chlorophyllAnalysis,
    fleetActivity,
    trends
  );

  // Generate narrative
  const narrative = generateNarrative(
    temperatureAnalysis,
    chlorophyllAnalysis,
    fleetActivity,
    trends,
    oceanFeatures,
    score
  );

  // Determine data quality
  const dataQuality = determineDataQuality(sstPixels.length, chlPixels.length);

  return {
    temperature: temperatureAnalysis,
    chlorophyll: chlorophyllAnalysis,
    fleetActivity,
    trends,
    oceanFeatures,
    narrative,
    score,
    metadata: {
      timestamp: new Date().toISOString(),
      areaKm2,
      centerPoint: center,
      dataQuality
    }
  };
}

/**
 * Analyze temperature data
 */
function analyzeTemperature(
  pixels: Array<{ lat: number; lng: number; r: number; g: number; b: number }>,
  polygon: GeoJSON.Feature<GeoJSON.Polygon>
): TemperatureAnalysis {
  if (pixels.length === 0) {
    return createEmptyTemperatureAnalysis();
  }

  // Convert pixels to temperatures
  const temps = pixels.map(p => {
    const temp = getTemperatureFromColor(p.r, p.g, p.b);
    return {
      ...p,
      tempF: temp?.tempF || 0,
      tempC: temp?.tempC || 0
    };
  }).filter(t => t.tempF > 0);

  if (temps.length === 0) {
    return createEmptyTemperatureAnalysis();
  }

  const tempValues = temps.map(t => t.tempF);
  const minF = Math.min(...tempValues);
  const maxF = Math.max(...tempValues);
  const avgF = tempValues.reduce((a, b) => a + b, 0) / tempValues.length;

  // Find best temperature break
  const bestBreak = findBestTemperatureBreak(pixels);

  // Calculate gradients
  const gradientMap: Array<{ lat: number; lng: number; gradientF: number }> = [];
  for (let i = 0; i < temps.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 10, temps.length); j++) {
      const distance = turf.distance(
        [temps[i].lng, temps[i].lat],
        [temps[j].lng, temps[j].lat],
        { units: 'miles' }
      );

      if (distance > 0 && distance <= 2) {
        const gradient = Math.abs(temps[j].tempF - temps[i].tempF) / distance;
        if (gradient > 0.5) { // Only include significant gradients
          gradientMap.push({
            lat: (temps[i].lat + temps[j].lat) / 2,
            lng: (temps[i].lng + temps[j].lng) / 2,
            gradientF: gradient
          });
        }
      }
    }
  }

  // Determine shallow vs deep side of break
  let breakSide: 'shallow' | 'deep' = 'shallow';
  if (bestBreak) {
    // Check if break is closer to shore (western side for East Coast)
    const center = turf.centroid(polygon).geometry.coordinates;
    breakSide = bestBreak.lng > center[0] ? 'deep' : 'shallow';
  }

  return {
    currentAvgF: Math.round(avgF * 10) / 10,
    currentAvgC: Math.round((avgF - 32) * 5 / 9 * 10) / 10,
    minF: Math.round(minF * 10) / 10,
    maxF: Math.round(maxF * 10) / 10,
    rangeBar: {
      min: minF,
      max: maxF,
      avg: avgF,
      unit: 'F'
    },
    bestBreak: bestBreak ? {
      location: [bestBreak.lng, bestBreak.lat],
      strengthF: bestBreak.deltaF,
      strengthC: bestBreak.deltaF * 5 / 9,
      description: bestBreak.description,
      side: breakSide
    } : null,
    gradientMap
  };
}

/**
 * Analyze chlorophyll data
 */
function analyzeChlorophyll(
  pixels: Array<{ lat: number; lng: number; r: number; g: number; b: number }>
): ChlorophyllAnalysis {
  if (pixels.length === 0) {
    return createEmptyChlorophyllAnalysis();
  }

  // Convert pixel colors to chlorophyll values
  const chlValues = pixels.map(p => {
    // Turbo colormap conversion (simplified)
    const greenness = p.g / Math.max(p.r, p.b, 1);
    const yellowness = Math.min(p.r, p.g) / 255;

    let mgM3 = 0;
    if (greenness > 1.5) {
      mgM3 = 0.5 + greenness * 2;
    } else if (yellowness > 0.5) {
      mgM3 = 5 + yellowness * 5;
    } else {
      mgM3 = 0.1 + (p.b / 255) * 0.4;
    }

    return {
      ...p,
      mgM3
    };
  });

  const values = chlValues.map(v => v.mgM3);
  const minMgM3 = Math.min(...values);
  const maxMgM3 = Math.max(...values);
  const avgMgM3 = values.reduce((a, b) => a + b, 0) / values.length;

  // Determine clarity scale
  let clarityLabel: ChlorophyllAnalysis['clarityScale']['label'];
  let clarityColor: string;

  if (avgMgM3 > 10) {
    clarityLabel = 'Dirty';
    clarityColor = '#8B4513'; // Brown
  } else if (avgMgM3 > 5) {
    clarityLabel = 'Green';
    clarityColor = '#00FF00'; // Green
  } else if (avgMgM3 > 2) {
    clarityLabel = 'Green-Blue';
    clarityColor = '#00CED1'; // Dark turquoise
  } else if (avgMgM3 > 1) {
    clarityLabel = 'Blue';
    clarityColor = '#0000FF'; // Blue
  } else if (avgMgM3 > 0.5) {
    clarityLabel = 'Clean';
    clarityColor = '#87CEEB'; // Sky blue
  } else {
    clarityLabel = 'Cobalt Blue';
    clarityColor = '#0047AB'; // Cobalt blue
  }

  // Find water quality break
  let waterQualityBreak = null;
  let maxGradient = 0;
  let breakLocation: [number, number] = [0, 0];

  for (let i = 0; i < chlValues.length - 1; i++) {
    for (let j = i + 1; j < Math.min(i + 10, chlValues.length); j++) {
      const distance = turf.distance(
        [chlValues[i].lng, chlValues[i].lat],
        [chlValues[j].lng, chlValues[j].lat],
        { units: 'miles' }
      );

      if (distance > 0 && distance <= 2) {
        const gradient = Math.abs(chlValues[j].mgM3 - chlValues[i].mgM3) / distance;
        if (gradient > maxGradient) {
          maxGradient = gradient;
          breakLocation = [
            (chlValues[i].lng + chlValues[j].lng) / 2,
            (chlValues[i].lat + chlValues[j].lat) / 2
          ];
        }
      }
    }
  }

  if (maxGradient > 0.5) {
    waterQualityBreak = {
      location: breakLocation,
      strengthMgM3: maxGradient,
      description: maxGradient > 2 ? 'Strong color break' : 'Moderate color break'
    };
  }

  return {
    currentAvgMgM3: Math.round(avgMgM3 * 100) / 100,
    minMgM3: Math.round(minMgM3 * 100) / 100,
    maxMgM3: Math.round(maxMgM3 * 100) / 100,
    rangeBar: {
      min: minMgM3,
      max: maxMgM3,
      avg: avgMgM3
    },
    clarityScale: {
      value: avgMgM3,
      label: clarityLabel,
      color: clarityColor
    },
    waterQualityBreak
  };
}

/**
 * Analyze fleet activity
 */
async function analyzeFleetActivity(
  bounds: [number, number, number, number],
  date: Date,
  includeFleet: boolean
): Promise<FleetActivity> {
  if (!includeFleet) {
    return createEmptyFleetActivity();
  }

  try {
    // Get vessels from GFW API - make this non-critical so user reports can still be generated
    let vessels: any[] = [];

    try {
      const endDate = date.toISOString();
      const startDate = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days back

      const gfwVessels = await getGFWVesselsInArea(bounds, startDate, endDate);

      vessels = gfwVessels.map(v => {
        const lastPosition = v.positions[v.positions.length - 1];
        const firstPosition = v.positions[0];
        const dwellTime = lastPosition && firstPosition ?
          (new Date(lastPosition.timestamp).getTime() - new Date(firstPosition.timestamp).getTime()) / (1000 * 60 * 60) :
          0;

        return {
          id: v.id,
          name: v.name || `Vessel ${v.mmsi}`,
          type: v.type || 'Commercial',
          activity: 'Fishing',
          dwellTimeHours: Math.round(dwellTime),
          lastSeen: lastPosition?.timestamp || '',
          position: (lastPosition ? [lastPosition.lon, lastPosition.lat] : [0, 0]) as [number, number]
        };
      });

      console.log('[SNIP ANALYZER] Successfully fetched GFW vessels:', vessels.length);
    } catch (gfwError) {
      console.error('[SNIP ANALYZER] GFW API failed, continuing without vessel data:', gfwError);
      // Continue with empty vessels array so user reports can still be generated
    }

    // Determine density
    let density: FleetActivity['density'];
    if (vessels.length === 0) density = 'none';
    else if (vessels.length < 3) density = 'low';
    else if (vessels.length < 10) density = 'medium';
    else density = 'high';

    // Fetch user bite reports from database
    let userReports = {
      caught: 0,
      noCatch: 0,
      totalReports: 0,
      hotSpots: [] as Array<[number, number]>
    };

    try {
      // Query bite reports within the bounds from the last 7 days
      console.log('[SNIP ANALYZER] Querying bite_reports with bounds:', bounds);
      console.log('[SNIP ANALYZER] Date filter:', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const { data: biteReports, error } = await supabase
        .from('bite_reports')
        .select('lat, lon, fish_on, status, created_at')
        .gte('lat', bounds[1])
        .lte('lat', bounds[3])
        .gte('lon', bounds[0])
        .lte('lon', bounds[2])
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .eq('status', 'analyzed');

      console.log('[SNIP ANALYZER] Query result:', {
        error,
        reportsCount: biteReports?.length || 0,
        reports: biteReports
      });

      if (!error && biteReports) {
        // Count caught vs no-catch
        const caught = biteReports.filter(r => r.fish_on === true).length;
        const noCatch = biteReports.filter(r => r.fish_on === false).length;

        // Find hot spots (areas with multiple catches)
        const hotSpots: Array<[number, number]> = [];
        const locationCounts = new Map<string, { lat: number; lon: number; count: number }>();

        biteReports
          .filter(r => r.fish_on === true)
          .forEach(report => {
            // Round to 3 decimal places to group nearby reports
            const key = `${report.lat.toFixed(3)},${report.lon.toFixed(3)}`;
            const existing = locationCounts.get(key);

            if (existing) {
              existing.count++;
            } else {
              locationCounts.set(key, {
                lat: report.lat,
                lon: report.lon,
                count: 1
              });
            }
          });

        // Get locations with 2+ catches
        locationCounts.forEach(loc => {
          if (loc.count >= 2) {
            hotSpots.push([loc.lon, loc.lat]);
          }
        });

        userReports = {
          caught,
          noCatch,
          totalReports: biteReports.length,
          hotSpots
        };

        console.log('[SNIP ANALYZER] Final userReports object:', userReports);
      }
    } catch (error) {
      console.error('[SNIP ANALYZER] Failed to fetch user reports:', error);
      // Keep default empty reports
    }

    console.log('[SNIP ANALYZER] Returning fleet activity with userReports:', userReports);

    return {
      vessels,
      userReports,
      density
    };
  } catch (error) {
    console.error('Fleet analysis failed:', error);
    return createEmptyFleetActivity();
  }
}

/**
 * Calculate trends using historical data
 */
async function calculateTrends(
  polygon: GeoJSON.Feature<GeoJSON.Polygon>,
  currentDate: Date,
  currentSstF: number,
  currentChlMgM3: number
): Promise<TrendAnalysis> {
  try {
    // TEMPORARILY DISABLED: Historical data fetching is slow and returns null anyway
    // When re-enabled, uncomment the following lines and remove the null assignments:
    // const sevenDayData = await fetchHistoricalData(polygon, 7);
    // const fourteenDayData = await fetchHistoricalData(polygon, 14);
    const sevenDayData = null;
    const fourteenDayData = null;

    // Calculate SST trends (with null historical data until re-enabled)
    const sevenDaySstTrend = calculateTrend(
      currentSstF,
      null  // sevenDayData?.avgSstF ?? null
    );

    const fourteenDaySstTrend = calculateTrend(
      currentSstF,
      null  // fourteenDayData?.avgSstF ?? null
    );

    // Calculate CHL trends (with null historical data until re-enabled)
    const sevenDayChlTrend = calculateChlTrend(
      currentChlMgM3,
      null  // sevenDayData?.avgChlMgM3 ?? null
    );

    const fourteenDayChlTrend = calculateChlTrend(
      currentChlMgM3,
      null  // fourteenDayData?.avgChlMgM3 ?? null
    );

    return {
      sst: {
        sevenDay: {
          deltaF: sevenDaySstTrend.delta,
          deltaC: sevenDaySstTrend.delta * 5 / 9,
          trend: sevenDaySstTrend.trend as 'warming' | 'cooling' | 'stable',
          description: sevenDayData
            ? `${sevenDaySstTrend.trend === 'warming' ? 'Warming' : sevenDaySstTrend.trend === 'cooling' ? 'Cooling' : 'Stable'} vs 7-day (${sevenDaySstTrend.delta > 0 ? '+' : ''}${sevenDaySstTrend.delta.toFixed(1)}°F)`
            : 'No 7-day data available'
        },
        fourteenDay: {
          deltaF: fourteenDaySstTrend.delta,
          deltaC: fourteenDaySstTrend.delta * 5 / 9,
          trend: fourteenDaySstTrend.trend as 'warming' | 'cooling' | 'stable',
          description: fourteenDayData
            ? `${fourteenDaySstTrend.trend === 'warming' ? 'Warming' : fourteenDaySstTrend.trend === 'cooling' ? 'Cooling' : 'Stable'} vs 14-day (${fourteenDaySstTrend.delta > 0 ? '+' : ''}${fourteenDaySstTrend.delta.toFixed(1)}°F)`
            : 'No 14-day data available'
        }
      },
      chl: {
        sevenDay: {
          deltaMgM3: sevenDayChlTrend.delta,
          trend: sevenDayChlTrend.trend,
          description: sevenDayData
            ? `${sevenDayChlTrend.trend === 'greening' ? 'Greening' : sevenDayChlTrend.trend === 'clearing' ? 'Clearing' : 'Stable'} vs 7-day (${sevenDayChlTrend.delta > 0 ? '+' : ''}${sevenDayChlTrend.delta.toFixed(2)})`
            : 'No 7-day data available'
        },
        fourteenDay: {
          deltaMgM3: fourteenDayChlTrend.delta,
          trend: fourteenDayChlTrend.trend,
          description: fourteenDayData
            ? `${fourteenDayChlTrend.trend === 'greening' ? 'Greening' : fourteenDayChlTrend.trend === 'clearing' ? 'Clearing' : 'Stable'} vs 14-day (${fourteenDayChlTrend.delta > 0 ? '+' : ''}${fourteenDayChlTrend.delta.toFixed(2)})`
            : 'No 14-day data available'
        }
      }
    };
  } catch (error) {
    console.error('Failed to calculate trends:', error);
    // Return stable trends as fallback
    return createEmptyTrends();
  }
}

/**
 * Detect ocean features
 */
async function detectFeatures(
  sstPixels: Array<{ lat: number; lng: number; r: number; g: number; b: number }>,
  bounds: [number, number, number, number]
): Promise<OceanFeatures> {
  const features = await detectOceanographicFeatures(
    sstPixels.map(p => ({ ...p, r: p.r, g: p.g, b: p.b })),
    [[bounds[0], bounds[1]], [bounds[2], bounds[3]]]
  );

  const edges = features.features.filter(f => f.properties?.type === 'edge').length;
  const filaments = features.features.filter(f => f.properties?.type === 'filament').length;
  const eddies = features.features.filter(f => f.properties?.type === 'eddy').length;

  return {
    edges,
    filaments,
    eddies,
    features: features.features.slice(0, 5).map(f => ({
      type: f.properties?.type || 'unknown',
      strength: f.properties?.score || 0,
      location: f.properties?.centroid || [0, 0]
    }))
  };
}

/**
 * Calculate snip score
 */
function calculateSnipScore(
  temperature: TemperatureAnalysis,
  chlorophyll: ChlorophyllAnalysis,
  fleet: FleetActivity,
  trends: TrendAnalysis
): SnipScore {
  // Temperature & Gradient (20 points)
  let tempScore = 0;
  if (temperature.bestBreak) {
    tempScore = Math.min(20, temperature.bestBreak.strengthF * 5);
  } else if (temperature.maxF - temperature.minF > 2) {
    tempScore = Math.min(20, (temperature.maxF - temperature.minF) * 3);
  }

  // Chlorophyll (20 points)
  let chlScore = 0;
  const idealChl = 2.5; // Ideal chlorophyll level
  const chlDiff = Math.abs(chlorophyll.currentAvgMgM3 - idealChl);
  chlScore = Math.max(0, 20 - chlDiff * 4);

  // Fleet Activity (20 points)
  let fleetScore = 0;
  if (fleet.density === 'high') fleetScore = 20;
  else if (fleet.density === 'medium') fleetScore = 15;
  else if (fleet.density === 'low') fleetScore = 10;

  // User Reports (20 points)
  let reportScore = 10; // Default middle score
  if (fleet.userReports.totalReports > 0) {
    const catchRate = fleet.userReports.caught / fleet.userReports.totalReports;
    reportScore = Math.round(catchRate * 20);
  }

  // Trend Alignment (20 points)
  let trendScore = 0;
  if (trends.sst.sevenDay.trend === 'warming') trendScore += 10;
  if (trends.chl.sevenDay.trend === 'greening') trendScore += 10;

  const total = tempScore + chlScore + fleetScore + reportScore + trendScore;

  let category: SnipScore['category'];
  let color: string;

  if (total >= 70) {
    category = 'Strong';
    color = '#00FF00';
  } else if (total >= 40) {
    category = 'Fair';
    color = '#FFFF00';
  } else {
    category = 'Poor';
    color = '#FF0000';
  }

  return {
    total: Math.round(total),
    breakdown: {
      temperatureGradient: Math.round(tempScore),
      chlorophyll: Math.round(chlScore),
      fleetActivity: Math.round(fleetScore),
      userReports: Math.round(reportScore),
      trendAlignment: Math.round(trendScore)
    },
    category,
    color
  };
}

/**
 * Generate narrative summary
 */
function generateNarrative(
  temperature: TemperatureAnalysis,
  chlorophyll: ChlorophyllAnalysis,
  fleet: FleetActivity,
  trends: TrendAnalysis,
  features: OceanFeatures,
  score: SnipScore
): NarrativeSummary {
  const keyFactors: string[] = [];
  const warnings: string[] = [];

  // Build overview
  let overview = `Area shows ${temperature.currentAvgF}°F average SST with `;
  overview += `${chlorophyll.clarityScale.label.toLowerCase()} water (${chlorophyll.currentAvgMgM3} mg/m³). `;

  if (fleet.vessels.length > 0) {
    overview += `${fleet.vessels.length} vessels active in area. `;
  }

  // Add key factors
  if (temperature.bestBreak) {
    keyFactors.push(`Strong temperature break (${temperature.bestBreak.strengthF.toFixed(1)}°F change)`);
  }

  if (chlorophyll.waterQualityBreak) {
    keyFactors.push(`Water clarity edge detected`);
  }

  if (features.edges > 0) {
    keyFactors.push(`${features.edges} thermal edge${features.edges > 1 ? 's' : ''} identified`);
  }

  if (trends.sst.sevenDay.trend === 'warming') {
    keyFactors.push(`Water warming trend (+${trends.sst.sevenDay.deltaF.toFixed(1)}°F/week)`);
  }

  // Generate tactical advice
  let tacticalAdvice = '';
  if (temperature.bestBreak) {
    tacticalAdvice = `Fish the ${temperature.bestBreak.side} (shore-side) edge of the temperature break. `;
  } else {
    tacticalAdvice = 'Look for structure or bait concentrations in this uniform water. ';
  }

  if (chlorophyll.clarityScale.label === 'Green-Blue' || chlorophyll.clarityScale.label === 'Blue') {
    tacticalAdvice += 'Water clarity is ideal for sight fishing. ';
  }

  // Add warnings
  if (score.total < 40) {
    warnings.push('Conditions are below average - consider alternative locations');
  }

  if (chlorophyll.currentAvgMgM3 > 10) {
    warnings.push('Water quality is poor - visibility will be limited');
  }

  return {
    overview,
    tacticalAdvice,
    keyFactors,
    warnings
  };
}

/**
 * Helper functions for empty/default values
 */
function createEmptyTemperatureAnalysis(): TemperatureAnalysis {
  return {
    currentAvgF: 0,
    currentAvgC: 0,
    minF: 0,
    maxF: 0,
    rangeBar: { min: 0, max: 0, avg: 0, unit: 'F' },
    bestBreak: null,
    gradientMap: []
  };
}

function createEmptyChlorophyllAnalysis(): ChlorophyllAnalysis {
  return {
    currentAvgMgM3: 0,
    minMgM3: 0,
    maxMgM3: 0,
    rangeBar: { min: 0, max: 0, avg: 0 },
    clarityScale: {
      value: 0,
      label: 'Blue',
      color: '#0000FF'
    },
    waterQualityBreak: null
  };
}

function createEmptyFleetActivity(): FleetActivity {
  return {
    vessels: [],
    userReports: {
      caught: 0,
      noCatch: 0,
      totalReports: 0,
      hotSpots: []
    },
    density: 'none'
  };
}

function createEmptyTrends(): TrendAnalysis {
  return {
    sst: {
      sevenDay: { deltaF: 0, deltaC: 0, trend: 'stable', description: 'No trend data' },
      fourteenDay: { deltaF: 0, deltaC: 0, trend: 'stable', description: 'No trend data' }
    },
    chl: {
      sevenDay: { deltaMgM3: 0, trend: 'stable', description: 'No trend data' },
      fourteenDay: { deltaMgM3: 0, trend: 'stable', description: 'No trend data' }
    }
  };
}

function determineDataQuality(sstPixels: number, chlPixels: number): 'high' | 'medium' | 'low' {
  const total = sstPixels + chlPixels;
  if (total > 100) return 'high';
  if (total > 30) return 'medium';
  return 'low';
}