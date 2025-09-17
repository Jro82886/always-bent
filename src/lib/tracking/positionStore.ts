import { supabase } from '@/lib/supabaseClient';

export interface TrackingPosition {
  id?: string;
  user_id: string;
  boat_name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
  accuracy?: number;
}

export interface TrackingTrail {
  positions: TrackingPosition[];
  startTime: string;
  endTime: string;
  totalDistance: number;
}

/**
 * Store user position in Supabase
 */
export async function storePosition(position: Omit<TrackingPosition, 'id' | 'timestamp'>): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('tracking_positions')
      .insert([{
        ...position,
        timestamp: new Date().toISOString()
      }]);

    if (error) {
      
      return false;
    }

    
    return true;
  } catch (error) {
    
    return false;
  }
}

/**
 * Get tracking trail for a user/boat
 */
export async function getTrackingTrail(
  userId: string, 
  hours: number = 24
): Promise<TrackingTrail | null> {
  try {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    const { data, error } = await supabase
      .from('tracking_positions')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', startTime.toISOString())
      .order('timestamp', { ascending: true });

    if (error) {
      
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      totalDistance += calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
    }

    return {
      positions: data,
      startTime: data[0].timestamp,
      endTime: data[data.length - 1].timestamp,
      totalDistance: Math.round(totalDistance * 100) / 100 // Round to 2 decimals
    };
  } catch (error) {
    
    return null;
  }
}

/**
 * Get current position for a user
 */
export async function getCurrentPosition(userId: string): Promise<TrackingPosition | null> {
  try {
    const { data, error } = await supabase
      .from('tracking_positions')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      
      return null;
    }

    return data;
  } catch (error) {
    
    return null;
  }
}

/**
 * Calculate distance between two points in nautical miles
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
