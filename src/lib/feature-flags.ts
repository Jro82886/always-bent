// Simple feature flags system
// In production, this would connect to LaunchDarkly, Unleash, etc.

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  userGroups?: string[];
  metadata?: Record<string, any>;
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag> = new Map();
  
  constructor() {
    // Initialize default flags
    this.initializeFlags();
  }
  
  private initializeFlags() {
    // Environment-based flags
    const flags: FeatureFlag[] = [
      {
        name: 'offline-mode',
        enabled: process.env.NEXT_PUBLIC_ENABLE_SW !== 'false',
      },
      {
        name: 'advanced-analysis',
        enabled: process.env.NEXT_PUBLIC_ADVANCED_ANALYSIS === 'true',
      },
      {
        name: 'vessel-tracking',
        enabled: true,
        rolloutPercentage: 100,
      },
      {
        name: 'community-chat',
        enabled: true,
      },
      {
        name: 'beta-features',
        enabled: process.env.NEXT_PUBLIC_BETA_FEATURES === 'true',
        userGroups: ['beta-testers'],
      },
      {
        name: 'performance-monitoring',
        enabled: process.env.NODE_ENV === 'production',
        rolloutPercentage: 10, // Monitor 10% of users
      },
    ];
    
    flags.forEach(flag => {
      this.flags.set(flag.name, flag);
    });
  }
  
  isEnabled(flagName: string, userId?: string): boolean {
    const flag = this.flags.get(flagName);
    if (!flag) return false;
    
    if (!flag.enabled) return false;
    
    // Check rollout percentage
    if (flag.rolloutPercentage && flag.rolloutPercentage < 100) {
      if (!userId) return false;
      
      // Simple hash-based rollout
      const hash = this.hashUserId(userId);
      const percentage = (hash % 100) + 1;
      return percentage <= flag.rolloutPercentage;
    }
    
    return true;
  }
  
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }
  
  // For testing - override a flag
  setFlag(flagName: string, enabled: boolean) {
    const flag = this.flags.get(flagName);
    if (flag) {
      flag.enabled = enabled;
    }
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagManager();

// React hook for feature flags
import { useMemo } from 'react';
import { useAppState } from '@/lib/store';

export function useFeatureFlag(flagName: string): boolean {
  const { user } = useAppState();
  
  return useMemo(() => {
    return featureFlags.isEnabled(flagName, user?.id);
  }, [flagName, user?.id]);
}
