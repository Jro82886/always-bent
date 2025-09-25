// Database Read Replicas - Distribute read load safely
// Feature-flagged so you can turn on/off instantly

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { featureFlags } from '@/lib/feature-flags';

interface ReplicaConfig {
  url: string;
  key: string;
  region?: string;
  weight?: number; // For weighted load balancing
  healthCheckInterval?: number;
}

class DatabaseReplicaManager {
  private primaryClient: SupabaseClient | null = null;
  private replicas: Map<string, {
    client: SupabaseClient;
    healthy: boolean;
    lastCheck: number;
    config: ReplicaConfig;
  }> = new Map();
  
  private healthCheckInterval = 30000; // 30 seconds
  private isInitialized = false;
  
  constructor() {
    this.initialize();
  }
  
  private initialize() {
    // Primary database (always available)
    const primaryUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const primaryKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (primaryUrl && primaryKey) {
      this.primaryClient = createClient(primaryUrl, primaryKey);
    }
    
    // Read replicas (optional)
    this.initializeReplicas();
    
    // Start health checks
    this.startHealthChecks();
    
    this.isInitialized = true;
  }
  
  private initializeReplicas() {
    // Load replica configurations from environment
    const replicaConfigs: ReplicaConfig[] = [
      // Example: Add your read replica URLs here
      // {
      //   url: process.env.SUPABASE_REPLICA_1_URL!,
      //   key: process.env.SUPABASE_REPLICA_1_KEY!,
      //   region: 'us-east',
      //   weight: 1,
      // },
    ];
    
    // Only initialize if we have replica configs
    replicaConfigs.forEach((config, index) => {
      if (config.url && config.key) {
        try {
          const client = createClient(config.url, config.key);
          this.replicas.set(`replica-${index}`, {
            client,
            healthy: true,
            lastCheck: Date.now(),
            config,
          });
          console.log(`Read replica ${index} initialized`);
        } catch (error) {
          console.error(`Failed to initialize replica ${index}:`, error);
        }
      }
    });
  }
  
  // Get a client for read operations
  async getReadClient(): Promise<SupabaseClient> {
    // Check if replicas are enabled via feature flag
    if (!featureFlags.isEnabled('read-replicas')) {
      return this.getPrimaryClient();
    }
    
    // Get healthy replicas
    const healthyReplicas = Array.from(this.replicas.entries())
      .filter(([_, replica]) => replica.healthy);
    
    // If no healthy replicas, use primary
    if (healthyReplicas.length === 0) {
      return this.getPrimaryClient();
    }
    
    // Load balance across healthy replicas
    const replica = this.selectReplica(healthyReplicas);
    return replica.client;
  }
  
  // Get primary client for write operations
  getPrimaryClient(): SupabaseClient {
    if (!this.primaryClient) {
      throw new Error('Database not initialized');
    }
    return this.primaryClient;
  }
  
  // Smart replica selection with weighted load balancing
  private selectReplica(replicas: Array<[string, any]>): any {
    // Simple round-robin for now
    // Could implement weighted selection based on config.weight
    const index = Math.floor(Math.random() * replicas.length);
    return replicas[index][1];
  }
  
  // Health check for replicas
  private async checkReplicaHealth(replicaId: string) {
    const replica = this.replicas.get(replicaId);
    if (!replica) return;
    
    try {
      // Simple health check - try to query a small table
      const { error } = await replica.client
        .from('_health_check')
        .select('id')
        .limit(1)
        .single();
      
      replica.healthy = !error;
      replica.lastCheck = Date.now();
      
      if (error) {
        console.warn(`Replica ${replicaId} health check failed:`, error);
      }
    } catch (error) {
      replica.healthy = false;
      replica.lastCheck = Date.now();
      console.error(`Replica ${replicaId} is unhealthy:`, error);
    }
  }
  
  private startHealthChecks() {
    setInterval(() => {
      this.replicas.forEach((_, replicaId) => {
        this.checkReplicaHealth(replicaId);
      });
    }, this.healthCheckInterval);
  }
  
  // Get current status
  getStatus() {
    const replicaStatus = Array.from(this.replicas.entries()).map(([id, replica]) => ({
      id,
      healthy: replica.healthy,
      region: replica.config.region,
      lastCheck: new Date(replica.lastCheck).toISOString(),
    }));
    
    return {
      primary: this.primaryClient ? 'connected' : 'disconnected',
      replicas: replicaStatus,
      readReplicasEnabled: featureFlags.isEnabled('read-replicas'),
    };
  }
}

// Singleton instance
export const dbReplicas = new DatabaseReplicaManager();

// Helper functions for easy use
export async function withReadReplica<T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const client = await dbReplicas.getReadClient();
  return operation(client);
}

export function withPrimary<T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  const client = dbReplicas.getPrimaryClient();
  return operation(client);
}

// React hook for read operations with automatic replica selection
import { useEffect, useState } from 'react';

export function useReplicatedQuery<T>(
  queryFn: (client: SupabaseClient) => Promise<T>,
  deps: React.DependencyList = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await withReadReplica(queryFn);
        
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          console.error('Replicated query failed:', err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      cancelled = true;
    };
  }, deps);
  
  return { data, loading, error };
}
