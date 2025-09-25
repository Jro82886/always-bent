// Premium Features Integration - Safe, feature-flagged, with fallbacks
import { rum } from './rum';
import { smartCache } from './cache-strategy';
import { SmartRetry } from './smart-retry';
import { PerformanceOptimizer } from './performance-optimizer';
import { dbReplicas } from './db/read-replicas';
import { featureFlags } from './feature-flags';

export class PremiumFeatures {
  private static initialized = false;
  
  // Initialize all premium features safely
  static initialize() {
    if (this.initialized) return;
    
    // Only initialize if premium features are enabled
    if (!featureFlags.isEnabled('premium-features')) {
      console.log('Premium features disabled');
      return;
    }
    
    try {
      // Real User Monitoring
      if (featureFlags.isEnabled('rum')) {
        console.log('✅ RUM initialized');
        // RUM auto-initializes
      }
      
      // Performance Optimizer
      if (featureFlags.isEnabled('performance-optimizer')) {
        PerformanceOptimizer.initialize();
        console.log('✅ Performance Optimizer initialized');
      }
      
      // Smart Cache warming
      if (featureFlags.isEnabled('smart-cache')) {
        this.warmCache();
        console.log('✅ Smart Cache initialized');
      }
      
      // Database replicas
      if (featureFlags.isEnabled('read-replicas')) {
        console.log('✅ Read Replicas initialized');
        // Replicas auto-initialize
      }
      
      this.initialized = true;
      console.log('🏎️ All premium features initialized');
      
    } catch (error) {
      console.error('Failed to initialize premium features:', error);
      // Premium features fail silently - app continues normally
    }
  }
  
  // Warm critical caches on startup
  private static async warmCache() {
    const criticalEndpoints = [
      '/api/weather?inlet=overview',
      '/api/v1/health',
    ];
    
    // Warm caches in background (non-blocking)
    criticalEndpoints.forEach(async (endpoint) => {
      try {
        await smartCache.get(
          endpoint,
          () => fetch(endpoint).then(r => r.json()),
          { staleAfter: 5 * 60 * 1000 } // 5 minutes
        );
      } catch {
        // Silent fail - not critical
      }
    });
  }
  
  // Get current status of all premium features
  static getStatus() {
    return {
      initialized: this.initialized,
      features: {
        rum: {
          enabled: featureFlags.isEnabled('rum'),
          metrics: rum.getMetrics(),
        },
        smartCache: {
          enabled: featureFlags.isEnabled('smart-cache'),
          stats: smartCache.getStats(),
        },
        readReplicas: {
          enabled: featureFlags.isEnabled('read-replicas'),
          status: dbReplicas.getStatus(),
        },
        performanceOptimizer: {
          enabled: featureFlags.isEnabled('performance-optimizer'),
        },
      },
    };
  }
}

// Enhanced fetch with all premium features
export async function premiumFetch<T = any>(
  url: string,
  options?: RequestInit & {
    cache?: {
      staleAfter?: number;
      expireAfter?: number;
    };
    retry?: {
      maxAttempts?: number;
      strategy?: 'aggressive' | 'gentle' | 'realtime';
    };
  }
): Promise<T> {
  // Use smart cache if enabled
  if (featureFlags.isEnabled('smart-cache') && options?.cache) {
    return smartCache.get(
      url,
      async () => {
        // Use smart retry if enabled
        if (featureFlags.isEnabled('smart-retry')) {
          const response = await SmartRetry.fetch(
            url,
            options,
            options.retry
          );
          return response.json();
        }
        
        // Fallback to regular fetch
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      },
      options.cache
    );
  }
  
  // No cache - use retry only
  if (featureFlags.isEnabled('smart-retry')) {
    const response = await SmartRetry.fetch(url, options, options?.retry);
    return response.json();
  }
  
  // Fallback to regular fetch
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Auto-initialize on client
if (typeof window !== 'undefined') {
  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      PremiumFeatures.initialize();
    });
  } else {
    PremiumFeatures.initialize();
  }
}
