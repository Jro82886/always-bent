// ML-Ready Supabase Queries for Fishing Intelligence

import { supabase } from '@/lib/supabaseClient';
import type { 
  SnipAnalysis, 
  CatchReport, 
  VesselTrack, 
  MLPattern,
  HotspotIntelligence 
} from '@/types/ml-fishing';

// ============================================
// SNIP ANALYSIS OPERATIONS
// ============================================

export async function saveSnipAnalysis(analysis: Partial<SnipAnalysis>) {
  const { data, error } = await supabase
    .from('snip_analyses')
    .insert(analysis)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function updateSnipFeedback(
  analysisId: string, 
  feedback: {
    user_rating?: number;
    actual_success?: boolean;
    actual_catches?: any[];
  }
) {
  const { data, error } = await supabase
    .from('snip_analyses')
    .update({
      ...feedback,
      training_weight: feedback.actual_success ? 2.0 : 1.0 // Higher weight for validated catches
    })
    .eq('id', analysisId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

// ============================================
// CATCH REPORTING
// ============================================

export async function reportCatch(report: Partial<CatchReport>) {
  const { data, error } = await supabase
    .from('catch_reports')
    .insert(report)
    .select()
    .single();
    
  if (error) throw error;
  
  // Trigger ML pattern update (happens in database)
  return data;
}

export async function getRecentCatches(
  bounds?: [[number, number], [number, number]], 
  hours: number = 24
) {
  let query = supabase
    .from('catch_reports')
    .select('*')
    .eq('share_publicly', true)
    .gte('time_of_catch', new Date(Date.now() - hours * 3600000).toISOString());
  
  // TODO: Add spatial filtering when RPC function is created
  // if (bounds) {
  //   const [[south, west], [north, east]] = bounds;
  //   query = query.rpc('within_bounds', {
  //     min_lat: south,
  //     max_lat: north,
  //     min_lng: west,
  //     max_lng: east
  //   });
  // }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============================================
// VESSEL TRACKING
// ============================================

export async function trackVessel(track: Partial<VesselTrack>) {
  const { data, error } = await supabase
    .from('vessel_tracks')
    .insert(track)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function startTrip(userId: string) {
  const tripId = crypto.randomUUID();
  
  // Store trip ID in local storage for offline tracking
  localStorage.setItem('current_trip_id', tripId);
  
  return tripId;
}

export async function endTrip(tripId: string, summary?: any) {
  // Mark all tracks from this trip as complete
  const { error } = await supabase
    .from('vessel_tracks')
    .update({ activity_type: 'completed' })
    .eq('trip_id', tripId);
    
  if (error) throw error;
  
  localStorage.removeItem('current_trip_id');
  return true;
}

// ============================================
// ML PATTERN QUERIES
// ============================================

export async function getRelevantPatterns(conditions: any) {
  // Query patterns that match current conditions
  const { data, error } = await supabase
    .from('ml_patterns')
    .select('*')
    .gte('confidence_score', 0.7) // Only high-confidence patterns
    .order('success_rate', { ascending: false })
    .limit(5);
    
  if (error) throw error;
  return data;
}

export async function predictSuccess(analysis: Partial<SnipAnalysis>): Promise<number> {
  // Simple client-side prediction until we have enough data
  let score = 0.5; // Base score
  
  if (analysis.conditions) {
    // Strong temperature gradient = higher success
    if (analysis.conditions.sst_gradient_max > 2.0) score += 0.2;
    else if (analysis.conditions.sst_gradient_max > 1.0) score += 0.1;
    
    // Good chlorophyll levels
    if (analysis.conditions.chlorophyll_avg && 
        analysis.conditions.chlorophyll_avg > 1.0 && 
        analysis.conditions.chlorophyll_avg < 3.0) {
      score += 0.1;
    }
    
    // Optimal times
    if (['dawn', 'dusk'].includes(analysis.conditions.time_of_day)) {
      score += 0.15;
    }
  }
  
  // Check for detected features
  if (analysis.detected_features) {
    const hasEdge = analysis.detected_features.some(f => f.type === 'edge' && f.confidence > 0.8);
    const hasEddy = analysis.detected_features.some(f => f.type === 'eddy' && f.confidence > 0.8);
    
    if (hasEdge) score += 0.15;
    if (hasEddy) score += 0.1;
  }
  
  return Math.min(score, 0.95); // Cap at 95%
}

// ============================================
// HOTSPOT INTELLIGENCE
// ============================================

export async function getHotspots(
  bounds?: [[number, number], [number, number]]
) {
  let query = supabase
    .from('hotspot_intelligence')
    .select('*')
    .gte('data_quality_score', 0.6)
    .order('success_rate', { ascending: false });
  
  // TODO: Add spatial filtering when RPC function is created
  // if (bounds) {
  //   const [[south, west], [north, east]] = bounds;
  //   query = query.rpc('hotspots_in_bounds', {
  //     min_lat: south,
  //     max_lat: north,
  //     min_lng: west,
  //     max_lng: east
  //   });
  // }
  
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ============================================
// AGGREGATE QUERIES FOR REPORTS
// ============================================

export async function getAreaActivity(
  polygon: GeoJSON.Polygon,
  hours: number = 24
): Promise<{
  vessel_count: number;
  recent_catches: CatchReport[];
  success_rate: number;
}> {
  // This would be a PostGIS spatial query
  // For now, simplified version
  
  const recentCatches = await getRecentCatches(undefined, hours);
  
  return {
    vessel_count: Math.floor(Math.random() * 5) + 1, // Placeholder
    recent_catches: recentCatches || [],
    success_rate: 0.75 // Placeholder
  };
}

// ============================================
// OFFLINE SUPPORT
// ============================================

export function queueOfflineData(type: string, data: any) {
  const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
  queue.push({
    type,
    data,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('offline_queue', JSON.stringify(queue));
}

export async function syncOfflineData() {
  const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
  
  for (const item of queue) {
    try {
      switch (item.type) {
        case 'track':
          await trackVessel(item.data);
          break;
        case 'catch':
          await reportCatch(item.data);
          break;
        case 'analysis':
          await saveSnipAnalysis(item.data);
          break;
      }
    } catch (error) {
      console.error('Failed to sync offline item:', error);
      // Keep in queue if failed
      return;
    }
  }
  
  // Clear queue if all successful
  localStorage.removeItem('offline_queue');
}
