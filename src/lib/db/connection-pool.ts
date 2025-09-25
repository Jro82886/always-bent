import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface PooledConnection {
  client: SupabaseClient;
  lastUsed: number;
  inUse: boolean;
}

class SupabaseConnectionPool {
  private pool: PooledConnection[] = [];
  private maxConnections = 10;
  private connectionTimeout = 30000; // 30 seconds
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    // Pre-warm the pool with 3 connections
    this.initializePool(3);
  }

  private initializePool(count: number) {
    for (let i = 0; i < count; i++) {
      this.createConnection();
    }
  }

  private createConnection(): PooledConnection | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !key) {
      console.error('[DB Pool] Missing Supabase credentials');
      return null;
    }

    try {
      const client = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false
        },
        realtime: {
          params: {
            eventsPerSecond: 10
          }
        },
        db: {
          schema: 'public'
        }
      });

      const connection: PooledConnection = {
        client,
        lastUsed: Date.now(),
        inUse: false
      };

      this.pool.push(connection);
      return connection;
    } catch (error) {
      console.error('[DB Pool] Failed to create connection:', error);
      return null;
    }
  }

  async getConnection(): Promise<SupabaseClient> {
    // Clean up stale connections
    this.cleanupStaleConnections();

    // Find available connection
    let connection = this.pool.find(c => !c.inUse);

    if (!connection && this.pool.length < this.maxConnections) {
      // Create new connection if under limit
      connection = this.createConnection() || undefined;
    }

    if (!connection) {
      // Wait for a connection to become available
      await this.waitForConnection();
      connection = this.pool.find(c => !c.inUse);
    }

    if (!connection) {
      throw new Error('No database connections available');
    }

    connection.inUse = true;
    connection.lastUsed = Date.now();
    return connection.client;
  }

  releaseConnection(client: SupabaseClient) {
    const connection = this.pool.find(c => c.client === client);
    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
    }
  }

  private cleanupStaleConnections() {
    const now = Date.now();
    this.pool = this.pool.filter(connection => {
      const isStale = now - connection.lastUsed > this.connectionTimeout;
      if (isStale && !connection.inUse) {
        console.log('[DB Pool] Removing stale connection');
        return false;
      }
      return true;
    });
  }

  private async waitForConnection(timeout = 5000): Promise<void> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (this.pool.some(c => !c.inUse)) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async executeWithRetry<T>(
    operation: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const client = await this.getConnection();
        try {
          const result = await operation(client);
          return result;
        } finally {
          this.releaseConnection(client);
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`[DB Pool] Attempt ${attempt} failed:`, error);
        
        if (attempt < this.retryAttempts) {
          await new Promise(resolve => 
            setTimeout(resolve, this.retryDelay * attempt)
          );
        }
      }
    }

    throw lastError || new Error('Database operation failed');
  }

  // Get pool stats for monitoring
  getStats() {
    return {
      total: this.pool.length,
      inUse: this.pool.filter(c => c.inUse).length,
      available: this.pool.filter(c => !c.inUse).length,
      maxConnections: this.maxConnections
    };
  }
}

// Singleton instance
export const dbPool = new SupabaseConnectionPool();

// Helper function for easy use
export async function withDatabase<T>(
  operation: (client: SupabaseClient) => Promise<T>
): Promise<T> {
  return dbPool.executeWithRetry(operation);
}
