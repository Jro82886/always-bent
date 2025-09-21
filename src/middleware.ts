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
  const { pathname } = request.nextUrl;
  
  // Check if user has the onboarded cookie (temporary auth check)
  const isOnboarded = request.cookies.get('abfi_onboarded')?.value === '1';
  
  // Check if route requires protection
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  
  // If trying to access protected route without auth, redirect to login
  if (isProtectedRoute && !isOnboarded) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If logged in and trying to access auth pages, redirect to app
  if (isOnboarded && (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register'))) {
    return NextResponse.redirect(new URL('/legendary', request.url));
  }
  
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