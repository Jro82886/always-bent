import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: process.env.npm_package_version || '0.1.0',
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'local',
    env: process.env.VERCEL_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
}
