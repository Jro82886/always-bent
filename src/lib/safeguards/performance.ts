/**
 * Performance monitoring and limits
 * Prevents memory leaks and performance degradation
 */

class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  private warnings: Set<string> = new Set();
  
  /**
   * Track a performance metric
   */
  track(name: string, value: number) {
    const values = this.metrics.get(name) || [];
    values.push(value);
    
    // Keep only last 100 values
    if (values.length > 100) {
      values.shift();
    }
    
    this.metrics.set(name, values);
    this.checkThresholds(name, value);
  }
  
  /**
   * Check if thresholds are exceeded
   */
  private checkThresholds(name: string, value: number) {
    const thresholds: Record<string, number> = {
      'memory_usage_mb': 500,
      'api_response_ms': 5000,
      'render_time_ms': 100,
      'map_markers': 1000,
      'data_points': 10000
    };
    
    const threshold = thresholds[name];
    if (threshold && value > threshold) {
      if (!this.warnings.has(name)) {
        console.warn(`⚠️ Performance warning: ${name} exceeded threshold (${value} > ${threshold})`);
        this.warnings.add(name);
        
        // Clear warning after 1 minute
        setTimeout(() => this.warnings.delete(name), 60000);
      }
    }
  }
  
  /**
   * Get average for a metric
   */
  getAverage(name: string): number {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
  
  /**
   * Get all metrics
   */
  getMetrics() {
    const result: Record<string, any> = {};
    for (const [name, values] of this.metrics.entries()) {
      result[name] = {
        current: values[values.length - 1],
        average: this.getAverage(name),
        max: Math.max(...values),
        min: Math.min(...values),
        count: values.length
      };
    }
    return result;
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Monitor memory usage
 */
if (typeof window !== 'undefined' && 'performance' in window) {
  setInterval(() => {
    if ((performance as any).memory) {
      const memoryMB = (performance as any).memory.usedJSHeapSize / 1024 / 1024;
      performanceMonitor.track('memory_usage_mb', memoryMB);
      
      // Warn if memory is very high
      if (memoryMB > 800) {
        console.error('⚠️ Critical: Memory usage very high. Consider refreshing the page.');
      }
    }
  }, 10000); // Check every 10 seconds
}

/**
 * Debounce function to limit execution frequency
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  
  return function debounced(...args: Parameters<T>) {
    lastArgs = args;
    
    if (timeout) {
      clearTimeout(timeout);
    }
    
    if (options.leading && !timeout) {
      func(...args);
    }
    
    timeout = setTimeout(() => {
      if (options.trailing !== false && lastArgs) {
        func(...lastArgs);
      }
      timeout = null;
      lastArgs = null;
    }, wait);
  };
}

/**
 * Throttle function to limit execution rate
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  return function throttled(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  };
}

/**
 * Limit array size to prevent memory issues
 */
export function limitArraySize<T>(array: T[], maxSize: number): T[] {
  if (array.length <= maxSize) return array;
  
  console.warn(`Array size limited from ${array.length} to ${maxSize}`);
  return array.slice(0, maxSize);
}

/**
 * Batch operations to prevent blocking
 */
export async function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 10
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    
    // Small delay between batches to prevent blocking
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  return results;
}

/**
 * Cache with TTL and size limits
 */
export class SafeCache<K, V> {
  private cache = new Map<K, { value: V; expires: number }>();
  private accessOrder: K[] = [];
  
  constructor(
    private maxSize: number = 100,
    private ttlMs: number = 5 * 60 * 1000 // 5 minutes default
  ) {}
  
  set(key: K, value: V, customTtl?: number): void {
    // Remove if exists
    if (this.cache.has(key)) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) this.accessOrder.splice(index, 1);
    }
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldest = this.accessOrder.shift();
      if (oldest) this.cache.delete(oldest);
    }
    
    // Add new entry
    this.cache.set(key, {
      value,
      expires: Date.now() + (customTtl || this.ttlMs)
    });
    this.accessOrder.push(key);
  }
  
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    // Check expiration
    if (entry.expires < Date.now()) {
      this.delete(key);
      return undefined;
    }
    
    // Move to end (most recently used)
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }
    
    return entry.value;
  }
  
  delete(key: K): void {
    this.cache.delete(key);
    const index = this.accessOrder.indexOf(key);
    if (index > -1) this.accessOrder.splice(index, 1);
  }
  
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }
  
  size(): number {
    return this.cache.size;
  }
}

/**
 * Measure function execution time
 */
export function measureTime<T extends (...args: any[]) => any>(
  func: T,
  name?: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = func(...args);
    const duration = performance.now() - start;
    
    const metricName = name || func.name || 'anonymous';
    performanceMonitor.track(`${metricName}_ms`, duration);
    
    if (duration > 1000) {
      console.warn(`⚠️ Slow function: ${metricName} took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  }) as T;
}
