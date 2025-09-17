'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }

    // Increment error count
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to error tracking service (if configured)
    try {
      // Could integrate with Sentry, LogRocket, etc.
      console.error('Error logged:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // Even error logging failed - ultimate fallback
      console.error('Failed to log error:', e);
    }
  }

  handleReset = () => {
    // Reset after max 3 attempts to prevent infinite loops
    if (this.state.errorCount < 3) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null
      });
    } else {
      // Too many errors - need page refresh
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return <>{this.props.fallback}</>;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-500" size={24} />
              <h2 className="text-lg font-semibold text-red-100">
                Something went wrong
              </h2>
            </div>
            
            <p className="text-sm text-gray-300 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {process.env.NODE_ENV === 'development' && (
              <details className="mb-4">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs text-gray-400 overflow-auto max-h-32 p-2 bg-black/30 rounded">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 
                         border border-blue-500/50 rounded-lg text-sm text-blue-100 transition-colors"
                disabled={this.state.errorCount >= 3}
              >
                <RefreshCw size={16} />
                Try Again
                {this.state.errorCount > 0 && (
                  <span className="text-xs text-gray-400">
                    ({3 - this.state.errorCount} left)
                  </span>
                )}
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 
                         border border-gray-500/50 rounded-lg text-sm text-gray-100 transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrap specific components that might fail
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
}
