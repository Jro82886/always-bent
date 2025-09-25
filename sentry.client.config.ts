import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN || '',
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release tracking
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
  
  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Filtering
  beforeSend(event, hint) {
    // Filter out known non-issues
    if (event.exception) {
      const error = hint.originalException;
      
      // Ignore network errors that are expected
      if (error?.message?.includes('NetworkError')) {
        return null;
      }
      
      // Ignore user cancellations
      if (error?.message?.includes('AbortError')) {
        return null;
      }
    }
    
    return event;
  },
  
  // User context
  initialScope: {
    tags: {
      component: 'client',
    },
  },
});
