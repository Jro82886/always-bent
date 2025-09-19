import { TrendsData } from '@/types/trends';

export function computePrediction({ moon, tides, weather, range, nowIso, series }: {
  moon?: { phase: string; illumPct: number };
  tides?: { next?: { type: 'high' | 'low'; timeIso: string }; events?: any[] };
  weather?: { sstC?: number; windKt?: number; pressureHpa?: number; pressureTrend?: 'rising' | 'falling' | 'steady' };
  range: '1d' | '7d' | '14d';
  nowIso: string;
  series?: Array<{ t: string; reports: number }>;
}): TrendsData['bitePrediction'] & { insights: TrendsData['insights'] } {
  // Base scoring (simple heuristic from spec)
  const w = weather || {};
  let base = 50;
  
  // Moon phase scoring
  if (moon) {
    base += moon.illumPct >= 90 ? 15 : moon.illumPct >= 60 ? 5 : 0;
  }
  
  // Tide scoring
  if (tides?.next?.type === 'high') {
    base += 5;
  }
  
  // Wind scoring
  if (w.windKt != null) {
    base += (w.windKt >= 5 && w.windKt <= 15) ? 10 : (w.windKt > 20 ? -15 : 0);
  }
  
  // Pressure scoring
  if (w.pressureTrend === 'falling') {
    base += 15;
  }
  if (w.pressureHpa && w.pressureHpa > 1015) {
    base -= 10;
  }
  
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  
  // Time-of-day adjustments
  const periods: TrendsData['bitePrediction']['periods'] = [
    { label: 'Morning', activityPct: clamp(base + 5) },
    { label: 'Midday', activityPct: clamp(base - 5) },
    { label: 'Afternoon', activityPct: clamp(base + 10) },
    { label: 'Evening', activityPct: clamp(base + 5) },
  ];
  
  // Best fishing window (dawn to dusk)
  const start = new Date(nowIso);
  start.setHours(6, 0, 0, 0);
  const end = new Date(nowIso);
  end.setHours(20, 0, 0, 0);
  
  // Generate hourly predictions for today
  const hourly: TrendsData['bitePrediction']['hourly'] = [];
  if (range === '1d') {
    for (let h = 0; h < 24; h++) {
      const hourTime = new Date(nowIso);
      hourTime.setHours(h, 0, 0, 0);
      
      // Apply time-of-day modifiers
      let hourScore = base;
      if (h >= 5 && h <= 7) hourScore += 15; // Dawn
      else if (h >= 17 && h <= 19) hourScore += 15; // Dusk
      else if (h >= 11 && h <= 14) hourScore -= 5; // Midday lull
      
      hourly.push({
        tIso: hourTime.toISOString(),
        activityPct: clamp(hourScore),
        expectedBites: Math.floor(clamp(hourScore) / 10) // Simple estimate
      });
    }
  }
  
  // Generate insights
  const insights: TrendsData['insights'] = [];
  
  if (moon && moon.illumPct >= 90) {
    insights.push({
      id: 'moon',
      text: `${moon.phase} phase boosting bite activity`,
      kind: 'moon'
    });
  }
  
  if (w.pressureTrend === 'falling') {
    insights.push({
      id: 'pressure',
      text: 'Falling pressure triggering feeding',
      kind: 'optimal'
    });
  }
  
  if (w.windKt && w.windKt > 20) {
    insights.push({
      id: 'wind',
      text: 'High winds may reduce activity',
      kind: 'break'
    });
  }
  
  if (w.sstC && (w.sstC < 10 || w.sstC > 28)) {
    insights.push({
      id: 'temp',
      text: 'Water temps outside optimal range',
      kind: 'break'
    });
  }
  
  return {
    best: { startIso: start.toISOString(), endIso: end.toISOString() },
    periods,
    hourly,
    insights
  };
}
