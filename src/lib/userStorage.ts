/**
 * Safe user data storage utilities
 * Provides crash-proof access to localStorage with proper defaults
 */

export interface UserData {
  captainName: string;
  boatName: string;
  vesselType: string;
  homeInlet: string;
}

/**
 * Safely get user data from localStorage with defaults
 */
export function getUserData(): UserData {
  if (typeof window === 'undefined') {
    return getDefaultUserData();
  }

  try {
    return {
      captainName: localStorage.getItem('abfi_captain_name') || 'Unknown Captain',
      boatName: localStorage.getItem('abfi_boat_name') || 'Unnamed Vessel',
      vesselType: localStorage.getItem('abfi_vessel_type') || 'F/V',
      homeInlet: localStorage.getItem('abfi_home_inlet') || 'md-ocean-city'
    };
  } catch (error) {
    console.error('[Storage] Error reading user data:', error);
    return getDefaultUserData();
  }
}

/**
 * Safely set user data in localStorage
 */
export function setUserData(data: Partial<UserData>): void {
  if (typeof window === 'undefined') return;

  try {
    if (data.captainName !== undefined) {
      localStorage.setItem('abfi_captain_name', data.captainName);
    }
    if (data.boatName !== undefined) {
      localStorage.setItem('abfi_boat_name', data.boatName);
    }
    if (data.vesselType !== undefined) {
      localStorage.setItem('abfi_vessel_type', data.vesselType);
    }
    if (data.homeInlet !== undefined) {
      localStorage.setItem('abfi_home_inlet', data.homeInlet);
    }
  } catch (error) {
    console.error('[Storage] Error saving user data:', error);
  }
}

/**
 * Get formatted display name for chat/UI
 */
export function getDisplayName(format: 'chat' | 'formal' | 'vessel' = 'chat'): string {
  const { captainName, boatName, vesselType } = getUserData();
  
  switch (format) {
    case 'chat':
      // Compact format for chat: "John Smith (F/V Sea Dream)"
      return `${captainName} (${vesselType} ${boatName})`;
    
    case 'formal':
      // Formal format for Command Bridge: "Captain John Smith"
      return `Captain ${captainName}`;
    
    case 'vessel':
      // Vessel format for markers: "F/V Sea Dream"
      return `${vesselType} ${boatName}`;
    
    default:
      return `${captainName} (${vesselType} ${boatName})`;
  }
}

/**
 * Get default user data
 */
function getDefaultUserData(): UserData {
  return {
    captainName: 'Unknown Captain',
    boatName: 'Unnamed Vessel',
    vesselType: 'F/V',
    homeInlet: 'md-ocean-city'
  };
}

/**
 * Check if user has completed setup
 */
export function hasUserSetup(): boolean {
  if (typeof window === 'undefined') return false;
  
  const captainName = localStorage.getItem('abfi_captain_name');
  const boatName = localStorage.getItem('abfi_boat_name');
  
  return !!(captainName && boatName);
}
