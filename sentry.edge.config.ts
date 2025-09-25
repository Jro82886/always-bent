import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN || '',
  
  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Release tracking  
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
  
  // User context
  initialScope: {
    tags: {
      component: 'edge',
    },
  },
});
