/**
 * Rate limiting and API safeguards
 * Prevents abuse and ensures stability
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private blocked: Map<string, number> = new Map();

  constructor(private config: RateLimitConfig) {}

  /**
   * Check if request should be allowed
   */
  checkLimit(key: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    
    // Check if blocked
    const blockedUntil = this.blocked.get(key);
    if (blockedUntil && blockedUntil > now) {
      return {
        allowed: false,
        retryAfter: Math.ceil((blockedUntil - now) / 1000)
      };
    }

    // Get request timestamps
    const timestamps = this.requests.get(key) || [];
    
    // Remove old timestamps outside window
    const cutoff = now - this.config.windowMs;
    const recentRequests = timestamps.filter(t => t > cutoff);
    
    // Check if limit exceeded
    if (recentRequests.length >= this.config.maxRequests) {
      // Block if configured
      if (this.config.blockDurationMs) {
        this.blocked.set(key, now + this.config.blockDurationMs);
      }
      
      return {
        allowed: false,
        retryAfter: Math.ceil(this.config.windowMs / 1000)
      };
    }
    
    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return { allowed: true };
  }

  /**
   * Clean up old data
   */
  cleanup() {
    const now = Date.now();
    const cutoff = now - this.config.windowMs * 2;
    
    // Clean requests
    for (const [key, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter(t => t > cutoff);
      if (recent.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recent);
      }
    }
    
    // Clean blocks
    for (const [key, until] of this.blocked.entries()) {
      if (until < now) {
        this.blocked.delete(key);
      }
    }
  }
}

// API-specific rate limiters
export const rateLimiters = {
  // Tile requests: 100 per minute
  tiles: new RateLimiter({
    maxRequests: 100,
    windowMs: 60 * 1000
  }),
  
  // Analysis: 10 per minute (heavy processing)
  analysis: new RateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000,
    blockDurationMs: 5 * 60 * 1000 // Block for 5 minutes if exceeded
  }),
  
  // GFW API: 30 per minute
  gfw: new RateLimiter({
    maxRequests: 30,
    windowMs: 60 * 1000
  }),
  
  // Weather API: 20 per minute
  weather: new RateLimiter({
    maxRequests: 20,
    windowMs: 60 * 1000
  }),
  
  // Reports: 5 per minute (prevent spam)
  reports: new RateLimiter({
    maxRequests: 5,
    windowMs: 60 * 1000,
    blockDurationMs: 10 * 60 * 1000 // Block for 10 minutes if spamming
  })
};

// Clean up periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    Object.values(rateLimiters).forEach(limiter => limiter.cleanup());
  }, 60 * 1000); // Every minute
}

/**
 * Express/Next.js middleware for rate limiting
 */
export function createRateLimitMiddleware(limiterName: keyof typeof rateLimiters) {
  return (req: any, res: any, next?: any) => {
    const limiter = rateLimiters[limiterName];
    const clientId = req.headers['x-forwarded-for'] || 
                    req.connection?.remoteAddress || 
                    'anonymous';
    
    const result = limiter.checkLimit(clientId);
    
    if (!result.allowed) {
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', limiter['config'].maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(Date.now() + limiter['config'].windowMs).toISOString());
      
      if (result.retryAfter) {
        res.setHeader('Retry-After', result.retryAfter);
      }
      
      // Return 429 Too Many Requests
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter
      });
    }
    
    if (next) next();
  };
}

/**
 * Client-side rate limit check
 */
export function checkClientRateLimit(
  action: keyof typeof rateLimiters,
  userId?: string
): boolean {
  const limiter = rateLimiters[action];
  const key = userId || 'anonymous';
  const result = limiter.checkLimit(key);
  
  if (!result.allowed) {
    console.warn(`Rate limit exceeded for ${action}. Retry after ${result.retryAfter}s`);
  }
  
  return result.allowed;
}
