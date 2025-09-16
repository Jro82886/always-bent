/**
 * Session management for ABFI
 * Handles persistent login across browser sessions
 */

import { supabase } from './client';

// Default session duration (30 days in seconds)
const DEFAULT_SESSION_DURATION = 30 * 24 * 60 * 60;

/**
 * Check if user has valid session
 * Called on app load to skip login if already authenticated
 */
export async function checkExistingSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session check error:', error);
      return null;
    }
    
    if (session) {
      console.log('✅ Active session found - user stays logged in');
      
      // Refresh token if needed
      const tokenExpiry = session.expires_at || 0;
      const now = Math.floor(Date.now() / 1000);
      const hoursUntilExpiry = (tokenExpiry - now) / 3600;
      
      if (hoursUntilExpiry < 24) {
        // Refresh if less than 24 hours remaining
        console.log('🔄 Refreshing session token...');
        const { data: { session: newSession } } = await supabase.auth.refreshSession();
        return newSession;
      }
      
      return session;
    }
    
    return null;
  } catch (error) {
    console.error('Session check failed:', error);
    return null;
  }
}

/**
 * Set up session persistence
 * @param rememberMe - If true, session persists for 30 days. If false, session ends on browser close.
 */
export async function configureSessionPersistence(rememberMe: boolean = true) {
  if (rememberMe) {
    // Long-lived session (30 days)
    localStorage.setItem('abfi_remember_me', 'true');
    localStorage.setItem('abfi_session_duration', String(DEFAULT_SESSION_DURATION));
  } else {
    // Session only (until browser closes)
    sessionStorage.setItem('abfi_session_only', 'true');
    localStorage.removeItem('abfi_remember_me');
  }
}

/**
 * Get session info for display
 */
export function getSessionInfo() {
  const rememberMe = localStorage.getItem('abfi_remember_me') === 'true';
  const authToken = localStorage.getItem('abfi-auth-token');
  
  if (!authToken) {
    return {
      isLoggedIn: false,
      rememberMe: false,
      sessionType: 'none'
    };
  }
  
  try {
    // Parse the stored session
    const sessionData = JSON.parse(authToken);
    const expiresAt = sessionData.expires_at || 0;
    const now = Math.floor(Date.now() / 1000);
    const isExpired = expiresAt < now;
    
    return {
      isLoggedIn: !isExpired,
      rememberMe,
      sessionType: rememberMe ? 'persistent' : 'session',
      expiresAt: new Date(expiresAt * 1000),
      hoursRemaining: Math.max(0, (expiresAt - now) / 3600)
    };
  } catch {
    return {
      isLoggedIn: false,
      rememberMe: false,
      sessionType: 'none'
    };
  }
}

/**
 * Clear all session data (complete logout)
 */
export async function clearAllSessions() {
  // Sign out from Supabase
  await supabase.auth.signOut();
  
  // Clear all localStorage
  const keysToRemove = [
    'abfi-auth-token',
    'abfi_remember_me',
    'abfi_session_duration',
    'abfi_captain_name',
    'abfi_boat_name',
    'abfi_user_id'
  ];
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  console.log('🔒 All sessions cleared');
}

/**
 * Extend current session
 * Useful for "Keep me logged in" prompts
 */
export async function extendSession() {
  const { data: { session }, error } = await supabase.auth.refreshSession();
  
  if (error) {
    console.error('Failed to extend session:', error);
    return false;
  }
  
  if (session) {
    console.log('✅ Session extended');
    return true;
  }
  
  return false;
}
