'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorId: string;
}

export default class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9)
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.context ? ` - ${this.props.context}` : ''}]`, error, errorInfo);
    
    // Log to console for debugging
    console.group('🚨 App Error Boundary Triggered');
    console.error('Error:', error);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Context:', this.props.context || 'Unknown');
    console.groupEnd();
  }

  handleReload = () => {
    // Try to recover by resetting state
    this.setState({ hasError: false, error: undefined });
    
    // If we're in a specific context, try to clear related storage
    if (this.props.context) {
      try {
        if (this.props.context.includes('chat') || this.props.context.includes('community')) {
          // Clear chat-related storage
          localStorage.removeItem('abfi_chat_state');
        }
        if (this.props.context.includes('analysis')) {
          // Clear analysis-related storage
          localStorage.removeItem('abfi_analysis_state');
        }
      } catch (e) {
        console.warn('Error clearing localStorage:', e);
      }
    }
  };

  handleFullReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-[400px] bg-slate-950 rounded-xl border border-red-500/20">
          <div className="text-center space-y-4 p-8 max-w-md">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
            <h3 className="text-lg font-semibold text-white">
              Something went wrong
            </h3>
            <p className="text-sm text-slate-400">
              {this.props.context ? `${this.props.context} ` : ''}
              encountered an error. Don't worry - your data is safe.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-300 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
              >
                <RefreshCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleFullReload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors text-sm"
              >
                Reload Page
              </button>
            </div>
            <details className="text-left mt-4">
              <summary className="text-xs text-slate-500 cursor-pointer">
                Error Details ({this.state.errorId})
              </summary>
              <pre className="text-xs text-red-400 mt-2 p-2 bg-black/50 rounded overflow-auto max-h-32">
                {this.state.error?.message || 'Unknown error'}
                {'\n'}
                {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
