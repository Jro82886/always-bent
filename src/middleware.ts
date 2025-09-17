import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMITS = {
  '/api/analyze': { requests: 10, windowMs: 60000 }, // 10 requests per minute
  '/api/weather': { requests: 30, windowMs: 60000 }, // 30 requests per minute
  '/api/community': { requests: 20, windowMs: 60000 }, // 20 requests per minute
  '/api/tiles': { requests: 100, windowMs: 60000 }, // 100 tile requests per minute
  default: { requests: 60, windowMs: 60000 } // 60 requests per minute default
};

function getRateLimit(pathname: string) {
  for (const [path, limit] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      return limit;
    }
  }
  return RATE_LIMITS.default;
}

export function middleware(request: NextRequest) {
  // Only apply rate limiting to API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Get client identifier (IP address or user ID)
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const pathname = request.nextUrl.pathname;
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  
  // Get rate limit for this endpoint
  const { requests, windowMs } = getRateLimit(pathname);
  
  // Check rate limit
  const rateLimit = rateLimitMap.get(key);
  
  if (!rateLimit || now > rateLimit.resetTime) {
    // Create new window
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs
    });
  } else {
    // Increment counter
    rateLimit.count++;
    
    if (rateLimit.count > requests) {
      // Rate limit exceeded
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again later.`,
          retryAfter: Math.ceil((rateLimit.resetTime - now) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimit.resetTime - now) / 1000).toString()
          }
        }
      );
    }
  }
  
  // Add rate limit headers to response
  const response = NextResponse.next();
  const limit = rateLimitMap.get(key)!;
  
  response.headers.set('X-RateLimit-Limit', requests.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, requests - limit.count).toString());
  response.headers.set('X-RateLimit-Reset', new Date(limit.resetTime).toISOString());
  
  // Clean up old entries periodically (every 100 requests)
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitMap.entries()) {
      if (now > v.resetTime + windowMs) {
        rateLimitMap.delete(k);
      }
    }
  }
  
  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
};
