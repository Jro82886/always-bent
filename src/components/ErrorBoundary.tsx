'use client';

import React, { Component, ReactNode } from 'react';
import { safeLocal } from '@/lib/safeLocal';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state to show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to your error reporting service
    console.error('Welcome page error caught by boundary:', error, errorInfo);
    
    // You can also log to your error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  handleGoHome = () => {
    // Clear any problematic localStorage data
    try {
      safeLocal.remove('abfi_setup_complete');
      safeLocal.remove('abfi_welcome_completed');
      safeLocal.remove('abfi_tutorial_completed');
      safeLocal.remove('abfi_has_seen_tutorial');
    } catch (e) {
      // Ignore localStorage errors
    }
    
    // Navigate to home page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#070B14] via-[#0B1220] to-[#0B1E2A] flex items-center justify-center px-4">
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.3)] max-w-md w-full mx-4 p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-slate-400">
                We encountered an error while loading the welcome page. This might be due to a temporary issue.
              </p>
            </div>

            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm font-mono text-red-300 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg border border-cyan-500/30
                         hover:bg-cyan-500/30 transition-colors duration-200"
              >
                Try Again
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full px-4 py-2 border border-slate-500/30 text-slate-300 rounded-lg
                         hover:bg-slate-800/50 transition-colors duration-200"
              >
                Clear Data & Restart
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-6">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}