import { TrendsInput } from '@/types/trends';
import { getSupabase } from "@/lib/supabaseClient"

export async function getDbAgg({ inletId, range }: TrendsInput) {
  const supabase = getSupabase();
  const since = rangeSince(range);
  
  // Activity: hourly for 1d, daily for 7/14d
  const bucket = range === '1d' ? 'hour' : 'day';
  
  // Get activity series
  let activityQuery = supabase
    .from('catch_reports')
    .select('created_at')
    .gte('created_at', since);
    
  if (inletId !== 'overview') {
    activityQuery = activityQuery.eq('selected_inlet', inletId);
  }
  
  const { data: activityData, error: activityError } = await activityQuery;
  
  if (activityError) {
    console.error('Activity query error:', activityError);
    return { activitySeries: [], species: [] };
  }
  
  // Group by time bucket
  const activityMap = new Map<string, number>();
  activityData?.forEach((report: any) => {
    const date = new Date(report.created_at);
    const key = bucket === 'hour' 
      ? `${date.toISOString().slice(0, 13)}:00:00.000Z` // Round to hour
      : date.toISOString().slice(0, 10); // Just the date
    
    activityMap.set(key, (activityMap.get(key) || 0) + 1);
  });
  
  const activitySeries = Array.from(activityMap.entries())
    .map(([t, reports]) => ({ t, reports }))
    .sort((a, b) => a.t.localeCompare(b.t));
  
  // Get species distribution
  let speciesQuery = supabase
    .from('catch_reports')
    .select('species')
    .gte('created_at', since)
    .not('species', 'is', null)
    .not('species', 'eq', '');
    
  if (inletId !== 'overview') {
    speciesQuery = speciesQuery.eq('selected_inlet', inletId);
  }
  
  const { data: speciesData, error: speciesError } = await speciesQuery;
  
  if (speciesError) {
    console.error('Species query error:', speciesError);
    return { activitySeries, species: [] };
  }
  
  // Count species
  const speciesMap = new Map<string, number>();
  speciesData?.forEach((report: any) => {
    if (report.species) {
      speciesMap.set(report.species, (speciesMap.get(report.species) || 0) + 1);
    }
  });
  
  const total = Array.from(speciesMap.values()).reduce((sum, count) => sum + count, 0) || 1;
  
  const species = Array.from(speciesMap.entries())
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .slice(0, 10) // Top 10
    .map(([name, count]) => ({
      name,
      pct: Math.round((count / total) * 100),
      trending: 'flat' as const // TODO: Calculate actual trend
    }));
  
  return { activitySeries, species };
}

function rangeSince(r: '1d' | '7d' | '14d'): string {
  const now = new Date();
  switch(r) {
    case '1d':  
      now.setDate(now.getDate() - 1);
      break;
    case '7d':  
      now.setDate(now.getDate() - 7);
      break;
    case '14d': 
      now.setDate(now.getDate() - 14);
      break;
  }
  return now.toISOString();
}
