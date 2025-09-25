type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeout?: number;
  monitoringPeriod?: number;
  halfOpenRequests?: number;
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime?: number;
  private halfOpenAttempts = 0;
  
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly monitoringPeriod: number;
  private readonly halfOpenRequests: number;

  constructor(
    private name: string,
    options: CircuitBreakerOptions = {}
  ) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.monitoringPeriod = options.monitoringPeriod || 60000; // 1 minute
    this.halfOpenRequests = options.halfOpenRequests || 3;
  }

  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => T
  ): Promise<T> {
    // Check if circuit should transition to half-open
    this.checkStateTransition();

    if (this.state === 'OPEN') {
      console.warn(`[Circuit Breaker] ${this.name} is OPEN - using fallback`);
      if (fallback) {
        return fallback();
      }
      throw new Error(`Service ${this.name} is temporarily unavailable`);
    }

    try {
      const result = await operation();
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordSuccess() {
    this.failures = 0;
    this.successes++;

    if (this.state === 'HALF_OPEN') {
      this.halfOpenAttempts++;
      if (this.halfOpenAttempts >= this.halfOpenRequests) {
        console.log(`[Circuit Breaker] ${this.name} recovered - closing circuit`);
        this.state = 'CLOSED';
        this.halfOpenAttempts = 0;
      }
    }
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      console.error(`[Circuit Breaker] ${this.name} failed ${this.failures} times - opening circuit`);
      this.state = 'OPEN';
    }
  }

  private checkStateTransition() {
    if (
      this.state === 'OPEN' &&
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime >= this.resetTimeout
    ) {
      console.log(`[Circuit Breaker] ${this.name} entering HALF_OPEN state`);
      this.state = 'HALF_OPEN';
      this.halfOpenAttempts = 0;
    }
  }

  getStatus() {
    return {
      name: this.name,
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime
        ? new Date(this.lastFailureTime).toISOString()
        : null
    };
  }

  // Force reset (for testing or manual intervention)
  reset() {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.halfOpenAttempts = 0;
  }
}

// Circuit breakers for different services
export const circuitBreakers = {
  weather: new CircuitBreaker('Weather API', {
    failureThreshold: 3,
    resetTimeout: 20000
  }),
  
  gfw: new CircuitBreaker('GFW API', {
    failureThreshold: 5,
    resetTimeout: 30000
  }),
  
  copernicus: new CircuitBreaker('Copernicus WMTS', {
    failureThreshold: 10,
    resetTimeout: 60000
  }),
  
  supabase: new CircuitBreaker('Supabase', {
    failureThreshold: 5,
    resetTimeout: 15000
  })
};

// Helper function for easy use
export async function withCircuitBreaker<T>(
  serviceName: keyof typeof circuitBreakers,
  operation: () => Promise<T>,
  fallback?: () => T
): Promise<T> {
  const breaker = circuitBreakers[serviceName];
  if (!breaker) {
    throw new Error(`Unknown service: ${serviceName}`);
  }
  return breaker.execute(operation, fallback);
}
