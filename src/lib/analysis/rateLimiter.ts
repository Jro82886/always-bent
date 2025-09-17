/**
 * Rate Limiter for SnipTool Analysis
 * Prevents system overload from excessive analysis saves
 * Segregates test/production data
 */

interface RateLimitConfig {
  maxPerMinute: number;
  maxPerHour: number;
  maxPerDay: number;
  maxStorageItems: number;
  maxStorageSizeMB: number;
  archiveAfterDays: number;
  segregateTestData: boolean;
}

const DEFAULT_LIMITS: RateLimitConfig = {
  maxPerMinute: 3,      // Max 3 analyses per minute
  maxPerHour: 20,       // Max 20 analyses per hour
  maxPerDay: 100,       // Max 100 analyses per day
  maxStorageItems: 50,  // Max 50 saved analyses in localStorage
  maxStorageSizeMB: 5,  // Max 5MB total storage
  archiveAfterDays: 7,  // Archive analyses older than 7 days
  segregateTestData: true, // Keep test and production data separate
};

class AnalysisRateLimiter {
  private timestamps: number[] = [];
  private readonly storageKey = 'abfi_analysis_timestamps';
  private readonly limits: RateLimitConfig;

  constructor(limits: Partial<RateLimitConfig> = {}) {
    this.limits = { ...DEFAULT_LIMITS, ...limits };
    this.loadTimestamps();
  }

