import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'Local development',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
}