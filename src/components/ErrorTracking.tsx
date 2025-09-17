'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Declare gtag for TypeScript
declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
  }
}

// Simple error tracking (replace with Sentry in production)
class ErrorTracker {
  private errors: Array<{
    message: string;
    stack?: string;
    timestamp: string;
    url: string;
    userAgent: string;
  }> = [];

  logError(error: Error, errorInfo?: any) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...errorInfo
    };

    this.errors.push(errorData);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to logging endpoint
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      }).catch(() => {
        // Silently fail if error reporting fails
      });
    } else {
      console.error('Error tracked:', errorData);
    }

    // Keep only last 50 errors in memory
    if (this.errors.length > 50) {
      this.errors.shift();
    }
  }

  getErrors() {
    return this.errors;
  }
}

export const errorTracker = new ErrorTracker();

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracker.logError(new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.logError(new Error(`Unhandled Promise: ${event.reason}`));
  });
}

// Analytics tracking component
export default function ErrorTracking() {
  const pathname = usePathname();

  useEffect(() => {
    // Track page views (replace with real analytics in production)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: pathname,
      });
    }

    // Simple analytics for now
    const analyticsData = {
      event: 'page_view',
      path: pathname,
      timestamp: new Date().toISOString(),
      referrer: document.referrer,
      screen: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent
    };

    // Log to console in dev, send to analytics in production
    if (process.env.NODE_ENV === 'production') {
      // Send to analytics endpoint
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyticsData)
      }).catch(() => {});
    } else {
      console.log('Analytics:', analyticsData);
    }
  }, [pathname]);

  return null;
}
