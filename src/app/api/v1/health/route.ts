import { NextResponse } from 'next/server';
import { dbPool } from '@/lib/db/connection-pool';
import { circuitBreakers } from '@/lib/circuit-breaker';
import { requestDedup } from '@/lib/request-dedup';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: 'v1',
    checks: {
      database: await checkDatabase(),
      circuitBreakers: getCircuitBreakerStatus(),
      requestDedup: requestDedup.getStats(),
      memory: process.memoryUsage(),
    }
  };

  const isHealthy = health.checks.database.status === 'ok';
  
  return NextResponse.json(health, {
    status: isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}

async function checkDatabase() {
  try {
    const stats = dbPool.getStats();
    return {
      status: 'ok',
      connections: stats,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

function getCircuitBreakerStatus() {
  return Object.entries(circuitBreakers).reduce((acc, [name, breaker]) => {
    acc[name] = breaker.getStatus();
    return acc;
  }, {} as Record<string, any>);
}
