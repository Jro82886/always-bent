import { NextResponse } from 'next/server';

const ALLOWED_ORIGINS = [
  'https://always-bent.vercel.app',
  'https://alwaysbent.com',
  'https://www.alwaysbent.com',
  // Add your Webflow domain here
];

// Development origins
if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000');
}

export function corsHeaders(origin: string | null) {
  const headers = new Headers();
  
  // Check if origin is allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-ABFI-Client');
  headers.set('Access-Control-Max-Age', '86400');
  
  return headers;
}

export function handleCors(request: Request): NextResponse | null {
  const origin = request.headers.get('origin');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 200, 
      headers: corsHeaders(origin) 
    });
  }
  
  return null;
}
