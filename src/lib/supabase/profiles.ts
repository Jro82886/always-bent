/**
 * Profile management functions using Supabase
 */

import { supabase } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  captain_name: string;
  boat_name: string;
  home_port?: string;
  email?: string;
  username?: string;
  share_tracks?: boolean;
  share_catches?: boolean;
  experience_level?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Save or update a user profile
 * Uses the Supabase function to handle upsert logic
 */
export async function saveUserProfile(
  userId: string,
  captainName: string,
  boatName: string,
  homePort?: string,
  email?: string
): Promise<{ data: UserProfile | null; error: any }> {
  try {
    // Call the Supabase function
    const { data, error } = await supabase
      .rpc('upsert_user_profile', {
        user_id: userId,
        captain_name_param: captainName,
        boat_name_param: boatName,
        home_port_param: homePort || null,
        email_param: email || null
      })
      .single();

    if (error) throw error;

    return { data: data as UserProfile, error: null };
  } catch (error) {
    console.error('Error saving profile:', error);
    return { data: null, error };
  }
}

/**
 * Get a user's profile with authentication check
 */
export async function getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
  try {
    const { data, error } = await supabase
      .rpc('get_user_profile', {
        user_id: userId
      })
      .single();

    if (error) throw error;

    return { data: data as UserProfile, error: null };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { data: null, error };
  }
}

/**
 * Update user sharing settings
 */
export async function updateProfileSettings(
  userId: string,
  settings: {
    share_tracks?: boolean;
    share_catches?: boolean;
    experience_level?: string;
  }
): Promise<{ success: boolean; error: any }> {
  try {
    const { data, error } = await supabase
      .rpc('update_profile_settings', {
        user_id: userId,
        share_tracks_param: settings.share_tracks,
        share_catches_param: settings.share_catches,
        experience_level_param: settings.experience_level
      });

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating profile settings:', error);
    return { success: false, error };
  }
}

/**
 * Check if a profile exists for a user
 */
export async function profileExists(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Direct profile upsert using the table (fallback method)
 * Use this if the RPC function isn't available yet
 */
export async function upsertProfileDirect(profile: Partial<UserProfile> & { id: string }) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Direct profile upsert error:', error);
    return { data: null, error };
  }
}
