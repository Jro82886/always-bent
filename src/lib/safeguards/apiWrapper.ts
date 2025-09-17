/**
 * Safe API wrapper with retries, timeouts, and fallbacks
 */

import { performanceMonitor } from './performance';
import { sanitizeErrorMessage } from './validation';

interface ApiOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  fallback?: any;
  cache?: boolean;
  cacheTTL?: number;
}

const DEFAULT_OPTIONS: ApiOptions = {
  timeout: 10000, // 10 seconds
  retries: 2,
  retryDelay: 1000,
  cache: true,
  cacheTTL: 5 * 60 * 1000 // 5 minutes
};

// Simple cache for API responses
const apiCache = new Map<string, { data: any; expires: number }>();

/**
 * Safe fetch with timeout
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Safe API call with all protections
 */
export async function safeApiCall<T>(
  url: string,
  options: RequestInit = {},
  config: ApiOptions = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_OPTIONS, ...config };
  const cacheKey = `${url}:${JSON.stringify(options)}`;
  const startTime = performance.now();
  
  // Check cache first
  if (finalConfig.cache && options.method === 'GET') {
    const cached = apiCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      console.log(`📦 Cache hit for ${url}`);
      return cached.data;
    }
  }
  
  let lastError: Error | null = null;
  let attempt = 0;
  
  // Retry loop
  while (attempt <= finalConfig.retries!) {
    try {
      attempt++;
      
      if (attempt > 1) {
        console.log(`🔄 Retry ${attempt - 1}/${finalConfig.retries} for ${url}`);
        await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay! * attempt));
      }
      
      // Make the request
      const response = await fetchWithTimeout(url, options, finalConfig.timeout!);
      
      // Check response status
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait longer before retry
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 60000;
          console.warn(`⚠️ Rate limited. Waiting ${delay}ms`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (response.status >= 500) {
          // Server error - might be temporary
          throw new Error(`Server error: ${response.status}`);
        }
        
        // Client error - don't retry
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API error ${response.status}: ${errorText}`);
      }
      
      // Parse response
      const data = await response.json();
      
      // Track performance
      const duration = performance.now() - startTime;
      performanceMonitor.track('api_response_ms', duration);
      
      // Cache if configured
      if (finalConfig.cache && options.method === 'GET') {
        apiCache.set(cacheKey, {
          data,
          expires: Date.now() + finalConfig.cacheTTL!
        });
        
        // Clean old cache entries
        cleanCache();
      }
      
      return data;
      
    } catch (error: any) {
      lastError = error;
      console.error(`API call failed (attempt ${attempt}):`, sanitizeErrorMessage(error));
      
      // Don't retry on client errors
      if (error.message?.includes('API error 4')) {
        break;
      }
    }
  }
  
  // All retries failed - use fallback if available
  if (finalConfig.fallback !== undefined) {
    console.warn(`⚠️ Using fallback for ${url}`);
    return finalConfig.fallback;
  }
  
  // Track failure
  performanceMonitor.track('api_failures', 1);
  
  throw lastError || new Error('API call failed');
}

/**
 * Clean expired cache entries
 */
function cleanCache() {
  const now = Date.now();
  for (const [key, entry] of apiCache.entries()) {
    if (entry.expires < now) {
      apiCache.delete(key);
    }
  }
  
  // Also limit cache size
  const MAX_CACHE_SIZE = 100;
  if (apiCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(apiCache.entries());
    entries.sort((a, b) => a[1].expires - b[1].expires);
    
    while (apiCache.size > MAX_CACHE_SIZE / 2) {
      const [key] = entries.shift()!;
      apiCache.delete(key);
    }
  }
}

/**
 * Batch API calls with concurrency control
 */
export async function batchApiCalls<T>(
  urls: string[],
  maxConcurrent: number = 3
): Promise<(T | Error)[]> {
  const results: (T | Error)[] = [];
  const queue = [...urls];
  const inProgress = new Set<Promise<void>>();
  
  while (queue.length > 0 || inProgress.size > 0) {
    // Start new requests up to limit
    while (inProgress.size < maxConcurrent && queue.length > 0) {
      const url = queue.shift()!;
      const index = urls.indexOf(url);
      
      const promise = safeApiCall<T>(url)
        .then(data => {
          results[index] = data;
        })
        .catch(error => {
          results[index] = error;
        })
        .finally(() => {
          inProgress.delete(promise);
        });
      
      inProgress.add(promise);
    }
    
    // Wait for at least one to complete
    if (inProgress.size > 0) {
      await Promise.race(inProgress);
    }
  }
  
  return results;
}

/**
 * Circuit breaker for failing services
 */
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}
  
  async call<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'open') {
      if (Date.now() - this.lastFailTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open - service unavailable');
      }
    }
    
    try {
      const result = await fn();
      
      // Success - reset on half-open
      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
      }
      
      return result;
      
    } catch (error) {
      this.failures++;
      this.lastFailTime = Date.now();
      
      if (this.failures >= this.threshold) {
        this.state = 'open';
        console.error(`⚠️ Circuit breaker opened after ${this.failures} failures`);
      }
      
      throw error;
    }
  }
  
  reset() {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailTime = 0;
  }
}

// Service-specific circuit breakers
export const circuitBreakers = {
  gfw: new CircuitBreaker(3, 30000),
  weather: new CircuitBreaker(5, 60000),
  tiles: new CircuitBreaker(10, 30000),
  analysis: new CircuitBreaker(3, 120000)
};
