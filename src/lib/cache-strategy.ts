// Intelligent Caching Strategy with stale-while-revalidate
// This WON'T break anything - it only makes things faster!

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
  staleAfter: number;
  expireAfter: number;
}

export class SmartCache {
  private cache = new Map<string, CacheEntry<any>>();
  private revalidating = new Map<string, Promise<any>>();
  
  // Safe defaults that won't break anything
  private defaults = {
    staleAfter: 60 * 1000, // 1 minute
    expireAfter: 60 * 60 * 1000, // 1 hour
  };
  
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: {
      staleAfter?: number;
      expireAfter?: number;
      fallback?: T;
    }
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();
    
    // Return fresh cache immediately
    if (cached && now - cached.timestamp < (options?.staleAfter || this.defaults.staleAfter)) {
      return cached.data;
    }
    
    // Return stale cache while revalidating in background
    if (cached && now - cached.timestamp < (options?.expireAfter || this.defaults.expireAfter)) {
      // Revalidate in background (won't block the user!)
      if (!this.revalidating.has(key)) {
        const revalidatePromise = this.revalidate(key, fetcher, cached.etag);
        this.revalidating.set(key, revalidatePromise);
        revalidatePromise.finally(() => this.revalidating.delete(key));
      }
      return cached.data; // Return stale data immediately
    }
    
    // No cache or expired - fetch new data
    try {
      const data = await fetcher();
      this.set(key, data, options);
      return data;
    } catch (error) {
      // SAFETY: Return fallback or cached data on error
      if (options?.fallback !== undefined) {
        return options.fallback;
      }
      if (cached) {
        console.warn('Using expired cache due to fetch error:', error);
        return cached.data;
      }
      throw error;
    }
  }
  
  private async revalidate<T>(key: string, fetcher: () => Promise<T>, etag?: string): Promise<void> {
    try {
      const data = await fetcher();
      this.set(key, data);
    } catch (error) {
      console.error('Background revalidation failed:', error);
      // Silent fail - user still has stale data
    }
  }
  
  private set<T>(key: string, data: T, options?: { staleAfter?: number; expireAfter?: number }) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      staleAfter: options?.staleAfter || this.defaults.staleAfter,
      expireAfter: options?.expireAfter || this.defaults.expireAfter,
    });
  }
  
  // Safe cache management
  clear(pattern?: string) {
    if (pattern) {
      // Clear only matching keys
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
  
  getStats() {
    const now = Date.now();
    let fresh = 0;
    let stale = 0;
    let expired = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age < entry.staleAfter) fresh++;
      else if (age < entry.expireAfter) stale++;
      else expired++;
    }
    
    return { fresh, stale, expired, total: this.cache.size };
  }
}

// Global instance
export const smartCache = new SmartCache();
