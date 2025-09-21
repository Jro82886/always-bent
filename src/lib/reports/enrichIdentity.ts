/**
 * Identity enrichment for ABFI bite reports
 * Fetches captain and boat information from user profile
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type Identity = { 
  captain: string; 
  boat: string; 
};

/**
 * Get identity information for a user
 * Falls back to Anonymous/— if profile data is missing
 */
export async function getIdentityForUser(
  supabase: SupabaseClient, 
  userId: string
): Promise<Identity> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, boat_name')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.warn(`Failed to fetch profile for user ${userId}:`, error);
      return { captain: 'Anonymous', boat: '—' };
    }

    const captain = data.display_name?.trim() || 'Anonymous';
    const boat = data.boat_name?.trim() || '—';
    
    return { captain, boat };
  } catch (error) {
    console.error('Error in getIdentityForUser:', error);
    return { captain: 'Anonymous', boat: '—' };
  }
}

/**
 * Simple highlight rule for auto-highlighting bites
 * Can be customized based on business logic
 */
export function shouldHighlight(payload: any): boolean {
  // Highlight if:
  // 1. Has species data
  if (Array.isArray(payload.species) && payload.species.length > 0) {
    return true;
  }
  
  // 2. SST is in optimal range (66-72°F)
  if (typeof payload.analysis?.sst === 'number' && 
      payload.analysis.sst >= 66 && 
      payload.analysis.sst <= 72) {
    return true;
  }
  
  // 3. User explicitly flagged it
  return Boolean(payload.highlight);
}
