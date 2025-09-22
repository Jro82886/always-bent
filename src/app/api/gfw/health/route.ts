import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.GFW_API_TOKEN;
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    token: {
      present: !!token,
      length: token?.length || 0,
      preview: token ? `${token.substring(0, 10)}...${token.substring(token.length - 4)}` : 'not set'
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV
    }
  };
  
  console.log('[GFW Health]', health);
  
  return NextResponse.json(health);
}
