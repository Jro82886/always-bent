interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pending = new Map<string, PendingRequest>();
  private cacheDuration = 2000; // 2 seconds

  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [key, request] of this.pending.entries()) {
      if (now - request.timestamp > this.cacheDuration) {
        this.pending.delete(key);
      }
    }
  }

  async dedupedFetch<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    this.cleanupExpired();
    
    const key = this.generateKey(url, options);
    const existing = this.pending.get(key);
    
    if (existing) {
      console.log('[Dedup] Reusing in-flight request:', url);
      return existing.promise;
    }

    const promise = fetch(url, options).then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    }).finally(() => {
      // Remove from pending after a short delay
      setTimeout(() => {
        this.pending.delete(key);
      }, 100);
    });

    this.pending.set(key, {
      promise,
      timestamp: Date.now()
    });

    return promise;
  }

  // Get dedup stats for monitoring
  getStats() {
    this.cleanupExpired();
    return {
      pendingRequests: this.pending.size,
      requests: Array.from(this.pending.keys())
    };
  }
}

// Singleton instance
export const requestDedup = new RequestDeduplicator();

// Enhanced fetch with deduplication
export async function dedupedFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  return requestDedup.dedupedFetch<T>(url, options);
}
