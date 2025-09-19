export type TimeRange = '1d' | '7d' | '14d';

export interface TrendsInput {
  inletId: string;         // 'overview' or inlet id
  range: TimeRange;        // 1d | 7d | 14d
  nowIso: string;          // new Date().toISOString()
}

export interface TrendsData {
  envBar: {
    moon: { phase: string; illumPct: number };
    nextTide: { type: 'high' | 'low'; timeIso: string; heightM?: number };
    sun: { sunriseIso: string; sunsetIso: string };
    weather: {
      sstC?: number; 
      windKt?: number; 
      windDir?: string;
      swellFt?: number; 
      swellPeriodS?: number;
      pressureHpa?: number; 
      pressureTrend?: 'rising' | 'falling' | 'steady';
    };
  };
  tideChart: {
    events: Array<{ type: 'high' | 'low'; timeIso: string; heightM: number }>;
    points: Array<{ tIso: string; heightM: number }>;
  };
  bitePrediction: {
    best: { startIso: string; endIso: string };
    periods: Array<{ label: 'Morning' | 'Midday' | 'Afternoon' | 'Evening'; activityPct: number }>;
    hourly: Array<{ tIso: string; activityPct: number; expectedBites?: number }>;
  };
  speciesDistribution: Array<{ name: string; pct: number; trending: 'up' | 'down' | 'flat' }>;
  activitySeries: Array<{ t: string; reports: number }>;
  insights: Array<{ id: string; text: string; kind: 'optimal' | 'break' | 'moon' }>;
  lastUpdatedIso: string;
  sources: Array<{ id: 'stormio' | 'db'; status: 'ok' | 'stale' | 'error'; lastIso?: string }>;
}
