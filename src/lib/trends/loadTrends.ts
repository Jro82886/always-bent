import type { TrendsInput, TrendsData } from '@/types/trends';
import { getStormio } from './sources/stormio';
import { getDbAgg } from './sources/dbAgg';
import { computePrediction } from './sources/predict';

export async function loadTrends(input: TrendsInput): Promise<TrendsData> {
  // Fetch both sources in parallel
  const [stormio, db] = await Promise.allSettled([
    getStormio(input),
    getDbAgg(input)
  ]);
  
  // Track source statuses
  const sources: TrendsData['sources'] = [];
  const s = stormio.status === 'fulfilled' ? stormio.value : undefined;
  const d = db.status === 'fulfilled' ? db.value : undefined;
  
  // Determine if Stormio data is stale (>30 mins old)
  let stormioStatus: 'ok' | 'stale' | 'error' = 'error';
  if (s) {
    const lastUpdate = new Date(s.lastIso);
    const ageMinutes = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
    stormioStatus = ageMinutes > 30 ? 'stale' : 'ok';
  }
  
  sources.push({ 
    id: 'stormio', 
    status: stormioStatus, 
    lastIso: s?.lastIso 
  });
  
  sources.push({ 
    id: 'db', 
    status: d ? 'ok' : 'error' 
  });
  
  // Compute bite prediction
  const predictionResult = computePrediction({
    moon: s?.moon,
    tides: s?.tides,
    weather: s?.weather,
    range: input.range,
    nowIso: input.nowIso,
    series: d?.activitySeries
  });
  
  // Build tide chart data
  const tideChart: TrendsData['tideChart'] = {
    events: s?.tides?.events || [],
    points: [] // Could be enhanced with curve data if available
  };
  
  // If we have tide events, generate curve points
  if (s?.tides?.curve) {
    tideChart.points = s.tides.curve;
  }
  
  return {
    envBar: {
      moon: s?.moon ?? { phase: 'Unknown', illumPct: 0 },
      nextTide: s?.tides?.next ?? { type: 'low', timeIso: input.nowIso },
      sun: s?.sun ?? { sunriseIso: input.nowIso, sunsetIso: input.nowIso },
      weather: s?.weather ?? {}
    },
    tideChart,
    bitePrediction: {
      best: predictionResult.best,
      periods: predictionResult.periods,
      hourly: predictionResult.hourly
    },
    speciesDistribution: d?.species ?? [],
    activitySeries: d?.activitySeries ?? [],
    insights: predictionResult.insights,
    lastUpdatedIso: new Date().toISOString(),
    sources
  };
}
