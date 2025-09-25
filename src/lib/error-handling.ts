import * as Sentry from '@sentry/nextjs';

// Custom error types
export class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public fields?: string[]) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Error handler with Sentry integration
export function handleError(error: unknown, context?: Record<string, any>): void {
  // Convert unknown to Error
  const err = error instanceof Error ? error : new Error(String(error));
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
    if (context) console.error('Context:', context);
  }
  
  // Send to Sentry with context
  Sentry.withScope((scope) => {
    if (context) {
      scope.setContext('error_context', context);
    }
    
    // Add error classification
    if (err instanceof NetworkError) {
      scope.setTag('error_type', 'network');
      scope.setLevel('warning');
    } else if (err instanceof ValidationError) {
      scope.setTag('error_type', 'validation');
      scope.setLevel('info');
    } else if (err instanceof AuthError) {
      scope.setTag('error_type', 'auth');
      scope.setLevel('error');
    }
    
    Sentry.captureException(err);
  });
}

// Async error wrapper
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleError(error, context);
    return null;
  }
}

// React component error boundary helper
export function logComponentError(error: Error, errorInfo: React.ErrorInfo): void {
  Sentry.withScope((scope) => {
    scope.setContext('component_stack', {
      componentStack: errorInfo.componentStack
    });
    scope.setLevel('error');
    Sentry.captureException(error);
  });
}