  private loadTimestamps() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.timestamps = JSON.parse(stored);
        // Clean old timestamps (older than 24 hours)
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        this.timestamps = this.timestamps.filter(t => t > dayAgo);
        this.saveTimestamps();
      }
    } catch (e) {
      
      this.timestamps = [];
    }
  }

  private saveTimestamps() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.timestamps));
    } catch (e) {
      
    }
  }

  public canSaveAnalysis(): { allowed: boolean; reason?: string; retryAfter?: number } {
    const now = Date.now();
    
    // Check storage limits first
    const storageCheck = this.checkStorageLimits();
    if (!storageCheck.allowed) {
      return storageCheck;
    }

    // Clean old timestamps
    const minuteAgo = now - 60 * 1000;
    const hourAgo = now - 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    // Count recent saves
    const lastMinute = this.timestamps.filter(t => t > minuteAgo).length;
    const lastHour = this.timestamps.filter(t => t > hourAgo).length;
    const lastDay = this.timestamps.filter(t => t > dayAgo).length;

    // Check rate limits
    if (lastMinute >= this.limits.maxPerMinute) {
      const oldestInMinute = Math.min(...this.timestamps.filter(t => t > minuteAgo));
      const retryAfter = Math.ceil((oldestInMinute + 60 * 1000 - now) / 1000);
      return {
        allowed: false,
        reason: `Too many analyses. Please wait ${retryAfter} seconds.`,
        retryAfter
      };
    }

    if (lastHour >= this.limits.maxPerHour) {
      const oldestInHour = Math.min(...this.timestamps.filter(t => t > hourAgo));
      const retryAfter = Math.ceil((oldestInHour + 60 * 60 * 1000 - now) / 60000);
      return {
        allowed: false,
        reason: `Hourly limit reached. Please wait ${retryAfter} minutes.`,
        retryAfter: retryAfter * 60
      };
    }

    if (lastDay >= this.limits.maxPerDay) {
      return {
        allowed: false,
        reason: 'Daily analysis limit reached. Try again tomorrow.',
        retryAfter: 24 * 60 * 60
      };
    }

    return { allowed: true };
  }

  private checkStorageLimits(): { allowed: boolean; reason?: string } {
    try {
      // Get the appropriate storage key based on environment
      const storageKey = this.getStorageKey();
      
      // Check number of saved analyses
      const analyses = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (analyses.length >= this.limits.maxStorageItems) {
        // Try to auto-archive old data
        const archived = this.archiveOldData();
        if (archived > 0) {
          return { allowed: true }; // Space freed up
        }
        
        return {
          allowed: false,
          reason: `Storage full (${this.limits.maxStorageItems} analyses). Old reports have been archived.`
        };
      }

      // Estimate storage size
      const storageSize = new Blob([JSON.stringify(analyses)]).size / (1024 * 1024);
      if (storageSize >= this.limits.maxStorageSizeMB) {
        return {
          allowed: false,
          reason: `Storage limit reached (${this.limits.maxStorageSizeMB}MB). Please clear old reports.`
        };
      }

      return { allowed: true };
    } catch (e) {
      
      return { allowed: true }; // Allow if we can't check
    }
  }

  private getStorageKey(): string {
    if (!this.limits.segregateTestData) {
      return 'abfi_analyses';
    }
    
    const isTestMode = process.env.NODE_ENV === 'development' || 
                       window.location.hostname === 'localhost' ||
                       localStorage.getItem('abfi_test_mode') === 'true';
    
    return isTestMode ? 'abfi_analyses_test' : 'abfi_analyses';
  }

  private archiveOldData(): number {
    try {
      const storageKey = this.getStorageKey();
      const archiveKey = `${storageKey}_archive`;
      
      const analyses = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const archived = JSON.parse(localStorage.getItem(archiveKey) || '[]');
      
      const cutoffDate = Date.now() - (this.limits.archiveAfterDays * 24 * 60 * 60 * 1000);
      
      // Separate old and current data
      const toArchive = analyses.filter((a: any) => 
        new Date(a.saved_at || a.timestamp).getTime() < cutoffDate
      );
      
      const toKeep = analyses.filter((a: any) => 
        new Date(a.saved_at || a.timestamp).getTime() >= cutoffDate
      );
      
      if (toArchive.length > 0) {
        // Add to archive (keep only last 100 archived items)
        const newArchive = [...archived, ...toArchive].slice(-100);
        localStorage.setItem(archiveKey, JSON.stringify(newArchive));
        
        // Update current storage
        localStorage.setItem(storageKey, JSON.stringify(toKeep));
        
        
        return toArchive.length;
      }
      
      return 0;
    } catch (e) {
      
      return 0;
    }
  }

  public recordAnalysisSave() {
    const now = Date.now();
    this.timestamps.push(now);
    
    // Keep only last 24 hours of timestamps
    const dayAgo = now - 24 * 60 * 60 * 1000;
    this.timestamps = this.timestamps.filter(t => t > dayAgo);
    
    this.saveTimestamps();
  }

  public clearOldAnalyses(keepCount: number = 10) {
    try {
      const analyses = JSON.parse(localStorage.getItem('abfi_analyses') || '[]');
      if (analyses.length > keepCount) {
        // Keep only the most recent analyses
        const sorted = analyses.sort((a: any, b: any) => 
          new Date(b.saved_at || b.timestamp).getTime() - 
          new Date(a.saved_at || a.timestamp).getTime()
        );
        const kept = sorted.slice(0, keepCount);
        localStorage.setItem('abfi_analyses', JSON.stringify(kept));
        
        return analyses.length - kept.length;
      }
      return 0;
    } catch (e) {
      
      return 0;
    }
  }

  public getUsageStats() {
    const now = Date.now();
    const minuteAgo = now - 60 * 1000;
    const hourAgo = now - 60 * 60 * 1000;
    const dayAgo = now - 24 * 60 * 60 * 1000;

    return {
      lastMinute: this.timestamps.filter(t => t > minuteAgo).length,
      lastHour: this.timestamps.filter(t => t > hourAgo).length,
      lastDay: this.timestamps.filter(t => t > dayAgo).length,
      limits: this.limits
    };
  }

  /**
   * Clear all test data when transitioning to production
   * This should be called when going live
   */
  public clearTestData(): { cleared: number; archived: number } {
    try {
      const testKey = 'abfi_analyses_test';
      const testArchiveKey = 'abfi_analyses_test_archive';
      
      const testData = JSON.parse(localStorage.getItem(testKey) || '[]');
      const testArchive = JSON.parse(localStorage.getItem(testArchiveKey) || '[]');
      
      const totalCleared = testData.length + testArchive.length;
      
      // Archive test data for reference (optional)
      if (testData.length > 0) {
        const backupKey = `abfi_test_backup_${new Date().toISOString().split('T')[0]}`;
        localStorage.setItem(backupKey, JSON.stringify({
          data: testData,
          archive: testArchive,
          clearedAt: new Date().toISOString()
        }));
      }
      
      // Clear test storage
      localStorage.removeItem(testKey);
      localStorage.removeItem(testArchiveKey);
      
      
      
      return {
        cleared: testData.length,
        archived: testArchive.length
      };
    } catch (e) {
      
      return { cleared: 0, archived: 0 };
    }
  }

  /**
   * Get current environment mode
   */
  public getCurrentMode(): 'test' | 'production' {
    const isTestMode = process.env.NODE_ENV === 'development' || 
                       window.location.hostname === 'localhost' ||
                       localStorage.getItem('abfi_test_mode') === 'true';
    return isTestMode ? 'test' : 'production';
  }

  /**
   * Get storage statistics
   */
  public getStorageStats() {
    const storageKey = this.getStorageKey();
    const archiveKey = `${storageKey}_archive`;
    
    const analyses = JSON.parse(localStorage.getItem(storageKey) || '[]');
    const archived = JSON.parse(localStorage.getItem(archiveKey) || '[]');
    
    const dataSize = new Blob([JSON.stringify(analyses)]).size / (1024 * 1024);
    const archiveSize = new Blob([JSON.stringify(archived)]).size / (1024 * 1024);
    
    return {
      mode: this.getCurrentMode(),
      current: {
        count: analyses.length,
        sizeMB: dataSize.toFixed(2)
      },
      archived: {
        count: archived.length,
        sizeMB: archiveSize.toFixed(2)
      },
      limits: {
        maxItems: this.limits.maxStorageItems,
        maxSizeMB: this.limits.maxStorageSizeMB
      }
    };
  }
}

// Export singleton instance
export const analysisRateLimiter = new AnalysisRateLimiter();

// Export for custom configurations
export { AnalysisRateLimiter, type RateLimitConfig };
