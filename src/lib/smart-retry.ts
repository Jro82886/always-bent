// Smart Retry with Exponential Backoff
// This CAN'T break anything - it only helps when things fail!

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  factor?: number;
  jitter?: boolean;
  retryIf?: (error: any) => boolean;
  onRetry?: (error: any, attempt: number) => void;
}

export class SmartRetry {
  private static defaults: Required<RetryOptions> = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    factor: 2,
    jitter: true,
    retryIf: (error) => {
      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        return false;
      }
      // Retry on network errors and 5xx
      return true;
    },
    onRetry: (error, attempt) => {
      console.log(`Retry attempt ${attempt}:`, error.message);
    },
  };
  
  static async execute<T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ): Promise<T> {
    const config = { ...this.defaults, ...options };
    let lastError: any;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        // Try the operation
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if we should retry
        if (!config.retryIf(error) || attempt === config.maxAttempts) {
          throw error;
        }
        
        // Calculate delay with exponential backoff
        let delay = Math.min(
          config.initialDelay * Math.pow(config.factor, attempt - 1),
          config.maxDelay
        );
        
        // Add jitter to prevent thundering herd
        if (config.jitter) {
          delay = delay * (0.5 + Math.random() * 0.5);
        }
        
        // Notify about retry
        config.onRetry(error, attempt);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
  
  // Convenience method for fetch with retry
  static async fetch(
    url: string,
    init?: RequestInit,
    options?: RetryOptions
  ): Promise<Response> {
    return this.execute(
      async () => {
        const response = await fetch(url, init);
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}`);
          (error as any).status = response.status;
          throw error;
        }
        return response;
      },
      options
    );
  }
}

// Pattern-specific retry strategies
export const RetryStrategies = {
  // For critical API calls
  aggressive: {
    maxAttempts: 5,
    initialDelay: 500,
    factor: 1.5,
  },
  
  // For non-critical operations
  gentle: {
    maxAttempts: 2,
    initialDelay: 2000,
    factor: 2,
  },
  
  // For real-time data
  realtime: {
    maxAttempts: 3,
    initialDelay: 100,
    maxDelay: 1000,
    jitter: false,
  },
  
  // For background tasks
  background: {
    maxAttempts: 10,
    initialDelay: 5000,
    maxDelay: 60000,
    factor: 2,
  },
};

// React hook for retryable operations
import { useCallback, useState } from 'react';

export function useRetry<T>(
  operation: () => Promise<T>,
  options?: RetryOptions
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const [attempts, setAttempts] = useState(0);
  
  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAttempts(0);
    
    try {
      const result = await SmartRetry.execute(
        operation,
        {
          ...options,
          onRetry: (err, attempt) => {
            setAttempts(attempt);
            options?.onRetry?.(err, attempt);
          },
        }
      );
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [operation, options]);
  
  return { execute, loading, error, data, attempts };
}
