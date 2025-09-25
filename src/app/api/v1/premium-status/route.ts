import { NextResponse } from 'next/server';
import { PremiumFeatures } from '@/lib/premium-features';
import { featureFlags } from '@/lib/feature-flags';

export async function GET() {
  try {
    const status = PremiumFeatures.getStatus();
    const flags = featureFlags.getAllFlags()
      .filter(flag => flag.name.includes('premium') || 
                     flag.name.includes('cache') || 
                     flag.name.includes('rum') ||
                     flag.name.includes('retry') ||
                     flag.name.includes('replica'));
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      premium: status,
      flags: flags.map(f => ({
        name: f.name,
        enabled: f.enabled,
        rollout: f.rolloutPercentage,
      })),
      recommendations: getRecommendations(status),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

function getRecommendations(status: any): string[] {
  const recommendations: string[] = [];
  
  // Check cache hit rate
  const cacheStats = status.features.smartCache?.stats;
  if (cacheStats && cacheStats.total > 0) {
    const hitRate = (cacheStats.fresh + cacheStats.stale) / cacheStats.total;
    if (hitRate < 0.5) {
      recommendations.push('Cache hit rate is low. Consider increasing cache duration.');
    }
  }
  
  // Check RUM metrics
  const rumMetrics = status.features.rum?.metrics;
  if (rumMetrics?.performance) {
    if (rumMetrics.performance.lcp > 2500) {
      recommendations.push('LCP is above 2.5s. Enable performance optimizer.');
    }
    if (rumMetrics.frustration.rageClicks > 10) {
      recommendations.push('High user frustration detected. Review UI responsiveness.');
    }
  }
  
  // Check read replicas
  const replicaStatus = status.features.readReplicas?.status;
  if (replicaStatus?.readReplicasEnabled && replicaStatus.replicas.length === 0) {
    recommendations.push('Read replicas enabled but none configured.');
  }
  
  return recommendations;
}
