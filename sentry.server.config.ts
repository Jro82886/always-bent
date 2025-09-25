import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN || '',
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
  
  // Filtering
  beforeSend(event, hint) {
    // Filter out known non-issues
    if (event.exception) {
      const error = hint.originalException as Error;
      
      // Ignore expected errors
      if (error?.message?.includes('NEXT_NOT_FOUND')) {
        return null;
      }
    }
    
    return event;
  },
  
  // User context
  initialScope: {
    tags: {
      component: 'server',
    },
  },
});
