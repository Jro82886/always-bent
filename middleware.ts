import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter (replace with Redis/Upstash in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const config = { 
  matcher: [
    "/legendary/:path*",
    "/api/:path*"
  ] 
};

function getRateLimitKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";
  return `${ip}:${req.nextUrl.pathname}`;
}

function checkRateLimit(key: string, limit: number = 60, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

export function middleware(req: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  
  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const key = getRateLimitKey(req);
    const limit = req.nextUrl.pathname.includes("/analyze") || req.nextUrl.pathname.includes("/auth") ? 60 : 120;
    
    if (!checkRateLimit(key, limit)) {
      return new NextResponse("Too Many Requests", { 
        status: 429,
        headers: {
          "Retry-After": "60",
          "Content-Type": "text/plain"
        }
      });
    }
  }
  
  // Auth check for legendary routes
  if (req.nextUrl.pathname.startsWith("/legendary/")) {
    const mode = process.env.ABFI_AUTH_MODE || "soft";
    if (mode === "hard") {
      const has = req.cookies.get("abfi_session")?.value;
      if (!has) return NextResponse.redirect(new URL("/login", req.url));
    }
  }
  
  return response;
}


