/**
 * Debug utilities to help identify and fix hydration issues
 */

export const debugHydration = {
  /**
   * Log SSR vs Client differences
   */
  logEnvironment() {
    console.log('Environment Check:', {
      isServer: typeof window === 'undefined',
      isClient: typeof window !== 'undefined',
      localStorage: typeof window !== 'undefined' ? !!window.localStorage : 'N/A',
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'N/A'
    });
  },

  /**
   * Log localStorage state safely
   */
  logLocalStorage() {
    if (typeof window === 'undefined') {
      console.log('localStorage: Not available (server-side)');
      return;
    }
    
    try {
      const keys = [
        'abfi_setup_complete',
        'abfi_welcome_completed', 
        'abfi_tutorial_completed',
        'abfi_tutorial_skipped',
        'abfi_selected_inlet',
        'abfi_app_mode',
        'abfi_inlet_id',
        'abfi_inlet_name',
        'abfi_mode',
        'abfi_location_enabled',
        'abfi_has_seen_tutorial',
        'abfi_username'
      ];
      
      const state = keys.reduce((acc, key) => {
        acc[key] = window.localStorage.getItem(key);
        return acc;
      }, {} as Record<string, string | null>);
      
      console.log('localStorage state:', state);
    } catch (error) {
      console.warn('Failed to read localStorage:', error);
    }
  },

  /**
   * Monitor for hydration mismatches
   */
  watchForHydrationErrors() {
    if (typeof window === 'undefined') return;
    
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('Hydration') || 
          message.includes('Text content does not match') ||
          message.includes('server-rendered HTML')) {
        console.group('🚨 HYDRATION ERROR DETECTED');
        console.error('Original error:', ...args);
        console.trace('Stack trace:');
        debugHydration.logEnvironment();
        debugHydration.logLocalStorage();
        console.groupEnd();
      }
      originalError.apply(console, args);
    };
  },

  /**
   * Clear all ABFI-related localStorage (for testing)
   */
  clearABFIStorage() {
    if (typeof window === 'undefined') return;
    
    const keys = [
      'abfi_setup_complete',
      'abfi_welcome_completed', 
      'abfi_tutorial_completed',
      'abfi_tutorial_skipped',
      'abfi_selected_inlet',
      'abfi_app_mode',
      'abfi_inlet_id',
      'abfi_inlet_name',
      'abfi_mode',
      'abfi_location_enabled',
      'abfi_has_seen_tutorial',
      'abfi_username'
    ];
    
    keys.forEach(key => {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove ${key}:`, error);
      }
    });
    
    console.log('Cleared ABFI localStorage keys');
  },

  /**
   * Simulate new user state (for testing)
   */
  simulateNewUser() {
    debugHydration.clearABFIStorage();
    console.log('Simulated new user state');
  },

  /**
   * Simulate returning user state (for testing)
   */
  simulateReturningUser() {
    if (typeof window === 'undefined') return;
    
    try {
      window.localStorage.setItem('abfi_setup_complete', 'true');
      window.localStorage.setItem('abfi_welcome_completed', 'true');
      window.localStorage.setItem('abfi_selected_inlet', 'ny-montauk');
      window.localStorage.setItem('abfi_app_mode', 'community');
      console.log('Simulated returning user state');
    } catch (error) {
      console.warn('Failed to simulate returning user:', error);
    }
  }
};

// Auto-enable in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  debugHydration.watchForHydrationErrors();
  
  // Expose debug utils to window for easy access in dev tools
  (window as any).debugHydration = debugHydration;
  
  console.log('🔧 Debug utilities available in window.debugHydration');
  console.log('Available methods:');
  console.log('- window.debugHydration.simulateNewUser()');
  console.log('- window.debugHydration.simulateReturningUser()');
  console.log('- window.debugHydration.clearABFIStorage()');
  console.log('- window.debugHydration.logLocalStorage()');
}
