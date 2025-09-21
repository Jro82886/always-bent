import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = [
  '/legendary/analysis',
  '/legendary/tracking', 
  '/legendary/community',
  '/legendary/trends'
];

// Routes that are always public
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/legendary/welcome',
  '/demo',
  '/test',
  '/simple',
  '/go',
  '/'
];

export function middleware(request: NextRequest) {
  // AUTHENTICATION DISABLED - All routes are accessible
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_vercel).*)',
  ],
};